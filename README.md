# ramp-hackathon
swe/quant oa training escape room with ai game master

#chat context prompt: 
# Revised Standardized Game Context and Build Specification

# EXIT CODE: CITYWIDE

## 1. Core Concept

**Exit Code: Citywide** is a browser-based escape-room platform with multiple selectable campaigns. Each campaign takes place across a different city and emphasizes a different technical discipline while still mixing software engineering, mathematics, probability, logic, observation, and physical interactions.

For the hackathon, the game offers two campaigns:

1. **System Failure: San Francisco**

   * Primarily software-engineering focused
   * Includes data structures, arrays, indexing, debugging, sequencing, and light math
   * Takes place across recognizable San Francisco and Silicon Valley-inspired locations

2. **Market Lockdown: New York**

   * Primarily quantitative and mathematics focused
   * Includes probability, expected value, number patterns, estimation, and logic
   * Takes place across Manhattan financial and technology locations

The campaigns should feel like separate escape-room games, not consecutive levels in one worldwide story.

Each campaign moves through several scenes within the same city. Players examine their surroundings, rotate between views, interact with objects, solve short puzzles, perform laptop-based actions, and communicate with an AI Game Master.

The questions should be clever but compact. Most individual puzzle sequences should take approximately **45 seconds to 2 minutes**, not five or ten minutes.

---

# 2. Product Experience

## Player Flow

1. Player reaches the landing page.
2. Player chooses one of two campaigns.
3. A short cinematic introduces the city and emergency.
4. The player proceeds through four or five connected city scenes.
5. Each scene contains:

   * Environmental exploration
   * One principal puzzle
   * Zero or one small supporting task
   * Optional flavor interactions
   * A transition into the next scene
6. The AI Game Master observes the entire session.
7. The player reaches the final city-wide lock and escapes.
8. The results screen evaluates speed, hints, accuracy, and play style.

## Recommended Campaign Length

### Normal Version

**12 to 15 minutes per campaign**

Suggested allocation:

* Introduction and tutorial: 1 minute
* Scene 1: 2 minutes
* Scene 2: 2.5 minutes
* Scene 3: 2.5 minutes
* Scene 4: 3 minutes
* Finale: 2 minutes
* Exploration and transitions: 1 to 2 minutes

### Judge Demo Version

**6 to 8 minutes**

Include a hidden developer menu that can:

* Add time
* Skip a puzzle
* Jump to a scene
* Automatically grant an item
* Simulate a camera interaction
* Trigger the AI Game Master
* Restart the current stage

A suitable shortcut is:

```text
Shift + D
```

---

# 3. Escape-Room Design Principles

Each campaign should follow a mostly linear route between scenes while allowing brief free exploration inside each scene.

The player should be able to look left, center, and right. They can inspect objects in any order, but only a few objects are necessary for progression.

Use a structure of:

```text
Explore → Discover → Connect → Act → Reveal
```

Do not make every step a technical question. A real escape room mixes reasoning with searching, manipulation, story reveals, and satisfying physical actions.

The game should therefore alternate among:

* Technical reasoning puzzles
* Mathematical puzzles
* Logic puzzles
* Observation tasks
* Environmental searching
* Keyboard interactions
* Webcam or microphone interactions
* Short story-driven actions
* Simple item-placement tasks

Good escape-room flow benefits from varied puzzle types, logically available clues, and limited bottlenecks. Deliberately misleading objects should be used sparingly because excessive red herrings tend to interrupt flow rather than deepen it.

---

# 4. Interaction Modes

The game should showcase the laptop itself as part of the escape room.

The intended idea is broader than copy-and-paste. Clipboard use is only one possible example.

## A. Standard Keyboard Input

Examples:

* Type a PIN
* Enter a word
* Use arrow keys to rotate the room
* Hold a key for a certain amount of time
* Press a sequence of keys
* Use `Command`, `Control`, `Shift`, `Option`, or `Alt`
* Use Backspace to “erase” corrupted data
* Use Escape to exit a simulated containment mode
* Use Tab to move among terminals
* Use Caps Lock as an intentional switch
* Press keys corresponding to array indices

## B. Keyboard-State Puzzles

Examples:

* Hold three specified keys simultaneously
* Reproduce a command sequence shown briefly
* Press the correct key only when an animated signal enters a target
* Use arrow keys to route a packet
* Alternate left and right keys in a discovered pattern
* Hold Space to charge a virtual mechanism
* Enter a command using only keys recovered in the room

## C. Clipboard Actions

Clipboard use may appear once, but should not be treated as the primary interaction concept.

Possible uses:

* A corrupted code is copied automatically and must be pasted into a terminal.
* The player must copy text from one machine and paste it into another.
* Pasted content contains invisible spacing or a reversed sequence that must be corrected.
* The Game Master sends a recovery string that must be pasted into a console.

The browser Clipboard API requires a secure context and may require direct user interaction or permission depending on the operation.

## D. Mouse and Trackpad Actions

Browsers cannot directly recognize arbitrary native trackpad gestures, but they can detect pointer movement, clicking, dragging, scrolling, and zoom-related browser events.

