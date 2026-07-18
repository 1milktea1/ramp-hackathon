"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { emit } from "@/lib/events";
import { useGameStore } from "@/lib/store";
import type { PuzzleDefinition } from "@/lib/types";
import { toNumber, validate } from "@/lib/validators";

type ObjectModalProps = {
  title: string;
  puzzle?: PuzzleDefinition | null;
  /** Person B can inject a real puzzle primitive here later. */
  puzzleSlot?: ReactNode;
  onClose: () => void;
  onSolved?: (puzzleId: string) => void;
};

/**
 * Generic object / puzzle modal. Default input uses the frozen validate()
 * contract so the shell is playable once Person B registers answers.
 */
export function ObjectModal({
  title,
  puzzle,
  puzzleSlot,
  onClose,
  onSolved,
}: ObjectModalProps) {
  const completePuzzle = useGameStore((s) => s.completePuzzle);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!puzzle) return;

    const numeric = toNumber(value);
    const candidates: unknown[] = [value, value.trim()];
    if (numeric !== null) candidates.push(numeric);

    emit("answer_submit", {
      puzzleId: puzzle.id,
      validatorKey: puzzle.validatorKey,
      input: value,
    });

    const ok = candidates.some((c) => validate(puzzle.validatorKey, c));
    if (ok) {
      emit("puzzle_complete", { puzzleId: puzzle.id });
      completePuzzle(puzzle.id);
      setFeedback("Accepted.");
      onSolved?.(puzzle.id);
      return;
    }

    emit("wrong_attempt", { puzzleId: puzzle.id });
    setFeedback(
      "Rejected — check the clue, or register a validator for this key."
    );
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/55 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg rounded-lg border border-white/15 bg-zinc-950/95 p-5 text-left shadow-2xl backdrop-blur"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
              Inspect
            </p>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-white/15 px-2 py-1 text-xs text-zinc-300 hover:bg-white/5"
          >
            Close
          </button>
        </div>

        {puzzle ? (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-zinc-300">{puzzle.prompt}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              {puzzle.category} · {puzzle.interaction} · {puzzle.validatorKey}
            </p>

            {puzzleSlot ?? (
              <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setFeedback(null);
                  }}
                  placeholder="Enter answer"
                  className="flex-1 rounded border border-white/15 bg-black/40 px-3 py-2 font-mono text-sm text-white outline-none focus:border-amber-300/50"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded bg-amber-400 px-4 py-2 text-sm font-medium text-black hover:bg-amber-300"
                >
                  Submit
                </button>
              </form>
            )}

            {feedback ? (
              <p className="text-xs text-zinc-400">{feedback}</p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">Nothing actionable here yet.</p>
        )}
      </div>
    </div>
  );
}
