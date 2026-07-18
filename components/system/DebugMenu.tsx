"use client";

import { useEffect, useState } from "react";
import { getCampaign } from "@/lib/campaigns";
import { emit } from "@/lib/events";
import { finalCode } from "@/lib/progress";
import { useGameStore } from "@/lib/store";

/** Judge / developer menu. Toggle with Shift+D (plan.md §2 / §8). */
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
    <div
      className="fixed bottom-4 left-4 z-50 w-72 p-3"
      style={{
        border: "2px solid #c084fc",
        background: "rgba(11,14,20,0.96)",
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <p
          className="text-[10px] tracking-[0.25em]"
          style={{ color: "#c084fc" }}
        >
          DEBUG · SHIFT+D
        </p>
        <button
          type="button"
          className="px-btn px-2 py-1 text-[9px]"
          onClick={() => setOpen(false)}
        >
          Close
        </button>
      </div>

      <div className="mb-3 space-y-1 text-[11px]" style={{ color: "var(--dim)" }}>
        <p>status: {status}</p>
        <p>campaign: {campaignId ?? "—"}</p>
        <p>
          scene: {sceneIndex}
          {scene ? ` (${scene.id})` : ""}
        </p>
        <p>completed: {completedPuzzleIds.length}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="px-btn px-2 py-1.5 text-[10px]" onClick={() => tickTimer(-60)}>
          +60s
        </button>
        <button
          type="button"
          className="px-btn px-2 py-1.5 text-[10px]"
          onClick={() => {
            if (!nextIncomplete) return;
            completePuzzle(nextIncomplete);
            emit("puzzle_complete", { puzzleId: nextIncomplete, debug: true });
          }}
          disabled={!nextIncomplete}
        >
          Skip puzzle
        </button>
        <button
          type="button"
          className="px-btn px-2 py-1.5 text-[10px]"
          onClick={() => {
            if (!campaign) return;
            setSceneIndex(Math.min(sceneIndex + 1, campaign.scenes.length - 1));
          }}
          disabled={!campaign}
        >
          Next scene
        </button>
        <button
          type="button"
          className="px-btn px-2 py-1.5 text-[10px]"
          onClick={() => setSceneIndex(sceneIndex)}
          disabled={!campaign}
        >
          Restart stage
        </button>
        <button
          type="button"
          className="px-btn px-2 py-1.5 text-[10px]"
          onClick={() => addItem("debug-access-card")}
        >
          Grant item
        </button>
        <button
          type="button"
          className="px-btn px-2 py-1.5 text-[10px]"
          onClick={() =>
            emit("mira_trigger", { reason: "debug_menu", sceneId: scene?.id })
          }
        >
          Trigger MIRA
        </button>
        <button
          type="button"
          className="px-btn px-2 py-1.5 text-[10px]"
          onClick={() => setStatus("won")}
        >
          Force win
        </button>
        <button
          type="button"
          className="px-btn px-2 py-1.5 text-[10px]"
          onClick={() => reset()}
        >
          Full reset
        </button>
        {campaignId === "new-york-quant" ? (
          <button
            type="button"
            className="px-btn col-span-2 px-2 py-1.5 text-[10px]"
            onClick={() => {
              if (!campaign) return;
              // Clear stages 1–2 only; stage 3 is the live market panel.
              for (const sc of campaign.scenes.slice(0, -1)) {
                for (const id of sc.requiredPuzzleIds) completePuzzle(id);
              }
              setSceneIndex(campaign.scenes.length - 1);
              window.dispatchEvent(new CustomEvent("debug-open-nyc-finale"));
              setOpen(false);
            }}
          >
            Jump to exchange desk
          </button>
        ) : null}
      </div>

      {campaign ? (
        <p className="mt-3 text-[10px]" style={{ color: "var(--dim)" }}>
          {campaign.id === "new-york-quant"
            ? "NYC stage 3: center Exchange Desk → market panel"
            : `Finale code: ${finalCode(campaign.scenes)}`}
        </p>
      ) : null}
    </div>
  );
}
