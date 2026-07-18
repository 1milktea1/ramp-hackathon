"use client";

import { useEffect, useRef, useState } from "react";
import type { PuzzleDefinition } from "@/lib/types";
import { validate } from "@/lib/validators";
import { emit } from "@/lib/events";

/**
 * The terminal that carries 15 of the 18 questions (plan.md §3 — nearly every
 * question is `interaction: "numeric"`). Visual aids render above the input as
 * an optional prop, so a question still plays as text if its aid is unbuilt.
 *
 * While this modal is open it OWNS the keyboard: SceneShell suspends panorama
 * arrow-key rotation, otherwise typing into a puzzle would spin the room.
 */
export function PuzzleModal({
  puzzle,
  onSolved,
  onClose,
}: {
  puzzle: PuzzleDefinition;
  onSolved: (puzzleId: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(raw: string) {
    const answer = raw.trim();
    if (!answer) return;

    emit("answer_submit", { puzzleId: puzzle.id, answer });

    // The engine validates. MIRA never decides correctness (plan.md §5.2, §12).
    if (validate(puzzle.validatorKey, answer)) {
      emit("puzzle_complete", { puzzleId: puzzle.id });
      onSolved(puzzle.id);
      return;
    }

    emit("wrong_attempt", { puzzleId: puzzle.id, answer });
    setShake(true);
    setValue("");
    window.setTimeout(() => setShake(false), 300);
  }

  const isChoice = puzzle.interaction === "object_selection";

  return (
    <div
      className="absolute inset-0 z-30 grid place-items-center p-6"
      style={{ background: "rgba(6,8,12,0.86)" }}
      role="dialog"
      aria-modal="true"
      aria-label={puzzle.id}
    >
      <div
        className="px-border w-full max-w-lg p-5"
        style={{
          background: "var(--ink)",
          transform: shake ? "translateX(4px)" : "none",
          borderColor: shake ? "var(--hot)" : "var(--edge)",
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[9px] tracking-[0.22em]" style={{ color: "var(--accent)" }}>
            {puzzle.category.toUpperCase().replace("_", " ")}
          </span>
          <button
            onClick={onClose}
            className="px-btn px-2 py-1 text-[9px]"
            aria-label="Close terminal"
          >
            Esc
          </button>
        </div>

        <p className="mb-5 text-[13px] leading-relaxed" style={{ color: "var(--txt)" }}>
          {puzzle.prompt}
        </p>

        {isChoice ? (
          <div className="flex gap-3">
            {["SWITCH", "STAY"].map((choice) => (
              <button
                key={choice}
                onClick={() => submit(choice)}
                className="px-btn flex-1 py-3 text-[11px]"
              >
                {choice}
              </button>
            ))}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(value);
            }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputMode={puzzle.interaction === "numeric" ? "numeric" : "text"}
              autoComplete="off"
              placeholder="_"
              aria-label="Your answer"
              className="flex-1 border-2 px-3 py-2 text-base tracking-widest outline-none"
              style={{
                borderColor: "var(--edge)",
                background: "var(--panel)",
                color: "var(--accent)",
              }}
            />
            <button type="submit" className="px-btn px-4 py-2 text-[10px]">
              Enter
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
