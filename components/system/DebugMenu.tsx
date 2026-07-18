"use client";

import { useEffect, useState } from "react";
import { FINALE_CODE_REFERENCE, getCampaign } from "@/lib/campaigns";
import { emit } from "@/lib/events";
import { useGameStore } from "@/lib/store";

/**
 * Judge / developer menu. Toggle with Shift+D (plan.md §2 / §8).
 * Does not unlock puzzles via MIRA — only via explicit debug actions.
 */
export function DebugMenu() {
  const [open, setOpen] = useState(false);

  const status = useGameStore((s) => s.status);
  const campaignId = useGameStore((s) => s.campaignId);
  const sceneIndex = useGameStore((s) => s.sceneIndex);
  const completedPuzzleIds = useGameStore((s) => s.completedPuzzleIds);
  const setSceneIndex = useGameStore((s) => s.setSceneIndex);
  const completePuzzle = useGameStore((s) => s.completePuzzle);
  const tickTimer = useGameStore((s) => s.tickTimer);
  const addItem = useGameStore((s) => s.addItem);
  const setStatus = useGameStore((s) => s.setStatus);
  const reset = useGameStore((s) => s.reset);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.shiftKey && (event.key === "D" || event.key === "d")) {
        // Avoid toggling while typing in inputs unless menu already open.
        const tag = (event.target as HTMLElement | null)?.tagName;
        if (!open && (tag === "INPUT" || tag === "TEXTAREA")) return;
        event.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const campaign = campaignId ? getCampaign(campaignId) : null;
  const scene = campaign?.scenes[sceneIndex];
  const nextIncomplete = scene?.requiredPuzzleIds.find(
    (id) => !completedPuzzleIds.includes(id)
  );

  return (
    <div className="absolute bottom-4 left-4 z-50 w-72 rounded-lg border border-fuchsia-400/40 bg-zinc-950/95 p-3 text-left shadow-xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-fuchsia-300">
          Debug · Shift+D
        </p>
        <button
          type="button"
          className="text-xs text-zinc-400 hover:text-white"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </div>

      <div className="mb-3 space-y-1 font-mono text-[11px] text-zinc-400">
        <p>status: {status}</p>
        <p>campaign: {campaignId ?? "—"}</p>
        <p>
          scene: {sceneIndex}
          {scene ? ` (${scene.id})` : ""}
        </p>
        <p>completed: {completedPuzzleIds.length}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="rounded border border-white/15 px-2 py-1.5 text-xs hover:bg-white/5"
          onClick={() => tickTimer(-60)}
        >
          +60s
        </button>
        <button
          type="button"
          className="rounded border border-white/15 px-2 py-1.5 text-xs hover:bg-white/5"
          onClick={() => {
            if (!nextIncomplete) return;
            completePuzzle(nextIncomplete);
            emit("puzzle_complete", {
              puzzleId: nextIncomplete,
              debug: true,
            });
          }}
          disabled={!nextIncomplete}
        >
          Skip puzzle
        </button>
        <button
          type="button"
          className="rounded border border-white/15 px-2 py-1.5 text-xs hover:bg-white/5"
          onClick={() => {
            if (!campaign) return;
            const next = Math.min(sceneIndex + 1, campaign.scenes.length - 1);
            setSceneIndex(next);
          }}
          disabled={!campaign}
        >
          Next scene
        </button>
        <button
          type="button"
          className="rounded border border-white/15 px-2 py-1.5 text-xs hover:bg-white/5"
          onClick={() => setSceneIndex(sceneIndex)}
          disabled={!campaign}
        >
          Restart stage
        </button>
        <button
          type="button"
          className="rounded border border-white/15 px-2 py-1.5 text-xs hover:bg-white/5"
          onClick={() => addItem("debug-access-card")}
        >
          Grant item
        </button>
        <button
          type="button"
          className="rounded border border-white/15 px-2 py-1.5 text-xs hover:bg-white/5"
          onClick={() =>
            emit("mira_trigger", { reason: "debug_menu", sceneId: scene?.id })
          }
        >
          Trigger MIRA
        </button>
        <button
          type="button"
          className="rounded border border-white/15 px-2 py-1.5 text-xs hover:bg-white/5"
          onClick={() => setStatus("won")}
        >
          Force win
        </button>
        <button
          type="button"
          className="rounded border border-white/15 px-2 py-1.5 text-xs hover:bg-white/5"
          onClick={() => reset()}
        >
          Full reset
        </button>
      </div>

      {campaignId ? (
        <p className="mt-3 font-mono text-[10px] text-zinc-500">
          Ref finale: {FINALE_CODE_REFERENCE[campaignId]} (B wires validate)
        </p>
      ) : null}
    </div>
  );
}
