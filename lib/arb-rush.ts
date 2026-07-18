// ARB RUSH ENGINE (NYC quant finale)
//
// Pure TypeScript, zero React. Competitive arbitrage-capture vs a sweeping
// RIVAL bot across 3×60s epochs. All time advances via injected TICK so the
// game is unit-testable and debug-warpable.
//
// Pricing / payoffs / resolution are fully deterministic. MIRA only narrates.

export const DEMO_SEED = 0x4a52_5255; // "ARRU"
export const STARTING_BANKROLL = 1000;
export const EPOCH_DURATION_SEC = 60;
export const RESOLUTION_DURATION_SEC = 5;
export const TOTAL_EPOCHS = 3;
/** Sweeps fire when remaining clock hits these values (elapsed 15/30/45/58). */
export const SWEEP_REMAINING_SEC = [45, 30, 15, 2] as const;
export const IDLE_WARN_SEC = 20;

// --- PRNG --------------------------------------------------------------------

/** mulberry32 — deterministic, seedable. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng: () => number, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function shuffleInPlace<T>(rng: () => number, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

// --- Types -------------------------------------------------------------------

export type OutcomeQuote = {
  id: string;
  label: string;
  bid: number;
  ask: number;
  bidSize: number;
  askSize: number;
};

export type EventMarket = {
  id: string;
  label: string;
  outcomes: OutcomeQuote[];
  /** Hidden until resolution. */
  trueProbs: number[];
};

export type Leg = { outcomeId: string; side: "BUY" | "SELL" };

export type Basket = { eventId: string; legs: Leg[]; size: number };

export type BasketBounds = {
  /** Capital debited (BUY) or margin locked (SELL). */
  cost: number;
  minPayoff: number;
  maxPayoff: number;
  roi: number | null;
  isArb: boolean;
  maxSize: number;
};

export type Position = {
  owner: "PLAYER" | "RIVAL";
  basket: Basket;
  epoch: number;
  /** Snapshot of quotes at fill time for resolution. */
  fillPrices: { outcomeId: string; side: "BUY" | "SELL"; price: number }[];
  cost: number;
};

export type ArbRushLogEvent = {
  type: string;
  at: number;
  payload?: Record<string, unknown>;
};

export type ArbRushPhase = "INTRO" | "TRADING" | "RESOLUTION" | "DONE";

export type ArbRushState = {
  seed: number;
  epoch: 1 | 2 | 3;
  /** Counts EPOCH_DURATION_SEC → 0 during TRADING; RESOLUTION_DURATION_SEC → 0 during RESOLUTION. */
  epochClockSec: number;
  phase: ArbRushPhase;
  board: EventMarket[];
  positions: Position[];
  player: { free: number; locked: number };
  rival: { free: number; locked: number };
  nextSweepAtSec: number | null;
  /** Remaining-clock values already swept this epoch. */
  sweepsFired: number[];
  log: ArbRushLogEvent[];
  result: "WIN" | "LOSS" | null;
  titleTier: string | null;
  rivalFrozen: boolean;
  revealArbs: boolean;
  lastResolution: {
    playerPnL: number;
    rivalPnL: number;
    winners: Record<string, string>;
  } | null;
  idleSinceFillSec: number;
  idleWarned: boolean;
  /** Accumulated ms for sub-second TICK accuracy. */
  _clockMs: number;
};

export type ArbRushAction =
  | { type: "START" }
  | { type: "TICK"; dtMs: number }
  | { type: "EXECUTE_BASKET"; basket: Basket }
  | { type: "DEBUG_SKIP_EPOCH" }
  | { type: "DEBUG_FREEZE_RIVAL" }
  | { type: "DEBUG_REVEAL_ARBS" }
  | { type: "DEBUG_SET_SEED"; seed: number }
  | { type: "DEBUG_SET_BANKROLLS"; player: number; rival: number };

// --- Cosmetic event names ----------------------------------------------------

const EVENT_NAMES = [
  "Latency Auction Fill",
  "Spread Compression Bet",
  "Maker Rebate Futures",
  "Fill-Rate Contingency",
  "Queue Position Swap",
  "Cancel Storm Hedge",
  "Tick-to-Trade Gap",
  "Crossed Book Recovery",
  "Adverse Selection Flag",
  "Dark Pool Leak Odds",
  "Post-Only Collision",
  "IOC Miss Probability",
] as const;

const OUTCOME_LABELS: Record<number, string[]> = {
  2: ["YES", "NO"],
  3: ["UP", "FLAT", "DOWN"],
  4: ["A", "B", "C", "D"],
};

// --- Board generation --------------------------------------------------------

type SlotKind = "bigBuy" | "medBuy" | "sellArb" | "trap" | "fair";

function dirichletish(rng: () => number, n: number): number[] {
  const raw = Array.from({ length: n }, () => Math.max(rng(), 1e-6));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((x) => x / sum);
}

