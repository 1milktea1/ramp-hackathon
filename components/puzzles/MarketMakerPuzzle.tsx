"use client";

// NYC QUANT FINALE — Market Maker dice game.
//
// The player quotes two-sided markets on the SUM and PRODUCT of 3 hidden dice
// (two d6, one d10) across 3 timed rounds. The game master (engine) answers each
// market with Buy / Sell / Hold. The player reads the feedback, then gets ONE
// guess at the roll — a wrong guess loses the game.
//
// SEAM — UI teammate: chrome lives in quantUi.tsx (shared with Bayesian Ticker
// and Arb Rush). Do NOT move correctness out of the engine.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "@/lib/store";
import { emit } from "@/lib/events";
import { validate } from "@/lib/validators";
import "@/lib/validators.answers";
import {
  endSession,
  evaluateMarket,
  getSession,
  isValidQuote,
  startSession,
  type MarketResponse,
  type Quantity,
  type Roll,
} from "@/lib/market-game";
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

const TOTAL_ROUNDS = 3;
const ROUND_SECONDS = 60;

type RoundResult = {
  round: number;
  quantity: Quantity;
  bid: number;
  ask: number;
  response: MarketResponse | "timeout";
};

const RESPONSE_LABEL: Record<MarketResponse | "timeout", string> = {
  buy: "BUY — I lift your ask (value is above your ask)",
  sell: "SELL — I hit your bid (value is below your bid)",
  hold: "HOLD — no trade (value is inside your market)",
  timeout: "TIMED OUT — no market submitted this round",
};

function toInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isInteger(n) ? n : null;
}

