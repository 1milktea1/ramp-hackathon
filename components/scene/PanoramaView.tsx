"use client";

import { useState } from "react";
import Image from "next/image";
import type { PuzzleDefinition, SceneDefinition, ViewDirection } from "@/lib/types";
import { VIEW_ORDER, deviceSprite, puzzleForView } from "@/lib/campaigns";
import { SceneBackdrop } from "./SceneBackdrop";

/**
 * Three coordinated views on a sliding track. Q1 lives on the left wall,
 * Q2 on the centre, Q3 on the right — so rotating IS the progression.
 *
 * The room art is ONE ultrawide 3:1 image spanning the entire track, not three
 * crops of it. That distinction matters: cropping per panel would show
 * non-adjacent slices side by side and the transition would jump at every seam.
 * Spanning it means the slide reads as a continuous camera pan across one room.
 * See docs/asset-prompts.md.
 */
/**
 * The device art. Renders nothing until the sprite exists, so a scene without
 * art still shows the labelled plate rather than an empty gap.
 * Solved state is a hue shift in CSS — one sprite covers both states.
 */
function DeviceSprite({
  sceneId,
  label,
  solved,
}: {
  sceneId: string;
  label: string;
  solved: boolean;
}) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;

  return (
    <Image
      src={deviceSprite(sceneId, label)}
      alt=""
      width={512}
      height={384}
      unoptimized
      onError={() => setMissing(true)}
      className="h-24 w-auto object-contain"
      style={{
        imageRendering: "pixelated",
        filter: solved
          ? "hue-rotate(75deg) saturate(1.2)"
          : "drop-shadow(0 0 6px var(--accent))",
      }}
    />
  );
}

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

  // All three views share one source image; `center` is the canonical path.
  const art = scene.backgrounds.center;

  return (
    <div className="relative flex-1 overflow-hidden" style={{ background: "var(--ink)" }}>
      <div
        className="absolute inset-y-0 left-0 w-[300%] transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${index * (100 / 3)}%)` }}
      >
        {/* Continuous art layer across the full track. A missing file renders
            nothing rather than a broken image, leaving the CSS rooms visible. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `url(${art})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="flex h-full">
          {VIEW_ORDER.map((v) => {
            const puzzle = puzzleForView(scene, v);
            const hotspot = scene.hotspots.find((h) => h.view === v);
            const solved = puzzle ? completedPuzzleIds.includes(puzzle.id) : false;

            return (
              <div
                key={v}
                className="px-scan relative grid w-1/3 shrink-0 place-items-center"
                aria-hidden={v !== view}
              >
                {/* Fallback room, drawn per third. Covered once art lands. */}
                <div className="-z-10">
                  <SceneBackdrop sceneId={scene.id} view={v} />
                </div>

                {puzzle && hotspot && (
                  <button
                    onClick={() => onOpenPuzzle(puzzle)}
                    tabIndex={v === view ? 0 : -1}
                    aria-label={hotspot.label}
                    // relative/z-10 is load-bearing: the art and backdrop layers
                    // are absolutely positioned, so a static button hides behind them.
                    className="group relative z-10 grid place-items-center bg-transparent p-0"
                  >
                    <DeviceSprite
                      sceneId={scene.id}
                      label={hotspot.label}
                      solved={solved}
                    />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vignette keeps the HUD and MIRA captions legible over bright art. */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(11,14,20,0.55) 100%)",
        }}
      />

      {/* Which wall you're facing, and which questions are done. */}
      <div className="pointer-events-none absolute left-1/2 top-3 z-20 flex -translate-x-1/2 gap-1.5">
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
