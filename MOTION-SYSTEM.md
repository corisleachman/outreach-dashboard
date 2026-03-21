# outreach. — Motion System & Animation Backlog
Last updated: 20 March 2026

---

## Purpose

This document captures the motion design language for outreach. — the
timing constants, interaction patterns, and animation backlog across the
beta page and dashboard. It should be read alongside WIREFRAME-DECISIONS.md
before implementing any animated UI.

---

## Section 1 — Core Timing Tokens

These values are the heartbeat of the motion system. Any new animation
should reference these rather than inventing new durations.

| Token | Value | Usage |
|---|---|---|
| `CYCLE_MS` | 5000ms | One full heartbeat cycle — the master rhythm |
| `LIT_MS` | 340ms | How long a scan-lit border stays at full brightness |
| `FADE_MS` | 900ms | Border fade-out duration after scan passes |
| `BLUR_PX` | 40px | Gaussian blur on pulse canvas blobs |
| `PULSE_SWELL` | 0.40 | Radius expansion multiplier on beat peak |
| `OPACITY_BASE` | 0.18 | Resting blob opacity |
| `OPACITY_FLARE` | 0.28 | Extra opacity added at beat peak |
| `STAGGER` | 0.20 | Phase offset across blobs (creates ripple not flash) |
| `DRIFT` | 0.5px/frame | Organic blob drift speed |
| `PARALLAX` | 0.03 | Mouse parallax strength on blob field |

**Principle:** The 5-second cycle is the heartbeat of the product.
Everything animated should feel like it breathes at this rate or
a harmonic of it (2.5s, 10s).

---

## Section 1b — Electric6 Canonical Values

These are the approved tuning values for the canonical beta page (electric6).
Use as reference when porting the motion system to the dashboard.

| Parameter | Value | Note |
|---|---|---|
| `BLOB_COUNT` | 9 | |
| `RADIUS_MIN` | 110px | |
| `RADIUS_MAX` | 240px | |
| `CYCLE_MS` | 8000ms | Slower than original 5s — calmer |
| `PULSE_SWELL` | 0.22 | Noticeable but soft |
| `OPACITY_BASE` | 0.10 | |
| `OPACITY_FLARE` | 0.14 | |
| `BLUR_PX` | 55px | |
| `STAGGER` | 0.15 | |
| Scan `LIT_MS` | 280ms | Brief flare |
| Scan `FADE_MS` | 1400ms | Long slow return |
| Scan border opacity | 0.35 | Half of electric4's 0.75 |
| Scan glow | 10px | Half of electric4's 18px |
| CSS orb opacity | 0.08 | |
| CSS orb blur | 140px | |

---

## Section 2 — Palette

Electric Dreams motion palette. Used for scan glow, border flares,
and particle effects.

| Role | Value | CSS var |
|---|---|---|
| Primary scan | `rgba(255, 20, 147, 0.75)` | `--pink` |
| Secondary scan | `rgba(0, 212, 255, 0.75)` | `--cyan` |
| Pink glow | `rgba(255, 20, 147, 0.22)` | `--glow-pink` |
| Cyan glow | `rgba(0, 212, 255, 0.22)` | `--glow-cyan` |
| Amber alert | `rgba(255, 157, 66, 0.75)` | `--amber` |

---

## Section 3 — Implemented Effects

### 3.1 Heartbeat Pulse Canvas (`electric.html`, `electric2.html`)
- 12 radial gradient blobs on a fixed Canvas 2D layer
- Two-bump cardiac curve (primary spike at t≈0.04, diastolic echo at t≈0.13)
- Blobs distributed in jittered grid for immediate full coverage
- Offscreen canvas → Gaussian blur blit for soft diffusion
- Mouse parallax (strength 0.03) adds subtle depth
- Mobile: blob count reduced by 40%
- **File:** `electric.html` (base), `electric2.html` (with scan effect)