Possible actions:

* Drag cables into the correct ports
* Trace a route without touching obstacles
* Scroll through a log to find one anomalous line
* Drag array elements into the correct order
* Move a slider while monitoring a waveform
* Click a rapidly changing target
* Draw a simple path by holding the mouse button
* Rotate a dial through horizontal or circular pointer movement

## E. Webcam and Computer Vision

Possible actions:

* Hold up an open palm
* Show a fist
* Raise a specified number of fingers
* Match a silhouette

Use browser-side MediaPipe recognition when feasible so frames do not have to leave the device. MediaPipe offers browser-compatible hand landmark and gesture-recognition tools.

### Mandatory Camera Preview

Whenever a camera interaction begins:

1. Open a clear camera panel.
2. Show the player’s live video.
3. Overlay a framing guide.
4. Display the required action.
5. Display recognition confidence or progress.
6. Tell the player whether they are:

   * Too far left
   * Too far right
   * Too close
   * Too far
   * Not fully visible
7. Require the pose to be held briefly.
8. Provide a keyboard fallback.

Example layout:

```text
┌─────────────────────────────────────────┐
│ HUMAN VERIFICATION                     │
│                                         │
│         [ LIVE CAMERA VIEW ]            │
│         [ HAND GUIDE OVERLAY ]          │
│                                         │
│ Open your palm and hold it in frame.    │
│ Detection: 72%                          │
│ Hold steady: ██████░░░░                 │
│                                         │
│ Camera unavailable? Hold Space instead. │
└─────────────────────────────────────────┘
```

## F. Microphone and Audio

Possible actions:

* Clap once or twice
* Speak a short discovered word
* Listen to a short Morse-like sequence

Microphone puzzles should have keyboard alternatives because event spaces are noisy.

## G. Screen and Window Actions

Possible browser-detectable actions:

* Resize the browser window until two visual fragments align
* Enter or exit full-screen mode
* Move the cursor to screen edges
* Scroll to reveal a hidden layer
* Focus and blur the browser tab
* Keep the tab active during a timed sequence
* Adjust an in-game brightness or contrast control

## H. Brightness Interaction: Technical Limitation

A normal deployed website generally cannot read or control the laptop’s actual macOS or Windows display-brightness setting.

Therefore, do not promise direct system-brightness detection in the web MVP.

Use one of these alternatives:

### Reliable Option

The player adjusts an **in-game brightness slider** until a hidden code becomes visible.

---

# 5. Visual and Navigation System

Each city scene should consist of three coordinated views:

```text
LEFT ← CENTER → RIGHT
```

The player rotates with:

* On-screen arrows
* Left and Right Arrow keys
* `A` and `D` as alternatives

Use a sliding transition rather than instantly replacing the image.

Each view contains:

* One background image
* Animated overlays
* Clickable hotspots
* Optional foreground layers
* Light ambient sound

## Animated Elements

The backgrounds do not need full interactivity. Small animated details are sufficient:

### San Francisco

* Fog movement
* Cable car passing
* Traffic lights
* Server LEDs
* Office-window lights
* Digital billboards
* Rain or mist
* Bay reflections

### New York

* Stock ticker movement
* Yellow taxis
* Steam vents
* Subway train movement
* Pedestrian silhouettes
* Building lights
* Rain
* Market-screen flicker

## Hotspot Feedback

On hover:

* Cursor changes
* Subtle outline or glow appears
* Optional small label appears

On interaction:

* Object enlarges or opens in a modal
* Caption appears
* Game Master may comment
* Event is recorded

After completion:

* Object changes appearance
* Used clue receives a checkmark or becomes inactive
* Inventory updates when applicable

---

# 6. Office Images and Sponsor Integration

Both campaigns should visibly include **OpenAI, Ramp, and Cursor**.

The offices should not merely appear as logos in a sponsor banner. Their images should be incorporated naturally into the world.

## San Francisco Campaign

Use:

* OpenAI building exterior as a physical destination
* Cursor office or developer-lab representation as another destination
* Ramp office image on a financial-network monitor, transit poster, or remote branch screen

OpenAI publicly describes its headquarters as being in San Francisco, and published imagery shows its Mission Bay office environment. Cursor’s parent company, Anysphere, is also San Francisco based.

## New York Campaign

Use:

* Ramp’s Manhattan office as a physical destination
* OpenAI San Francisco office image on a secure cross-country connection
* Cursor San Francisco office image on a developer-terminal connection

Published reporting has identified Ramp’s Manhattan headquarters space around West 23rd Street.

## Shared Sponsor Gallery Mechanic

Each campaign can include a city operations map with three photographic destination cards:

```text
OPENAI NODE
RAMP NODE
CURSOR NODE
```

Clicking a card opens:

* A stylized office exterior image
* A short fictional status message
* One relevant clue
* A route indicator

Example:

> CURSOR NODE
> Development environment online.
> Three files differ. Only one contains the valid patch.

## Asset Guidance

For the prototype:

