"use client";

import type { ViewDirection } from "@/lib/types";

/**
 * The shipped scene art: pixel-art rooms drawn in CSS/DOM rather than bitmaps.
 *
 * Chosen over images so the rooms share a rendering language with the in-world
 * devices (terminals, boards, keypads) and stay crisp at any size with no asset
 * pipeline. Each scene is one config; the three views vary only by their props,
 * which keeps this to six compositions rather than eighteen.
 *
 * Props sit at the edges — the centre belt (x 28–70%, y 30–70%) is reserved for
 * the interactive device plate PanoramaView draws on top.
 */

type Prop = {
  kind: "box" | "screen" | "sign" | "pillar" | "bench" | "dot";
  x: number;
  y: number;
  w: number;
  h: number;
  color?: string;
  anim?: string;
};

type WallKind = "skyline" | "tile" | "glass" | "screens" | "windows" | "canopy";

type SceneArt = {
  sky: [string, string];
  wall: WallKind;
  wallColor: string;
  floor: string;
  floorY: number;
  accent: string;
  fog?: boolean;
  sweep?: boolean;
  views: Record<ViewDirection, Prop[]>;
};

// Deterministic skyline silhouette — no randomness, so SSR and client agree.
const SKYLINE = [38, 62, 30, 74, 46, 88, 34, 58, 70, 42, 80, 36, 66, 50, 78, 32];

const ART: Record<string, SceneArt> = {
  // --- San Francisco ---------------------------------------
  "sf-1": {
    sky: ["#0a1420", "#132234"],
    wall: "canopy",
    wallColor: "#1a2740",
    floor: "#10161f",
    floorY: 72,
    accent: "#4ad9c4",
    fog: true,
    sweep: true,
    views: {
      left: [
        { kind: "sign", x: 6, y: 26, w: 17, h: 22, color: "#1d3550" },
        { kind: "bench", x: 4, y: 62, w: 21, h: 7 },
        { kind: "dot", x: 78, y: 30, w: 2, h: 2, color: "#4ad9c4", anim: "ec-blink" },
      ],
      center: [
        { kind: "pillar", x: 12, y: 20, w: 4, h: 52 },
        { kind: "pillar", x: 84, y: 20, w: 4, h: 52 },
        { kind: "screen", x: 30, y: 12, w: 40, h: 9, color: "#0f2a26", anim: "ec-flicker" },
      ],
      right: [
        { kind: "box", x: 72, y: 40, w: 22, h: 26, color: "#16233a" },
        { kind: "dot", x: 76, y: 45, w: 3, h: 3, color: "#7de08d", anim: "ec-blink" },
        { kind: "sign", x: 5, y: 24, w: 14, h: 18, color: "#1d3550" },
      ],
    },
  },
  "sf-2": {
    sky: ["#070d16", "#0d1826"],
    wall: "windows",
    wallColor: "#152238",
    floor: "#0c1119",
    floorY: 74,
    accent: "#4ad9c4",
    views: {
      left: [
        { kind: "screen", x: 4, y: 34, w: 20, h: 15, color: "#0d2b28", anim: "ec-flicker" },
        { kind: "box", x: 2, y: 62, w: 26, h: 6 },
      ],
      center: [
        { kind: "screen", x: 6, y: 30, w: 17, h: 13, color: "#0d2b28" },
        { kind: "screen", x: 77, y: 30, w: 17, h: 13, color: "#0d2b28", anim: "ec-flicker" },
        { kind: "box", x: 0, y: 68, w: 100, h: 5 },
      ],
      right: [
        { kind: "screen", x: 74, y: 26, w: 22, h: 30, color: "#0d2b28", anim: "ec-flicker" },
        { kind: "dot", x: 10, y: 40, w: 3, h: 3, color: "#7de08d", anim: "ec-blink" },
      ],
    },
  },
  "sf-3": {
    sky: ["#0b1520", "#16273a"],
    wall: "glass",
    wallColor: "#1d3048",
    floor: "#141b26",
    floorY: 70,
    accent: "#4ad9c4",
    views: {
      left: [{ kind: "screen", x: 5, y: 30, w: 18, h: 24, color: "#102c2a" }],
      center: [
        { kind: "box", x: 44, y: 6, w: 12, h: 12, color: "#24405c", anim: "ec-spin" },
        { kind: "pillar", x: 8, y: 18, w: 3, h: 52 },
        { kind: "pillar", x: 89, y: 18, w: 3, h: 52 },
      ],
      right: [
        { kind: "box", x: 70, y: 30, w: 24, h: 34, color: "#1b2c42" },
        { kind: "dot", x: 74, y: 34, w: 3, h: 3, color: "#4ad9c4", anim: "ec-blink" },
      ],
    },
  },
  // --- New York ---------------------------------------------
  "ny-1": {
    sky: ["#0d0b06", "#171207"],
    wall: "tile",
    wallColor: "#2b2412",
    floor: "#12100a",
    floorY: 72,
    accent: "#ffcf4a",
    sweep: true,
    views: {
      left: [
        { kind: "sign", x: 5, y: 22, w: 19, h: 14, color: "#3a2f14" },
        { kind: "bench", x: 3, y: 62, w: 22, h: 7 },
      ],
      center: [
        { kind: "screen", x: 32, y: 10, w: 36, h: 8, color: "#332809", anim: "ec-flicker" },
        { kind: "pillar", x: 10, y: 18, w: 4, h: 54 },
        { kind: "pillar", x: 86, y: 18, w: 4, h: 54 },
      ],
      right: [
        { kind: "box", x: 70, y: 44, w: 24, h: 22, color: "#2a2210" },
        { kind: "dot", x: 74, y: 48, w: 3, h: 3, color: "#ffcf4a", anim: "ec-blink" },
      ],
    },
  },
  "ny-2": {
    sky: ["#080a10", "#101728"],
    wall: "skyline",
    wallColor: "#1b2540",
    floor: "#0d1119",
    floorY: 76,
    accent: "#ffcf4a",
    views: {
      left: [{ kind: "screen", x: 4, y: 32, w: 20, h: 16, color: "#33290c", anim: "ec-flicker" }],
      center: [
        { kind: "screen", x: 6, y: 28, w: 16, h: 12, color: "#33290c" },
        { kind: "screen", x: 78, y: 28, w: 16, h: 12, color: "#33290c" },
        { kind: "box", x: 0, y: 70, w: 100, h: 5 },
      ],
      right: [
        { kind: "box", x: 72, y: 32, w: 23, h: 32, color: "#1d2740" },
        { kind: "dot", x: 76, y: 36, w: 3, h: 3, color: "#7de08d", anim: "ec-blink" },
      ],
    },
  },
  "ny-3": {
    sky: ["#0a0906", "#131009"],
    wall: "screens",
    wallColor: "#2a2110",
    floor: "#100d08",
    floorY: 74,
    accent: "#ffcf4a",
    views: {
      left: [{ kind: "screen", x: 4, y: 30, w: 21, h: 22, color: "#33290c", anim: "ec-flicker" }],
      center: [{ kind: "screen", x: 26, y: 8, w: 48, h: 10, color: "#33290c" }],
      right: [
        { kind: "screen", x: 73, y: 28, w: 23, h: 26, color: "#33290c", anim: "ec-flicker" },
        { kind: "dot", x: 12, y: 38, w: 3, h: 3, color: "#ffcf4a", anim: "ec-blink" },
      ],
    },
  },
};