### 3.2 Scan Effect (`electric2.html`)
- Invisible scan line travels bottom→top over exactly CYCLE_MS
- Synced to heartbeat — same 5-second period
- 12 scannable elements tagged with `data-scan="pink|cyan"`
- Element fires when scan line is within 60px of element centre
- Cooldown of 4.5s prevents re-firing within same cycle
- Border flares for LIT_MS, then fades over FADE_MS
- Pink/cyan alternation across element types for visual rhythm
- **Elements covered:** callout cards, step cards, screen cards,
  founder block, access form

---

## Section 4 — Animation Backlog

Priority order within each group is top → bottom.

### 4.1 Beta Page (`electric2.html`)

| # | Effect | Description | Priority |
|---|---|---|---|
| B1 | Velocity-linked scan | ~~Built in electric3.html — rejected.~~ Compresses all motion into the beat spike, causing boxes at the same scroll depth to fire simultaneously. Loses the "passing through" feel. **Linear sweep (electric2.html) is canonical — do not revisit.** | ~~High~~ Closed |
| B2 | Form field scan | Input fields and selects in the access section get a brief border flare as the scan passes through them individually | Medium |
| B3 | Particle trail | Built in electric4.html. Iterated: size reduced (0.8–1.8px), opacity 0.5, random 360° scatter, life 90–180 frames. Effect felt too busy alongside scan — dropped from canonical version (electric6). Available to revisit in isolation. | Closed |

### 4.2 Dashboard — Campaign Cards

| # | Effect | Description | Priority |
|---|---|---|---|
| D1 | Card border scan | Same scan mechanic applied to campaign cards on dashboard home — pink for active campaigns, amber for cards with follow-ups due | High |
| D2 | Follow-up amber pulse | Cards with pending follow-ups get a persistent, slow amber border pulse (2.5s cycle — half the master rhythm) independent of the scan | Medium |
| D3 | New reply cyan flash | Cards with unread replies get a one-shot cyan border flash on page load | Medium |

### 4.3 Dashboard — Campaign View

| # | Effect | Description | Priority |
|---|---|---|---|
| V1 | Tab active flash | When switching tabs, the active tab gets a brief pink underline flare (150ms) before settling to its resting state | Medium |
| V2 | Prospect drawer reveal | The prospect drawer slides in with a scan-style border flash on its left edge as it opens | Medium |
| V3 | Row fade on action | Prospect rows fade and compress vertically (height → 0) when approved/skipped — already partially implemented, ensure consistent timing | Low |

### 4.4 Motion Language — Dashboard-Wide

| # | Effect | Description | Priority |
|---|---|---|---|
| M1 | Heartbeat canvas (dashboard) | Port the pulse canvas to the dashboard shell — significantly more subtle than beta page (OPACITY_BASE ~0.08, OPACITY_FLARE ~0.12) so it doesn't compete with data | High |
| M2 | Motion token CSS vars | Define `--anim-cycle`, `--anim-lit`, `--anim-fade` as CSS custom properties in the design token block so timing is consistent across all components | High |
| M3 | Scan on sidebar icons | Sidebar icons get a brief pink dot or glow as the scan passes — very subtle, reinforces the living system feel | Low |

---

## Section 5 — Principles

1. **The product breathes.** The 5-second heartbeat is the master rhythm.
   Nothing should feel static or frozen.

2. **Invisible mechanics, visible life.** The scan line is invisible.
   The effect is felt through the boxes responding to it, not through
   seeing the line itself.

3. **Ambient not distracting.** All motion is background — it should
   register as "something feels alive" not "something is moving".
   When in doubt, reduce opacity and slow the timing.

4. **Functional motion.** Amber pulse on follow-up cards, cyan flash
   on new replies — motion carries meaning, not just decoration.

5. **Consistent timing.** New animations reference CYCLE_MS or its
   harmonics. No ad-hoc durations.

---

## Section 6 — Files

