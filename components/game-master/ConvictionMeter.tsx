"use client";

// CONVICTION METER — MIRA's hint control (README §7-12).
//
// Lives in the SceneShell footer. Shows a "MIRA conviction" bar + a Request-hint
// button. Each request POSTs /api/hint, which advances the meter halfway to 100%
// and returns one calibrated hint; the hint text is handed up via onHint so the
// existing MiraCaption renders it (one caption surface, no overlap).
//
// The engine still validates answers — this control never unlocks anything.

import { useState } from "react";
import { getCampaign } from "@/lib/campaigns";
import { emit } from "@/lib/events";
import { useGameStore } from "@/lib/store";
import type { HintPuzzleContext, HintRequest, HintResponse } from "@/lib/hint";

export function ConvictionMeter({
  sceneId,
  onHint,
}: {
  // Parent passes key={sceneId} so local meter state resets each room.
  sceneId: string;
  onHint: (message: string) => void;
}) {
  const campaignId = useGameStore((s) => s.campaignId);
  const sceneIndex = useGameStore((s) => s.sceneIndex);
  const completedPuzzleIds = useGameStore((s) => s.completedPuzzleIds);
  const wrongAttempts = useGameStore((s) => s.wrongAttempts);
  const hintsGiven = useGameStore((s) => s.hintsGiven);
  const timeRemainingSec = useGameStore((s) => s.timeRemainingSec);
  const secondsSinceMeaningfulProgress = useGameStore(
    (s) => s.secondsSinceMeaningfulProgress
  );

  const [conviction, setConviction] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!campaignId) return null;
  const campaign = getCampaign(campaignId);
  const scene = campaign.scenes[sceneIndex];
  if (!scene) return null;

  async function requestHint() {
    if (loading) return;
    setLoading(true);
    emit("hint_request", { sceneId });

    const puzzles: HintPuzzleContext[] = scene.puzzles.map((p) => ({
      id: p.id,
      prompt: p.prompt,
      category: p.category,
      completed: completedPuzzleIds.includes(p.id),
      hints: p.hints,
    }));

    const body: HintRequest = {
      campaignTitle: campaign.title,
      sceneTitle: scene.title,
      puzzles,
      requiredPuzzleIds: scene.requiredPuzzleIds,
      completedPuzzleIds,
      wrongAttempts,
      hintsGiven,
      timeRemainingSec,
      secondsSinceMeaningfulProgress,
      priorConviction: conviction,
    };

    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Hint request failed (${res.status})`);
      const data = (await res.json()) as HintResponse;
      setConviction(data.conviction);
      onHint(data.hint);
    } catch {
      onHint("I lost the channel for a second — try that hint again.");
    } finally {
      setLoading(false);
    }
  }

  const pct = Math.round(conviction);

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col gap-1">
        <span
          className="text-[9px] tracking-[0.2em]"
          style={{ color: "var(--dim)" }}
        >
          MIRA {pct}%
        </span>
        <div
          className="h-1.5 w-24 overflow-hidden border"
          style={{ borderColor: "var(--edge)", background: "var(--panel)" }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="MIRA conviction"
        >
          <div
            className="h-full transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%`, background: "var(--lit)" }}
          />
        </div>
      </div>
      <button
        onClick={requestHint}
        disabled={loading}
        className="px-btn px-3 py-2 text-[10px] disabled:opacity-50"
      >
        {loading ? "MIRA…" : "Request hint"}
      </button>
    </div>
  );
}
