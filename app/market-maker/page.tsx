"use client";

// STANDALONE HANDOFF / DEMO ROUTE for the Market Maker dice finale.

import { useState } from "react";
import { MarketMakerPuzzle } from "@/components/puzzles/MarketMakerPuzzle";
import {
  QuantDemoPage,
  QuantDevRevealButton,
} from "@/components/puzzles/quantUi";
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
    <QuantDemoPage
      title="Lower Manhattan Exchange"
      footer={
        <>
          <QuantDevRevealButton
            revealed={revealed}
            onToggle={() => setRevealed((v) => !v)}
            hideLabel="Hide roll (dev)"
            showLabel="Reveal roll (dev)"
          />
          {revealed && (
            <span className="font-mono text-xs text-zinc-500">
              {roll
                ? `d6=${roll.d6a} · d6=${roll.d6b} · d10=${roll.d10}`
                : "no active session"}
            </span>
          )}
        </>
      }
    >
      <MarketMakerPuzzle puzzle={FINALE_PUZZLE} />
    </QuantDemoPage>
  );
}
