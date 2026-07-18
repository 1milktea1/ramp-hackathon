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

## 3. Content Map — 3 Stages × 3 Questions, Hints Combine to the Final Code

### Structure

Each of the 3 scenes is now a **stage** containing **3 short questions** (not one principal puzzle). Difficulty ramps both within a stage and across stages:

| Stage | Q1 | Q2 | Q3 |
|---|---|---|---|
| Stage 1 | Easy | Easy | Easy |
| Stage 2 | Easy | Easy–Medium | Easy–Medium |
| Stage 3 | Easy–Medium | Medium | Medium |

Solving all 3 questions in a stage unlocks that stage's **Hint** — a single digit (0–9). The final stage's lock is opened by entering the **3 stage hints, concatenated in order** — no separate "planted fourth digit" is needed anymore, since 3 stages naturally produce exactly the 3 digits needed for a 3-digit code. This replaces and simplifies the earlier 4-digit PIN-chain design from the previous draft.

**Hint rule (same for every puzzle, so the validator logic is uniform):**

```
hint_digit(puzzle) = ones digit of the puzzle's numeric answer
```

Two answer types aren't naturally numeric — map them by convention, stated per-puzzle below:
- Multi-choice puzzles (e.g. Monty Hall): `SWITCH` → `1`, `STAY` → `0`
- The Backspace-compare puzzle: hint digit = number of Backspace keystrokes the player actually used to resolve the buffer

```
stage_hint = ones digit of (hint_digit(Q1) + hint_digit(Q2) + hint_digit(Q3))
final_code = stage1_hint + stage2_hint + stage3_hint   // concatenated, not summed
```

All puzzles below are pulled from `puzzle-bank.md` (bank IDs in the table); two new Medium-tier NYC puzzles (`ny_bayes_coin`, `ny_weighted_ev`) were added there to fill the Stage 3 Medium slots, since the original bank only went up to Easy-Medium on the quant side.

Non-question elements are unchanged and sit **alongside**, not instead of, the 3 questions: the cable-drag (SF Stage 1) and MetroCard swipe (NYC Stage 1) remain the non-question progression tasks; the camera open-palm check remains a gate — now placed **after Stage 3's hint is unlocked**, guarding the door into the finale room where all 3 hints get entered.

### San Francisco — System Failure (SWE)

| Stage | Q | Diff | Bank ID | Category / Interaction | Prompt | Answer | Hint digit |
|---|---|---|---|---|---|---|---|
| 1 | Q1 | **E1** | `sf_two_sum` | `array` / `numeric` | The terminal displays a security code list `[2,7,11,15]`. The system unlocks only if you find the sum of the two positions whose values add up to the target `9`. Enter the index sum. | `1` | `1` |
| 1 | Q2 | **E1** | `sf_missing_number` | `array` / `numeric` | A damaged access log shows the sequence `[0,1,2,4,5]`. One ID is missing from the sequence. Recover the missing value. | `3` | `3` |
| 1 | Q3 | **E1** | `sf_contains_dup` | `array` / `numeric` | The trading floor scanner recorded IDs `[4,1,9,6,1]`. One ID was accidentally duplicated. Identify the repeated ID. | `1` | `1` |
| **1** | | | | | **Stage 1 Hint = ones digit of (1+3+1)** | | **`5`** |
| 2 | Q1 | **E1** | `sf_best_time_stock` | `math` / `numeric` | The market terminal displays stock prices `[7,1,5,3,6]` over several days. Find the maximum profit possible by choosing the best time to buy and sell once. | `5` | `5` |
| 2 | Q2 | **E2** | `sf_unique_path_count` | `dynamic_programming` / `grid_traversal` | A courier robot must cross a `3 × 7` city grid to deliver a package. It can only travel right or down. Calculate the number of unique routes from the start point to the destination. | `28` | `8` |
| 2 | Q3 | **E2** | `sf_valid_parens` | `logic` / `numeric` | A vault door uses the bracket pattern `(()())` as its authentication sequence. Enter `1` if the pattern is valid; otherwise enter the index of the first invalid symbol. | `1` | `1` |
| **2** | | | | | **Stage 2 Hint = ones digit of (5+8+1=14)** | | **`4`** |
| 3 | Q1 | **E2** | `sf_binary_search` | `logic` / `numeric` | The archive terminal stores sorted access keys `[3,9,14,22,31,40]`. Locate the key `22` and enter its 0-based position. | `3` | `3` |
| 3 | Q2 | **M1** | `sf_max_subarray` | `array` / `numeric` | A server records network load changes `[-2,4,-1,3,-2,2]`. Find the largest continuous period of positive gain. Enter the maximum total change. | `6` | `6` |
| 3 | Q3 | **M1** | `sf_product_except_self` | `array` / `numeric` | A machine analyzes the array `[2,3,4]`. Replace the value at index `1` with the product of all other values. Enter the new value. | `8` | `8` |
| **3** | | | | | **Stage 3 Hint = ones digit of (3+6+8=17)** | | **`7`** |

**Final SF code:** Stage1 ‖ Stage2 ‖ Stage3 = `5` `4` `7` → **`547`**

Camera open-palm verification gates the door into the Bay Control Center room after Stage 3's hint (`7`) unlocks; inside, the player enters `577` (fallback: type it directly if the terminal template is used instead of a keypad).

### New York — Market Lockdown (Quant)

