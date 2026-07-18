"use client";

import { useState, type FormEvent } from "react";
import { getCampaign } from "@/lib/campaigns";
import { emit } from "@/lib/events";
import { finalCode, finaleValidatorKey } from "@/lib/progress";
import { useGameStore } from "@/lib/store";
import type { CampaignId } from "@/lib/types";
import { normalizeString, validate } from "@/lib/validators";

type FinalePanelProps = {
  campaignId: CampaignId;
  onClose: () => void;
};

/** End-of-campaign code entry — validates via computed stage hints (plan.md §3). */
export function FinalePanel({ campaignId, onClose }: FinalePanelProps) {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const setStatus = useGameStore((s) => s.setStatus);

  const key = finaleValidatorKey(campaignId);
  const expected = finalCode(getCampaign(campaignId).scenes);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleaned = normalizeString(value).replace(/\s+/g, "");
    if (!cleaned) return;

    emit("answer_submit", { validatorKey: key, input: cleaned });

    if (validate(key, cleaned) || cleaned === expected) {
      emit("puzzle_complete", { puzzleId: "finale", validatorKey: key });
      setStatus("won");
      onClose();
      return;
    }

    emit("wrong_attempt", { puzzleId: "finale" });
    setFeedback("Code rejected.");
    setShake(true);
    setValue("");
    window.setTimeout(() => setShake(false), 300);
  };

  return (
    <div
      className="absolute inset-0 z-40 grid place-items-center p-6"
      style={{ background: "rgba(6,8,12,0.86)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Final lock"
    >
      <div
        className="px-border w-full max-w-md p-5"
        style={{
          background: "var(--ink)",
          borderColor: shake ? "var(--hot)" : "var(--edge)",
          transform: shake ? "translateX(4px)" : "none",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span
            className="text-[9px] tracking-[0.22em]"
            style={{ color: "var(--lit)" }}
          >
            FINAL LOCK
          </span>
          <button type="button" onClick={onClose} className="px-btn px-2 py-1 text-[9px]">
            Esc
          </button>
        </div>

        <h2 className="mb-1 text-lg font-bold">Enter stage hints</h2>
        <p className="mb-4 text-[12px] leading-relaxed" style={{ color: "var(--dim)" }}>
          Concatenate the three CODE digits from the tray, in stage order.
        </p>

        <form onSubmit={submit} className="flex gap-2">
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setFeedback(null);
            }}
            placeholder="###"
            inputMode="numeric"
            autoComplete="off"
            className="flex-1 border-2 px-3 py-2 text-lg tracking-[0.4em] outline-none"
            style={{
              borderColor: "var(--edge)",
              background: "var(--panel)",
              color: "var(--accent)",
            }}
            autoFocus
          />
          <button type="submit" className="px-btn px-4 py-2 text-[10px]">
            Unlock
          </button>
        </form>

        {feedback ? (
          <p className="mt-2 text-[11px]" style={{ color: "var(--hot)" }}>
            {feedback}
          </p>
        ) : null}
      </div>
    </div>
  );
}
