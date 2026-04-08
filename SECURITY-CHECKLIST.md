# Security Checklist — Pulse.

**Status:** Living document. Items should be ticked off before public launch and re-reviewed before any significant architectural change.
**Last updated:** April 2026

This document covers security for Pulse's specific stack: Next.js (Vercel), Supabase (PostgreSQL + RLS + Vault), Gmail OAuth, Stripe, and the Anthropic Claude API.

It is organised by layer. Each item has a priority: **P0** (must be done before launch), **P1** (should be done before launch), **P2** (important but can follow shortly after launch).

---

## Layer 1 — Authentication & Session Management

### Gmail OAuth

- [ ] **P0** Refresh tokens are stored in Supabase Vault, not in the `users` table or any other plain column
- [ ] **P0** OAuth state parameter is validated on callback to prevent CSRF during the OAuth flow
- [ ] **P0** The redirect URI is explicitly whitelisted — no open redirects accepted after auth callback
- [ ] **P0** If a user revokes access from Google's account page, Pulse detects the invalid token on next use and prompts re-authentication rather than silently failing
- [ ] **P1** Refresh tokens are rotated when used (Google issues a new one on each refresh — confirm the new token is stored back to Vault)
- [ ] **P1** There is a way for a user to explicitly disconnect their Gmail account from within Pulse settings, which revokes the token from Google's side as well as deleting it from Vault

### Session Security (Next.js / Supabase Auth)

- [ ] **P0** Session cookies are `HttpOnly` and `Secure` — not accessible from JavaScript
- [ ] **P0** Session cookies use `SameSite=Strict` or `SameSite=Lax` to prevent cross-site request forgery
- [ ] **P0** Sessions have a defined expiry — Supabase JWT default is 1 hour with refresh token rotation; confirm this is configured and not overridden to "never expire"
- [ ] **P0** Logging out actually invalidates the server-side session, not just clears the client-side cookie
- [ ] **P1** There is no way to enumerate valid user IDs or email addresses from any public-facing endpoint

---

## Layer 2 — Database & Row-Level Security

### RLS Coverage