/** Repeating wall texture. Pure gradients so there is nothing to download. */
function wallStyle(kind: WallKind, color: string): React.CSSProperties {
  switch (kind) {
    case "tile":
      return {
        backgroundImage: `linear-gradient(${color} 2px, transparent 2px), linear-gradient(90deg, ${color} 2px, transparent 2px)`,
        backgroundSize: "38px 26px",
      };
    case "glass":
      return {
        backgroundImage: `linear-gradient(90deg, ${color} 3px, transparent 3px)`,
        backgroundSize: "72px 100%",
      };
    case "windows":
      return {
        backgroundImage: `linear-gradient(90deg, ${color} 4px, transparent 4px), linear-gradient(${color} 4px, transparent 4px)`,
        backgroundSize: "96px 84px",
      };
    case "screens":
      return {
        backgroundImage: `linear-gradient(90deg, ${color} 6px, transparent 6px), linear-gradient(${color} 6px, transparent 6px)`,
        backgroundSize: "54px 40px",
      };
    case "canopy":
      return {
        backgroundImage: `linear-gradient(90deg, ${color} 5px, transparent 5px)`,
        backgroundSize: "108px 100%",
      };
    default:
      return {};
  }
}

export function SceneBackdrop({
  sceneId,
  view,
}: {
  sceneId: string;
  view: ViewDirection;
}) {
  const art = ART[sceneId];
  if (!art) return null;

  const props = art.views[view];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Sky / far wall */}
      <div
        className="absolute inset-0"
        style={{ background: `linear-gradient(${art.sky[0]}, ${art.sky[1]})` }}
      />

      {/* Skyline silhouette sits behind the wall texture. */}
      {art.wall === "skyline" && (
        <div className="absolute inset-x-0 flex items-end" style={{ bottom: `${100 - art.floorY}%`, height: "42%" }}>
          {SKYLINE.map((h, i) => (
            <div key={i} className="relative flex-1" style={{ height: `${h}%`, background: art.wallColor }}>
              <span
                className="absolute left-1/2 top-2 h-[2px] w-[2px] -translate-x-1/2"
                style={{ background: art.accent, opacity: i % 3 === 0 ? 0.7 : 0.25 }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Wall texture */}
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: `${art.floorY}%`, opacity: 0.55, ...wallStyle(art.wall, art.wallColor) }}
      />

      {/* Floor */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: `${100 - art.floorY}%`, background: art.floor }}
      />
      <div
        className="absolute inset-x-0"
        style={{ top: `${art.floorY}%`, height: "2px", background: art.wallColor }}
      />

      {/* Props */}
      {props.map((p, i) => (
        <div
          key={i}
          className={`absolute ${p.anim ?? ""}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.w}%`,
            height: `${p.h}%`,
            background: p.color ?? art.wallColor,
            border: p.kind === "dot" ? "none" : `2px solid ${art.wallColor}`,
            borderRadius: 0,
            boxShadow:
              p.kind === "screen" || p.kind === "dot"
                ? `0 0 12px ${p.color ?? art.accent}`
                : "none",
          }}
        />
      ))}

      {/* Two ambient effects max, per plan.md P1. */}
      {art.fog && (
        <div
          className="ec-drift absolute inset-x-[-20%] bottom-0 h-1/2"
          style={{
            background: `linear-gradient(to top, ${art.accent}14, transparent)`,
          }}
        />
      )}
      {art.sweep && (
        <div
          className="ec-sweep absolute inset-y-0 w-1/4"
          style={{
            background: `linear-gradient(90deg, transparent, ${art.accent}22, transparent)`,
          }}
        />
      )}
    </div>
  );
}
