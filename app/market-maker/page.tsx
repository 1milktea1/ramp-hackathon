"use client";

import { useState } from "react";
import { MarketMakerFinale } from "@/components/puzzles/MarketMakerFinale";
import { getSession } from "@/lib/market-game";

/** Standalone handoff / restyle route for the NYC exchange finale. */
export default function MarketMakerDemoPage() {
  const [open, setOpen] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const roll = getSession();

  return (
    <main
      className="relative flex h-full flex-1 flex-col"
      data-campaign="new-york-quant"
      style={{ background: "var(--ink)" }}
    >
      {!open && (
        <div className="grid flex-1 place-items-center p-6">
          <button
            type="button"
            className="px-btn px-4 py-3 text-[11px]"
            onClick={() => setOpen(true)}
          >
            Reopen exchange
          </button>
        </div>
      )}

      {open && <MarketMakerFinale onClose={() => setOpen(false)} />}

      <div
        className="absolute bottom-3 right-3 z-50 flex items-center gap-2 border-2 px-2 py-1"
        style={{ borderColor: "var(--edge)", background: "var(--ink)" }}
      >
        <button
          type="button"
          className="px-btn px-2 py-1 text-[9px]"
          onClick={() => setRevealed((v) => !v)}
        >
          {revealed ? "Hide roll" : "Reveal roll (dev)"}
        </button>
        {revealed && (
          <span className="text-[10px]" style={{ color: "var(--dim)" }}>
            {roll
              ? `d7=${roll.d7} · d10=${roll.d10a} · d10=${roll.d10b}`
              : "no session"}
          </span>
        )}
      </div>
    </main>
  );
}
