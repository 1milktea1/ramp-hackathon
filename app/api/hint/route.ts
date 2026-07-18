// CONVICTION METER — hint API (MIRA, the game master)
//
// Server-only. Calls OpenAI to gauge how close the player is to finishing the
// current room and to write one calibrated hint, then advances the conviction
// meter halfway to 100%. The engine still validates answers; this endpoint
// NEVER unlocks anything and NEVER reveals a final room code (README §12).
//
// Static-first (plan.md §7): any failure (no key, timeout, bad JSON) falls back
// to the puzzle's pre-authored hint copy and still advances the meter.

import { NextResponse } from "next/server";
import {
  clampPct,
  convictionToHintLevel,
  firstUnsolvedRequired,
  nextConviction,
  staticFallbackHint,
  type HintRequest,
  type HintResponse,
} from "@/lib/hint";

export const runtime = "nodejs";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 6000;

const SYSTEM_PROMPT = `You are MIRA, the live game master for a cinematic escape-room game.
The player is trying to finish the current "room" by solving its puzzles.

Your job on each request:
1. Estimate how close the player is to finishing THIS room, as an integer 0-100
   ("closeness"), based on how many required puzzles are already solved, how many
   wrong attempts they have made, and how long they have been stuck.
2. Write exactly ONE short, actionable hint (1-2 sentences) that moves them
   roughly HALFWAY from where they are now to solving the remaining puzzle(s).

Rules:
- Escalate specificity with "hintLevel" (1 = gentle nudge, 4 = almost the method).
- NEVER reveal or compute the final room code / PIN.
- NEVER state an exact final answer or claim an answer is correct — the game
  engine decides correctness, not you.
- Do not mention future rooms, prompts, APIs, tokens, or language models.
- Focus the hint on ONE puzzle; return its id as "focusPuzzleId".
- Respond ONLY with a JSON object of the exact shape:
  {"closeness": number, "hint": string, "hintLevel": 1|2|3|4, "focusPuzzleId": string|null}`;

function buildUserPrompt(req: HintRequest): string {
  const targetConviction = nextConviction(req.priorConviction);
  const targetLevel = convictionToHintLevel(targetConviction);
  const puzzleLines = req.puzzles
    .map((p) => {
      const status = req.completedPuzzleIds.includes(p.id) ? "SOLVED" : "unsolved";
      const required = req.requiredPuzzleIds.includes(p.id) ? "required" : "optional";
      return `- [${status}, ${required}] id=${p.id} (${p.category}): ${p.prompt}`;
    })
    .join("\n");

  return [
    `Campaign: ${req.campaignTitle}`,
    `Room: ${req.sceneTitle}`,
    "",
    "Puzzles in this room:",
    puzzleLines || "(none)",
    "",
    `Wrong attempts so far: ${req.wrongAttempts}`,
    `Hints already given: ${req.hintsGiven}`,
    `Time remaining (sec): ${req.timeRemainingSec}`,
    `Seconds since meaningful progress: ${req.secondsSinceMeaningfulProgress}`,
    req.playerMessage ? `Player asked: "${req.playerMessage}"` : "",
    "",
    `Aim your hint at strength level ${targetLevel} (of 4). Return your own`,
    `independent "closeness" estimate as well.`,
  ]
    .filter(Boolean)
    .join("\n");
}

type OpenAiHint = {
  closeness?: unknown;
  hint?: unknown;
  hintLevel?: unknown;
  focusPuzzleId?: unknown;
};

async function callOpenAi(req: HintRequest): Promise<HintResponse | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_HINT_MODEL || "gpt-4o";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(req) },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as OpenAiHint;
    const hint = typeof parsed.hint === "string" ? parsed.hint.trim() : "";
    if (!hint) return null;

    const modelEstimate =
      typeof parsed.closeness === "number" ? clampPct(parsed.closeness) : undefined;
    const conviction = nextConviction(req.priorConviction, modelEstimate);

    // Trust the meter for the level so the hint tone matches what the player sees.
    const hintLevel = convictionToHintLevel(conviction);

    const focusPuzzleId =
      typeof parsed.focusPuzzleId === "string" && parsed.focusPuzzleId.length > 0
        ? parsed.focusPuzzleId
        : (firstUnsolvedRequired(req)?.id ?? null);

    return {
      conviction,
      hint,
      hintLevel,
      focusPuzzleId,
      usedFallback: false,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  let req: HintRequest;
  try {
    req = (await request.json()) as HintRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Normalize the fields the helpers rely on so a partial body can't crash us.
  const safeReq: HintRequest = {
    campaignTitle: req.campaignTitle ?? "",
    sceneTitle: req.sceneTitle ?? "",
    puzzles: Array.isArray(req.puzzles) ? req.puzzles : [],
    requiredPuzzleIds: Array.isArray(req.requiredPuzzleIds) ? req.requiredPuzzleIds : [],
    completedPuzzleIds: Array.isArray(req.completedPuzzleIds) ? req.completedPuzzleIds : [],
    wrongAttempts: req.wrongAttempts ?? 0,
    hintsGiven: req.hintsGiven ?? 0,
    timeRemainingSec: req.timeRemainingSec ?? 0,
    secondsSinceMeaningfulProgress: req.secondsSinceMeaningfulProgress ?? 0,
    priorConviction: clampPct(req.priorConviction ?? 0),
    playerMessage: req.playerMessage,
  };

  const response = (await callOpenAi(safeReq)) ?? staticFallbackHint(safeReq);
  return NextResponse.json(response);
}
