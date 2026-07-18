// MIRA CHAT — natural-language Q&A (separate from the conviction-meter hint path).
//
// Directly answers the player's question using current room / progress context.
// Does NOT advance the conviction meter. Does NOT receive authored hint spoilers
// (level4 can contain the answer). If the player asks for the exact answer /
// code / PIN, MIRA refuses (README §12).

import { NextResponse } from "next/server";
import {
  ANSWER_REFUSAL,
  looksLikeAnswerRequest,
  staticChatFallback,
  type ChatRequest,
  type ChatResponse,
} from "@/lib/mira-chat";

export const runtime = "nodejs";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 6000;

const SYSTEM_PROMPT = `You are MIRA, the live Game Master for Exit Code: Citywide.

The player is asking you a natural-language question about the CURRENT room.
Answer THAT question directly and helpfully, using only the supplied game state.

Rules:
- Answer the player's exact question. Do not ignore it to push a generic hint.
- Use the current campaign, room, puzzle prompts, solved/unsolved status, wrong
  attempts, and time remaining as context.
- For interface confusion: explain where/how to interact without revealing answers.
- For conceptual questions: explain the concept as it relates to the current puzzle.
- For "where do I look / what should I do" questions: point at the relevant
  terminal or clue using the room context — still without giving the answer.
- NEVER reveal, guess, or compute an exact puzzle answer, digit, PIN, room code,
  or final solution. NEVER say what the player should type/enter as the answer.
- If the player is asking for the answer / solution / code / PIN / what to type,
  set refusedAnswer=true and reply with a clear refusal — do not sneak the answer
  in. Suggest asking about the room/concept, or using Request Hint instead.
- Do not invent objects, clues, or future rooms.
- Do not mention prompts, APIs, tokens, or language models.
- Keep replies to 1-3 short sentences in natural Game Master voice.
- Respond ONLY with JSON of this exact shape:
  {"reply": string, "refusedAnswer": boolean}`;

function buildUserPrompt(req: ChatRequest): string {
  const puzzleLines = req.puzzles
    .map((p) => {
      const status = p.completed ? "SOLVED" : "unsolved";
      const required = p.required ? "required" : "optional";
      return `- [${status}, ${required}] id=${p.id} (${p.category}): ${p.prompt}`;
    })
    .join("\n");

  return [
    `Campaign: ${req.campaignTitle}`,
    `Room: ${req.sceneTitle} (${req.locationLabel})`,
    `Stage: ${req.sceneIndex + 1} of ${req.sceneCount}`,
    "",
    "Puzzles in this room (prompts only — you do NOT know the answers):",
    puzzleLines || "(none)",
    "",
    `Solved puzzle ids: ${req.completedPuzzleIds.join(", ") || "(none)"}`,
    `Wrong attempts so far: ${req.wrongAttempts}`,
    `Hints already given: ${req.hintsGiven}`,
    `Time remaining (sec): ${req.timeRemainingSec}`,
    `Seconds since meaningful progress: ${req.secondsSinceMeaningfulProgress}`,
    "",
    `Player's question: "${req.message}"`,
    "",
    "Answer their question directly. If they are asking for the answer/code/PIN,",
    "refuse (refusedAnswer=true). Otherwise refusedAnswer=false.",
  ].join("\n");
}

type OpenAiChat = {
  reply?: unknown;
  refusedAnswer?: unknown;
};

async function callOpenAi(req: ChatRequest): Promise<ChatResponse | null> {
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
        temperature: 0.5,
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

    const parsed = JSON.parse(content) as OpenAiChat;
    const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
    if (!reply) return null;

    const refusedAnswer = parsed.refusedAnswer === true;
    return {
      reply: refusedAnswer ? reply || ANSWER_REFUSAL : reply,
      refusedAnswer,
      usedFallback: false,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  let req: ChatRequest;
  try {
    req = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = typeof req.message === "string" ? req.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Hard refuse before calling the model when the ask is obviously for the answer.
  if (looksLikeAnswerRequest(message)) {
    return NextResponse.json({
      reply: ANSWER_REFUSAL,
      refusedAnswer: true,
      usedFallback: false,
    } satisfies ChatResponse);
  }

  const safeReq: ChatRequest = {
    message,
    campaignTitle: req.campaignTitle ?? "",
    sceneTitle: req.sceneTitle ?? "",
    locationLabel: req.locationLabel ?? "",
    sceneIndex: req.sceneIndex ?? 0,
    sceneCount: req.sceneCount ?? 1,
    puzzles: Array.isArray(req.puzzles) ? req.puzzles : [],
    completedPuzzleIds: Array.isArray(req.completedPuzzleIds)
      ? req.completedPuzzleIds
      : [],
    wrongAttempts: req.wrongAttempts ?? 0,
    hintsGiven: req.hintsGiven ?? 0,
    timeRemainingSec: req.timeRemainingSec ?? 0,
    secondsSinceMeaningfulProgress: req.secondsSinceMeaningfulProgress ?? 0,
  };

  const response = (await callOpenAi(safeReq)) ?? staticChatFallback(message);
  return NextResponse.json(response);
}
