# WIREFRAME-DECISIONS.md

Outreach — Wireframe Decisions Log  
Last updated: March 2026 (session 2 update)

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

**Decision locked:** Clicking a prospect row in the Review tab opens a **right-side drawer** (480px wide, slides in from the right, overlays content without pushing the list). The expand-in-place behaviour has been removed.

The drawer contains:
- Editable fields: first name, last name, email, company
- Read-only fields: industry, org size, LinkedIn link
- About section
- Notes textarea (free text)
- Footer: Skip (left) · Save / Approve → (right)

Two versions of the campaign view exist for comparison:
- `campaign-view.html` — expand-in-place (original)
- `campaign-view-drawer.html` — right drawer (new, preferred)

**Mobile note:** The right drawer will need to become a full-screen overlay or bottom sheet on mobile. Expand-in-place would translate to mobile without changes. This trade-off is noted for when mobile is addressed (Layer 5+).

---

### 3.5a Email generation in the prospect drawer

When a prospect has no email address, the drawer shows an inline status badge in the email label row (right-aligned). The badge reads *"No email found — Generate"* and is itself clickable. No separate element appears above the field — the badge is always present in the label row, preventing layout shift.

Clicking the badge:
1. Derives an email from `firstname@domain.com` using the prospect's first name and website domain (stripping `https://`, `www.`, and any path)
2. Populates the email input field
3. Switches the badge to *"✦ Generated"* (cyan) — stays in the same position
4. Pulses the input briefly to confirm

**Catch-all and Verified badges** have been removed from the prospect card rows in the Review tab — they were a hangover from an earlier spreadsheet-based workflow and are no longer needed.

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

**Decision locked: Option B — Floating task panel.**

The FAB sits fixed at the bottom-right of the screen on all authenticated pages. It shows a live task count badge. Clicking it opens the right-side panel (360px wide) overlaying the current view. The FAB hides while the panel is open and restores on close.

Do not implement Option A (full task runner).

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
| 1 | ~~Guided Workflow: Option A or Option B?~~ **Resolved — Option B (FAB + panel)** | New feature |
| 2 | ~~Prospect detail: expand-in-place or right drawer?~~ **Resolved — right drawer** | Phase 2.10 / campaign view |
| 3 | Campaign settings tab: what does it contain? | Campaign view |
| 4 | User-configurable product voice: spec and phase TBD | Layer 5+ |


---

## SECTION 10 — Campaign View Clean Rewrite (March 2026, Session 2)

### 10.1 campaign-view-v3.html — canonical file

The previous `campaign-view-drawer.html` became irreparably fragile through accumulated CSS and JS patches (multiple conflicting rules, orphaned functions, JS-created DOM elements causing stacking context failures). It has been **retired as a reference file only** and replaced with a clean rewrite.

**Canonical file going forward: `campaign-view-v3.html`**

All prototype navigation (dashboard-home, prospect-import, wizard) now links to `campaign-view-v3.html`.

`campaign-view-drawer.html` remains at its URL as a reference for any features that may need to be cross-checked.

---

### 10.2 Architecture principles for the rewrite

The rewrite was done in one clean pass with these rules:
- One CSS block, no duplicates, no conflicting rules
- All overlays as static HTML with `position:fixed` and CSS-controlled visibility (`display:none` default)
- No JS-created DOM elements — all panels exist in the HTML from the start
- One JS block, no orphaned functions
- Pre-push validation: script tag balance, duplicate ID check, all `getElementById` calls verified against HTML, all called functions verified as defined, all `switchTab` calls verified against `tc-` div IDs

---

### 10.3 Three overlays — consistent pattern

All three overlays in `campaign-view-v3.html` use the same pattern:

| Overlay | ID (backdrop) | ID (panel) | Trigger |
|---|---|---|---|
| Prospect detail | `pd-backdrop` | `pd-panel` | Click prospect card row |
| Send email | `sd-backdrop` | `sd-panel` | Click Send button on draft row |
| LinkedIn config | `li-backdrop` | `li-modal` | Click "LI message" button in header |

