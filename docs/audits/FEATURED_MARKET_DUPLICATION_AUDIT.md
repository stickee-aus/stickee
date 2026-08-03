# Featured Market / Markets-Page Duplication Audit

Read-only. No code changed. Scope: `/predictions` page, `FeaturedMarketCard`, `MarketCard`, `PredictionMarketGrid`, market data sources, staking eligibility, and the fake/demo content surfaced through the featured slot.

> **Implementation status (Batch A — done):** the two issues this audit identifies as the featured-slot root cause — ungated Yes/No buttons on `FeaturedMarketCard`, and hardcoded `urgent-rba-rate` featured-market selection — have been fixed. See `FEATURED_MARKET_BATCH_A_REPORT.md` for the full before/after. New ground truth: `src/lib/market-eligibility.ts` is now the single shared eligibility derivation (`getMarketEligibility`, `selectFeaturedMarket`, `nonTradeableLabel`), consumed by `MarketCard`, `FeaturedMarketCard`, `PredictionsPageClient`, and `StakeModal`. **`PredictionMarketGrid.tsx` (the third system described below) is untouched** — its inert "Buy Yes"/"Buy No" buttons and separate `IssueMarket` type remain exactly as documented; that's Batch B+ scope. The sections below are left as originally written for historical context; treat this note as authoritative for current behavior of the featured slot specifically.

## Executive summary

