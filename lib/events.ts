// EVENT BUS (plan.md §5.3)
//
// Thin helper OVER the Zustand store — NOT a second state system.
// emitGameEvent appends to recentActions and updates the counters that MIRA's
// pressure score reads. Person C subscribes to the store to react to events.

import { useGameStore } from "./store";
import type { GameEvent, GameEventType } from "./types";

/** Build a GameEvent, stamping `at` with the current time. */
export function gameEvent(
  type: GameEventType,
  payload?: Record<string, unknown>
): GameEvent {
  return { type, at: Date.now(), payload };
}

/**
 * Record a game event: append it to the store's action log and update the
 * derived counters (wrongAttempts, hintsGiven, secondsSinceMeaningfulProgress).
 * This is the single entry point for telemetry so counters never drift.
 */
export function emitGameEvent(event: GameEvent): void {
  const store = useGameStore.getState();
  store.pushEvent(event);

  switch (event.type) {
    case "wrong_attempt":
      store.incrementWrongAttempts();
      break;
    case "hint_request":
      store.incrementHintsGiven();
      break;
    case "puzzle_complete":
    case "scene_enter":
    case "hotspot_discover":
      // Meaningful progress resets the inactivity pressure clock.
      store.markMeaningfulProgress();
      break;
    default:
      break;
  }
}

/** Convenience: build + emit in one call. */
export function emit(
  type: GameEventType,
  payload?: Record<string, unknown>
): void {
  emitGameEvent(gameEvent(type, payload));
}
