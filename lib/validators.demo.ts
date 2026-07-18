// DEMO / SHELL SMOKE ANSWERS (Person A)
// Soft-registers plan.md §3 expected values so SceneShell can be played
// before Person B lands real validators. B's registerValidator() calls
// overwrite the same keys — import B's module after this one when ready.

import {
  deepEquals,
  normalizeString,
  registerValidator,
  toNumber,
} from "./validators";

function eqNumber(expected: number) {
  return (input: unknown) => toNumber(input) === expected;
}

function eqString(expected: string) {
  return (input: unknown) =>
    normalizeString(input).toLowerCase() === expected.toLowerCase();
}

const numericAnswers: Record<string, number> = {
  sf_two_sum: 1,
  sf_missing_number: 3,
  sf_contains_dup: 1,
  sf_best_time_stock: 5,
  sf_valid_parens: 1,
  sf_binary_search: 3,
  sf_max_subarray: 6,
  sf_product_except_self: 8,
  "sf-finale-code": 577,
  ny_two_dice_sum7: 6,
  ny_card_ace: 13,
  ny_handshakes: 15,
  ny_coin_flip_ev: 2,
  ny_balls_no_replace: 6,
  ny_locker_doors: 4,
  ny_bayes_coin: 50,
  ny_weighted_ev: 3,
  "ny-finale-code": 497,
};

for (const [key, value] of Object.entries(numericAnswers)) {
  registerValidator(key, eqNumber(value));
}

registerValidator("sf_backspace_compare", eqString("crsor"));
registerValidator("ny_monty_reveal", (input) => {
  const s = normalizeString(input).toUpperCase();
  return s === "SWITCH" || deepEquals(input, "SWITCH");
});
