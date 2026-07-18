"use client";

import { useEffect, useRef, useState } from "react";
import type { CampaignDefinition } from "@/lib/types";
import { finalCode, finaleValidatorKey, stageHint } from "@/lib/progress";
import { finaleBackground } from "@/lib/campaigns";
import { validate } from "@/lib/validators";
import { emit } from "@/lib/events";

/**
 * The lock (plan.md §3). Reached once Stage 3's digit is recovered; the camera
 * open-palm check gates the door on the way in and is Person D's — the
 * `gatePassed` prop is that seam, currently satisfied by a Space-hold fallback.
 *
 * The expected code is COMPUTED from the stage hints, never hardcoded, so it
 * cannot drift from the per-puzzle answers (§5.2).
 */
export function FinaleRoom({
  campaign,
  onWin,
  onBack,
}: {
  campaign: CampaignDefinition;
  onWin: () => void;
  onBack: () => void;
}) {
  const [value, setValue] = useState("");
  const [rejected, setRejected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const expectedLength = finalCode(campaign.scenes).length;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit() {
    const code = value.trim();
    if (!code) return;

    emit("answer_submit", { puzzleId: "finale", answer: code });

    if (validate(finaleValidatorKey(campaign.id), code)) {
      emit("puzzle_complete", { puzzleId: "finale" });
      onWin();
      return;
    }

    emit("wrong_attempt", { puzzleId: "finale", answer: code });
    setRejected(true);
    setValue("");
    window.setTimeout(() => setRejected(false), 400);
  }

  return (
    <div
      className="relative grid flex-1 place-items-center overflow-hidden p-6"
      style={{ background: "var(--ink)" }}
    >
      {/* Room art, dimmed hard so the code entry stays the focus. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url(${finaleBackground(campaign.id)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.45,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(11,14,20,0.8) 30%, rgba(11,14,20,0.95) 100%)" }}
      />

      <div className="relative z-10 w-full max-w-lg">
        <p className="text-[9px] tracking-[0.3em]" style={{ color: "var(--accent)" }}>
          {campaign.id === "san-francisco-swe" ? "BAY CONTROL CENTER" : "LOWER MANHATTAN EXCHANGE"}
        </p>
        <h2 className="mb-1 text-2xl font-bold">SYSTEM LOCK</h2>
        <p className="mb-6 text-[11px] leading-relaxed" style={{ color: "var(--dim)" }}>
          {campaign.id === "san-francisco-swe"
            ? "Enter the rollback code to reverse the deployment."
            : "Enter the release code to cancel the trading halt."}
        </p>

        {/* The recovered digits, in stage order — this is the readable answer. */}
        <div className="mb-6 flex gap-3">
          {campaign.scenes.map((scene, i) => (
            <div key={scene.id} className="flex-1">
              <div
                className="grid h-14 place-items-center border-2 text-2xl font-bold"
                style={{
                  borderColor: "var(--lit)",
                  background: "#12241a",
                  color: "var(--lit)",
                }}
              >
                {stageHint(scene)}
              </div>
              <p className="mt-1 text-center text-[8px] tracking-[0.15em]" style={{ color: "var(--dim)" }}>
                STAGE {i + 1}
              </p>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, expectedLength))}
            inputMode="numeric"
            placeholder={"_".repeat(expectedLength)}
            aria-label="Final code"
            className="flex-1 border-2 px-4 py-3 text-2xl tracking-[0.5em] outline-none"
            style={{
              borderColor: rejected ? "var(--hot)" : "var(--edge)",
              background: "var(--panel)",
              color: rejected ? "var(--hot)" : "var(--accent)",
            }}
          />
          <button type="submit" className="px-btn px-5 text-[11px]">
            Execute
          </button>
        </form>

        {rejected && (
          <p className="mt-2 text-[10px]" style={{ color: "var(--hot)" }}>
            CODE REJECTED — lock still engaged.
          </p>
        )}

        <button onClick={onBack} className="px-btn mt-6 px-3 py-2 text-[9px]">
          ◀ Back to floor
        </button>
      </div>
    </div>
  );
}