export function MarketMakerPuzzle({ puzzle }: { puzzle: PuzzleDefinition }) {
  const completePuzzle = useGameStore((s) => s.completePuzzle);
  const setStatus = useGameStore((s) => s.setStatus);
  const solved = useGameStore((s) => s.completedPuzzleIds.includes(puzzle.id));

  const [round, setRound] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [phase, setPhase] = useState<"markets" | "guess" | "lost">("markets");
  const [error, setError] = useState<string | null>(null);
  const [guessError, setGuessError] = useState<string | null>(null);
  const [lostRoll, setLostRoll] = useState<Roll | null>(null);

  const [sumBid, setSumBid] = useState("");
  const [sumAsk, setSumAsk] = useState("");
  const [prodBid, setProdBid] = useState("");
  const [prodAsk, setProdAsk] = useState("");

  const [guessD6a, setGuessD6a] = useState("");
  const [guessD6b, setGuessD6b] = useState("");
  const [guessD10, setGuessD10] = useState("");

  useEffect(() => {
    startSession();
    return () => endSession();
  }, []);

  const goToGuess = useCallback(() => {
    setPhase("guess");
    setError(null);
  }, []);

  const advanceRound = useCallback(() => {
    setRound((r) => {
      if (r >= TOTAL_ROUNDS) {
        goToGuess();
        return r;
      }
      setSecondsLeft(ROUND_SECONDS);
      return r + 1;
    });
  }, [goToGuess]);

  const forfeitRound = useCallback(() => {
    setHistory((h) => [
      ...h,
      { round, quantity: "sum", bid: 0, ask: 0, response: "timeout" },
    ]);
    emit("wrong_attempt", { puzzleId: puzzle.id, reason: "round_timeout" });
    advanceRound();
  }, [round, puzzle.id, advanceRound]);

  const forfeitRef = useRef(forfeitRound);
  useEffect(() => {
    forfeitRef.current = forfeitRound;
  }, [forfeitRound]);

  useEffect(() => {
    if (phase !== "markets" || solved) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          forfeitRef.current();
          return ROUND_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, round, solved]);

  function submitMarkets() {
    const sB = toInt(sumBid);
    const sA = toInt(sumAsk);
    const pB = toInt(prodBid);
    const pA = toInt(prodAsk);

    if (sB === null || sA === null || pB === null || pA === null) {
      setError("Enter whole-number bid and ask for both markets.");
      return;
    }
    const sumQuote = { bid: sB, ask: sA };
    const prodQuote = { bid: pB, ask: pA };
    if (!isValidQuote(sumQuote) || !isValidQuote(prodQuote)) {
      setError("Each market needs bid <= ask.");
      return;
    }

    const roll = sessionRollOrThrow();
    const sumResponse = evaluateMarket("sum", sumQuote, roll);
    const prodResponse = evaluateMarket("product", prodQuote, roll);

    setHistory((h) => [
      ...h,
      { round, quantity: "sum", bid: sB, ask: sA, response: sumResponse },
      { round, quantity: "product", bid: pB, ask: pA, response: prodResponse },
    ]);
    emit("answer_submit", { puzzleId: puzzle.id, kind: "market", round });

    setError(null);
    setSumBid("");
    setSumAsk("");
    setProdBid("");
    setProdAsk("");
    advanceRound();
  }

  function submitGuess() {
    const d6a = toInt(guessD6a);
    const d6b = toInt(guessD6b);
    const d10 = toInt(guessD10);
    if (d6a === null || d6b === null || d10 === null) {
      setGuessError("Enter all three die values.");
      return;
    }
    if (d6a < 1 || d6a > 6 || d6b < 1 || d6b > 6 || d10 < 1 || d10 > 10) {
      setGuessError("Each d6 is 1-6 and the d10 is 1-10.");
      return;
    }

    emit("answer_submit", { puzzleId: puzzle.id, kind: "guess" });
    if (validate(puzzle.validatorKey, { d6a, d6b, d10 })) {
      completePuzzle(puzzle.id);
      emit("puzzle_complete", { puzzleId: puzzle.id });
      endSession();
    } else {
      setLostRoll(getSession());
      emit("wrong_attempt", { puzzleId: puzzle.id });
      setGuessError(null);
      setPhase("lost");
      setStatus("lost");
      endSession();
    }
  }

  const canSubmitMarkets = useMemo(
    () =>
      [sumBid, sumAsk, prodBid, prodAsk].every((v) => toInt(v) !== null),
    [sumBid, sumAsk, prodBid, prodAsk]
  );

  if (solved) {
    return (
      <QuantWin>
        Market cleared — you read the book correctly. The exchange reopens.
      </QuantWin>
    );
  }

  if (phase === "lost") {
    return (
      <QuantLose
        detail={
          lostRoll
            ? `The roll was d6=${lostRoll.d6a} · d6=${lostRoll.d6b} · d10=${lostRoll.d10}.`
            : undefined
        }
      >
        Wrong call — the exchange stays locked. You only get one guess.
      </QuantLose>
    );
  }

  return (
    <QuantCard>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            {puzzle.category} · market maker
          </span>
          <p className="text-sm text-zinc-200">{puzzle.prompt}</p>
        </div>
        {phase === "markets" && (
          <QuantTimer
            secondsLeft={secondsLeft}
            label={`round ${round}/${TOTAL_ROUNDS}`}
          />
        )}
      </div>

      {phase === "markets" && (
        <div className="flex flex-col gap-4">
          <QuantHint>
            Quote a two-sided market on the sum and the product of the dice. I
            buy if your ask is too low, sell if your bid is too high, and hold if
            my value sits inside your market.
          </QuantHint>

          <QuantMarketInputs
            label="Sum market (dice range 3-22)"
            bid={sumBid}
            ask={sumAsk}
            onBid={setSumBid}
            onAsk={setSumAsk}
          />
          <QuantMarketInputs
            label="Product market (dice range 1-360)"
            bid={prodBid}
            ask={prodAsk}
            onBid={setProdBid}
            onAsk={setProdAsk}
          />

          {error && <QuantError>{error}</QuantError>}

          <div className="flex items-center gap-3">
            <QuantPrimaryButton
              onClick={submitMarkets}
              disabled={!canSubmitMarkets}
            >
              Submit markets
            </QuantPrimaryButton>
            <QuantSecondaryButton onClick={goToGuess}>
              Lock in dice
            </QuantSecondaryButton>
          </div>
        </div>
      )}

      {phase === "guess" && (
        <div className="flex flex-col gap-3">
          <QuantHint>
            Name the roll. Each d6 is 1-6; the d10 is 1-10. The two d6s can be in
            any order.
          </QuantHint>
          <QuantWarn>You get one guess. A wrong answer loses the game.</QuantWarn>
          <div className="flex flex-wrap gap-3">
            <QuantGuessInput label="d6" value={guessD6a} onChange={setGuessD6a} />
            <QuantGuessInput label="d6" value={guessD6b} onChange={setGuessD6b} />
            <QuantGuessInput label="d10" value={guessD10} onChange={setGuessD10} />
          </div>
          {guessError && <QuantError>{guessError}</QuantError>}
          <div className="flex items-center gap-3">
            <QuantPrimaryButton onClick={submitGuess}>
              Submit final guess
            </QuantPrimaryButton>
            {round <= TOTAL_ROUNDS && history.length > 0 && (
              <span className="text-xs text-zinc-600">
                {TOTAL_ROUNDS - Math.min(round, TOTAL_ROUNDS)} round(s) of markets
                left unused
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
              <span className="uppercase text-zinc-500">{h.quantity}</span>{" "}
              {h.response !== "timeout" && (
                <span className="font-mono text-zinc-500">
                  [{h.bid}, {h.ask}]
                </span>
              )}{" "}
              → <span className="text-zinc-200">{RESPONSE_LABEL[h.response]}</span>
            </QuantHistoryRow>
          ))}
        </QuantHistory>
      )}
    </QuantCard>
  );
}

function sessionRollOrThrow(): Roll {
  const roll = getSession();
  if (!roll) throw new Error("Market game session missing");
  return roll;
}
