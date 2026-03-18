# WIREFRAME-DECISIONS.md

Outreach — Wireframe Decisions Log  
Last updated: March 2026

---

## Purpose

This document records UX and structural decisions made during the wireframing phase (March 2026) that supplement, clarify, or extend the locked specification files.

**It does not replace any locked spec.**  
It should be read alongside the existing specs before implementing any phase.

When a decision below conflicts with a locked spec, this document takes precedence for UI/UX implementation. Engineering specs (schema, API, data model) remain unchanged unless explicitly noted.

---

## How to use this document

When GSD begins a new phase, read:
1. The relevant locked product spec (`phase-X-spec.md`)
2. The relevant locked engineering addendum (`phase-X-engineering.md`)
3. **This document** — check the relevant phase section for overrides and clarifications

---

---

## SECTION 1 — App Shell & Navigation

### 1.1 Persistent shell (ALL phases)

**Decision:** The app uses a persistent shell on every screen after login.

The shell consists of:

- **Topbar** — fixed, full-width, 56px height. Contains: logo (left), breadcrumb navigation (centre-left), plan badge + avatar (right).
- **Slim sidebar** — fixed, left edge, 56px wide. Icon-only. No text labels. Tooltips on hover.

This was not specified in any locked spec. It is the canonical layout for all authenticated views.

**Sidebar icons (in order, top to bottom):**
1. Campaigns grid icon → `/dashboard` (campaigns list)
2. Summary bar-chart icon → `/summary` (Today + This week)
3. *(bottom, pinned)* Settings cog icon → `/settings`

**No other items in the sidebar.** Follow-up, Nurture, and Conversations do not appear in the sidebar — they exist only as tabs within the campaign view. See Section 3.1.

---

### 1.2 Topbar breadcrumb

When a user is on the campaigns list: topbar shows logo only.  
When a user is inside a campaign: topbar shows `Campaigns / [Campaign name]` as a breadcrumb. Clicking "Campaigns" returns to the campaigns list.

---

### 1.3 Wizard shell (Phase 2.10 — Activation Loop)

During the first-time activation wizard (`/onboarding/start`), the shell is modified:

- Topbar remains fully visible and functional.
- Sidebar is present but **dimmed** (opacity ~20%) and **non-interactive** (cursor: not-allowed).
- Hovering a dimmed sidebar icon shows tooltip: *"Finish setup first."*
- This keeps the shell visible so the user is not disoriented, while maintaining focus on the wizard.

The spec describes a wizard but does not specify whether the shell is present. This decision resolves that gap.

---

---

## SECTION 2 — Campaigns List (Dashboard Home)

### 2.1 Campaign card layout

Each campaign card on the dashboard home shows:
- Campaign name + meta (prospects count, start date, sequence steps)
- Status badge (Active / Paused)
- Stats row (drafts ready, sent, replies, meetings / follow-ups due)
- Progress bar
- Action strip

**Action strip buttons (left to right):**
- `+ Add prospects` — links to prospect import flow for that campaign *(this button was added during wireframing and is not in any spec)*
- `[N] Follow-ups due` (amber, conditional)
- `[N] New reply` (cyan, conditional)
- `View campaign →` / `Resume campaign` — navigates to campaign view

---

### 2.2 Create campaign modal

Clicking `+ New campaign` opens a modal overlay on the dashboard home. The modal has a single field: campaign name. Submitting navigates to the activation wizard (`outreach-wizard-v2`) for a first campaign, or to the campaign view for subsequent campaigns.

The spec (Phase 2.10) describes this flow. The modal behaviour is consistent with the spec.

---

---

## SECTION 3 — Campaign View

### 3.1 Tab structure — 8 tabs (not 7)

The locked specs reference a 7-tab campaign dashboard. During wireframing a **Bounced** tab was added as the 8th tab.

**Canonical tab order:**
1. Review
2. Drafts
3. LinkedIn
4. Sent
5. Follow-up
6. Nurture
7. Conversations
8. **Bounced** *(added — was previously only accessible via error states)*

The Bounced tab shows hard bounce detection, alternative email permutations, retry and skip actions. This content existed in the error states wireframe and has been moved into the campaign view as a persistent tab.

---

### 3.2 Search bar on all tabs

