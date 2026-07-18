"use client";

// Thin wrapper so the standalone /market-maker demo route and any hotspot
// dispatch can mount the same finale UI. Campaign win wiring lives in
// MarketMakerFinale (setStatus("won") on a correct guess).

import { MarketMakerFinale } from "@/components/puzzles/MarketMakerFinale";
import type { PuzzleDefinition } from "@/lib/types";

export function MarketMakerPuzzle({
  puzzle: _puzzle,
  onClose,
}: {
  puzzle: PuzzleDefinition;
  onClose?: () => void;
}) {
  return <MarketMakerFinale onClose={onClose ?? (() => undefined)} />;
}
