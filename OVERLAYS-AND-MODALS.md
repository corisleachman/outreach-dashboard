# OVERLAYS-AND-MODALS.md

outreach. — Side Windows & Modal Windows Reference  
Last updated: April 2026

---

## Purpose

This file is the canonical reference for every instance where a side window (right-side drawer or sliding panel) or a modal window appears across the product.

Organised by page. For each instance: what triggers it and what the user sees inside it.

---

## How to use this file

When building any overlay or modal behaviour, check here first for the agreed trigger and content before implementing. If a new overlay or modal is added during build, it must be logged here.

---

---

## CAMPAIGN VIEW (`/campaigns/[id]`)

### Side Windows (Right-Side Drawers)

---

**1. Prospect Detail Drawer**

Trigger: Click anywhere on a prospect card row (any tab), or the ↗ detail icon in the row's action buttons.

Width: 480px. Slides in from the right. Overlays the list without pushing it. Backdrop click closes.

Contents:
- Editable fields: first name, last name, email, company
- Read-only fields: industry, org size, LinkedIn link
- About section
- Notes textarea (free text)
- If no email address: amber inline badge in the email label row — "No email found — Generate". Clicking derives `firstname@domain.com` from website domain, populates the field, and switches badge to "✦ Generated" (cyan)
- Footer: Skip prospect (left) · Save · Approve → (right)
- Approve and Skip have identical effect to the row action buttons — card fades and removes

---

**2. Send Email Drawer**

Trigger: Click the Send button on a draft row in the Drafts tab.

Slides in from the right. Backdrop click or Cancel closes without sending.

Contents:
- Confirmation message: email will be sent from the connected Gmail account
- Subject line (pre-filled from draft)
- Body copy (pre-filled from draft)
- Optional attachment section
- Footer: Cancel · Send email →

---

**3. Edit Sequence Drawer**

Trigger: Click the "Edit sequence" button in the campaign header action strip (grouped with "+ Add prospects" and "LI message").

Width: 520px. Slides in from the right with a 280ms cubic-bezier transition. Resets to clean/collapsed state every time it opens. Overlay click or Cancel closes without saving.

Contents:
- Header: "Edit sequence — [Campaign name]" + ✕
- Step cards displayed vertically with connector line between them
- All cards collapsed by default. Each collapsed card shows: step number (pink circle for Step 1, grey for follow-ups), message type badge, tone badge, delay text, trash icon (follow-up steps only), chevron ▼
- Clicking a card header expands it. Drawer scrolls to the top of the expanded card

Expanded Step 1 (initial email) fields:
  1. Message type chips: Value drop / Follow-up / Check-in / Post-meeting
  2. Tone chips: Calm & Commercial / Direct & Confident / Light Touch
  3. Subject line input
  4. Body copy textarea
  5. Attachment drop zone

Expanded follow-up step fields:
  1. Delay — number input + "days" label
  2. Message type chips
  3. Tone chips
  4. Thread toggle — "Reply to original Gmail thread" (on by default, pink when active). Toggle off reveals subject line field with max-height animation
  5. Body copy textarea
  6. Attachment drop zone

Chip selection: clicking a chip immediately updates the badge in the collapsed card header.

Deleting a step: trash icon shows an inline confirmation row inside the card (red tint) — "Remove this follow-up? · [Cancel] [Remove]". On confirm: card collapses to zero height with opacity fade (320ms), removed from DOM, remaining steps renumbered sequentially, "Add follow-up" button reappears if previously hidden.

Adding a step: "+ Add follow-up" dashed button below last step (hidden at 6 steps). Clicking inserts a new card, animates in, auto-expands, scrolls into view.

Footer: Cancel · Save changes (shows toast confirmation on save)

---

**4. Follow-up Composer Drawer**

Trigger: Click the "Follow up" button on a prospect row in the Follow-up tab.

Slides in from the right.

Contents:
- Header: prospect name + email address + ✕
- Subject line field
- Message body (pre-filled with a draft follow-up)
- Footer: Cancel · Send follow-up →

---

**5. Guided Workflow Panel**

