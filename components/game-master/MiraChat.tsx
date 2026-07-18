"use client";

// MIRA CHAT — ask the game master about the room (README §7-12).
//
// Lives in the SceneShell footer. Shows the "MIRA conviction" meter + an
// "Ask MIRA" toggle. Opening it reveals a transcript panel where the player can
// type a free-text question OR fire a quick "Request hint". Every message POSTs
// /api/hint (which already accepts playerMessage), so the same guardrails apply:
// the meter advances halfway to 100% each turn, hints escalate with it, and MIRA
// NEVER unlocks anything or reveals a final room code.
//
// The engine still validates answers — this panel only advises.

import { useEffect, useRef, useState } from "react";
import { getCampaign } from "@/lib/campaigns";
import { emit } from "@/lib/events";
import { useGameStore } from "@/lib/store";
import type { HintPuzzleContext, HintRequest, HintResponse } from "@/lib/hint";

type ChatTurn = {
  id: number;
  role: "player" | "mira";
  text: string;
};

export function MiraChat({
  sceneId,
  onHint,
}: {
  // Parent passes key={sceneId} so the transcript + meter reset each room.
  sceneId: string;
  onHint?: (message: string) => void;
}) {
  const campaignId = useGameStore((s) => s.campaignId);
  const sceneIndex = useGameStore((s) => s.sceneIndex);
  const completedPuzzleIds = useGameStore((s) => s.completedPuzzleIds);
  const wrongAttempts = useGameStore((s) => s.wrongAttempts);
  const hintsGiven = useGameStore((s) => s.hintsGiven);
  const timeRemainingSec = useGameStore((s) => s.timeRemainingSec);
  const secondsSinceMeaningfulProgress = useGameStore(
    (s) => s.secondsSinceMeaningfulProgress
  );

  const [open, setOpen] = useState(false);
  const [conviction, setConviction] = useState(0);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const nextId = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Keep the transcript pinned to the newest turn.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, open, loading]);

  if (!campaignId) return null;
  const campaign = getCampaign(campaignId);
  const scene = campaign.scenes[sceneIndex];
  if (!scene) return null;

  function pushTurn(role: ChatTurn["role"], text: string) {
    setTurns((t) => [...t, { id: nextId.current++, role, text }]);
  }

  async function send(playerMessage?: string) {
    if (loading) return;
    const question = playerMessage?.trim();
    setLoading(true);
    emit("hint_request", { sceneId });
    if (question) pushTurn("player", question);

    const puzzles: HintPuzzleContext[] = scene.puzzles.map((p) => ({
      id: p.id,
      prompt: p.prompt,
      category: p.category,
      completed: completedPuzzleIds.includes(p.id),
      hints: p.hints,
    }));

    const body: HintRequest = {
      campaignTitle: campaign.title,
      sceneTitle: scene.title,
      puzzles,
      requiredPuzzleIds: scene.requiredPuzzleIds,
      completedPuzzleIds,
      wrongAttempts,
      hintsGiven,
      timeRemainingSec,
      secondsSinceMeaningfulProgress,
      priorConviction: conviction,
      playerMessage: question || undefined,
    };

    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`MIRA request failed (${res.status})`);
      const data = (await res.json()) as HintResponse;
      setConviction(data.conviction);
      pushTurn("mira", data.hint);
      onHint?.(data.hint);
    } catch {
      const msg = "I lost the channel for a second — ask me again.";
      pushTurn("mira", msg);
      onHint?.(msg);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    void send(q);
  }

  const pct = Math.round(conviction);

  return (
    <div className="relative flex items-center gap-2">
      {open && (
        <div
          className="absolute bottom-full right-0 z-30 mb-2 flex w-80 flex-col border-2"
          style={{ borderColor: "var(--edge)", background: "rgba(11,14,20,0.98)" }}
          role="dialog"
          aria-label="Chat with MIRA"
        >
          <div
            className="flex items-center justify-between gap-2 border-b px-3 py-2"
            style={{ borderColor: "var(--edge)" }}
          >
            <span
              className="text-[10px] font-bold tracking-[0.2em]"
              style={{ color: "var(--accent)" }}
            >
              MIRA · ask the room
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="px-1 text-[11px]"
              style={{ color: "var(--dim)" }}
            >
              ✕
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex max-h-64 min-h-[7rem] flex-col gap-2 overflow-y-auto px-3 py-3"
          >
            {turns.length === 0 && (
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--dim)" }}>
                Ask me anything about this room — what a terminal wants, where to
                look, how to read a clue. I won&apos;t hand you the code, but I&apos;ll
                point you at it.
              </p>
            )}

            {turns.map((turn) =>
              turn.role === "player" ? (
                <div key={turn.id} className="self-end max-w-[85%]">
                  <p
                    className="border px-2 py-1 text-[11px] leading-relaxed"
                    style={{
                      borderColor: "var(--edge)",
                      background: "var(--panel)",
                      color: "var(--txt)",
                    }}
                  >
                    {turn.text}
                  </p>
                </div>
              ) : (
                <div key={turn.id} className="self-start max-w-[90%]">
                  <p className="text-[11px] leading-relaxed">
                    <span
                      className="font-bold tracking-[0.15em]"
                      style={{ color: "var(--accent)" }}
                    >
                      MIRA:{" "}
                    </span>
                    <span style={{ color: "var(--txt)" }}>{turn.text}</span>
                  </p>
                </div>
              )
            )}

            {loading && (
              <p className="text-[11px]" style={{ color: "var(--dim)" }}>
                MIRA is thinking…
              </p>
            )}
          </div>

          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 border-t px-2 py-2"
            style={{ borderColor: "var(--edge)" }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              // Stop room-rotation keys (a/d/arrows) from firing while typing.
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Ask MIRA…"
              aria-label="Ask MIRA a question"
              className="min-w-0 flex-1 bg-transparent px-2 py-1 text-[11px] outline-none"
              style={{ color: "var(--txt)" }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-btn px-3 py-1 text-[10px] disabled:opacity-50"
            >
              Send
            </button>
          </form>

          <button
            onClick={() => void send()}
            disabled={loading}
            className="border-t px-3 py-2 text-left text-[10px] disabled:opacity-50"
            style={{ borderColor: "var(--edge)", color: "var(--dim)" }}
          >
            or just request a hint ▸
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="text-[9px] tracking-[0.2em]" style={{ color: "var(--dim)" }}>
          MIRA {pct}%
        </span>
        <div
          className="h-1.5 w-24 overflow-hidden border"
          style={{ borderColor: "var(--edge)", background: "var(--panel)" }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="MIRA conviction"
        >
          <div
            className="h-full transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%`, background: "var(--lit)" }}
          />
        </div>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="px-btn px-3 py-2 text-[10px]"
      >
        {open ? "Close MIRA" : "Ask MIRA"}
      </button>
    </div>
  );
}
