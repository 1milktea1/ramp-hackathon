// CAMPAIGN CONTENT — derived from plan.md §3 (3 stages × 3 questions).
//
// Person B (Puzzles & Content) owns the authoritative copy in `puzzle-bank.md`.
// This file exists so the shell has real data to render before the bank lands;
// prompts and hint text can be replaced wholesale without touching the UI.
//
// Shapes conform to the frozen contract in lib/types.ts. Do not add fields.

import type {
  CampaignDefinition,
  CampaignId,
  PuzzleCategory,
  PuzzleDefinition,
  PuzzleInteraction,
  SceneDefinition,
  ViewDirection,
} from "./types";

/** One question as authored. Expanded into a PuzzleDefinition below. */
type QuestionSeed = {
  /** Bank ID from plan.md §3 — doubles as the puzzle id and validatorKey. */
  id: string;
  category: PuzzleCategory;
  interaction: PuzzleInteraction;
  /** Which panorama view holds this question: Q1=left, Q2=center, Q3=right. */
  view: ViewDirection;
  /** In-world device the player interacts with — becomes the hotspot label. */
  device: string;
  prompt: string;
  /** Optional visual aid key; the terminal renders text-only when absent. */
  aid?: "dice-grid" | "bay-strip" | "handshake-ring" | "delta-bars" | "doors";
  /** Rescue-hint copy only (levels 3–4). Validation lives in validators.ts. */
  answerText: string;
  /** Level 1: attention nudge. Level 2: method hint. */
  l1: string;
  l2: string;
  sec: number;
};

const VIEWS: ViewDirection[] = ["left", "center", "right"];

/**
 * Expand a seed into a frozen-contract PuzzleDefinition.
 * Levels 1–2 are authored per question; levels 3–4 are templated off the
 * answer, which cuts the hint-writing load from 72 strings to 36.
 */
function toPuzzle(q: QuestionSeed): PuzzleDefinition {
  return {
    id: q.id,
    category: q.category,
    interaction: q.interaction,
    prompt: q.prompt,
    validatorKey: q.id,
    expectedDurationSec: q.sec,
    hints: {
      level1: q.l1,
      level2: q.l2,
      level3: `Work it through to the end — you are one step away.`,
      level4: `The value this terminal wants is ${q.answerText}.`,
    },
  };
}

function toScene(
  id: string,
  title: string,
  locationLabel: string,
  bg: string,
  questions: QuestionSeed[],
  nextSceneId?: string
): SceneDefinition {
  return {
    id,
    title,
    locationLabel,
    expectedDurationSec: questions.reduce((n, q) => n + q.sec, 0),
    // One wide 16:9 image per scene; L/C/R are object-position crops (plan.md §10).
    backgrounds: { left: bg, center: bg, right: bg },
    overlays: [],
    hotspots: questions.map((q) => ({
      id: `${id}-${q.id}`,
      view: q.view,
      label: q.device,
      // Centered device plate; backgrounds are responsive so these are percentages.
      x: 30,
      y: 34,
      width: 40,
      height: 34,
      puzzleId: q.id,
      required: true,
    })),
    puzzles: questions.map(toPuzzle),
    requiredPuzzleIds: questions.map((q) => q.id),
    transition: { kind: "slide", durationMs: 300, nextSceneId },
  };
}

// --- San Francisco — System Failure (SWE) --------------------

const SF_STAGE_1: QuestionSeed[] = [
  {
    id: "sf_two_sum",
    category: "array",
    interaction: "numeric",
    view: "left",
    device: "Arrivals Terminal",
    prompt:
      "The terminal displays a security code list [2, 7, 11, 15]. The system unlocks only if you find the sum of the two positions whose values add up to the target 9. Enter the index sum.",
    answerText: "1",
    l1: "Two entries in that manifest add to 9. Find them first.",
    l2: "It asks for their positions, not their values — and positions start at 0.",
    sec: 45,
  },
  {
    id: "sf_missing_number",
    category: "array",
    interaction: "numeric",
    view: "center",
    device: "Bay Board",
    prompt:
      "A damaged access log shows the sequence [0, 1, 2, 4, 5]. One ID is missing from the sequence. Recover the missing value.",
    aid: "bay-strip",
    answerText: "3",
    l1: "The board should run without a gap. Read it in order.",
    l2: "Every value from 0 to 5 should be present. One is not.",
    sec: 30,
  },
  {
    id: "sf_contains_dup",
    category: "array",
    interaction: "numeric",
    view: "right",
    device: "Maintenance Panel",
    prompt:
      "The trading floor scanner recorded IDs [4, 1, 9, 6, 1]. One ID was accidentally duplicated. Identify the repeated ID.",
    answerText: "1",
    l1: "One of those five IDs appears more than once.",
    l2: "Scan for the value you read twice, then enter that value.",
    sec: 30,
  },
];

