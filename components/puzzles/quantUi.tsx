"use client";

// Shared NYC quant puzzle chrome — matched to MarketMakerPuzzle.
// Use these primitives so Bayesian Ticker / Arb Rush / Market Maker feel like
// one family of reference UIs for the UI teammate.

import type { ReactNode } from "react";

export function QuantCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 p-4">
      {children}
    </div>
  );
}

export function QuantHeader({
  eyebrow,
  prompt,
  timer,
}: {
  eyebrow: string;
  prompt: string;
  timer?: string | null;
  timerUrgent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          {eyebrow}
        </span>
        <p className="text-sm text-zinc-200">{prompt}</p>
      </div>
      {timer != null && timer !== "" && (
        <span className="shrink-0 font-mono text-xs text-zinc-400">{timer}</span>
      )}
    </div>
  );
}

/** Timer chip that turns red under 10s — same as Market Maker. */
export function QuantTimer({
  secondsLeft,
  label,
}: {
  secondsLeft: number;
  label: string;
}) {
  return (
    <span
      className={`shrink-0 font-mono text-xs ${
        secondsLeft <= 10 ? "text-red-400" : "text-zinc-400"
      }`}
    >
      {secondsLeft}s · {label}
    </span>
  );
}

export function QuantWin({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/20 p-4">
      <p className="text-sm font-medium text-emerald-400">{children}</p>
    </div>
  );
}

export function QuantLose({
  children,
  detail,
}: {
  children: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-4">
      <p className="text-sm font-medium text-red-400">{children}</p>
      {detail != null && (
        <p className="mt-2 font-mono text-xs text-zinc-500">{detail}</p>
      )}
    </div>
  );
}

export function QuantHint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-zinc-500">{children}</p>;
}

export function QuantWarn({ children }: { children: ReactNode }) {
  return <p className="text-xs font-medium text-amber-400">{children}</p>;
}

export function QuantError({ children }: { children: ReactNode }) {
  return <p className="text-xs text-red-400">{children}</p>;
}

export function QuantPrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function QuantSecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="rounded-md border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function QuantNumberField({
  placeholder,
  value,
  onChange,
  className = "w-24",
}: {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${className} rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-zinc-100 outline-none focus:border-zinc-500`}
    />
  );
}

export function QuantGuessInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </span>
      <QuantNumberField
        value={value}
        onChange={onChange}
        className="w-20"
      />
    </label>
  );
}

export function QuantMarketInputs({
  label,
  bid,
  ask,
  onBid,
  onAsk,
  trailing,
}: {
  label: string;
  bid: string;
  ask: string;
  onBid: (v: string) => void;
  onAsk: (v: string) => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        <QuantNumberField placeholder="bid" value={bid} onChange={onBid} />
        <span className="text-zinc-600">@</span>
        <QuantNumberField placeholder="ask" value={ask} onChange={onAsk} />
        {trailing}
      </div>
    </div>
  );
}

export function QuantHistory({
  title = "Game master responses",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-zinc-800 pt-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
        {title}
      </span>
      <ul className="flex flex-col gap-1">{children}</ul>
    </div>
  );
}

export function QuantHistoryRow({ children }: { children: ReactNode }) {
  return <li className="text-xs text-zinc-400">{children}</li>;
}

/** Demo-route shell matching /market-maker. */
export function QuantDemoPage({
  eyebrow = "NYC Quant Finale — reference build",
  title,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          {eyebrow}
        </p>
        <h1 className="text-xl font-semibold">{title}</h1>
      </header>
      {children}
      {footer != null && (
        <div className="mt-auto flex items-center gap-3 border-t border-zinc-800 pt-3">
          {footer}
        </div>
      )}
    </main>
  );
}

export function QuantDevRevealButton({
  revealed,
  onToggle,
  hideLabel,
  showLabel,
}: {
  revealed: boolean;
  onToggle: () => void;
  hideLabel: string;
  showLabel: string;
}) {
  return (
    <button
      className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900"
      onClick={onToggle}
    >
      {revealed ? hideLabel : showLabel}
    </button>
  );
}
