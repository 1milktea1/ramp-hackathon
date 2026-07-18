"use client";

import { useEffect, useState } from "react";
import type { CampaignDefinition } from "@/lib/types";
import { useGameStore } from "@/lib/store";

/**
 * Judge-demo controls (plan.md §2 #12). Shift+D toggles.
 *
 * The demo path locked at §12 is: play Stage 1 fully, skip Stages 2-3, play
 * the finale — so "solve stage" and "jump" are the two that matter live.
 */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="mb-1 text-[8px] tracking-[0.2em]" style={{ color: "var(--dim)" }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

export function DebugMenu({ campaign }: { campaign: CampaignDefinition }) {
  const [open, setOpen] = useState(false);

  const sceneIndex = useGameStore((s) => s.sceneIndex);
  const setSceneIndex = useGameStore((s) => s.setSceneIndex);
  const completePuzzle = useGameStore((s) => s.completePuzzle);
  const tickTimer = useGameStore((s) => s.tickTimer);
  const setStatus = useGameStore((s) => s.setStatus);
  const reset = useGameStore((s) => s.reset);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  const scene = campaign.scenes[sceneIndex];

  function solveStage(index: number) {
    campaign.scenes[index].requiredPuzzleIds.forEach(completePuzzle);
  }

  return (
    <div
      className="px-border absolute right-3 top-3 z-50 w-64 p-3"
      style={{ background: "var(--ink)" }}
      role="dialog"
      aria-label="Debug menu"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[9px] tracking-[0.2em]" style={{ color: "var(--hot)" }}>
          DEBUG · SHIFT+D
        </span>
        <button onClick={() => setOpen(false)} className="text-[10px]" style={{ color: "var(--dim)" }}>
          ✕
        </button>
      </div>

      <Row label="JUMP TO STAGE">
        {campaign.scenes.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setSceneIndex(i)}
            className="px-btn px-2 py-1 text-[9px]"
            style={i === sceneIndex ? { borderColor: "var(--accent)" } : undefined}
          >
            {i + 1}
          </button>
        ))}
      </Row>

      <Row label="SOLVE">
        <button onClick={() => solveStage(sceneIndex)} className="px-btn px-2 py-1 text-[9px]">
          This stage
        </button>
        <button
          onClick={() => campaign.scenes.forEach((_, i) => solveStage(i))}
          className="px-btn px-2 py-1 text-[9px]"
        >
          All stages
        </button>
      </Row>

      <Row label="TIMER">
        {/* Negative delta adds time — tickTimer is the only sanctioned mutator. */}
        <button onClick={() => tickTimer(-60)} className="px-btn px-2 py-1 text-[9px]">
          +60s
        </button>
        <button onClick={() => tickTimer(60)} className="px-btn px-2 py-1 text-[9px]">
          −60s
        </button>
        <button onClick={() => tickTimer(9999)} className="px-btn px-2 py-1 text-[9px]">
          Expire
        </button>
      </Row>

      <Row label="STATE">
        <button onClick={() => setStatus("won")} className="px-btn px-2 py-1 text-[9px]">
          Win
        </button>
        <button onClick={() => setStatus("lost")} className="px-btn px-2 py-1 text-[9px]">
          Lose
        </button>
        <button onClick={reset} className="px-btn px-2 py-1 text-[9px]">
          Restart
        </button>
      </Row>

      <p className="mt-2 text-[8px] leading-relaxed" style={{ color: "var(--dim)" }}>
        {scene.title} · {scene.requiredPuzzleIds.length} questions
      </p>
    </div>
  );
}
