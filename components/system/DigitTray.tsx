"use client";

import type { SceneDefinition } from "@/lib/types";
import { revealedDigits } from "@/lib/progress";

/**
 * One slot per stage. A digit appears only when that whole stage is solved —
 * the engine does the ones-digit arithmetic, so the player never sums anything.
 *
 * This is the only place the recovered code is visible before the finale, so
 * without it a player reaches the lock with nothing in hand.
 */
export function DigitTray({
  scenes,
  completedPuzzleIds,
  currentSceneIndex,
}: {
  scenes: SceneDefinition[];
  completedPuzzleIds: string[];
  currentSceneIndex: number;
}) {
  const digits = revealedDigits(scenes, completedPuzzleIds);

  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-[9px] tracking-[0.2em]" style={{ color: "var(--dim)" }}>
        CODE
      </span>
      {digits.map((digit, i) => {
        const locked = digit === null;
        const active = i === currentSceneIndex && locked;
        return (
          <div
            key={scenes[i].id}
            className="grid h-9 w-8 place-items-center border-2 text-base font-bold"
            style={{
              borderColor: locked
                ? active
                  ? "var(--accent)"
                  : "var(--edge)"
                : "var(--lit)",
              background: locked ? "var(--panel)" : "#12241a",
              color: locked ? "var(--dim)" : "var(--lit)",
            }}
            aria-label={
              locked
                ? `Stage ${i + 1} digit locked`
                : `Stage ${i + 1} digit ${digit}`
            }
          >
            {locked ? "?" : digit}
          </div>
        );
      })}
    </div>
  );
}
