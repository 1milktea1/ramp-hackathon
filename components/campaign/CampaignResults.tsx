"use client";

import { getCampaign } from "@/lib/campaigns";
import type { CampaignId } from "@/lib/types";

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
    <main
      className="grid flex-1 place-items-center p-6"
      data-campaign={campaignId ?? undefined}
    >
      <div className="w-full max-w-lg text-center">
        <p
          className="text-[10px] tracking-[0.4em]"
          style={{ color: "var(--dim)" }}
        >
          {(campaign?.city ?? "CITYWIDE").toUpperCase()}
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">
          {won ? "SYSTEM RESTORED" : "LOCKDOWN COMPLETE"}
        </h1>
        <p
          className="mx-auto mt-3 max-w-md text-[12px] leading-relaxed"
          style={{ color: "var(--dim)" }}
        >
          {won
            ? "The deployment reversed. The city network is stable again."
            : "Time expired before the final code was accepted. Restart and try a faster route."}
        </p>
        <button
          type="button"
          onClick={onRestart}
          className="px-btn mt-8 px-5 py-3 text-[11px]"
        >
          Back to campaigns
        </button>
      </div>
    </main>
  );
}
