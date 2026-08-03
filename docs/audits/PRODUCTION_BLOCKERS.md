# Stickee — Production Blockers

Consolidated from `SECURITY_AND_PERMISSIONS_AUDIT.md`, `MARKET_ENGINE_AUDIT.md`, `DATA_AND_CONTENT_AUDIT.md`, and `TEST_AND_VERIFICATION_REPORT.md`. Grouped P0 (must fix before any public signup) → P3 (cleanup/polish).

> **Update:** P0-1, P0-2, P0-3, and P0-4 were addressed in Implementation Batch 1 — see `IMPLEMENTATION_BATCH_1_REPORT.md` for the full before/after, migrations, and test coverage. Each is marked `[RESOLVED — Batch 1]` below with a short note; the original finding text is left intact underneath for context. P0-5, P0-6, and P0-7, and all P1/P2/P3 items, remain open.
>
> **Second update (Database Verification Batch):** the Batch 1 fixes above were then actually executed against a real Postgres instance for the first time — see `DATABASE_VERIFICATION_REPORT.md`. That pass found **a new P0** (below) in Batch 1's own migration, now fixed and re-verified, plus two new lower-severity findings added to P1/P2 below.

---

## P0 — Critical (blocks public launch)

### P0-1. Real points-staking market system has no resolution/payout path `[RESOLVED — Batch 1]`
**Resolution:** `resolve_market()` (migration `017_market_lifecycle_and_settlement.sql`) now settles YES/NO/VOID atomically and idempotently, admin-gated via `is_app_admin()`. Payout model implements what `StakeModal.tsx` already promised (`round(shares)` for winners, refund of `amount` for VOID). Authored SQL tests exist in `supabase/tests/004_settlement.test.sql` but have not yet been run against a real Postgres — see Batch 1 report §13 for why and §14 for the recommended follow-up.
- **Affected files:** `supabase/migrations/008_wallet_staking.sql`, `src/lib/agents/prediction-resolver.ts`, `src/app/api/agents/[id]/route.ts`, `wallet_positions` table
- **User impact:** Users can stake virtual points and can never win them back — the product's core promise ("prediction market") is unfulfilled for the system that actually moves points.
- **Technical impact:** `wallet_positions.status` can only ever be `open`; `wallet_positions.payout` is never written by any code.
- **Evidence:** Full grep of `src/` and all migrations for any code writing `wallet_positions.status`/`payout` or crediting `user_wallets.balance` from a resolution event — zero matches.
- **Recommended fix:** Build a settlement job (mirroring the existing atomic-debit pattern in `place_wallet_stake`) that resolves `issue_markets`, transitions `wallet_positions.status`, and credits payouts atomically with an idempotency key.
- **Complexity:** Large.
- **Dependencies:** Requires deciding the target lifecycle (see Market Engine Audit §recommended lifecycle) first.
- **Blocks public launch:** Yes.

### P0-2. Expired/seeded markets accept stakes with no server-side status or time check `[RESOLVED — Batch 1]`
**Resolution:** `is_market_open()` (migration `017`) is now the single authoritative eligibility check, wired into `place_wallet_stake()`. Any market_id without a real, in-window `issue_markets` row — which today is every market, including the previously-flagged stale election markets — is rejected server-side. UI now shows "Demo — not tradeable" instead of live Yes/No buttons on every current market. Per an explicit correction during implementation, no market was seeded as genuinely live in this batch (see Batch 1 report §1) — this closes the *server-side enforcement* gap; the *content readiness* question (P0-5/P0-7) remains open.

- **Affected files:** `supabase/migrations/008_wallet_staking.sql` (`place_wallet_stake` RPC), `src/lib/mock-market-data.ts`, `src/components/MarketCard.tsx`
- **User impact:** Users can stake points on markets whose real-world outcome has been known for over a year.
- **Technical impact:** The RPC validates only direction, amount, price bounds, and balance — never `issue_markets.status` or a closing timestamp; the client-side "resolved" check is a prop-only UI gate.
- **Evidence:** Seeded election markets in `mock-market-data.ts` with `resolvesBy` values of `'Jan 2025'`/`'May 2025'` (audit date 2026-08-03) and `status: 'active'`.
- **Recommended fix:** Add a server-side check in the staking RPC (or a wrapping API layer) that rejects stakes when `now() > closing time` or `status != 'active'`; convert `resolves_by` to `timestamptz` first (see P1-3).
- **Complexity:** Medium.
- **Dependencies:** P1-3 (timestamp fix).
- **Blocks public launch:** Yes.

