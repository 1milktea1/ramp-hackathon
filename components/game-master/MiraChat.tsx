"use client";

import { useEffect, useRef, useState } from "react";
import type { PuzzleDefinition } from "@/lib/types";
import { buildResponse } from "@/lib/mira";
import { emit } from "@/lib/events";

type Turn = { from: "player" | "mira"; text: string };

/**
 * Compact chat panel, bottom-right (README §8). Answers run through the local
 * static engine so the panel works with no network. Person C's /api/mira can
 * later rewrite `reply.message` for tone — the seam is the buildResponse call.
 */
export function MiraChat({
  puzzle,
  pressure,
  open,
  onOpenChange,
}: {
  puzzle: PuzzleDefinition | null;
  pressure: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([
    { from: "mira", text: "I am watching the room. Ask me anything." },
  ]);
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [turns]);

  function send() {
    const text = draft.trim();
    if (!text) return;

    emit("hint_request", { via: "chat", message: text });
    const reply = buildResponse({
      puzzle,
      pressure,
      playerMessage: text,
      seed: turns.length,
    });

    setTurns((t) => [...t, { from: "player", text }, { from: "mira", text: reply.message }]);
    setDraft("");
  }

  if (!open) {
    return (
      <button
        onClick={() => onOpenChange(true)}
        aria-label="Open MIRA chat"
        className="px-btn absolute bottom-4 right-4 z-20 px-3 py-2 text-[10px]"
      >
        MIRA ▣
      </button>
    );
  }

  return (
    <div
      className="px-border absolute bottom-4 right-4 z-30 flex h-72 w-80 flex-col"
      style={{ background: "var(--ink)" }}
      role="dialog"
      aria-label="MIRA chat"
    >
      <div
        className="flex items-center justify-between border-b-2 px-3 py-2"
        style={{ borderColor: "var(--edge)" }}
      >
        <span className="text-[9px] tracking-[0.2em]" style={{ color: "var(--accent)" }}>
          MIRA
        </span>
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close chat"
          className="text-[10px]"
          style={{ color: "var(--dim)" }}
        >
          ✕
        </button>
      </div>

      <div ref={logRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
        {turns.map((t, i) => (
          <p
            key={i}
            className="text-[10.5px] leading-relaxed"
            style={{ color: t.from === "mira" ? "var(--txt)" : "var(--dim)" }}
          >
            <span
              className="font-bold"
              style={{ color: t.from === "mira" ? "var(--accent)" : "var(--dim)" }}
            >
              {t.from === "mira" ? "MIRA: " : "YOU: "}
            </span>
            {t.text}
          </p>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-1 border-t-2 p-2"
        style={{ borderColor: "var(--edge)" }}
      >
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask MIRA…"
          aria-label="Message MIRA"
          className="min-w-0 flex-1 border-2 px-2 py-1 text-[10px] outline-none"
          style={{ borderColor: "var(--edge)", background: "var(--panel)", color: "var(--txt)" }}
        />
        <button type="submit" className="px-btn px-2 py-1 text-[9px]">
          Send
        </button>
      </form>
    </div>
  );
}
