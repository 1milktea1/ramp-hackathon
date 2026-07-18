// SINGLE SOURCE OF TRUTH (plan.md §5.3, §5.4)
//
// The Zustand store is the ONE state system. Do not create a parallel
// GameMasterContext that can drift — build MIRA context by projecting this
// store (see buildGameMasterContext).

import { create } from "zustand";
import type {
  CampaignId,
  GameEvent,
  GameMasterContext,
  ViewDirection,
} from "./types";

export type GameStatus = "select" | "playing" | "won" | "lost";

export type CampaignState = {
  // --- Fields (plan.md §5.4) ---
  campaignId: CampaignId | null;
  sceneIndex: number;
  view: ViewDirection;
  discoveredHotspots: string[];
  completedPuzzleIds: string[];
  inventory: string[];
  timeRemainingSec: number;
  wrongAttempts: number;
  hintsGiven: number;
  secondsSinceMeaningfulProgress: number;
  recentActions: GameEvent[];
  status: GameStatus;

  // --- Actions: mutate through this API, not ad-hoc ---
  selectCampaign: (campaignId: CampaignId, durationSec: number) => void;
  setView: (view: ViewDirection) => void;
  setSceneIndex: (sceneIndex: number) => void;
  discoverHotspot: (hotspotId: string) => void;
  completePuzzle: (puzzleId: string) => void;
  addItem: (item: string) => void;
  tickTimer: (deltaSec?: number) => void;
  incrementWrongAttempts: () => void;
  incrementHintsGiven: () => void;
  markMeaningfulProgress: () => void;
  pushEvent: (event: GameEvent) => void;
  setStatus: (status: GameStatus) => void;
  reset: () => void;
};

const initialState = {
  campaignId: null as CampaignId | null,
  sceneIndex: 0,
  view: "center" as ViewDirection,
  discoveredHotspots: [] as string[],
  completedPuzzleIds: [] as string[],
  inventory: [] as string[],
  timeRemainingSec: 0,
  wrongAttempts: 0,
  hintsGiven: 0,
  secondsSinceMeaningfulProgress: 0,
  recentActions: [] as GameEvent[],
  status: "select" as GameStatus,
};

// Keep the action log bounded so it never grows unbounded during a session.
const MAX_RECENT_ACTIONS = 50;

export const useGameStore = create<CampaignState>((set) => ({
  ...initialState,

  selectCampaign: (campaignId, durationSec) =>
    set({
      ...initialState,
      campaignId,
      timeRemainingSec: durationSec,
      status: "playing",
    }),

  setView: (view) => set({ view }),

  setSceneIndex: (sceneIndex) =>
    set({ sceneIndex, view: "center", secondsSinceMeaningfulProgress: 0 }),

  discoverHotspot: (hotspotId) =>
    set((s) =>
      s.discoveredHotspots.includes(hotspotId)
        ? s
        : { discoveredHotspots: [...s.discoveredHotspots, hotspotId] }
    ),

  completePuzzle: (puzzleId) =>
    set((s) =>
      s.completedPuzzleIds.includes(puzzleId)
        ? s
        : {
            completedPuzzleIds: [...s.completedPuzzleIds, puzzleId],
            secondsSinceMeaningfulProgress: 0,
          }
    ),

  addItem: (item) =>
    set((s) =>
      s.inventory.includes(item) ? s : { inventory: [...s.inventory, item] }
    ),

  tickTimer: (deltaSec = 1) =>
    set((s) => {
      const timeRemainingSec = Math.max(0, s.timeRemainingSec - deltaSec);
      return {
        timeRemainingSec,
        secondsSinceMeaningfulProgress:
          s.secondsSinceMeaningfulProgress + deltaSec,
        status: timeRemainingSec === 0 && s.status === "playing" ? "lost" : s.status,
      };
    }),

  incrementWrongAttempts: () =>
    set((s) => ({ wrongAttempts: s.wrongAttempts + 1 })),

  incrementHintsGiven: () => set((s) => ({ hintsGiven: s.hintsGiven + 1 })),

  markMeaningfulProgress: () => set({ secondsSinceMeaningfulProgress: 0 }),

  pushEvent: (event) =>
    set((s) => ({
      recentActions: [...s.recentActions, event].slice(-MAX_RECENT_ACTIONS),
    })),

  setStatus: (status) => set({ status }),

  reset: () => set({ ...initialState }),
}));

/**
 * Project the store into a GameMasterContext for POST /api/mira (plan.md §5.3).
 * Callers supply per-scene/puzzle details the flat store does not track.
 */
export function buildGameMasterContext(args: {
  sceneId: string;
  puzzleId?: string | null;
  totalCampaignSec: number;
  sceneElapsedSec: number;
  puzzleElapsedSec: number;
  requiredHotspotsRemaining?: string[];
  currentInteractionState?: Record<string, unknown>;
  cameraState?: GameMasterContext["cameraState"];
  playerMessage?: string;
}): GameMasterContext {
  const s = useGameStore.getState();
  if (!s.campaignId) {
    throw new Error("buildGameMasterContext called before a campaign was selected");
  }
  return {
    campaignId: s.campaignId,
    sceneId: args.sceneId,
    puzzleId: args.puzzleId ?? null,
    totalTimeRemainingSec: s.timeRemainingSec,
    sceneElapsedSec: args.sceneElapsedSec,
    puzzleElapsedSec: args.puzzleElapsedSec,
    wrongAttempts: s.wrongAttempts,
    hintsGiven: s.hintsGiven,
    secondsSinceMeaningfulProgress: s.secondsSinceMeaningfulProgress,
    discoveredHotspots: s.discoveredHotspots,
    requiredHotspotsRemaining: args.requiredHotspotsRemaining ?? [],
    collectedItems: s.inventory,
    completedPuzzleIds: s.completedPuzzleIds,
    recentActions: s.recentActions,
    currentInteractionState: args.currentInteractionState ?? {},
    cameraState: args.cameraState,
    playerMessage: args.playerMessage,
  };
}
