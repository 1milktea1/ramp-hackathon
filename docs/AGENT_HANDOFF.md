# Agent Handoff — Exit Code: Citywide (`erica`)

**Repo:** `1milktea1/ramp-hackathon`  
**Primary branch for this workstream:** `erica`  
**Base / merge target:** `main`  
**Vercel:** project `mira24/ramp-hackathon` — preview `https://ramp-hackathon-git-erica-mira24.vercel.app`  
**Related branches:** `pedro-navigation-ui` (shell/UI), `alina` (plan/content), `main` (market-maker engine source of truth)

---

## 1. Product in one paragraph

Browser escape room for a Ramp hackathon. Two campaigns × 3 stages. SF = SWE OA-style questions; NYC = quant/probability. AI Game Master **MIRA** captions/hints (static-first). Engine validates answers — MIRA never unlocks. NYC stage 3 is a **market-maker** desk (not three numeric questions).

Docs of record: `README.md` (full design), `plan.md` (build plan; §3 content map has drifted in places — trust code + this handoff for NYC finale).

---

## 2. Ownership / conflict rules

| Lane | Owns | Do not casually edit |
|---|---|---|
| Frozen contracts | `lib/types.ts`, `lib/validators.ts`, `lib/events.ts`, `lib/store.ts` | Shape changes |
| Content / answers | `lib/campaigns.ts`, `lib/validators.answers.ts`, `lib/progress.ts` | — |
| Market engine (from `main`) | `lib/market-game.ts` | Keep pure; no React |
| Shell / scenes | `components/scene/*`, `components/system/*` | — |
| MIRA | `lib/mira.ts`, `components/game-master/*` | — |
| Market UI (erica) | `components/puzzles/MarketMakerFinale.tsx`, `SealedDice.tsx` | Prefer updating Finale over plain Puzzle |

Work on **`erica`**. Prefer additive files. Push only when asked (owner preference has varied).

---

## 3. Current architecture (as of this handoff)

### App flow
- `app/page.tsx` — campaign select → `SceneShell` while `playing` → results when `won`/`lost`
- `components/scene/SceneShell.tsx` — panorama L/C/R, puzzles, MIRA caption/chat, digit tray, SF finale room / NYC market panel
- `Shift+D` → `DebugMenu` (skip puzzle, jump scene, jump to NYC exchange desk)

### Campaigns
- Defined in `lib/campaigns.ts` (`SAN_FRANCISCO`, `NEW_YORK`)
- Stages 1–2: three terminals (left/center/right) → `PuzzleModal` + optional `PuzzleAid`
- **NYC stage 3:** single center hotspot **Exchange Desk** → opens `MarketMakerFinale` (left/right empty)
- SF last stage still uses digit-code / `FinaleRoom` path
- Stage hint digits → tray code via `lib/progress.ts` (`finalCode`); SF unlock `577`; NYC tray still computes `467` with market hint digit `7`

### Validators
- Registry: `validate(key, input)` in `lib/validators.ts`
- Registrations: `lib/validators.answers.ts`
- NYC market: `registerValidator("ny-finale-market", (input) => checkGuess(getSession(), input))`

### MIRA
- `lib/mira.ts` — pressure score + static response builder
- `MiraCaption`, `MiraChat` — presentation
- Optional LLM wrap may still be incomplete; static path must always work

### Art
- Backgrounds under `public/bg/` (`sf-1.png`, `sf-2.jpeg`, …, `ny-3.jpeg`, finales)
- Prompts: `docs/asset-prompts.md`

---

## 4. Market-maker game logic (UPDATED — match `main` @ `8a3b44e`)

**Source of truth for engine:** `lib/market-game.ts` (synced from `main`).

| Rule | Detail |
|---|---|
| Dice | **Two d6 (1–6) + one d10 (1–10)** — *not* d7+2d10 |
| Quantities | Player quotes **sum** and **product** markets each round |
| GM response | `evaluateMarket`: BUY if value > ask; SELL if value < bid; HOLD if inside |
| Rounds | 3 market rounds, then guess (`MarketMakerFinale` — **no per-round timer** on erica) |
| Guess | **One shot.** Correct → `completePuzzle` + `setStatus("won")`. Wrong → reveal roll + `setStatus("lost")` |
| Guess shape | `{ d6a, d6b, d10 }` — d10 exact; two d6s unordered pair |
| Session | `startSession` / `getSession` / `endSession` module singleton |

**UI entry points**
- In-campaign: NYC stage 3 center desk → `MarketMakerFinale`
- Demo: `/market-maker`
- Debug: `Shift+D` → “Jump to exchange desk”

**Do not** put correctness in MIRA or the UI — only `evaluateMarket` + `validate("ny-finale-market", …)`.

---

## 5. Key file map

```
lib/
  market-game.ts          # 2d6+d10 engine (from main)
  nyc-finale.ts           # PuzzleDefinition for market desk
  campaigns.ts            # Scene content; NY_STAGE_3 = one center market
  progress.ts             # HINT_DIGITS incl. nyc-finale-market: 7
  validators.answers.ts   # ny-finale-market → checkGuess
  mira.ts                 # Pressure + static hints
components/
  puzzles/MarketMakerFinale.tsx  # Full MIRA UI (captions, thinking, dice)
  puzzles/SealedDice.tsx
  puzzles/MarketMakerPuzzle.tsx  # Thin wrapper → Finale
  scene/SceneShell.tsx           # Opens market panel when validatorKey matches
  system/DebugMenu.tsx
docs/
  AGENT_HANDOFF.md        # This file
  asset-prompts.md
```

---

## 6. What the previous agent just did

1. Synced `lib/market-game.ts` to main’s **2d6 + 1d10** + one-guess-lose semantics.
2. Updated `MarketMakerFinale` / `SealedDice` / prompts / demo reveal to match.
3. Kept erica UX: no market round timer; MIRA caption + thinking log; panel activated from center desk.
4. Wrote this handoff.

---

## 7. Likely next tasks

- [ ] Merge/rebase `erica` ↔ `main` carefully (main has plain `MarketMakerPuzzle`; erica has Finale UI)
- [ ] Confirm SceneShell + FinaleRoom still correct after pedro merge for SF win path
- [ ] Playtest NYC: markets → one wrong guess → lost; one right guess → won
- [ ] Align any leftover d7/d10a copy in docs/plan
- [ ] Vercel: Framework Next.js; Deployment Protection off for public demo
- [ ] Optional: strip round timer from main’s `MarketMakerPuzzle` if that file is reintroduced

---

## 8. Quick verify

```bash
git checkout erica && git pull
npm install && npm run build
npm run dev
# NYC → Shift+D → Jump to exchange desk
# Or open /market-maker
```

Guess payload must be `{ d6a, d6b, d10 }` integers.

---

## 9. Conventions for the next agent

- Prefer `MarketMakerFinale` for player-facing market UX; keep `market-game.ts` pure.
- If main advances the engine again, **diff `lib/market-game.ts` first**, then update Finale copy/inputs.
- Don’t invent parallel GameMaster state — project from Zustand via `buildGameMasterContext`.
- Don’t push unless the user asks (or cloud PR policy requires it for the active run).
