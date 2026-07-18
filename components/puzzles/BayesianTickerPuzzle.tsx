"use client";

// NYC QUANT — Bayesian Ticker (posterior updating).
//
// A hidden card (2-10) sets an asset's true value at card * 10. Each of 3 rounds
// the game master releases one news wire that narrows the card. After each wire
// the player re-quotes a two-sided market that must CONTAIN the true value, with
// a tightening max width (round 1 <= 40, round 2 <= 20, round 3 <= 10). A wrong
// quote widens the next round's requirement (the penalty). Finally the player
// submits the exact card — one guess; a wrong answer loses.
//
// SEAM — UI teammate: chrome matches MarketMakerPuzzle via quantUi. Restyle
// freely. Do NOT move correctness out of the engine.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/lib/store";
import { emit } from "@/lib/events";
import { validate } from "@/lib/validators";
import "@/lib/validators.answers";
import {
  BASE_WIDTHS,
  TOTAL_ROUNDS,
  WRONG_QUOTE_PENALTY,
  checkQuote,
  endTickerSession,
  getTickerSession,
  maxWidthForRound,
  startTickerSession,
} from "@/lib/bayesian-ticker";
import type { PuzzleDefinition } from "@/lib/types";
import {
  QuantCard,
  QuantError,
  QuantGuessInput,
  QuantHint,
  QuantHistory,
  QuantHistoryRow,
  QuantLose,
  QuantMarketInputs,
  QuantPrimaryButton,
  QuantSecondaryButton,
  QuantTimer,
  QuantWarn,
  QuantWin,
} from "@/components/puzzles/quantUi";

const ROUND_SECONDS = 60;

type RoundResult = {
  round: number;
  wire: string;
  bid: number;
  ask: number;
  maxWidth: number;
  outcome: "ok" | "miss-contain" | "miss-width" | "miss-both" | "timeout";
};

function toInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isInteger(n) ? n : null;
}

function outcomeLabel(o: RoundResult["outcome"]): string {
  switch (o) {
    case "ok":
      return "ACCEPTED — market contained the value within the width";
    case "miss-contain":
      return "REJECTED — the true value was outside your market";
    case "miss-width":
      return "REJECTED — your market was wider than allowed";
    case "miss-both":
      return "REJECTED — too wide and it missed the value";
    case "timeout":
      return "TIMED OUT — no market submitted this round";
  }
}