function clampPrice(p: number): number {
  return Math.max(1, Math.min(99, Math.round(p)));
}

function sumAsks(outcomes: OutcomeQuote[]): number {
  return outcomes.reduce((s, o) => s + o.ask, 0);
}

function sumBids(outcomes: OutcomeQuote[]): number {
  return outcomes.reduce((s, o) => s + o.bid, 0);
}

function makeBaseOutcomes(
  rng: () => number,
  n: number,
  eventId: string,
  liq: number
): { outcomes: OutcomeQuote[]; trueProbs: number[] } {
  const trueProbs = dirichletish(rng, n);
  const fair = trueProbs.map((p) => Math.round(100 * p));
  // Fix rounding so fairs sum ~100.
  let fSum = fair.reduce((a, b) => a + b, 0);
  if (fSum !== 100 && fair.length > 0) {
    fair[0] = Math.max(1, Math.min(99, fair[0]! + (100 - fSum)));
  }
  const spread = pick(rng, [2, 3, 4] as const);
  const labels = OUTCOME_LABELS[n] ?? Array.from({ length: n }, (_, i) => `O${i}`);
  const outcomes: OutcomeQuote[] = fair.map((f, i) => ({
    id: `${eventId}-o${i}`,
    label: labels[i] ?? `O${i}`,
    bid: clampPrice(f - spread),
    ask: clampPrice(f + spread),
    bidSize: liq,
    askSize: liq,
  }));
  return { outcomes, trueProbs };
}

function shiftAsksToTarget(
  outcomes: OutcomeQuote[],
  targetSum: number
): void {
  const current = sumAsks(outcomes);
  let delta = targetSum - current;
  // Distribute delta across outcomes, prefer adjusting the largest ask.
  let guard = 0;
  while (delta !== 0 && guard++ < 200) {
    const idx =
      delta < 0
        ? outcomes.reduce((bi, o, i, a) => (o.ask > a[bi]!.ask ? i : bi), 0)
        : outcomes.reduce((bi, o, i, a) => (o.ask < a[bi]!.ask ? i : bi), 0);
    const o = outcomes[idx]!;
    if (delta < 0 && o.ask > 1) {
      o.ask -= 1;
      delta += 1;
    } else if (delta > 0 && o.ask < 99) {
      o.ask += 1;
      delta -= 1;
    } else break;
  }
  // Keep bid < ask.
  for (const o of outcomes) {
    if (o.bid >= o.ask) o.bid = Math.max(1, o.ask - 1);
  }
}

function shiftBidsToTarget(
  outcomes: OutcomeQuote[],
  targetSum: number
): void {
  let delta = targetSum - sumBids(outcomes);
  let guard = 0;
  while (delta !== 0 && guard++ < 200) {
    const idx =
      delta > 0
        ? outcomes.reduce((bi, o, i, a) => (o.bid < a[bi]!.bid ? i : bi), 0)
        : outcomes.reduce((bi, o, i, a) => (o.bid > a[bi]!.bid ? i : bi), 0);
    const o = outcomes[idx]!;
    if (delta > 0 && o.bid < 99 && o.bid + 1 < o.ask) {
      o.bid += 1;
      delta -= 1;
    } else if (delta < 0 && o.bid > 1) {
      o.bid -= 1;
      delta += 1;
    } else break;
  }
}

function makeCheapLegs(rng: () => number, outcomes: OutcomeQuote[]): void {
  const n = randInt(rng, 1, Math.min(2, outcomes.length));
  const idxs = shuffleInPlace(
    rng,
    outcomes.map((_, i) => i)
  ).slice(0, n);
  for (const i of idxs) {
    const o = outcomes[i]!;
    o.ask = randInt(rng, 8, 15);
    if (o.bid >= o.ask) o.bid = Math.max(1, o.ask - 1);
  }
}

function finalizeOutcomes(outcomes: OutcomeQuote[]): void {
  for (const o of outcomes) {
    o.bid = clampPrice(o.bid);
    o.ask = clampPrice(o.ask);
    if (o.bid >= o.ask) o.bid = Math.max(1, o.ask - 1);
  }
}

