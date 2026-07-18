// MARKET MAKER DICE ENGINE (NYC quant finale)
//
// Pure game logic, no React. The player quotes two-sided markets on the sum and
// product of 3 hidden dice (two 6-sided, one 10-sided). The game master answers
// each market with Buy / Sell / Hold using the standard market-making
// convention. After gathering feedback the player gets ONE guess at the roll.
//
// Deterministic + testable: every function is pure except the client session
// singleton at the bottom, which just holds the active roll so the deterministic
// validator (never MIRA) can check the final guess.

export type Roll = {
  /** First 6-sided die, 1-6. */
  d6a: number;
  /** Second 6-sided die, 1-6. */
  d6b: number;
  /** 10-sided die, 1-10. */
  d10: number;
};

export type Quantity = "sum" | "product";

export type MarketQuote = {
  bid: number;
  ask: number;
};

export type MarketResponse = "buy" | "sell" | "hold";

/** A player's final deduction. The two d6s are unordered. */
export type DiceGuess = {
  d6a: number;
  d6b: number;
  d10: number;
};

/** Inclusive integer die roll in [1, sides] using the supplied RNG. */
function rollDie(sides: number, rng: () => number): number {
  return Math.floor(rng() * sides) + 1;
}

/**
 * Roll the three dice. Pass an RNG (e.g. a seeded one) for deterministic tests;
 * defaults to Math.random for real play.
 */
export function rollDice(rng: () => number = Math.random): Roll {
  return {
    d6a: rollDie(6, rng),
    d6b: rollDie(6, rng),
    d10: rollDie(10, rng),
  };
}

/** The true sum or product of a roll. */
export function trueValue(roll: Roll, quantity: Quantity): number {
  if (quantity === "sum") return roll.d6a + roll.d6b + roll.d10;
  return roll.d6a * roll.d6b * roll.d10;
}

/**
 * The game master's response to a market, standard convention:
 *   BUY  (GM lifts your ask)  when trueValue > ask   — your market is too low
 *   SELL (GM hits your bid)   when trueValue < bid   — your market is too high
 *   HOLD                      when bid <= value <= ask
 *
 * A tight quote (bid === ask === guess) that returns HOLD confirms the exact
 * value, which is the player's main deduction tool.
 */
export function evaluateMarket(
  quantity: Quantity,
  quote: MarketQuote,
  roll: Roll
): MarketResponse {
  const value = trueValue(roll, quantity);
  if (value > quote.ask) return "buy";
  if (value < quote.bid) return "sell";
  return "hold";
}

/** True if a quote is well-formed (integers, bid <= ask). */
export function isValidQuote(quote: MarketQuote): boolean {
  return (
    Number.isInteger(quote.bid) &&
    Number.isInteger(quote.ask) &&
    quote.bid <= quote.ask
  );
}

/**
 * Check a final guess against the true roll. The d10 must match exactly; the two
 * d6 values are compared as an unordered pair so the player is never penalized
 * for guessing them in the "wrong" order.
 */
export function checkGuess(
  roll: Roll | null,
  guess: unknown
): boolean {
  if (!roll) return false;
  if (typeof guess !== "object" || guess === null) return false;
  const g = guess as Partial<DiceGuess>;
  if (
    !Number.isInteger(g.d6a) ||
    !Number.isInteger(g.d6b) ||
    !Number.isInteger(g.d10)
  ) {
    return false;
  }
  if (g.d10 !== roll.d10) return false;
  const guessPair = [g.d6a as number, g.d6b as number].sort((a, b) => a - b);
  const rollPair = [roll.d6a, roll.d6b].sort((a, b) => a - b);
  return guessPair[0] === rollPair[0] && guessPair[1] === rollPair[1];
}

// --- Client session singleton -------------------------------------------------
//
// Single-player and client-side, so the active roll lives at module scope. The
// component starts a session (rolls the dice) and the deterministic validator
// reads the same roll to check the final guess — keeping correctness in the
// engine, not in MIRA or the UI.

let activeRoll: Roll | null = null;

/** Roll a fresh set of dice for a new play-through and store it as the session. */
export function startSession(rng: () => number = Math.random): Roll {
  activeRoll = rollDice(rng);
  return activeRoll;
}

/** The current session's roll, or null if no game is in progress. */
export function getSession(): Roll | null {
  return activeRoll;
}

/** Clear the active session (e.g. on unmount / campaign reset). */
export function endSession(): void {
  activeRoll = null;
}
