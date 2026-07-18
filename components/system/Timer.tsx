"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/store";

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Counts down while status === playing; store flips to lost at 0. */
export function Timer() {
  const status = useGameStore((s) => s.status);
  const timeRemainingSec = useGameStore((s) => s.timeRemainingSec);
  const tickTimer = useGameStore((s) => s.tickTimer);

  useEffect(() => {
    if (status !== "playing") return;
    const id = window.setInterval(() => tickTimer(1), 1000);
    return () => window.clearInterval(id);
  }, [status, tickTimer]);

  if (status !== "playing") return null;

  const urgent = timeRemainingSec <= 60;

  return (
    <div
      className={[
        "pointer-events-none absolute right-4 top-4 z-30 rounded border px-3 py-2 font-mono text-sm backdrop-blur",
        urgent
          ? "border-red-400/50 bg-red-950/70 text-red-200"
          : "border-white/15 bg-black/55 text-white",
      ].join(" ")}
      aria-live="polite"
    >
      {formatTime(timeRemainingSec)}
    </div>
  );
}
