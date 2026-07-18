# EXIT CODE: CITYWIDE — Build Plan

**Timebox:** 5 hours to a deployed, judge-playable build  
**Team:** 4 people, near-independent workstreams  
**North star:** A compact, cinematic escape room — NOT a themed online assessment

---

## 1. Verdict

The reduced plan (2 campaigns × 3 scenes) is the **right shape** and **feasible for a judge-playable demo** if you:

1. Treat SF as the gold path; drop NYC content only after SF is playable end-to-end
2. Freeze shared interfaces at hour 0.5
3. Fix the PIN-chain gap caused by cutting scenes 4–5 (see §3)

It is **not** feasible if you try to ship every P0 item at full polish (MediaPipe + full adaptive MIRA + six unique puzzle UIs + cinematic art). Prefer working primitives and static fallbacks over polish.

Keep the discipline from README §23: three complete scenes per campaign beat five unfinished ones.

---

## 2. P0 Must-Ship

Everything below is a hard requirement. If it is not on this list, it does not get built until this list is done.

| # | Requirement | Notes |
|---|---|---|
| 1 | Campaign-selection landing page | Two cards: SF (SWE) / NYC (Quant) |
| 2 | Two distinct campaigns, **3 scenes each** | See §3 content map |
| 3 | Left / Center / Right panorama navigation | Arrow keys + on-screen arrows, sliding transition |
| 4 | Deterministic answer validation | Engine validates; MIRA never unlocks anything |
| 5 | Timer + win/lose states | 12 min normal; judge demo uses debug skips / shorter clock |
| 6 | ≥1 array/indexing, ≥1 probability/math, ≥1 logic | Covered by the 6 scenes |
| 7 | ≥1 non-question progression task | Cable drag (SF-1) and MetroCard swipe (NYC-1) |
| 8 | ≥1 keyboard interaction beyond typing | Backspace-delete-the-9 (SF-2); TimedKey optional for NYC-3 |
| 9 | ≥1 camera interaction w/ live preview + keyboard fallback | Open-palm (SF-3); Space-hold fallback required |
| 10 | MIRA captions + chat + hint button | Caption bar bottom-center; chat icon bottom-right |
| 11 | Adaptive hint strength (Levels 0–4) | Local pressure score + static hints; LLM optional wrap |
| 12 | Debug menu (Shift+D) | Skip puzzle, jump scene, add time, trigger MIRA, restart stage |
| 13 | City backgrounds + OpenAI/Ramp/Cursor node imagery | Stylized illustrations OK; check licensing |
| 14 | Public HTTPS deployment (Vercel) | Camera needs secure context — deploy at H0.5 |

### P1 — Ship if P0 is done

- Animated overlays (fog, tickers, LEDs) — 2 per scene max
- Hotspot hover feedback
- Results screen with play-style titles
- Ambient sound

### P2 — Cut without guilt

- Microphone, clipboard, brightness slider, window-resize tricks
- Full sponsor gallery mechanic, Framer Motion polish
- Finger-count camera, head-lean route authorization
- Scenes 4–5 as full playable stages

---

## 3. Content Map — 3 Scenes + Planted Fourth Digits (sourced from `puzzle-bank.md`)

### Critical fix

README finales assume **four recovered values**, but the MVP cuts scenes 4–5. Keep the 4-digit finale-PIN structure by **planting** the missing fourth value on a sponsor node card (no full puzzle). Put finale PIN entry **inside scene 3** after the principal puzzle.

