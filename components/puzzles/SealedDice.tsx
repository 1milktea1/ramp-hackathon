"use client";

import type { Roll } from "@/lib/market-game";

export type DiceVisualState = "rolling" | "sealed" | "revealed";

type SealedDiceProps = {
  state: DiceVisualState;
  roll: Roll | null;
};

/** Three exchange dice: tumble on open, stay sealed in play, reveal on win/lose. */
export function SealedDice({ state, roll }: SealedDiceProps) {
  const faces =
    state === "revealed" && roll
      ? [
          { label: "d6", value: String(roll.d6a) },
          { label: "d6", value: String(roll.d6b) },
          { label: "d10", value: String(roll.d10) },
        ]
      : [
          { label: "d6", value: "?" },
          { label: "d6", value: "?" },
          { label: "d10", value: "?" },
        ];

  return (
    <div className="flex items-end justify-center gap-3" aria-live="polite">
      {faces.map((face, i) => (
        <div key={`${face.label}-${i}`} className="flex flex-col items-center gap-1">
          <span
            className="text-[9px] tracking-[0.2em]"
            style={{ color: "var(--dim)" }}
          >
            {face.label.toUpperCase()}
          </span>
          <div
            className={[
              "dice-face grid h-14 w-14 place-items-center border-2 text-xl font-bold",
              state === "rolling" ? "dice-tumble" : "",
              state === "revealed" ? "dice-lit" : "",
            ].join(" ")}
            style={{
              borderColor:
                state === "revealed" ? "var(--lit)" : "var(--accent)",
              background: state === "revealed" ? "#12241a" : "var(--panel)",
              color: state === "revealed" ? "var(--lit)" : "var(--accent)",
              animationDelay: `${i * 80}ms`,
            }}
          >
            {state === "rolling" ? "◉" : face.value}
          </div>
        </div>
      ))}
      <p
        className="ml-2 max-w-[9rem] text-[10px] leading-snug"
        style={{ color: "var(--dim)" }}
      >
        {state === "rolling" && "MIRA is sealing the roll…"}
        {state === "sealed" && "Sealed. Quote markets — faces stay hidden."}
        {state === "revealed" && "Roll revealed."}
      </p>
    </div>
  );
}