* Use images the team has permission to use.
* Confirm licensing and attribution before public deployment.
* Alternatively, produce stylized illustrated building exteriors inspired by the real offices.
* Do not imply that the companies officially endorse the game unless they have done so.

---

# 7. AI GAME MASTER

## Presentation

The AI Game Master should not permanently occupy a large sidebar.

Its primary messages appear as caption-style dialogue near the middle-bottom of the player’s view.

Example:

```text
┌────────────────────────────────────────────────────┐
│ MIRA: One of those server lights is repeating.     │
└────────────────────────────────────────────────────┘
```

The captions should:

* Fade in
* Remain visible long enough to read
* Be dismissible
* Avoid covering the main puzzle
* Display speaker name
* Optionally include a small waveform or avatar
* Use different urgency animations

## Game Master Name

Recommended name:

**MIRA**

Meaning:

**Monitoring and Interactive Response Assistant**

MIRA should feel like an actual escape-room Game Master watching the room, not a generic customer-support chatbot.

---

# 8. Game Master Chat

Include a compact message icon in the lower-right corner.

Opening it reveals a conversational panel where the player may type natural questions.

Examples:

* “What am I supposed to do with the server?”
* “Does the poster matter?”
* “I found 7 but it did not work.”
* “Can you explain what an index is without giving me the answer?”
* “Is the camera detecting me?”
* “I think I solved it. Where do I submit?”
* “Give me a small hint.”
* “I do not understand the probability part.”

## Chat Behavior

MIRA should answer based on:

* Current campaign
* Current scene
* Discovered clues
* Unopened required clues
* Items collected
* Current puzzle state
* Incorrect attempts
* Recent actions
* Previous hints
* Remaining time
* Player’s exact question

MIRA should not provide information about future scenes.

MIRA should not invent nonexistent objects or interactions.

## Hint Button

The interface should still include a visible:

```text
REQUEST HINT
```

The button is for players who do not want to type.

Pressing it triggers the same adaptive hint system as the chat, but with a standard request.

---

# 9. Continuous Monitoring

MIRA monitors the whole session, not only when the player presses the hint button.

The local game engine continually collects telemetry.

MIRA does not need to receive every mouse movement. Instead, the game sends summarized state when a meaningful trigger occurs.

## Meaningful Events

* Player enters a scene
* Player discovers a required clue
* Player opens irrelevant objects repeatedly
* Player submits an answer
* Player makes multiple incorrect attempts
* Player spends too long without progress
* Player asks a question
* Player begins a physical interaction
* Camera recognition repeatedly fails
* Time reaches a warning threshold
* Player completes a scene
* Player reaches the finale

## Automatic Assistance Examples

### Player Has Not Explored

> “Before solving the terminal, inspect the rest of the room.”

### Player Found Every Clue but Has Not Connected Them

> “The labels and the server log describe the same ordering.”

### Player Understands the Logic but Cannot Find the Interface

> “Your reasoning appears sound. The keypad is beneath the center monitor.”

### Player Is Running Out of Time

> “Thirty seconds remain. Ignore the poster. Use the array positions on the keyboard.”

### Camera Is Failing

> “Your hand is partly outside the frame. Move slightly left and hold it farther from the camera.”

---

# 10. Adaptive Hint Strength

MIRA chooses how much information to provide.

## Level 0: Atmospheric Response

No puzzle guidance.

> “The system is unstable, but the node is still responding.”

## Level 1: Attention Nudge

Points toward the relevant clue or concept.

> “The position of each value may matter more than the value itself.”

## Level 2: Method Hint

Suggests an approach.

> “Treat the first position as index zero.”

## Level 3: Intermediate Result

Provides one meaningful step.

> “The requested element is two positions after the first.”

## Level 4: Rescue Hint

Provides almost the entire route when the player is severely stuck or nearly out of time.

> “Use zero-based indexing. The third displayed value corresponds to index two. Press that number on the keypad.”

The final answer should still be withheld when possible, but preventing total failure is more important during the final seconds.

---

# 11. Hint Weighting

Suggested local pressure score:

```ts
const inactivityPressure =
  Math.min(secondsSinceMeaningfulProgress / 50, 1);

const mistakePressure =
  Math.min(wrongAttempts / 3, 1);

const timePressure =
  1 - totalTimeRemainingSec / totalCampaignTimeSec;

const scenePressure =
  Math.min(sceneElapsedSec / expectedSceneDurationSec, 1);

const interactionFailurePressure =
  Math.min(failedCameraOrKeyboardAttempts / 4, 1);

const confusionPressure =
  Math.min(repeatedIrrelevantActions / 6, 1);

const pressure =
  inactivityPressure * 0.25 +
  mistakePressure * 0.22 +
  timePressure * 0.22 +
  scenePressure * 0.15 +
  interactionFailurePressure * 0.10 +
  confusionPressure * 0.06;
```

MIRA should also interpret the player’s natural-language message.

For example:

* “Where is the box?” means interface help, not puzzle help.
* “What is expected value?” means conceptual explanation.
* “Just tell me” permits a stronger hint.
* “Give me the smallest hint possible” requires restraint.