**Pattern:** backdrop and panel both start hidden (`display:none`). Opening adds class `open` to both. Backdrop click closes. CSS `.open` rule shows the element. Panel slides via `transform:translateX(100%)` → `translateX(0)`.

---

### 10.4 LinkedIn features

**LinkedIn button behaviour (Review, LinkedIn tabs):**
- Clicking the LinkedIn icon opens a LinkedIn people search for that prospect in a new tab
- Simultaneously copies the campaign's LinkedIn message template to clipboard, with `{{first_name}}` and `{{company}}` merged
- A cyan confirmation bar fades in at the bottom of the screen: *"✓ LinkedIn message copied to clipboard"*

**LinkedIn message config modal:**
- Opened via "LI message" button (cyan, with LinkedIn icon) in the campaign header
- Campaign-scoped message template (different campaigns can have different messages)
- Default message pre-filled: *"Hi {{first_name}}, I wanted to connect to introduce myself and the fractional new business support I help agencies with…"*
- Supports merge tags: `{{first_name}}` · `{{company}}`
- Save stores for session · Cancel closes without saving

**Decision:** LinkedIn message is campaign-scoped, not global. This resolves open question 3 (Campaign settings) partially — the LI message is the first piece of campaign-level configuration identified.

---

### 10.5 Email generation in prospect drawer

When a prospect has no email address imported, the email field label row shows a badge (right-aligned, amber): *"No email found — Generate"*

Clicking the badge:
1. Derives `firstname@domain.com` from the prospect's first name + website domain (strips `https://`, `www.`, any path)
2. Populates the email input
3. Switches badge to *"✦ Generated"* (cyan, non-clickable)
4. Pulses the input border briefly to confirm

**No layout shift** — the badge is always present in the label row at a fixed size; it never appears or disappears, only changes its text and colour.

---

### 10.6 Prospect drawer — confirmed behaviour

- Opens by clicking anywhere on a prospect card row, or the detail icon (↗) in the action buttons
- 480px wide, slides in from right, overlays the list without pushing it
- Contains: first name, last name, email (with generation), company, industry, org size, LinkedIn link, about, notes textarea
- Footer: Skip prospect (left) · Save · Approve → (right)
- Approve and Skip from drawer have identical effect to the row buttons (card fades and removes)
- Backdrop click closes the drawer

---

## SECTION 11 — Dashboard Home Updates (March 2026, Session 2)

### 11.1 Campaign card — toggle and kebab

**Toggle switch** replaces the old "Active / Paused" status badge on each campaign card.
- Green glowing toggle = Active
- Grey toggle = Paused
- Clicking toggles state and updates label text
- Uses `stopPropagation` so it doesn't navigate into the campaign

**Three-dot kebab menu** in the top-right of each card.
- Options: Rename · Archive · Delete
- Rename: triggers a prompt with current name pre-filled, updates card name on confirm
- Archive: shows toast confirmation
- Delete: native confirm dialog with "cannot be undone" warning
- Menu closes on any outside click
- Kebab and toggle are horizontally centre-aligned using `align-items:center` on `.campaign-card-top`
- Gap of `12px` between the toggle label and the kebab box

### 11.2 Sidebar standardised

Dashboard home sidebar updated to match the slim icon pattern used across all other pages:
- 56px wide, icon-only, three items
- Campaigns (active state), Summary → `summary-and-workflow.html`, Settings (pinned bottom) → `settings-account.html`
- Settings pinned via `margin-top:auto`

---

## SECTION 12 — Sidebar standardisation (all pages, March 2026 Session 2)

### 12.1 Canonical sidebar — confirmed across all files

The following files were updated to use the canonical slim sidebar:

