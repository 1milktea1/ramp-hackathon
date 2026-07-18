"use client";

import { useEffect, useRef, useState } from "react";
import type { PuzzleDefinition } from "@/lib/types";
import {
  cameraTargetFor,
  describeGesture,
  type CameraPuzzleTarget,
} from "@/lib/camera-targets";
import {
  framingFromHands,
  framingMessage,
  readHand,
  type FramingHint,
  type Landmark,
} from "@/lib/hand-gestures";
import { detectHands, preloadHandLandmarker } from "@/lib/mediapipe-hands";
import { emit } from "@/lib/events";
import { validate } from "@/lib/validators";

const HOLD_MS = 3000;
const SPACE_HOLD_MS = 2000;
const WRONG_HOLD_MS = 3000;

type LiveStatus = {
  confidence: number;
  framing: FramingHint;
  detectedLabel: string;
  match: boolean;
};

function gestureMatches(
  target: CameraPuzzleTarget,
  hands: Landmark[][]
): { match: boolean; detectedLabel: string; altAnswer?: string } {
  if (hands.length === 0) {
    return { match: false, detectedLabel: "—" };
  }

  // Finger answers are one-hand only (max five). Prefer the hand with more fingers up.
  const readings = hands.map(readHand);
  const primary = readings.reduce((best, h) =>
    h.fingerCount > best.fingerCount ? h : best
  );
  const fingers = Math.min(5, primary.fingerCount);

  if (target.gesture.kind === "palm") {
    if (primary.isPalm) {
      return { match: true, detectedLabel: "Open palm", altAnswer: "SWITCH" };
    }
    if (primary.isFist) {
      return { match: false, detectedLabel: "Fist", altAnswer: "STAY" };
    }
    return {
      match: false,
      detectedLabel: `${fingers} finger${fingers === 1 ? "" : "s"}`,
    };
  }

  if (target.gesture.kind === "fist") {
    return {
      match: primary.isFist,
      detectedLabel: primary.isFist ? "Fist" : `${fingers} fingers`,
      altAnswer: primary.isFist ? target.answer : String(fingers),
    };
  }

  const need = Math.min(5, target.gesture.count);
  const match = fingers === need;
  return {
    match,
    detectedLabel: `${fingers} finger${fingers === 1 ? "" : "s"}`,
    altAnswer: String(fingers),
  };
}

/**
 * Live MediaPipe hand panel (README § MediaPipe / visual answers).
 * Hold the target gesture ~3s to submit. Space-hold (2s) is the fallback.
 */
