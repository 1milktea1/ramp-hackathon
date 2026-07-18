"use client";

// ARB RUSH — NYC quant finale reference component.
//
// Consumes the pure reducer in lib/arb-rush.ts. Deliberately plain layout —
// UI teammate restyles without touching the engine.
//
// Player UI shows ONLY mechanical facts (legs, size, cost/margin). Never shows
// min/max payoff, ROI, or arb flags — detecting arbs is the skill under test.
// Debug "Reveal arbs" toggles engine-internal badges for judge demos.

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGameStore } from "@/lib/store";
import { emit } from "@/lib/events";
import { validate } from "@/lib/validators";
import "@/lib/validators.answers";
import {
  DEMO_SEED,
  SWEEP_REMAINING_SEC,
  bankrollTotal,
  computeBounds,
  createInitialState,
  isFullBuyArb,
  isFullSellArb,
  isTrap,
  reducer,
  type ArbRushAction,
  type Basket,
  type EventMarket,
  type Leg,
  type OutcomeQuote,
} from "@/lib/arb-rush";
import type { PuzzleDefinition } from "@/lib/types";

export function ArbRushGame({ puzzle }: { puzzle: PuzzleDefinition }) {
  const completePuzzle = useGameStore((s) => s.completePuzzle);
  const setStatus = useGameStore((s) => s.setStatus);
  const solved = useGameStore((s) => s.completedPuzzleIds.includes(puzzle.id));

  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialState(Math.floor(Math.random() * 0xffffffff) || DEMO_SEED)
  );

  const [draftLegs, setDraftLegs] = useState<Leg[]>([]);
  const [draftEventId, setDraftEventId] = useState<string | null>(null);
  const [size, setSize] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [flash, setFlash] = useState<Record<string, "player" | "rival">>({});

  const logLen = useRef(0);

  // Drive the clock.
  useEffect(() => {
    if (state.phase === "INTRO" || state.phase === "DONE" || solved) return;
    const id = setInterval(() => dispatch({ type: "TICK", dtMs: 250 }), 250);
    return () => clearInterval(id);
  }, [state.phase, solved]);

  // Bridge engine log → SEAM emits + local toast/flash.
  useEffect(() => {
    const fresh = state.log.slice(logLen.current);
    logLen.current = state.log.length;
    for (const ev of fresh) {
      const p = ev.payload ?? {};
      switch (ev.type) {
        case "player_fill":
          emit("answer_submit", { puzzleId: puzzle.id, ...p });
          if (typeof p.eventId === "string") {
            setFlash((f) => ({ ...f, [p.eventId as string]: "player" }));
          }
          setToast("FILL — position locked");
          break;
        case "player_trap_fill":
          emit("wrong_attempt", { puzzleId: puzzle.id, kind: "trap", ...p });
          setToast("That basket's floor was negative. Check the sums.");
          break;
        case "rival_fill":
          emit("mira_trigger", { kind: "rival_fill", ...p });
          if (typeof p.eventId === "string") {
            setFlash((f) => ({ ...f, [p.eventId as string]: "rival" }));
          }
          setToast(`RIVAL swept ${String(p.eventId)}`);
          break;
        case "sniped":
          emit("wrong_attempt", { puzzleId: puzzle.id, kind: "sniped", ...p });
          setToast("SNIPED — liquidity gone. Wait for the next window.");
          break;
        case "player_idle":
          emit("idle_timeout", { puzzleId: puzzle.id, ...p });
          break;
        case "puzzle_solved":
          if (validate(puzzle.validatorKey, "WIN")) {
            completePuzzle(puzzle.id);
            emit("puzzle_complete", {
              puzzleId: puzzle.id,
              margin: p.margin,
            });
          }
          break;
        case "puzzle_failed":
          emit("wrong_attempt", { puzzleId: puzzle.id, ...p });
          setStatus("lost");
          break;
        default:
          break;
      }
    }
  }, [state.log, puzzle.id, puzzle.validatorKey, completePuzzle, setStatus]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (Object.keys(flash).length === 0) return;
    const t = setTimeout(() => setFlash({}), 600);
    return () => clearTimeout(t);
  }, [flash]);

  const draftBasket: Basket | null = useMemo(() => {
    if (!draftEventId || draftLegs.length === 0) return null;
    return { eventId: draftEventId, legs: draftLegs, size };
  }, [draftEventId, draftLegs, size]);

  const draftBounds = useMemo(() => {
    if (!draftBasket) return null;
    return computeBounds(state, draftBasket, "PLAYER");
  }, [state, draftBasket]);

  useEffect(() => {
    if (draftBounds && draftBounds.maxSize > 0) {
      setSize((s) => Math.min(s, draftBounds.maxSize) || draftBounds.maxSize);
    }
  }, [draftBounds?.maxSize]); // eslint-disable-line react-hooks/exhaustive-deps

  function addLeg(eventId: string, outcomeId: string, side: "BUY" | "SELL") {
    setDraftEventId(eventId);
    setDraftLegs((legs) => {
      // Switching event clears.
      if (draftEventId && draftEventId !== eventId) {
        return [{ outcomeId, side }];
      }
      const without = legs.filter((l) => l.outcomeId !== outcomeId);
      return [...without, { outcomeId, side }];
    });
  }

  function takeAllAsks(ev: EventMarket) {
    setDraftEventId(ev.id);
    setDraftLegs(ev.outcomes.map((o) => ({ outcomeId: o.id, side: "BUY" as const })));
  }

  function hitAllBids(ev: EventMarket) {
    setDraftEventId(ev.id);
    setDraftLegs(ev.outcomes.map((o) => ({ outcomeId: o.id, side: "SELL" as const })));
  }

  function execute() {
    if (!draftBasket || !draftBounds || draftBounds.maxSize < 1) return;
    dispatch({
      type: "EXECUTE_BASKET",
      basket: { ...draftBasket, size: Math.min(size, draftBounds.maxSize) },
    });
    setDraftLegs([]);
    setDraftEventId(null);
  }

  if (solved) {
    return (
      <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/20 p-4">
        <p className="text-sm font-medium text-emerald-400">
          You out-earned RIVAL
          {state.titleTier ? ` — ${state.titleTier}` : ""}. Markets reopen.
        </p>
      </div>
    );
  }

  if (state.phase === "INTRO") {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 p-4">
        <Header puzzle={puzzle} />
        <p className="text-sm text-zinc-300">
          You and RIVAL start with 1,000. Three epochs, sixty seconds each.
          RIVAL sweeps the highest-ROI arb at 15s / 30s / 45s / 58s. Beat its
          bankroll.
        </p>
        <p className="text-xs text-zinc-500">
          Tip: every event pays exactly 100. Sum the asks — under 100, buying
          all locks the difference. Over 100 on the bids works the other way.
          Cheap legs can still be traps.
        </p>
        <button
          className="w-fit rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white"
          onClick={() => dispatch({ type: "START" })}
        >
          Open the book
        </button>
        <DebugBar
          seed={state.seed}
          rivalFrozen={state.rivalFrozen}
          revealArbs={state.revealArbs}
          dispatch={dispatch}
        />
      </div>
    );
  }

  if (state.phase === "DONE") {
    const margin =
      bankrollTotal(state.player) - bankrollTotal(state.rival);
    return (
      <div
        className={`rounded-lg border p-4 ${
          state.result === "WIN"
            ? "border-emerald-800/60 bg-emerald-950/20"
            : "border-red-900/60 bg-red-950/20"
        }`}
      >
        <p
          className={`text-sm font-medium ${
            state.result === "WIN" ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {state.result === "WIN"
            ? `WIN by ${margin}${state.titleTier ? ` — ${state.titleTier}` : ""}`
            : margin === 0
              ? "TIE — RIVAL keeps the desk. Ties count as a loss."
              : `LOSS by ${-margin}. RIVAL cleared the book.`}
        </p>
        <p className="mt-2 font-mono text-xs text-zinc-500">
          You {bankrollTotal(state.player)} · RIVAL {bankrollTotal(state.rival)} ·
          seed {state.seed}
        </p>
      </div>
    );
  }

  const sweepIn =
    state.nextSweepAtSec != null
      ? Math.max(0, state.epochClockSec - state.nextSweepAtSec)
      : null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 p-4">
      <Header puzzle={puzzle} />

      <ScoreHud
        epoch={state.epoch}
        clock={state.epochClockSec}
        phase={state.phase}
        sweepIn={sweepIn}
        player={state.player}
        rival={state.rival}
      />

      {toast && (
        <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200">
          {toast}
        </div>
      )}

      {state.phase === "RESOLUTION" && state.lastResolution && (
        <div className="rounded-md border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
          Epoch {state.epoch} resolved — you{" "}
          {state.lastResolution.playerPnL >= 0 ? "+" : ""}
          {state.lastResolution.playerPnL}, RIVAL{" "}
          {state.lastResolution.rivalPnL >= 0 ? "+" : ""}
          {state.lastResolution.rivalPnL}. Next board in{" "}
          {state.epochClockSec}s.
        </div>
      )}

      {state.phase === "TRADING" && (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            {state.board.map((ev) => (
              <EventCard
                key={ev.id}
                ev={ev}
                flash={flash[ev.id]}
                reveal={state.revealArbs}
                onBuy={(oid) => addLeg(ev.id, oid, "BUY")}
                onSell={(oid) => addLeg(ev.id, oid, "SELL")}
                onTakeAllAsks={() => takeAllAsks(ev)}
                onHitAllBids={() => hitAllBids(ev)}
              />
            ))}
          </div>

          <BasketBuilder
            eventId={draftEventId}
            legs={draftLegs}
            size={size}
            maxSize={draftBounds?.maxSize ?? 0}
            cost={draftBounds?.cost ?? 0}
            board={state.board}
            onSize={setSize}
            onClear={() => {
              setDraftLegs([]);
              setDraftEventId(null);
            }}
            onExecute={execute}
          />
        </>
      )}

      <DebugBar
        seed={state.seed}
        rivalFrozen={state.rivalFrozen}
        revealArbs={state.revealArbs}
        dispatch={dispatch}
      />
    </div>
  );
}

function Header({ puzzle }: { puzzle: PuzzleDefinition }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        {puzzle.category} · arb rush
      </span>
      <p className="text-sm text-zinc-200">{puzzle.prompt}</p>
    </div>
  );
}

function ScoreHud({
  epoch,
  clock,
  phase,
  sweepIn,
  player,
  rival,
}: {
  epoch: number;
  clock: number;
  phase: string;
  sweepIn: number | null;
  player: { free: number; locked: number };
  rival: { free: number; locked: number };
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3 font-mono text-xs text-zinc-400">
      <span>
        EPOCH {epoch}/3 · {phase === "RESOLUTION" ? "RESOLVING" : `${clock}s`}
      </span>
      <span className={sweepIn != null && sweepIn <= 5 ? "text-red-400" : ""}>
        {sweepIn != null
          ? `RIVAL SWEEP IN ${String(sweepIn).padStart(2, "0")}s`
          : "NO SWEEP PENDING"}
      </span>
      <span>
        YOU {bankrollTotal(player)}{" "}
        <span className="text-zinc-600">
          ({player.free} free / {player.locked} locked)
        </span>
      </span>
      <span>RIVAL {bankrollTotal(rival)}</span>
    </div>
  );
}

function EventCard({
  ev,
  flash,
  reveal,
  onBuy,
  onSell,
  onTakeAllAsks,
  onHitAllBids,
}: {
  ev: EventMarket;
  flash?: "player" | "rival";
  reveal: boolean;
  onBuy: (outcomeId: string) => void;
  onSell: (outcomeId: string) => void;
  onTakeAllAsks: () => void;
  onHitAllBids: () => void;
}) {
  let badge: string | null = null;
  if (reveal) {
    if (isFullBuyArb(ev)) badge = "BUY-ARB";
    else if (isFullSellArb(ev)) badge = "SELL-ARB";
    else if (isTrap(ev)) badge = "TRAP";
  }

  return (
    <div
      className={`rounded-md border p-3 ${
        flash === "player"
          ? "border-emerald-600 bg-emerald-950/30"
          : flash === "rival"
            ? "border-red-700 bg-red-950/30"
            : "border-zinc-800"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-200">{ev.label}</span>
        {badge && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400">
            {badge}
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-1">
        {ev.outcomes.map((o) => (
          <OutcomeRow key={o.id} o={o} onBuy={() => onBuy(o.id)} onSell={() => onSell(o.id)} />
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <button
          className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400 hover:bg-zinc-900"
          onClick={onTakeAllAsks}
        >
          Take all asks
        </button>
        <button
          className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400 hover:bg-zinc-900"
          onClick={onHitAllBids}
        >
          Hit all bids
        </button>
      </div>
    </div>
  );
}

function OutcomeRow({
  o,
  onBuy,
  onSell,
}: {
  o: OutcomeQuote;
  onBuy: () => void;
  onSell: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-2 font-mono text-xs text-zinc-400">
      <span className="w-12 text-zinc-300">{o.label}</span>
      <button
        className="rounded px-1.5 py-0.5 hover:bg-zinc-900 disabled:opacity-30"
        onClick={onSell}
        disabled={o.bidSize <= 0}
        title="Sell at bid"
      >
        {o.bid}×{o.bidSize}
      </button>
      <button
        className="rounded px-1.5 py-0.5 text-zinc-200 hover:bg-zinc-900 disabled:opacity-30"
        onClick={onBuy}
        disabled={o.askSize <= 0}
        title="Buy at ask"
      >
        {o.ask}×{o.askSize}
      </button>
      <div className="h-1 w-12 overflow-hidden rounded bg-zinc-800">
        <div
          className="h-full bg-zinc-500"
          style={{ width: `${Math.min(100, o.askSize * 5)}%` }}
        />
      </div>
    </li>
  );
}

function BasketBuilder({
  eventId,
  legs,
  size,
  maxSize,
  cost,
  board,
  onSize,
  onClear,
  onExecute,
}: {
  eventId: string | null;
  legs: Leg[];
  size: number;
  maxSize: number;
  cost: number;
  board: EventMarket[];
  onSize: (n: number) => void;
  onClear: () => void;
  onExecute: () => void;
}) {
  const ev = board.find((e) => e.id === eventId);
  const isSell = legs.length > 0 && legs.every((l) => l.side === "SELL");

  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-950/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Basket builder
        </span>
        {legs.length > 0 && (
          <button
            className="text-[10px] uppercase text-zinc-500 hover:text-zinc-300"
            onClick={onClear}
          >
            Clear
          </button>
        )}
      </div>
      {legs.length === 0 ? (
        <p className="text-xs text-zinc-600">
          Click an ask to buy, a bid to sell — or use TAKE ALL ASKS / HIT ALL BIDS.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-zinc-400">
            {ev?.label ?? eventId} · {legs.length} leg(s)
          </p>
          <ul className="font-mono text-xs text-zinc-500">
            {legs.map((l) => {
              const o = ev?.outcomes.find((x) => x.id === l.outcomeId);
              return (
                <li key={l.outcomeId + l.side}>
                  {l.side} {o?.label ?? l.outcomeId} @{" "}
                  {l.side === "BUY" ? o?.ask : o?.bid}
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              Size
              <input
                type="range"
                min={1}
                max={Math.max(1, maxSize)}
                value={Math.min(size, Math.max(1, maxSize))}
                onChange={(e) => onSize(Number(e.target.value))}
              />
              <span className="font-mono text-zinc-200">
                {Math.min(size, maxSize)}/{maxSize}
              </span>
            </label>
            <span className="font-mono text-xs text-zinc-300">
              {isSell ? "margin locked" : "cost"} {cost}
            </span>
            <button
              className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 enabled:hover:bg-white disabled:opacity-40"
              onClick={onExecute}
              disabled={maxSize < 1}
            >
              Execute
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DebugBar({
  seed,
  rivalFrozen,
  revealArbs,
  dispatch,
}: {
  seed: number;
  rivalFrozen: boolean;
  revealArbs: boolean;
  dispatch: (action: ArbRushAction) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
      <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-600">
        debug · seed {seed}
      </span>
      <DbgBtn onClick={() => dispatch({ type: "DEBUG_FREEZE_RIVAL" })}>
        {rivalFrozen ? "Unfreeze RIVAL" : "Freeze RIVAL"}
      </DbgBtn>
      <DbgBtn onClick={() => dispatch({ type: "DEBUG_REVEAL_ARBS" })}>
        {revealArbs ? "Hide arbs" : "Reveal arbs"}
      </DbgBtn>
      <DbgBtn onClick={() => dispatch({ type: "DEBUG_SKIP_EPOCH" })}>
        Skip epoch
      </DbgBtn>
      <DbgBtn
        onClick={() => dispatch({ type: "DEBUG_SET_SEED", seed: DEMO_SEED })}
      >
        DEMO_SEED
      </DbgBtn>
      <span className="font-mono text-[10px] text-zinc-700">
        sweeps @ remaining {SWEEP_REMAINING_SEC.join("/")}
      </span>
    </div>
  );
}

function DbgBtn({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
