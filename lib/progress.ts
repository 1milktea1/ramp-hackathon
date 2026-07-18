// STAGE HINT / FINAL CODE DERIVATION (plan.md §3, §5.2)
//
// plan.md §5.2 requires the finale code to be COMPUTED from the per-puzzle hint
// digits rather than hardcoded twice, so the two can never drift. This module is
// that single derivation point; the HUD tray and the finale validator both read it.
//
//   hint_digit(puzzle) = ones digit of the puzzle's numeric answer
//   stage_hint         = ones digit of (d1 + d2 + d3)
//   final_code         = stage1 ‖ stage2 ‖ stage3      (concatenated, not summed)

import type { CampaignId, SceneDefinition } from "./types";

/**
 * Hint digit per bank ID, transcribed from the plan.md §3 tables.
 *
 * Two answers are not naturally numeric and use the stated conventions:
 *   sf_unique_path_count — full answer 28; hint digit is the ones place (8)
 *   ny_monty_reveal      — SWITCH = 1, STAY = 0
 */
export const HINT_DIGITS: Record<string, number> = {
  // San Francisco
  sf_two_sum: 1,
  sf_missing_number: 3,
  sf_contains_dup: 1,
  sf_best_time_stock: 5,
  sf_unique_path_count: 8,
  sf_valid_parens: 1,
  sf_binary_search: 3,
  sf_max_subarray: 6,
  sf_product_except_self: 8,
  // New York
  ny_two_dice_sum7: 6,
  ny_card_ace: 3,
  ny_handshakes: 5,
  ny_coin_flip_ev: 2,
  ny_balls_no_replace: 3,
  ny_monty_reveal: 1,
  // Stage 3 is the single market-maker desk — digit 7 keeps tray code 467.
  "nyc-finale-market": 7,
};

/** Ones digit of the sum of a stage's three hint digits. */
export function stageHint(scene: SceneDefinition): number {
  const sum = scene.requiredPuzzleIds.reduce(
    (n, id) => n + (HINT_DIGITS[id] ?? 0),
    0
  );
  return sum % 10;
}

/** True once every required puzzle in the stage is complete. */
export function isStageSolved(
  scene: SceneDefinition,
  completedPuzzleIds: string[]
): boolean {
  return scene.requiredPuzzleIds.every((id) => completedPuzzleIds.includes(id));
}

/** How many of the stage's questions are done — drives the view dots. */
export function stageProgress(
  scene: SceneDefinition,
  completedPuzzleIds: string[]
): number {
  return scene.requiredPuzzleIds.filter((id) => completedPuzzleIds.includes(id))
    .length;
}

/**
 * The tray: one slot per stage, revealed only once that stage is fully solved.
 * `null` means the digit is still locked.
 */
export function revealedDigits(
  scenes: SceneDefinition[],
  completedPuzzleIds: string[]
): (number | null)[] {
  return scenes.map((scene) =>
    isStageSolved(scene, completedPuzzleIds) ? stageHint(scene) : null
  );
}

/** The finale code, computed — never hardcoded. SF → "547", NYC tray → "467". */
export function finalCode(scenes: SceneDefinition[]): string {
  return scenes.map((s) => String(stageHint(s))).join("");
}

/** Finale validatorKey for a campaign (plan.md §5.2). */
export function finaleValidatorKey(campaignId: CampaignId): string {
  return campaignId === "san-francisco-swe" ? "sf-finale-code" : "ny-finale-code";
}
