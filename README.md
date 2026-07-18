# Exit Code: Citywide

*A browser-based escape room that turns real SWE/quant interview prep into a 12-minute cinematic puzzle game, watched over by an AI Game Master — built for the Ramp hackathon.*

## Motivation, intention & differentiation

Technical interview prep today means paying for LeetCode Premium or a quant-interview course, then grinding alone for weeks — stuck with no one to ask, and no sense of the actual pressure a real interview creates. We wanted the same prep to take minutes, cost nothing, and feel like something worth finishing.

What makes it different from a themed quiz: the engine, not an AI, decides if you're right — `validate(validatorKey, input)` is the only source of truth, so the AI Game Master can never grade, unlock, or invent an answer. Hints are adaptive rather than a static answer key, computed from a pressure score (wrong attempts, idle time, time remaining) plus what the player actually asks. And the physical interactions — a webcam gesture check, a Backspace-driven puzzle — are load-bearing parts of the fiction, not gimmicks bolted on top of a Q&A form.

## The game & repo

Two campaigns, each 3 stages of 3 questions ramping Easy → Easy-Medium → Medium: **System Failure: San Francisco** (SWE, NeetCode-inspired) and **Market Lockdown: New York** (quant, Green Book–inspired). Each stage's 3 answers combine into one hint digit; the 3 stage hints concatenate into the finale escape code (see `plan.md` §3).

- `plan.md` — build plan: task allocation, content map, frozen types, timeline
- `content/` — puzzle content authored by Person B
  - `content/puzzle-bank.md` — the OA-style question bank, difficulty-labeled, sourced by bank ID from `plan.md` §3
  - `content/puzzle-bank.json` — the same bank as machine-readable `PuzzleDefinition` records, ready to drop into `validators.ts` / scene JSON
- The full original game-design spec (§1–§24) is preserved below — `plan.md` cross-references it by section number (e.g. "README §11")

## MIRA & the camera feature

**MIRA** is the in-product AI Game Master — server-side only, reading a `GameMasterContext` (current puzzle, wrong attempts, time remaining, camera state) and returning a typed `GameMasterResponse`. It computes a hint level 0–4 from the pressure score and distinguishes interface confusion, conceptual questions, and "just tell me" from the player's own words — but it never touches `validate()`, so it can't unlock anything even on a bad model output.

The **camera puzzle** runs MediaPipe's `GestureRecognizer` fully client-side — no video ever leaves the browser — for an open-palm check gating the SF finale: live video preview, a hand-outline guide, confidence %, a hold-progress ring, and real-time positional feedback ("move closer," "hand not fully visible"). It's built fallback-first: hold-Space-for-2s always works regardless of lighting or hardware, with MediaPipe detection layered on top rather than depended on.
