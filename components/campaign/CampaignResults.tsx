"use client";

import type { CampaignId } from "@/lib/types";
import { getCampaign } from "@/lib/campaigns";

type CampaignResultsProps = {
  status: "won" | "lost";
  campaignId: CampaignId | null;
  onRestart: () => void;
};

export function CampaignResults({
  status,
  campaignId,
  onRestart,
}: CampaignResultsProps) {
  const campaign = campaignId ? getCampaign(campaignId) : null;
  const won = status === "won";

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
        {campaign?.city ?? "Citywide"}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">
        {won ? "System Restored" : "Lockdown Complete"}
      </h1>
      <p className="max-w-md text-sm text-zinc-500">
        {won
          ? "The deployment reversed. MIRA logs your escape for the results screen later."
          : "Time expired before the final code was accepted. Restart and try a faster route."}
      </p>
      <button
        type="button"
        onClick={onRestart}
        className="rounded bg-amber-400 px-5 py-2.5 text-sm font-medium text-black hover:bg-amber-300"
      >
        Back to campaigns
      </button>
    </main>
  );
}
