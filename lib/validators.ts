// DETERMINISTIC VALIDATION CONTRACT (plan.md §5.2, §12)
//
// The game engine — never MIRA — decides if an answer is correct.
//
// This file only defines the FROZEN contract + a registry mechanism.
// Person B (Puzzles & Content) registers the real answers/logic per validatorKey,
// e.g. in a `lib/validators.answers.ts` that calls `registerValidator(...)`.
//
// Contract (do not change signature after freeze):
//   validate(validatorKey: string, input: unknown): boolean

export type ValidatorFn = (input: unknown) => boolean;

const registry = new Map<string, ValidatorFn>();

/**
 * Register the validation logic for a puzzle's validatorKey.
 * Person B owns the actual answers; call this at module load time.
 * Re-registering the same key overwrites the previous validator.
 */
export function registerValidator(validatorKey: string, fn: ValidatorFn): void {
  registry.set(validatorKey, fn);
}

/** True if a validator has been registered for this key. */
export function hasValidator(validatorKey: string): boolean {
  return registry.has(validatorKey);
}

/**
 * Validate a player's raw input against the registered answer for a puzzle.
 * Unknown/unregistered key => false. Any thrown validator error => false
 * (progression must never crash the game).
 */
export function validate(validatorKey: string, input: unknown): boolean {
  const fn = registry.get(validatorKey);
  if (!fn) return false;
  try {
    return fn(input);
  } catch {
    return false;
  }
}

// --- Shared comparison helpers (reusable by Person B's validators) ---

/** Coerce common raw inputs ("7", " 7 ", 7) to a number, or null if not numeric. */
export function toNumber(input: unknown): number | null {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Normalize a string input: trim + collapse internal whitespace. */
export function normalizeString(input: unknown): string {
  return String(input ?? "").trim().replace(/\s+/g, " ");
}

/** Structural equality for JSON-like values (numbers, strings, arrays, plain objects). */
export function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEquals(v, b[i]));
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ak = Object.keys(a as Record<string, unknown>);
    const bk = Object.keys(b as Record<string, unknown>);
    if (ak.length !== bk.length) return false;
    return ak.every((k) =>
      deepEquals(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k]
      )
    );
  }
  return false;
}

/** Compare two arrays as numbers regardless of raw string/number typing. */
export function numericArrayEquals(input: unknown, expected: number[]): boolean {
  if (!Array.isArray(input) || input.length !== expected.length) return false;
  return input.every((v, i) => toNumber(v) === expected[i]);
}
