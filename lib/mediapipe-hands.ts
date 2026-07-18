/**
 * Browser-side MediaPipe HandLandmarker loader.
 * Models download from the CDN once per session; inference stays on-device.
 * Dynamic-imports the Tasks Vision package so SSR never touches it.
 */

type HandLandmarker = import("@mediapipe/tasks-vision").HandLandmarker;
type HandLandmarkerResult = import("@mediapipe/tasks-vision").HandLandmarkerResult;

const WASM_ROOT =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

let landmarkerPromise: Promise<HandLandmarker> | null = null;

export function preloadHandLandmarker(): Promise<HandLandmarker> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Hand landmarker is browser-only"));
  }
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const visionMod = await import("@mediapipe/tasks-vision");
      const vision = await visionMod.FilesetResolver.forVisionTasks(WASM_ROOT);
      const options = {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "GPU" as const,
        },
        runningMode: "VIDEO" as const,
        numHands: 2,
        minHandDetectionConfidence: 0.55,
        minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.5,
      };
      try {
        return await visionMod.HandLandmarker.createFromOptions(vision, options);
      } catch {
        return visionMod.HandLandmarker.createFromOptions(vision, {
          ...options,
          baseOptions: { ...options.baseOptions, delegate: "CPU" },
        });
      }
    })().catch((err) => {
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}

export async function detectHands(
  video: HTMLVideoElement,
  timestampMs: number
): Promise<HandLandmarkerResult | null> {
  const landmarker = await preloadHandLandmarker();
  if (video.readyState < 2) return null;
  return landmarker.detectForVideo(video, timestampMs);
}
