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
  /** Bank ID from plan.md §3 — doubles as the puzzle id (and validatorKey unless overridden). */
  id: string;
  /** Optional when the validator registry key differs from the puzzle id. */
  validatorKey?: string;
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
    validatorKey: q.validatorKey ?? q.id,
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
      "Manifest [2, 7, 11, 15]. Target sum 9. Enter the SUM OF THE TWO INDICES that reach it.",
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
    prompt: "Bays reporting: [0, 1, 2, 4, 5]. One never checked in. Enter the missing value.",
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
    prompt: "Blade IDs: [4, 1, 9, 6, 1]. One ID was issued twice. Enter the duplicated ID.",
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
    prompt: "Two dice, 36 equally likely outcomes. Enter how many of them sum to 7.",
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
    prompt: "A 52-card deck holds 4 Aces. Odds of drawing one are 1 in ___. Enter the denominator.",
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
    prompt: "6 traders each shake every other trader's hand exactly once. Enter the total.",
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

// Stage 3 is a single center-wall exchange desk — the market-maker panel.
// Left/right walls stay empty so rotating still works, but only CENTER activates.
const NY_STAGE_3: QuestionSeed[] = [
  {
    id: "nyc-finale-market",
    validatorKey: "ny-finale-market",
    category: "probability",
    interaction: "numeric",
    view: "center",
    device: "Exchange Desk",
    prompt:
      "The exchange is locked. Make markets on the sum and product of the sealed roll (two d6, one d10), read my Buy/Sell/Hold, then name all three dice in one guess to reopen trading.",
    answerText: "the sealed dice",
    l1: "Buy means my value is above your ask; Sell means it is below your bid.",
    l2: "Quote a tight market (bid = ask). A HOLD there confirms the exact value. One wrong final guess loses.",
    sec: 180,
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
    toScene("sf-2", "Cursor Development Floor", "Mission · San Francisco", "/bg/sf-2.jpeg", SF_STAGE_2, "sf-3"),
    toScene("sf-3", "OpenAI Mission Bay Node", "Mission Bay · San Francisco", "/bg/sf-3.jpeg", SF_STAGE_3),
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
    toScene("ny-1", "23rd Street Subway", "Flatiron · Manhattan", "/bg/ny-1.jpeg", NY_STAGE_1, "ny-2"),
    toScene("ny-2", "Ramp Headquarters", "West 23rd St · Manhattan", "/bg/ny-2.jpeg", NY_STAGE_2, "ny-3"),
    // Stage 3 is the market-maker desk, so it is named for the exchange.
    toScene(
      "ny-3",
      "Lower Manhattan Exchange",
      "Exchange · Manhattan",
      "/bg/ny-3.jpeg",
      NY_STAGE_3
    ),
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

/**
 * Sprite for an interactive device. HotspotDefinition is frozen and has no
 * sprite field, so the path is derived from the scene id and device label:
 * scene "sf-1" + "Bay Board" → /devices/sf1-bay-board.png.
 * See docs/asset-prompts.md.
 */
export function deviceSprite(sceneId: string, label: string): string {
  const scene = sceneId.replace(/-/g, "");
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `/devices/${scene}-${slug}.png`;
}

/**
 * Art for the finale room. CampaignDefinition is frozen and has no field for
 * it, so the path is derived by convention rather than stored.
 */
export function finaleBackground(campaignId: CampaignId): string {
  return campaignId === "san-francisco-swe"
    ? "/bg/sf-finale.jpeg"
    : "/bg/ny-finale.jpeg";
}

// --- Visual aids --------------------------------------------
//
// PuzzleDefinition is frozen, so aids are looked up by puzzle id rather than
// carried as a field. A question with no entry renders as text — aids are
// additive and never required to solve anything.

export type AidSpec =
  | { kind: "dice" }
  | { kind: "bays"; values: number[]; range: number }
  | { kind: "ring"; n: number }
  | { kind: "bars"; values: number[]; prefix?: string };

export const AIDS: Record<string, AidSpec> = {
  // 36 outcomes made concrete; counting the sevens is still the player's job.
  ny_two_dice_sum7: { kind: "dice" },
  // Six bays, five reported — the gap is visible, its value is not labelled.
  sf_missing_number: { kind: "bays", values: [0, 1, 2, 4, 5], range: 6 },
  // Click two traders to shake. A pair already shaken will not redraw.
  ny_handshakes: { kind: "ring", n: 6 },
  sf_best_time_stock: { kind: "bars", values: [7, 1, 5, 3, 6], prefix: "$" },
  sf_max_subarray: { kind: "bars", values: [-2, 4, -1, 3, -2, 2] },
};