| File | Change |
|---|---|
| `campaign-view.html` | Added missing Summary icon |
| `campaign-view-v3.html` | Built in from scratch — correct |
| `prospect-import.html` | Replaced old `.sb`/`.ni` wide sidebar |
| `followup-nurture-conversations.html` | Replaced old `.sb`/`.ni` wide sidebar |
| `ai-drafts.html` | Replaced old `.sb`/`.ni` wide sidebar |
| `error-edge-cases.html` | Replaced old `.sb`/`.ni` wide sidebar |
| `emotional-design.html` | Replaced old `.sb`/`.ni` wide sidebar |
| `settings-account.html` | Replaced old `.sb`/`.ni` wide sidebar |
| `pricing-upgrade.html` | Added full topbar + sidebar (had neither) |
| `dashboard-home.html` | Replaced wide text-label sidebar with slim icons |
| `summary-and-workflow.html` | Reference implementation — unchanged |

### 12.2 Canonical sidebar CSS pattern

```css
.sidebar { position:fixed; top:var(--th); left:0; bottom:0; width:var(--sw);
  background:rgba(13,9,20,0.7); border-right:1px solid var(--b);
  display:flex; flex-direction:column; align-items:center;
  padding:14px 0; z-index:190; gap:4px; }
.si { width:36px; height:36px; border-radius:8px; ... color:rgba(255,255,255,0.55); }
.si:hover { color:rgba(255,255,255,0.9); }
.si.on { background:var(--pd); color:var(--pink); }
.si svg { display:block; flex-shrink:0; }
.si-bottom { margin-top:auto; }
.si-tip { position:absolute; left:calc(100% + 10px); opacity:0; visibility:hidden; }
.si:hover .si-tip { opacity:1; visibility:visible; }
```

**Critical rules:**
- `display:block` on `.si svg` is mandatory — without it SVGs collapse to zero size
- `visibility:hidden` (not just `opacity:0`) on `.si-tip` — prevents text showing through in some browsers
- `margin-top:auto` on `.si-bottom` — required for settings icon to pin to foot of sidebar

---

## SECTION 13 — Typography and colour adjustments (March 2026, Session 2)

### 13.1 Grey text lifted across all pages

The dim text tokens were too dark to read comfortably against the dark backgrounds. Updated values:

| Token | Old value | New value | Usage |
|---|---|---|---|
| `--td` / `--text-dim` | `#444456` | `#6b6b80` / `#7a7a90` | Labels, subtitles, meta text |
| `--tm` / `--text-mid` | `#8a8a9a` | `#a8a8b8` | Secondary text, inactive tabs |

Applied to: `campaign-view-v3.html`, `dashboard-home.html`

### 13.2 Font sizes bumped in campaign-view-v3

| Element | Old size | New size |
|---|---|---|
| `.psub` (prospect card subtitles) | 11px | 12px |
| `.tsub` (table row subtitles) | 11px | 12px |
| `.sl` (stat strip labels) | 9px | 10px |

---

## SECTION 14 — Wizard v3 (outreach-wizard-v3.html)

### 14.1 What changed from v2

The activation wizard has a v3 variant at `outreach-wizard-v3.html`. Key differences from v2:

**Step 1 — Import:**
- Three import methods are now **horizontal tabs** instead of vertical card rows
- Tab order: Paste emails (default, with "Quickest" badge) · Upload CSV · Add manually
- Clicking a tab switches the active state and shows the relevant input area

**Step 2 — Write message:**
- Message type and tone selectors are combined into a single **compact selector bar** above the message card
- Type chips: Value drop · Follow-up · Check-in · Post-meeting (pink when selected)
- Tone chips: Calm & Commercial · Direct & Confident · Light Touch (cyan when selected)
- A **description line** sits between the selector bar and the message card, showing a one-line explanation of the selected type — cross-fades when the type changes
- Subject line and body textarea are visible **above the fold** without scrolling

**Navigation:**
- `dashboard-home.html` now links to `outreach-wizard-v3.html` (not v2)
- v2 remains available at its URL as a reference

