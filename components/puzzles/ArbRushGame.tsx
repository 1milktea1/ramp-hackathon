"use client";

// ARB RUSH — NYC quant finale reference component.
//
// Consumes the pure reducer in lib/arb-rush.ts. Chrome matches MarketMakerPuzzle
// via quantUi so all three NYC quant games feel like one family.
//
// Player UI shows ONLY mechanical facts (legs, size, cost/margin). Never shows
// min/max payoff, ROI, or arb flags — detecting arbs is the skill under test.

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useGameStore } from "@/lib/store";
import { emit } from "@/lib/events";
import { validate } from "@/lib/validators";
import "@/lib/validators.answers";
import {
  DEMO_SEED,
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
import {
  QuantCard,
  QuantHint,
  QuantHistory,
  QuantHistoryRow,
  QuantLose,
  QuantPrimaryButton,
  QuantSecondaryButton,
  QuantTimer,
  QuantWin,
} from "@/components/puzzles/quantUi";

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
  const [flash, setFlash] = useState<Record<string, "player" | "rival">>({});

  const logLen = useRef(0);

  useEffect(() => {
    if (state.phase === "INTRO" || state.phase === "DONE" || solved) return;
    const id = setInterval(() => dispatch({ type: "TICK", dtMs: 250 }), 250);
    return () => clearInterval(id);
  }, [state.phase, solved]);

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
          break;
        case "player_trap_fill":
          emit("wrong_attempt", { puzzleId: puzzle.id, kind: "trap", ...p });
          break;
        case "rival_fill":
          emit("mira_trigger", { kind: "rival_fill", ...p });
          if (typeof p.eventId === "string") {
            setFlash((f) => ({ ...f, [p.eventId as string]: "rival" }));
          }
          break;
        case "sniped":
          emit("wrong_attempt", { puzzleId: puzzle.id, kind: "sniped", ...p });
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
      if (draftEventId && draftEventId !== eventId) {
        return [{ outcomeId, side }];
      }
      const without = legs.filter((l) => l.outcomeId !== outcomeId);
      return [...without, { outcomeId, side }];
    });
  }

  function takeAllAsks(ev: EventMarket) {
    setDraftEventId(ev.id);
    setDraftLegs(
      ev.outcomes.map((o) => ({ outcomeId: o.id, side: "BUY" as const }))
    );
  }

  function hitAllBids(ev: EventMarket) {
    setDraftEventId(ev.id);
    setDraftLegs(
      ev.outcomes.map((o) => ({ outcomeId: o.id, side: "SELL" as const }))
    );
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

  // Visible "game master responses" — fills / snipes / epoch ends (not raw debug).
  const gmLog = state.log.filter((e) =>
    [
      "player_fill",
      "player_trap_fill",
      "rival_fill",
      "sniped",
      "arbrush_epoch_end",
    ].includes(e.type)
  );

  if (solved) {
    return (
      <QuantWin>
        You out-earned RIVAL
        {state.titleTier ? ` — ${state.titleTier}` : ""}. Markets reopen.
      </QuantWin>
    );
  }

  if (state.phase === "DONE") {
    const margin = bankrollTotal(state.player) - bankrollTotal(state.rival);
    if (state.result === "WIN") {
      return (
        <QuantWin>
          WIN by {margin}
          {state.titleTier ? ` — ${state.titleTier}` : ""}
        </QuantWin>
      );
    }
    return (
      <QuantLose
        detail={`You ${bankrollTotal(state.player)} · RIVAL ${bankrollTotal(state.rival)} · seed ${state.seed}`}
      >
        {margin === 0
          ? "TIE — RIVAL keeps the desk. Ties count as a loss."
          : `LOSS by ${-margin}. RIVAL cleared the book.`}
      </QuantLose>
    );
  }

  const sweepIn =
    state.nextSweepAtSec != null
      ? Math.max(0, state.epochClockSec - state.nextSweepAtSec)
      : null;

  return (
    <QuantCard>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            {puzzle.category} · arb rush
          </span>
          <p className="text-sm text-zinc-200">{puzzle.prompt}</p>
        </div>
        {(state.phase === "TRADING" || state.phase === "RESOLUTION") && (
          <QuantTimer
            secondsLeft={state.epochClockSec}
            label={
              state.phase === "RESOLUTION"
                ? "resolving"
                : `epoch ${state.epoch}/3`
            }
          />
        )}
      </div>

      {state.phase === "INTRO" && (
        <div className="flex flex-col gap-4">
          <QuantHint>
            You and RIVAL start with 1,000. Three epochs, sixty seconds each.
            RIVAL sweeps the highest-ROI arb at 15s / 30s / 45s / 58s. Beat its
            bankroll.
          </QuantHint>
          <QuantHint>
            Every event pays exactly 100. Sum the asks — under 100, buying all
            locks the difference. Over 100 on the bids works the other way.
            Cheap legs can still be traps.
          </QuantHint>
          <div className="flex items-center gap-3">
            <QuantPrimaryButton onClick={() => dispatch({ type: "START" })}>
              Open the book
            </QuantPrimaryButton>
            <QuantSecondaryButton
              onClick={() =>
                dispatch({ type: "DEBUG_SET_SEED", seed: DEMO_SEED })
              }
            >
              Use DEMO_SEED
            </QuantSecondaryButton>
          </div>
        </div>
      )}

      {(state.phase === "TRADING" || state.phase === "RESOLUTION") && (
        <>
          <p className="font-mono text-xs text-zinc-500">
            YOU {bankrollTotal(state.player)}{" "}
            <span className="text-zinc-600">
              ({state.player.free} free / {state.player.locked} locked)
            </span>
            {" · "}
            RIVAL {bankrollTotal(state.rival)}
            {sweepIn != null && state.phase === "TRADING" && (
              <>
                {" · "}
                <span className={sweepIn <= 5 ? "text-red-400" : "text-zinc-400"}>
                  RIVAL sweep in {String(sweepIn).padStart(2, "0")}s
                </span>
              </>
            )}
          </p>

          {state.phase === "RESOLUTION" && state.lastResolution && (
            <QuantHint>
              Epoch {state.epoch} resolved — you{" "}
              {state.lastResolution.playerPnL >= 0 ? "+" : ""}
              {state.lastResolution.playerPnL}, RIVAL{" "}
              {state.lastResolution.rivalPnL >= 0 ? "+" : ""}
              {state.lastResolution.rivalPnL}. Next board in{" "}
              {state.epochClockSec}s.
            </QuantHint>
          )}

          {state.phase === "TRADING" && (
            <>
              <QuantHint>
                Click an ask to buy or a bid to sell. TAKE ALL ASKS / HIT ALL
                BIDS builds a full basket. Size defaults to max affordable.
              </QuantHint>

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

          <div className="flex flex-wrap items-center gap-3">
            <QuantSecondaryButton
              onClick={() => dispatch({ type: "DEBUG_FREEZE_RIVAL" })}
            >
              {state.rivalFrozen ? "Unfreeze RIVAL" : "Freeze RIVAL"}
            </QuantSecondaryButton>
            <QuantSecondaryButton
              onClick={() => dispatch({ type: "DEBUG_REVEAL_ARBS" })}
            >
              {state.revealArbs ? "Hide arbs" : "Reveal arbs"}
            </QuantSecondaryButton>
            <QuantSecondaryButton
              onClick={() => dispatch({ type: "DEBUG_SKIP_EPOCH" })}
            >
              Skip epoch
            </QuantSecondaryButton>
            <span className="font-mono text-[10px] text-zinc-600">
              seed {state.seed}
            </span>
          </div>
        </>
      )}

      {gmLog.length > 0 && (
        <QuantHistory>
          {gmLog.map((h, i) => (
            <QuantHistoryRow key={i}>
              <GmLine event={h} />
            </QuantHistoryRow>
          ))}
        </QuantHistory>
      )}
    </QuantCard>
  );
}

function GmLine({
  event,
}: {
  event: { type: string; payload?: Record<string, unknown> };
}) {
  const p = event.payload ?? {};
  switch (event.type) {
    case "player_fill":
      return (
        <>
          <span className="text-zinc-600">YOU</span> filled{" "}
          <span className="font-mono text-zinc-500">{String(p.eventId)}</span>
          {" → "}
          <span className="text-zinc-200">FILL — position locked</span>
        </>
      );
    case "player_trap_fill":
      return (
        <>
          <span className="text-zinc-600">YOU</span>{" "}
          <span className="text-zinc-200">
            That basket&apos;s floor was negative. Check the sums.
          </span>
        </>
      );
    case "rival_fill":
      return (
        <>
          <span className="text-zinc-600">RIVAL</span> swept{" "}
          <span className="font-mono text-zinc-500">{String(p.eventId)}</span>
          {" → "}
          <span className="text-zinc-200">FILL</span>
        </>
      );
    case "sniped":
      return (
        <>
          <span className="text-zinc-600">YOU</span>{" "}
          <span className="text-zinc-200">
            SNIPED — liquidity gone. Wait for the next window.
          </span>
        </>
      );
    case "arbrush_epoch_end":
      return (
        <>
          <span className="text-zinc-600">EPOCH</span>{" "}
          <span className="text-zinc-200">
            resolved · you {Number(p.playerPnL) >= 0 ? "+" : ""}
            {String(p.playerPnL)} · rival {Number(p.rivalPnL) >= 0 ? "+" : ""}
            {String(p.rivalPnL)}
          </span>
        </>
      );
    default:
      return <span className="text-zinc-500">{event.type}</span>;
  }
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
        <span className="text-sm text-zinc-200">{ev.label}</span>
        {badge && (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400">
            {badge}
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-1">
        {ev.outcomes.map((o) => (
          <OutcomeRow
            key={o.id}
            o={o}
            onBuy={() => onBuy(o.id)}
            onSell={() => onSell(o.id)}
          />
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <QuantSecondaryButton onClick={onTakeAllAsks}>
          Take all asks
        </QuantSecondaryButton>
        <QuantSecondaryButton onClick={onHitAllBids}>
          Hit all bids
        </QuantSecondaryButton>
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
        className="rounded-md border border-zinc-800 px-1.5 py-0.5 hover:border-zinc-600 hover:bg-zinc-900 disabled:opacity-30"
        onClick={onSell}
        disabled={o.bidSize <= 0}
        title="Sell at bid"
      >
        {o.bid}×{o.bidSize}
      </button>
      <button
        className="rounded-md border border-zinc-700 px-1.5 py-0.5 text-zinc-200 hover:bg-zinc-900 disabled:opacity-30"
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
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        Basket builder
      </span>
      {legs.length === 0 ? (
        <QuantHint>
          Click an ask to buy, a bid to sell — or use TAKE ALL ASKS / HIT ALL
          BIDS.
        </QuantHint>
      ) : (
        <div className="flex flex-col gap-3">
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
          </div>
          <div className="flex items-center gap-3">
            <QuantPrimaryButton onClick={onExecute} disabled={maxSize < 1}>
              Execute
            </QuantPrimaryButton>
            <QuantSecondaryButton onClick={onClear}>Clear</QuantSecondaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export for debug typing if needed elsewhere.
export type { ArbRushAction };
