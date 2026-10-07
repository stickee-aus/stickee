# Implementation Batch 1 — Critical Safety & Product Integrity

Status: implemented and verified locally (typecheck/lint/unit-tests/build/secret-scan). **Nothing was staged, committed, deployed, or applied to any database.**

> **Update — Database Verification Batch:** the claim below ("SQL migrations and SQL test files were authored and reviewed but not executed") is now **superseded**. A follow-up batch stood up a real local Supabase/Postgres instance (Docker was available after all), applied migrations 016/017, and ran all three test files against it — see `DATABASE_VERIFICATION_REPORT.md`. That pass found and fixed **a critical vulnerability in this batch's own wallet-lockdown migration**: `apply_daily_bonus` was callable by a fully unauthenticated request and could credit an arbitrary user's wallet with an arbitrary amount, because the migration only added a `GRANT` and never `REVOKE`d the Postgres default `PUBLIC` execute privilege. This was proven exploitable, then fixed and re-verified. Everything described as "not yet executed" in this document should be read as historical — the current, executed state is in `DATABASE_VERIFICATION_REPORT.md`.

Original status note (kept for history): SQL migrations and SQL test files were authored and reviewed but not executed at the time this document was first written — that environment had no Supabase CLI, no running Docker, and no local Postgres available.

## 1. Summary of changes

Closed four P0 findings from the earlier audit, plus secret hygiene:

1. **Wallet write protection** — a user could set their own points balance directly via PostgREST, bypassing the app entirely. Fixed at the RLS layer.
2. **Server-enforced market eligibility** — no market had a real, checked close time; expired/fake markets could be staked. Fixed with a single authoritative `is_market_open()` function, wired into the existing stake RPC.
3. **Market resolution and settlement** — the real points-staking system had no way to ever pay out. Added `resolve_market()`, admin-only, idempotent, atomic.
4. **MP scoring containment** — a "Stickee Score" shown on real MPs claimed to reflect their individual voting record; it didn't. Removed from every surface, function preserved behind a flag, methodology requirements documented for a legitimate future version.
5. **Secret containment** — `MVP_LAUNCH.md` (plaintext secrets in the working directory) is now gitignored, with a placeholder example file, a lightweight secret scanner, and a documented rotation requirement.

**A correction made mid-implementation, on your explicit instruction:** the first draft of this plan seeded the 5 real bill issues (housing-affordability, climate-safeguard, ndis-reform, tax-cuts, misinformation-bill) as live, stakeable markets with a 90-day window. You rejected that — their content/sourcing hasn't been verified — so **no market was seeded as live in this batch**. Every current market (bill, civic, election, mp-vote alike) is demo-only and non-stakeable. Staking, eligibility, and settlement are instead exercised against four dedicated, unmistakably-fake fixtures in `supabase/seed.sql` (never run in this session).

## 2. Files changed

### New files (created this batch)

| File | Purpose |
|---|---|
| `supabase/migrations/016_wallet_lockdown_and_bonus_fix.sql` | Drops the wallet-balance RLS hole, tightens the insert policy, adds a non-negative-balance constraint, locks down `wallet_positions`, adds `apply_daily_bonus()` |
| `supabase/migrations/017_market_lifecycle_and_settlement.sql` | Adds `opens_at`/`closes_at`/`is_test_fixture` to `issue_markets`/`issues`, extends lifecycle statuses, adds `is_market_open()`, extends `place_wallet_stake()`, adds resolution columns + `resolve_market()` |
| `supabase/seed.sql` | Four `[TEST FIXTURE]`-labeled markets, `is_test_fixture = true` — **not run** |
| `supabase/tests/002_wallet_lockdown.test.sql` | RLS/RPC tests for wallet lockdown — **authored, not executed** |
| `supabase/tests/003_market_eligibility.test.sql` | Eligibility boundary tests — **authored, not executed** |
| `supabase/tests/004_settlement.test.sql` | Settlement/idempotency tests — **authored, not executed** |
| `src/lib/__tests__/mp-score-copy.test.ts` | Vitest content-assertion tests — **executed, passing** |
| `scripts/secret-scan.mjs` | Dependency-free secret pattern scanner — **executed, passing** |
| `.github/workflows/ci.yml` | typecheck → lint (non-blocking, see §6) → test → build → secret-scan |
| `vitest.config.ts`, `eslint.config.mjs` | Test/lint tooling config (neither existed before this batch) |
| `src/app/admin/markets/page.tsx`, `actions.ts` | Minimal admin UI to resolve/void a market |
| `MVP_LAUNCH.example.md` | Placeholder copy of `MVP_LAUNCH.md`, no real values |
| `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` | What a legitimate future MP score needs |
| `IMPLEMENTATION_BATCH_1_REPORT.md` | This document |

