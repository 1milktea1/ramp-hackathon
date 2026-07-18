"use client";

import { useState } from "react";
import { SceneShell } from "@/components/scene/SceneShell";
import { ResultsScreen } from "@/components/system/ResultsScreen";
import { DebugMenu } from "@/components/system/DebugMenu";
import { CAMPAIGN_LIST, getCampaign } from "@/lib/campaigns";
import { preloadHandLandmarker } from "@/lib/mediapipe-hands";
import { useGameStore } from "@/lib/store";
import type { CampaignId } from "@/lib/types";
import "@/lib/validators.answers";

export default function Home() {
  const campaignId = useGameStore((s) => s.campaignId);
  const status = useGameStore((s) => s.status);
  const selectCampaign = useGameStore((s) => s.selectCampaign);
  const reset = useGameStore((s) => s.reset);
  const [hovered, setHovered] = useState<CampaignId | null>(null);

  // Won or lost — the timer sets "lost" itself, so this also catches expiry.
  if (campaignId && (status === "won" || status === "lost")) {
    const campaign = getCampaign(campaignId);
    return (
      <>
        <ResultsScreen
          campaign={campaign}
          won={status === "won"}
          onRestart={() => selectCampaign(campaign.id, campaign.durationSec)}
          onExit={reset}
        />
        <DebugMenu />
      </>
    );
  }

  if (campaignId && status === "playing") {
    return (
      <>
        <SceneShell campaign={getCampaign(campaignId)} onExit={reset} />
        <DebugMenu />
      </>
    );
  }

  return (
    <>
      <main className="grid flex-1 place-items-center p-6">
        <div className="w-full max-w-3xl">
          <p
            className="text-[10px] tracking-[0.4em]"
            style={{ color: "var(--dim)" }}
          >
            EXIT CODE
          </p>
          <h1 className="mb-1 text-4xl font-bold tracking-tight">CITYWIDE</h1>
          <p className="mb-8 text-xs" style={{ color: "var(--dim)" }}>
            Pick a city. Three stages, three terminals each. Recover the code
            before the clock runs out.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {CAMPAIGN_LIST.map((c) => (
              <button
                key={c.id}
                type="button"
                data-campaign={c.id}
                onMouseEnter={() => setHovered(c.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => {
                  // Warm the on-device hand model before Scene 2 biometrics.
                  void preloadHandLandmarker().catch(() => {});
                  selectCampaign(c.id, c.durationSec);
                }}
                className="px-border px-scan p-5 text-left"
                style={{
                  background: "var(--panel)",
                  borderColor:
                    hovered === c.id ? "var(--accent)" : "var(--edge)",
                }}
              >
                <p
                  className="text-[9px] tracking-[0.25em]"
                  style={{ color: "var(--accent)" }}
                >
                  {c.city.toUpperCase()}
                </p>
                <p className="mb-2 text-xl font-bold">{c.title}</p>
                <p
                  className="mb-4 text-[11px] leading-relaxed"
                  style={{ color: "var(--dim)" }}
                >
                  {c.subtitle}
                </p>
                <p
                  className="text-[9px] tracking-[0.2em]"
                  style={{ color: "var(--dim)" }}
                >
                  {c.scenes.length} STAGES · {c.durationSec / 60} MIN
                </p>
              </button>
            ))}
          </div>
        </div>
      </main>
      <DebugMenu />
    </>
  );
}