Every principal puzzle below is now pulled straight from `puzzle-bank.md` (Person B's OA-style, difficulty-labeled draft) instead of a one-off bespoke puzzle, so content and validators trace back to a single source. Swapping the puzzles changed the recovered digits, so **both finale PINs are recomputed from scratch** — see the ordering notes.

### San Francisco — System Failure (SWE)

| Scene | Location | Principal puzzle (bank ID · difficulty) | Answer | Progression task |
|---|---|---|---|---|
| SF-1 | SoMa Transit Stop | `sf_missing_number` · **E1** — NeetCode "Missing Number": board shows `[0,1,2,4,5]`, find the gap | `3` | Drag cable into port |
| SF-2 | Cursor Development Floor | `sf_contains_dup` · **E1** — NeetCode "Contains Duplicate": array `[4,1,9,6,1]` on terminal; arrow-nav to a duplicate, Backspace deletes it | `1` (duplicate removed) | Optional: type `C-U-R-S-O-R` if time |
| SF-3 | OpenAI Mission Bay Node | Frequency puzzle (Single Number / Contains-Duplicate family, **E1**): unique packet `9` | `9` | Camera open-palm → then finale PIN |

**Planted fourth value:** `sf_best_time_stock` · **E1** — NeetCode "Best Time to Buy/Sell Stock": Ramp node card shows prices `[7,1,5,3,6]`; status text asks for the max gain. No full puzzle UI, just short flavor text with the math worked in.

**Recovered values for finale:**

| Label | Source | Bank ID | Value |
|---|---|---|---|
| INDEX | SF-1 | `sf_missing_number` | `3` |
| BUILD | SF-2 | `sf_contains_dup` | `1` |
| PACKET | SF-3 | (frequency, unique-packet) | `9` |
| CAPACITY | Planted Ramp node | `sf_best_time_stock` | `5` |

**Ordering note:** `BUILD → INDEX → PACKET → CAPACITY` → PIN **`1395`**

**Finale interaction (end of SF-3):** after camera verification, terminal template `rollback --code ____`; engine validates `1395`.

### New York — Market Lockdown (Quant)

| Scene | Location | Principal puzzle (bank ID · difficulty) | Answer | Progression task |
|---|---|---|---|---|
| NYC-1 | 23rd Street Subway | `ny_handshakes` · **E1** — classic handshake brainteaser: "6 traders each shake every other trader's hand once" | `15` | MetroCard swipe (speed check, generous) |
| NYC-2 | Ramp Headquarters | EV of `{2,4,6,8}` = `5` (Green Book Ch.2 fair-value family, same shape as `ny_balls_no_replace` / `ny_monty_reveal`); then bounds `4,6` | `5` then `4,6` | Dial / step NumericPuzzle |
| NYC-3 | Midtown Market Data Floor | Sort latencies; median = `9` (Green Book Ch.4 order-statistic family, same shape as `ny_mean` / `ny_stdev_small`) | `9` | Timed-key PIN (or type PIN if TimedKey slips) |

**Planted fourth value:** `ny_locker_doors` · **E2** — classic "100 lockers" toggle brainteaser (mini, n=20 doors, k=1..20 toggles) on an OpenAI/Cursor node card in NYC-3. No full puzzle UI — status text states the setup and the worked answer (perfect squares ≤20 stay open).

**Recovered values for finale:**

| Label | Source | Bank ID | Value |
|---|---|---|---|
| A | NYC-1 handshake answer − 10 | `ny_handshakes` | `5` |
| B | Ramp fair value | (EV family) | `5` |
| C | Median latency | (order-statistic family) | `9` |
| D | Planted locker-doors count | `ny_locker_doors` | `4` |

**Finale board:** `A,B,C,D` → PIN **`5594`**

**Finale interaction (end of NYC-3):** TimedKey sweeping columns; fallback = type `5594` in a terminal. Keyboard-beyond-typing is already satisfied by SF-2 Backspace if TimedKey is cut.

---

## 4. Hour-Zero Contract (first 30 minutes)

The single biggest dependency risk is state shape. Before splitting up:

1. Commit shared types into `/lib/types.ts` — **frozen after minute 30** (see §5)
2. Commit `/lib/validators.ts` stub: `validate(validatorKey, input) => boolean`
3. Commit `/lib/events.ts`: `emitGameEvent(event)` — thin store helper, not a second state system
4. Scaffold Next.js + deploy empty page to Vercel so HTTPS / camera / env vars work at H0.5

After this, each person works against interfaces, not unfinished code.

---

## 5. Frozen Interface Contract

Paste `/lib/types.ts` into every agent prompt. Do not let agents refactor these files after freeze.

### 5.1 Types (`/lib/types.ts`)

```ts
type CampaignId = "san-francisco-swe" | "new-york-quant";

type CampaignDefinition = {
  id: CampaignId;
  title: string;
  subtitle: string;
  city: string;
  durationSec: number;
  topicWeights: {
    softwareEngineering: number;
    mathematics: number;
    probability: number;
    logic: number;
    physical: number;
  };
  scenes: SceneDefinition[];
};

type SceneDefinition = {
  id: string;
  title: string;
  locationLabel: string;
  expectedDurationSec: number;
  backgrounds: {
    left: string;
    center: string;
    right: string;
  };
  overlays: AnimatedOverlay[];
  hotspots: HotspotDefinition[];
  puzzles: PuzzleDefinition[];
  requiredPuzzleIds: string[];
  transition: TransitionDefinition;
};

type PuzzleDefinition = {
  id: string;
  category:
    | "array"
    | "data_structure"
    | "probability"
    | "math"
    | "logic"
    | "observation"
    | "story"
    | "physical";
  interaction:
    | "text"
    | "numeric"
    | "keyboard_sequence"
    | "key_hold"
    | "drag"
    | "slider"
    | "clipboard"
    | "camera"
    | "microphone"
    | "timed_key"
    | "object_selection";
  prompt: string;
  validatorKey: string;
  expectedDurationSec: number;
  hints: {
    level1: string;
    level2: string;
    level3: string;
    level4: string;
  };
};

type GameMasterContext = {
  campaignId: CampaignId;
  sceneId: string;
  puzzleId: string | null;
  totalTimeRemainingSec: number;
  sceneElapsedSec: number;
  puzzleElapsedSec: number;
  wrongAttempts: number;
  hintsGiven: number;
  secondsSinceMeaningfulProgress: number;
  discoveredHotspots: string[];
  requiredHotspotsRemaining: string[];
  collectedItems: string[];
  completedPuzzleIds: string[];
  recentActions: GameEvent[];
  currentInteractionState: Record<string, unknown>;
  cameraState?: {
    permission: "unknown" | "granted" | "denied";
    targetGesture: string | null;
    confidence: number | null;
    failureReason: string | null;
  };
  playerMessage?: string;
};

type GameMasterResponse = {
  responseType:
    | "caption"
    | "chat"
    | "automatic_hint"
    | "camera_guidance"
    | "warning";
  message: string;
  hintLevel: 0 | 1 | 2 | 3 | 4;
  focusTargetId: string | null;
  urgency: "calm" | "focused" | "urgent" | "critical";
  visualEffect: "none" | "pulse" | "glitch" | "highlight" | "timer_warning";
};
```

Supporting types (`GameEvent`, `HotspotDefinition`, `AnimatedOverlay`, `TransitionDefinition`) should be minimal and committed in the same freeze. Prefer:

```ts
type GameEventType =
  | "scene_enter"
  | "hotspot_discover"
  | "answer_submit"
  | "wrong_attempt"
  | "puzzle_complete"
  | "hint_request"
  | "camera_fail"
  | "idle_timeout"
  | "mira_trigger";

type GameEvent = {
  type: GameEventType;
  at: number; // Date.now()
  payload?: Record<string, unknown>;
};
```

### 5.2 Validators (`/lib/validators.ts`)

```ts
validate(validatorKey: string, input: unknown): boolean
```

Hardcoded answers by puzzle / validator key. Unit-testable with Vitest; no UI required.

| validatorKey | Expected |
|---|---|
| `sf1-missing-number` | `3` |
| `sf2-no-duplicates` | array has no duplicate values (start `[4,1,9,6,1]`, drop one `1`) |
| `sf3-unique-packet` | `9` |
| `sf-finale-pin` | `1395` |
| `nyc1-handshakes` | `15` |
| `nyc2-ev` | `5` |
| `nyc2-bounds` | `{ low: 4, high: 6 }` |
| `nyc3-median` | `9` |
| `nyc-finale-pin` | `5594` |

Full prompts, flavor text, and hint-level copy for each `validatorKey` above live in `puzzle-bank.md`.

### 5.3 Event bus (`/lib/events.ts`)

Zustand store is the **source of truth**. `emitGameEvent` is a thin helper that:

1. Appends to `recentActions`
2. Updates counters (`wrongAttempts`, `secondsSinceMeaningfulProgress`, etc.)
3. Notifies MIRA subscribers / triggers automatic hint evaluation

Do **not** maintain a parallel GameMasterContext that can drift from the store. Build context by projecting store state when calling `/api/mira`.

### 5.4 Campaign store fields

```ts
{
  campaignId: CampaignId | null;
  sceneIndex: number;
  view: "left" | "center" | "right";
  discoveredHotspots: string[];
  completedPuzzleIds: string[];
  inventory: string[];
  timeRemainingSec: number;
  wrongAttempts: number;
  hintsGiven: number;
  secondsSinceMeaningfulProgress: number;
  recentActions: GameEvent[];
  status: "select" | "playing" | "won" | "lost";
}
```

---

## 6. Puzzle Primitives (shrink the matrix)

Build **five interaction primitives**, reuse everywhere. Do not invent a new component per scene beat.

| Primitive | Owner | Covers |
|---|---|---|
| `NumericPuzzle` | B | SF-1 keypad, NYC-1 wheels, NYC-2 dial/bounds, PIN entry |
| `ArrayPuzzle` | B | SF-2 arrow-nav + Backspace delete |
| `DragPuzzle` | B | Cable, MetroCard swipe, median card sort (generous hitboxes) |
| `KeyboardSequencePuzzle` / key-hold | B | `CURSOR` sequence **or** cut if late (SF-2 Backspace already counts) |
| `CameraPuzzle` + `TimedKeyPuzzle` | D / B | SF-3 camera; NYC-3 timing (PIN type fallback OK) |

Cut or stub: brightness, clipboard, finger-count camera, head-lean route.

---

## 7. MIRA Strategy — Static First, LLM Second

Ship in this order so a dead API never blocks the game:

1. **Client pressure score** (README §11 weights) → hint level 0–4
2. **Lookup** static `hints.levelN` from scene / puzzle JSON
3. **Optional** `POST /api/mira` rewrites tone / answers chat; 4s timeout + one retry; on any failure return static

Unsolicited nudges (e.g. 3 wrong answers + 60s idle) fire from **local telemetry**, not the model.

Intent handling (“just tell me” vs “smallest hint” vs concept question) = keyword rules locally + LLM when available.

MIRA may explain, hint, encourage, direct attention. MIRA may **not** unlock scenes, declare answers correct, invent objects, or change PINs.

---

## 8. Task Allocation

### Person A — Engine & Shell

**Owns:** scaffold, routing, global state, scene framework, timer, deployment.

- Next.js + TypeScript + Tailwind; Vercel pipeline
- Zustand campaign store (§5.4)
- `SceneShell`, `PanoramaView` (L/C/R, ~300ms slide), `NavigationArrows`, `Hotspot`, `ObjectModal`
- `Timer`, win/lose screens, `DebugMenu` (Shift+D)
- Ugly-but-functional `CampaignSelect` (D restyles later)

**Delivers by ~H1.5:** scene loader that renders any `SceneDefinition`.

### Person B — Puzzles & Content

**Owns:** puzzle primitives, validators, both campaigns’ JSON.

- Implement primitives in §6
- `validators.ts` + Vitest
- Six scene JSON files: hotspots, clues, prompts, hints L1–L4, planted fourth digits, PIN chains
- Wire puzzle complete → `emitGameEvent` → scene / finale transition

**Independence:** build puzzles on standalone routes; drop into shell when A is ready.

### Person C — MIRA

**Owns:** AI end-to-end + UI.

- Pressure-score engine; static hint lookup
- `POST /api/mira` with structured `GameMasterResponse`; never throws
- `MiraCaption`, `MiraChat`, `HintButton`
- Test harness page with sliders for wrongAttempts / time / inactivity
- Subscribes to store / `emitGameEvent`; never validates answers

### Person D — Media & Hardware

**Owns:** camera, visuals, atmosphere, sponsor nodes.

1. **First:** `CameraPuzzle` Space-hold fallback (2s) — intentional UI, always works
2. **Then:** MediaPipe Open_Palm, live preview, framing overlay, confidence %, hold ring (~0.8s), positional feedback
3. Six wide backgrounds (one per scene); CSS crop for L/C/R
4. Shared OpenAI / Ramp / Cursor node cards
5. 2 CSS/SVG overlays per scene; hotspot used/hover styling; campaign select / results polish

Preload MediaPipe model on campaign select. Test camera on the **demo laptop** by H3.

### Dependency map

```text
A → everyone (scene shell by H1.5)   ← only hard dependency
B ↔ C: emitGameEvent + shared types only
D → A: assets by filename; CameraPuzzle plugs in like any puzzle
```

---

## 9. Timeline Checkpoints

| Time | Gate |
|---|---|
| **H0.5** | Types frozen, empty app on Vercel, team split |
| **H1.5** | A: shell renders a scene. B: 2 puzzles pass validators. C: static hints + API round-trip. D: Space fallback + local palm detect |
| **H3.0** | Full SF campaign playable start-to-finish (integration milestone) |
| **H4.0** | Both campaigns playable; MIRA live; camera on prod HTTPS |
| **H4.5** | Feature freeze. Bug fixes, hint polish, judge dry run |
| **H5.0** | Ship |

Budget **60–90 minutes after H3 for glue only** — no new features.

```text
H0.5 types+deploy
    → A SceneShell
    → B validators+puzzles
    → C mira static→api
    → D camera space→mediapipe
         → H3 SF vertical slice
              → H4 NYC content
                   → H4.5 freeze → H5 ship
```

---

## 10. Art Budget

- One wide 16:9 image per scene × CSS `object-position` for L/C/R → **6 images**, not 18
- Locked style prompt across all scenes (stylized cinematic night, teal/amber, wide 16:9)
- Sponsor nodes: 3 shared cards reused in both campaigns
- Overlays: fog + one blink/ticker per scene max

---

## 11. What To Do Differently (summary)

1. **Plant fourth PIN digits** — do not pretend scenes 4–5 exist as playable stages
2. **Five puzzle primitives** — not one component per beat
3. **MIRA static-first** — LLM is enhancement; local nudges always work
4. **One state system** — Zustand + thin `emitGameEvent`, not dual contexts
5. **Camera: Space first, MediaPipe second** — demo cannot depend on CV alone
6. **NYC reuses primitives** — not “pure JSON” unless components already exist
7. **SF gold path** — NYC content only after H3 SF slice is green

## What Not To Change

- Two campaigns, 3 scenes each
- L/C/R panorama + arrows
- Engine validates; MIRA hints only
- 12 min clock / debug for judge speed
- Early Vercel deploy
- Shift+D debug menu

---

## 12. Definition of Done (Judge Demo)

- [ ] Cold-load Vercel URL on a fresh laptop → pick SF → finish in ≤8 min (debug skips OK)
- [ ] Camera works on demo laptop **and** Space fallback is shown
- [ ] Kill AI API key → MIRA degrades to static hints; game still completable
- [ ] Ask MIRA “what is an index?” mid SF-1 → concept answer, no spoiler
- [ ] 3 wrong answers + idle ~60s → unsolicited Level 2+ nudge
- [ ] Final PIN `1395` validates; wrong PIN does not
- [ ] NYC PIN `5594` validates if campaign is in the demo path
- [ ] Shift+D can skip / jump / add time for the live walkthrough

**Judge script (lock at H4.5):** cold load → SF → debug skips as needed → show camera + Space → kill API key → static hints → reject bad PIN → enter `1395` → win.
