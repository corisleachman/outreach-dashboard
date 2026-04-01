# Pulse. UI Source Pack — Mapping Guide

**Location:** `ui-source-pack/` in `corisleachman/outreach-dashboard`
**Live URL base:** `https://corisleachman.github.io/outreach-dashboard/ui-source-pack/`
**Purpose:** Implementation-ready assets for Codex to use directly as visual specs and HTML references.

All files use `pulse-foundation.css` for shared tokens and component styles. Import it first.

---

## How to use this pack

1. Open any view file in a browser to see the implementation-ready visual
2. Inspect HTML structure — it maps directly to the component tree Codex should build
3. Copy CSS class names from the foundation — they are the canonical token names
4. Cross-reference with the signed-off wireframes at `corisleachman.github.io/outreach-dashboard/hub.html` for additional states and edge cases

---

## Foundation

| File | What it is | Canonical | Maps to | Notes |
|------|-----------|-----------|---------|-------|
| `pulse-foundation.css` | Global CSS tokens, shell layout, all component primitives | ✅ Yes | `app/globals.css` in the Next.js app | Already partially applied in the live app from Phase 2.10. Extend, don't replace. |

---

## Shell templates

| File | What it is | Canonical | Maps to | Notes |
|------|-----------|-----------|---------|-------|
| `shell-app.html` | Bare app shell — topbar + sidebar only | ✅ Yes | `app/layout.tsx` + `components/AppShell.tsx` | The base layout wrapper for all authenticated pages |
| `shell-campaign.html` | Campaign header + 8-tab bar | ✅ Yes | `components/CampaignDetailClient.tsx` + `components/CampaignHeader.tsx` | Sticky header. Tabs controlled by `activeTab` state. |

---

## Dashboard views

| File | What it is | Canonical | Maps to | Notes |
|------|-----------|-----------|---------|-------|
| `view-dashboard-empty.html` | First-login empty state | ✅ Yes | `app/dashboard/page.tsx` — empty branch | Shown when user has 0 campaigns |
| `view-dashboard-populated.html` | Dashboard with campaigns + stat cards | ✅ Yes | `app/dashboard/page.tsx` — populated branch | Includes tasks-due stat card (amber) — Phase 2.18 feature, wire up when ready |

---

## Campaign tab views

Each file represents one tab's content — inject into `.tab-content` inside `shell-campaign.html`.

| File | What it is | Canonical | Maps to | Notes |
|------|-----------|-----------|---------|-------|
| `view-tab-review.html` | Review tab — new prospects for approval | ✅ Yes | `components/tabs/ReviewTab.tsx` | Shows prospect cards with Approve + Detail buttons. Locked rows for Free tier over-limit. |
| `view-tab-drafts.html` | Drafts tab — ready to send | ✅ Yes | `components/tabs/DraftsTab.tsx` | Each row has Edit (opens message drawer) and Send buttons |
| `view-tab-sent.html` | Sent tab — master record | ✅ Yes | `components/tabs/SentTab.tsx` | 14-option status `<select>` — status changes trigger side effects (e.g. Reply received → Conversations) |
| `view-tab-linkedin.html` | LinkedIn tab — pill filter bar | ✅ Yes | `components/tabs/LinkedInTab.tsx` | Status is manually updated — no LinkedIn API. Only shows prospects with a LinkedIn URL. |
| `view-tab-followup.html` | Follow-up tab | ✅ Yes | `components/tabs/FollowUpTab.tsx` | Shows notice banner for Free tier (locked). Pro+ users see auto-scheduled items. |
| `view-tab-nurture.html` | Nurture tab — parked prospects | ✅ Yes | `components/tabs/NurtureTab.tsx` | Re-contact date shown per row. Re-activating moves prospect back to Review. |
| `view-tab-conversations.html` | Conversations tab | ✅ Yes | `components/tabs/ConversationsTab.tsx` | Active replies + booked meetings. Resolves to Won/Nurture/Closed. |
| `view-tab-bounced.html` | Bounced tab | ✅ Yes | `components/tabs/BouncedTab.tsx` | Permutation retry + DO NOT CONTACT option |

---

## Drawers (right-sliding panels)

| File | What it is | Canonical | Maps to | Notes |
|------|-----------|-----------|---------|-------|
| `view-drawer-message.html` | Message editor / send drawer | ✅ Yes | `components/drawers/MessageDrawer.tsx` | Opens when user clicks Edit or Send on a draft row. Shows email content + Gmail sync notice. Footer: Discard / Save draft / Send. |
| `view-drawer-sequence.html` | Sequence step editor drawer | ✅ Yes | `components/drawers/SequenceDrawer.tsx` | Shows sequence steps with type + tone chip selectors. "Follow-ups stop if prospect replies" notice is mandatory. |

---

## Modals