export function CameraPuzzle({
  puzzle,
  onSolved,
  onClose,
}: {
  puzzle: PuzzleDefinition;
  onSolved: (puzzleId: string) => void;
  onClose: () => void;
}) {
  const target = cameraTargetFor(puzzle.id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number>(0);
  const matchSinceRef = useRef<number | null>(null);
  const wrongSinceRef = useRef<number | null>(null);
  const spaceSinceRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [spaceProgress, setSpaceProgress] = useState(0);
  const [status, setStatus] = useState<LiveStatus>({
    confidence: 0,
    framing: "not_visible",
    detectedLabel: "—",
    match: false,
  });
  const [shake, setShake] = useState(false);
  const [verified, setVerified] = useState(false);

  function submitAnswer(answer: string) {
    if (submittedRef.current) return;
    emit("answer_submit", { puzzleId: puzzle.id, answer });

    if (validate(puzzle.validatorKey, answer)) {
      submittedRef.current = true;
      setVerified(true);
      emit("puzzle_complete", { puzzleId: puzzle.id });
      window.setTimeout(() => onSolved(puzzle.id), 450);
      return;
    }

    emit("wrong_attempt", { puzzleId: puzzle.id, answer });
    setShake(true);
    setHoldProgress(0);
    matchSinceRef.current = null;
    wrongSinceRef.current = null;
    window.setTimeout(() => setShake(false), 320);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Space-hold fallback (2s) — README keyboard alternative when camera fails.
  useEffect(() => {
    if (!target || verified) return;

    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      e.preventDefault();
      spaceSinceRef.current = performance.now();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      spaceSinceRef.current = null;
      setSpaceProgress(0);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [target, verified]);

  useEffect(() => {
    if (!target) return;

    let stream: MediaStream | null = null;
    let cancelled = false;
    let cameraLive = false;

    const pumpSpace = (now: number): boolean => {
      if (spaceSinceRef.current == null) {
        setSpaceProgress(0);
        return false;
      }
      const sp = Math.min(1, (now - spaceSinceRef.current) / SPACE_HOLD_MS);
      setSpaceProgress(sp);
      if (sp >= 1) {
        submitAnswer(target.answer);
        return true;
      }
      return false;
    };

    const tick = async () => {
      if (cancelled || submittedRef.current) return;
      const now = performance.now();
      if (pumpSpace(now)) return;

      const videoEl = videoRef.current;
      if (cameraLive && videoEl) {
        try {
          const result = await detectHands(videoEl, now);
          const hands = (result?.landmarks ?? []) as Landmark[][];
          const framing = framingFromHands(hands);
          const { match, detectedLabel, altAnswer } = gestureMatches(
            target,
            hands
          );
          const confidence =
            hands.length === 0
              ? 0
              : Math.min(
                  0.98,
                  0.45 +
                    hands.length * 0.15 +
                    (framing === "ok" ? 0.25 : 0) +
                    (match ? 0.2 : 0)
                );

          setStatus({
            confidence,
            framing,
            detectedLabel,
            match,
          });

          if (match && framing !== "not_visible") {
            wrongSinceRef.current = null;
            if (matchSinceRef.current == null) matchSinceRef.current = now;
            const held = now - matchSinceRef.current;
            setHoldProgress(Math.min(1, held / HOLD_MS));
            if (held >= HOLD_MS) {
              submitAnswer(target.answer);
              return;
            }
          } else {
            matchSinceRef.current = null;
            setHoldProgress(0);

            // Holding a clear wrong complete gesture (e.g. fist vs palm) counts as an attempt.
            const wrongComplete =
              altAnswer != null &&
              altAnswer !== target.answer &&
              hands.length > 0 &&
              (target.gesture.kind === "palm"
                ? altAnswer === "STAY"
                : target.gesture.kind === "fingers" &&
                  Number(altAnswer) !== target.gesture.count &&
                  Number(altAnswer) > 0);

            if (wrongComplete) {
              if (wrongSinceRef.current == null) wrongSinceRef.current = now;
              if (now - wrongSinceRef.current >= WRONG_HOLD_MS) {
                wrongSinceRef.current = null;
                submitAnswer(altAnswer!);
              }
            } else {
              wrongSinceRef.current = null;
            }
          }
        } catch {
          // Transient detect errors — keep looping.
        }
      }

      rafRef.current = requestAnimationFrame(() => {
        void tick();
      });
    };

    rafRef.current = requestAnimationFrame(() => {
      void tick();
    });

    (async () => {
      try {
        await preloadHandLandmarker();
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        cameraLive = true;
        setReady(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Camera unavailable";
        setError(message);
        emit("camera_fail", { puzzleId: puzzle.id, reason: message });
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per puzzle
  }, [puzzle.id, target]);

  if (!target) {
    return (
      <div className="absolute inset-0 z-30 grid place-items-center p-6" style={{ background: "rgba(6,8,12,0.86)" }}>
        <div className="px-border p-5" style={{ background: "var(--ink)" }}>
          <p style={{ color: "var(--hot)" }}>No camera target for {puzzle.id}.</p>
          <button className="px-btn mt-3 px-3 py-2 text-[10px]" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const detectionPct = Math.round(status.confidence * 100);

  return (
    <div
      className="absolute inset-0 z-30 grid place-items-center p-4"
      style={{ background: "rgba(6,8,12,0.9)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Human verification"
    >
      <div
        className="px-border w-full max-w-xl p-4"
        style={{
          background: "var(--ink)",
          transform: shake ? "translateX(4px)" : "none",
          borderColor: shake ? "var(--hot)" : verified ? "var(--accent)" : "var(--edge)",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[9px] tracking-[0.22em]" style={{ color: "var(--accent)" }}>
            HUMAN VERIFICATION · {target.label}
          </span>
          <button onClick={onClose} className="px-btn px-2 py-1 text-[9px]" aria-label="Close">
            Esc
          </button>
        </div>

        <p className="mb-3 text-[13px] leading-relaxed" style={{ color: "var(--txt)" }}>
          {puzzle.prompt}
        </p>

        <div
          className="relative mb-3 overflow-hidden border-2"
          style={{ borderColor: "var(--edge)", aspectRatio: "4 / 3", background: "#0a0c10" }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          {/* Framing guide */}
          <div
            className="pointer-events-none absolute inset-[12%] rounded-[40%] border-2"
            style={{
              borderColor:
                status.match && status.framing === "ok"
                  ? "var(--accent)"
                  : "rgba(232, 220, 180, 0.45)",
              boxShadow: "inset 0 0 40px rgba(0,0,0,0.25)",
            }}
          />
          {!ready && !error && (
            <div
              className="absolute inset-0 grid place-items-center text-[11px]"
              style={{ color: "var(--muted)", background: "rgba(0,0,0,0.55)" }}
            >
              Starting camera + hand model…
            </div>
          )}
          {error && (
            <div
              className="absolute inset-0 grid place-items-center p-4 text-center text-[12px]"
              style={{ color: "var(--hot)", background: "rgba(0,0,0,0.7)" }}
            >
              {error}
              <span className="mt-2 block text-[10px]" style={{ color: "var(--muted)" }}>
                Hold Space to authorize without the camera.
              </span>
            </div>
          )}
          {verified && (
            <div
              className="absolute inset-0 grid place-items-center text-[14px] tracking-[0.2em]"
              style={{ color: "var(--accent)", background: "rgba(6,8,12,0.72)" }}
            >
              HUMAN VERIFIED
            </div>
          )}
        </div>

        <p className="mb-2 text-[12px]" style={{ color: "var(--txt)" }}>
          {target.instruction}
        </p>
        <p className="mb-1 text-[10px]" style={{ color: "var(--muted)" }}>
          Required: {describeGesture(target.gesture)} · Detected: {status.detectedLabel}
        </p>
        <p className="mb-2 text-[10px]" style={{ color: "var(--muted)" }}>
          {framingMessage(status.framing)}
        </p>

        <div className="mb-1 flex justify-between text-[9px] tracking-[0.14em]" style={{ color: "var(--accent)" }}>
          <span>Detection: {detectionPct}%</span>
          <span>Hold steady</span>
        </div>
        <div className="mb-3 h-2 border" style={{ borderColor: "var(--edge)", background: "var(--panel)" }}>
          <div
            className="h-full transition-[width] duration-75"
            style={{
              width: `${Math.round(holdProgress * 100)}%`,
              background: "var(--accent)",
            }}
          />
        </div>

        <div className="mb-1 flex justify-between text-[9px] tracking-[0.14em]" style={{ color: "var(--muted)" }}>
          <span>Camera unavailable? Hold Space instead.</span>
          <span>{Math.round(spaceProgress * 100)}%</span>
        </div>
        <div className="h-1.5 border" style={{ borderColor: "var(--edge)", background: "var(--panel)" }}>
          <div
            className="h-full"
            style={{
              width: `${Math.round(spaceProgress * 100)}%`,
              background: "var(--hot)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
