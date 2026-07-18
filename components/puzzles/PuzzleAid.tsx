"use client";

import { useState } from "react";
import { AIDS } from "@/lib/campaigns";

/**
 * Optional visual aid rendered above a question's input.
 *
 * The rule these follow: an aid makes the STRUCTURE of the problem visible
 * without performing the reasoning. The dice grid lays out the sample space but
 * does not count the sevens; the ring enforces "each pair once" but does not
 * total the handshakes. A question with no aid still plays as plain text.
 */

const CELL = "grid place-items-center border-2 font-bold";

function DiceGrid() {
  const faces = [1, 2, 3, 4, 5, 6];
  return (
    <div>
      <div className="grid grid-cols-7 gap-[2px] text-[9px]">
        <span />
        {faces.map((c) => (
          <span key={`h${c}`} className="grid place-items-center py-[2px]" style={{ color: "var(--dim)" }}>
            {c}
          </span>
        ))}
        {faces.map((r) => (
          <div key={`r${r}`} className="contents">
            <span className="grid place-items-center" style={{ color: "var(--dim)" }}>
              {r}
            </span>
            {faces.map((c) => (
              <span
                key={`${r}-${c}`}
                className={`${CELL} h-6 text-[10px]`}
                style={{
                  borderColor: "var(--edge)",
                  background: "var(--panel)",
                  color: "var(--txt)",
                }}
              >
                {r + c}
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[9px]" style={{ color: "var(--dim)" }}>
        Every outcome of two dice. Each cell shows its sum.
      </p>
    </div>
  );
}

function BayStrip({ values, range }: { values: number[]; range: number }) {
  const present = new Set(values);
  return (
    <div>
      <div className="flex gap-1">
        {Array.from({ length: range }, (_, bay) => {
          const filled = present.has(bay);
          return (
            <div key={bay} className="flex-1">
              <div
                className={`${CELL} h-11 text-sm`}
                style={{
                  borderColor: filled ? "var(--edge)" : "var(--hot)",
                  borderStyle: filled ? "solid" : "dashed",
                  background: filled ? "var(--panel)" : "transparent",
                  color: filled ? "var(--txt)" : "var(--hot)",
                }}
              >
                {filled ? bay : "?"}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[9px]" style={{ color: "var(--dim)" }}>
        Six bays. One car never checked in.
      </p>
    </div>
  );
}

function HandshakeRing({ n }: { n: number }) {
  const [pending, setPending] = useState<number | null>(null);
  const [pairs, setPairs] = useState<string[]>([]);

  const R = 62;
  const C = 76;
  const pos = (i: number) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: C + R * Math.cos(angle), y: C + R * Math.sin(angle) };
  };

  function tap(i: number) {
    if (pending === null) {
      setPending(i);
      return;
    }
    if (pending === i) {
      setPending(null);
      return;
    }
    const key = [pending, i].sort((a, b) => a - b).join("-");
    // A pair already shaken will not redraw — that constraint IS the puzzle.
    setPairs((p) => (p.includes(key) ? p : [...p, key]));
    setPending(null);
  }

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 152 152" className="h-36 w-36 shrink-0">
        {pairs.map((key) => {
          const [a, b] = key.split("-").map(Number);
          const pa = pos(a);
          const pb = pos(b);
          return (
            <line
              key={key}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke="var(--accent)"
              strokeWidth="1.5"
              opacity="0.75"
            />
          );
        })}
        {Array.from({ length: n }, (_, i) => {
          const p = pos(i);
          return (
            <rect
              key={i}
              x={p.x - 6}
              y={p.y - 6}
              width="12"
              height="12"
              fill={pending === i ? "var(--lit)" : "var(--accent)"}
              onClick={() => tap(i)}
              style={{ cursor: "pointer" }}
            />
          );
        })}
      </svg>
      <div>
        <p className="text-lg font-bold tabular-nums" style={{ color: "var(--accent)" }}>
          {pairs.length}
        </p>
        <p className="text-[9px] leading-relaxed" style={{ color: "var(--dim)" }}>
          handshakes drawn
          <br />
          Click two traders to shake.
          <br />
          The same pair will not shake twice.
        </p>
      </div>
    </div>
  );
}

function Bars({ values, prefix = "" }: { values: number[]; prefix?: string }) {
  const max = Math.max(...values.map(Math.abs), 1);
  const hasNegative = values.some((v) => v < 0);

  return (
    <div>
      <div className="flex h-24 items-center gap-2">
        {values.map((v, i) => {
          const pct = (Math.abs(v) / max) * 46;
          return (
            <div key={i} className="relative flex h-full flex-1 flex-col justify-center">
              {/* Zero line sits mid-height only when negatives exist. */}
              <div
                className="absolute inset-x-0"
                style={{ top: hasNegative ? "50%" : "auto", bottom: hasNegative ? "auto" : 0, height: 1, background: "var(--edge)" }}
              />
              <div
                className="absolute inset-x-1 border-2"
                style={{
                  height: `${pct}%`,
                  bottom: hasNegative ? (v >= 0 ? "50%" : "auto") : 0,
                  top: hasNegative && v < 0 ? "50%" : "auto",
                  borderColor: v < 0 ? "var(--hot)" : "var(--accent)",
                  background: v < 0 ? "#2a1414" : "var(--panel)",
                }}
              />
              <span
                className="absolute inset-x-0 -bottom-1 text-center text-[9px]"
                style={{ color: v < 0 ? "var(--hot)" : "var(--dim)" }}
              >
                {prefix}
                {v}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[9px]" style={{ color: "var(--dim)" }}>
        {hasNegative ? "Load deltas, in order." : "Price at each tick, in order."}
      </p>
    </div>
  );
}

export function PuzzleAid({ puzzleId }: { puzzleId: string }) {
  const spec = AIDS[puzzleId];
  if (!spec) return null;

  return (
    <div
      className="mb-4 border-2 p-3"
      style={{ borderColor: "var(--edge)", background: "rgba(21,27,40,0.5)" }}
    >
      {spec.kind === "dice" && <DiceGrid />}
      {spec.kind === "bays" && <BayStrip values={spec.values} range={spec.range} />}
      {spec.kind === "ring" && <HandshakeRing n={spec.n} />}
      {spec.kind === "bars" && <Bars values={spec.values} prefix={spec.prefix} />}
    </div>
  );
}
