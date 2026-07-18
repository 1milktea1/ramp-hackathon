"use client";

import { useEffect, useMemo, useState } from "react";
import { emit } from "@/lib/events";
import { useGameStore } from "@/lib/store";
import type { HotspotDefinition, SceneDefinition } from "@/lib/types";
import { Hotspot } from "./Hotspot";
import { adjacentView, NavigationArrows } from "./NavigationArrows";
import { ObjectModal } from "./ObjectModal";
import { PanoramaView } from "./PanoramaView";

type SceneShellProps = {
  scene: SceneDefinition;
  /** Fired when every requiredPuzzleId is in completedPuzzleIds. */
  onStageComplete?: () => void;
};

/**
 * Renders any SceneDefinition: panorama, hotspots, modal, keyboard nav.
 * Puzzle primitives are Person B's — ObjectModal provides a stub input until then.
 */
export function SceneShell({ scene, onStageComplete }: SceneShellProps) {
  const view = useGameStore((s) => s.view);
  const setView = useGameStore((s) => s.setView);
  const discoveredHotspots = useGameStore((s) => s.discoveredHotspots);
  const completedPuzzleIds = useGameStore((s) => s.completedPuzzleIds);
  const discoverHotspot = useGameStore((s) => s.discoverHotspot);

  const [activeHotspot, setActiveHotspot] = useState<HotspotDefinition | null>(
    null
  );

  const puzzlesById = useMemo(() => {
    const map = new Map(scene.puzzles.map((p) => [p.id, p]));
    return map;
  }, [scene.puzzles]);

  const activePuzzle = activeHotspot?.puzzleId
    ? puzzlesById.get(activeHotspot.puzzleId) ?? null
    : null;

  const visibleHotspots = scene.hotspots.filter((h) => h.view === view);

  // Emit scene_enter once per scene id mount.
  useEffect(() => {
    emit("scene_enter", { sceneId: scene.id });
  }, [scene.id]);

  // Keyboard: arrows / A-D look around; Escape closes modal.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveHotspot(null);
        return;
      }
      // Don't steal keys while typing in an input.
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        const next = adjacentView(view, -1);
        if (next) setView(next);
      }
      if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
        const next = adjacentView(view, 1);
        if (next) setView(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, setView]);

  // Advance when all required puzzles for this scene are done.
  useEffect(() => {
    const done = scene.requiredPuzzleIds.every((id) =>
      completedPuzzleIds.includes(id)
    );
    if (done) onStageComplete?.();
  }, [completedPuzzleIds, scene.requiredPuzzleIds, onStageComplete]);

  const selectHotspot = (hotspot: HotspotDefinition) => {
    if (!discoveredHotspots.includes(hotspot.id)) {
      discoverHotspot(hotspot.id);
      emit("hotspot_discover", { hotspotId: hotspot.id, sceneId: scene.id });
    }
    setActiveHotspot(hotspot);
  };

  return (
    <div className="relative h-full w-full">
      <PanoramaView
        view={view}
        backgrounds={scene.backgrounds}
        transitionMs={scene.transition.durationMs || 300}
      >
        {visibleHotspots.map((hotspot) => (
          <Hotspot
            key={hotspot.id}
            hotspot={hotspot}
            completed={
              !!hotspot.puzzleId &&
              completedPuzzleIds.includes(hotspot.puzzleId)
            }
            onSelect={selectHotspot}
          />
        ))}
        <NavigationArrows view={view} onChange={setView} />
      </PanoramaView>

      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded bg-black/55 px-3 py-2 backdrop-blur">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-400">
          {scene.locationLabel}
        </p>
        <p className="text-sm font-medium text-white">{scene.title}</p>
      </div>

      {activeHotspot ? (
        <ObjectModal
          title={activeHotspot.label}
          puzzle={activePuzzle}
          onClose={() => setActiveHotspot(null)}
          onSolved={() => setActiveHotspot(null)}
        />
      ) : null}
    </div>
  );
}
