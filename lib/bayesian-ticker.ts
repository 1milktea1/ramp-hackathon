// BAYESIAN TICKER ENGINE (NYC quant mini-game)
//
// Pure game logic, no React. A hidden card (2-10) sets an asset's true value at
// card * 10. Over 3 rounds the game master releases one "news wire" per round
// that narrows the card. After each wire the player must re-quote a two-sided
// market that CONTAINS the true value, with a tightening max width each round
// (round 1 <= 40, round 2 <= 20, round 3 <= 10). A wrong quote widens the next
// round's width requirement (the penalty). The final submission is the exact
// card.
//
// Deterministic + testable: every function is pure except the client session
// singleton at the bottom, which holds the active card + wires so the
// deterministic validators (never MIRA) can check quotes and the final card.

export const MIN_CARD = 2;
export const MAX_CARD = 10;

/** Median rank of a fresh deck of cards 2-10 (used by a news wire). */
export const DECK_MEDIAN = 6;

/** Base max quote width per round (1-indexed): tightens each round. */
export const BASE_WIDTHS = [40, 20, 10] as const;
export const TOTAL_ROUNDS = BASE_WIDTHS.length;

/** A wrong quote widens the NEXT round's allowed width by this much. */
export const WRONG_QUOTE_PENALTY = 10;

export type Quote = { bid: number; ask: number };

export type TickerSession = {
  card: number;
  /** One news-wire string per round, ordered easiest-to-hardest. */
  wires: string[];
};

/** The asset's true value for a card. */
export function assetValue(card: number): number {
  return card * 10;
}

/**
 * The max allowed quote width for a round (1-indexed), including any accumulated
 * penalty from earlier wrong quotes.
 */
export function maxWidthForRound(round: number, penaltyPoints = 0): number {
  const base =
    BASE_WIDTHS[round - 1] ?? BASE_WIDTHS[BASE_WIDTHS.length - 1];
  return base + penaltyPoints;
}

export type QuoteCheck = {
  width: number;
  contained: boolean;
  withinWidth: boolean;
  ok: boolean;
};

/**
 * Deterministic per-round containment check. A quote passes when it contains the
 * true value AND its width is within the round's allowance.
 */
export function checkQuote(
  card: number,
  quote: Quote,
  maxWidth: number
): QuoteCheck {
  const value = assetValue(card);
  const width = quote.ask - quote.bid;
  const contained = quote.bid <= value && value <= quote.ask;
  const withinWidth = width >= 0 && width <= maxWidth;
  return { width, contained, withinWidth, ok: contained && withinWidth };
}

/** Check the final card guess against the true card. */
export function checkCard(card: number | null, guess: unknown): boolean {
  if (card == null) return false;
  const g =
    typeof guess === "number" ? guess : Number(String(guess ?? "").trim());
  return Number.isInteger(g) && g === card;
}

// --- News wires ---------------------------------------------------------------

type Predicate = {
  id: string;
  test: (card: number) => boolean;
  whenTrue: string;
  whenFalse: string;
};

const PRIMES = new Set([2, 3, 5, 7]);
const SQUARES = new Set([4, 9]);

const PREDICATES: Predicate[] = [
  {
    id: "parity",
    test: (c) => c % 2 === 0,
    whenTrue: "The card is an even number.",
    whenFalse: "The card is an odd number.",
  },
  {
    id: "prime",
    test: (c) => PRIMES.has(c),
    whenTrue: "The card is a prime number.",
    whenFalse: "The card is not a prime number.",
  },
  {
    id: "median",
    test: (c) => c > DECK_MEDIAN,
    whenTrue: "The card is above the median of a fresh deck.",
    whenFalse: "The card is at or below the median of a fresh deck.",
  },
  {
    id: "mult3",
    test: (c) => c % 3 === 0,
    whenTrue: "The card is a multiple of three.",
    whenFalse: "The card is not a multiple of three.",
  },
  {
    id: "square",
    test: (c) => SQUARES.has(c),
    whenTrue: "The card is a perfect square.",
    whenFalse: "The card is not a perfect square.",
  },
  {
    id: "mult5",
    test: (c) => c % 5 === 0,
    whenTrue: "The card is a multiple of five.",
    whenFalse: "The card is not a multiple of five.",
  },
];

const ALL_CARDS: number[] = Array.from(
  { length: MAX_CARD - MIN_CARD + 1 },
  (_, i) => MIN_CARD + i
);

/** Cards still consistent with the actual card's truth on the given predicates. */
function consistentCards(card: number, preds: Predicate[]): number[] {
  return ALL_CARDS.filter((c) =>
    preds.every((p) => p.test(c) === p.test(card))
  );
}

/** How many cards a single predicate eliminates (for ordering the ramp). */
function reductionAlone(card: number, pred: Predicate): number {
  return ALL_CARDS.filter((c) => pred.test(c) !== pred.test(card)).length;
}

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (k > items.length) return [];
  const [head, ...rest] = items;
  const withHead = combinations(rest, k - 1).map((c) => [head, ...c]);
  const withoutHead = combinations(rest, k);
  return [...withHead, ...withoutHead];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick 3 news wires that, together, uniquely identify the card. Prefers a
 * "minimal" set where every wire matters (no 2-subset already pins the card),
 * and orders them easiest-first so the game narrows progressively.
 */
export function generateWires(
  card: number,
  rng: () => number = Math.random
): string[] {
  const indices = PREDICATES.map((_, i) => i);
  const combos = shuffle(combinations(indices, TOTAL_ROUNDS), rng);

  let firstUnique: number[] | null = null;
  let chosen: number[] | null = null;

  for (const combo of combos) {
    const preds = combo.map((i) => PREDICATES[i]);
    if (consistentCards(card, preds).length !== 1) continue;
    if (!firstUnique) firstUnique = combo;
    const minimal = combo.every((_, k) => {
      const sub = combo.filter((_, j) => j !== k).map((i) => PREDICATES[i]);
      return consistentCards(card, sub).length > 1;
    });
    if (minimal) {
      chosen = combo;
      break;
    }
  }

  // Fallbacks: a non-minimal unique set, else the 3 most-discriminating wires.
  if (!chosen) chosen = firstUnique;
  if (!chosen) {
    chosen = [...indices]
      .sort((a, b) => reductionAlone(card, PREDICATES[b]) - reductionAlone(card, PREDICATES[a]))
      .slice(0, TOTAL_ROUNDS);
  }

  // Easiest (least eliminating) first for a difficulty ramp.
  const ordered = [...chosen].sort(
    (a, b) => reductionAlone(card, PREDICATES[a]) - reductionAlone(card, PREDICATES[b])
  );

  return ordered.map((i) => {
    const p = PREDICATES[i];
    return p.test(card) ? p.whenTrue : p.whenFalse;
  });
}

// --- Client session singleton -------------------------------------------------

let activeSession: TickerSession | null = null;

/** Draw a fresh hidden card and its news wires; store as the active session. */
export function startTickerSession(rng: () => number = Math.random): TickerSession {
  const card = Math.floor(rng() * (MAX_CARD - MIN_CARD + 1)) + MIN_CARD;
  const wires = generateWires(card, rng);
  activeSession = { card, wires };
  return activeSession;
}

/** The current session, or null if no game is in progress. */
export function getTickerSession(): TickerSession | null {
  return activeSession;
}

/** Clear the active session (e.g. on unmount / reset). */
export function endTickerSession(): void {
  activeSession = null;
}
