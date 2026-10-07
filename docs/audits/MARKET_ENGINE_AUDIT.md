# Stickee — Prediction Market Engine Audit

Read-only. This is the most consequential functional finding in the entire audit: **the product's core feature — virtual-points prediction markets — cannot currently pay out.**

> **Update (Implementation Batch 1):** the resolution/payout gap (§4–§8 below) and the expired-market gap (§3) have been implemented — see `IMPLEMENTATION_BATCH_1_REPORT.md` for the full before/after. New ground truth: `is_market_open()` is now the single authoritative eligibility check, and `resolve_market()` settles YES/NO/VOID atomically and idempotently, paying `round(shares)` to winners and refunding `amount` on VOID (the payout model this section originally recommended stopping to ask about — it turned out to already be implied by shipped UI copy in `StakeModal.tsx`, so it was implemented rather than escalated further). **No market currently has real backing data** — per an explicit product decision made during implementation, the 5 real bill issues were *not* seeded as live/stakeable, so every market today is demo-only and non-stakeable by design, exercised instead via test fixtures in `supabase/seed.sql`. The sections below are left as originally written for historical context; treat the update note here as authoritative for current behavior.

## 0. Critical framing: there are two separate, non-interacting systems

| | System A — Free Poll | System B — Points Staking (the real "market") |
|---|---|---|
| Tables | `predictions`, `issues` | `user_wallets`, `wallet_positions` |
| Entry point | `PredictionWidget.tsx` | `StakeModal.tsx` → `place_wallet_stake` RPC |
| Points involved | None | Yes — this is the virtual-points wallet |
| Resolved by | `prediction-resolver` cron agent | **Nothing. No code path found anywhere.** |
| Status values | `issues.status`: `active/passed/rejected` | `wallet_positions.status`: `open/won/lost`; `issue_markets.status`: `active/resolved-yes/resolved-no` |

Everything the audit brief asks about ("does resolution work," "are markets settled," "can users win points") applies to **System B**, and the finding is: it doesn't exist. `wallet_positions.status` can only ever be `open` in current data, because nothing transitions it, and `wallet_positions.payout` (a real column in the schema) is never written by any code.

## 1. Lifecycle states — requested vs. actual

| Requested state | Exists? | Evidence |
|---|---|---|
| draft | No | — |
| proposed | Client-only, not persisted | `ProposeMarketModal.tsx` has a `pending/approved/rejected` status in local component state; no table stores it. A user "proposing" a market today produces nothing durable. |
| approved | No | — |
| scheduled | No | — |
| open | Yes (`active`) | `issue_markets.status`, `wallet_positions.status` |
| closed | No distinct state | Nothing flips a market out of `active` on a timer |
| awaiting resolution | No | — |
| resolved | Partial (System A only) | `issues.status` → `passed/rejected` triggers `prediction-resolver`; System B has `resolved-yes/resolved-no` values defined but nothing sets them |
| voided | No | — |
| cancelled | No | — |
| disputed | No | — |
| archived | No | — |

**Severity: P1.** Roughly 8 of 12 requested lifecycle states don't exist at all, and the one that matters most for user trust — resolution of the actual wallet system — is entirely missing rather than partially built.

## 2. Timestamps and time zones

- `issues.created_at`/`updated_at` are correctly `timestamptz`.
- **`issue_markets.resolves_by` is declared `text not null`**, not `timestamptz` (migration `007_issues_and_markets.sql`). It's populated with free-form strings like `'Dec 2026'`, `'Q2 2026'`, `'May 2025'` (`src/lib/mock-market-data.ts`). This cannot be compared, sorted, or indexed as a real date — any "closes in N days" UI text is doing ad hoc string handling, not date math.
- **Severity: P1.** Without a real timestamp, there is no reliable way to even define "closed," let alone enforce it.

## 3. Expired / stale seeded markets — confirmed exploitable today

`src/lib/mock-market-data.ts` contains election markets (`election-labor-majority`, `election-teal-wentworth`, `election-greens-brisbane`, `election-coalition-opp-leader`, `election-senate-crossbench`) with `status: 'active'` and `resolvesBy` values of `'Jan 2025'`/`'May 2025'` — **over a year in the past relative to the audit date (2026-08-03)**.

**No runtime check exists anywhere** (grepped both client code and the `place_wallet_stake` RPC) of the form `if (now() > market.closes_at) reject`. The RPC (`008_wallet_staking.sql`) validates only: stake direction, `amount > 0`, price between 1–100, and sufficient balance. **It never queries `issue_markets.status` or any closing timestamp.** The client-side `MarketCard.tsx` computes `resolved = market.status !== 'active'` purely from a prop — a UI-only gate with no server enforcement behind it.

**Severity: P0.** A user can place a stake on a market whose real-world outcome has been known for over a year, and the server will accept it, because nothing on the server checks market status or timing at all — only balance sufficiency.

## 4. Resolution authorization

- The only privileged trigger point is `/api/agents/[id]`, gated by `x-sync-secret`/`Bearer CRON_SECRET` — not by Supabase role, so a regular logged-in user cannot invoke it without the secret.
- However: (a) that secret is currently sitting in plaintext in `MVP_LAUNCH.md` in the working directory (see Security audit, P0), and (b) even with the secret, `prediction-resolver` **only ever resolves System A** (`issues`/`predictions`) — it never touches `wallet_positions` or `issue_markets`. **No authority — admin, agent, or otherwise — currently resolves the points-staking markets.**
- **Severity: P0** for the secret exposure; **P1** for the absence of any defined resolution authority for System B, since the gap is structural (no one *can* resolve it, not just "no one currently does").

## 5. Reversibility and audit trail

