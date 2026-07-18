// MIRA — adaptive hint engine (README §10–§11, plan.md §7).
//
// STATIC FIRST. Everything here runs locally with no network, so a dead API can
// never block the game. An optional /api/mira wrap may later rewrite tone, but
// it must fall back to these strings on any failure.
//
// MIRA may explain, hint, encourage and direct attention. MIRA may NOT unlock
// scenes, declare answers correct, invent objects, or change codes (§12).

import type { GameMasterResponse, PuzzleDefinition } from "./types";

export type HintLevel = 0 | 1 | 2 | 3 | 4;

export type PressureInputs = {
  secondsSinceMeaningfulProgress: number;
  wrongAttempts: number;
  timeRemainingSec: number;
  totalCampaignSec: number;
  sceneElapsedSec: number;
  expectedSceneDurationSec: number;
  failedInteractionAttempts?: number;
  repeatedIrrelevantActions?: number;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Weighted pressure score, 0–1. Weights are README §11 verbatim. */
export function computePressure(i: PressureInputs): number {
  const inactivity = clamp01(i.secondsSinceMeaningfulProgress / 50);
  const mistakes = clamp01(i.wrongAttempts / 3);
  const time = clamp01(1 - i.timeRemainingSec / Math.max(1, i.totalCampaignSec));
  const scene = clamp01(i.sceneElapsedSec / Math.max(1, i.expectedSceneDurationSec));
  const interaction = clamp01((i.failedInteractionAttempts ?? 0) / 4);
  const confusion = clamp01((i.repeatedIrrelevantActions ?? 0) / 6);

  return (
    inactivity * 0.25 +
    mistakes * 0.22 +
    time * 0.22 +
    scene * 0.15 +
    interaction * 0.1 +
    confusion * 0.06
  );
}

export function hintLevelFromPressure(pressure: number): HintLevel {
  if (pressure < 0.25) return 0;
  if (pressure < 0.45) return 1;
  if (pressure < 0.62) return 2;
  if (pressure < 0.8) return 3;
  return 4;
}

/**
 * Read the player's intent from their own words. Keyword rules only — this
 * runs before (and without) any model call.
 */
export type Intent = "stronger" | "gentler" | "concept" | "interface" | "normal";

export function classifyIntent(message: string): Intent {
  const m = message.toLowerCase();
  if (/just tell me|give me the answer|i give up|tell me the answer/.test(m))
    return "stronger";
  if (/smallest hint|tiny hint|small hint|nudge|don'?t spoil|no spoiler/.test(m))
    return "gentler";
  if (/what is|what'?s an?|explain|how does|why does|mean\b|definition/.test(m))
    return "concept";
  if (/where|how do i (enter|submit|type|click)|can'?t find|button|box|screen/.test(m))
    return "interface";
  return "normal";
}

const ATMOSPHERIC = [
  "The node is unstable, but it is still answering.",
  "Something in this room is still reporting. Keep looking.",
  "You have time. Read what the room is telling you.",
];

/** Level 0 has no puzzle guidance — it is flavour that keeps presence. */
function atmospheric(seed: number): string {
  return ATMOSPHERIC[seed % ATMOSPHERIC.length];
}

/**
 * The static hint for a level. Levels 1–2 are authored per question; 3–4 come
 * from the templated copy in campaigns.ts. Level 4 is the rescue hint and is
 * allowed to be nearly complete — preventing total failure outranks withholding.
 */
export function staticHint(
  puzzle: PuzzleDefinition | null,
  level: HintLevel,
  seed = 0
): string {
  if (!puzzle || level === 0) return atmospheric(seed);
  if (level === 1) return puzzle.hints.level1;
  if (level === 2) return puzzle.hints.level2;
  if (level === 3) return puzzle.hints.level3;
  return puzzle.hints.level4;
}

/** Interface confusion gets location help, never puzzle logic. */
function interfaceHelp(puzzle: PuzzleDefinition | null): string {
  if (!puzzle) return "Turn with the arrow keys. Each wall holds one terminal.";
  if (puzzle.interaction === "object_selection")
    return "Pick one of the two options on the terminal — there is no typing here.";
  return "Type your answer into the terminal box and press Enter. Esc closes it.";
}

export function buildResponse(args: {
  puzzle: PuzzleDefinition | null;
  pressure: number;
  playerMessage?: string;
  explicitRequest?: boolean;
  seed?: number;
}): GameMasterResponse {
  const { puzzle, pressure, playerMessage, explicitRequest } = args;
  const intent = playerMessage ? classifyIntent(playerMessage) : "normal";

  let level = hintLevelFromPressure(pressure);

  // An explicit ask always earns something actionable.
  if (explicitRequest && level === 0) level = 1;
  if (intent === "stronger") level = Math.min(4, level + 2) as HintLevel;
  if (intent === "gentler") level = Math.max(1, level - 1) as HintLevel;

  let message: string;
  if (intent === "interface") {
    message = interfaceHelp(puzzle);
    level = 0;
  } else if (intent === "concept" && puzzle) {
    // Explain using the current puzzle, without handing over the value.
    message = `${puzzle.hints.level2}`;
    level = 2;
  } else {
    message = staticHint(puzzle, level as HintLevel, args.seed ?? 0);
  }

  const urgency: GameMasterResponse["urgency"] =
    pressure >= 0.8 ? "critical" : pressure >= 0.62 ? "urgent" : pressure >= 0.4 ? "focused" : "calm";

  return {
    responseType: playerMessage ? "chat" : explicitRequest ? "chat" : "automatic_hint",
    message,
    hintLevel: level as HintLevel,
    focusTargetId: puzzle?.id ?? null,
    urgency,
    visualEffect: urgency === "critical" ? "timer_warning" : "none",
  };
}
