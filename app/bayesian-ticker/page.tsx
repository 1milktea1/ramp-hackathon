"use client";

// STANDALONE HANDOFF / DEMO ROUTE for the Bayesian Ticker mini-game.
//
// Lets the UI teammate run and restyle the game in isolation, without waiting on
// the shared campaign shell.
//
// CAMPAIGN INTEGRATION (drop-in, once the shell lands):
//   1. Add a puzzle to a New York scene in data/campaigns.ts:
//        {
//          id: "nyc-bayesian-ticker",
//          category: "probability",
//          interaction: "numeric",
//          prompt: TICKER_PROMPT,
//          validatorKey: "ny-ticker-card", // final win condition
//          expectedDurationSec: 210,
//          hints: { level1, level2, level3, level4 },
//        }
//      and list its id in that scene's requiredPuzzleIds.
//   2. In PuzzlePanel, dispatch by validatorKey:
//        if (puzzle.validatorKey === "ny-ticker-card")
//          return <BayesianTickerPuzzle puzzle={puzzle} />;
//   The validators self-register via BayesianTickerPuzzle's side-effect import.

import { useState } from "react";
import { BayesianTickerPuzzle } from "@/components/puzzles/BayesianTickerPuzzle";
import { getTickerSession } from "@/lib/bayesian-ticker";
import type { PuzzleDefinition } from "@/lib/types";

const TICKER_PUZZLE: PuzzleDefinition = {
  id: "nyc-bayesian-ticker",
  category: "probability",
  interaction: "numeric",
  prompt:
    "A hidden card (2-10) sets the asset's true value at card x 10. Read each news wire, re-quote a market that contains the value with a tightening width, then call the exact card. One call — get it wrong and the ticker halts.",
  validatorKey: "ny-ticker-card",
  expectedDurationSec: 210,
  hints: {
    level1: "Each wire rules out cards. Track which of 2-10 are still possible.",
    level2: "Your market must straddle card x 10. Center it on the surviving cards.",
    level3:
      "As the width tightens, only quotes centered near the real value can still contain it.",
    level4:
      "Intersect the wires to a single card, then quote [value-w, value+w] around card x 10 and call that card.",
  },
};

export default function BayesianTickerDemoPage() {
  const [revealed, setRevealed] = useState(false);
  const session = getTickerSession();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          NYC Quant — reference build
        </p>
        <h1 className="text-xl font-semibold">Bayesian Ticker</h1>
      </header>

      <BayesianTickerPuzzle puzzle={TICKER_PUZZLE} />

      <div className="mt-auto flex items-center gap-3 border-t border-zinc-800 pt-3">
        <button
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900"
          onClick={() => setRevealed((v) => !v)}
        >
          {revealed ? "Hide answer (dev)" : "Reveal answer (dev)"}
        </button>
        {revealed && (
          <span className="font-mono text-xs text-zinc-500">
            {session
              ? `card=${session.card} · value=${session.card * 10}`
              : "no active session"}
          </span>
        )}
      </div>
    </main>
  );
}