- System A resolution idempotency relies on a synthetic feed-post ID (`resolution-${issue.id}-${issue.status}`) rather than a dedicated settlement/ledger table.
- civic_score awards are direct column increments with **no ledger row** — if an issue's status is ever corrected (e.g., `passed` → `rejected`), the prior award is never clawed back, and the new status triggers a fresh grading pass, causing double-award drift for any prediction correct under the old status.
- No `resolved_by`, `resolved_at`, or evidence/source columns exist on `issues` or `issue_markets` — there is no durable record of who resolved something, when, or on what authority, for either system.
- **Severity: P2** for the drift bug (real but not yet triggered in current data); **P1** for the structural absence of an audit trail, since it blocks ever safely adding dispute/correction handling later.

## 6. Voided/cancelled market refunds

Since void/cancel states don't exist in the schema, **there is no refund code path anywhere** (grepped `void|cancel|refund` across `src/` and all migrations — zero hits tied to markets or positions). This is a latent gap: it hasn't caused a bug yet only because the state that would trigger it can't currently be reached, but it also means there is no way to ever safely retire a bad or erroneous market without a manual database intervention.
**Severity: P1.**

## 7. Overspend / race conditions / duplicate submissions

This is the one part of the market engine that is **well-built**. `place_wallet_stake` performs the balance debit as a single atomic conditional statement:

```
update user_wallets set balance = balance - p_amount
where user_id = v_user_id and balance >= p_amount
returning balance into v_new_balance;
if v_new_balance is null then raise exception 'Insufficient balance';
```

Two concurrent stake requests from the same user cannot both succeed past the real balance — the client-displayed balance (`StakeModal.tsx`) is UX-only and cannot be used to overspend, because the server independently re-checks via the atomic `UPDATE ... WHERE` guard. **This is fully working and is the strongest piece of the entire market engine.**

## 8. Wallet mechanics

- **Initial balance:** `user_wallets.balance integer not null default 5000`, row created by the `handle_new_user()` signup trigger. **Fully working**, DB-trigger driven. Note: a separate, wholly disconnected demo hook (`useWallet.ts`, `STARTING_BALANCE = 5000` in `localStorage`) exists for pages that don't use the real Supabase-backed wallet (notably `/leaderboard`) — meaning there are, in effect, **two different "starting balances" in the product depending on which page you're on.**
- **Daily bonus:** idempotency is via a `last_daily_bonus` date column re-checked in the `UPDATE`'s `WHERE` clause per-row — this genuinely does prevent double-crediting from repeated/concurrent cron triggers (each single-row atomic UPDATE either matches the guard or it doesn't). However, `newBalance = wallet.balance + bonusPts` is computed from the balance read in the **initial batch SELECT**, not re-read at UPDATE time. If a user stakes on a market between the batch fetch and their row's bonus UPDATE, the bonus write **overwrites `balance` with a stale value, silently discarding the concurrent stake deduction.** This is a real lost-update race, distinct from (and not solved by) the double-bonus protection the code comments claim. **Severity: P2** (batch runs at low-traffic 2am today, but the bug is real and will surface as traffic grows).
- **Ledger:** No immutable transaction ledger exists. `wallet_positions` records individual stakes (a partial audit trail for debits only), but bonuses and any future payouts have no equivalent row-level record — `user_wallets.balance` is a bare mutable column touched from at least two independent code paths. **Severity: P1** — this makes any future balance dispute or reconciliation effectively unauditable.
- **Leaderboard:** **Entirely fake.** `LeaderboardGrid.tsx` renders directly from a static array in `mock-market-data.ts` — accuracy/streak/points/predictions are fabricated, sorted client-side, with zero query against real tables. `leaderboard/page.tsx` hardcodes `MOCK_RANK = 14` for "your rank" and reads balance from the localStorage-only demo wallet, not the real one. **Severity: P1** — this is presented to users as a live, competitive ranking and is not real in any respect.
- **Simulator:** Confirmed fully sandboxed — zero references to wallet/balance/Supabase/the staking RPC anywhere in `simulator-engine.ts`, `simulator-bridge.ts`, or the simulator UI. It's a self-contained forecasting toy over mock scenario data. Safe by isolation; just make sure the UI is clear that it's illustrative, not a real position.

## 9. Overall verdicts (per audit's required classification)

| Mechanism | Verdict |
|---|---|
| Stake placement & balance debit (RPC) | **Fully working** |
| Market open/close enforcement | **Broken/missing** — no server-side check exists at all |
| Market resolution/payout (System B — the real wallet) | **Missing entirely** |
| Free-poll resolution (System A) | **Partially working** (functions, but has award-drift risk) |
| Daily bonus distribution | **Partially working** (double-credit protected; has a separate lost-update race) |
| Immutable transaction ledger | **Missing** |
| Leaderboard | **Demo/hardcoded** |
| Market proposal flow | **Demo/stub** (never persisted) |
| Simulator | **Demo, correctly sandboxed** |

## Recommended target lifecycle (for Phase 2 of the roadmap)

`draft → proposed → approved → scheduled → open → closed → awaiting_resolution → resolved | voided | cancelled`, with `disputed` as a side-state reachable from `resolved`, and `archived` as a terminal housekeeping state. Each transition should be backed by: a real `timestamptz` for open/close/resolve, a `resolved_by`/`resolution_source` audit field, an immutable `wallet_ledger` table (amount, type, reference_id, created_at) that the balance is derived from or reconciled against, and a settlement job that actually writes `wallet_positions.status`/`payout` and credits `user_wallets.balance` atomically (mirroring the debit RPC's atomic-UPDATE pattern) with a unique idempotency key so a retried settlement run cannot double-pay.