### Pre-existing tracked files I modified (small, attributable diffs — `git diff` on each is entirely mine)

| File | Change |
|---|---|
| `.gitignore` | Added `MVP_LAUNCH.md`, `*.dump`, `credentials*.json` patterns |
| `package.json` | Added `lint`/`test`/`secret-scan` scripts; added `eslint`, `eslint-config-next`, `vitest` devDependencies |
| `src/components/MPVoteGrid.tsx` | Removed the "Accuracy" column, `AccuracyBar`, and the "votes with majority" tooltip claim |

### Pre-existing tracked files where my change is layered on top of your own already-uncommitted edits

`git diff` on these files reflects **both** your pre-existing uncommitted work (present before this session started — not something I can cleanly separate out via git, since it predates any commit) **and** my additions on top. Listed here is exactly what *I* changed, by direct recollection of my own edits (not by line-counting the diff, which mixes both):

- **`src/lib/mock-market-data.ts`** — I added: `'voided' | 'demo'` to the `MarketStatus` type; changed the bill-market `STATUS_MAP` so a mock issue's `active` status maps to client status `'demo'` instead of `'active'`; changed `status: 'active'` → `status: 'demo'` across the `civicMarkets`/`electionMarkets`/`mpVoteMarkets`/`urgentMarkets` arrays (17 occurrences); gated `mpExtended`'s `calculateStickeeScore()` calls behind `NEXT_PUBLIC_MP_SCORE_ENABLED`.
- **`src/app/mp/[id]/page.tsx`** — I removed the `ScoreBadge`/`calculateStickeeScore` import and call, the score badge render, and the "Stickee Score" explanation section; replaced it with a neutral "Individual voting analysis is being verified" panel.
- **`src/app/leaders/page.tsx`** — I removed the `mpExtended`/`mpExtendedIndex` import and derived const (now dead after the next change), the "Voting consistency" bar in `MPRow`, the `'voting'` sort key and its "Consistency" sort-control entry.

### Pre-existing **untracked** files (part of your in-progress scaffold, never committed) that I additionally edited

These didn't exist in git history at all before this session, so there's no `git diff` to show for them — they're new-to-git either way. What I specifically added to each:

- **`src/lib/agents/daily-bonus.ts`** — replaced the stale-balance read-then-write with a call to the new `apply_daily_bonus()` RPC; removed the reference to a `notifications.data` column that doesn't exist (was silently failing every bonus notification).
- **`src/hooks/usePredictionWallet.ts`** — added a non-authoritative `is_market_open` pre-check in `placeStake` for a clearer client error message.
- **`src/lib/issues-db.ts`**, **`src/lib/predictions-db.ts`** — added `.eq('is_test_fixture', false)` to every real public read query.
- **`src/components/MarketCard.tsx`** — added `isDemo`/`isVoided` badges distinct from "Resolved Yes/No"; changed the closed-state footer label.
- **`src/app/admin/layout.tsx`** — added a "Markets" nav entry pointing at the new admin page.

### Untouched by this batch

Everything else in your working tree — the ~48 other pre-existing modified files, the ~15 other pre-existing untracked directories, and the 11 audit documents from the prior audit session (now updated, see §8) — was left exactly as it was, except where explicitly listed above.

### `package-lock.json`

Regenerated by `npm install` as a direct consequence of adding `eslint`, `eslint-config-next`, and `vitest` as devDependencies (400 packages added, mostly transitive). This is expected and entirely attributable to this batch's dependency additions, not a separate concern.