---

# 12. Deterministic Validation

The AI must never determine whether the player solved a puzzle correctly.

The game engine validates all answers using fixed logic.

MIRA may:

* Explain
* Hint
* Encourage
* Comment
* Direct attention
* Diagnose confusion

MIRA may not:

* Unlock a scene
* Declare an answer correct without validation
* Invent an alternative solution
* Change a PIN
* Create new required clues

---

# 13. CAMPAIGN ONE: SYSTEM FAILURE — SAN FRANCISCO

## Focus

Approximately:

* 55% software engineering
* 20% logic
* 15% mathematics
* 10% environmental and physical tasks

## Premise

A corrupted development agent has begun deploying an unfinished infrastructure patch across San Francisco’s technology network.

The patch is moving among three primary nodes:

* OpenAI
* Cursor
* Ramp

If the player cannot isolate the defective deployment before the final release window, every connected terminal in the city will be overwritten.

The player begins at a disabled transit terminal and moves through San Francisco toward the central deployment server.

## Total Time

**12 minutes**

## Scenes

1. SoMa Transit Stop
2. Cursor Development Floor
3. OpenAI Mission Bay Node
4. Ramp Network Connection
5. Bay Control Center Finale

---

## SF SCENE 1: SOMA TRANSIT STOP

### Purpose

* Tutorial
* Navigation
* Easy observation
* Introduction to array indices

### Environment

A closed transit platform at night.

Animated elements:

* Fog
* Flickering sign
* Passing train lights
* Scrolling arrival board
* Paper moving in the wind

### Views

#### Left

* Route map
* Bench
* Dropped access card

#### Center

* Locked station gate
* Numbered keypad
* Transit display

#### Right

* Maintenance panel
* Developer advertisement
* City network map containing OpenAI, Ramp, and Cursor destination photos

### Puzzle

The arrival display shows:

```text
Station Codes:
[8, 3, 1, 7, 4]
```

A maintenance note reads:

```text
NEXT NODE = VALUE AT INDEX 3
SYSTEM INDEXING BEGINS AT 0
```

The player determines:

```text
Index 0 = 8
Index 1 = 3
Index 2 = 1
Index 3 = 7
```

### Answer

```text
7
```

### Interaction

Press `7` on the station keypad.

### Difficulty

Easy, but not entirely trivial for a non-programmer because the room clearly explains zero-based indexing.

### Story Task

After entering the PIN, the gate does not open immediately.

A loose cable is visible beneath the panel.

The player drags the cable into the matching port.

No reasoning is required. This creates a satisfying physical progression moment.

### MIRA Hint Examples

Level 1:

> “The note specifies where counting begins.”

Level 2:

> “The first value is at index zero, not index one.”

Level 3:

> “Count 8 as zero, then continue to index three.”

---

## SF SCENE 2: CURSOR DEVELOPMENT FLOOR

### Purpose

* SWE-focused scene
* Debugging and stack/order logic
* Keyboard interaction

### Environment

A late-night coding floor overlooking San Francisco.

Animated elements:

* Terminal cursor blinking
* Monitor glow
* Server LEDs
* Fog outside
* Automated build progress bars

Include a visible stylized image of the Cursor office node or building during the transition into this scene.

### Story

The corrupted patch has modified one line in a short execution log.

The player must determine which operation caused the final state to become impossible.

### Required Clues

#### Terminal A

```text
START: []
APPEND 4
APPEND 9
REMOVE LAST
APPEND 2
```

#### Terminal B

```text
REPORTED FINAL STATE: [4, 9, 2]
```

#### Whiteboard

```text
REMOVE LAST deletes the most recently added value.
```

### Question

Which operation is inconsistent with the reported final state?

The true execution is:

```text
[]
[4]
[4, 9]
[4]
[4, 2]
```

Therefore, the reported value `9` should not remain.

### Answer

```text
9
```

### Interaction

The player must remove the corrupted `9` from the displayed output using the keyboard.

Possible implementation:

1. Focus a terminal containing `[4, 9, 2]`.
2. Arrow-key navigation moves the cursor among values.
3. Player moves to `9`.
4. Player presses Backspace or Delete.
5. State becomes `[4, 2]`.
6. Build succeeds.

This feels more integrated than typing “9” into an answer box.

### Small Fun Interaction

After fixing the output, the terminal says:

```text
BUILD STALLED — WAKE DEVELOPMENT MACHINE
```

The player must press a discovered sequence:

```text
C U R S O R
```

The keys light up as they are entered.

### MIRA Hint Examples

> “Follow the list after each operation rather than evaluating everything at once.”

> “After REMOVE LAST, the 9 should no longer exist.”

---

## SF SCENE 3: OPENAI MISSION BAY NODE

### Purpose

* Search and pattern recognition
* Hash-map or frequency concept
* Webcam interaction

### Environment

A secure AI research lobby inspired by OpenAI’s San Francisco presence.

Include an office exterior image during arrival, followed by a stylized interior rather than attempting to reproduce a restricted real interior exactly.

