// MARKET MAKER DICE ENGINE (NYC quant finale)
//
// Pure game logic, no React. The player quotes two-sided markets on the sum and
// product of 3 hidden dice (one 7-sided, two 10-sided). The game master answers
// each market with Buy / Sell / Hold using the standard market-making
// convention. After gathering feedback the player must name all three dice.
//
// Deterministic + testable: every function is pure except the client session
// singleton at the bottom, which just holds the active roll so the deterministic
// validator (never MIRA) can check the final guess.

export type Roll = {
  /** 7-sided die, 1-7. */
  d7: number;
  /** First 10-sided die, 1-10. */
  d10a: number;
  /** Second 10-sided die, 1-10. */
  d10b: number;
};

export type Quantity = "sum" | "product";

export type MarketQuote = {
  bid: number;
  ask: number;
};

export type MarketResponse = "buy" | "sell" | "hold";

/** A player's final deduction. The two d10s are unordered. */
export type DiceGuess = {
  d7: number;
  d10a: number;
  d10b: number;
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
    d7: rollDie(7, rng),
    d10a: rollDie(10, rng),
    d10b: rollDie(10, rng),
  };
}

/** The true sum or product of a roll. */
export function trueValue(roll: Roll, quantity: Quantity): number {
  if (quantity === "sum") return roll.d7 + roll.d10a + roll.d10b;
  return roll.d7 * roll.d10a * roll.d10b;
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
 * Check a final guess against the true roll. The d7 must match exactly; the two
 * d10 values are compared as an unordered pair so the player is never penalized
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
    !Number.isInteger(g.d7) ||
    !Number.isInteger(g.d10a) ||
    !Number.isInteger(g.d10b)
  ) {
    return false;
  }
  if (g.d7 !== roll.d7) return false;
  const guessPair = [g.d10a as number, g.d10b as number].sort((a, b) => a - b);
  const rollPair = [roll.d10a, roll.d10b].sort((a, b) => a - b);
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