The "0 markets but a featured market renders" bug and the "Yes/No buttons on an expired demo market" bug are **the same root cause**: the featured market is selected by a hardcoded ID lookup (`urgent-rba-rate`) that ignores `status` entirely, and `FeaturedMarketCard` — unlike `MarketCard` — was never given the status-gating logic that hides stake buttons on non-active markets. This isn't two competing data systems; it's **one shared data source with an unfinished second consumer**. `MarketCard.tsx` was already fixed (it correctly derives `resolved`/`isDemo`/`isVoided` from `market.status` and disables staking, per code comments referencing migration 017's `is_market_open()`). `FeaturedMarketCard.tsx` is untracked in git (`git status` shows it as new/`??`), imports `MarketCard.tsx`'s shared subcomponents (thumbnail, bull/bear, news timeline, probability chart) but reimplements its own stake panel from scratch — without carrying over the status checks that motivated those subcomponents' sibling logic in the first place. It looks like a partial migration: `MarketCard` was hardened, `FeaturedMarketCard` was split out afterward and missed the fix.

There is a **separate, third** market UI — `PredictionMarketGrid.tsx`, rendered on `/issue/[id]` — that is architecturally independent: different type (`IssueMarket`/`MarketOutcome` vs. `PredictionMarket`), different DB-row mapper (`mapIssueMarketRecord` vs. `mapIssueMarketRecordToPredictionMarket`), different visual language (literal Tailwind `green-500`/`red-500`, not the app's custom palette), and "Buy Yes"/"Buy No" buttons with **no `onClick` handler at all** — they are inert. This is real duplication and should be retired in favor of `MarketCard`, not fixed in place.

No server-side security gap was found. `place_wallet_stake`'s `is_market_open()` check (migration 017) independently re-verifies `status = 'active' AND closes_at > now()` before any stake is recorded, so a user clicking Yes/No on the fake featured market cannot actually place a real stake — they get a rejection toast after filling in an amount. The defect is entirely a **trust/UX** one: the UI invites a stake it knows the server will refuse, on content it internally still labels `'demo'`.

## Current architecture

```
/predictions (page.tsx, server component)
  └─ getLiveBillMarkets()          [predictions-db.ts]
       ├─ SELECT * FROM issue_markets WHERE is_test_fixture = false
       ├─ on success → map via mapIssueMarketRecordToPredictionMarket()  [issues-data.ts]
       └─ on empty/error → fallback: allMarkets.filter(category === 'bill')  [mock-market-data.ts]
            (these mock "bill" rows have STATUS_MAP['active'] = 'demo' — never 'active')
  └─ passes initialBillMarkets to PredictionsPageClient (client component)

PredictionsPageClient.tsx
  STATIC_NON_BILL_MARKETS = allMarkets.filter(category !== 'bill')   ← always mock, all status:'demo'
  markets = [...billMarkets (DB or fallback), ...STATIC_NON_BILL_MARKETS (always mock)]

  featuredMarket =
       markets.find(id === 'urgent-rba-rate')      ← hardcoded ID, ignores status
    ?? markets.find(status === 'active')
    ?? markets[0]

  activeCount = markets.filter(status === 'active').length   ← independent of featuredMarket selection

  visibleMarkets = filtered markets, minus featuredMarket, rendered via <MarketCard>
  featuredMarket rendered via <FeaturedMarketCard>            ← same `markets` array, same `onStake` handler
```

```
/issue/[id]/page.tsx
  └─ <PredictionMarketGrid issueId initialMarket={issueMarkets[id]} />
       ├─ fallback: issueMarkets[issueId]   [mock-market-data.ts, IssueMarket type — NOT PredictionMarket]
       ├─ realtime: subscribes to issue_markets, maps via mapIssueMarketRecord()  [different mapper]
       └─ "Buy Yes" / "Buy No" buttons — no onClick, no wallet hook, no StakeModal
```

Both `FeaturedMarketCard` and `MarketCard` receive `onStake` from the **same** `handleStake` in `PredictionsPageClient` → same `StakeModal` → same `usePredictionWallet.placeStake()` → same `place_wallet_stake`/`is_market_open` RPCs. **The staking backend is not duplicated.** What's duplicated is the *client-side eligibility gating* that decides whether to show the button at all.

## Data-flow trace

### 1. Featured market

| Aspect | Detail |
|---|---|
| Source file | `FeaturedMarketCard.tsx`, selected in `PredictionsPageClient.tsx:227-230` |
| Source of data | Same `markets` array as the board (DB bill markets + static mock), but selection is a hardcoded `id === 'urgent-rba-rate'` match — falls back to first active, then `markets[0]` |
| DB-backed / mock | `urgent-rba-rate` is **100% mock** — defined in `mock-market-data.ts:678-688` with hardcoded `probability: 74`, `priceChange: +6.1`, `participants: 5880`, `status: 'demo'`, `resolvesBy: '2026-04-09T16:30:00+10:00'` |
| Status handling | **None.** `FeaturedMarketCard` never reads `market.status`. Renders identically whether `active`, `demo`, `resolved-*`, or `voided`. |
| Stake-button eligibility | Always rendered, unconditionally, regardless of status |
| Date handling | `resolvesBy` is a raw string interpolated into "resolves {market.resolvesBy}" — no comparison against `now()`; the countdown badge logic that exists in `MarketCard` (`MarketCountdownBadge`, `useCountdown`) is not used here at all |
| Fallback behaviour | If `urgent-rba-rate` doesn't exist in `markets`, falls back to first `active` market, then `markets[0]` unconditionally (could be a resolved or voided market) |
| Empty-state behaviour | Only suppressed if `markets` is completely empty (`{featuredMarket && (...)}`) — never suppressed for being demo/expired/resolved |
| Production risk | Real users can see a real Yes/No stake UI, fill in an amount, hit confirm, and get a runtime rejection from `place_wallet_stake` — a broken/misleading interaction on a platform whose constitution requires "Do not make any public market stakeable" unless it is |

### 2. Standard market board

| Aspect | Detail |
|---|---|
| Source file | `MarketCard.tsx`, rendered in a grid over `visibleMarkets` |
| Source of data | Same `markets` array, minus the featured pick |
| DB-backed / mock | Mixed per-row: bill markets are DB-backed when `issue_markets` has rows, mock otherwise; all non-bill categories (civic/election/mp-vote/urgent) are always mock |
| Status handling | `resolved = status !== 'active'`, `isDemo = status === 'demo'`, `isVoided = status === 'voided'` — all three explicitly branched in JSX |
| Stake-button eligibility | Yes/No buttons only render `{!resolved && (...)}`; since `'demo'` maps to `resolved = true`, demo markets show a "Not tradeable" chip instead of stake buttons |
| Date handling | `MarketCountdownBadge` parses `resolvesBy` as a `Date`, only shows a countdown chip if parseable and closing soon — otherwise silently omitted, no crash on non-ISO strings like `'Dec 2026'` |
| Fallback behaviour | N/A — renders whatever's passed, correctly labeled |
| Empty-state behaviour | Parent (`PredictionsPageClient`) shows "No markets match this filter" when `filtered.length === 0` |
| Production risk | Low — this component already implements the truthfulness gating the constitution requires |

### 3. `/issue/[id]` market grid (third system, out of the audit's original scope but discovered in the trace)

| Aspect | Detail |
|---|---|
| Source file | `PredictionMarketGrid.tsx` |
| Source of data | `issueMarkets[issueId]` (mock) as SSR fallback, or realtime `issue_markets` row mapped via `mapIssueMarketRecord` (a different mapper than the one `predictions-db.ts` uses) |
| Status handling | **None** — `IssueMarket` type has no `status` field at all |
| Stake-button eligibility | "Buy Yes"/"Buy No" buttons render unconditionally and have **no onClick handler** — clicking does nothing |
| Production risk | Low functional risk (buttons are inert, not wired to the wallet), but it's a second, incompatible market type system and a visual-design-system violation (hardcoded `green-500`/`red-500` Tailwind classes vs. the app's custom monochrome-adjacent palette used everywhere else) |

## Duplicate logic inventory

1. **Two market type systems** for the same underlying `issue_markets` table: `PredictionMarket` (`mock-market-data.ts`, consumed by `MarketCard`/`FeaturedMarketCard`/`PredictionsPageClient`) vs. `IssueMarket`/`MarketOutcome` (also `mock-market-data.ts`, consumed only by `PredictionMarketGrid`).
2. **Two DB-row mappers** for `issue_markets`: `mapIssueMarketRecordToPredictionMarket` and `mapIssueMarketRecord` — both in `issues-data.ts`, doing overlapping work with different output shapes.
3. **Two stake-eligibility implementations** at the client layer: `MarketCard`'s `resolved`/`isDemo`/`isVoided` derivation vs. `FeaturedMarketCard`'s (missing) equivalent vs. `PredictionMarketGrid`'s (also missing, and disconnected from the wallet entirely).
4. `StakeModal.tsx` itself also has no status awareness — it will render a fully-enabled "Stake" button for any market handed to it, including a demo one. It currently only reaches that state via `FeaturedMarketCard`'s ungated button, since `MarketCard` never opens it for a demo/resolved market.

## Fake / demo content inventory (featured slot specifically)

All of the following, shown in `FeaturedMarketCard` for `urgent-rba-rate`, are hardcoded in `mock-market-data.ts:678-688` and `marketStoryFor()` (`mock-market-data.ts:362-416`), with no DB or external source:

- `probability: 74`, `priceChange: +6.1`, `participants: 5880` — fabricated numbers, not computed
- `history` — procedurally generated via `generatedHistory()` (sine/cosine texture over the fabricated probability/change), not real price history
- `bullCase`/`bearCase` — template-string interpolation, not AI-generated (contrary to the audit brief's framing) but still fabricated commentary with no "illustrative" label in the UI
- `newsTimeline` — templated "Today" / "This week" / resolution-watch entries built from the same fabricated `priceChange`, not real news
- `resolvesBy: '2026-04-09T16:30:00+10:00'` — hardcoded relative to an April authoring date; already in the past relative to the current date (2026-08-03), so the "resolves" copy and any countdown math (if it were wired up, which it isn't here) would be stale

## Root cause: "0 markets" while a featured market renders

`activeCount` (`markets.filter(status === 'active').length`) and `featuredMarket` (`markets.find(id === 'urgent-rba-rate') ?? ...`) are two **independent** derivations over the same `markets` array, with no shared eligibility gate between them:

- Every mock market in `mock-market-data.ts` — bill, civic, election, mp-vote, urgent — has `status: 'demo'` (bill markets via `STATUS_MAP.active = 'demo'`, all others hardcoded `'demo'` directly). None of them can ever contribute to `activeCount`.
- The only way any market reaches `status: 'active'` is a real `issue_markets` row from the DB with that literal status value.
- If `issue_markets` is empty or the query errors (fresh/local environment, or a real outage), `getLiveBillMarkets()` catches it and falls back to the mock bill markets — which are `'demo'`, not `'active'`.
- Result: in that state, `activeCount === 0`, but `featuredMarket` still resolves to `urgent-rba-rate` because the ID lookup doesn't check status at all.

## Root cause: improper stake buttons on the featured market

`FeaturedMarketCard.tsx` never computes or checks `market.status`. It imports `MarketCard.tsx`'s shared display subcomponents (thumbnail, bull/bear case, news timeline, probability chart, color helpers) but its own stake-button block (lines 135-148) is unconditional:

```tsx
<div className="grid grid-cols-2 gap-3">
  <button onClick={() => onStake(market, 'yes')}>Yes</button>
  <button onClick={() => onStake(market, 'no')}>No</button>
</div>
```

Compare `MarketCard.tsx:402-421`, which wraps the equivalent block in `resolved ? <NotTradeableBadge/> : <YesNoButtons/>`. That gating logic was never carried over when `FeaturedMarketCard` was split into its own file. The server-side `is_market_open()` RPC still blocks the actual stake, so this is a UX/trust defect, not a financial one — but it directly contradicts the constitution's "do not make any public market stakeable" unless it genuinely is, and "AI-generated/demo content must be clearly distinguishable from verified facts."

## Does a single canonical market domain model already exist?

Yes, partially. `PredictionMarket` (the type) + `issue_markets` (the table) + `mapIssueMarketRecordToPredictionMarket` (the mapper) + `is_market_open()`/`place_wallet_stake`/`resolve_market` (the RPCs) already form one coherent, DB-backed lifecycle — the admin console (`/admin/markets`) already operates on exactly this model. The gaps are:
- Only `category = 'bill'` markets are ever queried live (`getLiveBillMarkets`); civic/election/mp-vote categories have no DB-backed path at all, only static mock.
- `FeaturedMarketCard` doesn't consume the model's `status` field.
- `PredictionMarketGrid` uses a parallel, older type (`IssueMarket`) instead of this model.

## Can `FeaturedMarketCard` be replaced by composition of `MarketCard`?

Yes, and this is the smallest safe path. `FeaturedMarketCard` already imports `MarketCard.tsx`'s subcomponents — it is not an independent architecture, just an independently-maintained layout with a copy-pasted (and incomplete) stake panel. The status-derivation logic (`resolved`, `isDemo`, `isVoided`) and the stake/not-tradeable branch can be extracted from `MarketCard` into a small shared hook or exported function and used by both, rather than reimplemented.

## What should be removed rather than preserved

- The hardcoded `id === 'urgent-rba-rate'` featured-market selector — it privileges one specific mock ID over any real signal (e.g., highest participant count, most urgent real deadline, editorially pinned real market).
- `FeaturedMarketCard`'s standalone stake-button block — replace with the shared eligibility logic, not a second copy of it.
- `PredictionMarketGrid.tsx`'s inert "Buy Yes"/"Buy No" buttons — either wire them to the real stake flow (reusing `usePredictionWallet`/`StakeModal`) or remove them until they are, per the constitution's "no verified data available" preference over misleading interactive elements.

## Recommended canonical data source

`issue_markets` (DB) + `PredictionMarket` (type) + `mapIssueMarketRecordToPredictionMarket` (mapper), extended so `getLiveBillMarkets`-equivalent queries cover all categories, not just `bill`. Retire `IssueMarket`/`MarketOutcome`/`mapIssueMarketRecord` once `PredictionMarketGrid` is migrated or removed.

## Recommended component architecture (direction only — no code change proposed here)

- Extract a shared `getMarketEligibility(market)` (or equivalent) returning `{ resolved, isDemo, isVoided, canStake }` from `MarketCard.tsx`, used by both `MarketCard` and `FeaturedMarketCard`.
- Feature selection should require `status === 'active'` (or an explicit editorial "pinned" flag on a real, currently-open market) — never fall through to a specific mock ID or to `markets[0]` unconditionally.
- `StakeModal` should refuse to open (or should itself gate) for a market that isn't currently eligible, so the client-side UX never promises something the server-side RPC will refuse.

## Risks

- Retiring `PredictionMarketGrid` touches a real, currently-rendered page (`/issue/[id]`) — needs a replacement or explicit product decision before removal, not a silent delete.
- Extending live queries to non-bill categories is a scope/product decision (which categories get real `issue_markets` rows, and when) — not purely technical.
- Changing featured-market selection logic changes what's shown on the highest-visibility slot on `/predictions` — worth a quick look at what it *should* show (most real urgency? most staked? editorially pinned?) before implementing.

## Proposed implementation batches

**Batch A — Immediate truthfulness fixes**
Add status gating to `FeaturedMarketCard` (reuse/extract `MarketCard`'s `resolved`/`isDemo`/`isVoided` logic); hide or badge the Yes/No buttons exactly as `MarketCard` does. No data-source change. Smallest possible diff to stop the misleading interaction.

**Batch B — Data-source unification**
Extract the shared eligibility derivation into one function/hook used by both `MarketCard` and `FeaturedMarketCard`. Decide the fate of `PredictionMarketGrid`/`IssueMarket` (migrate to `PredictionMarket` + `MarketCard`-family components, or explicitly scope its removal).

**Batch C — Real featured-market selection**
Replace the hardcoded `id === 'urgent-rba-rate'` lookup with a rule based on real signal (status `active` + most urgent real `closes_at`, or an explicit admin-set "pinned" flag on a real row). Requires a product decision on the selection rule.

**Batch D — Remaining market-page cleanup**
Extend `getLiveBillMarkets`-style live queries to civic/election/mp-vote categories where real data exists or can be sourced; remove/replace remaining always-mock categories per the constitution's "no verified data available" preference.

## Exact files likely affected

- `src/components/FeaturedMarketCard.tsx` (Batch A, B, C)
- `src/components/MarketCard.tsx` (Batch A, B — source of extracted logic)
- `src/components/PredictionsPageClient.tsx` (Batch C — featured-market selection)
- `src/lib/predictions-db.ts` (Batch D — extend live query scope)
- `src/lib/issues-data.ts` (Batch B, D — mapper consolidation)
- `src/components/PredictionMarketGrid.tsx` (Batch B — migrate or remove)
- `src/app/issue/[id]/page.tsx` (Batch B — if `PredictionMarketGrid` is replaced)
- `src/lib/mock-market-data.ts` (Batch C, D — as mock fallbacks shrink)
- `src/components/StakeModal.tsx` (Batch A/B — optional defense-in-depth gate)

## Tests required

- Unit: eligibility derivation function — every `MarketStatus` value maps to the correct `{resolved, isDemo, isVoided, canStake}`.
- Component: `FeaturedMarketCard` renders "Not tradeable"/no stake buttons for `demo`/`resolved-*`/`voided` status, matching `MarketCard`'s existing behavior.
- Integration (real Supabase, per constitution's mandatory real-DB testing for anything touching staking eligibility): confirm `is_market_open()` still independently rejects a stake attempt on a non-active market even if a future UI regression reintroduces an ungated button — this is the actual security backstop and should have a regression test that doesn't depend on the client being correct.
- Integration: featured-market selection rule (once changed) returns no market, or a genuinely eligible one, when zero markets are `active` — never a demo/expired one via ID fallback.

---

# Final response

## 1. Root cause
Two independent derivations over the same `markets` array with no shared eligibility gate: `activeCount` correctly requires `status === 'active'` (which no mock market ever has), while `featuredMarket` is picked by a hardcoded ID match (`urgent-rba-rate`) that ignores status entirely. Same gap explains the improper Yes/No buttons: `FeaturedMarketCard.tsx` never reads `market.status` at all — it was split out from `MarketCard.tsx` (which does have this gating, added in a prior batch per its comments referencing migration 017) and the status-derivation logic was never carried over.

## 2. Are there truly two market systems?
Not two — **three**, and they overlap differently than the brief assumed. `FeaturedMarketCard` and `MarketCard` share the same data (`markets` array), the same `onStake` handler, and the same server-side staking RPCs — the duplication there is only in client-side eligibility-gating logic, not data or backend. But `PredictionMarketGrid.tsx` (on `/issue/[id]`, found during the trace, outside the original file list) is a genuinely separate system: a different type (`IssueMarket` vs `PredictionMarket`), a different DB-row mapper, a different visual language, and "Buy Yes"/"Buy No" buttons with no click handler at all.

## 3. Which content is fake
Everything about the featured `urgent-rba-rate` market — probability (74%), 24h change (+6.1pp), participant count (5,880), 14-day history, bull/bear case text, news timeline, and the `resolvesBy` date (already in the past relative to today) are all hardcoded/generated in `mock-market-data.ts`, not DB-backed or externally sourced. The market's own `status: 'demo'` field already says this — the bug is that `FeaturedMarketCard` doesn't read that field.

## 4. Smallest safe fix
Give `FeaturedMarketCard` the same status-derived gating `MarketCard` already has (`resolved`/`isDemo`/`isVoided` → hide or badge the stake buttons instead of always showing them). That alone fixes the "Yes/No on a demo market" problem without touching data sources or featured-selection logic. The "0 markets but featured renders" inconsistency needs one additional, slightly larger change: stop selecting the featured market by hardcoded ID and require `status === 'active'` (or explicitly suppress the featured slot when there is none).

## 5. Recommended first implementation batch
**Batch A** — status-gate `FeaturedMarketCard`'s stake buttons only, reusing `MarketCard`'s existing derivation. No data-source or selection-logic change, smallest possible diff, directly closes the trust gap. Batches B–D (shared-logic extraction, real featured selection, `PredictionMarketGrid` migration, live-query scope expansion) are follow-ups requiring more design/product input.

## 6. Files inspected
`src/app/predictions/page.tsx`, `src/components/PredictionsPageClient.tsx`, `src/components/FeaturedMarketCard.tsx`, `src/components/MarketCard.tsx`, `src/lib/mock-market-data.ts`, `src/lib/predictions-db.ts`, `src/lib/issues-data.ts` (relevant excerpt), `src/hooks/usePredictionWallet.ts`, `src/components/StakeModal.tsx`, `src/components/PredictionMarketGrid.tsx`, `src/app/issue/[id]/page.tsx` (import/usage only), `src/app/admin/markets/page.tsx` (excerpt), `src/app/admin/markets/actions.ts`, `supabase/migrations/017_market_lifecycle_and_settlement.sql` (`is_market_open` definition), plus the pre-existing `MARKET_ENGINE_AUDIT.md` and `DATA_AND_CONTENT_AUDIT.md` for cross-checking against prior findings (both still accurate; this audit narrows in on the featured-card-specific mechanism they didn't fully trace).

## 7. Areas not verified
- Did not run the app or the local Supabase stack to empirically reproduce "0 markets" in the browser — the trace is static-code-based, from `git status`/file reads only, per the no-code-execution-implied scope of this task.
- Did not check `supabase/seed.sql` test fixtures to see whether a local dev environment currently has any real `active` `issue_markets` row (would change what `activeCount` shows locally right now vs. in a genuinely empty environment).
- Did not audit `ProposeMarketModal.tsx` or the leaderboard data path — out of scope per the brief, and already covered by the existing `MARKET_ENGINE_AUDIT.md`.

## 8. Confirmation
No code, migrations, or configuration were modified. No commands beyond read-only `git status`/`grep`/file reads were run. `FEATURED_MARKET_DUPLICATION_AUDIT.md` has been created at the repo root; no other files were touched. Pre-existing uncommitted work (the large set of modified/untracked files from `git status`) was left untouched.
