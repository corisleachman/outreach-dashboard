# Phase — Performance & Architecture Audit

**Status:** Deferred — to be run after all core phases (2.9–2.16) are stable and the feature set is locked.
**Trigger:** Minimum 2 weeks of real user sessions in production. Do not run this before real usage data exists.
**Owner:** Claude Code (GSD)
**Estimated duration:** 2–3 focused sessions

---

## Purpose

Pulse has been built in phases, with the backlog evolving and features being reprioritised along the way. This is the expected shape of a product built incrementally. The consequence is that the codebase will contain:

- Components and API routes that were superseded by later phases but not deleted
- CSS declarations that no longer match any rendered element
- Dependencies that were added for one feature and are no longer needed
- Database queries that were written for an earlier data model and never updated
- Duplicate logic that was reimplemented in a different file during a later phase

This audit pass cleans all of that up. It does not change any user-facing behaviour.

---

## When To Run

All of these must be true before starting:

- [ ] Phases 2.9–2.16 are shipped and stable
- [ ] No features are actively in development (don't audit during a build sprint)
- [ ] At least 2 weeks of real production traffic has passed
- [ ] Supabase slow query log has at least 7 days of data to analyse
- [ ] A baseline build output has been captured (see Step 0 below)

---

## Step 0 — Establish Baseline (Do This First)

Before touching anything, capture the current state so you have a before/after comparison.

```bash
cd /Users/impero/outreach-app

# Capture build output — note each page's First Load JS size
npm run build 2>&1 | tee build-baseline.txt

# Note the total bundle size reported at the bottom
# Save this file — compare against it after the audit
```

Record these numbers somewhere accessible:
- Total First Load JS (shared)
- Largest individual page bundles
- Any pages flagged as "Large Page" (>500kb)

---

## Step 1 — Bundle Analysis (JS Weight)

Install the analyser if not already present:

```bash
npm install --save-dev @next/bundle-analyzer
```

Configure in `next.config.js`:

```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer({
  // existing config
});
```

Run it:

```bash
ANALYZE=true npm run build
```

This opens a treemap in the browser. Look for:

- **Packages that are unexpectedly large** — anything over 50kb deserves a look
- **Duplicate packages** — the same library at two different versions (common with date/time libraries)
- **Packages only used in one place** — if a 200kb library is used for one function, replace the function
- **Client-side code that could be server-side** — anything that's in the client bundle but only used for data fetching
- **Icon libraries** — if you're importing from a large icon set, check you're using tree-shaking correctly

Known candidates to investigate for Pulse specifically:
- Any date/time library (moment, dayjs, date-fns) — check for duplicates
- The Anthropic SDK — should only be on the server side, never in the client bundle
- Any CSV parsing library — should be used server-side only

---

## Step 2 — Dead Code (Components, Routes, Functions)

Install `knip` — a dead code detector for TypeScript/Next.js projects:

```bash
npm install --save-dev knip
npx knip
```

Knip finds:
- Exported functions and types that are never imported anywhere
- Files that are never referenced
- Dependencies in `package.json` that are never imported

Work through the output carefully. Knip has false positives (it can miss dynamic imports and some Next.js conventions). For each flagged item:

1. Manually verify it's genuinely unused (search the codebase)
2. Check git log — if it was recently added, it may be part of an in-progress feature
3. Delete confidently if confirmed dead

Pay particular attention to:
- Components in `/components/app/` that no longer appear in any page
- API routes in `/app/api/` that have no caller
- Utility functions in `/lib/` that were written for an earlier version of a feature
- Any file with "old", "v1", "draft", or "unused" in the name (shouldn't exist but might)

---

## Step 3 — Unused Dependencies

```bash
npx depcheck
```

For each package flagged as unused:
1. Search the codebase for any import of that package (`grep -r "package-name" src/`)
2. If genuinely unused, remove from `package.json`
3. Run `npm install` to update `package-lock.json`

Also check for packages that overlap in purpose:
- Multiple HTTP clients (axios + fetch wrappers)
- Multiple date libraries
- Multiple form validation libraries
- Multiple state management approaches

If two packages do the same thing, pick the one used more widely and migrate any uses of the other.

---

## Step 4 — CSS Audit

Check for CSS declarations that no longer match any rendered element.

```bash
# Install PurgeCSS if not already present
npm install --save-dev purgecss

# Run against built output
npx purgecss --css .next/static/css/*.css --content .next/server/**/*.html --output purged-css-report/
```

Also do a manual pass on `app/globals.css`:
- Look for classes defined there that aren't used in any component
- Look for CSS custom properties (variables) defined but never referenced
- Look for duplicate rule declarations (same class defined twice with different values — the second wins, the first is dead)
- Look for commented-out blocks — these should be deleted, not left in

---

## Step 5 — Database Query Audit

Open the Supabase dashboard → **Reports** → **Query Performance**.

Sort by mean execution time. Investigate any query over 50ms.

For each slow query:

1. Identify which API route is generating it
2. Check whether the query is fetching more columns than the component actually uses (`SELECT *` is often the culprit)
3. Check whether an index exists for the filter/join columns — if not, add one
4. Check whether the query runs once per request or N times per row (N+1 problem)

Known patterns to check for Pulse specifically:
- Campaign dashboard queries — do they join prospects, sequences, and messages in one query or multiple?
- The Drafts tab — does it load all draft data including body copy even when only the subject line is shown in the list?
- Follow-up polling — is it running queries on a schedule that aren't using indexed columns?

Also audit RLS policies. A policy that does a subquery on every read is expensive at scale. Check whether any RLS policies can be simplified now that the schema has stabilised.

---

## Step 6 — API Route Audit

Walk every file in `/app/api/`. For each route:

- [ ] Is there at least one caller in the frontend codebase? (If not, delete it)
- [ ] Does the response shape match what the caller actually uses? (If the API returns 20 fields and the component uses 4, tighten the query)
- [ ] Is the route protected by auth? (Every route that touches user data must verify the session)
- [ ] Is there input validation? (Every POST/PATCH must validate shape and types before touching the database)
- [ ] Are errors handled and returned with appropriate HTTP status codes? (Not everything should return 200)

---

## Step 7 — Rebuild and Compare

After all cleanup is done:

```bash
npm run build 2>&1 | tee build-post-audit.txt

# Compare
diff build-baseline.txt build-post-audit.txt
```

Record the before/after numbers. A successful audit typically achieves:
- 20–40% reduction in First Load JS
- Elimination of "Large Page" warnings
- 10–30% faster cold-start database queries
- Cleaner TypeScript compilation with no warnings

---

## Things To Note Now (Before The Audit)

Start keeping a list of anything you know is superseded or potentially dead during development. Capture it here:

### Known superseded components (to investigate)
- `MessageDrawer.tsx` — deleted in the drawer unification PR (Phase 2.8), confirm it's gone
- Any "v1" or "old" component files created during the sequence editor redesign

### Known query patterns to investigate
- Supabase Vault token fetch on every Gmail send — check if this can be cached per session
- Campaign dashboard stats strip — confirm this is one query not five

### Known dependency questions
- Confirm the Anthropic SDK is not in the client bundle (server-only)
- Check whether any CSV library was added for the import feature

---

## Definition of Done

- [ ] Build output is smaller than baseline (at minimum, no regressions)
- [ ] `knip` output is clean (all flagged items investigated and either deleted or documented as false positives)
- [ ] `depcheck` output is clean
- [ ] No query over 100ms in the Supabase slow query log under normal load
- [ ] All API routes have at least one verified caller or are deleted
- [ ] `npm run build` completes with zero TypeScript errors and zero "Large Page" warnings
- [ ] Post-audit build output committed and noted in the project manifest
