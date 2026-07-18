/**
 * Hand landmark helpers for MediaPipe Tasks Vision HandLandmarker.
 * Landmark layout follows the 21-point MediaPipe hand model.
 */

export type Landmark = { x: number; y: number; z?: number };

export type FramingHint =
  | "ok"
  | "too_left"
  | "too_right"
  | "too_close"
  | "too_far"
  | "not_visible"
  | "partial";

export type HandReading = {
  fingerCount: number;
  isFist: boolean;
  isPalm: boolean;
  /** Normalized hand center (0–1, image space). */
  centerX: number;
  centerY: number;
  /** Approx hand span as fraction of frame width. */
  span: number;
};

const TIPS = [4, 8, 12, 16, 20] as const;
const PIPS = [3, 6, 10, 14, 18] as const;

function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** True when a non-thumb finger is extended (tip farther from wrist than PIP). */
function fingerUp(landmarks: Landmark[], finger: number): boolean {
  const tip = landmarks[TIPS[finger]];
  const pip = landmarks[PIPS[finger]];
  const wrist = landmarks[0];
  if (!tip || !pip || !wrist) return false;
  return dist(tip, wrist) > dist(pip, wrist) * 1.12;
}

/** Thumb extension via tip distance past the IP joint relative to index MCP. */
function thumbUp(landmarks: Landmark[]): boolean {
  const tip = landmarks[4];
  const ip = landmarks[3];
  const indexMcp = landmarks[5];
  if (!tip || !ip || !indexMcp) return false;
  return dist(tip, indexMcp) > dist(ip, indexMcp) * 1.08;
}

export function readHand(landmarks: Landmark[]): HandReading {
  let fingerCount = 0;
  if (thumbUp(landmarks)) fingerCount += 1;
  for (let i = 1; i <= 4; i++) {
    if (fingerUp(landmarks, i)) fingerCount += 1;
  }

  const xs = landmarks.map((p) => p.x);
  const ys = landmarks.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    fingerCount,
    isFist: fingerCount === 0,
    isPalm: fingerCount >= 4,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    span: Math.max(maxX - minX, maxY - minY),
  };
}

/** Sum raised fingers across every detected hand (supports answers 6–10). */
export function totalFingers(hands: Landmark[][]): number {
  return hands.reduce((n, h) => n + readHand(h).fingerCount, 0);
}

export function framingFromHands(hands: Landmark[][]): FramingHint {
  if (hands.length === 0) return "not_visible";

  const readings = hands.map(readHand);
  const centerX =
    readings.reduce((s, r) => s + r.centerX, 0) / readings.length;
  const span = Math.max(...readings.map((r) => r.span));

  // Mirror selfie: player-left is high x in the raw frame we draw mirrored.
  if (span > 0.72) return "too_close";
  if (span < 0.12) return "too_far";
  if (centerX < 0.22) return "too_right";
  if (centerX > 0.78) return "too_left";

  const anyPartial = readings.some(
    (r) => r.centerX < 0.08 || r.centerX > 0.92 || r.centerY < 0.05 || r.centerY > 0.95
  );
  if (anyPartial) return "partial";

  return "ok";
}

export function framingMessage(hint: FramingHint): string {
  switch (hint) {
    case "too_left":
      return "Too far left — slide your hand toward the center.";
    case "too_right":
      return "Too far right — slide your hand toward the center.";
    case "too_close":
      return "Too close — move farther from the camera so the whole hand fits.";
    case "too_far":
      return "Too far — move closer until your hand fills the guide.";
    case "partial":
      return "Your hand is partly outside the frame. Adjust and hold.";
    case "not_visible":
      return "No hand detected. Raise a hand inside the guide.";
    default:
      return "Hand in frame. Hold the required gesture.";
  }
}
