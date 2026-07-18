"use client";

// STANDALONE HANDOFF / DEMO ROUTE for the Market Maker dice finale.
//
// This route lets the UI teammate run and restyle the finale in isolation,
// without waiting on the shared campaign shell (data/campaigns.ts, PuzzlePanel,
// SceneShell) which is still being rebuilt.
//
// CAMPAIGN INTEGRATION (drop-in, once the shell lands):
//   1. Add a finale puzzle to the New York campaign in data/campaigns.ts:
//        {
//          id: "nyc-finale-market",
//          category: "probability",
//          interaction: "numeric",
//          prompt: FINALE_PROMPT,
//          validatorKey: "ny-finale-market",
//          expectedDurationSec: 180,
//          hints: { level1, level2, level3, level4 },
//        }
//      and list "nyc-finale-market" in that scene's requiredPuzzleIds.
//   2. In PuzzlePanel, dispatch by validatorKey:
//        if (puzzle.validatorKey === "ny-finale-market")
//          return <MarketMakerPuzzle puzzle={puzzle} />;
//   The validator self-registers via MarketMakerPuzzle's side-effect import.

import { useState } from "react";
import { MarketMakerPuzzle } from "@/components/puzzles/MarketMakerPuzzle";
import { getSession } from "@/lib/market-game";
import type { PuzzleDefinition } from "@/lib/types";

const FINALE_PUZZLE: PuzzleDefinition = {
  id: "nyc-finale-market",
  category: "probability",
  interaction: "numeric",
  prompt:
    "The exchange is locked. Make markets on the sum and product of the sealed roll (two d6, one d10), read my Buy/Sell/Hold, then name all three dice to reopen trading. You get one guess.",
  validatorKey: "ny-finale-market",
  expectedDurationSec: 180,
  hints: {
    level1: "Buy means my value is above your ask; Sell means it is below your bid.",
    level2: "Quote a tight market (bid = ask). A HOLD there confirms the exact value.",
    level3:
      "Pin the sum first (range 3-22), then the product, then solve for the dice with two dice <= 6.",
    level4:
      "Binary-search each quantity: move your midpoint up on Buy, down on Sell, and lock it when a tight quote holds.",
  },
};

export default function MarketMakerDemoPage() {
  const [revealed, setRevealed] = useState(false);
  const roll = getSession();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          NYC Quant Finale — reference build
        </p>
        <h1 className="text-xl font-semibold">Lower Manhattan Exchange</h1>
      </header>

      <MarketMakerPuzzle puzzle={FINALE_PUZZLE} />

      <div className="mt-auto flex items-center gap-3 border-t border-zinc-800 pt-3">
        <button
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900"
          onClick={() => setRevealed((v) => !v)}
        >
          {revealed ? "Hide roll (dev)" : "Reveal roll (dev)"}
        </button>
        {revealed && (
          <span className="font-mono text-xs text-zinc-500">
            {roll
              ? `d6=${roll.d6a} · d6=${roll.d6b} · d10=${roll.d10}`
              : "no active session"}
          </span>
        )}
      </div>
    </main>
  );
}
