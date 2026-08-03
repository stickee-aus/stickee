# Database Verification Report

Scope: verify migrations 016/017, the authored SQL tests, and the full stake-to-settlement flow against a **real, local PostgreSQL instance** — not static analysis. Everything in this report was executed; nothing here is inferred. **The production Supabase project was never accessed, connected to, or modified.**

## 1. Environment setup performed

- No pre-existing `supabase/config.toml`, seed configuration, or generated types existed before this batch (confirmed by inspection before creating anything, per instructions).
- Docker Desktop was not running at the start of this session; `open -a Docker` successfully started it (daemon was up within ~10s).
- `npx supabase init` created `supabase/config.toml` and `supabase/.gitignore` — this **extends** the existing `supabase/` directory (migrations, seed.sql, tests all already existed from Implementation Batch 1); no parallel project structure was created.
- `npx supabase start` brought up the full local stack (Postgres 17.6, GoTrue/Auth, PostgREST, Realtime, Storage, Studio, etc.) in Docker.
- One local-only config change: `auto_expose_new_tables = true` was enabled in `supabase/config.toml` (see §5, finding 3) — this is a Supabase CLI local-dev setting, not a migration, not applied to any remote project.
- Everything in this section is local-machine-only. No production credentials were used or required at any point.

**Versions:**
- Docker: `29.6.2` (build `dfc4efb`)
- Supabase CLI: `2.111.0` (via `npx supabase`, not globally installed)
- PostgreSQL: `17.6` (the version the local stack provisions)
- Node: `v24.9.0`
- macOS: `26.5.2`

## 2. Migrations applied

All 17 migrations (`001_initial.sql` through `017_market_lifecycle_and_settlement.sql`) plus `supabase/seed.sql` were applied via `supabase db reset` (drops and recreates the local database, then applies every migration in order, then the seed file) — run **8 times** over the course of this verification, each time confirming a clean from-scratch apply after a fix.

**Result: clean on every run, from an empty database, after all fixes described in §4 were made.** Migrations 001–015 (pre-existing, not touched by this batch) applied without incident throughout.

**Idempotency (re-applying 016/017 on top of the already-migrated schema, not just from empty):** re-ran `016_wallet_lockdown_and_bonus_fix.sql` and `017_market_lifecycle_and_settlement.sql` directly via `psql -f` three times each against the fully-migrated database, after fixing the defect in §4 finding 1. Zero errors on any re-application — both migrations are now genuinely idempotent (`DROP ... IF EXISTS` / `ADD COLUMN IF NOT EXISTS` / `CREATE OR REPLACE FUNCTION` throughout).

## 3. SQL tests — individual results

