"use client";

import type { CampaignDefinition } from "@/lib/types";
import { useGameStore } from "@/lib/store";

/**
 * Win/lose screen (plan.md §2 #5, P1 results titles).
 * Titles are assigned deterministically from play style — MIRA does not pick
 * them, since nothing that affects outcome may come from the model (§12).
 */
function playStyleTitle(campaign: CampaignDefinition, args: {
  hintsGiven: number;
  wrongAttempts: number;
  secondsUsed: number;
}): string {
  const sf = campaign.id === "san-francisco-swe";
  if (args.hintsGiven === 0 && args.wrongAttempts === 0)
    return sf ? "Clean Compile" : "Perfect Arbitrage";
  if (args.wrongAttempts === 0) return sf ? "Careful Engineer" : "Calm Under Volatility";
  if (args.hintsGiven === 0) return sf ? "Self-Sufficient Operator" : "Signal Trader";
  if (args.secondsUsed < campaign.durationSec / 2)
    return sf ? "Fast Patcher" : "Probability Navigator";
  return sf ? "Systems Mechanic" : "Market Mechanic";
}

export function ResultsScreen({
  campaign,
  won,
  onRestart,
  onExit,
}: {
  campaign: CampaignDefinition;
  won: boolean;
  onRestart: () => void;
  onExit: () => void;
}) {
  const hintsGiven = useGameStore((s) => s.hintsGiven);
  const wrongAttempts = useGameStore((s) => s.wrongAttempts);
  const completedPuzzleIds = useGameStore((s) => s.completedPuzzleIds);
  const timeRemainingSec = useGameStore((s) => s.timeRemainingSec);

  const secondsUsed = campaign.durationSec - timeRemainingSec;
  const totalQuestions = campaign.scenes.reduce(
    (n, s) => n + s.requiredPuzzleIds.length,
    0
  );
  const solved = completedPuzzleIds.filter((id) => id !== "finale").length;

  const mins = Math.floor(secondsUsed / 60);
  const secs = secondsUsed % 60;

  const stats: [string, string][] = [
    ["QUESTIONS", `${solved}/${totalQuestions}`],
    ["TIME USED", `${mins}:${String(secs).padStart(2, "0")}`],
    ["WRONG ATTEMPTS", String(wrongAttempts)],
    ["HINTS TAKEN", String(hintsGiven)],
  ];

  return (
    <main
      className="grid flex-1 place-items-center p-6"
      data-campaign={campaign.id}
      style={{ background: "var(--ink)" }}
    >
      <div className="w-full max-w-lg">
        <p
          className="text-[10px] tracking-[0.35em]"
          style={{ color: won ? "var(--lit)" : "var(--hot)" }}
        >
          {won ? "SYSTEM RESTORED" : "LOCKDOWN COMPLETE"}
        </p>
        <h2 className="mb-1 text-3xl font-bold">
          {won ? "You made it out." : "Time expired."}
        </h2>
        <p className="mb-7 text-[11px] leading-relaxed" style={{ color: "var(--dim)" }}>
          {won
            ? `${campaign.city} is back online.`
            : `The ${campaign.city} network stayed locked. The code was never entered.`}
        </p>

        {won && (
          <div className="px-border mb-6 p-4" style={{ background: "var(--panel)" }}>
            <p className="text-[9px] tracking-[0.2em]" style={{ color: "var(--dim)" }}>
              PLAY STYLE
            </p>
            <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>
              {playStyleTitle(campaign, { hintsGiven, wrongAttempts, secondsUsed })}
            </p>
          </div>
        )}

        <div className="mb-7 grid grid-cols-2 gap-3">
          {stats.map(([label, value]) => (
            <div key={label} className="border-2 p-3" style={{ borderColor: "var(--edge)" }}>
              <p className="text-[8px] tracking-[0.2em]" style={{ color: "var(--dim)" }}>
                {label}
              </p>
              <p className="text-xl font-bold tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onRestart} className="px-btn px-4 py-3 text-[10px]">
            Run it again
          </button>
          <button onClick={onExit} className="px-btn px-4 py-3 text-[10px]">
            Pick another city
          </button>
        </div>
      </div>
    </main>
  );
}