Trigger: Click the floating action button (FAB) fixed at the bottom-right of the screen. The FAB is visible on all authenticated pages and shows a live task count badge. FAB hides while the panel is open and restores on close.

Width: 360px. Slides in from the right, overlaying the current view without displacing it. Panel closes on ✕ or backdrop click.

Contents:
- Progress indicator: e.g. "3 of 8 done"
- Done section: list of completed tasks for today
- To Do section: list of outstanding tasks, each with a count badge (e.g. "Send 3 drafts — Agency founders Q1 · 3", "2 follow-ups due today · 2", "Check LinkedIn connections · 5"). Each item links directly to the relevant tab in the campaign view
- "Mark all done →" button at the bottom
- ✕ to close

---

### Modal Windows

---

**1. LinkedIn Message Config Modal**

Trigger: Click the "LI message" button in the campaign header action strip.

Centred overlay. Closes on Cancel or ✕.

Contents:
- Explanation: when you click the LinkedIn icon on a prospect row, this message is copied to clipboard with `{{first_name}}` merged in automatically
- Textarea: write or edit the campaign's LinkedIn connection/DM message template
- Supported merge tags: `{{first_name}}` · `{{company}}`
- Footer: Cancel · Save message

Note: LinkedIn message template is per-campaign, not global.

---

**2. Do Not Contact (DNC) Confirmation**

Trigger: Selecting "DO NOT CONTACT" from the 14-option status dropdown on a prospect in the Sent tab.

Contents:
- Warning that this action is irreversible
- Requires explicit confirmation before status is applied
- Once confirmed: prospect is permanently marked DNC and cannot be emailed

---

**3. Delete Follow-Up Step Inline Confirmation**

Trigger: Clicking the trash icon on a follow-up step card inside the Edit Sequence drawer.

Note: This is not a separate modal window — it is an inline confirmation row that appears inside the step card itself (red background tint).

Contents:
- "Remove this follow-up?" — [Cancel] [Remove]
- Sits within the drawer, does not create a new overlay layer

---

---

## DASHBOARD HOME (`/dashboard`)

### Modal Windows

---

**1. Create Campaign Modal**

Trigger: Click the "+ New campaign" button on the dashboard home.

Centred overlay on top of the campaigns list.

Contents:
- Single field: campaign name (placeholder: e.g. "Agency founders — Q1")
- Helper text: you can rename it later
- Footer: Cancel · Continue →
- On submit: navigates to activation wizard if this is the user's first campaign, or directly to campaign view for subsequent campaigns

---

**2. Campaign Kebab Menu**

Trigger: Click the three-dot kebab icon in the top-right of a campaign card.

Note: This is a dropdown menu, not a modal, but it contains actions that trigger confirmations.

Actions:
- Rename — triggers an inline prompt pre-filled with the current campaign name. Updates card name on confirm
- Archive — shows a toast confirmation
- Delete — native confirm dialog with "cannot be undone" warning

---

---

## ACTIVATION WIZARD (`/onboarding/start`)

### Notes on shell behaviour

During the wizard, the sidebar is present but dimmed (opacity ~20%) and non-interactive. Hovering a dimmed icon shows tooltip: "Finish setup first." This is not a modal — it is a shell state.

No side windows or modals are triggered from within the wizard itself. The wizard is a linear 4-step flow and does not use overlays.

---

---

## SUMMARY PAGE (`/summary`)

### Side Windows

---

**1. Guided Workflow Panel (FAB)**

Same behaviour as described under Campaign View. The FAB is present on all authenticated pages including the Summary page.

---

---

## SETTINGS (`/settings`)

No side windows or modals currently specced for the settings page.

---

---

## Notes

- All right-side drawers use backdrop-click-to-close unless stated otherwise
- The Edit Sequence drawer uses `visibility:hidden` when closed (not just `display:none`) to prevent content bleed-through beneath prospect rows
- The Guided Workflow FAB is the only persistent UI element that is present across all authenticated pages
- The Follow-up Composer drawer and the Prospect Detail drawer are the two drawers that can be triggered from multiple tabs
- DNC is the only irreversible action in the product that requires a modal confirmation

---

*End of OVERLAYS-AND-MODALS.md*