All three authored test files were run against the real local Postgres instance, using genuine role-switching (`SET LOCAL ROLE authenticated/service_role` + `set_config('request.jwt.claims', ...)`, verified to match `auth.uid()`/`auth.role()`'s actual implementation by reading their real function bodies from the local instance — not guessed). Every assertion below was independently confirmed by inspecting the actual data change (or lack thereof), not merely "the script exited 0."

### `002_wallet_lockdown.test.sql` — 8/8 passed
| # | Assertion | Result |
|---|---|---|
| 1 | Direct `UPDATE user_wallets.balance` as the owning authenticated user affects 0 rows | **PASSED** (fixed — see §4.2) |
| 2 | Balance unchanged (5000) after the rejected update | **PASSED** |
| 3 | Direct `INSERT` into `wallet_positions` as a client is rejected (RLS violation, SQLSTATE 42501) | **PASSED** |
| 4 | Direct `UPDATE` of an existing `wallet_positions` row affects 0 rows | **PASSED** (fixed — see §4.2) |
| 5 | The position's `status`/`payout` are unchanged after the rejected update | **PASSED** (new assertion, added during this verification) |
| 6 | `balance >= 0` CHECK constraint rejects a direct negative-balance write | **PASSED** |
| 7 | `place_wallet_stake` succeeds for a valid stake, debits correctly | **PASSED** |
| 8 | `place_wallet_stake` rejects a stake exceeding balance | **PASSED** |

### `003_market_eligibility.test.sql` — 6/6 passed
| # | Assertion | Result |
|---|---|---|
| 1 | `is_market_open('test-market-open')` = true | **PASSED** |
| 2 | Stake accepted on the open fixture | **PASSED** |
| 3 | `is_market_open('test-market-expired')` = false | **PASSED** |
| 4 | `place_wallet_stake` rejects a stake on the expired fixture | **PASSED** |
| 5 | `place_wallet_stake` rejects a market_id with no backing `issue_markets` row (tested against the real `housing-affordability` id — proving every current real/mock market is non-stakeable) | **PASSED** |
| 6 | Boundary case: `closes_at <= now()` is treated as closed | **PASSED** |

### `004_settlement.test.sql` — 12/12 passed
| # | Assertion | Result |
|---|---|---|
| 1 | Non-admin `resolve_market` call rejected | **PASSED** |
| 2 | Admin YES resolution returns `settled=2, paid=200` | **PASSED** |
| 3 | Winner position: `status=won, payout=200, settled_at` stamped | **PASSED** |
| 4 | Loser position: `status=lost, payout=0, settled_at` stamped | **PASSED** |
| 5 | Winner balance = 5100, loser balance = 4900 | **PASSED** |
| 6 | `issue_markets` audit fields (`outcome`, `resolved_by`, `resolved_at`, `resolution_source`) stored correctly | **PASSED** |
| 7 | Duplicate resolution (same outcome) is a no-op, `already_resolved=true` | **PASSED** |
| 8 | No double payment on the duplicate call | **PASSED** |
| 9 | Duplicate resolution with a *different* outcome is also a no-op — rules can't change after close | **PASSED** |
| 10 | VOID refunds the stake `amount` (not shares) to the open position | **PASSED** |
| 11 | Balance net-neutral after a full VOID refund | **PASSED** |
| 12 | Zero-stake market resolves cleanly (`settled=0, paid=0`, no error); invalid outcome value raises and leaves `issue_markets` unchanged | **PASSED** |

**Total: 26/26 assertions passed** (8+6+12; the 002 file grew from 6 to 8 assertions during this verification — see §4).

No test was blocked or inconclusive. Every one produced a definitive pass/fail against real data.

## 4. Defects found and fixed

This is the substantive output of this batch — six real, distinct defects, none of which could have been found without executing against a real Postgres instance.

### 4.1 — Migration 016 was not idempotent (two `CREATE POLICY` statements missing `DROP POLICY IF EXISTS`)
Re-running `016_wallet_lockdown_and_bonus_fix.sql` against an already-migrated database failed with `policy "Users can insert own default wallet" for table "user_wallets" already exists`. **Fixed**: added `drop policy if exists` guards before both new policies, and switched the `balance >= 0` constraint to the drop-then-add idiom (Postgres has no `ADD CONSTRAINT IF NOT EXISTS`). Re-verified clean on 3 subsequent re-applications.

### 4.2 — CRITICAL: `apply_daily_bonus` was callable by a fully unauthenticated `anon` request, and could credit an arbitrary user's wallet with an arbitrary amount
**Severity: P0. This was a real, proven, exploitable vulnerability in a migration whose entire purpose was to lock the wallet down.**

Postgres grants `EXECUTE` on a new function to `PUBLIC` by default unless explicitly revoked. The original migration only added a `GRANT ... TO service_role` — it never revoked the implicit `PUBLIC` grant. Combined with an internal check (`if auth.uid() is not null then raise exception`) that was backwards — an anonymous PostgREST request also has no JWT `sub` claim, so `auth.uid()` is null for it too — this meant **any unauthenticated caller could invoke `apply_daily_bonus(<any user id>, <any amount>, today)` directly.**

Proven with a real exploit against a live wallet:
```
set role anon;
select apply_daily_bonus('11111111-...'::uuid, 999999999, current_date);
-- balance before: 5000  →  balance after: 1000004999
```

**Fixed in two steps:**
1. Added `revoke all on function ... from public, anon, authenticated;` before the `grant ... to service_role` — this is the actual security boundary.
2. Replaced the internal check. It went through two more wrong iterations before landing correctly:
   - v2 (`session_user <> 'service_role'`) was also wrong: `session_user` reflects who authenticated the *connection*, never changes with `SET ROLE` (which is how PostgREST actually switches per-request role against a shared connection role in production), so this check would reject even a genuine service-role call.
   - v3, the fix that shipped: `coalesce(auth.role(), '') <> 'service_role'`. `auth.role()` reads the `role` claim out of the JWT itself via the same `request.jwt.claims` mechanism `auth.uid()` already relies on throughout this codebase — unaffected by both `SET ROLE` and by `SECURITY DEFINER`'s owner-switching of `current_user`.

**Re-verified after the fix**, same exploit attempt: `ERROR: permission denied for function apply_daily_bonus`. Confirmed via `has_function_privilege()`: `anon`=false, `authenticated`=false, `service_role`=true.

### 4.3 — `place_wallet_stake` and `resolve_market` had the same missing-REVOKE pattern (lower severity — not independently exploitable, but the grant surface didn't match documented intent)
Both are `authenticated`-only by design, and their own internal `auth.uid() is null` checks already correctly reject unauthenticated callers — so this was not independently exploitable — but `has_function_privilege('anon', ...)` returned `true` for both before the fix, purely because of the same missing-REVOKE pattern as 4.2. **Fixed**: added explicit `revoke all on function ... from public, anon;` before each grant, so the actual privilege surface now matches the documented "authenticated only" intent rather than relying solely on internal logic.

### 4.4 — Same missing-REVOKE pattern exists in **pre-existing, untouched** migration 015 (`increment_feed_count`/`decrement_feed_count`)
Discovered incidentally while checking whether 4.2's pattern was unique to this batch. Confirmed via `has_function_privilege('anon', 'increment_feed_count(text,text)', 'EXECUTE')` = `true`. This means an unauthenticated user can currently inflate/deflate `hearts`/`fires`/`flags`/`comment_count`/`share_count` on any `feed_posts` row arbitrarily. **Not fixed in this batch** — migration 015 is pre-existing and out of this batch's explicit scope (verification of 016/017, not a general audit sweep) — but flagged here prominently as a real, live finding for a near-term follow-up. Lower severity than 4.2 (engagement metrics, not financial-equivalent points), but genuinely exploitable today.

### 4.5 — `is_market_open` lacked `search_path` pinning
Not itself SECURITY DEFINER (so not the P0-class risk that unqualified references in a SECURITY DEFINER function would be), but it's queried from inside `place_wallet_stake` and is broadly grantable (`authenticated, anon`). **Fixed**: added `set search_path = public` for defense in depth, consistent with every SECURITY DEFINER function in this codebase.

### 4.6 — Test-harness bugs in the authored SQL tests themselves (not schema/function bugs)
Two distinct bugs were found and fixed while actually executing the tests:
- **Role-confusion bug** (`004_settlement.test.sql`): the original test tried to read *other users'* `wallet_positions`/`user_wallets` rows while still simulating the admin's `authenticated` session — but RLS correctly restricts a plain authenticated session (admin or not) to its own rows; only `resolve_market`'s `SECURITY DEFINER` context may touch other users' rows. This produced `ERROR: permission denied for table wallet_positions`, which was **RLS working correctly**, not a bug in the schema. **Fixed** by restructuring the test to call `resolve_market()` under the simulated admin role, then `reset role` (back to `postgres`, which bypasses RLS) before verifying the resulting rows.
- **Wrong-exception-class assumption bug** (`002_wallet_lockdown.test.sql`): the original tests 1 and 3 assumed an RLS-blocked `UPDATE` raises an `insufficient_privilege` exception. That's true for `INSERT` violating a `WITH CHECK` clause (confirmed: SQLSTATE 42501, "new row violates row-level security policy") — but `UPDATE`/`SELECT`/`DELETE` with no matching `USING` policy do **not** error at all; they silently affect/return zero rows. This bug was masked by a *separate*, real environment issue (§5.3): while `authenticated` had zero base table grants at all (a Postgres permission-denied error, which genuinely does raise `insufficient_privilege`), the flawed test happened to report the correct PASS for the wrong reason. Once the table-grants issue was fixed, the same flawed test began reporting a false FAIL (misreading a correctly-functioning silent-deny as if the update had "succeeded"). **Fixed** by checking `GET DIAGNOSTICS ... = ROW_COUNT` instead of relying on an exception.

None of 4.6's fixes changed any migration or application behavior — they made the tests correctly verify behavior that (once 4.2/4.3 were fixed) was already correct.

## 5. Environment/tooling findings (not code defects, but load-bearing for trusting this report)

1. **Local Supabase CLI (2.111.0) requires `supabase/config.toml`'s `auto_expose_new_tables` for legacy grant behavior**, or every table has **zero** base grants for `anon`/`authenticated` — not an RLS effect, a missing `GRANT` entirely. None of migrations 001–017 issue explicit `GRANT ... ON TABLE` statements; they were written assuming the platform auto-exposes new tables (the historical default). The `config.toml` field is explicitly flagged **deprecated, scheduled for removal 2026-10-30**, and its own comment states this "match[es] the new cloud default" — meaning this may not be purely a local-CLI quirk. **I cannot check whether your actual production Supabase project has this same restrictive default** (I was told not to access production) — this is the single most important manual verification step I'm handing back to you (see §7). If production has this default and no explicit table grants exist anywhere in the migration history, **the entire application may currently be returning zero rows to every real user**, which would independently explain some of the Markets-page symptoms in §8 below (though the specific symptoms there are fully explained by mock-data code paths regardless).
2. This finding is orthogonal to migrations 016/017 specifically — it affects the whole pre-existing schema (001–015) equally.

## 6. Application flow verification (real Auth + PostgREST API, not just SQL)

All of the following were exercised through actual HTTP calls to the local Supabase Auth and PostgREST endpoints — the same API surface the Next.js app itself calls — not raw `psql`.

| Step | Balance before | Action | Balance after | Result |
|---|---|---|---|---|
| Sign up dev user (`POST /auth/v1/admin/users`, pre-confirmed) | — | Wallet auto-created via `handle_new_user` trigger | 5000 | **PASSED** |
| Sign in (`POST /auth/v1/token?grant_type=password`), get real session JWT | 5000 | — | 5000 | **PASSED** |
| Place stake, YES 100 @ 50 on `test-market-open` (`POST /rest/v1/rpc/place_wallet_stake`) | 5000 | Stake | 4900 | **PASSED** |
| Attempt stake on `test-market-expired` | 4900 | Rejected: `"Market is not open for staking"`, HTTP 400 | 4900 | **PASSED** |
| Attempt stake on `housing-affordability` (real market id, no DB row) | 4900 | Rejected, same message, HTTP 400 | 4900 | **PASSED** |
| Create dev admin, promote via `app_admins` insert, sign in as admin | — | — | — | **PASSED** |
| Admin resolves `test-market-open` YES (`POST /rest/v1/rpc/resolve_market`) | 4900 | `already_resolved:false, settled:1, paid:200` | 5100 | **PASSED** |
| Verify position: `status:won, payout:200, settled_at` set | — | — | — | **PASSED** |
| Admin resolves the **same market again** | 5100 | `already_resolved:true, settled:0, paid:0` | 5100 (unchanged) | **PASSED** |
| Stake 150 @ 60 on `test-market-void` | 5100 | Stake | 4950 | **PASSED** |
| Admin resolves `test-market-void` VOID | 4950 | `already_resolved:false, settled:1, paid:150` | 5100 | **PASSED** — refund is the original amount (150), not shares |
| Non-admin user attempts `resolve_market` on `test-market-no-settlement` | — | Rejected: `"Admin access required"`, HTTP 400 | — | **PASSED** |

**The complete stake-to-settlement flow, including YES resolution, duplicate-resolution idempotency, and VOID refund, worked correctly end-to-end against the real database via the real API.**

## 7. Concurrency verification (genuine overlapping connections, not sequential-but-fast)

Each scenario below used two separate OS-level `psql` processes, each opening its own transaction, both executing `pg_sleep(0.3)` before the operation under test so their attempts genuinely overlap in wall-clock time — this is real concurrency, not an artifact of fast sequential execution.

| Scenario | Setup | Result |
|---|---|---|
| **Concurrent stakes cannot overdraw** | Wallet balance = 100, both connections stake 100 | Conn A: succeeded, balance → 0. Conn B: `ERROR: Insufficient balance`, rolled back. Final: balance=0 (never negative), `total_staked`=100 (not 200), exactly 1 position row. **PROVEN SAFE.** |
| **Concurrent settlement cannot double-pay** | One stake (200 @ 50 → 400 payout) on a fresh market, two connections both call `resolve_market(..., 'yes', ...)` | Conn A: `already_resolved:false, paid:400`. Conn B: `already_resolved:true, paid:0`. Final balance = 5200 exactly (5000 − 200 + 400), paid once. **PROVEN SAFE.** |
| **Concurrent daily-bonus calls don't double-credit** | Wallet balance = 5000, `last_daily_bonus=null`, two connections both call `apply_daily_bonus(user, 100, today)` as `service_role` | Conn A: `applied:true`. Conn B: `applied:false`. Final balance = 5100 exactly, credited once. **PROVEN SAFE.** |
| **Bonus does not overwrite a concurrent stake deduction** (the exact lost-update race this migration was built to fix) | Wallet balance = 5000, one connection calls `apply_daily_bonus(+100)` as `service_role` while the other calls `place_wallet_stake(-200)` as the user, genuinely overlapping | Both operations succeeded independently. Final balance = 4900 exactly (5000 − 200 + 100), regardless of interleaving order — no lost update. **PROVEN SAFE.** |

All four concurrency guarantees required by this verification batch are proven against a real database, not asserted from code reading.

## 8. Markets page investigation (read-only — no redesign performed, per instructions)

Traced every symptom you described to its exact source in `src/app/predictions/page.tsx` → `PredictionsPageClient.tsx`:

| Symptom | Cause | Classification |
|---|---|---|
| RBA market resolving "9 April 2026" | `mock-market-data.ts`'s `urgentMarkets` array, entry `urgent-rba-rate`, `resolvesBy: '2026-04-09T16:30:00+10:00'` — a hardcoded literal string rendered as-is, not computed | Hardcoded/mock, no DB involved |
| Yes/No buttons still visible on that (now `status: 'demo'`) market | **A real gap in Implementation Batch 1**: `src/components/FeaturedMarketCard.tsx` is a *second, independent* component from `MarketCard.tsx` that Batch 1 never touched. It renders its own Yes/No buttons with **no status check at all**. `PredictionsPageClient.tsx` uses `FeaturedMarketCard` for the top "featured" slot and `MarketCard` for the grid — Batch 1's fix only reached the latter. | Code gap — `FeaturedMarketCard.tsx` needs the same `isDemo`/`resolved` guard `MarketCard.tsx` already has |
| "0 markets" shown while a featured card still displays | Two independent, disagreeing calculations in `PredictionsPageClient.tsx`: the count filters `status === 'active'` (now correctly 0, since every market is `'demo'`); the featured-market pick explicitly looks up `id === 'urgent-rba-rate'` **first, ignoring status entirely**, and renders unconditionally | Code gap — the featured-market lookup should also respect eligibility, or the page should suppress the featured slot when nothing is genuinely open |
| Leaderboard sample users | `mock-market-data.ts`'s static `leaderboard` array (12 fabricated users), embedded directly in the predictions page and on the standalone `/leaderboard` page | Hardcoded/mock, no DB involved (already flagged in the original audit, unchanged) |
| "AI bull/bear case" and "movement" copy | `marketStoryFor()` in `mock-market-data.ts` — pure template-string interpolation, no API call of any kind, applied to every market regardless of status | Hardcoded/mock, mislabeled "AI" in the UI (it isn't AI) — renders on demo markets exactly as it would on active ones |

**Follow-up list (not fixed in this batch, per instructions not to redesign now):**
1. Add the same status guard `MarketCard.tsx` has to `FeaturedMarketCard.tsx`, or remove/replace the featured-market slot until a real eligible market exists.
2. Make the "N markets" count and the featured-market pick derive from the same eligibility logic (ideally both calling `is_market_open` semantics) so they can't visibly disagree.
3. Either remove the "AI bull / bear case" label (it's not AI-generated) or actually gate this template content behind the market's status, consistent with everything else being labeled "Demo — not tradeable."
4. Remove/replace the fake leaderboard (already an open item from `PRODUCTION_BLOCKERS.md`).
5. Decide whether `urgent-rba-rate`'s hardcoded past-context date should be updated or the whole `urgentMarkets` concept retired now that nothing is genuinely time-urgent without real backing data.

## 9. Steps still requiring your manual execution

1. **Check whether your real production Supabase project has the same "zero table grants by default" behavior** (§5.1) — I cannot check this without accessing production, which I was told not to do. This is the single highest-priority manual check from this report.
2. Apply migrations 016/017 to your actual dev/staging project when ready (`supabase link` + `supabase db push`), then re-run the three test files against that environment too — local Postgres behavior can differ subtly from the hosted platform (as §5.1 itself demonstrates).
3. Decide whether to fix the pre-existing `increment_feed_count`/`decrement_feed_count` grant gap (§4.4) — flagged, not fixed, in this batch.
4. Review and prioritize the Markets-page follow-up list (§8).
5. Rotate `SYNC_SECRET`/`THEYVOTEFORYOU_API_KEY` — unchanged ask from Implementation Batch 1, still outstanding.

## 10. Confirmation

- Every command in this report ran against `127.0.0.1:54322`/`127.0.0.1:54321` (local Docker containers), using the Supabase CLI's well-known local-development default credentials (identical on every developer's machine, not real secrets, not connected to any real service).
- `NEXT_PUBLIC_SUPABASE_URL` / real `.env.local` values were never read or used in any command in this report.
- No `supabase link`, no `supabase db push`, no connection string pointing anywhere other than `127.0.0.1` was ever used.
- Nothing was staged or committed (`git status` still shows the same pre-existing uncommitted state plus this batch's file changes, none of it added to the index).
- **Production was not accessed, connected to, or modified at any point in this verification batch.**