const SF_STAGE_2: QuestionSeed[] = [
  {
    id: "sf_best_time_stock",
    category: "math",
    interaction: "numeric",
    view: "left",
    device: "Ramp Ticker",
    prompt: "Prices [7, 1, 5, 3, 6]. Buy once, sell later. Enter the maximum possible gain.",
    aid: "delta-bars",
    answerText: "5",
    l1: "You must buy before you sell — order matters.",
    l2: "Find the lowest price, then the highest price that comes after it.",
    sec: 50,
  },
  {
    id: "sf_backspace_compare",
    category: "logic",
    interaction: "keyboard_sequence",
    view: "center",
    device: "Build Console",
    prompt:
      "Buffer reads cu#rsor, where # is a live Backspace press. Retype it, resolving to the clean value.",
    answerText: "crsor",
    l1: "The # is not a character. It is a keystroke that deletes.",
    l2: "Apply the Backspace to whatever precedes it, then continue typing.",
    sec: 60,
  },
  {
    id: "sf_valid_parens",
    category: "logic",
    interaction: "numeric",
    view: "right",
    device: "Log Wall",
    prompt:
      "Log string ( ( ) ( ) ). Enter 1 if balanced, otherwise the 0-based index of the first break.",
    answerText: "1",
    l1: "Walk the string once, tracking how many brackets are still open.",
    l2: "If the count never goes negative and ends at zero, it is balanced.",
    sec: 50,
  },
];

const SF_STAGE_3: QuestionSeed[] = [
  {
    id: "sf_binary_search",
    category: "logic",
    interaction: "numeric",
    view: "left",
    device: "Index Scanner",
    prompt: "Sorted list [3, 9, 14, 22, 31, 40]. Enter the 0-based index of 22.",
    answerText: "3",
    l1: "The list is already sorted. Count positions, not values.",
    l2: "The first element sits at index 0, so count 3 as zero and continue.",
    sec: 40,
  },
  {
    id: "sf_max_subarray",
    category: "array",
    interaction: "numeric",
    view: "center",
    device: "Load Graph",
    prompt: "Load deltas [-2, 4, -1, 3, -2, 2]. Enter the largest contiguous sum.",
    aid: "delta-bars",
    answerText: "6",
    l1: "The run must be contiguous — no skipping entries.",
    l2: "Try starting at the 4 and extending right, keeping a running total.",
    sec: 75,
  },
  {
    id: "sf_product_except_self",
    category: "array",
    interaction: "numeric",
    view: "right",
    device: "Packet Array",
    prompt: "Array [2, 3, 4]. Enter the value that replaces index 1 — the product of the others.",
    answerText: "8",
    l1: "Index 1 holds the 3. Ignore it.",
    l2: "Multiply the two values that remain once index 1 is excluded.",
    sec: 60,
  },
];

// --- New York — Market Lockdown (Quant) ---------------------

const NY_STAGE_1: QuestionSeed[] = [
  {
    id: "ny_two_dice_sum7",
    category: "probability",
    interaction: "numeric",
    view: "left",
    device: "Odds Board",
    prompt:
      "The trading vault requires a dice verification code. Two dice are rolled, creating 36 possible outcomes. Count how many outcomes produce a total of exactly 7.",
    aid: "dice-grid",
    answerText: "6",
    l1: "Lay the 36 outcomes out as a 6 by 6 grid.",
    l2: "Count the pairs: 1+6, 2+5, 3+4 — and each of those also runs in reverse.",
    sec: 45,
  },
  {
    id: "ny_card_ace",
    category: "probability",
    interaction: "numeric",
    view: "center",
    device: "Token Booth",
    prompt:
      'A security analyst checks a standard 52-card deck. The odds of drawing an Ace are written as "1 in ___". Determine the missing number.',
    answerText: "13",
    l1: "Four favourable cards out of fifty-two.",
    l2: "Reduce 4/52 until the numerator is 1, then read the denominator.",
    sec: 30,
  },
  {
    id: "ny_handshakes",
    category: "math",
    interaction: "numeric",
    view: "right",
    device: "Platform Crowd",
    prompt:
      "Six traders meet before the market opens. Each trader shakes hands with every other trader exactly once. Calculate the total number of handshakes.",
    aid: "handshake-ring",
    answerText: "15",
    l1: "Each trader shakes 5 hands — but every shake involves two people.",
    l2: "Six times five counts each handshake twice, so halve it.",
    sec: 50,
  },
];

const NY_STAGE_2: QuestionSeed[] = [
  {
    id: "ny_coin_flip_ev",
    category: "probability",
    interaction: "numeric",
    view: "left",
    device: "Verification Dial",
    prompt: "A fair coin is flipped until it lands HEADS. Enter the expected number of flips.",
    answerText: "2",
    l1: "Half the time it ends on the first flip.",
    l2: "For a probability p of stopping each trial, the expected count is 1/p.",
    sec: 50,
  },
  {
    id: "ny_balls_no_replace",
    category: "probability",
    interaction: "numeric",
    view: "center",
    device: "Settlement Bin",
    prompt:
      "Bin holds 5 blue and 3 red. Draw 2 without replacement. P(both red) = ? / 28 — enter the numerator.",
    answerText: "3",
    l1: "The first draw changes what is left for the second.",
    l2: "Multiply 3/8 by 2/7, then rewrite the result over 28.",
    sec: 70,
  },
  {
    id: "ny_monty_reveal",
    category: "logic",
    interaction: "object_selection",
    view: "right",
    device: "Three Vaults",
    prompt: "Three vaults, one prize. You pick one; a wrong vault is opened. SWITCH or STAY?",
    aid: "doors",
    answerText: "SWITCH",
    l1: "Your first pick was made when you knew nothing.",
    l2: "That first pick wins 1 in 3 of the time. All remaining odds sit on the other vault.",
    sec: 45,
  },
];

