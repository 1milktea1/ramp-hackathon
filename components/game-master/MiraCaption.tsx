"use client";

/**
 * Caption slot for MIRA (plan.md §7, README §7). Person C owns the pressure
 * score, the static hint lookup and the /api/mira wrap; this component is only
 * the presentation surface, so it renders whatever message it is handed.
 *
 * Positioned bottom-center of the stage and never over the device plate.
 */
export function MiraCaption({
  message,
  urgency = "calm",
  onDismiss,
}: {
  message: string | null;
  urgency?: "calm" | "focused" | "urgent" | "critical";
  onDismiss?: () => void;
}) {
  if (!message) return null;

  const accent =
    urgency === "critical" || urgency === "urgent"
      ? "var(--hot)"
      : "var(--accent)";

  return (
    <div
      className="pointer-events-auto absolute bottom-4 left-1/2 z-20 w-[78%] max-w-2xl -translate-x-1/2 border-2 px-3 py-2"
      style={{ borderColor: "var(--edge)", background: "rgba(11,14,20,0.94)" }}
      role="status"
      aria-live="polite"
    >
      <p className="text-[11px] leading-relaxed">
        <span className="font-bold tracking-[0.15em]" style={{ color: accent }}>
          MIRA:{" "}
        </span>
        <span style={{ color: "var(--txt)" }}>{message}</span>
      </p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="absolute right-1 top-1 px-1 text-[10px]"
          style={{ color: "var(--dim)" }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
