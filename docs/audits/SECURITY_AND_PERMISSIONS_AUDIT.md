# Stickee — Security & Permissions Audit

Read-only. No secret values are reproduced anywhere in this document — only variable names and file locations.

## Summary verdict

Application-layer authorization is **better than the average early-stage project** — every admin mutation and every cron/agent endpoint is independently, server-side gated, with no demonstrated bypass. The real exposure in this audit is at the **database permission layer** (a wallet table that can be written to directly by any authenticated user via PostgREST) and **secret hygiene** (a plaintext-secrets file sitting in the working directory). Both are fixable quickly; neither has been exploited since there are no real users yet.

## Findings

### P0 — `user_wallets` can be updated directly by its owner via PostgREST/Supabase client, bypassing the app entirely `[RESOLVED — Implementation Batch 1]`
**Resolution implemented:** migration `016_wallet_lockdown_and_bonus_fix.sql` drops the client UPDATE policy entirely and tightens the INSERT policy to only accept the exact default wallet shape (`balance = 5000, total_earned = 0, total_staked = 0`). `wallet_positions`'s equivalent `for all` policy was also replaced with `select`-only, closing the same exploit shape on that table (not separately called out below, but the same class of finding). A `CHECK (balance >= 0)` constraint was added as defense in depth. See `IMPLEMENTATION_BATCH_1_REPORT.md` §4–5 for the full before/after and `supabase/tests/002_wallet_lockdown.test.sql` for the (authored, not yet executed) regression tests. Original finding text below, left for context:

**File:** DB migration `006_engagement.sql` (RLS policy on `user_wallets`, UPDATE using `auth.uid() = user_id`, no `WITH CHECK`, no column-level `REVOKE`).
**Evidence:** The policy restricts *which row* a user can update but not *which columns or values*. Postgres uses the `USING` clause as the implicit `WITH CHECK` when none is supplied. The application itself never issues a direct client-side wallet update — all real staking goes through the `place_wallet_stake` SECURITY DEFINER RPC — but that's a matter of app discipline, not a database guarantee.
**Consequence:** Any authenticated user, using the Supabase JS client directly in their browser console (or any HTTP client with their session token), can `PATCH` their own `user_wallets` row and set `balance` to an arbitrary value. This is a direct path to unlimited virtual points.
**Recommendation:** Remove the client UPDATE policy for `user_wallets` entirely (route all mutation through the existing SECURITY DEFINER RPCs), or replace it with a `WITH CHECK` that pins every financial column to its `OLD` value and only allows non-financial columns (if any) to change.

### P0 — `MVP_LAUNCH.md` contains plaintext live secret values in the working directory `[PARTIALLY RESOLVED — Implementation Batch 1]`
**Resolution implemented:** `MVP_LAUNCH.md` is now explicitly listed in `.gitignore` (confirmed via `git check-ignore MVP_LAUNCH.md`), so it can no longer be accidentally committed via `git add -A`. A placeholder `MVP_LAUNCH.example.md` was added with no real values, and `scripts/secret-scan.mjs` now runs in CI to catch any tracked file matching credential-shaped patterns. **Still outstanding, not done by this batch:** `SYNC_SECRET` and `THEYVOTEFORYOU_API_KEY` have not been rotated — no safe mechanism exists to do that without you generating and supplying new values yourself. Treat this as a manual action item, tracked in `IMPLEMENTATION_BATCH_1_REPORT.md` §12. Original finding text below, left for context:

**File:** `MVP_LAUNCH.md` (repo root, currently untracked by git).
**Evidence:** Contains the actual value of `SYNC_SECRET`, the actual value of `THEYVOTEFORYOU_API_KEY`, and the live Supabase project URL, written in plain text as setup instructions. Confirmed via `git log --all -- MVP_LAUNCH.md` and `git ls-files` that this file has **never been committed** and is not currently tracked — so it is not in git history today. It is also **not** covered by an explicit `.gitignore` rule (the `.gitignore` only excludes `.env*`), so a routine `git add -A` / `git add .` would commit it permanently, including to any future public/open-source history.
**Consequence:** If committed even once, these values are effectively permanent (git history is hard to fully scrub, especially once pushed/forked). `SYNC_SECRET` gates every sync/agent cron endpoint; `THEYVOTEFORYOU_API_KEY` is a third-party credential.
**Recommendation:** Add `MVP_LAUNCH.md` to `.gitignore` immediately, move the real values out of it into a local-only, never-committed notes file (or a password manager), and rotate `SYNC_SECRET` and the TheyVoteForYou key as a precaution before any open-sourcing or contractor handoff, since they've already been displayed in plaintext in this working directory and may have been shared elsewhere (e.g. pasted into a chat) during setup.

### P1 — Admin read-only pages don't independently re-verify admin status; they rely solely on the parent layout
**Files:** `src/app/admin/page.tsx`, `src/app/admin/activity/page.tsx`, `src/app/admin/analytics/page.tsx`, `src/app/admin/users/page.tsx`, `src/app/admin/agents/[id]/page.tsx` (data-fetch portion).
**Evidence:** `src/app/admin/layout.tsx` correctly calls `getAdminUser()` and renders a "sign in required"/"admin access required" panel instead of `{children}` on failure. But the listed child pages perform their own Supabase **service-role** reads with no independent `requireAdminUserId()`/`getAdminUser()`/`isAppAdmin()` call (confirmed via grep — zero matches in these files). Only the embedded mutating server actions (e.g. `updateReportAction`, `runAgentDetailAction`) re-check admin status; the page-level data fetch does not. Only `src/app/admin/agents/page.tsx` independently re-checks.
**Consequence:** Single point of failure — if the layout's check is ever bypassed, weakened, or if a future Next.js App Router rendering change causes child Server Component data-fetching to execute independent of the parent's returned JSX (a documented subtlety worth verifying against the exact Next 16 behavior in use here), these pages' service-role queries would run without a second gate. No exploit is demonstrated today; this is a defense-in-depth gap.
**Recommendation:** Add an explicit `requireAdminUserId()`/`getAdminUser()` call at the top of every admin page component's data-fetching function, not only in the layout.

