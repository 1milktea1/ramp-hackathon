// Stub campaign content for the scene shell (Person A).
// Person B owns real scene JSON / puzzle copy — replace these definitions
// (or swap the data source) without changing SceneShell.

import type { CampaignDefinition, CampaignId, SceneDefinition } from "./types";

function stubScene(args: {
  id: string;
  title: string;
  locationLabel: string;
  expectedDurationSec: number;
  puzzleIds: [string, string, string];
  accent: string;
}): SceneDefinition {
  const [p1, p2, p3] = args.puzzleIds;
  return {
    id: args.id,
    title: args.title,
    locationLabel: args.locationLabel,
    expectedDurationSec: args.expectedDurationSec,
    // CSS gradient tokens — PanoramaView treats "gradient:" as a non-image fill.
    // Person D swaps these for real wide 16:9 asset paths.
    backgrounds: {
      left: `gradient:${args.accent}`,
      center: `gradient:${args.accent}`,
      right: `gradient:${args.accent}`,
    },
    overlays: [
      { id: `${args.id}-fog`, view: "center", kind: "fog" },
      { id: `${args.id}-blink`, view: "right", kind: "led-blink" },
    ],
    hotspots: [
      {
        id: `${args.id}-hs-1`,
        view: "left",
        label: "Clue terminal",
        x: 18,
        y: 42,
        width: 22,
        height: 18,
        puzzleId: p1,
        required: true,
      },
      {
        id: `${args.id}-hs-2`,
        view: "center",
        label: "Main console",
        x: 38,
        y: 36,
        width: 24,
        height: 22,
        puzzleId: p2,
        required: true,
      },
      {
        id: `${args.id}-hs-3`,
        view: "right",
        label: "Side panel",
        x: 58,
        y: 44,
        width: 20,
        height: 16,
        puzzleId: p3,
        required: true,
      },
    ],
    puzzles: [
      {
        id: p1,
        category: "array",
        interaction: "numeric",
        prompt: `[stub] Solve ${p1}. (Person B replaces copy.)`,
        validatorKey: p1,
        expectedDurationSec: 60,
        hints: {
          level1: "Look at the relevant clue in this view.",
          level2: "Focus on the values, not the decoration.",
          level3: "Work the problem step by step.",
          level4: "Enter the numeric answer the board implies.",
        },
      },
      {
        id: p2,
        category: "logic",
        interaction: "numeric",
        prompt: `[stub] Solve ${p2}. (Person B replaces copy.)`,
        validatorKey: p2,
        expectedDurationSec: 60,
        hints: {
          level1: "A required object is still unread.",
          level2: "Compare the labels to the console output.",
          level3: "Reduce the problem to one clear value.",
          level4: "Submit the value the console is asking for.",
        },
      },
      {
        id: p3,
        category: "math",
        interaction: "numeric",
        prompt: `[stub] Solve ${p3}. (Person B replaces copy.)`,
        validatorKey: p3,
        expectedDurationSec: 60,
        hints: {
          level1: "Check the right-hand panel.",
          level2: "The pattern is shorter than it looks.",
          level3: "Compute carefully; only one value unlocks.",
          level4: "Enter the final derived digit or number.",
        },
      },
    ],
    requiredPuzzleIds: [p1, p2, p3],
    transition: { kind: "slide", durationMs: 300 },
  };
}

const sfScenes: SceneDefinition[] = [
  stubScene({
    id: "sf-1",
    title: "SoMa Transit Stop",
    locationLabel: "San Francisco · Stage 1",
    expectedDurationSec: 180,
    puzzleIds: ["sf_two_sum", "sf_missing_number", "sf_contains_dup"],
    accent: "#0f3d4c",
  }),
  stubScene({
    id: "sf-2",
    title: "Cursor Development Floor",
    locationLabel: "San Francisco · Stage 2",
    expectedDurationSec: 210,
    puzzleIds: ["sf_best_time_stock", "sf_backspace_compare", "sf_valid_parens"],
    accent: "#1a2f4a",
  }),
  stubScene({
    id: "sf-3",
    title: "OpenAI Mission Bay Node",
    locationLabel: "San Francisco · Stage 3",
    expectedDurationSec: 240,
    puzzleIds: ["sf_binary_search", "sf_max_subarray", "sf_product_except_self"],
    accent: "#243044",
  }),
];

const nycScenes: SceneDefinition[] = [
  stubScene({
    id: "nyc-1",
    title: "23rd Street Subway",
    locationLabel: "New York · Stage 1",
    expectedDurationSec: 180,
    puzzleIds: ["ny_two_dice_sum7", "ny_card_ace", "ny_handshakes"],
    accent: "#3a2418",
  }),
  stubScene({
    id: "nyc-2",
    title: "Ramp Headquarters",
    locationLabel: "New York · Stage 2",
    expectedDurationSec: 210,
    puzzleIds: ["ny_coin_flip_ev", "ny_balls_no_replace", "ny_monty_reveal"],
    accent: "#2c1f1a",
  }),
  stubScene({
    id: "nyc-3",
    title: "Midtown Market Data Floor",
    locationLabel: "New York · Stage 3",
    expectedDurationSec: 240,
    puzzleIds: ["ny_locker_doors", "ny_bayes_coin", "ny_weighted_ev"],
    accent: "#1f2430",
  }),
];

export const CAMPAIGNS: Record<CampaignId, CampaignDefinition> = {
  "san-francisco-swe": {
    id: "san-francisco-swe",
    title: "System Failure",
    subtitle: "San Francisco · Software Engineering",
    city: "San Francisco",
    durationSec: 12 * 60,
    topicWeights: {
      softwareEngineering: 0.55,
      mathematics: 0.15,
      probability: 0.05,
      logic: 0.15,
      physical: 0.1,
    },
    scenes: sfScenes,
  },
  "new-york-quant": {
    id: "new-york-quant",
    title: "Market Lockdown",
    subtitle: "New York · Quantitative",
    city: "New York",
    durationSec: 12 * 60,
    topicWeights: {
      softwareEngineering: 0.15,
      mathematics: 0.2,
      probability: 0.5,
      logic: 0.1,
      physical: 0.05,
    },
    scenes: nycScenes,
  },
};

export const FINALE_CODE_KEY: Record<CampaignId, string> = {
  "san-francisco-swe": "sf-finale-code",
  "new-york-quant": "ny-finale-code",
};

/** Reference codes from plan.md §3 (B's runtime compute should match). */
export const FINALE_CODE_REFERENCE: Record<CampaignId, string> = {
  "san-francisco-swe": "577",
  "new-york-quant": "497",
};

export function getCampaign(id: CampaignId): CampaignDefinition {
  return CAMPAIGNS[id];
}

export function listCampaigns(): CampaignDefinition[] {
  return Object.values(CAMPAIGNS);
}
