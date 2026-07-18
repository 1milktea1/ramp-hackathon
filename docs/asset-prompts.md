# Asset Prompts — Exit Code: Citywide

Thirteen images. Every prompt shares the **locked style block** below, per
plan.md §10 ("locked style prompt across all scenes"). Do not vary it between
assets — consistency across the six rooms matters more than any single image.

Drop finished files at the paths given. The CSS backdrops in
`components/scene/SceneBackdrop.tsx` stay as the fallback layer, so a missing or
late asset degrades to a drawn room rather than an empty panel.

---

## Locked style block

Paste this **before** every scene prompt:

> 8-bit pixel art, side-on video game background, limited 16-colour palette,
> hard-edged pixels with no anti-aliasing, no dithering gradients, flat colour
> blocks, strong silhouette reading, single consistent light source, dark
> cinematic night scene, moody and atmospheric, deep shadows, glowing screens
> and signage as the only bright elements, wide horizontal composition,
> empty centre with detail pushed to the left and right edges,

Paste this **after** every scene prompt:

> — no text, no letters, no numbers, no logos, no watermarks, no people,
> no characters, no UI elements, no borders, no frame, no title card.

### Palette

Match the UI tokens so art and interface read as one system:

| Role | Hex |
|---|---|
| Deepest shadow / ink | `#0b0e14` |
| Panel / mid dark | `#151b28` |
| Structural edge | `#2a3550` |
| **San Francisco accent** | `#4ad9c4` (teal) |
| **New York accent** | `#ffcf4a` (amber) |
| Success glow | `#7de08d` |
| Alarm glow | `#ff5c5c` |

Append to any prompt if the generator accepts it:
`palette: #0b0e14 #151b28 #2a3550 #4ad9c4 #ffcf4a #7de08d`

### Hard constraints

1. **No text of any kind.** Generators mangle lettering, and all real labels are
   drawn by the UI on top.
2. **Keep the centre clear.** The interactive device plate sits at roughly
   x 28–70%, y 30–70% of each view. Detail there will be covered.
3. **Dark enough for white text.** If the midtones are bright, the HUD and MIRA
   captions stop being readable.
4. **No recognisable real logos or signage.** Sponsor locations are stylised
   and must not imply endorsement (README §6).

### Dimensions

Rooms are **ultrawide, 1536 × 512 (3:1)** — the panorama shows one third at a
time, so each image is three connected views left→centre→right. Generate wide,
not three separate images.

Cards are **512 × 512**.

---

## Rooms — San Francisco (teal)

### `public/bg/sf-1.png` — SoMa Transit Stop

> a deserted underground train platform at night in San Francisco, concrete
> support pillars receding down the platform, a tiled safety strip along the
> platform edge, a dark empty track trench on the far side, a hanging
> destination board glowing faint teal, thick low fog drifting across the floor,
> a distant train headlight glow in the tunnel mouth, wet reflective concrete,
> cold teal and steel blue palette, abandoned and quiet

Keep the middle of the platform open. Detail belongs on the pillars and the
tunnel mouths at each end.

### `public/bg/sf-2.png` — Cursor Development Floor

> a late-night software office floor high above a city, long rows of desks with
> dark monitors, a few screens still glowing teal in the dark, floor-to-ceiling
> windows showing a foggy city skyline far below, exposed ceiling ducts, a
> server cabinet with small blinking indicator lights against one wall, cables
> running along the floor, cold teal monitor light as the only illumination,
> empty chairs, nobody present

The window wall should carry the depth. Leave the middle of the floor bare.

### `public/bg/sf-3.png` — OpenAI Mission Bay Node

> a minimal high-security research lobby at night, tall glass panels and
> polished dark stone floor, a large abstract geometric sculpture suspended in
> the atrium, a bank of elevator doors with soft teal indicator strips, subtle
> reflections on the floor, very clean architectural lines, high ceiling,
> restrained and expensive-looking, cool teal accent lighting, deserted

Sparse and architectural. Resist filling the middle.

---

## Rooms — New York (amber)