### 14.2 Comparison bar

A fixed bottom bar on wizard v3 reads: *"Wizard · v3 — compact · Compare v2 →"* with a cyan link to `outreach-wizard-v2.html`.

---

## SECTION 15 — New files added (March 2026, Session 2)

| File | Description |
|---|---|
| `wireframes/campaign-view-v3.html` | Clean rewrite of campaign view — canonical going forward |
| `wireframes/campaign-view-drawer-spec.html` | Feature specification for the v3 rewrite (also linked from hub) |
| `wireframes/outreach-wizard-v3.html` | Wizard with compact step 2 and horizontal import tabs |
| `wireframes/summary-and-workflow.html` | Summary page (Today + This week) + Guided Workflow A and B |

### Hub quick links added
- Campaign view spec → `wireframes/campaign-view-drawer-spec.html`
- Campaign view v3 → `wireframes/campaign-view-v3.html`

---

## SECTION 9 — Decisions still open (updated)

| # | Question | Status |
|---|---|---|
| 1 | ~~Guided Workflow: Option A or B?~~ | **Resolved — Option B (FAB + panel)** |
| 2 | ~~Prospect detail: expand-in-place or right drawer?~~ | **Resolved — right drawer** |
| 3 | Campaign settings tab: what does it contain? | **Partially resolved** — LI message template is first identified piece of campaign-level config. Full campaign settings tab TBD. |
| 4 | User-configurable product voice: spec and phase TBD | Still open — Layer 5+ |

---

*End of WIREFRAME-DECISIONS.md*

---

## SECTION 16 — Edit Sequence drawer (March 2026, Session 3)

### 16.1 "Edit sequence" entry point

The campaign header previously had an "Edit message" text link in the meta line below the campaign name. This has been replaced with a proper **"Edit sequence" button** in the action strip on the right of the campaign header, grouped with "+ Add prospects" and "LI message".

**Button order (left to right):**
`≡ Edit sequence` · `+ Add prospects` · `in LI message`

The meta line now reads: `47 prospects · Started 12 Mar 2026 · 3-step sequence` — no link, just informational.

**Rationale:** "Edit message" was misleading once sequences with multiple steps were introduced. Promoting it to a button in the action strip gives it the correct visual weight and groups all campaign-level configuration actions in one place.

---

### 16.2 Edit sequence — right-side drawer (not a modal, not a full page)

Clicking "Edit sequence" opens a **right-side drawer** (520px wide) that slides in from the right edge of the screen. The campaign view — including the prospect list — remains visible behind a semi-transparent overlay.

This was a deliberate UX decision: users should be able to **glance at their prospects while thinking about messaging**. A full-page navigation or centred modal would break that context. The drawer preserves it.

**Drawer behaviour:**
- Slides in with a 280ms cubic-bezier transition
- `visibility:hidden` when closed (prevents content bleed-through beneath prospect rows)
- Resets to collapsed/clean state every time it opens (no stale expanded state from previous session)
- Overlay click or Cancel button both close without saving
- Save changes button closes and shows a toast confirmation

---

### 16.3 Step cards — collapsed by default

Steps are displayed as **vertical cards** with a connector line between them. All cards are **collapsed by default** on open. Each collapsed card shows:
- Step number (circle, pink for Step 1, grey for follow-ups)
- Message type badge (pink)
- Tone badge (cyan)
- Delay text (e.g. "3 days after step 1")
- Trash icon (follow-up steps only — Step 1 cannot be deleted)
- Chevron ▼

Clicking anywhere on the card header expands it. The drawer body scrolls to the top of the expanded card.

---

### 16.4 Expanded step editor fields

When a step card is expanded, it reveals (in order):

**Step 1 (initial email):**
1. Message type chips (Value drop / Follow-up / Check-in / Post-meeting)
2. Tone chips (Calm & Commercial / Direct & Confident / Light Touch)
3. Subject line input
4. Body copy textarea
5. Attachment drop zone

