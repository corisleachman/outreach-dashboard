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