## 3. Migrations added

Both are additive (no destructive `DROP TABLE`, no data deletion). Neither has been applied to any database.

- **`016_wallet_lockdown_and_bonus_fix.sql`** — drops one RLS policy, adds one, tightens one, adds one CHECK constraint, adds one function.
- **`017_market_lifecycle_and_settlement.sql`** — adds columns to two existing tables, extends two CHECK constraints, adds two functions, replaces `place_wallet_stake()` (same signature, one new check added at the top).

**Deliberately not built:** a `wallet_ledger` table and a `market_resolutions` table (both were in the first draft, both removed after the duplicate-detection pass you requested — see below). No new tables were created in this entire batch.

### Duplicate-detection pass (performed before writing any migration, per your instruction)

| Proposed change | Existing equivalent? | Action taken |
|---|---|---|
| Wallet ledger | Partial — `wallet_positions` already records amount/payout/status/created_at per stake | Extended `wallet_positions` (added `settled_at`, `'void'` status) instead of a new table |
| Market resolution record | No separate table existed, but `issue_markets` already models "one row per market" | Extended `issue_markets` with `resolved_by`/`resolved_at`/`resolution_source`/`outcome` instead of a new table |
| Settlement logic | Genuinely missing (confirmed by grep) | Created `resolve_market()` |
| `opens_at`/`closes_at` | Genuinely missing (`resolves_by` was free text) | Added as new columns |
| Lifecycle statuses (voided/cancelled) | Genuinely missing | Extended the existing CHECK constraint |
| Wallet credit function | `place_wallet_stake`'s atomic debit is the precedent pattern; `increment_feed_count` (migration 015) is a smaller precedent | Created `apply_daily_bonus()` (single-user) and settlement's inline bulk credit (different shape, not forced into one shared function) |
| Admin check for resolution | `public.is_app_admin()` already exists (migration 009) | Reused directly, not reinvented |
| Market eligibility helper | Genuinely missing (client `canStake` only checked balance) | Created `is_market_open()` |

Net result versus the first draft of the plan: **zero new tables** (was 2), **two new functions plus one bug-fix function** (was four new functions), **two migrations** (was three).

## 4. Security controls added

