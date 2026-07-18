"use client";

import type { PuzzleDefinition, SceneDefinition, ViewDirection } from "@/lib/types";
import { VIEW_ORDER, puzzleForView } from "@/lib/campaigns";

// One wide 16:9 image per scene, cropped by object-position (plan.md §10).
const CROP: Record<ViewDirection, string> = {
  left: "0% 50%",
  center: "50% 50%",
  right: "100% 50%",
};

/**
 * Three coordinated views on a sliding track. Q1 lives on the left wall,
 * Q2 on the center, Q3 on the right — so rotating IS the progression.
 */
export function PanoramaView({
  scene,
  view,
  completedPuzzleIds,
  onOpenPuzzle,
}: {
  scene: SceneDefinition;
  view: ViewDirection;
  completedPuzzleIds: string[];
  onOpenPuzzle: (puzzle: PuzzleDefinition) => void;
}) {
  const index = VIEW_ORDER.indexOf(view);

  return (
    <div className="relative flex-1 overflow-hidden" style={{ background: "var(--panel)" }}>
      <div
        className="flex h-full w-[300%] transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${index * (100 / 3)}%)` }}
      >
        {VIEW_ORDER.map((v) => {
          const puzzle = puzzleForView(scene, v);
          const hotspot = scene.hotspots.find((h) => h.view === v);
          const solved = puzzle ? completedPuzzleIds.includes(puzzle.id) : false;

          return (
            <div
              key={v}
              className="px-scan relative grid w-1/3 shrink-0 place-items-center"
              style={{
                // Background image is applied optimistically; until Person D's
                // art lands the panel simply reads as an empty lit room.
                backgroundImage: `url(${scene.backgrounds[v]})`,
                backgroundSize: "cover",
                backgroundPosition: CROP[v],
              }}
              aria-hidden={v !== view}
            >
              {puzzle && hotspot && (
                <button
                  onClick={() => onOpenPuzzle(puzzle)}
                  tabIndex={v === view ? 0 : -1}
                  className="group grid place-items-center gap-2 border-2 px-6 py-5"
                  style={{
                    borderColor: solved ? "var(--lit)" : "var(--accent)",
                    borderStyle: solved ? "solid" : "dashed",
                    background: "rgba(11,14,20,0.86)",
                  }}
                >
                  <span
                    className="text-[9px] tracking-[0.22em]"
                    style={{ color: solved ? "var(--lit)" : "var(--accent)" }}
                  >
                    {hotspot.label.toUpperCase()}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--dim)" }}>
                    {solved ? "✓ RESOLVED" : "INTERACT"}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Which wall you're facing, and which questions are done. */}
      <div className="pointer-events-none absolute left-1/2 top-3 flex -translate-x-1/2 gap-1.5">
        {VIEW_ORDER.map((v) => {
          const p = puzzleForView(scene, v);
          const done = p ? completedPuzzleIds.includes(p.id) : false;
          return (
            <span
              key={v}
              className="h-[3px] w-4"
              style={{
                background: done
                  ? "var(--lit)"
                  : v === view
                    ? "var(--accent)"
                    : "var(--edge)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