### P0-3. `user_wallets` can be updated directly by its owner via PostgREST, bypassing the app `[RESOLVED — Batch 1]`
**Resolution:** the client UPDATE policy is dropped entirely (migration `016_wallet_lockdown_and_bonus_fix.sql`); INSERT is restricted to the exact default wallet shape; `balance >= 0` is now a DB constraint. `wallet_positions` client write access was also removed as part of the same migration (same exploit shape, not separately tracked in the original audit but closed alongside this fix).

- **Affected files:** DB migration `006_engagement.sql` (RLS policy on `user_wallets`)
- **User impact:** Any authenticated user can set their own point balance to an arbitrary value using the Supabase client directly, without touching the app's UI at all.
- **Technical impact:** UPDATE policy's `USING (auth.uid() = user_id)` has no matching `WITH CHECK` and no column-level restriction.
- **Evidence:** Policy definition in `006_engagement.sql`; app itself never issues a direct wallet UPDATE (goes through `place_wallet_stake` SECURITY DEFINER RPC), confirming the hole is at the DB layer, not currently exploited by the app's own code.
- **Recommended fix:** Drop the client UPDATE policy for `user_wallets`, or add a `WITH CHECK` pinning all financial columns to `OLD` values.
- **Complexity:** Small.
- **Dependencies:** None.
- **Blocks public launch:** Yes.

### P0-4. "Stickee Score" on real MPs is fabricated but described as vote-based `[RESOLVED — Batch 1]`
**Resolution:** removed from `mp/[id]/page.tsx`, `MPVoteGrid.tsx`, and `leaders/page.tsx` — every surface named in the original finding. Replaced with a neutral "Individual voting analysis is being verified" message. The scoring function is preserved (not deleted) behind `NEXT_PUBLIC_MP_SCORE_ENABLED` for a future legitimate version; requirements for that version are documented in `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md`. A Vitest test guards against the misleading copy silently returning.

- **Affected files:** `src/lib/mock-data.ts` (`calculateStickeeScore`, `PARTY_VOTE_MAP`), `src/components/LeaderProfileDetail.tsx`
- **User impact:** A named, real Australian MP's public "score" has no relationship to their actual voting record while the UI explicitly claims it reflects "how consistently this MP votes with the majority."
- **Technical impact:** Score is generated from a static party→vote map applied uniformly to all MPs of a party across ~6 fictional mock issues; real vote data (`member_votes`, synced via TheyVoteForYou) is never consulted for this score.
- **Evidence:** `calculateStickeeScore()`/`PARTY_VOTE_MAP` in `mock-data.ts`; methodology claim text in `LeaderProfileDetail.tsx`.
- **Recommended fix:** Wire the score to real `member_votes` data (already synced and available), or remove/relabel the methodology claim as illustrative until it is.
- **Complexity:** Medium.
- **Dependencies:** None — the real vote data already exists in the DB.
- **Blocks public launch:** Yes — this is a reputational/accuracy risk involving real, named public figures.

### P0-5. Hardcoded political claims attributed to real parties with no citation
- **Affected files:** `src/lib/mock-data.ts` (`whoSupports`/`whoOpposes`), `src/app/issue/[id]/page.tsx`
- **User impact:** Users read unsourced claims about real parties' positions on legislation as if they were factual reporting.
- **Technical impact:** No citation, no use of the existing `issues.source_url` column for this content.
- **Recommended fix:** Source every claim or explicitly label this content as illustrative/example until sourced.
- **Complexity:** Medium (content work, not just code).
- **Dependencies:** None.
- **Blocks public launch:** Yes.

### P0-6. Plaintext live secrets sitting in the repo working directory
- **Affected files:** `MVP_LAUNCH.md` (untracked)
- **User impact:** None yet (not a user-facing issue), but a real operational security risk.
- **Technical impact:** Contains the actual `SYNC_SECRET` value, the actual `THEYVOTEFORYOU_API_KEY` value, and the live Supabase project URL in plain text; not covered by `.gitignore`; one `git add -A` away from permanent git-history exposure.
- **Recommended fix:** Add to `.gitignore` now, move real values out of any committable file, rotate `SYNC_SECRET` and the TheyVoteForYou key as a precaution.
- **Complexity:** Small.
- **Dependencies:** None.
- **Blocks public launch:** Yes (must resolve before any contractor handoff or open-sourcing, not necessarily before a private beta).

