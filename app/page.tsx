// Placeholder landing page. Person A (Engine & Shell) owns the real CampaignSelect.
// Kept intentionally minimal so the shared architecture can be built/deployed first.

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
        Exit Code
      </p>
      <h1 className="text-4xl font-semibold tracking-tight">Citywide</h1>
      <p className="max-w-md text-sm text-zinc-500">
        Shared architecture is in place. Campaign selection coming soon.
      </p>
    </main>
  );
}