| File | What it is | Canonical | Maps to | Notes |
|------|-----------|-----------|---------|-------|
| `view-modal-create-campaign.html` | Create campaign modal | ✅ Yes | `components/modals/CreateCampaignModal.tsx` | Shows connected Gmail account. Name field. |
| `view-modal-import.html` | CSV import modal (upload + column mapping) | ✅ Yes | `components/modals/ImportModal.tsx` | Two-step: upload zone → column mapping. Column dropdown is dynamically populated from parsed CSV headers — not static. |
| `view-modal-upgrade.html` | Upgrade modal (Free → Pro Light) | ✅ Yes | `components/modals/UpgradeModal.tsx` | Already partially built in Phase 2.10. Shows referral extension offer. Modal copy and CTAs are tier-aware — see `BRAND-BRIEF.md` Section 3. |

---

## Settings views

| File | What it is | Canonical | Maps to | Notes |
|------|-----------|-----------|---------|-------|
| `view-settings-shell.html` | Settings layout with 7-tab sidebar nav | ✅ Yes | `app/settings/layout.tsx` | Profile tab shown as default. 7 tabs: Profile, Connected accounts, Personality packs, Notifications, Appearance, Plan & billing, Referrals |
| `view-settings-billing.html` | Plan & billing tab — trial state shown | ✅ Yes | `app/settings/billing/page.tsx` | 4 billing states: Free / Pro Light trial (this file) / Pro Light paid / Pro Plus. For all 4 states see `wireframes/settings-v2.html` |

---

## State templates

| File | What it is | Canonical | Maps to | Notes |
|------|-----------|-----------|---------|-------|
| `view-empty-tab.html` | Generic empty state template | ✅ Yes | All tabs when empty | Replace placeholder copy with tab-specific message. Pattern: icon + title + description + CTA. |
| `view-state-locked.html` | Feature locked / upgrade wall | ✅ Yes | Any Pro-gated surface | Used for tab-level locking (e.g. Follow-up on Free), feature-level locking, and prospect-row locking. |

---

## What is NOT in this pack (still in wireframes only)

These views exist in the signed-off wireframes but have not yet been decomposed into source pack files. Use the wireframe directly for these.

| Feature | Wireframe file | Notes |
|---------|---------------|-------|
| Sign-up / Gmail OAuth flow | `wireframes/signup-oauth.html` | 7 auth states. Phase already complete — reference for any auth UI fixes. |
| Campaign wizard (onboarding) | `wireframes/outreach-wizard-v3.html` | 7-screen activation flow. Phase 2.10 feature. |
| Pricing page (3 tiers) | `wireframes/pricing-upgrade.html` | 7 screens. Phase 2.14 — Stripe integration not yet built. |
| Upgrade moments (T1–T4) | `wireframes/upgrade-moments.html` | Contextual upgrade prompts. Phase 2.16. |
| Task system | `wireframes/tasks.html` | 10 screens. Phase 2.18 — not building yet. |
| Campaign settings | `wireframes/campaign-settings.html` | 6 views. Pause/resume/archive flows. |
| Summary / Today | `wireframes/summary-v2.html` | Email queue + task queue. |
| Error & edge cases | `wireframes/error-edge-cases.html` | 10 states: Gmail disconnected, rate limits, offline, etc. |
| Referral system | `wireframes/referral-system.html` | Full referral flow. Phase 2.15. |

---

## Known implementation differences (wireframe vs live build)

| Feature | Source pack shows | Live app should do |
|---------|-----------------|-------------------|
| CSV column mapping dropdowns | Static HTML `<option>` labels | Dynamically populated from parsed CSV headers |
| Gmail sync notice in message drawer | Static text | Live sync status from Gmail API |
| Upgrade modal pricing | Static £7/mo | Dynamic — pulled from Stripe price IDs |
| Prospect avatar colours | Pink/cyan/amber by position | Derived from prospect name hash or position |

---

## Tier gating reference

Codex must gate features at the component level based on `userPlan`:

| Feature | Free | Pro Light | Pro Plus |
|---------|------|-----------|---------|
| Campaigns | 1 (hard wall at 1) | 5 (hard wall at 5) | Unlimited |
| Prospects | 100 (nudge 80, wall 100) | 1,000 (nudge 800, wall 1,000) | 10,000 |
| AI draft generation | Locked | ✅ | ✅ |
| Sequence steps 2–6 | Locked (show with lock icon) | ✅ | ✅ |
| Auto-scheduling | Locked | ✅ | ✅ |
| Follow-up tab actions | Visible, locked | ✅ | ✅ |
| Bulk send | Locked | ✅ | ✅ |

`UserPlan = 'free' | 'pro_light' | 'pro_plus' | 'beta'`
Beta users get Pro Plus access. The `'pro'` enum value exists in the DB but all data has been migrated to `'pro_plus'` — TypeScript type correctly omits it.

---

## File count summary

| Category | Files |
|----------|-------|
| Foundation | 1 CSS file |
| Shell templates | 2 HTML files |
| Dashboard views | 2 HTML files |
| Campaign tab views | 8 HTML files |
| Drawer views | 2 HTML files |
| Modal views | 3 HTML files |
| Settings views | 2 HTML files |
| State templates | 2 HTML files |
| **Total** | **22 files** |

---

*Generated April 2026 from signed-off Pulse. wireframes. Do not add speculative views to this pack — all files must map to a signed-off wireframe.*
