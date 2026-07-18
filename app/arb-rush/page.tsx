"use client";

// STANDALONE HANDOFF / DEMO ROUTE for Arb Rush.
//
// UI teammate: restyle ArbRushGame without touching lib/arb-rush.ts.
//
// CAMPAIGN INTEGRATION:
//   1. Add puzzle to NYC finale scene with validatorKey: "ny-arbrush"
//   2. In PuzzlePanel:
//        if (puzzle.validatorKey === "ny-arbrush")
//          return <ArbRushGame puzzle={puzzle} />;

import { ArbRushGame } from "@/components/puzzles/ArbRushGame";
import type { PuzzleDefinition } from "@/lib/types";

const ARB_RUSH_PUZZLE: PuzzleDefinition = {
  id: "nyc-arb-rush",
  category: "probability",
  interaction: "numeric",
  prompt:
    "Three epochs. Beat RIVAL's bankroll. Every event pays 100 — find the baskets that don't add up, fill them before the sweep, and don't get baited by cheap legs.",
  validatorKey: "ny-arbrush",
  expectedDurationSec: 200,
  hints: {
    level1:
      "The rival isn't guessing. Some of those boards don't add up to a whole dollar.",
    level2:
      "Every event pays out exactly 100. Total the asks across one event's outcomes — under 100, and buying all of them locks in the difference. Over 100 on the bids works the other way.",
    level3:
      "Cheap legs aren't cheap baskets — if an event's asks sum past 100, walk away. Fill the deep medium arbs before the sweep timer.",
    level4:
      "Concede the small high-ROI market to RIVAL. TAKE-ALL-ASKS on the two deeper medium arbs at max size — you'll out-earn the greedy sweep.",
  },
};

export default function ArbRushDemoPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          NYC Quant Finale — reference build
        </p>
        <h1 className="text-xl font-semibold">ARB RUSH</h1>
      </header>
      <ArbRushGame puzzle={ARB_RUSH_PUZZLE} />
    </main>
  );
}
