import type { PuzzleDefinition } from "./types";

/** NYC exchange finale puzzle contract (replaces digit-code unlock for NYC). */
export const NYC_MARKET_FINALE: PuzzleDefinition = {
  id: "nyc-finale-market",
  category: "probability",
  interaction: "numeric",
  prompt:
    "The exchange is locked. Make markets on the sum and product of the sealed roll (two d6, one d10), read my Buy/Sell/Hold, then name all three dice in one guess to reopen trading.",
  validatorKey: "ny-finale-market",
  expectedDurationSec: 180,
  hints: {
    level1:
      "Buy means my value is above your ask; Sell means it is below your bid.",
    level2:
      "Quote a tight market (bid = ask). A HOLD there confirms the exact value.",
    level3:
      "Pin the sum first (range 3–22), then the product (1–360), then solve for two dice ≤ 6 and one ≤ 10.",
    level4:
      "Binary-search each quantity: move your midpoint up on Buy, down on Sell, and lock it when a tight quote holds. You get only one final guess.",
  },
};