export function BayesianTickerPuzzle({ puzzle }: { puzzle: PuzzleDefinition }) {
  const completePuzzle = useGameStore((s) => s.completePuzzle);
  const setStatus = useGameStore((s) => s.setStatus);
  const solved = useGameStore((s) => s.completedPuzzleIds.includes(puzzle.id));

  const [wires, setWires] = useState<string[]>([]);
  const [round, setRound] = useState(1);
  const [penaltyPoints, setPenaltyPoints] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [phase, setPhase] = useState<"quote" | "guess" | "lost">("quote");
  const [error, setError] = useState<string | null>(null);
  const [guessError, setGuessError] = useState<string | null>(null);
  const [lostCard, setLostCard] = useState<number | null>(null);

  const [bid, setBid] = useState("");
  const [ask, setAsk] = useState("");
  const [cardGuess, setCardGuess] = useState("");

  useEffect(() => {
    const session = startTickerSession();
    setWires(session.wires);
    return () => endTickerSession();
  }, []);

  const maxWidth = maxWidthForRound(round, penaltyPoints);

  const goToGuess = useCallback(() => {
    setPhase("guess");
    setError(null);
  }, []);

  const advance = useCallback(() => {
    setBid("");
    setAsk("");
    setError(null);
    setRound((r) => {
      if (r >= TOTAL_ROUNDS) {
        goToGuess();
        return r;
      }
      setSecondsLeft(ROUND_SECONDS);
      return r + 1;
    });
  }, [goToGuess]);

  const recordAndAdvance = useCallback(
    (result: RoundResult, passed: boolean) => {
      setHistory((h) => [...h, result]);
      if (passed) {
        emit("answer_submit", {
          puzzleId: puzzle.id,
          kind: "quote",
          round: result.round,
        });
      } else {
        emit("wrong_attempt", { puzzleId: puzzle.id, round: result.round });
        setPenaltyPoints((p) => p + WRONG_QUOTE_PENALTY);
      }
      advance();
    },
    [puzzle.id, advance]
  );

  const timeout = useCallback(() => {
    recordAndAdvance(
      {
        round,
        wire: wires[round - 1] ?? "",
        bid: 0,
        ask: 0,
        maxWidth: maxWidthForRound(round, penaltyPoints),
        outcome: "timeout",
      },
      false
    );
  }, [round, wires, penaltyPoints, recordAndAdvance]);

  const timeoutRef = useRef(timeout);
  useEffect(() => {
    timeoutRef.current = timeout;
  }, [timeout]);

  useEffect(() => {
    if (phase !== "quote" || solved) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          timeoutRef.current();
          return ROUND_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, round, solved]);

  function submitQuote() {
    const b = toInt(bid);
    const a = toInt(ask);
    if (b === null || a === null) {
      setError("Enter a whole-number bid and ask.");
      return;
    }
    if (a < b) {
      setError("Ask must be greater than or equal to bid.");
      return;
    }

    const session = getTickerSession();
    if (!session) throw new Error("Ticker session missing");

    const mw = maxWidthForRound(round, penaltyPoints);
    const passed = validate("ny-ticker-quote", { bid: b, ask: a, maxWidth: mw });
    const detail = checkQuote(session.card, { bid: b, ask: a }, mw);
    const outcome: RoundResult["outcome"] = passed
      ? "ok"
      : !detail.contained && !detail.withinWidth
        ? "miss-both"
        : !detail.contained
          ? "miss-contain"
          : "miss-width";

    recordAndAdvance(
      {
        round,
        wire: wires[round - 1] ?? "",
        bid: b,
        ask: a,
        maxWidth: mw,
        outcome,
      },
      passed
    );
  }

  function submitCard() {
    const g = toInt(cardGuess);
    if (g === null) {
      setGuessError("Enter the card value.");
      return;
    }

    emit("answer_submit", { puzzleId: puzzle.id, kind: "card" });
    if (validate("ny-ticker-card", g)) {
      completePuzzle(puzzle.id);
      emit("puzzle_complete", { puzzleId: puzzle.id });
      endTickerSession();
    } else {
      setLostCard(getTickerSession()?.card ?? null);
      emit("wrong_attempt", { puzzleId: puzzle.id });
      setGuessError(null);
      setPhase("lost");
      setStatus("lost");
      endTickerSession();
    }
  }

  const canSubmitQuote = useMemo(
    () => toInt(bid) !== null && toInt(ask) !== null,
    [bid, ask]
  );

  const liveWidth = (() => {
    const b = toInt(bid);
    const a = toInt(ask);
    return b !== null && a !== null ? a - b : null;
  })();

  if (solved) {
    return (
      <QuantWin>Priced to the tick — the ticker unlocks. You called the card.</QuantWin>
    );
  }

  if (phase === "lost") {
    return (
      <QuantLose
        detail={
          lostCard != null
            ? `The card was ${lostCard} (true value ${lostCard * 10}).`
            : undefined
        }
      >
        Wrong card — the ticker halts. You only get one call.
      </QuantLose>
    );
  }

  return (
    <QuantCard>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            {puzzle.category} · bayesian ticker
          </span>
          <p className="text-sm text-zinc-200">{puzzle.prompt}</p>
        </div>
        {phase === "quote" && (
          <QuantTimer
            secondsLeft={secondsLeft}
            label={`round ${round}/${TOTAL_ROUNDS}`}
          />
        )}
      </div>

      {phase === "quote" && (
        <div className="flex flex-col gap-4">
          <QuantHint>
            Re-quote a two-sided market that contains the asset&apos;s true value
            (card × 10). I accept only if the value sits inside your market and
            your width is within the round limit.
          </QuantHint>

          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              News wire {round}
            </span>
            <p className="text-sm text-zinc-100">{wires[round - 1] ?? "…"}</p>
          </div>

          <QuantMarketInputs
            label={`Value market (width ≤ ${maxWidth}${
              penaltyPoints > 0
                ? ` · base ${BASE_WIDTHS[round - 1]} + ${penaltyPoints} penalty`
                : ""
            })`}
            bid={bid}
            ask={ask}
            onBid={setBid}
            onAsk={setAsk}
            trailing={
              <span className="ml-2 font-mono text-xs text-zinc-500">
                width {liveWidth ?? "—"}
              </span>
            }
          />

          {error && <QuantError>{error}</QuantError>}

          <div className="flex items-center gap-3">
            <QuantPrimaryButton onClick={submitQuote} disabled={!canSubmitQuote}>
              Submit market
            </QuantPrimaryButton>
            <QuantSecondaryButton onClick={goToGuess}>
              Lock in card
            </QuantSecondaryButton>
          </div>
        </div>
      )}

      {phase === "guess" && (
        <div className="flex flex-col gap-3">
          <QuantHint>Wires exhausted. Call the exact card (2–10).</QuantHint>
          <QuantWarn>You get one guess. A wrong answer loses the game.</QuantWarn>
          <div className="flex flex-wrap gap-3">
            <QuantGuessInput
              label="card"
              value={cardGuess}
              onChange={setCardGuess}
            />
          </div>
          {guessError && <QuantError>{guessError}</QuantError>}
          <div className="flex items-center gap-3">
            <QuantPrimaryButton onClick={submitCard}>
              Submit final guess
            </QuantPrimaryButton>
            {round <= TOTAL_ROUNDS && history.length > 0 && (
              <span className="text-xs text-zinc-600">
                {TOTAL_ROUNDS - Math.min(round, TOTAL_ROUNDS)} round(s) of
                markets left unused
              </span>
            )}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <QuantHistory>
          {history.map((h, i) => (
            <QuantHistoryRow key={i}>
              <span className="text-zinc-600">R{h.round}</span>{" "}
              <span className="uppercase text-zinc-500">wire</span>{" "}
              {h.outcome !== "timeout" && (
                <span className="font-mono text-zinc-500">
                  [{h.bid}, {h.ask}]
                </span>
              )}{" "}
              →{" "}
              <span className="text-zinc-200">{outcomeLabel(h.outcome)}</span>
            </QuantHistoryRow>
          ))}
        </QuantHistory>
      )}
    </QuantCard>
  );
}