- [ ] **P0** Every table in the Supabase schema has RLS enabled — no table is accessible without a policy
- [ ] **P0** Every RLS policy uses `auth.uid()` to scope access — no policy uses a hardcoded ID or allows cross-user access
- [ ] **P0** The following tables have been explicitly verified with RLS policies: `users`, `campaigns`, `prospects`, `prospect_messages`, `sent_emails`, `sequences`, `sequence_steps`, `sequence_executions`, `onboarding_progress`
- [ ] **P0** Service role key is never exposed to the client — only used in server-side API routes
- [ ] **P1** RLS policies are tested with a second test account to verify tenant isolation (log in as User B and confirm you cannot read or write User A's data via the API)
- [ ] **P1** `anon` key only has access to public data — any endpoint that uses the anon key does not expose user data

### Supabase Vault

- [ ] **P0** Gmail refresh tokens are stored in Vault, not in any regular column
- [ ] **P0** No other secrets (API keys, webhook signing secrets) are stored in the database as plain text
- [ ] **P1** Vault access is only performed from server-side API routes — the client never calls Vault directly

### Input Validation & SQL Injection

- [ ] **P0** All user-supplied input is validated before being passed to a database query — no raw string concatenation in queries
- [ ] **P0** Supabase client is used via parameterised queries — confirm no use of `.rpc()` with unescaped user input
- [ ] **P0** CSV imports validate and sanitise column values before inserting — no formula injection possible in imported data (a cell that starts with `=` or `@` should be treated as text, not evaluated)
- [ ] **P1** Maximum lengths are enforced on text fields (campaign names, prospect names, message bodies) — both in the UI and at the API/database level

---

## Layer 3 — API Routes & Server-Side Logic

### Authentication on Every Route

- [ ] **P0** Every API route that reads or writes user data calls `createServerClient` and verifies the session before doing anything else
- [ ] **P0** There are no API routes that trust a `user_id` passed in the request body — the user ID must come from the verified session, not user input
- [ ] **P0** The send-email route is protected — a request cannot trigger an email send without a verified session and confirmed ownership of the campaign and prospect

### Rate Limiting

- [ ] **P0** The send-email API route is rate-limited — a user cannot fire hundreds of requests per minute (protect against accidental bulk send bugs and abuse)
- [ ] **P0** The AI draft generation route is rate-limited per user — a malicious user cannot run up API costs by hammering the generate endpoint
- [ ] **P1** Login attempts are rate-limited — Supabase has built-in rate limiting on auth endpoints; confirm it is not disabled
- [ ] **P1** The CSV import endpoint has a maximum file size limit — confirm it cannot accept arbitrarily large uploads
- [ ] **P2** Consider adding a global rate limit per IP on all API routes (Vercel Edge Config or a middleware layer)

### The Send Guard

- [ ] **P0** `send-guard.ts` (or equivalent) actively blocks real sends in development and preview deployments — not just a comment or console.log
- [ ] **P0** The guard checks `NODE_ENV` reliably — confirm it cannot be bypassed by setting a query parameter or request header
- [ ] **P0** Preview deployments on Vercel (non-production URLs) are also blocked from sending real emails — confirm `VERCEL_ENV !== 'production'` is also checked

### Webhook Security (Stripe)

- [ ] **P0** The Stripe webhook endpoint validates the `Stripe-Signature` header using the webhook signing secret before processing any event
- [ ] **P0** The webhook signing secret is stored as an environment variable, not hardcoded
- [ ] **P0** The webhook handler is idempotent — receiving the same event twice does not charge a user twice or grant duplicate access
- [ ] **P1** The webhook endpoint returns 200 quickly and processes the event asynchronously — slow processing causes Stripe to retry, which can cause duplicate processing

---

## Layer 4 — Secrets & Environment Variables

### What Lives Where

- [ ] **P0** No secrets appear in the Git repository — not in `.env`, not in comments, not in test files
- [ ] **P0** `.env.local` is in `.gitignore` and has never been committed
- [ ] **P0** Production secrets are only in Vercel environment variables, not in the codebase
- [ ] **P0** The Supabase service role key is only in server-side environment variables — it is never prefixed with `NEXT_PUBLIC_` and is never sent to the client
- [ ] **P0** The Anthropic API key is server-side only — never in the client bundle
- [ ] **P0** The Stripe secret key is server-side only — only the publishable key is in the client
- [ ] **P0** The Gmail OAuth client secret is server-side only

### Key Rotation Plan

- [ ] **P1** Document which keys need rotation and how to rotate them without downtime:
  - Supabase anon key — can be rotated in Supabase dashboard; update Vercel env var and redeploy
  - Supabase service role key — same process; this key is more sensitive
  - Gmail OAuth client secret — rotate in Google Cloud Console; update Vercel; existing refresh tokens remain valid
  - Stripe webhook signing secret — rotate in Stripe dashboard; brief window where old and new secrets must both be accepted
  - Anthropic API key — rotate in Anthropic console; update Vercel env var
- [ ] **P2** Set a calendar reminder to rotate all secrets at least annually

---

## Layer 5 — Frontend & Client-Side

### Content Security Policy

- [ ] **P1** A Content Security Policy (CSP) header is set on all responses — prevents XSS by restricting which scripts can execute
  - At minimum: `script-src 'self'`; no `unsafe-inline` for scripts
  - Set in `next.config.js` headers or Vercel edge config
- [ ] **P1** The CSP is tested with the browser's CSP evaluator — no violations in the console on normal usage

### XSS Prevention

- [ ] **P0** No use of `dangerouslySetInnerHTML` with user-supplied content — prospect names, company names, message bodies must never be rendered as raw HTML
- [ ] **P0** Email subject lines and body previews are rendered as text, not HTML
- [ ] **P1** Any markdown or rich text rendering uses a sanitised renderer — no raw HTML passthrough

### Sensitive Data in the Client

- [ ] **P0** Refresh tokens are never sent to the client — the API routes use them server-side only
- [ ] **P0** The Supabase service role key is never present in any client-side code or response
- [ ] **P1** Browser developer tools on the production app should not reveal any secret keys in network responses, localStorage, or sessionStorage

---

## Layer 6 — Email Sending & Deliverability

### Abuse Prevention

- [ ] **P0** A user can only send emails from their own connected Gmail account — no spoofing of a sender address
- [ ] **P0** The prospect's email address is validated before sending — no relay to arbitrary addresses
- [ ] **P0** There is a hard cap on emails per day per user at the API level, not just the UI level — prevents a bug or compromised account from sending thousands of emails
- [ ] **P1** DO NOT CONTACT status is enforced at the API level — a prospect marked DO NOT CONTACT cannot receive an email even if someone finds a way to trigger a send directly to the API
- [ ] **P1** Unsubscribe handling is considered — if a recipient replies "unsubscribe" or similar, is there a mechanism to flag them?

### Data Handling

- [ ] **P0** Email body content and subject lines are not logged in plain text in any server logs or database audit tables
- [ ] **P1** Consider whether sent email bodies need to be stored at all — if they're in Gmail already, storing them in Supabase doubles the data footprint and the risk surface

---

## Layer 7 — Infrastructure & Deployment

### Vercel Configuration

- [ ] **P0** Preview deployments are not publicly accessible — either they require Vercel authentication, or they are disabled entirely for this project
- [ ] **P1** Production deployment requires a manual approval step or at least a successful test run — no automatic deploy directly from `git push main`

### Dependency Security

- [ ] **P1** Run `npm audit` before launch — fix any high or critical severity vulnerabilities
- [ ] **P2** Set up Dependabot or Renovate to alert when dependencies have known vulnerabilities
- [ ] **P2** Lock dependency versions in `package.json` with exact versions (no `^` or `~`) for production stability

### Error Handling & Logging

- [ ] **P0** Error messages shown to users never include stack traces, database errors, or internal system details
- [ ] **P1** Server-side errors are logged to a service (Vercel logs, Sentry, or similar) so failures are visible without exposing them to users
- [ ] **P1** Failed authentication attempts are logged — useful for detecting brute force or credential stuffing

---

## Layer 8 — User Data & Privacy (GDPR / UK GDPR)

### Data Minimisation

- [ ] **P1** The only data stored about a prospect is what is necessary for outreach — no scraping or storing data beyond name, company, role, email, LinkedIn URL, and notes
- [ ] **P1** Sent email bodies — consider whether these need to be stored in Supabase at all, or whether the Gmail thread is the source of truth

### User Rights

- [ ] **P1** A user can delete their account and have all associated data removed — campaigns, prospects, messages, sent emails, onboarding progress
- [ ] **P1** Account deletion also revokes the Gmail OAuth token from Google's side (not just deletes it from Vault)
- [ ] **P2** A user can export their data in a machine-readable format (CSV at minimum) — this is a legal requirement under UK GDPR

### Privacy Policy

- [ ] **P0** A privacy policy exists and is linked from the marketing site and the app footer before launch
- [ ] **P0** The privacy policy accurately describes what data is collected, why, and how long it is retained
- [ ] **P1** The privacy policy covers the use of Claude API — specifically that prospect data may be sent to Anthropic for draft generation (check Anthropic's data processing terms)

---

## Pre-Launch Security Review

Before going public, run through this condensed checklist:

- [ ] All P0 items above are ticked
- [ ] `npm audit` shows no high/critical vulnerabilities
- [ ] Tested with two separate accounts — User B cannot access User A's data
- [ ] Send guard confirmed active on all non-production environments
- [ ] Stripe webhook signature validation confirmed working (test with Stripe CLI)
- [ ] No secrets in Git history (run `git log --all -p | grep -E "sk_|ghp_|key_"` — should return nothing for actual secrets)
- [ ] Supabase RLS verified for every table via the Supabase table editor (RLS On badge visible)
- [ ] Privacy policy live and linked
- [ ] Error states do not expose internal details

---

## Post-Launch (First 30 Days)

- [ ] Monitor Vercel function logs for unexpected errors or unusual traffic patterns
- [ ] Check Supabase slow query log for any queries degrading under real load
- [ ] Review Stripe dashboard for any failed payment webhooks or disputes
- [ ] Check Gmail API quota usage — confirm no user is hitting the per-user send limit
- [ ] Confirm Anthropic API spend is within expected range (no runaway generation)
