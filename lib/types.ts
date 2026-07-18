// FROZEN INTERFACE CONTRACT (plan.md §5.1)
// Do not refactor these shapes after the hour-0.5 freeze. Every workstream
// (A: Engine/Shell, B: Puzzles/Content, C: MIRA, D: Media/Hardware) imports from here.

export type CampaignId = "san-francisco-swe" | "new-york-quant";

export type CampaignDefinition = {
  id: CampaignId;
  title: string;
  subtitle: string;
  city: string;
  durationSec: number;
  topicWeights: {
    softwareEngineering: number;
    mathematics: number;
    probability: number;
    logic: number;
    physical: number;
  };
  scenes: SceneDefinition[];
};

export type SceneDefinition = {
  id: string;
  title: string;
  locationLabel: string;
  expectedDurationSec: number;
  backgrounds: {
    left: string;
    center: string;
    right: string;
  };
  overlays: AnimatedOverlay[];
  hotspots: HotspotDefinition[];
  puzzles: PuzzleDefinition[];
  requiredPuzzleIds: string[];
  transition: TransitionDefinition;
};

export type PuzzleCategory =
  | "array"
  | "data_structure"
  | "probability"
  | "math"
  | "logic"
  | "observation"
  | "story"
  | "physical";

export type PuzzleInteraction =
  | "text"
  | "numeric"
  | "keyboard_sequence"
  | "key_hold"
  | "drag"
  | "slider"
  | "clipboard"
  | "camera"
  | "microphone"
  | "timed_key"
  | "object_selection";

export type PuzzleDefinition = {
  id: string;
  category: PuzzleCategory;
  interaction: PuzzleInteraction;
  prompt: string;
  validatorKey: string;
  expectedDurationSec: number;
  hints: {
    level1: string;
    level2: string;
    level3: string;
    level4: string;
  };
};

// --- Supporting scene types (minimal stubs; owners may extend fields only,
// never rename/remove existing ones, per the freeze). ---

export type ViewDirection = "left" | "center" | "right";

export type HotspotDefinition = {
  id: string;
  view: ViewDirection;
  label: string;
  // Percentage-based bounding box so backgrounds can be responsive.
  x: number;
  y: number;
  width: number;
  height: number;
  puzzleId?: string;
  required?: boolean;
};

export type AnimatedOverlay = {
  id: string;
  view: ViewDirection;
  kind: string; // e.g. "fog", "ticker", "led-blink" — owner D defines the vocabulary
  asset?: string;
};

export type TransitionDefinition = {
  kind: "slide" | "fade" | "cut";
  durationMs: number;
  nextSceneId?: string;
};

// --- Events (plan.md §5.3) ---

export type GameEventType =
  | "scene_enter"
  | "hotspot_discover"
  | "answer_submit"
  | "wrong_attempt"
  | "puzzle_complete"
  | "hint_request"
  | "camera_fail"
  | "idle_timeout"
  | "mira_trigger";

export type GameEvent = {
  type: GameEventType;
  at: number; // Date.now()
  payload?: Record<string, unknown>;
};

// --- Game Master (plan.md §5.1) ---

export type GameMasterContext = {
  campaignId: CampaignId;
  sceneId: string;
  puzzleId: string | null;
  totalTimeRemainingSec: number;
  sceneElapsedSec: number;
  puzzleElapsedSec: number;
  wrongAttempts: number;
  hintsGiven: number;
  secondsSinceMeaningfulProgress: number;
  discoveredHotspots: string[];
  requiredHotspotsRemaining: string[];
  collectedItems: string[];
  completedPuzzleIds: string[];
  recentActions: GameEvent[];
  currentInteractionState: Record<string, unknown>;
  cameraState?: {
    permission: "unknown" | "granted" | "denied";
    targetGesture: string | null;
    confidence: number | null;
    failureReason: string | null;
  };
  playerMessage?: string;
};

export type GameMasterResponse = {
  responseType:
    | "caption"
    | "chat"
    | "automatic_hint"
    | "camera_guidance"
    | "warning";
  message: string;
  hintLevel: 0 | 1 | 2 | 3 | 4;
  focusTargetId: string | null;
  urgency: "calm" | "focused" | "urgent" | "critical";
  visualEffect: "none" | "pulse" | "glitch" | "highlight" | "timer_warning";
};