Every tab in the campaign view has a search bar above the prospect list. Placeholder: *"Search name, role, or agency…"*

The specs do not mention per-tab search. This is a wireframe addition.

---

### 3.3 Campaign header (sticky)

The campaign header sticks below the topbar when scrolling. It contains:
- Campaign name + meta line (editable via "Edit message" link)
- Stats strip: Drafts ready / Responded / Meetings set / LinkedIn sent / LinkedIn due
- Tab bar

This is not described in the locked specs. The stats strip values map to existing data model fields.

---

### 3.4 Follow-up, Nurture, Conversations — tabs only, not sidebar

The locked specs do not define where Follow-up, Nurture, and Conversations live in the nav. 

**Decision:** These three views exist only as tabs within the campaign view. They are not in the global sidebar.

Rationale: these views are campaign-scoped. A global sidebar link would create ambiguity about whether the user is seeing data for one campaign or all campaigns. Keeping them as tabs makes the scope unambiguous.

If a global cross-campaign view of follow-ups or conversations is added in future, it would be a new sidebar item with a distinct label (e.g. "Inbox") — not a repurposing of these tabs.

---

### 3.5 Prospect cards — Review tab

Prospect cards in the Review tab expand in place when clicked to reveal editable fields (name, email, organisation, industry, org size, about). This is the current implementation.

**Under consideration (not yet implemented):** A right-side drawer showing richer prospect detail. The expand-in-place and drawer approaches were reviewed. The drawer is preferred for richer detail but has not been built into the campaign view yet. The expand-in-place remains current behaviour.

---

### 3.6 Add prospects button

The campaign view header contains an `+ Add prospects` button (top right, secondary style). This links to the prospect import flow (`prospect-import.html`) scoped to the current campaign.

This button is in the wireframe and is consistent with expected product behaviour, but is not explicitly described in any locked spec.

---

---

## SECTION 4 — Prospect Import (Phase 2.10)

### 4.1 Three import methods — order matters

The activation wizard and the standalone prospect import page both offer three import methods:

1. **Paste emails** *(quickest — shown first)*
2. **Upload CSV**
3. **Add manually**

The spec (Phase 2.10) lists all three. The wireframe establishes "Paste emails" as the default selected option and the first tab, matching the spec's note that "most users will choose: Paste emails."

---

### 4.2 Two distinct import contexts

**Context A — First campaign (activation wizard):** The import step is Step 1 of the 4-step wizard (`outreach-wizard-v2`). The shell is present but the sidebar is dimmed. The wizard continues directly to message writing after import.

**Context B — Adding prospects to an existing campaign:** Uses the standalone import page (`prospect-import.html`) inside the full persistent shell. The campaign context is shown in the page header. After import, the user is returned to the campaign view.

These are two different flows with different shells and different continuation behaviour. GSD should treat them as separate routes.

---

---

## SECTION 5 — Personality Packs (Phase 2.11)

### 5.1 Clarification — packs control outgoing message style only

During wireframing, confusion arose about what personality packs control. This is the confirmed interpretation:

**Personality packs (Phase 2.11) control:**
- The writing style of AI-generated outreach messages sent to prospects
- Sentence length, directness, formality, CTA style, closing style
- Applied at: global default (settings), per-message override, per-sequence-step override

**Personality packs do NOT control:**
- The product's own UI voice (toasts, dialogs, empty states, microcopy)
- That is covered by Phase 2.12 (UX Microcopy System) as a single fixed voice

**The four packs are (from spec, confirmed):**
1. Calm Professional *(default)*
2. Direct Operator
3. Friendly Networker
4. Curious Researcher

The settings wireframe (`settings-account.html`) now correctly reflects this — the packs tab shows example outgoing message copy for each pack, not product UI tone examples.

---

### 5.2 Unspecced feature — user-configurable product voice

A separate feature was discussed: allowing users to choose the tone in which the app itself speaks to them (toast messages, confirmations, empty states). This is **distinct from Phase 2.11** and **not in any locked spec**. It has been logged for future consideration, likely Layer 5+. Do not implement as part of Phase 2.11.

---

---

## SECTION 6 — Summary Page (new — not in any spec)

### 6.1 Summary page

A new persistent page has been designed at `/summary`. It is accessible via the sidebar (bar-chart icon, labelled "Summary").