### P0-7. Widespread mock/demo data presented as live content with no labeling
- **Affected files:** `src/app/page.tsx`, `/leaders`, `/leaders/[id]`, `/mp/[id]`, `/leaderboard`, `/impact`, `/decisions`, `/notifications`, `/profile`, `/u/[handle]`, and their backing `mock-*.ts` files
- **User impact:** A public visitor cannot tell which content is real and which is fabricated anywhere in the app.
- **Recommended fix:** See `DATA_AND_CONTENT_AUDIT.md` §7 — hard cutover to real data per page, or a consistent "illustrative data" labeling system, before public signups.
- **Complexity:** Large (spans most of the app's pages).
- **Dependencies:** Real data pipelines for several of these don't exist yet (e.g., real government-decisions content).
- **Blocks public launch:** Yes.

### P0-8. `apply_daily_bonus` (introduced by Batch 1's own wallet-lockdown migration) was callable by a fully unauthenticated request `[FOUND AND RESOLVED — Database Verification Batch]`
- **Affected files:** `supabase/migrations/016_wallet_lockdown_and_bonus_fix.sql`
- **User impact:** none realized — found before any deployment, via real-database verification, not in production.
- **Technical impact:** Postgres grants `EXECUTE` to `PUBLIC` by default unless explicitly revoked. The original migration only added `GRANT ... TO service_role` and never revoked the implicit `PUBLIC` grant; combined with a flawed internal check, this meant any anonymous `anon`-role request could call `apply_daily_bonus(<any user id>, <any amount>, today)` directly and credit an arbitrary wallet with an arbitrary amount.
- **Evidence:** Proven with a live exploit against a real Postgres instance — a wallet went from balance 5000 to 1,000,004,999 via a single unauthenticated call. See `DATABASE_VERIFICATION_REPORT.md` §4.2 for the full reproduction and fix (explicit `REVOKE`, plus a corrected `auth.role() = 'service_role'` internal check).
- **Recommended fix:** Already applied and re-verified — included here as a permanent record given the severity, not as an open item.
- **Complexity:** Small (already done).
- **Dependencies:** None.
- **Blocks public launch:** No longer — resolved.

---

## P1 — High

| Issue | Files | Impact | Fix | Complexity |
|---|---|---|---|---|
| Bot-authored feed posts unlabeled; `source_agent_id` captured then dropped before UI | `src/lib/feed/ranker.ts`, `FeedPost.tsx` | Users can't distinguish automated posts from human/editorial content | Restore field to client shape, add "automated" badge | Small |
| Leaderboard entirely fake, presented as live | `LeaderboardGrid.tsx`, `leaderboard/page.tsx`, `mock-market-data.ts` | Misleads users about competitive standing | Wire to real wallet/prediction data, or remove until real | Medium |
| Daily bonus lost-update race on wallet balance | `src/lib/agents/daily-bonus.ts` | Concurrent stake could be silently overwritten by a stale-balance bonus write | Re-read balance at UPDATE time or use an atomic increment | Small |
| No transaction ledger for wallet balance | `user_wallets`, `wallet_positions` | Balance mutations from multiple code paths are unauditable | Add append-only `wallet_ledger` table | Medium |
| `migrations_bundle.sql` stale/broken (missing migration 013 tables) | `supabase/migrations_bundle.sql` | Fresh-DB bootstrap via the bundle fails | Regenerate bundle or remove it | Small |
| `issue_markets.resolves_by` stored as free text, not `timestamptz` | `007_issues_and_markets.sql` | No reliable, comparable close time exists | Migrate column to `timestamptz` | Medium |
| No voided/cancelled/disputed market states | schema + app | No way to safely retire a bad market or refund stakes | Add states + refund path | Medium |
| `/profile` hardcodes `DEMO_USER.isLoggedIn = true` | `src/app/profile/page.tsx` | Real logged-out state appears to be dead code | Wire to real session state | Small–Medium |
| civic_score double-award TOCTOU risk | `src/lib/agents/prediction-resolver.ts` | Status corrections could double-award points | Add a dedicated settlement/ledger check, not existence-of-post check | Medium |
| Admin read-only pages rely solely on parent layout for admin check | `admin/page.tsx`, `admin/activity`, `admin/analytics`, `admin/users`, `admin/agents/[id]` | Defense-in-depth gap (no demonstrated bypass) | Add explicit check to each page | Small |
| `increment_feed_count`/`decrement_feed_count` callable by `anon` (missing `REVOKE FROM PUBLIC`) — **new, found by Database Verification Batch** | `supabase/migrations/015_feed_rpc.sql` | Any unauthenticated user can arbitrarily inflate/deflate hearts/fires/flags/comment_count/share_count on any feed post — proven via `has_function_privilege('anon', ...)` = true against a real Postgres instance | Add `revoke all on function ... from public, anon, authenticated;` before the existing `grant ... to service_role`, matching the fix applied to `apply_daily_bonus` in migration 016 | Small |
| `FeaturedMarketCard.tsx` shows working-looking Yes/No stake buttons with no status check — **new, found by Database Verification Batch** | `src/components/FeaturedMarketCard.tsx`, `src/components/PredictionsPageClient.tsx` | A "demo"-status market (all current markets) can still visually appear stakeable in the predictions page's featured slot, even though the server correctly rejects the resulting stake — misleading UI, inconsistent with `MarketCard.tsx`'s handling of the same status | Add the same `isDemo`/`resolved` guard `MarketCard.tsx` already has | Small |

---

## P2 — Medium

| Issue | Files | Impact | Fix | Complexity |
|---|---|---|---|---|
| No automated tests, no CI, no ESLint config | whole repo | No regression safety net for outsourced or future work | Add Vitest/Playwright + GitHub Actions + ESLint | Medium |
| No error monitoring/logging | whole repo | Cron/agent failures fail silently | Add Sentry or Vercel-native error tracking | Small |
| `mp-scorecard` agent's "public sentiment" proxy is self-admittedly arbitrary; write path likely broken (name-match join) | `src/lib/agents/mp-scorecard.ts` | Feature is effectively inert in production | Fix join or redesign scoring input | Medium |
| Live chamber view decorates real MPs with a mock score hardcoded to 0 | `HouseChamber.tsx`, `SenateView.tsx`, `mock-data.ts` | Looks like live data, always zero | Remove or wire to real score once P0-4 is fixed | Small |
| Anonymous bill-pressure endpoint trusts client-supplied session ID | `api/bills/[billId]/pressure/route.ts` | Low-impact griefing of anonymous stance counts | Server-generate/verify session identifier | Small |
| `supabase-admin.ts` missing `server-only` import guard | `src/lib/supabase-admin.ts` | Hardening gap, no active leak | Add `import 'server-only'` | Trivial |
| Inconsistent cascade-delete behavior (`bill_pressures` CASCADE vs `predictions` SET NULL) | migrations | Deleting an account destroys civic-history records inconsistently | Standardize on `SET NULL` + anonymization for public-interest records | Medium |
| Missing indexes (`wallet_positions.user_id/market_id`, `donation_records.stripe_payment_intent_id`) | migrations | Query performance at scale | Add indexes | Small |
| `pillar_metrics`/`pillar_scores`/`politician_pillar_ratings` schema entirely unused | migration 003 | Confusing duplicate scoring system, dormant while a worse one is live | Revive for real scoring (ties to P0-4) or remove | Medium |
| `/api/endorsements`, `/api/nominations` referenced in UI TODOs but don't exist | `EndorsementPanel.tsx`, `NominationModal.tsx` | Unclear if these features are wired to anything | Verify actual behavior before scoping contractor work here | Small (investigation first) |
| `/electorate-lookup` is a fake hash-based approximation, not real geography | `api/electorate-lookup/route.ts` | Electorate-personalized features are unreliable | Replace with a real geocoding/boundary lookup | Medium |
| `npm audit`: 15 vulnerabilities (9 high), mostly transitive | `package-lock.json` | Standard dependency hygiene risk | Review and patch; `sharp`'s fix requires `--force` and a Next.js version bump — review manually | Small |

---

## P3 — Low / Cleanup

| Issue | Files | Fix |
|---|---|---|
| No open-source governance files (LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY.md, issue/PR templates) | repo root, `.github/` | Add before any open-sourcing |
| README is default `create-next-app` boilerplate | `README.md` | Write real setup/ops docs |
| `src/app/feed/page.tsx.bak` leftover file | repo | Delete |
| `src/types/index.ts` stale vs. actual schema; no generated Supabase types | `src/types/index.ts` | Run `supabase gen types typescript` |
| `lucide-react` and `shadcn` CLI notably behind latest upstream versions | `package.json` | Routine dependency bump |
| Uncommitted `middleware.ts` → `proxy.ts` migration sitting in working tree | repo root | Commit deliberately once verified, don't leave as a diff |
