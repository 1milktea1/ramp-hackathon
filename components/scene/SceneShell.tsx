"use client";

import { useCallback, useEffect, useState } from "react";
import type { CampaignDefinition, PuzzleDefinition } from "@/lib/types";
import { VIEW_ORDER } from "@/lib/campaigns";
import { isStageSolved, stageHint } from "@/lib/progress";
import { useGameStore } from "@/lib/store";
import { emit } from "@/lib/events";
import { PanoramaView } from "./PanoramaView";
import { NavigationArrows } from "./NavigationArrows";
import { TopBar } from "../system/TopBar";
import { DigitTray } from "../system/DigitTray";
import { MiraCaption } from "../game-master/MiraCaption";
import { PuzzleModal } from "../puzzles/PuzzleModal";
import { FinalePanel } from "../campaign/FinalePanel";
import { MarketMakerFinale } from "../puzzles/MarketMakerFinale";

function isMarketPuzzle(puzzle: PuzzleDefinition | null): boolean {
  return puzzle?.validatorKey === "ny-finale-market";
}

export function SceneShell({
  campaign,
  onExit,
}: {
  campaign: CampaignDefinition;
  onExit: () => void;
}) {
  const view = useGameStore((s) => s.view);
  const setView = useGameStore((s) => s.setView);
  const sceneIndex = useGameStore((s) => s.sceneIndex);
  const setSceneIndex = useGameStore((s) => s.setSceneIndex);
  const completedPuzzleIds = useGameStore((s) => s.completedPuzzleIds);
  const completePuzzle = useGameStore((s) => s.completePuzzle);
  const timeRemainingSec = useGameStore((s) => s.timeRemainingSec);
  const tickTimer = useGameStore((s) => s.tickTimer);
  const status = useGameStore((s) => s.status);

  const [openPuzzle, setOpenPuzzle] = useState<PuzzleDefinition | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [finaleOpen, setFinaleOpen] = useState(false);

  const scene = campaign.scenes[sceneIndex];
  const viewIndex = VIEW_ORDER.indexOf(view);
  const stageSolved = isStageSolved(scene, completedPuzzleIds);
  const isLastScene = sceneIndex === campaign.scenes.length - 1;
  const isNyc = campaign.id === "new-york-quant";
  const marketOpen = isMarketPuzzle(openPuzzle);

  // --- Timer -------------------------------------------------
  useEffect(() => {
    if (status !== "playing") return;
    const id = window.setInterval(() => tickTimer(1), 1000);
    return () => window.clearInterval(id);
  }, [status, tickTimer]);

  // --- Scene entry -------------------------------------------
  useEffect(() => {
    emit("scene_enter", { sceneId: scene.id });
    if (scene.requiredPuzzleIds.length === 1 && isMarketPuzzle(scene.puzzles[0])) {
      setCaption(
        `${scene.title}. Face center and activate the Exchange Desk — MIRA is waiting on the other side of the book.`
      );
      // Land on the only interactive wall.
      setView("center");
    } else {
      setCaption(`${scene.title}. Three terminals here — turn to find them all.`);
    }
  }, [scene.id, scene.title, scene.requiredPuzzleIds.length, scene.puzzles, setView]);

  // DebugMenu: jump to NYC stage 3 and open the center market panel.
  useEffect(() => {
    if (!isNyc) return;
    const open = () => {
      const last = campaign.scenes[campaign.scenes.length - 1];
      const market =
        last.puzzles.find((p) => p.validatorKey === "ny-finale-market") ?? null;
      setSceneIndex(campaign.scenes.length - 1);
      setView("center");
      if (market) {
        setOpenPuzzle(market);
        setCaption(
          "Lower Manhattan Exchange. Make markets — I'll answer Buy, Sell, or Hold."
        );
      }
    };
    window.addEventListener("debug-open-nyc-finale", open);
    return () => window.removeEventListener("debug-open-nyc-finale", open);
  }, [isNyc, campaign, setSceneIndex, setView]);

  const rotate = useCallback(
    (delta: number) => {
      const next = viewIndex + delta;
      if (next < 0 || next >= VIEW_ORDER.length) return;
      setView(VIEW_ORDER[next]);
    },
    [viewIndex, setView]
  );

  // Suspend panorama keys while any panel owns the keyboard.
  useEffect(() => {
    if (openPuzzle || finaleOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") rotate(-1);
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") rotate(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPuzzle, finaleOpen, rotate]);

  function handleSolved(puzzleId: string) {
    completePuzzle(puzzleId);
    setOpenPuzzle(null);

    const nowComplete = [...completedPuzzleIds, puzzleId];
    if (isStageSolved(scene, nowComplete)) {
      const endLine = isLastScene
        ? "That completes the code."
        : "Moving to the next location.";
      setCaption(
        `Stage clear. Recovered digit: ${stageHint(scene)}. ${endLine}`
      );
    } else {
      const remaining =
        scene.requiredPuzzleIds.length -
        nowComplete.filter((id) => scene.requiredPuzzleIds.includes(id)).length;
      setCaption(
        remaining === 1
          ? "Logged. One terminal left on this floor."
          : "Logged. Two more terminals on this floor."
      );
    }
  }

  function advance() {
    if (isLastScene) return;
    setSceneIndex(sceneIndex + 1);
  }

  return (
    <div
      className="flex h-full flex-col"
      data-campaign={campaign.id}
      style={{ background: "var(--ink)" }}
    >
      <TopBar
        campaign={campaign}
        scene={scene}
        sceneIndex={sceneIndex}
        timeRemainingSec={timeRemainingSec}
        onExit={onExit}
      />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <PanoramaView
          scene={scene}
          view={view}
          completedPuzzleIds={completedPuzzleIds}
          onOpenPuzzle={(p) => setOpenPuzzle(p)}
        />

        <NavigationArrows
          onLeft={() => rotate(-1)}
          onRight={() => rotate(1)}
          canLeft={viewIndex > 0}
          canRight={viewIndex < VIEW_ORDER.length - 1}
        />

        <MiraCaption message={caption} onDismiss={() => setCaption(null)} />

        {marketOpen && openPuzzle && (
          <MarketMakerFinale onClose={() => setOpenPuzzle(null)} />
        )}

        {openPuzzle && !marketOpen && (
          <PuzzleModal
            puzzle={openPuzzle}
            onSolved={handleSolved}
            onClose={() => setOpenPuzzle(null)}
          />
        )}

        {finaleOpen && !isNyc && (
          <FinalePanel
            campaignId={campaign.id}
            onClose={() => setFinaleOpen(false)}
          />
        )}
      </div>

      <footer
        className="flex items-center justify-between gap-4 border-t-2 px-4 py-2"
        style={{ borderColor: "var(--edge)" }}
      >
        <DigitTray
          scenes={campaign.scenes}
          completedPuzzleIds={completedPuzzleIds}
          currentSceneIndex={sceneIndex}
        />

        <div className="flex gap-2">
          {stageSolved && !isLastScene && (
            <button onClick={advance} className="px-btn px-3 py-2 text-[10px]">
              Next location ▶
            </button>
          )}
          {/* SF only: digit-code lock. NYC wins inside the market panel. */}
          {stageSolved && isLastScene && !isNyc && (
            <button
              onClick={() => setFinaleOpen(true)}
              className="px-btn px-3 py-2 text-[10px]"
            >
              Enter final code ▶
            </button>
          )}
          <button
            onClick={() => emit("hint_request", { sceneId: scene.id })}
            className="px-btn px-3 py-2 text-[10px]"
          >
            Request hint
          </button>
        </div>
      </footer>
    </div>
  );
}