Animated elements:

* Model-status displays
* Rotating geometric sculpture
* Elevator lights
* Security scanner
* Glass reflections

### Story

Several model packets were duplicated during transmission. One packet was not duplicated and contains the valid authorization number.

### Clue Displays

Screen 1:

```text
12  5  8  5
```

Screen 2:

```text
3  12  9
```

Screen 3:

```text
8  3  4  4
```

Frequency counts:

* 12 appears twice
* 5 appears twice
* 8 appears twice
* 3 appears twice
* 4 appears twice
* 9 appears once

### Answer

```text
9
```

### Interaction

Player selects packet `9` on a wall display.

### Camera Verification

After selecting the packet:

> “Physical human confirmation required.”

A live camera panel opens.

Required pose:

* Open palm

The player sees:

* Live preview
* Hand outline
* Recognition status
* Hold-progress ring

After holding the gesture for approximately 0.8 seconds:

```text
HUMAN VERIFIED
```

Keyboard fallback:

* Hold Space for two seconds

### Small Story Interaction

The security door opens partially. The player clicks and drags it the remainder of the way.

### MIRA Camera Assistance

> “Your wrist is visible, but two fingers are outside the guide.”

> “Move farther from the camera so your entire hand fits.”

> “Camera confidence is low. Increase the light in front of you.”

---

## SF SCENE 4: RAMP NETWORK CONNECTION

### Purpose

* Light math
* Resource allocation
* Laptop control interaction

### Environment

A remote financial operations room connected to Ramp.

Show a photograph or stylized image of the Ramp office on the connection screen.

Animated elements:

* Expense cards
* Payment routes
* Graph lines
* Data-transfer animation
* Transaction indicators

### Story

The bad deployment is consuming the node’s remaining compute allocation. The player must rebalance three services without exceeding the limit.

### Puzzle

Available capacity:

```text
20 units
```

Required services:

```text
Security: 8
Database: 5
Rollback: 4
```

A corrupted nonessential process consumes:

```text
6
```

Current total:

```text
8 + 5 + 4 + 6 = 23
```

The player must disable the nonessential process and recognize that:

```text
8 + 5 + 4 = 17
```

Remaining capacity:

```text
3
```

### Answer

```text
3
```

### Interaction

This is not a plain typed answer.

The player uses keyboard controls to lower a virtual resource meter from 23 to 17:

* Down Arrow subtracts one
* Shift + Down Arrow subtracts three
* Enter confirms

The discovered target is 17.

Once confirmed, the interface reveals the remaining capacity as the PIN:

```text
003
```

### Optional Brightness-Like Task

The server screen is overexposed.

Player uses an in-game brightness control:

* `[` lowers virtual brightness
* `]` raises virtual brightness

At the correct level, the hidden process label becomes readable:

```text
DEMO_RENDERER — 6 UNITS
```

This provides the brightness experience without pretending the browser can inspect the actual operating-system brightness.

---

## SF FINALE: BAY CONTROL CENTER

### Environment

A command room overlooking the Bay Bridge.

Animated elements:

* Bay lights
* Network routes
* Countdown
* Fog
* Data streams converging

### Final Puzzle

The player has recovered four values:

```text
7
9
9
3
```

Each scene also provided one label:

```text
INDEX
PACKET
CAPACITY
BUILD
```

A deployment note says:

```text
ORDER THE CODES BY THE SOFTWARE PIPELINE:
BUILD → INDEX → PACKET → CAPACITY
```

Map:

* Build = 9 from Cursor
* Index = 7 from transit
* Packet = 9 from OpenAI
* Capacity = 3 from Ramp

Final PIN:

```text
9793
```

### Final Interaction

The player types:

```text
rollback --code 9793
```

They do not need to know command-line syntax in advance because the command template appears:

```text
rollback --code ____
```

### Victory

* Deployment reverses
* Network map changes from red to green
* City lights stabilize
* MIRA announces completion

---

# 14. CAMPAIGN TWO: MARKET LOCKDOWN — NEW YORK

## Focus

Approximately:

* 50% probability and math
* 20% logic
* 15% software concepts
* 15% environmental and physical tasks

## Premise

An automated market-control system has locked several Manhattan financial nodes after detecting impossible pricing data.

The player must travel through the city, reconstruct the correct market state, and prevent a system-wide shutdown.

The campaign moves from the subway to Ramp’s Manhattan office, through a market-data floor, into cross-country AI and development connections, and finally to an exchange control room.

## Total Time

**12 minutes**

## Scenes

1. 23rd Street Subway
2. Ramp Headquarters
3. Midtown Market Data Floor
4. OpenAI and Cursor Remote Nodes
5. Lower Manhattan Exchange Finale

---

## NYC SCENE 1: 23RD STREET SUBWAY

### Purpose

* Tutorial
* Logic pattern
* Environmental interaction

### Environment

A nearly empty subway station.

Animated elements:

* Train passing
* Flickering fluorescent lights
* Rats or paper moving in the distance
* Arrival timer
* Steam

### Puzzle

