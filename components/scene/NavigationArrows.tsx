"use client";

export function NavigationArrows({
  onLeft,
  onRight,
  canLeft,
  canRight,
}: {
  onLeft: () => void;
  onRight: () => void;
  canLeft: boolean;
  canRight: boolean;
}) {
  return (
    <>
      <button
        onClick={onLeft}
        disabled={!canLeft}
        aria-label="Turn left"
        className="px-btn absolute left-3 top-1/2 z-10 h-12 w-8 -translate-y-1/2 text-sm"
      >
        ◀
      </button>
      <button
        onClick={onRight}
        disabled={!canRight}
        aria-label="Turn right"
        className="px-btn absolute right-3 top-1/2 z-10 h-12 w-8 -translate-y-1/2 text-sm"
      >
        ▶
      </button>
    </>
  );
}
