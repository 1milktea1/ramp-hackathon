"use client";

import { useState, type FormEvent } from "react";
import {
  FINALE_CODE_KEY,
  FINALE_CODE_REFERENCE,
} from "@/lib/campaigns";
import { emit } from "@/lib/events";
import { useGameStore } from "@/lib/store";
import type { CampaignId } from "@/lib/types";
import { normalizeString, validate } from "@/lib/validators";

type FinalePanelProps = {
  campaignId: CampaignId;
  onSolved: () => void;
};

/**
 * End-of-campaign code entry (plan.md §3).
 * Prefers validate(sf-finale-code | ny-finale-code); falls back to reference
 * codes so the shell can demo before Person B registers runtime compute.
 */
export function FinalePanel({ campaignId, onSolved }: FinalePanelProps) {
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const setStatus = useGameStore((s) => s.setStatus);

  const key = FINALE_CODE_KEY[campaignId];
  const reference = FINALE_CODE_REFERENCE[campaignId];

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleaned = normalizeString(value).replace(/\s+/g, "");

    emit("answer_submit", { validatorKey: key, input: cleaned });

    const registeredOk = validate(key, cleaned) || validate(key, Number(cleaned));
    const fallbackOk = cleaned === reference;

    if (registeredOk || fallbackOk) {
      emit("puzzle_complete", { puzzleId: "finale", validatorKey: key });
      setStatus("won");
      onSolved();
      return;
    }

    emit("wrong_attempt", { puzzleId: "finale" });
    setFeedback("Code rejected.");
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg border border-emerald-400/30 bg-zinc-950/95 p-6 shadow-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-emerald-300/80">
          Final lock
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">
          Enter stage hints
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Concatenate the three stage hint digits in order. Camera gate (Person D)
          will sit in front of this panel later.
        </p>

        <form onSubmit={submit} className="mt-4 flex gap-2">
          <input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setFeedback(null);
            }}
            placeholder="###"
            inputMode="numeric"
            className="flex-1 rounded border border-white/15 bg-black/40 px-3 py-2 font-mono text-lg tracking-[0.4em] text-white outline-none focus:border-emerald-300/50"
            autoFocus
          />
          <button
            type="submit"
            className="rounded bg-emerald-400 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-300"
          >
            Unlock
          </button>
        </form>

        {feedback ? <p className="mt-2 text-xs text-red-300">{feedback}</p> : null}
      </div>
    </div>
  );
}