function buildEventForSlot(
  rng: () => number,
  slot: SlotKind,
  eventId: string,
  label: string,
  epoch: 1 | 2 | 3,
  force = false
): EventMarket | null {
  const nOutcomes = force ? 2 : pick(rng, [2, 3, 4] as const);
  let liqLo: number;
  let liqHi: number;
  switch (slot) {
    case "bigBuy":
      liqLo = 8;
      liqHi = 12;
      break;
    case "medBuy":
      liqLo = 15;
      liqHi = 30;
      break;
    case "sellArb":
      liqLo = 10;
      liqHi = 20;
      break;
    case "trap":
      liqLo = 20;
      liqHi = 40;
      break;
    default:
      liqLo = 15;
      liqHi = 30;
  }
  // Epoch 3: tighten liquidity ~30%.
  if (epoch === 3) {
    liqLo = Math.max(3, Math.floor(liqLo * 0.7));
    liqHi = Math.max(liqLo + 1, Math.floor(liqHi * 0.7));
  }
  const liq = randInt(rng, liqLo, liqHi);
  const { outcomes, trueProbs } = makeBaseOutcomes(rng, nOutcomes, eventId, liq);

  // Epoch 3: narrow ROIs by 1–2 points (shift targets toward 100).
  const roiTighten = epoch === 3 ? randInt(rng, 1, 2) : 0;

  if (slot === "bigBuy") {
    const target = randInt(rng, 88 + roiTighten, 93);
    shiftAsksToTarget(outcomes, Math.min(93, target));
  } else if (slot === "medBuy") {
    const target = randInt(rng, 94, Math.min(97, 97 - Math.min(roiTighten, 1)));
    shiftAsksToTarget(outcomes, target);
  } else if (slot === "sellArb") {
    const target = randInt(rng, 103, Math.max(103, 107 - roiTighten));
    shiftBidsToTarget(outcomes, target);
  } else if (slot === "trap") {
    makeCheapLegs(rng, outcomes);
    shiftAsksToTarget(outcomes, randInt(rng, 101, 104));
  }
  // fair: leave as-is after base spread

  finalizeOutcomes(outcomes);

  // Re-verify slot after clamp; force path repairs instead of failing.
  if (slot === "bigBuy") {
    if (!(sumAsks(outcomes) < 100 && sumAsks(outcomes) <= 93)) {
      if (!force) return null;
      shiftAsksToTarget(outcomes, 90);
      finalizeOutcomes(outcomes);
    }
  } else if (slot === "medBuy") {
    if (!(sumAsks(outcomes) < 100 && sumAsks(outcomes) >= 94)) {
      if (!force) return null;
      shiftAsksToTarget(outcomes, 95);
      finalizeOutcomes(outcomes);
    }
  } else if (slot === "sellArb") {
    if (!(sumBids(outcomes) > 100)) {
      if (!force) return null;
      shiftBidsToTarget(outcomes, 105);
      finalizeOutcomes(outcomes);
    }
  } else if (slot === "trap") {
    if (!(sumAsks(outcomes) > 100)) {
      if (!force) return null;
      shiftAsksToTarget(outcomes, 102);
      finalizeOutcomes(outcomes);
    }
  }

  return { id: eventId, label, outcomes, trueProbs };
}

/** Scale arb-leg liquidity so total capturable profit lands in [140, 220]. */
function tuneProfit(board: EventMarket[], rng: () => number): void {
  for (let guard = 0; guard < 40; guard++) {
    const profit = totalCapturableProfit(board);
    if (profit >= 140 && profit <= 220) return;
    const scaleUp = profit < 140;
    for (const ev of board) {
      const buyP = capturableBuyProfit(ev);
      const sellP = capturableSellProfit(ev);
      if (buyP <= 0 && sellP <= 0) continue;
      for (const o of ev.outcomes) {
        if (scaleUp) {
          o.askSize = Math.min(40, o.askSize + 1);
          o.bidSize = Math.min(40, o.bidSize + 1);
        } else {
          o.askSize = Math.max(3, o.askSize - 1);
          o.bidSize = Math.max(3, o.bidSize - 1);
        }
      }
    }
    // Tiny jitter so we don't oscillate forever on the same step.
    if (rng() < 0.1) break;
  }
}

function slotPlan(epoch: 1 | 2 | 3): SlotKind[] {
  const slots: SlotKind[] = [
    "bigBuy",
    "medBuy",
    "medBuy",
    "sellArb",
    "trap",
    "fair",
  ];
  if (epoch >= 2) {
    // Second trap replaces fair in epoch 2+.
    slots[5] = "trap";
  }
  return slots;
}

function capturableBuyProfit(ev: EventMarket): number {
  const asks = sumAsks(ev.outcomes);
  if (asks >= 100) return 0;
  const size = Math.min(...ev.outcomes.map((o) => o.askSize));
  return (100 - asks) * size;
}

function capturableSellProfit(ev: EventMarket): number {
  const bids = sumBids(ev.outcomes);
  if (bids <= 100) return 0;
  const size = Math.min(...ev.outcomes.map((o) => o.bidSize));
  return (bids - 100) * size;
}

function totalCapturableProfit(board: EventMarket[]): number {
  return board.reduce(
    (s, ev) => s + capturableBuyProfit(ev) + capturableSellProfit(ev),
    0
  );
}