const NY_STAGE_3: QuestionSeed[] = [
  {
    id: "ny_locker_doors",
    category: "logic",
    interaction: "numeric",
    view: "left",
    device: "Twenty Doors",
    prompt:
      "20 doors, all shut. Pass k toggles every multiple of k, for k = 1..20. Enter how many end open.",
    answerText: "4",
    l1: "A door is toggled once for each of its divisors.",
    l2: "It ends open only with an odd number of divisors — which is true of perfect squares.",
    sec: 75,
  },
  {
    id: "ny_bayes_coin",
    category: "probability",
    interaction: "numeric",
    view: "center",
    device: "Coin Vault",
    prompt:
      "2 fair coins and 1 two-headed coin. Draw one at random, flip HEADS. Enter the % chance it is the two-headed coin.",
    answerText: "50",
    l1: "Heads is more likely to appear from the two-headed coin than a fair one.",
    l2: "Weigh 1/3 × 1 against 2/3 × 1/2, then compare the two.",
    sec: 90,
  },
  {
    id: "ny_weighted_ev",
    category: "probability",
    interaction: "numeric",
    view: "right",
    device: "Returns Board",
    prompt: "Returns: +$12 at 25%, +$2 at 50%, −$4 at 25%. Enter the expected value.",
    answerText: "3",
    l1: "Weight each outcome by its own probability, then add.",
    l2: "12(0.25) + 2(0.50) + (−4)(0.25) — mind the sign on the last term.",
    sec: 70,
  },
];

// --- Campaign assembly --------------------------------------

export const SAN_FRANCISCO: CampaignDefinition = {
  id: "san-francisco-swe",
  title: "System Failure",
  subtitle: "A corrupted agent is deploying an unfinished patch across the city network.",
  city: "San Francisco",
  durationSec: 12 * 60,
  topicWeights: {
    softwareEngineering: 0.55,
    mathematics: 0.15,
    probability: 0,
    logic: 0.2,
    physical: 0.1,
  },
  scenes: [
    toScene("sf-1", "SoMa Transit Stop", "SoMa · San Francisco", "/bg/sf-1.png", SF_STAGE_1, "sf-2"),
    toScene("sf-2", "Cursor Development Floor", "Mission · San Francisco", "/bg/sf-2.png", SF_STAGE_2, "sf-3"),
    toScene("sf-3", "OpenAI Mission Bay Node", "Mission Bay · San Francisco", "/bg/sf-3.png", SF_STAGE_3),
  ],
};

export const NEW_YORK: CampaignDefinition = {
  id: "new-york-quant",
  title: "Market Lockdown",
  subtitle: "An automated market-control system has sealed the Manhattan financial nodes.",
  city: "New York",
  durationSec: 12 * 60,
  topicWeights: {
    softwareEngineering: 0.15,
    mathematics: 0.2,
    probability: 0.3,
    logic: 0.2,
    physical: 0.15,
  },
  scenes: [
    toScene("ny-1", "23rd Street Subway", "Flatiron · Manhattan", "/bg/ny-1.png", NY_STAGE_1, "ny-2"),
    toScene("ny-2", "Ramp Headquarters", "West 23rd St · Manhattan", "/bg/ny-2.png", NY_STAGE_2, "ny-3"),
    toScene("ny-3", "Midtown Market Data Floor", "Midtown · Manhattan", "/bg/ny-3.png", NY_STAGE_3),
  ],
};

export const CAMPAIGNS: Record<CampaignId, CampaignDefinition> = {
  "san-francisco-swe": SAN_FRANCISCO,
  "new-york-quant": NEW_YORK,
};

export const CAMPAIGN_LIST: CampaignDefinition[] = [SAN_FRANCISCO, NEW_YORK];

export function getCampaign(id: CampaignId): CampaignDefinition {
  return CAMPAIGNS[id];
}

/** Puzzle occupying a given view of a scene, or null if that wall is empty. */
export function puzzleForView(
  scene: SceneDefinition,
  view: ViewDirection
): PuzzleDefinition | null {
  const hotspot = scene.hotspots.find((h) => h.view === view);
  if (!hotspot?.puzzleId) return null;
  return scene.puzzles.find((p) => p.id === hotspot.puzzleId) ?? null;
}

/** Ordered [left, center, right] views — the Q1/Q2/Q3 progression. */
export const VIEW_ORDER = VIEWS;
