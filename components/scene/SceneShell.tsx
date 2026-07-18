"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CampaignDefinition, PuzzleDefinition } from "@/lib/types";
import { VIEW_ORDER, puzzleForView } from "@/lib/campaigns";
import { isStageSolved, stageHint } from "@/lib/progress";
import { buildResponse, computePressure } from "@/lib/mira";
import { useGameStore } from "@/lib/store";
import { emit } from "@/lib/events";
import { PanoramaView } from "./PanoramaView";
import { NavigationArrows } from "./NavigationArrows";
import { FinaleRoom } from "./FinaleRoom";
import { TopBar } from "../system/TopBar";
import { DigitTray } from "../system/DigitTray";
import { MiraCaption } from "../game-master/MiraCaption";
import { MiraChat } from "../game-master/MiraChat";
import { PuzzleModal } from "../puzzles/PuzzleModal";
import { MarketMakerFinale } from "../puzzles/MarketMakerFinale";

/** Pressure above this, with a cooldown elapsed, triggers an unsolicited nudge. */
const NUDGE_PRESSURE = 0.45;
const NUDGE_COOLDOWN_SEC = 45;

/** NYC stage 3 is a single market-making desk, not a numeric terminal. */
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
  const wrongAttempts = useGameStore((s) => s.wrongAttempts);
  const idleSec = useGameStore((s) => s.secondsSinceMeaningfulProgress);
  const status = useGameStore((s) => s.status);
  const setStatus = useGameStore((s) => s.setStatus);

  const [openPuzzle, setOpenPuzzle] = useState<PuzzleDefinition | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [inFinale, setInFinale] = useState(false);
  const [sceneElapsed, setSceneElapsed] = useState(0);
  const lastNudgeRef = useRef(0);

  const scene = campaign.scenes[sceneIndex];
  const viewIndex = VIEW_ORDER.indexOf(view);
  const stageSolved = isStageSolved(scene, completedPuzzleIds);
  const isLastScene = sceneIndex === campaign.scenes.length - 1;
  const isNyc = campaign.id === "new-york-quant";
  const marketOpen = isMarketPuzzle(openPuzzle);
  const isMarketScene =
    scene.requiredPuzzleIds.length === 1 && isMarketPuzzle(scene.puzzles[0]);
  const activePuzzle = openPuzzle ?? puzzleForView(scene, view);

  const pressure = useMemo(
    () =>
      computePressure({
        secondsSinceMeaningfulProgress: idleSec,
        wrongAttempts,
        timeRemainingSec,
        totalCampaignSec: campaign.durationSec,
        sceneElapsedSec: sceneElapsed,
        expectedSceneDurationSec: scene.expectedDurationSec,
      }),
    [idleSec, wrongAttempts, timeRemainingSec, campaign.durationSec, sceneElapsed, scene.expectedDurationSec]
  );

  // --- Timer -------------------------------------------------
  useEffect(() => {
    if (status !== "playing") return;
    const id = window.setInterval(() => {
      tickTimer(1);
      setSceneElapsed((n) => n + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [status, tickTimer]);

  // --- Scene entry -------------------------------------------
  // Scene-scoped state resets during render rather than in an effect, so
  // changing location does not cause a second pass with stale values.
  const [prevSceneId, setPrevSceneId] = useState(scene.id);
  if (prevSceneId !== scene.id) {
    setPrevSceneId(scene.id);
    setSceneElapsed(0);
    setInFinale(false);
    setCaption(
      isMarketScene
        ? `${scene.title}. Face centre and activate the Exchange Desk — MIRA is waiting on the other side of the book.`
        : `${scene.title}. Three terminals here — turn to find them all.`
    );
  }

  // Telemetry, the nudge cooldown and the view reset are side effects.
  useEffect(() => {
    lastNudgeRef.current = 0;
    emit("scene_enter", { sceneId: scene.id });
    // The market desk is the only interactive wall — land facing it.
    if (isMarketScene) setView("center");
  }, [scene.id, isMarketScene, setView]);

  // DebugMenu: jump to NYC stage 3 and open the centre market panel.
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

  // --- Unsolicited nudges (local telemetry only, never the model) ---
  useEffect(() => {
    if (status !== "playing" || openPuzzle || inFinale) return;
    if (pressure < NUDGE_PRESSURE) return;
    if (sceneElapsed - lastNudgeRef.current < NUDGE_COOLDOWN_SEC) return;

    lastNudgeRef.current = sceneElapsed;
    const reply = buildResponse({ puzzle: activePuzzle, pressure, seed: sceneElapsed });
    emit("mira_trigger", { pressure, hintLevel: reply.hintLevel });
    setCaption(reply.message);
  }, [pressure, sceneElapsed, status, openPuzzle, inFinale, activePuzzle]);

  const rotate = useCallback(
    (delta: number) => {
      const next = viewIndex + delta;
      if (next < 0 || next >= VIEW_ORDER.length) return;
      setView(VIEW_ORDER[next]);
    },
    [viewIndex, setView]
  );

  // Panorama rotation is suspended whenever a puzzle, the chat or the finale
  // owns the keyboard — otherwise typing an answer would also spin the room.
  useEffect(() => {
    if (openPuzzle || inFinale) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") rotate(-1);
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") rotate(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPuzzle, inFinale, rotate]);

  function handleSolved(puzzleId: string) {
    completePuzzle(puzzleId);
    setOpenPuzzle(null);

    const nowComplete = [...completedPuzzleIds, puzzleId];
    if (isStageSolved(scene, nowComplete)) {
      setCaption(
        `Stage clear. Recovered digit: ${stageHint(scene)}. ${
          isLastScene ? "That completes the code." : "Route open to the next location."
        }`
      );
    } else {
      const left = scene.requiredPuzzleIds.filter((id) => !nowComplete.includes(id)).length;
      setCaption(`Logged. ${left} more terminal${left === 1 ? "" : "s"} on this floor.`);
    }
  }

  // SF ends in the full-screen lock room. NYC wins inside the market panel.
  if (inFinale && !isNyc) {
    return (
      <div className="flex h-full flex-col" data-campaign={campaign.id}>
        <TopBar
          campaign={campaign}
          scene={scene}
          sceneIndex={sceneIndex}
          timeRemainingSec={timeRemainingSec}
          onExit={onExit}
        />
        <FinaleRoom
          campaign={campaign}
          onWin={() => setStatus("won")}
          onBack={() => setInFinale(false)}
        />
      </div>
    );
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
            <button
              onClick={() => setSceneIndex(sceneIndex + 1)}
              className="px-btn px-3 py-2 text-[10px]"
              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
            >
              Next location ▶
            </button>
          )}
          {/* SF only: the digit-code lock. NYC wins inside the market panel. */}
          {stageSolved && isLastScene && !isNyc && (
            <button
              onClick={() => setInFinale(true)}
              className="px-btn px-3 py-2 text-[10px]"
              style={{ borderColor: "var(--lit)", color: "var(--lit)" }}
            >
              Enter the lock ▶
            </button>
          )}
          <MiraChat
            key={scene.id}
            sceneId={scene.id}
            onHint={(message) => setCaption(message)}
          />
        </div>
      </footer>
    </div>
  );
}
