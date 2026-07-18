// MIRA CHAT — natural-language Q&A helpers (separate from the conviction meter).
//
// Pure types + fallbacks shared by /api/chat and MiraChat. Chat never advances
// the conviction meter and never receives authored hint spoilers (level4 can
// contain the answer). If the player asks for the exact answer / code / PIN,
// MIRA refuses.

import type { PuzzleCategory } from "./types";

/** Puzzle projection for chat — prompts + status only, never answers/hints. */
export type ChatPuzzleContext = {
  id: string;
  prompt: string;
  category: PuzzleCategory;
  completed: boolean;
  required: boolean;
};

/** Body POSTed to /api/chat. */
export type ChatRequest = {
  message: string;
  campaignTitle: string;
  sceneTitle: string;
  locationLabel: string;
  sceneIndex: number;
  sceneCount: number;
  puzzles: ChatPuzzleContext[];
  completedPuzzleIds: string[];
  wrongAttempts: number;
  hintsGiven: number;
  timeRemainingSec: number;
  secondsSinceMeaningfulProgress: number;
};

/** Response returned by /api/chat. */
export type ChatResponse = {
  reply: string;
  /** True when MIRA refused because the player asked for the answer. */
  refusedAnswer: boolean;
  usedFallback: boolean;
};

export const ANSWER_REFUSAL =
  "I can't give you the answer — that has to come from you. Ask me about the room, a concept, or where to look, or press Request Hint for a calibrated nudge.";

/**
 * Lightweight local detector for "just tell me the answer" style asks.
 * Used as a pre-check and as a fallback when the model is unavailable.
 */
export function looksLikeAnswerRequest(message: string): boolean {
  const m = message.trim().toLowerCase();
  if (!m) return false;

  const patterns = [
    /\b(what('| i)?s|whats)\s+(the\s+)?(answer|solution|code|pin|digit|password)\b/,
    /\b(tell|give|just\s+give|just\s+tell)\s+(me\s+)?(the\s+)?(answer|solution|code|pin|digit)\b/,
    /\b(spoil|spoiler)\b/,
    /\breveal\s+(the\s+)?(answer|solution|code|pin)\b/,
    /\bwhat\s+(do\s+i|should\s+i)\s+(type|enter|submit|put\s+in)\b/,
    /\b(exact|final)\s+(answer|code|pin|solution)\b/,
    /\bjust\s+tell\s+me\b/,
    /\bwhat\s+is\s+it\s*\??\s*$/,
  ];

  return patterns.some((re) => re.test(m));
}

/** Offline / error fallback that still respects answer-request refusal. */
export function staticChatFallback(message: string): ChatResponse {
  if (looksLikeAnswerRequest(message)) {
    return { reply: ANSWER_REFUSAL, refusedAnswer: true, usedFallback: true };
  }
  return {
    reply:
      "Channel's fuzzy — I heard you, but I can't reach the room feed right now. Try again, or press Request Hint for a calibrated nudge.",
    refusedAnswer: false,
    usedFallback: true,
  };
}