| File | Location | Description |
|---|---|---|
| `electric.html` | `corisleachman/beta-invite` | Beta page — Electric Dreams, heartbeat pulse only |
| `electric2.html` | `corisleachman/beta-invite` | Beta page — heartbeat + scan. Superseded by electric6. |
| `electric3.html` | `corisleachman/beta-invite` | Velocity-linked scan experiment — rejected. Linear sweep preferred. |
| `electric4.html` | `corisleachman/beta-invite` | Heartbeat + scan + particles. Too intense ("nightclub / police car"). Reference only. |
| `electric5.html` | `corisleachman/beta-invite` | Pulled-back attempt — too quiet, barely noticeable. Reference only. |
| `electric6.html` | `corisleachman/beta-invite` | **Canonical beta page.** Heartbeat + subtle scan. 8s cycle, blobs at middle opacity, scan flare at 35% intensity, 1.4s fade. Approved. |
| `MOTION-SYSTEM.md` | `corisleachman/outreach-dashboard` | This document |

---

*End of MOTION-SYSTEM.md*
---

## Section 7 — Light / Dark Mode Themes

### 7.1 Overview

Both modes share the same Electric Dreams design language and motion system.
The dark mode is the primary experience. Light mode is an optional preference
for users who find dark mode heavy for daily use. Toggle will live in user
settings (Phase 2.19 or later in the dashboard).

**Reference files (beta page):**
| File | Mode | Status |
|---|---|---|
| `electric6.html` | Dark — canonical | Approved |
| `electric-light.html` | Light — canonical | Approved |

---

### 7.2 Dark Mode Tokens (electric6 — canonical)

| Token | Value | Notes |
|---|---|---|
| `--bg` | `#0d0914` | Deep purple-black |
| `--t` | `#f4f4f2` | Near-white text |
| `--tm` | `#a8a8b8` | Mid text |
| `--td` | `#6b6b80` | Dim text |
| `--pink` | `#ff1493` | Neon pink |
| `--cyan` | `#00d4ff` | Neon cyan |
| `--amber` | `#ff9d42` | Amber accent |
| `--grad` | `135deg, #ff1493, #00d4ff` | Primary gradient |
| `--glow-pink` | `rgba(255,20,147,0.25)` | |
| `--glow-cyan` | `rgba(0,212,255,0.2)` | |
| `--s` | `rgba(255,255,255,0.04)` | Surface |
| `--s2` | `rgba(255,255,255,0.07)` | Surface raised |
| `--b` | `rgba(255,255,255,0.07)` | Border |
| `--b2` | `rgba(255,255,255,0.13)` | Border strong |
| Nav bg | `rgba(13,9,20,0.7)` | Frosted dark |
| Card bg | `var(--s)` | |
| Footer bg | `rgba(13,9,20,0.8)` | |

**Pulse canvas — dark:**
| Param | Value |
|---|---|
| Palette | `[255,20,147]` pink × 2, `[0,212,255]` cyan × 2, `[180,10,120]` deep pink, `[80,160,220]` slate |
| `OPACITY_BASE` | `0.10` |
| `OPACITY_FLARE` | `0.14` |

---

### 7.3 Light Mode Tokens (electric-light — canonical)

| Token | Value | Notes |
|---|---|---|
| `--bg` | `#faf8ff` | Warm off-white, faint purple tint |
| `--t` | `#1a1525` | Purple-tinted near-black |
| `--tm` | `#5a5070` | Mid text |
| `--td` | `#8a80a0` | Dim text |
| `--pink` | `#c4006a` | Muted deep ink pink — not neon |
| `--cyan` | `#007a99` | Calm teal — not neon |
| `--amber` | `#b06010` | Muted amber |
| `--grad` | `135deg, #c4006a, #007a99` | Same direction, muted values |
| `--glow-pink` | `rgba(196,0,106,0.15)` | Reduced — glows spread on light bg |
| `--glow-cyan` | `rgba(0,122,153,0.12)` | Reduced |
| `--s` | `rgba(90,60,120,0.04)` | Surface |
| `--s2` | `rgba(90,60,120,0.07)` | Surface raised |
| `--b` | `rgba(90,60,120,0.10)` | Border |
| `--b2` | `rgba(90,60,120,0.18)` | Border strong |
| Nav bg | `rgba(250,248,255,0.85)` | Frosted light |
| Card bg | `rgba(255,255,255,0.7)` + `backdrop-filter: blur(8px)` | Float effect |
| Footer bg | `rgba(240,236,252,0.9)` | |