### P2 — `proxy.ts` (the Next.js 16 middleware replacement) performs no route-level authorization
**File:** `proxy.ts` (repo root).
**Evidence:** Full read confirms it exempts three specific paths, then unconditionally calls `supabase.auth.getUser()` purely to refresh the session cookie, and returns `NextResponse.next()`. No redirect logic, no protected-path matcher, no admin check.
**Consequence:** Not an active vulnerability today (every route that needs protection currently implements its own check), but there is no architectural backstop — a new route shipped without its own auth check is open by default, and nothing would catch that in CI (there is no CI).
**Recommendation:** Either accept this as a deliberate per-route model and add a lint rule / code-review checklist item enforcing "every route handler must call the auth helper," or centralize a protected-path list in `proxy.ts` as a second layer.

### P2 — `supabase-admin.ts` (the service-role client factory) lacks the `server-only` import guard
**File:** `src/lib/supabase-admin.ts`.
**Evidence:** Constructs the service-role Supabase client but does not `import 'server-only'` (unlike `admin-auth.ts` and `admin/_lib/guard.ts`, which do). Every current call site is server-side (confirmed via grep — no `'use client'` file references it), so there is no active leak.
**Recommendation:** Add `import 'server-only'` directly to this file as defense-in-depth against a future accidental client import, which would otherwise only be caught if the importing file also lacked the guard.

### P3 — Anonymous bill-pressure endpoint trusts a client-supplied session identifier
**File:** `src/app/api/bills/[billId]/pressure/route.ts`.
**Evidence:** For unauthenticated submissions, `session_id` is taken verbatim from the request body and used as the upsert conflict key (`onConflict: 'bill_id,session_id'`).
**Consequence:** Any client can supply an arbitrary/guessed session ID to overwrite another anonymous visitor's recorded stance on a bill. No PII or points are at risk — worst case is stance-count griefing on a public aggregate.
**Recommendation:** Generate/verify the session identifier server-side (e.g., a signed cookie) rather than trusting the request body.

## Positive controls confirmed (no action needed)

- **Cron/agent endpoints are properly secret-gated.** `/api/sync/members`, `/api/sync/divisions`, and `/api/agents/[id]` all require `x-sync-secret` matching `SYNC_SECRET` or `Authorization: Bearer <CRON_SECRET>` before doing privileged work. The only unauthenticated path is a side-effect-free liveness probe.
- **No user-facing endpoint mutates `civic_score` or `user_wallets.balance` directly** — those are only reachable through the secret-gated agent runner.
- **Every admin mutation server action is individually gated** (`banUserAction`, `unbanUserAction`, `promoteToAdminAction`, `demoteAdminAction`, `deleteUserAction`, etc.) via `requireAdminUserId()`, which throws on failure. Self-demotion and self-deletion are explicitly blocked.
- **Donations webhook uses real HMAC signature verification** with `timingSafeEqual` (not naive string comparison), and checkout amounts are server-clamped ($1–$5,000 AUD), not trusted from the client total.
- **Auth flows use session-derived identity throughout** — every checked route calls `supabase.auth.getUser()` server-side and uses the verified `user.id`, never a client-supplied user id or email.
- **No service-role key leakage into client-bundled code** — `src/lib/supabase.ts` (the browser client) only uses `NEXT_PUBLIC_*` vars; a full grep found zero `'use client'` files referencing `SUPABASE_SERVICE_ROLE_KEY` or the admin client factory.
- **Client-side `isAdmin` flag is cosmetic, not security-critical** — `useAuthStatus.ts` fetches it from `/api/auth/status`, which itself calls the real server-side `isAppAdmin()`; the flag only conditionally renders a nav link.
- **RLS is enabled on essentially every user-data table** (`user_wallets`, `wallet_positions`, `user_streaks`, `comments`, `notifications`, `user_profiles`, `feed_reactions`, `user_follows`, `push_subscriptions`, `onboarding_events`, `content_reports`, `donation_records`, `agents`, `agent_runs`, `feed_posts`, `feed_impressions`) — the one significant gap is the `user_wallets` UPDATE policy above.
- **No env file has ever been committed to git**, and secrets are correctly absent from `.env.local`'s referenced-but-unset vars (`CRON_SECRET`, admin email allowlists, Stripe keys) — each is safely handled when absent in local dev.

## Direct answers to the audit's authorization test questions

| Question | Answer | Basis |
|---|---|---|
| Can an unauthenticated user reach protected APIs? | No | Every mutating/privileged route checked requires a session or a secret header |
| Can a normal user reach admin functions? | No demonstrated bypass, but read-path defense-in-depth is thin (P1 above) | Layout + per-action checks |
| Can a user read another user's private data? | Not via the app; **yes, at the DB layer for their own wallet balance value** (P0) | RLS review |
| Can a user alter another user's predictions? | No path found | — |
| Can a user change their own role? | No — self-promotion not exposed; only admin-gated actions can change roles | `admin/users/actions.ts` |
| Can a user resolve a market? | No user-facing path exists at all (resolution for System B doesn't exist; System A resolution is agent-only, secret-gated) | See Market Engine Audit |
| Can a user directly alter their own points? | **Yes, via direct PostgREST UPDATE on `user_wallets`** (P0) | RLS review |
| Is admin-checking UI-only anywhere? | No — every case checked has a real server-side check backing it | — |
| Is the service-role key ever reachable from client code? | No | grep across `src/` |
