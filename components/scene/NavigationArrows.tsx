"use client";

import type { ViewDirection } from "@/lib/types";

const ORDER: ViewDirection[] = ["left", "center", "right"];

type NavigationArrowsProps = {
  view: ViewDirection;
  onChange: (view: ViewDirection) => void;
};

export function NavigationArrows({ view, onChange }: NavigationArrowsProps) {
  const index = ORDER.indexOf(view);
  const canLeft = index > 0;
  const canRight = index < ORDER.length - 1;

  return (
    <>
      <button
        type="button"
        aria-label="Look left"
        disabled={!canLeft}
        onClick={() => canLeft && onChange(ORDER[index - 1])}
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded border border-white/20 bg-black/50 px-3 py-4 text-lg text-white backdrop-blur disabled:opacity-20"
      >
        ←
      </button>
      <button
        type="button"
        aria-label="Look right"
        disabled={!canRight}
        onClick={() => canRight && onChange(ORDER[index + 1])}
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded border border-white/20 bg-black/50 px-3 py-4 text-lg text-white backdrop-blur disabled:opacity-20"
      >
        →
      </button>
    </>
  );
}

/** Shared helper for keyboard L/R / A/D navigation. */
export function adjacentView(
  view: ViewDirection,
  delta: -1 | 1
): ViewDirection | null {
  const index = ORDER.indexOf(view);
  const next = index + delta;
  if (next < 0 || next >= ORDER.length) return null;
  return ORDER[next];
}
