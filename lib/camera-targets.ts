/**
 * Scene 2 biometric targets — each puzzle answer is performed as a hand gesture.
 * Validators still receive the logical answer string (never a gesture name).
 */

export type GestureTarget =
  | { kind: "fingers"; count: number }
  | { kind: "palm" }
  | { kind: "fist" };

export type CameraPuzzleTarget = {
  gesture: GestureTarget;
  /** Value passed to validate() on a successful hold. */
  answer: string;
  /** Shown under the live preview. */
  instruction: string;
  /** Short label for the panel chrome. */
  label: string;
};

/**
 * Map Scene 2 bank IDs → required gestures.
 * Finger counts 1–5 use one hand; 6–10 sum both hands.
 */
export const CAMERA_TARGETS: Record<string, CameraPuzzleTarget> = {
  sf_best_time_stock: {
    gesture: { kind: "fingers", count: 5 },
    answer: "5",
    label: "PROFIT LOCK",
    instruction:
      "Raise fingers equal to the maximum profit (open palm counts as five).",
  },
  sf_unique_path_count: {
    gesture: { kind: "fingers", count: 8 },
    answer: "28",
    label: "ROUTE SEAL",
    instruction:
      "Compute the route count, then raise fingers equal to its ones digit (use both hands for 6–9).",
  },
  sf_valid_parens: {
    gesture: { kind: "fingers", count: 1 },
    answer: "1",
    label: "BRACKET CHECK",
    instruction:
      "If the pattern is valid raise one finger; otherwise raise fingers for the break index.",
  },
  ny_coin_flip_ev: {
    gesture: { kind: "fingers", count: 2 },
    answer: "2",
    label: "FLIP EXPECTATION",
    instruction: "Raise fingers equal to the expected number of flips.",
  },
  ny_balls_no_replace: {
    gesture: { kind: "fingers", count: 3 },
    answer: "3",
    label: "TOKEN DRAW",
    instruction: "Raise fingers equal to the numerator over 28.",
  },
  ny_monty_reveal: {
    gesture: { kind: "palm" },
    answer: "SWITCH",
    label: "VAULT STRATEGY",
    instruction:
      "Open palm = SWITCH. Closed fist = STAY. Hold your choice steady in the guide.",
  },
};

export function cameraTargetFor(puzzleId: string): CameraPuzzleTarget | null {
  return CAMERA_TARGETS[puzzleId] ?? null;
}

export function describeGesture(gesture: GestureTarget): string {
  if (gesture.kind === "palm") return "Open palm";
  if (gesture.kind === "fist") return "Closed fist";
  if (gesture.count === 0) return "Closed fist (0 fingers)";
  if (gesture.count === 5) return "Five fingers / open palm";
  if (gesture.count > 5) return `${gesture.count} fingers total (both hands)`;
  return `${gesture.count} finger${gesture.count === 1 ? "" : "s"}`;
}
