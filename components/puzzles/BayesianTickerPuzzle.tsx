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
// SEAM — UI teammate: this is logic-complete but visually plain. Restyle freely.
// Do NOT move correctness out of the engine: quotes go through
// validate("ny-ticker-quote", ...) and the final card through
// validate("ny-ticker-card", ...). Keep those calls intact.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/lib/store";
import { emit } from "@/lib/events";
import { validate } from "@/lib/validators";
// Side-effect import: registers the ticker validators wherever this is mounted.
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
      return "TIMED OUT — no market submitted";
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

  // Draw the hidden card + wires once on mount; clear on unmount.
  useEffect(() => {
    const session = startTickerSession();
    setWires(session.wires);
    return () => endTickerSession();
  }, []);

  const maxWidth = maxWidthForRound(round, penaltyPoints);

  const advance = useCallback(() => {
    setBid("");
    setAsk("");
    setError(null);
    setRound((r) => {
      if (r >= TOTAL_ROUNDS) {
        setPhase("guess");
        return r;
      }
      setSecondsLeft(ROUND_SECONDS);
      return r + 1;
    });
  }, []);

  const recordAndAdvance = useCallback(
    (result: RoundResult, passed: boolean) => {
      setHistory((h) => [...h, result]);
      if (passed) {
        emit("answer_submit", { puzzleId: puzzle.id, kind: "quote", round: result.round });
      } else {
        emit("wrong_attempt", { puzzleId: puzzle.id, round: result.round });
        // Penalty: widen the next round's requirement.
        setPenaltyPoints((p) => p + WRONG_QUOTE_PENALTY);
      }
      advance();
    },
    [puzzle.id, advance]
  );

  const timeout = useCallback(() => {
    const session = getTickerSession();
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
    // Reference so lint doesn't flag session; kept for clarity of intent.
    void session;
  }, [round, wires, penaltyPoints, recordAndAdvance]);

  const timeoutRef = useRef(timeout);
  useEffect(() => {
    timeoutRef.current = timeout;
  }, [timeout]);

  // Per-round countdown; runs only during the quote phase.
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
    // Deterministic engine gate.
    const passed = validate("ny-ticker-quote", { bid: b, ask: a, maxWidth: mw });
    // Detail for player feedback (still from the engine, not MIRA).
    const detail = checkQuote(session.card, { bid: b, ask: a }, mw);
    const outcome: RoundResult["outcome"] = passed
      ? "ok"
      : !detail.contained && !detail.withinWidth
        ? "miss-both"
        : !detail.contained
          ? "miss-contain"
          : "miss-width";

    recordAndAdvance(
      { round, wire: wires[round - 1] ?? "", bid: b, ask: a, maxWidth: mw, outcome },
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

  if (solved) {
    return (
      <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/20 p-4">
        <p className="text-sm font-medium text-emerald-400">
          Priced to the tick — the ticker unlocks. You called the card.
        </p>
      </div>
    );
  }

  if (phase === "lost") {
    return (
      <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-4">
        <p className="text-sm font-medium text-red-400">
          Wrong card — the ticker halts. You only get one call.
        </p>
        {lostCard != null && (
          <p className="mt-2 font-mono text-xs text-zinc-500">
            The card was {lostCard} (true value {lostCard * 10}).
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            {puzzle.category} · bayesian ticker
          </span>
          <p className="text-sm text-zinc-200">{puzzle.prompt}</p>
        </div>
        {phase === "quote" && (
          <span
            className={`shrink-0 font-mono text-xs ${
              secondsLeft <= 10 ? "text-red-400" : "text-zinc-400"
            }`}
          >
            {secondsLeft}s · round {round}/{TOTAL_ROUNDS}
          </span>
        )}
      </div>

      {phase === "quote" && (
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-sky-900/50 bg-sky-950/20 px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-sky-400">
              News wire {round}
            </span>
            <p className="mt-1 text-sm text-zinc-100">
              {wires[round - 1] ?? "…"}
            </p>
          </div>

          <p className="text-xs text-zinc-500">
            Re-quote a two-sided market that contains the asset&apos;s true value
            (card x 10). This round your width must be{" "}
            <span className="text-zinc-300">&le; {maxWidth}</span>
            {penaltyPoints > 0 && (
              <span className="text-amber-400">
                {" "}
                (base {BASE_WIDTHS[round - 1]} + {penaltyPoints} penalty)
              </span>
            )}
            .
          </p>

          <div className="flex items-center gap-2">
            <NumberField placeholder="bid" value={bid} onChange={setBid} />
            <span className="text-zinc-600">@</span>
            <NumberField placeholder="ask" value={ask} onChange={setAsk} />
            <span className="ml-2 font-mono text-xs text-zinc-500">
              width {(() => {
                const b = toInt(bid);
                const a = toInt(ask);
                return b !== null && a !== null ? a - b : "-";
              })()}
            </span>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div>
            <button
              className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              onClick={submitQuote}
              disabled={!canSubmitQuote}
            >
              Submit market
            </button>
          </div>
        </div>
      )}

      {phase === "guess" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-500">
            Wires exhausted. Call the exact card (2-10).
          </p>
          <p className="text-xs font-medium text-amber-400">
            You get one guess. A wrong answer loses the game.
          </p>
          <div className="flex items-center gap-3">
            <NumberField placeholder="card" value={cardGuess} onChange={setCardGuess} />
            <button
              className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
              onClick={submitCard}
            >
              Call the card
            </button>
          </div>
          {guessError && <p className="text-xs text-red-400">{guessError}</p>}
        </div>
      )}

      {history.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-zinc-800 pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            Round log
          </span>
          <ul className="flex flex-col gap-1">
            {history.map((h, i) => (
              <li key={i} className="text-xs text-zinc-400">
                <span className="text-zinc-600">R{h.round}</span>{" "}
                {h.outcome !== "timeout" && (
                  <span className="font-mono text-zinc-500">
                    [{h.bid}, {h.ask}] w{h.ask - h.bid}/{h.maxWidth}
                  </span>
                )}{" "}
                →{" "}
                <span
                  className={h.outcome === "ok" ? "text-emerald-400" : "text-red-400"}
                >
                  {outcomeLabel(h.outcome)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function NumberField({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-24 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-zinc-500"
    />
  );
}
