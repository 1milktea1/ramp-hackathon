# Exit Code: Citywide

*A browser-based escape room that turns real SWE/quant interview prep into a 12-minute cinematic puzzle game, watched over by an AI Game Master — built for the Ramp hackathon.*

https://ramp-hackathon-theta.vercel.app/

Press "Shift + D" to activate admin panel, allowing you to skip puzzles, scenes, etc. 

## Motivation, intention & differentiation

Citywide is a fun, interactive, browser-based escape room that disguises real SWE and quant interview questions (NeetCode-style array/logic puzzles, Green Book–style probability and stats) as a cinematic 12-minute story. An AI Game Master, MIRA, watches your whole session and gives curated guidance when asked, while a fully deterministic engine decides how much to reveal.

Turning recruiting practice from a boring, paid, solitary grind into something people want to finish. 


## The game & repo

Two campaigns, each 3 stages of 3 questions ramping Easy → Easy-Medium → Medium: **System Failure: San Francisco** (SWE, NeetCode-inspired) and **Market Lockdown: New York** (quant, Green Book–inspired). Each stage's 3 answers combine into one hint digit; the 3 stage hints concatenate into the finale escape code (see `plan.md`).

- `plan.md` — build plan: task allocation, content map, frozen types, timeline
- `content/` — puzzle content authored by Person B
  - `content/puzzle-bank.md` — the OA-style question bank, difficulty-labeled, sourced by bank ID from `plan.md`
  - `content/puzzle-bank.json` — the same bank as machine-readable `PuzzleDefinition` records, ready to drop into `validators.ts` / scene JSON
- The full original game-design spec is preserved below — `plan.md` cross-references it by section number (e.g. "README")

## MIRA & the camera feature

**MIRA** is the in-product AI Game Master — server-side only, reading a `GameMasterContext` (current puzzle, wrong attempts, time remaining, camera state) and returning a typed `GameMasterResponse`. It computes a hint level 0–4 from the pressure score and distinguishes interface confusion, conceptual questions, and "just tell me" from the player's own words — but it never touches `validate()`, so it can't unlock anything even on a bad model output.

The **camera puzzle** runs MediaPipe's `GestureRecognizer` fully client-side — no video ever leaves the browser — for an open-palm check gating the SF finale: live video preview, a hand-outline guide, confidence %, a hold-progress ring, and real-time positional feedback ("move closer," "hand not fully visible"). It's built fallback-first: hold-Space-for-2s always works regardless of lighting or hardware, with MediaPipe detection layered on top rather than depended on.
