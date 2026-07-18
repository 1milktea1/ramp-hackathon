"use client";

import { listCampaigns } from "@/lib/campaigns";
import type { CampaignId } from "@/lib/types";

type CampaignSelectProps = {
  onSelect: (campaignId: CampaignId) => void;
};

/** Ugly-but-functional campaign picker. Person D restyles later. */
export function CampaignSelect({ onSelect }: CampaignSelectProps) {
  const campaigns = listCampaigns();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
          Exit Code
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Citywide</h1>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          Choose a city. You have twelve minutes before the system locks down.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
        {campaigns.map((campaign) => (
          <button
            key={campaign.id}
            type="button"
            onClick={() => onSelect(campaign.id)}
            className="rounded-lg border border-white/10 bg-zinc-900/80 p-5 text-left transition hover:border-amber-300/40 hover:bg-zinc-900"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
              {campaign.city}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {campaign.title}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">{campaign.subtitle}</p>
            <p className="mt-4 font-mono text-xs text-amber-300/80">
              {campaign.scenes.length} stages · {Math.round(campaign.durationSec / 60)}{" "}
              min
            </p>
          </button>
        ))}
      </div>
    </main>
  );
}