function boardInvariantOk(board: EventMarket[], slots: SlotKind[]): boolean {
  const profit = totalCapturableProfit(board);
  if (profit < 140 || profit > 220) return false;

  // Slot classification counts (after clamp).
  let big = 0;
  let med = 0;
  let sell = 0;
  let trap = 0;
  for (const ev of board) {
    const a = sumAsks(ev.outcomes);
    const b = sumBids(ev.outcomes);
    if (a < 100 && a <= 93) big++;
    else if (a < 100 && a >= 94) med++;
    if (b > 100) sell++;
    if (a > 100) trap++;
  }
  const needTrap = slots.filter((s) => s === "trap").length;
  if (big < 1 || med < 2 || sell < 1 || trap < needTrap) return false;

  // Medium pair sometimes beats big (enforced as soft check — caller tracks %).
  return true;
}

/**
 * Generate a 6-event board for the epoch. Retries until invariants hold.
 * Seeded + deterministic for a given (seed, epoch). Always returns 6 events.
 */
export function generateBoard(seed: number, epoch: 1 | 2 | 3): EventMarket[] {
  const slots = slotPlan(epoch);
  let best: EventMarket[] | null = null;

  for (let attempt = 0; attempt < 100; attempt++) {
    const rng = mulberry32((seed ^ (epoch * 0x9e3779b9) ^ (attempt * 0x85ebca6b)) >>> 0);
    const names = shuffleInPlace(rng, [...EVENT_NAMES]);
    const board: EventMarket[] = [];
    for (let i = 0; i < slots.length; i++) {
      let built: EventMarket | null = null;
      for (let sub = 0; sub < 30 && !built; sub++) {
        built = buildEventForSlot(
          rng,
          slots[i]!,
          `e${epoch}-${i}`,
          names[i] ?? `Event ${i + 1}`,
          epoch,
          false
        );
      }
      if (!built) {
        built = buildEventForSlot(
          rng,
          slots[i]!,
          `e${epoch}-${i}`,
          names[i] ?? `Event ${i + 1}`,
          epoch,
          true
        );
      }
      if (!built) throw new Error(`arb-rush: failed to build slot ${slots[i]}`);
      board.push(built);
    }
    tuneProfit(board, rng);
    if (!boardInvariantOk(board, slots)) {
      if (!best) best = board;
      continue;
    }
    const medBeat = mediumsBeatBig(board);
    if (medBeat) return board;
    best = board;
    // Keep searching for a mediums-beat-big board; accept after enough tries.
    if (attempt >= 50) return board;
  }

  // Guaranteed fallback with force-built slots + profit tune.
  const rng = mulberry32((seed ^ (epoch * 0x9e3779b9) ^ 0xc0ffee) >>> 0);
  const names = shuffleInPlace(rng, [...EVENT_NAMES]);
  const board: EventMarket[] = slots.map((slot, i) =>
    buildEventForSlot(
      rng,
      slot,
      `e${epoch}-${i}`,
      names[i] ?? `Event ${i + 1}`,
      epoch,
      true
    )!
  );
  tuneProfit(board, rng);
  return best && boardInvariantOk(best, slots) ? best : board;
}

// --- Bounds / baskets --------------------------------------------------------

function findEvent(state: ArbRushState, eventId: string): EventMarket | null {
  return state.board.find((e) => e.id === eventId) ?? null;
}

function findOutcome(
  ev: EventMarket,
  outcomeId: string
): OutcomeQuote | null {
  return ev.outcomes.find((o) => o.id === outcomeId) ?? null;
}

/**
 * Engine-internal payoff bounds. Never shown in the player UI.
 * For full-event buy: min=max=(100-Σasks)*size when size legs match.
 * For partials: min/max over which single outcome wins.
 */
