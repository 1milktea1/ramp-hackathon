"use client";

import type { ReactNode } from "react";
import type { ViewDirection } from "@/lib/types";

const OFFSET: Record<ViewDirection, number> = {
  left: 0,
  center: -100,
  right: -200,
};

function panelStyle(background: string): React.CSSProperties {
  if (background.startsWith("gradient:")) {
    const accent = background.slice("gradient:".length);
    return {
      backgroundImage: `linear-gradient(145deg, ${accent} 0%, #0a0a0a 55%, #111827 100%)`,
    };
  }
  return {
    backgroundImage: `url(${background})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

type PanoramaViewProps = {
  view: ViewDirection;
  backgrounds: { left: string; center: string; right: string };
  children?: ReactNode;
  transitionMs?: number;
};

/**
 * Three coordinated L/C/R panels with a ~300ms slide (plan.md §3 / Person A).
 * Hotspots and overlays are projected as children positioned per-view.
 */
export function PanoramaView({
  view,
  backgrounds,
  children,
  transitionMs = 300,
}: PanoramaViewProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div
        className="absolute inset-0 flex h-full"
        style={{
          width: "300%",
          transform: `translateX(${OFFSET[view]}%)`,
          transition: `transform ${transitionMs}ms ease-out`,
        }}
      >
        {(["left", "center", "right"] as const).map((dir) => (
          <div
            key={dir}
            className="relative h-full w-1/3 shrink-0 bg-zinc-900 bg-cover bg-center"
            style={panelStyle(backgrounds[dir])}
            data-view={dir}
          >
            {/* Subtle vignette so placeholder gradients still feel like a room */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
            <div className="pointer-events-none absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              {dir}
            </div>
          </div>
        ))}
      </div>
      {/* Interactive layer stays fixed over the current view */}
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}