The station signs show:

```text
2, 6, 12, 20, ?
```

A wall diagram pairs each position with:

```text
1×2
2×3
3×4
4×5
```

The next term is:

```text
5×6 = 30
```

### Answer

```text
30
```

### Interaction

The turnstile has two digit wheels.

Player sets:

```text
3 0
```

using Left and Right Arrow keys.

### Fun Progression Task

After the correct code, the player must click the illuminated MetroCard and drag it through the reader at the correct speed.

Too fast:

> “Swipe again.”

Too slow:

> “Swipe again.”

This adds a playful escape-room interaction without another question.

---

## NYC SCENE 2: RAMP HEADQUARTERS

### Purpose

* Expected value
* Financial theme
* Office image integration

### Environment

A fictionalized after-hours Ramp operations floor in Manhattan.

Use the Ramp exterior or office image as the transition card.

Animated elements:

* Expense alerts
* Card transactions
* Manhattan traffic
* Dashboard graphs
* Elevators

### Puzzle

A corporate card generates one of four equally likely verification values:

```text
$2
$4
$6
$8
```

Expected value:

```text
(2 + 4 + 6 + 8) / 4 = 5
```

### Answer

```text
5
```

### Interaction

The player adjusts a verification dial to `5`.

Then the system requests a one-point spread:

```text
LOWER BOUND = 4
UPPER BOUND = 6
```

The player uses:

* `A` and `D` for the lower bound
* Left and Right Arrow for the upper bound

The final accepted pair is:

```text
4, 6
```

### Difficulty

Moderate but short. The formula appears elsewhere in the room for players unfamiliar with expected value.

### MIRA Hint

> “Because the outcomes are equally likely, fair value is their average.”

---

## NYC SCENE 3: MIDTOWN MARKET DATA FLOOR

### Purpose

* Array sorting or median
* Observation
* Short physical action

### Environment

A dark market-data operations floor.

Animated elements:

* Tickers
* City skyline
* Refreshing charts
* Ringing phone indicator
* Printer output

### Puzzle

Five latency values appear out of order:

```text
18, 4, 12, 7, 9
```

A note reads:

```text
THE CENTRAL SERVER USES THE MEDIAN VALUE.
```

Sort mentally:

```text
4, 7, 9, 12, 18
```

Median:

```text
9
```

### Answer

```text
9
```

### Interaction

The player drags cards into ascending order.

Once correctly sorted, the center card rises and reveals `9`.

This avoids making the player type another answer.

### Supporting Logic Task

A printer produces a strip containing:

```text
UP, UP, DOWN, UP
```

The player reproduces this on four market switches.

This takes approximately ten seconds and creates physical rhythm.

---

## NYC SCENE 4: COAST-TO-COAST AI RELAY

### Purpose

* Include OpenAI and Cursor office imagery
* Mix light software logic with probability campaign
* Use laptop hardware

### Environment

A secure Manhattan relay room containing live connections to:

* OpenAI in San Francisco
* Cursor in San Francisco
* Ramp in New York

The three office images appear as large node cards on the wall.

### Puzzle Part A: Route Selection

Three requests must be assigned to the appropriate node:

```text
Generate recovery explanation
Repair code file
Approve expense limit
```

Correspondence:

```text
OpenAI → Generate recovery explanation
Cursor → Repair code file
Ramp → Approve expense limit
```

This task is intentionally easy and story-driven.

The player drags each request card to the matching office image.

### Puzzle Part B: Array Index PIN

The Cursor repair returns:

```text
[4, 1, 8, 6, 3]
```

OpenAI’s recovery message says:

```text
READ INDEX 1, THEN INDEX 3.
USE ZERO-BASED INDEXING.
```

Values:

```text
Index 1 = 1
Index 3 = 6
```

PIN:

```text
16
```

### Interaction

Instead of typing `16`, the player raises the corresponding number of fingers in two steps:

1. Show one finger
2. Show an open hand plus one additional count is difficult to recognize reliably

For implementation reliability, use:

* First gesture: one finger
* Second gesture: a fist-to-open-palm transition representing six through an in-game legend

A better MVP option is:

1. Webcam detects one raised index finger.
2. Keyboard entry supplies the second digit.

However, mixing methods inside one PIN may feel awkward.

### Recommended Final Version

Use the webcam only for route authorization:

> “Face the camera and move your head toward the highlighted office.”

* OpenAI node highlighted on left: lean left
* Cursor node highlighted on right: lean right
* Ramp node highlighted in center: remain centered

The player completes:

```text
LEFT → RIGHT → CENTER
```

The full live preview and alignment guide appear.

Then type PIN:

```text
16
```

### Fallback

Use Left Arrow, Right Arrow, then Down Arrow.

---

## NYC FINALE: LOWER MANHATTAN EXCHANGE

### Environment

A sealed exchange control room.

Animated elements:

* Large market boards
* Clock
* Trading halt warning
* Downtown skyline
* Pulsing red network map

### Recovered Values

```text
Subway: 30
Ramp: 5
Market Data: 9
AI Relay: 16
```