export function computeBounds(
  state: ArbRushState,
  basket: Basket,
  owner: "PLAYER" | "RIVAL"
): BasketBounds {
  const ev = findEvent(state, basket.eventId);
  if (!ev || basket.legs.length === 0 || basket.size <= 0) {
    return {
      cost: 0,
      minPayoff: 0,
      maxPayoff: 0,
      roi: null,
      isArb: false,
      maxSize: 0,
    };
  }

  // Liquidity cap.
  let liqCap = Infinity;
  for (const leg of basket.legs) {
    const o = findOutcome(ev, leg.outcomeId);
    if (!o) {
      liqCap = 0;
      break;
    }
    liqCap = Math.min(liqCap, leg.side === "BUY" ? o.askSize : o.bidSize);
  }
  if (!Number.isFinite(liqCap)) liqCap = 0;

  // Cost / margin per unit size.
  let unitCost = 0;
  for (const leg of basket.legs) {
    const o = findOutcome(ev, leg.outcomeId)!;
    unitCost += leg.side === "BUY" ? o.ask : 100; // SELL locks 100 margin per contract
  }

  const wallet = owner === "PLAYER" ? state.player.free : state.rival.free;
  const affordCap =
    unitCost > 0 ? Math.floor(wallet / unitCost) : 0;
  const maxSize = Math.max(0, Math.min(liqCap, affordCap));

  const size = Math.min(basket.size, maxSize || basket.size);
  // Compute payoffs at requested size against current quotes (for display/policy).
  // For maxSize reporting we use the affordability-capped value.

  // Per-resolution net P&L for `size` contracts.
  const payoffs: number[] = [];
  for (let winIdx = 0; winIdx < ev.outcomes.length; winIdx++) {
    let pnl = 0;
    for (const leg of basket.legs) {
      const oIdx = ev.outcomes.findIndex((o) => o.id === leg.outcomeId);
      const o = ev.outcomes[oIdx]!;
      const hit = oIdx === winIdx;
      if (leg.side === "BUY") {
        // Pay ask*size now; receive 100*size if hit.
        pnl += (hit ? 100 : 0) * size - o.ask * size;
      } else {
        // Lock 100*size; receive bid*size proceeds; pay 100*size if hit.
        // Net = bid*size - (hit ? 100*size : 0)
        // (margin returns either way)
        pnl += o.bid * size - (hit ? 100 : 0) * size;
      }
    }
    payoffs.push(pnl);
  }

  // Cost = capital locked/debited now.
  let cost = 0;
  for (const leg of basket.legs) {
    const o = findOutcome(ev, leg.outcomeId)!;
    cost += (leg.side === "BUY" ? o.ask : 100) * size;
  }

  const minPayoff = payoffs.length ? Math.min(...payoffs) : 0;
  const maxPayoff = payoffs.length ? Math.max(...payoffs) : 0;
  const isArb = minPayoff > 0;
  const roi = cost > 0 && isArb ? minPayoff / cost : isArb ? null : null;
  // For true arbs, ROI uses guaranteed profit / capital.
  const arbRoi =
    cost > 0 && isArb ? minPayoff / cost : null;

  return {
    cost,
    minPayoff,
    maxPayoff,
    roi: arbRoi,
    isArb,
    maxSize,
  };
}

/** Full-event buy-all-asks / sell-all-bids baskets at max size for RIVAL scan. */
export function enumerateFullBaskets(state: ArbRushState): Basket[] {
  const out: Basket[] = [];
  for (const ev of state.board) {
    out.push({
      eventId: ev.id,
      legs: ev.outcomes.map((o) => ({ outcomeId: o.id, side: "BUY" as const })),
      size: 1,
    });
    out.push({
      eventId: ev.id,
      legs: ev.outcomes.map((o) => ({ outcomeId: o.id, side: "SELL" as const })),
      size: 1,
    });
  }
  return out;
}

// --- RIVAL -------------------------------------------------------------------

export function rivalSelectTrade(state: ArbRushState): Basket | null {
  if (state.rivalFrozen) return null;
  type Cand = { basket: Basket; roi: number; profit: number; eventIndex: number };
  const cands: Cand[] = [];

  for (let ei = 0; ei < state.board.length; ei++) {
    const ev = state.board[ei]!;
    for (const side of ["BUY", "SELL"] as const) {
      const basket: Basket = {
        eventId: ev.id,
        legs: ev.outcomes.map((o) => ({ outcomeId: o.id, side })),
        size: 1,
      };
      const bounds = computeBounds(state, basket, "RIVAL");
      if (!bounds.isArb || bounds.maxSize < 1) continue;
      const sized: Basket = { ...basket, size: bounds.maxSize };
      const b2 = computeBounds(state, sized, "RIVAL");
      if (!b2.isArb || b2.maxSize < 1) continue;
      cands.push({
        basket: { ...sized, size: b2.maxSize },
        roi: b2.roi ?? 0,
        profit: b2.minPayoff,
        eventIndex: ei,
      });
    }
  }

  if (cands.length === 0) return null;
  cands.sort((a, b) => {
    if (b.roi !== a.roi) return b.roi - a.roi;
    if (b.profit !== a.profit) return b.profit - a.profit;
    return a.eventIndex - b.eventIndex;
  });
  return cands[0]!.basket;
}

// --- Execution ---------------------------------------------------------------

function pushLog(
  state: ArbRushState,
  type: string,
  payload?: Record<string, unknown>
): ArbRushState {
  return {
    ...state,
    log: [...state.log, { type, at: Date.now(), payload }].slice(-200),
  };
}

