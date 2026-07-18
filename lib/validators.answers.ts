// ANSWER REGISTRATIONS — the file lib/validators.ts names as Person B's.
//
// Transcribed from the plan.md §3 tables so the shell is playable before
// puzzle-bank.md lands. Person B owns this content: replace the values here,
// not the validate() contract.
//
// Finale codes are COMPUTED from the stage hint digits (plan.md §5.2), never
// hardcoded, so they cannot drift from the per-puzzle answers.

import { registerValidator, toNumber, normalizeString } from "./validators";
import { SAN_FRANCISCO, NEW_YORK } from "./campaigns";
import { finalCode } from "./progress";

/** Register a puzzle whose answer is a single number. */
function numeric(key: string, expected: number): void {
  registerValidator(key, (input) => toNumber(input) === expected);
}

/** Register a puzzle whose answer is a case-insensitive word. */
function word(key: string, expected: string): void {
  registerValidator(key, (input) =>
    normalizeString(input).toLowerCase() === expected.toLowerCase()
  );
}

// --- San Francisco ------------------------------------------
numeric("sf_two_sum", 1);
numeric("sf_missing_number", 3);
numeric("sf_contains_dup", 1);
numeric("sf_best_time_stock", 5);
word("sf_backspace_compare", "crsor");
numeric("sf_valid_parens", 1);
numeric("sf_binary_search", 3);
numeric("sf_max_subarray", 6);
numeric("sf_product_except_self", 8);

// --- New York -----------------------------------------------
numeric("ny_two_dice_sum7", 6);
numeric("ny_card_ace", 13);
numeric("ny_handshakes", 15);
numeric("ny_coin_flip_ev", 2);
// P(both red) = (3/8)(2/7) = 6/56 = 3/28 — numerator over 28 is 3 (plan.md §3).
numeric("ny_balls_no_replace", 3);
word("ny_monty_reveal", "SWITCH");
numeric("ny_locker_doors", 4);
numeric("ny_bayes_coin", 50);
numeric("ny_weighted_ev", 3);

// --- Finale codes (derived) ---------------------------------
word("sf-finale-code", finalCode(SAN_FRANCISCO.scenes)); // → "577"
word("ny-finale-code", finalCode(NEW_YORK.scenes)); // → "467"
