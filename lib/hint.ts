// CONVICTION METER — shared hint helpers (MIRA, the game master)
//
// Pure, testable logic shared by the API route (app/api/hint/route.ts) and the
// UI (components/game-master/ConvictionMeter.tsx). No React, no fetch, no
// secrets here.
//
// The engine still validates answers (lib/validators.ts). This module only
// advises: it moves a visual "conviction" meter and calibrates hint copy.
// MIRA never unlocks anything and never reveals a final room code (README §12).

import type { PuzzleCategory } from "./types";

/** A single room puzzle, projected into the shape the hint system needs. */
export type HintPuzzleContext = {
  id: string;
  prompt: string;
  category: PuzzleCategory;
  completed: boolean;
  hints: {
    level1: string;
    level2: string;
    level3: string;
    level4: string;
  };
};

/** Body POSTed to /api/hint. Built by the client from the store + campaign data. */
export type HintRequest = {
  campaignTitle: string;
  sceneTitle: string;
  puzzles: HintPuzzleContext[];
  requiredPuzzleIds: string[];
  completedPuzzleIds: string[];
  wrongAttempts: number;
  hintsGiven: number;
  timeRemainingSec: number;
  secondsSinceMeaningfulProgress: number;
  /** Meter value (0-100) before this request. */
  priorConviction: number;
  /** Optional free-text question from the player. */
  playerMessage?: string;
};

/** Response returned by /api/hint and consumed by the meter UI. */
export type HintResponse = {
  /** New meter value (0-100) after this request. */
  conviction: number;
  hint: string;
  hintLevel: 0 | 1 | 2 | 3 | 4;
  focusPuzzleId: string | null;
  /** True when the AI call was skipped/failed and a static hint was used. */
  usedFallback: boolean;
};

/** Clamp a number into the inclusive [0, 100] range. */
export function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/**
 * Advance the conviction meter. The player always gets at least halfway to 100%
 * of the remaining gap; if the model thinks they're further along, use that.
 *   nextConviction(0)   -> ~50
 *   nextConviction(50)  -> ~75
 *   nextConviction(75)  -> ~87.5
 */
export function nextConviction(prev: number, modelEstimate?: number): number {
  const base = clampPct(prev);
  const halfway = base + (100 - base) * 0.5;
  const estimate = modelEstimate === undefined ? -Infinity : clampPct(modelEstimate);
  return clampPct(Math.max(halfway, estimate));
}

/** Map a conviction percentage to a hint strength level (1-4; 0 = none). */
export function convictionToHintLevel(pct: number): 0 | 1 | 2 | 3 | 4 {
  const p = clampPct(pct);
  if (p <= 0) return 0;
  if (p < 45) return 1;
  if (p < 70) return 2;
  if (p < 88) return 3;
  return 4;
}

/** The first required puzzle in the room that the player has not yet solved. */
export function firstUnsolvedRequired(req: HintRequest): HintPuzzleContext | null {
  for (const id of req.requiredPuzzleIds) {
    const puzzle = req.puzzles.find((p) => p.id === id);
    if (puzzle && !req.completedPuzzleIds.includes(id)) return puzzle;
  }
  // Fall back to any unsolved puzzle, then any puzzle at all.
  return (
    req.puzzles.find((p) => !req.completedPuzzleIds.includes(p.id)) ??
    req.puzzles[0] ??
    null
  );
}

const HINT_LEVEL_KEYS = {
  1: "level1",
  2: "level2",
  3: "level3",
  4: "level4",
} as const;

/**
 * Deterministic fallback used when the AI call is unavailable (no key, timeout,
 * error). Advances the meter via halving and pulls the puzzle's pre-authored
 * hint copy at the appropriate level. Never throws.
 */
export function staticFallbackHint(req: HintRequest): HintResponse {
  const conviction = nextConviction(req.priorConviction);
  const level = convictionToHintLevel(conviction);
  const puzzle = firstUnsolvedRequired(req);

  let hint: string;
  if (!puzzle) {
    hint = "Every terminal in this room is solved — move on.";
  } else if (level === 0) {
    hint = "Take another look at what this room is asking for.";
  } else {
    hint = puzzle.hints[HINT_LEVEL_KEYS[level]];
  }

  return {
    conviction,
    hint,
    hintLevel: level,
    focusPuzzleId: puzzle?.id ?? null,
    usedFallback: true,
  };
}