function applyFill(
  state: ArbRushState,
  owner: "PLAYER" | "RIVAL",
  basket: Basket
): { state: ArbRushState; ok: boolean; reason?: string; bounds?: BasketBounds } {
  const ev = findEvent(state, basket.eventId);
  if (!ev) return { state, ok: false, reason: "missing_event" };

  // Re-validate every leg has liquidity; reject broken baskets (sniped).
  for (const leg of basket.legs) {
    const o = findOutcome(ev, leg.outcomeId);
    if (!o) return { state, ok: false, reason: "sniped" };
    const avail = leg.side === "BUY" ? o.askSize : o.bidSize;
    if (avail <= 0) return { state, ok: false, reason: "sniped" };
  }

  const bounds = computeBounds(state, basket, owner);
  if (bounds.maxSize < 1) return { state, ok: false, reason: "sniped", bounds };

  const size = Math.min(basket.size, bounds.maxSize);
  const sized: Basket = { ...basket, size };
  const finalBounds = computeBounds(state, sized, owner);
  if (finalBounds.maxSize < 1 || finalBounds.cost <= 0) {
    return { state, ok: false, reason: "sniped", bounds: finalBounds };
  }

  // Decrement liquidity.
  const board = state.board.map((e) => {
    if (e.id !== ev.id) return e;
    return {
      ...e,
      outcomes: e.outcomes.map((o) => {
        const leg = sized.legs.find((l) => l.outcomeId === o.id);
        if (!leg) return o;
        if (leg.side === "BUY") {
          return { ...o, askSize: Math.max(0, o.askSize - size) };
        }
        return { ...o, bidSize: Math.max(0, o.bidSize - size) };
      }),
    };
  });

  const fillPrices = sized.legs.map((leg) => {
    const o = findOutcome(ev, leg.outcomeId)!;
    return {
      outcomeId: leg.outcomeId,
      side: leg.side,
      price: leg.side === "BUY" ? o.ask : o.bid,
    };
  });

  const position: Position = {
    owner,
    basket: sized,
    epoch: state.epoch,
    fillPrices,
    cost: finalBounds.cost,
  };

  const walletKey = owner === "PLAYER" ? "player" : "rival";
  const wallet = { ...state[walletKey] };
  wallet.free -= finalBounds.cost;
  wallet.locked += finalBounds.cost;
  if (wallet.free < 0) return { state, ok: false, reason: "insufficient" };

  let next: ArbRushState = {
    ...state,
    board,
    positions: [...state.positions, position],
    [walletKey]: wallet,
  };

  if (owner === "PLAYER") {
    next = {
      ...next,
      idleSinceFillSec: 0,
      idleWarned: false,
    };
    next = pushLog(next, "player_fill", {
      eventId: sized.eventId,
      roi: finalBounds.roi,
      profit: finalBounds.minPayoff,
      isArb: finalBounds.isArb,
    });
    if (finalBounds.minPayoff < 0) {
      next = pushLog(next, "player_trap_fill", {
        eventId: sized.eventId,
        minPayoff: finalBounds.minPayoff,
      });
    }
  } else {
    next = pushLog(next, "rival_fill", {
      eventId: sized.eventId,
      roi: finalBounds.roi,
      profit: finalBounds.minPayoff,
    });
  }

  return { state: next, ok: true, bounds: finalBounds };
}

// --- Resolution --------------------------------------------------------------

function resolvePositionPnL(
  pos: Position,
  winnerOutcomeId: string
): number {
  let pnl = 0;
  for (const fp of pos.fillPrices) {
    const hit = fp.outcomeId === winnerOutcomeId;
    if (fp.side === "BUY") {
      pnl += (hit ? 100 : 0) * pos.basket.size - fp.price * pos.basket.size;
    } else {
      pnl += fp.price * pos.basket.size - (hit ? 100 : 0) * pos.basket.size;
    }
  }
  return pnl;
}

export function resolveEpoch(state: ArbRushState): ArbRushState {
  const rng = mulberry32(
    (state.seed ^ (state.epoch * 0xdeadbeef) ^ 0x11111111) >>> 0
  );
  const winners: Record<string, string> = {};
  for (const ev of state.board) {
    const r = rng();
    let acc = 0;
    let winner = ev.outcomes[ev.outcomes.length - 1]!.id;
    for (let i = 0; i < ev.outcomes.length; i++) {
      acc += ev.trueProbs[i] ?? 0;
      if (r <= acc) {
        winner = ev.outcomes[i]!.id;
        break;
      }
    }
    winners[ev.id] = winner;
  }

  let playerPnL = 0;
  let rivalPnL = 0;
  for (const pos of state.positions) {
    if (pos.epoch !== state.epoch) continue;
    const w = winners[pos.basket.eventId];
    if (!w) continue;
    const pnl = resolvePositionPnL(pos, w);
    if (pos.owner === "PLAYER") playerPnL += pnl;
    else rivalPnL += pnl;
  }

  // Unlock capital: free += locked + pnl; locked = 0 for this epoch's positions.
  // Simpler bankroll model: free + locked is total; after resolve,
  // total' = total + pnl, locked = 0, free = total'.
  const playerTotal = state.player.free + state.player.locked + playerPnL;
  const rivalTotal = state.rival.free + state.rival.locked + rivalPnL;

  let next: ArbRushState = {
    ...state,
    player: { free: Math.max(0, Math.round(playerTotal)), locked: 0 },
    rival: { free: Math.max(0, Math.round(rivalTotal)), locked: 0 },
    positions: state.positions.filter((p) => p.epoch !== state.epoch),
    lastResolution: { playerPnL, rivalPnL, winners },
    phase: "RESOLUTION",
    epochClockSec: RESOLUTION_DURATION_SEC,
    _clockMs: 0,
    nextSweepAtSec: null,
  };

  const capturedShare =
    playerPnL + rivalPnL !== 0
      ? playerPnL / (Math.abs(playerPnL) + Math.abs(rivalPnL) || 1)
      : 0;

  next = pushLog(next, "arbrush_epoch_end", {
    playerPnL,
    rivalPnL,
    capturedShare,
  });
  return next;
}