- `user_wallets`: the client-writable UPDATE policy is gone. INSERT is restricted to the default fresh-wallet shape. `balance >= 0` is now a database constraint, not just an assumption.
- `wallet_positions`: client access is read-only. All writes (stake, settlement, refund) go through SECURITY DEFINER functions owned by the table owner, which bypass RLS the same way `place_wallet_stake` already did.
- `resolve_market()` requires `public.is_app_admin()`; the admin action wrapping it (`resolveMarketAction`) independently calls `requireAdminUserId()` first — a non-admin cannot reach the RPC through the app, and cannot call the RPC directly either.
- `MVP_LAUNCH.md` can no longer be accidentally staged (`git check-ignore MVP_LAUNCH.md` confirms it's ignored).
- `scripts/secret-scan.mjs` runs in CI on every PR/push, scanning tracked files for credential-shaped patterns without ever printing a matched value.

## 5. Wallet behaviour — before and after

| | Before | After |
|---|---|---|
| Direct balance edit | Any authenticated user could `UPDATE user_wallets SET balance = ...` via PostgREST | Rejected — no policy permits it |
| Wallet insert | Could insert an arbitrary starting balance | Only the exact default (5000/0/0) is accepted |
| Negative balance | No constraint | `CHECK (balance >= 0)` |
| `wallet_positions` writes | Any authenticated user could insert/update their own rows (pre-set a "won" status, fabricate a payout) | Read-only for clients |
| Daily bonus | Computed `balance + bonusPts` from a stale batch read; a concurrent stake between the read and the write was silently overwritten | Atomic `balance = balance + p_amount` inside `apply_daily_bonus()`, evaluated by Postgres at write time |
| Daily bonus notification | Referenced a `notifications.data` column that doesn't exist — every bonus notification silently failed | Fixed — the insert no longer references that column |

## 6. Market lifecycle — before and after

| | Before | After |
|---|---|---|
| Definition of "stakeable" | Client-side `market.status === 'active'` prop only | `is_market_open()`: real DB row required, `status = 'active'`, `opens_at` passed (if set), `closes_at` in the future |
| Expired markets | Stakeable indefinitely (no check existed) | Rejected server-side, at the RPC layer, regardless of what the client sends |
| Markets with no DB backing (all current civic/election/mp-vote markets, and — per your correction — all current bill markets too) | Stakeable, because nothing checked for a backing row at all | Rejected — `is_market_open()` returns false when no row exists |
| Lifecycle states | `active` / `resolved-yes` / `resolved-no` only | + `voided`, `cancelled`; "closed"/"awaiting resolution" are derived from `status = 'active' AND closes_at <= now()`, not stored separately |
| UI presentation | Live-looking Yes/No buttons on every market | "Demo — not tradeable" badge (distinct from "Resolved"/"Voided") on every market until it has real backing |

## 7. Settlement model

**Payout model — not invented, implemented faithfully from what already shipped:** `StakeModal.tsx` already computes `shares = (amount / price) × 100` at stake time and tells the user "if correct: +shares pts." `resolve_market()` pays `round(shares)` to winning positions, `0` to losing positions, and refunds the original `amount` (not shares) on a VOID.

| | Before | After |
|---|---|---|
| Resolution authority | Nothing resolves the points-staking system at all | `resolve_market()`, admin-only |
| Idempotency | N/A | An atomic conditional `UPDATE issue_markets ... WHERE status = 'active'` is the very first write — a second call on an already-resolved market matches zero rows and returns `already_resolved = true`, touching nothing else |
| Concurrent resolution | N/A | Serialized by Postgres's normal row locking on that same UPDATE |
| Partial failure | N/A | The whole function is one implicit transaction; any exception rolls back every write in it |
| Audit trail | N/A | `issue_markets.resolved_by/resolved_at/resolution_source/outcome`, populated once, never overwritten by a later call |
| Zero-stake market | N/A | Resolves cleanly, `positions_settled = 0` |

## 8. MP score handling

Removed from `src/app/mp/[id]/page.tsx` (the score badge and the "reflects how consistently this MP votes with the majority" claim), `src/components/MPVoteGrid.tsx` (the "Accuracy" column and "votes with majority X% of the time" tooltip), and `src/app/leaders/page.tsx` (the "Consistency" sort and its bar). `calculateStickeeScore()` itself and the `mpExtended`/`mpExtendedIndex` exports are preserved, not deleted, gated behind `NEXT_PUBLIC_MP_SCORE_ENABLED` (unset/false by default). `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` specifies what's needed before it's reintroduced. Genuinely sourced data — the TheyVoteForYou sync, the AEC live-election disclosure text — is untouched; a Vitest test asserts both the misleading copy's absence and the AEC disclosure's continued presence.

## 9. Commands run and results

| Command | Result |
|---|---|
| `npm install` | 400 packages added (vitest, eslint, eslint-config-next + transitives) |
| `node scripts/secret-scan.mjs` | **PASS** — 0 matches |
| `npx tsc --noEmit` | **PASS** — 0 errors |
| `npx vitest run` | **PASS** — 7/7 tests, 1 file |
| `npx eslint .` | **FAIL** — 65 errors, 35 warnings, **entirely pre-existing debt** (see below) |
| `npm run build` | **PASS** — 54 routes generated including the new `/admin/markets`, 0 errors |

### On the ESLint failure

This repo had **zero** ESLint installed before this batch. Running the real, unmodified `eslint-config-next` (`core-web-vitals` + `typescript`) for the first time surfaced 65 pre-existing errors (dominant rule: `react-hooks/set-state-in-effect`, 38 hits; `@typescript-eslint/no-explicit-any`, 14 hits) across files this batch never touched (`useApproval.ts`, `useBadges.ts`, `useStreak.ts`, `admin-auth.ts`, `supabase.ts`, and others). I verified this by running ESLint scoped to only the files this batch changed: the only hits are on lines that predate this batch (confirmed by direct recollection of my own edits, since several of these files also carry your own pre-existing uncommitted changes that `git diff` can't separate from mine — see §2). I did **not** fix this backlog — that would be exactly the "broad style cleanup" you told me to keep out of this batch. `.github/workflows/ci.yml`'s lint step is set to `continue-on-error: true` with a comment explaining why, so CI still surfaces the output without blocking every future PR on day-one debt. Recommend a dedicated lint-cleanup batch (see §12).

### SQL — now executed (see DATABASE_VERIFICATION_REPORT.md)

At the time this batch was originally written, `supabase/migrations/016_*.sql`, `017_*.sql`, `supabase/seed.sql`, and all three `supabase/tests/*.sql` files had been written and reviewed but never run, since that environment had no Supabase CLI, no Docker, and no local Postgres. **This is no longer the case.** A follow-up batch got Docker running locally, applied all 17 migrations from a clean database, ran all 26 test assertions (all passing), proved 4 concurrency scenarios safe against genuinely overlapping connections, and exercised the complete stake-to-settlement flow through the real Auth+PostgREST API. That pass also found and fixed a critical vulnerability in `apply_daily_bonus` that static review had missed (see the update note at the top of this document). Full detail: `DATABASE_VERIFICATION_REPORT.md`.

## 10. Migration deployment instructions

**Local/dev, using the Supabase CLI (recommended — sets up the `config.toml` this repo currently lacks):**
```bash
supabase init          # only if supabase/config.toml doesn't exist yet
supabase start          # spins up local Postgres + auth
supabase db reset       # applies every numbered migration in order, then supabase/seed.sql
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" -f supabase/tests/002_wallet_lockdown.test.sql
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" -f supabase/tests/003_market_eligibility.test.sql
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" -f supabase/tests/004_settlement.test.sql
```

**Staging/dev Supabase project (no local Postgres), migrations only — do not run seed.sql here unless this project is explicitly not production:**
```bash
supabase link --project-ref <your-dev-project-ref>
supabase db push
```

**Production:** apply `016` and `017` the same way you've applied migrations 001–015 (there's no CI/CD migration pipeline in this repo yet — see `PRODUCTION_BLOCKERS.md`/`IMPLEMENTATION_ROADMAP.md`). **Never run `supabase/seed.sql` against production** — it's test-fixture data only, and there is currently no `supabase/config.toml` in this repo to give the CLI's normal local-only seeding guarantee, so nothing stops a bare `psql` from running it anywhere. Setting up `config.toml` (or equivalent environment separation) is a recommended near-term follow-up, called out explicitly rather than assumed solved.

## 11. Rollback instructions

Both migrations are additive; rolling back means reversing the specific additions, not restoring a snapshot:

```sql
-- Rollback for 017 (run in reverse order to 016)
drop function if exists public.resolve_market(text, text, text);
drop function if exists public.is_market_open(text);
alter table issue_markets drop column if exists resolved_by, drop column if exists resolved_at, drop column if exists resolution_source, drop column if exists outcome;
alter table wallet_positions drop column if exists settled_at;
alter table wallet_positions drop constraint if exists wallet_positions_status_check;
alter table wallet_positions add constraint wallet_positions_status_check check (status in ('open','won','lost'));
alter table issue_markets drop constraint if exists issue_markets_status_check;
alter table issue_markets add constraint issue_markets_status_check check (status in ('active','resolved-yes','resolved-no'));
alter table issue_markets drop column if exists opens_at, drop column if exists closes_at;
alter table issues drop column if exists is_test_fixture;
alter table issue_markets drop column if exists is_test_fixture;
-- Restores the exact pre-migration place_wallet_stake body (copy from git history of 008_wallet_staking.sql if actually needed)

-- Rollback for 016
drop function if exists public.apply_daily_bonus(uuid, integer, date);
alter table wallet_positions drop policy if exists "Users can read own positions";
create policy "Users can manage own positions" on wallet_positions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table user_wallets drop constraint if exists user_wallets_balance_nonnegative;
drop policy if exists "Users can insert own default wallet" on user_wallets;
create policy "Users can insert own wallet" on user_wallets for insert with check (auth.uid() = user_id);
-- Re-adding "Users can update own wallet" would re-open the P0 hole this batch closed — do not do this as part of a rollback without a specific reason.
```

I have not run any of the above — it's provided for your reference, not executed.

## 12. Credentials requiring manual rotation

Unchanged from the audit: **`SYNC_SECRET`** and **`THEYVOTEFORYOU_API_KEY`** were both displayed in plaintext in `MVP_LAUNCH.md` in this working directory. Neither has ever entered git history (`git log --all -- MVP_LAUNCH.md` is empty), but they've been visible on disk and possibly elsewhere (e.g. pasted into a setup chat) during earlier setup. I have not rotated them — no safe mechanism exists that wouldn't require you to generate and paste in new values yourself. Recommend rotating both before any contractor gets repository access or before open-sourcing.

## 13. Unresolved risks (explicitly out of this batch's scope)

- **ESLint backlog** (65 pre-existing errors) — see §9.
- **No market has real, verified content/sourcing yet**, so nothing is actually stakeable in production today — this batch made that state *safe and honest* (clearly labeled, server-enforced) rather than resolving the underlying content gap, which was explicitly out of scope (see `DATA_AND_CONTENT_AUDIT.md` P0-5).
- **Admin read-only pages' defense-in-depth gap** (pages rely solely on the parent layout's admin check) — not touched, including the new `/admin/markets` page, which follows the same existing convention for consistency rather than introducing an inconsistent one-off fix.
- **`prediction-resolver.ts`'s civic_score TOCTOU risk** (System A, the free poll — separate from the wallet system this batch fixed) — untouched, was P2 in the original audit, not in this batch's named scope.
- **Leaderboard is still fully fake** (`LeaderboardGrid.tsx`, `mock-market-data.ts`'s static array) — not touched, not in this batch's scope.
- **No privacy policy/terms/consent flows verified** — unchanged from the original audit's "areas not fully verified."
- ~~`supabase/config.toml` doesn't exist~~ — **resolved by the Database Verification Batch** (see `DATABASE_VERIFICATION_REPORT.md`), though note that batch also had to enable a deprecated `auto_expose_new_tables` flag locally to get expected grant behavior — the real long-term fix (explicit `GRANT` statements in a migration) is still open.
- **New, from the Database Verification Batch**: `FeaturedMarketCard.tsx` independently renders Yes/No stake buttons with no status check at all, unlike `MarketCard.tsx` which this batch did fix — this is why a "demo" market can still visibly show working-looking stake buttons on the predictions page's featured slot. See `DATABASE_VERIFICATION_REPORT.md` §8 for the full Markets-page trace and follow-up list.
- **New, from the Database Verification Batch**: pre-existing migration `015_feed_rpc.sql`'s `increment_feed_count`/`decrement_feed_count` functions have the same missing-`REVOKE`-from-`PUBLIC` pattern this batch found and fixed in its own functions — confirmed callable by `anon` today, allowing arbitrary inflation/deflation of feed engagement counts. Not fixed (pre-existing file, out of scope), flagged for a near-term follow-up.

## 14. Recommended next batch

1. A dedicated ESLint cleanup PR (no functional changes, purely the `react-hooks/set-state-in-effect` and `no-explicit-any` backlog), so CI's lint step can drop `continue-on-error`.
2. ~~Stand up a dev Supabase project and run the SQL tests~~ — **done**, see `DATABASE_VERIFICATION_REPORT.md`. Next: fix the `increment_feed_count`/`decrement_feed_count` grant gap it found (migration 015), and add the same status guard to `FeaturedMarketCard.tsx` that `MarketCard.tsx` already has.
3. A product decision on real market content: what's the actual sourcing/verification process before a market (starting with the 5 real bill issues) gets a real `opens_at`/`closes_at` and stops being labeled "Demo — not tradeable."
4. Check whether the production Supabase project has the same "no table grants without explicit GRANT" default found locally (`DATABASE_VERIFICATION_REPORT.md` §5) — this cannot be checked without accessing production, which this session was not permitted to do.
