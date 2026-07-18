"use client";

// STANDALONE HANDOFF / DEMO ROUTE for the Bayesian Ticker mini-game.
// Layout matches /market-maker.

import { useState } from "react";
import { BayesianTickerPuzzle } from "@/components/puzzles/BayesianTickerPuzzle";
import {
  QuantDemoPage,
  QuantDevRevealButton,
} from "@/components/puzzles/quantUi";
import { getTickerSession } from "@/lib/bayesian-ticker";
import type { PuzzleDefinition } from "@/lib/types";

const TICKER_PUZZLE: PuzzleDefinition = {
  id: "nyc-bayesian-ticker",
  category: "probability",
  interaction: "numeric",
  prompt:
    "A hidden card (2-10) sets the asset's true value at card × 10. Read each news wire, re-quote a market that contains the value with a tightening width, then call the exact card. One call — get it wrong and the ticker halts.",
  validatorKey: "ny-ticker-card",
  expectedDurationSec: 210,
  hints: {
    level1: "Each wire rules out cards. Track which of 2-10 are still possible.",
    level2: "Your market must straddle card × 10. Center it on the surviving cards.",
    level3:
      "As the width tightens, only quotes centered near the real value can still contain it.",
    level4:
      "Intersect the wires to a single card, then quote [value-w, value+w] around card × 10 and call that card.",
  },
};

export default function BayesianTickerDemoPage() {
  const [revealed, setRevealed] = useState(false);
  const session = getTickerSession();

  return (
    <QuantDemoPage
      title="Bayesian Ticker"
      footer={
        <>
          <QuantDevRevealButton
            revealed={revealed}
            onToggle={() => setRevealed((v) => !v)}
            hideLabel="Hide answer (dev)"
            showLabel="Reveal answer (dev)"
          />
          {revealed && (
            <span className="font-mono text-xs text-zinc-500">
              {session
                ? `card=${session.card} · value=${session.card * 10}`
                : "no active session"}
            </span>
          )}
        </>
      }
    >
      <BayesianTickerPuzzle puzzle={TICKER_PUZZLE} />
    </QuantDemoPage>
  );
}