function titleForMargin(margin: number): string {
  if (margin > 150) return "Systems Arbitrageur";
  if (margin >= 50) return "Spread Hunter";
  if (margin >= 1) return "Calm Under Volatility";
  return "Flattened";
}

/** Last finished-run result for the deterministic validator. */
let lastFinishedResult: "WIN" | "LOSS" | null = null;
let lastFinishedMargin = 0;

export function getArbRushResult(): {
  result: "WIN" | "LOSS" | null;
  margin: number;
} {
  return { result: lastFinishedResult, margin: lastFinishedMargin };
}

function finishGame(state: ArbRushState): ArbRushState {
  const playerBank = state.player.free + state.player.locked;
  const rivalBank = state.rival.free + state.rival.locked;
  const margin = playerBank - rivalBank;
  const result: "WIN" | "LOSS" = margin > 0 ? "WIN" : "LOSS"; // tie = LOSS
  lastFinishedResult = result;
  lastFinishedMargin = margin;
  let next: ArbRushState = {
    ...state,
    phase: "DONE",
    result,
    titleTier: result === "WIN" ? titleForMargin(margin) : titleForMargin(0),
    nextSweepAtSec: null,
  };
  next = pushLog(
    next,
    result === "WIN" ? "puzzle_solved" : "puzzle_failed",
    { margin }
  );
  return next;
}

function startEpoch(state: ArbRushState, epoch: 1 | 2 | 3): ArbRushState {
  const board = generateBoard(state.seed, epoch);
  const profit = totalCapturableProfit(board);
  let next: ArbRushState = {
    ...state,
    epoch,
    phase: "TRADING",
    epochClockSec: EPOCH_DURATION_SEC,
    _clockMs: 0,
    board,
    sweepsFired: [],
    nextSweepAtSec: SWEEP_REMAINING_SEC[0] ?? null,
    idleSinceFillSec: 0,
    idleWarned: false,
    lastResolution: null,
  };
  next = pushLog(next, "arbrush_epoch_start", {
    epoch,
    totalArbProfit: profit,
  });
  return next;
}

function fireSweep(state: ArbRushState): ArbRushState {
  const basket = rivalSelectTrade(state);
  if (!basket) return state;
  const { state: next } = applyFill(state, "RIVAL", basket);
  return next;
}

function maybeFireSweeps(state: ArbRushState): ArbRushState {
  if (state.phase !== "TRADING" || state.rivalFrozen) {
    return {
      ...state,
      nextSweepAtSec: nextPendingSweep(state),
    };
  }
  let next = state;
  for (const at of SWEEP_REMAINING_SEC) {
    if (next.epochClockSec <= at && !next.sweepsFired.includes(at)) {
      next = { ...next, sweepsFired: [...next.sweepsFired, at] };
      next = fireSweep(next);
    }
  }
  return {
    ...next,
    nextSweepAtSec: nextPendingSweep(next),
  };
}

function nextPendingSweep(state: ArbRushState): number | null {
  for (const at of SWEEP_REMAINING_SEC) {
    if (!state.sweepsFired.includes(at) && state.epochClockSec > at) return at;
  }
  // If clock is between sweeps, show the next lower threshold still pending.
  for (const at of SWEEP_REMAINING_SEC) {
    if (!state.sweepsFired.includes(at)) return at;
  }
  return null;
}

// --- Initial state / reducer -------------------------------------------------

export function createInitialState(seed: number = DEMO_SEED): ArbRushState {
  lastFinishedResult = null;
  lastFinishedMargin = 0;
  return {
    seed,
    epoch: 1,
    epochClockSec: EPOCH_DURATION_SEC,
    phase: "INTRO",
    board: [],
    positions: [],
    player: { free: STARTING_BANKROLL, locked: 0 },
    rival: { free: STARTING_BANKROLL, locked: 0 },
    nextSweepAtSec: SWEEP_REMAINING_SEC[0] ?? null,
    sweepsFired: [],
    log: [],
    result: null,
    titleTier: null,
    rivalFrozen: false,
    revealArbs: false,
    lastResolution: null,
    idleSinceFillSec: 0,
    idleWarned: false,
    _clockMs: 0,
  };
}