**Pulse canvas — light:**
| Param | Value |
|---|---|
| Palette | `[160,0,90]` plum × 2, `[0,100,130]` teal × 2, `[120,20,100]` deep plum, `[80,120,160]` slate |
| `OPACITY_BASE` | `0.12` | Slightly higher — light surfaces absorb colour |
| `OPACITY_FLARE` | `0.16` | |

---

### 7.4 Key principles for light mode

1. **Muted, not pastel.** The pink and cyan are darkened versions of the
   dark mode accents — ink-like, not washed out. Saturation stays high,
   brightness comes down.

2. **Glows need restraint.** On dark backgrounds, glows are contained.
   On light backgrounds they spread further and bloom — all box-shadow
   values were roughly halved.

3. **Cards float.** Light surfaces need depth cues. Cards use
   `rgba(255,255,255,0.7)` + `backdrop-filter: blur(8px)` rather than
   the dark mode's near-transparent tint.

4. **Blob palette inverts.** The pulse canvas blobs use dark plum/teal
   values so they're visible against the light background. Opacity nudged
   slightly up for the same reason.

5. **The thread holds.** `--bg: #faf8ff` has a faint purple tint — the
   same purple that dominates `#0d0914`. The two modes feel like the same
   product in different light, not two different products.

---

### 7.5 Dashboard implementation notes

When Phase 2.19 (light/dark mode) is built:
- Store preference in `users.settings` as `theme: 'dark' | 'light'`
- Apply at the `:root` level via a `data-theme="light"` attribute on `<html>`
- All tokens swap via CSS custom properties — no component-level changes needed
- The pulse canvas palette swap requires a JS check on load:
  `const isLight = document.documentElement.dataset.theme === 'light'`
  then select the appropriate `PALETTE` array before starting the animation loop
- Scan effect CSS classes (`scan-lit-pink`, `scan-lit-cyan`) work in both modes
  since they reference the already-swapped `--pink` / `--cyan` tokens
- Default to dark mode unless the user has explicitly set light preference
  or `prefers-color-scheme: light` is detected on first visit
---

## Section 8 — Button Interaction System

### 8.1 Overview