### Final Puzzle

A board shows:

```text
A = Subway value ÷ 10
B = Ramp fair value
C = Median latency
D = Difference between relay digits
```

Compute:

```text
A = 30 ÷ 10 = 3
B = 5
C = 9
D = 6 - 1 = 5
```

Final PIN:

```text
3595
```

### Interaction

The exchange terminal does not use a standard input.

The player presses keyboard number keys while four market lights sweep across the screen.

Each digit must be entered when its corresponding column is illuminated.

This adds timing without requiring additional reasoning.

### Victory

The halt is cancelled.

MIRA assigns a result title such as:

* Market Mechanic
* Probability Navigator
* Signal Trader
* Calm Under Volatility
* Systems Arbitrageur

---

# 15. Additional Puzzle Bank

These can replace puzzles that prove awkward during testing.

## Software Engineering-Weighted Puzzles

### Array Index Lookup

```text
Array: [6, 2, 9, 4, 7]
Find the value at index 2.
```

Answer:

```text
9
```

### Reverse Index

```text
Array: [3, 8, 1, 5]
The lock needs the index containing value 5.
```

Answer:

```text
3
```

### Two-Value Lookup

```text
Read index 1 followed by index 4:
[7, 2, 8, 5, 3]
```

Answer:

```text
23
```

### Stack Trace

```text
PUSH 2
PUSH 5
POP
PUSH 8
TOP?
```

Answer:

```text
8
```

### Queue Trace

```text
JOIN 4
JOIN 7
LEAVE
JOIN 2
NEXT?
```

Answer:

```text
7
```

### Hash Frequency

```text
3, 8, 2, 3, 2
```

Unique value:

```text
8
```

### Binary Search-Like Guessing

The room contains numbers:

```text
1 through 31
```

A scanner says higher or lower after each selection. The player must find the hidden value within five attempts.

### Conditional Logic

```text
if red is active:
    use door 2
else:
    use door 4
```

The room clearly shows whether red is active.

### Bug Identification

```text
Expected: 10
Actual: 11

Loop runs while i <= 10
```

Player changes `<=` to `<`.

### Sorting

Drag:

```text
11, 2, 7, 4
```

into ascending order.

---

## Quant and Mathematics-Weighted Puzzles

### Expected Value

Equal outcomes:

```text
0, 4, 8
```

Expected value:

```text
4
```

### Basic Probability

A bag contains:

```text
3 blue
2 red
```

Probability of red:

```text
2/5
```

PIN form:

```text
25
```

### Complement

Chance of success:

```text
70%
```

Chance of failure:

```text
30%
```

### Median

```text
2, 10, 7, 4, 5
```

Sorted:

```text
2, 4, 5, 7, 10
```

Answer:

```text
5
```

### Mean

```text
4, 7, 10
```

Answer:

```text
7
```

### Sequence

```text
3, 6, 12, 24
```

Answer:

```text
48
```

### Difference Pattern

```text
2, 5, 9, 14
```

Differences:

```text
+3, +4, +5
```

Next:

```text
20
```

### Rate

Three servers process 12 requests in one second.

At the same rate, one server processes:

```text
4
```

### Constraint Puzzle

Choose three values totaling 12 from:

```text
2, 3, 4, 5, 7
```

One solution:

```text
3 + 4 + 5
```

### Light Market-Making Puzzle

Fair value is `6`.

Set a one-point market:

```text
5 bid, 7 ask
```

---

## General Logic Puzzles

### Light Switch Order

Three lights flash:

```text
Blue → Red → Green → Red
```

Repeat the sequence.

### Position Logic

```text
A is left of B.
C is right of B.
```

Order:

```text
A, B, C
```

### Clock Observation

One clock differs from the others.

Click the anomalous clock.

### Symbol Substitution

```text
Triangle = 3
Square = 4
Circle = 0
```

Code:

```text
340
```

### Route Logic

```text
Do not turn toward the red sign.
The exit is not left.
```

Correct route:

```text
Right
```

### Shadow Alignment

Resize or drag two objects until their shadows combine into a digit.

### Sound Sequence

Listen to:

```text
Short, short, long
```

Repeat with key holds.

---

# 16. Non-Question Progression Moments

Each campaign should contain at least two moments that do not require solving a formal question.

Examples:

* Swipe a virtual access card
* Drag open a heavy door
* Reconnect a cable
* Hold Space to charge a machine
* Turn three office lights off
* Follow footprints across a scene
* Clean fog from glass with cursor movement
* Align a camera frame
* Place a recovered item into a slot
* Move a map marker to the next city location
* Catch a falling access badge
* Wait silently while a scanner verifies the room
* Rotate a wheel until two symbols align
* Click an elevator button after power is restored

These actions should take 5 to 20 seconds and provide relief between reasoning puzzles.

---