**Follow-up steps (Steps 2+):**
1. Delay — number input + "days" label
2. Message type chips
3. Tone chips
4. Thread toggle ("Reply to original Gmail thread" — on by default, pink when active)
5. Subject reveal — slides in below the toggle when threading is turned off
6. Body copy textarea
7. Attachment drop zone

**Chip selection behaviour:** Clicking a chip selects it (highlighted pink for type, cyan for tone), deselects the others, and **immediately updates the badge in the collapsed card header** so the summary is always accurate.

**Thread toggle behaviour:** Identical pattern to the wizard (`outreach-wizard-v3.html`). Toggle off = grey, subject field slides in with max-height animation. Toggle on = pink, subject field collapses. Same `.seq-tog` CSS class and `seqToggleThread()` JS function.

---

### 16.5 Deleting a follow-up step

Clicking the trash icon on a collapsed or expanded follow-up card shows an **inline confirmation row** inside the card (red background tint):

> *Remove this follow-up?* · [Cancel] [Remove]

Confirming triggers:
1. Height collapses to zero with opacity fade (320ms)
2. Step is removed from DOM
3. Remaining steps are **renumbered sequentially** (1, 2, 3… not 1, 2, 4)
4. The "Add follow-up" button reappears if it was hidden (max 6 steps)

**Numbering implementation note:** New steps use a `uid` based on `Date.now()` for their DOM element IDs to prevent ID collisions after delete+add cycles. The visible step number is always derived from the step's position in the DOM, not its ID.

---

### 16.6 Adding a follow-up step

The "+ Add follow-up" dashed button appears below the last step (hidden when 6 steps exist). Clicking it:
1. Inserts a new step card below the current last step
2. Animates in (fade + translateY)
3. Auto-expands the new card
4. Scrolls it into view
5. Hides the add button if the sequence is now at 6 steps

---

### 16.7 JS extracted to external file

`campaign-view-v3.html` grew to ~110KB which caused the Cloudflare CDN to truncate the inline `<script>` block, silently breaking all JS. The script block has been extracted to `wireframes/campaign-view-v3.js` and referenced with `<script src="campaign-view-v3.js"></script>`.

This is now the standard pattern for any wireframe file that grows beyond ~80KB.

---

### 16.8 Open decisions updated

| # | Question | Status |
|---|---|---|
| 1 | ~~Guided Workflow: Option A or B?~~ | **Resolved — Option B (FAB + panel)** |
| 2 | ~~Prospect detail: expand-in-place or right drawer?~~ | **Resolved — right drawer** |
| 3 | Campaign settings tab: what does it contain? | **Partially resolved** — LI message template is first identified piece. Edit sequence is now a header-level action (not a settings tab item). Full campaign settings tab TBD. |
| 4 | User-configurable product voice | Still open — Layer 5+ |
| 5 | Sequence builder — where does it live in the nav? | **Resolved** — "Edit sequence" button in campaign header opens a right-side drawer. Not a tab, not a full page. |

---

*End of WIREFRAME-DECISIONS.md*


---

## SECTION 11 — Sidebar Navigation Order (Locked March 2026)

**Decision:** Summary is the first item in the sidebar, Campaigns is second.

**Rationale:** Summary / Today is the default landing page on login. It is the primary daily entry point — the place users come to see what needs doing. Campaigns is the workspace users navigate to from the queue. The sidebar order should reflect the natural usage flow: orientation first, then work.

**Implementation:** Apply this order consistently across all wireframes and in the built product.

| Position | Icon | Destination |
|---|---|---|
| 1 (top) | Summary (grid icon) | `/summary` — default landing page |
| 2 | Campaigns (lines icon) | `/dashboard` — campaigns list |
| 3 (bottom, margin-top:auto) | Settings (cog icon) | `/settings` |

**Updated in:** `wireframes/summary-v2.html`, `wireframes/campaign-view-v3.html`
**Apply to all future wireframes** before sign-off.