export function reducer(
  state: ArbRushState,
  action: ArbRushAction
): ArbRushState {
  switch (action.type) {
    case "START":
      return startEpoch(state, 1);

    case "DEBUG_SET_SEED":
      return { ...createInitialState(action.seed), phase: "INTRO" };

    case "DEBUG_FREEZE_RIVAL":
      return { ...state, rivalFrozen: !state.rivalFrozen };

    case "DEBUG_REVEAL_ARBS":
      return { ...state, revealArbs: !state.revealArbs };

    case "DEBUG_SET_BANKROLLS":
      return {
        ...state,
        player: { free: action.player, locked: 0 },
        rival: { free: action.rival, locked: 0 },
      };

    case "DEBUG_SKIP_EPOCH": {
      if (state.phase === "DONE") return state;
      if (state.phase === "TRADING") {
        return resolveEpoch(state);
      }
      if (state.phase === "RESOLUTION" || state.phase === "INTRO") {
        if (state.epoch >= TOTAL_EPOCHS) return finishGame(state);
        return startEpoch(state, (state.epoch + 1) as 1 | 2 | 3);
      }
      return state;
    }

    case "EXECUTE_BASKET": {
      if (state.phase !== "TRADING") return state;
      const { state: next, ok, reason, bounds } = applyFill(
        state,
        "PLAYER",
        action.basket
      );
      if (!ok) {
        return pushLog(next, "sniped", {
          eventId: action.basket.eventId,
          reason,
          boundsRoi: bounds?.roi ?? null,
        });
      }
      return next;
    }

    case "TICK": {
      if (state.phase === "INTRO" || state.phase === "DONE") return state;

      let next = { ...state, _clockMs: state._clockMs + action.dtMs };
      let wholeSec = 0;
      while (next._clockMs >= 1000) {
        next._clockMs -= 1000;
        wholeSec += 1;
      }
      if (wholeSec === 0) return next;

      if (next.phase === "TRADING") {
        next = {
          ...next,
          epochClockSec: Math.max(0, next.epochClockSec - wholeSec),
          idleSinceFillSec: next.idleSinceFillSec + wholeSec,
        };
        next = maybeFireSweeps(next);

        if (
          !next.idleWarned &&
          next.idleSinceFillSec >= IDLE_WARN_SEC &&
          !next.positions.some(
            (p) => p.owner === "PLAYER" && p.epoch === next.epoch
          )
        ) {
          next = {
            ...pushLog(next, "player_idle", {
              epoch: next.epoch,
              secondsLeft: next.epochClockSec,
            }),
            idleWarned: true,
          };
        }

        if (next.epochClockSec <= 0) {
          next = resolveEpoch(next);
        }
        return next;
      }

      if (next.phase === "RESOLUTION") {
        next = {
          ...next,
          epochClockSec: Math.max(0, next.epochClockSec - wholeSec),
        };
        if (next.epochClockSec <= 0) {
          if (next.epoch >= TOTAL_EPOCHS) return finishGame(next);
          return startEpoch(next, (next.epoch + 1) as 1 | 2 | 3);
        }
        return next;
      }

      return next;
    }

    default:
      return state;
  }
}

// --- Helpers for UI / tests --------------------------------------------------

export function bankrollTotal(w: { free: number; locked: number }): number {
  return w.free + w.locked;
}

export function isFullBuyArb(ev: EventMarket): boolean {
  return sumAsks(ev.outcomes) < 100;
}

export function isFullSellArb(ev: EventMarket): boolean {
  return sumBids(ev.outcomes) > 100;
}

export function isTrap(ev: EventMarket): boolean {
  return sumAsks(ev.outcomes) > 100;
}

export function eventAskSum(ev: EventMarket): number {
  return sumAsks(ev.outcomes);
}

export function eventBidSum(ev: EventMarket): number {
  return sumBids(ev.outcomes);
}

export function totalCapturable(board: EventMarket[]): number {
  return totalCapturableProfit(board);
}

/** Medium-pair-beats-big check used by acceptance tests. */
export function mediumsBeatBig(board: EventMarket[]): boolean {
  const buyArbs = board
    .map((ev) => ({ ev, profit: capturableBuyProfit(ev), asks: sumAsks(ev.outcomes) }))
    .filter((x) => x.profit > 0)
    .sort((a, b) => a.asks - b.asks); // lower asks = bigger ROI typically
  if (buyArbs.length < 3) return false;
  // big ≈ lowest ask sum among buy arbs; mediums = next two by profit liquidity
  const byProfit = [...buyArbs].sort((a, b) => b.profit - a.profit);
  const big = byProfit[0]!;
  const rest = byProfit.slice(1);
  if (rest.length < 2) return false;
  return rest[0]!.profit + rest[1]!.profit > big.profit;
}
