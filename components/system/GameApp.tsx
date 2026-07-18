"use client";

import { useCallback, useState } from "react";
import { CampaignResults } from "@/components/campaign/CampaignResults";
import { CampaignSelect } from "@/components/campaign/CampaignSelect";
import { FinalePanel } from "@/components/campaign/FinalePanel";
import { SceneShell } from "@/components/scene/SceneShell";
import { DebugMenu } from "@/components/system/DebugMenu";
import { Timer } from "@/components/system/Timer";
import { getCampaign } from "@/lib/campaigns";
import { useGameStore } from "@/lib/store";
import type { CampaignId } from "@/lib/types";
// Soft demo answers for shell smoke tests; Person B overwrites via registerValidator.
import "@/lib/validators.demo";

/**
 * Person A orchestrator: select → play scenes → finale → win/lose.
 * SceneShell loads any SceneDefinition; content stubs live in lib/campaigns.ts.
 */
export function GameApp() {
  const status = useGameStore((s) => s.status);
  const campaignId = useGameStore((s) => s.campaignId);
  const sceneIndex = useGameStore((s) => s.sceneIndex);
  const selectCampaign = useGameStore((s) => s.selectCampaign);
  const setSceneIndex = useGameStore((s) => s.setSceneIndex);
  const reset = useGameStore((s) => s.reset);

  const [finaleOpen, setFinaleOpen] = useState(false);
  // Prevent double-firing stage completion from the SceneShell effect.
  const [completedSceneIds, setCompletedSceneIds] = useState<string[]>([]);

  const onSelect = (id: CampaignId) => {
    const campaign = getCampaign(id);
    setFinaleOpen(false);
    setCompletedSceneIds([]);
    selectCampaign(id, campaign.durationSec);
  };

  const onStageComplete = useCallback(() => {
    if (!campaignId) return;
    const campaign = getCampaign(campaignId);
    const scene = campaign.scenes[sceneIndex];
    if (!scene || completedSceneIds.includes(scene.id)) return;

    setCompletedSceneIds((prev) => [...prev, scene.id]);

    if (sceneIndex >= campaign.scenes.length - 1) {
      setFinaleOpen(true);
      return;
    }
    setSceneIndex(sceneIndex + 1);
  }, [campaignId, sceneIndex, completedSceneIds, setSceneIndex]);

  if (status === "select") {
    return (
      <>
        <CampaignSelect onSelect={onSelect} />
        <DebugMenu />
      </>
    );
  }

  if (status === "won" || status === "lost") {
    return (
      <>
        <CampaignResults
          status={status}
          campaignId={campaignId}
          onRestart={() => {
            setFinaleOpen(false);
            setCompletedSceneIds([]);
            reset();
          }}
        />
        <DebugMenu />
      </>
    );
  }

  if (!campaignId) {
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-sm text-zinc-500">
        No campaign selected.
      </main>
    );
  }

  const campaign = getCampaign(campaignId);
  const scene = campaign.scenes[sceneIndex];

  if (!scene) {
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-sm text-zinc-500">
        Missing scene at index {sceneIndex}.
      </main>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <SceneShell scene={scene} onStageComplete={onStageComplete} />
      <Timer />
      {finaleOpen ? (
        <FinalePanel campaignId={campaignId} onSolved={() => setFinaleOpen(false)} />
      ) : null}
      <DebugMenu />
    </div>
  );
}
