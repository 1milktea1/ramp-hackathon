"use client";

import type { CampaignDefinition, SceneDefinition } from "@/lib/types";

function clock(totalSec: number): string {
  const m = Math.floor(Math.max(0, totalSec) / 60);
  const s = Math.max(0, totalSec) % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function TopBar({
  campaign,
  scene,
  sceneIndex,
  timeRemainingSec,
  onExit,
}: {
  campaign: CampaignDefinition;
  scene: SceneDefinition;
  sceneIndex: number;
  timeRemainingSec: number;
  onExit: () => void;
}) {
  // Below 60s the clock reads as a warning — plan.md §11 timer_warning.
  const critical = timeRemainingSec <= 60;

  return (
    <header
      className="flex items-center justify-between gap-4 border-b-2 px-4 py-2"
      style={{ borderColor: "var(--edge)" }}
    >
      <button
        onClick={onExit}
        className="px-btn px-2 py-1 text-[10px]"
        aria-label="Leave campaign and return to selection"
      >
        ◀ Exit
      </button>

      <div className="min-w-0 text-center">
        <p className="truncate text-[11px] font-semibold tracking-[0.18em]" style={{ color: "var(--accent)" }}>
          {scene.title.toUpperCase()}
        </p>
        <p className="truncate text-[9px] tracking-[0.2em]" style={{ color: "var(--dim)" }}>
          {scene.locationLabel} · STAGE {sceneIndex + 1}/{campaign.scenes.length}
        </p>
      </div>

      <div
        className="tabular-nums text-lg font-bold tracking-widest"
        style={{ color: critical ? "var(--hot)" : "var(--txt)" }}
        role="timer"
        aria-live={critical ? "assertive" : "off"}
      >
        {clock(timeRemainingSec)}
      </div>
    </header>
  );
}
