"use client";

import type { HotspotDefinition } from "@/lib/types";

type HotspotProps = {
  hotspot: HotspotDefinition;
  completed?: boolean;
  onSelect: (hotspot: HotspotDefinition) => void;
};

export function Hotspot({ hotspot, completed = false, onSelect }: HotspotProps) {
  return (
    <button
      type="button"
      aria-label={hotspot.label}
      onClick={() => onSelect(hotspot)}
      className={[
        "absolute z-10 rounded-sm border transition",
        "hover:bg-white/10 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.35)]",
        completed
          ? "border-emerald-400/70 bg-emerald-400/10"
          : "border-amber-200/50 bg-amber-200/5",
      ].join(" ")}
      style={{
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        width: `${hotspot.width}%`,
        height: `${hotspot.height}%`,
      }}
    >
      <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/80 opacity-0 transition group-hover:opacity-100 hover:opacity-100">
        {completed ? "✓ " : ""}
        {hotspot.label}
      </span>
    </button>
  );
}