All primary CTA buttons (`.btn-primary`, `.nav-cta`) share the same
hover interaction. Two effects fire simultaneously on `mouseenter`,
both one-shot (don't repeat until mouse leaves and re-enters).

No upward lift on hover — `translateY` is explicitly removed.
The button stays still. The effects do the responding.

**Canonical file:** `pulse-variants.html` (corisleachman/beta-invite)

---

### 8.2 Effect 1 — Ink Drop Bloom

A radial light bloom originating from the exact cursor entry point,
expanding outward and fading like ink dispersing in water.

**Implementation:** Canvas 2D overlay (`btn-ripple-canvas`) appended
to each button. On `mouseenter`, records `(ox, oy)` relative to the
button, then animates an expanding radial gradient.

| Parameter | Value | Notes |
|---|---|---|
| `DURATION` | 1800ms | Total dispersion time |
| `MAX_SCALE` | 2.8 | Ring expands to 2.8× button diagonal |
| `PEAK_AT` | 0.08 | Opacity peaks at 8% of duration |
| Easing | `1 - (1-t)^3` | Cubic ease-out |
| Peak opacity | 0.22 | Subtle — internal bloom only |
| Gradient | 4-stop radial | Bright centre, long transparent tail |

**Gradient stops:**
- `0%` — `rgba(255,255,255, opacity × 1.8)`
- `15%` — `rgba(255,255,255, opacity × 1.2)`
- `50%` — `rgba(255,255,255, opacity × 0.5)`
- `100%` — `rgba(255,255,255, 0)`

---

### 8.3 Effect 2 — Pulse Ring

A single ring expands outward from the button border and dissolves.
Lives on a wrapper `div.btn-ring-wrap` outside the button's
`overflow: hidden` so it can scale beyond the button edge.

**Why wrapper:** The button uses `overflow: hidden` to clip the canvas
ink drop. A `::before`/`::after` on the button itself gets clipped.
Moving to a wrapper `::after` solves this cleanly.

| Parameter | Value | Notes |
|---|---|---|
| Scale | `1.0` → `1.48` | 20% reduced from original 1.6 |
| Peak opacity | `0.44` | 20% reduced from original 0.55 |
| Duration | 1.2s | |
| Easing | `cubic-bezier(0.2, 0.6, 0.3, 1)` | |
| Border | `1.5px solid rgba(255,255,255,0.55)` | White ring |
| Border radius | `100px` | Matches pill shape |

---

### 8.4 Interaction decisions (locked)

- **No hover lift.** `translateY` removed from all button hover states.
  The button stays physically still — effects respond, not the element.
- **One-shot.** Both effects fire once on entry and cannot re-trigger
  until the cursor leaves and re-enters.
- **Origin-aware.** The ink drop always blooms from the exact pixel
  the cursor entered — left edge, right edge, corner, centre, wherever.
- **Warp explored, deferred.** A pixel-displacement radial warp
  (distorting button shape/text as the ring travels) was explored but
  not achievable at sufficient quality in CSS/Canvas without performance
  issues. Revisit when building in the main app with access to WebGL
  or a proper shader pipeline.

---

### 8.5 HTML structure

```html
<div class="btn-ring-wrap">
  <a href="#access" class="btn-primary">Request early access →</a>
</div>
```

The wrapper is `display: inline-flex` so it hugs the button dimensions.
The ring animation is on `.btn-ring-wrap::after`.
---

## Section 9 — Image Warp Effect

### 9.1 Overview

A sinusoidal wave travels horizontally (left→right) across screenshot
images on hover. The wave displaces image pixels vertically as it passes,
creating a fluid ripple effect — like heat haze or water moving across
a surface. Not noise, not turbulence — a clean mathematical sine wave.

**Reference:** `warp-test.html` in `corisleachman/beta-invite`
**Status:** Approved. Ready to integrate into marketing site.

---

### 9.2 How it works

Each image card has a Canvas element that renders the image. On
`mouseenter`, a wave front travels from x=0 to x=1 (full width) over
DURATION ms. Each animation frame:

1. For every column of pixels, calculate distance from the wave front
2. Columns within the band get displaced vertically by a sine wave
3. Displacement amplitude follows a bell curve — peaks early, long decay
4. Source pixels are sampled from a clean offscreen canvas and written
   to the visible canvas with the vertical offset applied

The wave front uses `easeOut` for travel (fast entry, slow exit).
The overall amplitude uses a `(1-t)^2.2` decay after the peak.

---

### 9.3 Locked parameters

| Parameter | Value | Notes |
|---|---|---|
| `WAVE_AMPLITUDE` | 6px | Vertical pixel displacement at peak |
| `WAVE_FREQUENCY` | 2.5 | Ripple crests visible across the image |
| `WAVE_FRONT_WIDTH` | 0.35 | Active band as fraction of image width |
| `DURATION` | 3600ms | Total travel time left→right |
| `PEAK_AT` | 0.15 | Fraction of duration when amplitude peaks |
| Easing | `easeOut` cubic | Fast entry, long decay |
| Trigger | `mouseenter` one-shot | Re-arms on `mouseleave` after 100ms |

---

### 9.4 Implementation notes

- Source image sits in the DOM with `opacity: 0` — canvas renders on top
- A clean offscreen canvas holds the unmodified image pixels permanently
- Each frame reads from the offscreen canvas (never the distorted output)
- The visible canvas is CSS-scaled (`width: 100%`) from native resolution
- One-shot per hover — cannot re-trigger until mouse leaves and re-enters
- Performance: CPU-bound pixel loop. Keep images at display resolution
  (~100kb per image is fine). Avoid on images wider than ~1200px native.

---

### 9.5 Relationship to other effects

The image warp is directional (left→right) — intentionally matching the
horizontal scan line that passes through boxes on the beta page. Both
effects share the sense of something sweeping through the content.

The button ink drop is radial (from cursor origin). The scan is vertical
(bottom→top). The image warp is horizontal (left→right). Together they
form a consistent motion vocabulary without repeating the same direction.