**It contains two tabs:**

**Today tab** — shown after a user completes their daily actions. Displays:
- A done-for-today moment (tick, title, copy)
- 4 stat cards: emails sent, follow-ups done, replies handled, meetings booked
- Streak indicator (consecutive active days)
- A quiet motivational quote

**This week tab** — available any time. Displays:
- Streak card
- 4 stat cards with week-on-week deltas
- Bar chart of sends per day (current day highlighted)
- Activity log (today's actions in reverse chronological order)

This page consolidates the "Done for today" and "Weekly rhythm summary" concepts from Phase 2.13 (Emotional Design System). The spec describes these as moments and states, not a dedicated page. This decision gives them a permanent home without requiring them to be triggered only by events.

The Today tab serves as both the "Done for today" destination and a live view of today's progress. GSD should treat this page as a new route: `/summary`.

---

---

## SECTION 7 — Guided Workflow (new — not in any spec)

### 7.1 Two approaches explored

Two approaches were wireframed for a "guided workflow" feature. A final decision has not been made. Both are documented here for awareness.

**Option A — Full task runner (replaces main content area)**
- Clicking "Guided workflow" in the sidebar replaces the main area with a step-by-step task runner
- Progress bar across the top: Review → Drafts → Follow-ups → Replies → Done
- One step shown at a time, with relevant prospects and actions
- "Exit" returns to normal view
- Navigated to via a sidebar icon

**Option B — Floating task panel (overlays current view)**
- A floating action button (FAB) sits fixed at bottom-right of screen, visible on all pages
- FAB shows a task count badge (number of outstanding actions today)
- Clicking FAB opens a right-side panel (360px wide) that slides over the current view without displacing it
- Panel shows: progress bar, done items, to-do items each linking to the relevant tab
- FAB hides when the panel is open; restores on close
- Panel closes on backdrop click or ✕

**Option B is currently preferred** but a final decision has not been locked. Do not implement either approach until a decision is confirmed.

---

---

## SECTION 8 — Wireframe File Reference

The following wireframe files exist at `corisleachman.github.io/outreach-dashboard/wireframes/` and represent the current design intent:

| File | What it covers |
|---|---|
| `signup-oauth.html` | Login, Gmail OAuth connect, connected state |
| `dashboard-home.html` | Campaigns list (empty state + populated), create campaign modal |
| `campaign-view.html` | Full campaign shell — all 8 tabs, prospect cards, send drawer |
| `campaign-view-mono.html` | Alternative design direction — Helvetica, off-white, teal accent |
| `prospect-import.html` | CSV import + column mapping + manual add + paste emails + prospect detail |
| `outreach-wizard-v2.html` | First-campaign activation wizard (4 steps) with dimmed sidebar |
| `followup-nurture-conversations.html` | Follow-up tab + composer, Conversations tab + thread, Nurture tab, DNC modal |
| `ai-drafts.html` | AI draft generation — configure, generating state, output, locked (Free) |
| `pricing-upgrade.html` | Free tier wall, plan comparison, Stripe checkout, post-upgrade |
| `settings-account.html` | Account settings, personality packs (corrected), billing |
| `error-edge-cases.html` | Gmail disconnect, bounce retry, send failure, sequence paused, empty state |
| `emotional-design.html` | Toast playground, milestone moments, momentum prompts, done for today |
| `summary-and-workflow.html` | Summary page (Today + This week), Guided Workflow A, Guided Workflow B + FAB |

Hub tracker (all 45 journeys with status): `corisleachman.github.io/outreach-dashboard/hub.html`

---

---

## SECTION 9 — Decisions still open

The following questions were raised during wireframing but have not been resolved. GSD should not make assumptions about these — flag them for product decision before implementing.

| # | Question | Relevant phase |
|---|---|---|
| 1 | Guided Workflow: Option A (task runner) or Option B (FAB + panel)? | New feature |
| 2 | Prospect detail: expand-in-place (current) or right drawer? | Phase 2.10 / campaign view |
| 3 | Campaign settings tab: what does it contain? | Campaign view |
| 4 | User-configurable product voice: spec and phase TBD | Layer 5+ |

---

*End of WIREFRAME-DECISIONS.md*