| Stage | Q | Diff | Bank ID | Category / Interaction | Prompt | Answer | Hint digit |
|---|---|---|---|---|---|---|---|
| 1 | Q1 | **E1** | `ny_two_dice_sum7` | `probability` / `numeric` | The trading vault requires a dice verification code. Two dice are rolled, creating 36 possible outcomes. Count how many outcomes produce a total of exactly `7`. | `6` | `6` |
| 1 | Q2 | **E1** | `ny_card_ace` | `probability` / `numeric` | A security analyst checks a standard 52-card deck. The odds of drawing an Ace are written as "1 in ___". Determine the missing number. | `13` | `3` |
| 1 | Q3 | **E1** | `ny_handshakes` | `math` / `numeric` | Six traders meet before the market opens. Each trader shakes hands with every other trader exactly once. Calculate the total number of handshakes. | `15` | `5` |
| **1** | | | | | **Stage 1 Hint = ones digit of (6+3+5)** | | **`4`** |
| 2 | Q1 | **E1** | `ny_coin_flip_ev` | `probability` / `numeric` | A random security system flips a fair coin repeatedly until the first HEAD appears. Determine the expected number of flips needed to unlock the system. | `2` | `2` |
| 2 | Q2 | **E2** | `ny_balls_no_replace` | `probability` / `numeric` | A market analyst inspects a bin containing 5 blue tokens and 3 red tokens. Two tokens are drawn without replacement. Find the numerator of the probability that both selected tokens are red (the denominator is 28). | `3` | `3` |
| 2 | Q3 | **E2** | `ny_monty_reveal` | `logic` / `object_selection` | A game host presents three vault doors, with only one containing the prize. After you choose a door, the host opens a losing door. Decide whether the optimal strategy is to SWITCH doors or STAY with your original choice. | `SWITCH` | `1` |
| **2** | | | | | **Stage 2 Hint = ones digit of (2+3+1)** | | **`6`** |
| 3 | Q1 | **E2** | `ny_locker_doors` | `logic` / `numeric` | The final security chamber contains 20 locked doors. For each round `k = 1` through `20`, the system toggles every door whose number is a multiple of `k`. After all rounds finish, determine how many doors remain open. | `4` | `4` |
| 3 | Q2 | **M1** | `ny_bayes_coin` | `probability` / `numeric` | A vault contains two normal coins and one double-headed coin. A random coin is selected and flipped once, resulting in HEADS. Calculate the percentage chance that the chosen coin was the double-headed coin. | `50` | `0` |
| 3 | Q3 | **M1** | `ny_weighted_ev` | `probability` / `numeric` | A trader evaluates a new strategy with possible returns: +$12 with 25% probability, +$2 with 50% probability, and −$4 with 25% probability. Calculate the expected value of the trade. | `3` | `3` |
| **3** | | | | | **Stage 3 Hint = ones digit of (4+0+3)** | | **`7`** |

**Final NYC code:** Stage1 ‖ Stage2 ‖ Stage3 = `4` `6` `7` → **`467`**

MetroCard-speed swipe (Stage 1, non-question) and the TimedKey sweep (Stage 3 finale, or type-`497` fallback) are unchanged in mechanic — only the source of the digits changed.

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

Validator keys reuse the bank IDs directly from §3 / `puzzle-bank.md` — no separate naming scheme needed.

| validatorKey | Expected | Stage | Hint digit |
|---|---|---|---|
| `sf_two_sum` | `1` | SF-1 | `1` |
| `sf_missing_number` | `3` | SF-1 | `3` |
| `sf_contains_dup` | `1` | SF-1 | `1` |
| `sf_best_time_stock` | `5` | SF-2 | `5` |
| `sf_backspace_compare` | `crsor` (resolved buffer) | SF-2 | `1` |
| `sf_valid_parens` | `1` | SF-2 | `1` |
| `sf_binary_search` | `3` | SF-3 | `3` |
| `sf_max_subarray` | `6` | SF-3 | `6` |
| `sf_product_except_self` | `8` | SF-3 | `8` |
| `sf-finale-code` | `577` | SF finale | — |
| `ny_two_dice_sum7` | `6` | NYC-1 | `6` |
| `ny_card_ace` | `13` | NYC-1 | `3` |
| `ny_handshakes` | `15` | NYC-1 | `5` |
| `ny_coin_flip_ev` | `2` | NYC-2 | `2` |
| `ny_balls_no_replace` | `6` | NYC-2 | `6` |
| `ny_monty_reveal` | `SWITCH` | NYC-2 | `1` |
| `ny_locker_doors` | `4` | NYC-3 | `4` |
| `ny_bayes_coin` | `50` | NYC-3 | `0` |
| `ny_weighted_ev` | `3` | NYC-3 | `3` |
| `ny-finale-code` | `497` | NYC finale | — |

`validate("sf-finale-code", input)` and `validate("ny-finale-code", input)` don't need their own hardcoded digits baked in twice — compute the expected code at runtime as `stage1Hint + stage2Hint + stage3Hint` from the store's already-validated per-puzzle answers, so the two never drift apart. The `577` / `497` values above are the worked answer for reference and testing only.

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
- Six scene JSON files: hotspots, clues, prompts, hints L1–L4, the 9-question-per-campaign content and stage-hint digits, finale codes
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
- [ ] All 9 SF questions (3 per stage) validate individually and each stage's hint digit computes correctly
- [ ] Final SF code `577` (3 stage hints concatenated) validates; wrong code does not
- [ ] NYC code `497` validates the same way if campaign is in the demo path
- [ ] Shift+D can skip / jump / add time for the live walkthrough

**Judge script (lock at H4.5):** cold load → SF → debug skips as needed → show camera + Space → kill API key → static hints → reject bad code → enter `577` → win.