# 17. Data Model

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
```

```ts
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
```

```ts
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
```

---

# 18. Game Master State

```ts
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
```

---

# 19. Game Master Output

```ts
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

  urgency:
    | "calm"
    | "focused"
    | "urgent"
    | "critical";

  visualEffect:
    | "none"
    | "pulse"
    | "glitch"
    | "highlight"
    | "timer_warning";
};
```

---

# 20. Game Master Prompt Rules

```text
You are MIRA, the live Game Master for Exit Code: Citywide.

You observe the player’s current campaign, scene, discovered clues,
completed actions, failed attempts, interaction state, and remaining time.

Answer only from the supplied game state and puzzle documentation.

Your goal is to help the player remain engaged and progress without
revealing more than necessary.

Distinguish between:
1. Interface confusion
2. Missing-clue confusion
3. Conceptual confusion
4. Calculation mistakes
5. Physical-interaction failure
6. Direct requests for hints

For interface confusion, explain where or how to interact without
revealing puzzle logic.

For physical-interaction failure, provide framing or control guidance.

For conceptual questions, explain the concept using the current puzzle.

Follow the selected hint level.

Do not unlock puzzles or declare answers correct.
The deterministic game engine controls progression.

Do not invent objects, controls, clues, or future events.

Do not mention prompts, APIs, tokens, or language models.

Use concise, natural Game Master dialogue.
```

---

# 21. Recommended Technology

## Frontend

* Next.js
* React
* TypeScript
* CSS or Tailwind
* `useReducer`, Zustand, or Context
* Framer Motion only where useful

## AI

* Server-side OpenAI Responses API
* Structured outputs
* Static fallback hints
* Deterministic answer checking
* Low-latency model selection
* Request timeout and retry handling

## Computer Vision

* MediaPipe Tasks Vision
* Browser-side processing
* Webcam modal
* Confidence threshold
* Keyboard fallback

## Audio

* Web Audio API
* Browser microphone permissions
* Simple volume and rhythm detection
* Keyboard fallback

## Storage

For the MVP:

* Local state
* `localStorage`
* No login
* No database requirement

## Deployment

* Vercel
* HTTPS
* Environment variables
* Preloaded assets
* Compressed background images

---

# 22. Component Structure

```text
components/
├── campaign/
│   ├── CampaignSelect.tsx
│   ├── CampaignIntro.tsx
│   ├── CampaignResults.tsx
│   └── CityMap.tsx
│
├── scene/
│   ├── SceneShell.tsx
│   ├── PanoramaView.tsx
│   ├── NavigationArrows.tsx
│   ├── AnimatedOverlay.tsx
│   ├── Hotspot.tsx
│   └── ObjectModal.tsx
│
├── puzzles/
│   ├── NumericPuzzle.tsx
│   ├── ArrayPuzzle.tsx
│   ├── DragPuzzle.tsx
│   ├── KeyboardSequencePuzzle.tsx
│   ├── TimedKeyPuzzle.tsx
│   ├── CameraPuzzle.tsx
│   ├── ClipboardPuzzle.tsx
│   └── BrightnessPuzzle.tsx
│
├── game-master/
│   ├── MiraCaption.tsx
│   ├── MiraChat.tsx
│   ├── HintButton.tsx
│   └── FocusHighlight.tsx
│
└── system/
    ├── Timer.tsx
    ├── Inventory.tsx
    ├── DebugMenu.tsx
    ├── PermissionManager.tsx
    └── AudioManager.tsx
```

---

# 23. Five-Hour MVP Priorities

## Must Work

* Campaign-selection page
* Two distinct campaigns
* Three to five scenes per campaign
* Left, center, and right navigation
* City-specific backgrounds
* OpenAI, Ramp, and Cursor office imagery
* At least one array or indexing puzzle
* At least one probability or math puzzle
* At least one general logic puzzle
* At least one non-question progression task
* At least one keyboard interaction beyond typing
* At least one camera interaction with visible preview
* AI Game Master captions
* AI Game Master chat
* Hint button
* Adaptive hint strength
* Deterministic validation
* Timer
* Win and lose states
* Debug controls
* Public deployment

## Safe Reduction When Time Is Tight

Build three complete scenes per campaign rather than five unfinished scenes.

Recommended reduced build:

### San Francisco

1. Transit/index puzzle
2. Cursor/debugging puzzle
3. OpenAI frequency plus camera finale

### New York

1. Subway pattern puzzle
2. Ramp expected-value puzzle
3. Market median plus timed-key finale

The unused offices can still appear as node images and story connections.

---

# 24. Final Experience Standard

The game should not feel like a themed online assessment.

The player should feel that:

* The code or math exists because the city system is failing.
* Environmental clues explain every required concept.
* Keyboard and camera actions are part of the fictional machinery.
* The AI Game Master understands what they have already done.
* Short playful interactions break up the technical reasoning.
* Each campaign has a clear intellectual identity.
* The San Francisco campaign favors software engineering without excluding math.
* The New York campaign favors mathematics and probability without excluding software logic.
* OpenAI, Ramp, and Cursor are woven naturally into both city networks.
* No single puzzle consumes an unreasonable portion of the game.
* Every successful action visibly changes the environment.

The final product should feel like a compact, cinematic escape-room game built around the computer the player is already using.