### `public/bg/ny-1.png` — 23rd Street Subway

> a grimy New York subway platform late at night, white ceramic tile walls
> yellowed with age, steel I-beam columns painted and chipped, a turnstile bank
> at one end, steam rising through a floor grate, one fluorescent fixture
> flickering, litter along the platform edge, dark track trench, warm amber
> light pooling under the lamps, deep shadows between them, empty and slightly
> menacing

The tile wall is the texture that carries this room. Keep the platform floor
clear through the middle.

### `public/bg/ny-2.png` — Ramp Headquarters

> a modern Manhattan fintech office floor after hours, large wall-mounted
> dashboard displays glowing amber with abstract charts, glass partition walls,
> a long empty conference table to one side, floor-to-ceiling windows showing
> the Manhattan skyline at night with lit windows, polished floor reflecting
> the screen glow, minimal expensive furniture, warm amber and deep navy
> palette, completely empty of people

Skyline through the windows does the work. Dashboards belong on the side walls.

### `public/bg/ny-3.png` — Midtown Market Data Floor

> a dark financial trading floor at night, a wall of stacked market data screens
> glowing amber, rows of empty trading desks with multiple dark monitors each,
> tangled cables, a low ceiling with recessed lights mostly off, a distant
> window showing the midtown skyline, warm amber screen glow washing over the
> desks, abandoned mid-session, tense atmosphere

Screen wall on one side, desks on the other, walkway clear down the middle.

---

## Finale rooms

### `public/bg/sf-finale.png` — Bay Control Center

> a darkened infrastructure command room at night, a huge panoramic window
> overlooking a suspension bridge lit against black water, a wall of network
> status displays glowing teal with a few alarm-red panels, a heavy sealed
> security door, empty operator consoles, fog rolling past the window, tense
> emergency atmosphere, teal and red palette

### `public/bg/ny-finale.png` — Lower Manhattan Exchange

> a sealed stock exchange control room at night, enormous market boards covering
> one wall glowing amber and red, a large analogue clock high on the wall, heavy
> sealed doors, empty terminals, the downtown skyline visible through reinforced
> glass, red emergency lighting mixing with amber screen glow, locked-down and
> claustrophobic

---

## Sponsor node cards — 512 × 512

Three cards, reused across both campaigns (plan.md §10). **Stylised buildings,
no logos, no signage, no name lettering** — the UI labels them.

### `public/nodes/openai.png`

> a stylised modern low-rise research building exterior at night, clean
> horizontal concrete and glass bands, warm light spilling from the ground
> floor, a small plaza with young trees in front, calm and understated,
> teal accent lighting, isometric-ish front three-quarter view

### `public/nodes/ramp.png`

> a stylised Manhattan office building exterior at night, tall narrow windows in
> a regular grid, a lit lobby entrance at street level, wet pavement reflecting
> amber streetlight, a slice of neighbouring buildings on each side, warm amber
> palette, front three-quarter view

### `public/nodes/cursor.png`

> a stylised San Francisco warehouse-conversion office at night, brick facade
> with tall industrial windows, a few upper windows glowing teal from monitors
> inside, a fire escape on the facade, foggy air, quiet street level,
> front three-quarter view

---

## Campaign select key art — 512 × 512

### `public/key/sf.png`

> a foggy San Francisco skyline at night seen from across the bay, suspension
> bridge towers rising through fog, scattered lit windows, a faint teal glow
> over the city, ominous and quiet, wide establishing shot

### `public/key/ny.png`

> the Manhattan skyline at night from the water, dense towers with thousands of
> lit windows, a faint amber haze over midtown, low clouds catching the city
> glow, ominous and still, wide establishing shot

---

## Wiring finished assets

`SceneDefinition.backgrounds` already points at `/bg/<scene-id>.png`. Drop the
file in and it layers over the CSS backdrop with no code change. If a room reads
too bright and the HUD stops being legible, darken the asset rather than adding
an overlay in code — the fallback backdrop is tuned to the same palette and the
two should stay interchangeable.
