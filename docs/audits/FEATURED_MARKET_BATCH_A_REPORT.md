# Featured Market — Batch A Implementation Report

Implements Batch A from `FEATURED_MARKET_DUPLICATION_AUDIT.md`. No database migrations, no changes to `is_market_open()`/`place_wallet_stake()`, no touching `PredictionMarketGrid.tsx`.

## Root cause fixed

Two independent derivations over the same `markets` array had no shared eligibility gate:

1. `FeaturedMarketCard.tsx` never read `market.status` at all, so it rendered live Yes/No stake buttons unconditionally — including for the hardcoded `urgent-rba-rate` mock market (`status: 'demo'`, `resolvesBy` already in the past).
2. `PredictionsPageClient.tsx` selected the featured market by hardcoded ID (`markets.find(id === 'urgent-rba-rate') ?? ... ?? markets[0]`), independent of the `activeCount` calculation (`markets.filter(status === 'active').length`) — so the page could report "0 markets" while still featuring a demo one.

Both are fixed by introducing one shared eligibility rule that both the selection logic and the render logic now use, so they can no longer disagree.

## Files changed

| File | Change |
|---|---|
| `src/lib/market-eligibility.ts` (new) | `getMarketEligibility(market)` → `{isActive, isDemo, isVoided, isResolved, isResolvedYes, isResolvedNo, canStake}`; `nonTradeableLabel(status)`; `selectFeaturedMarket(markets)` |
| `src/components/MarketCard.tsx` | Local `resolved`/`resolvedY`/`isDemo`/`isVoided` consts replaced with a call to `getMarketEligibility()`. No JSX/behavior change — same variable names, same rendering. |
| `src/components/FeaturedMarketCard.tsx` | Added a status pill (matching `MarketCard`'s existing badge style) when `!canStake`; Yes/No buttons now render only when `canStake`, otherwise a neutral monochrome "not tradeable" panel with the truthful status label replaces them |
| `src/components/PredictionsPageClient.tsx` | `featuredMarket` now derived via `selectFeaturedMarket(markets)` instead of the hardcoded ID chain; `handleStake` gains a defense-in-depth eligibility check before opening `StakeModal` |
| `src/components/StakeModal.tsx` | Defense-in-depth: computes `getMarketEligibility(market)`, factors it into the existing `canStake`/confirm-button-disabled logic, and shows a truthful "cannot be staked" message if a market ever reaches the modal ineligible |
| `vitest.config.ts` | Added `resolve.alias` for `@/*` → `src/*` (matching `tsconfig.json`) — required for the new tests to import application modules; the one pre-existing test file avoided this by reading files as raw text instead |
| `src/lib/__tests__/market-eligibility.test.ts` (new) | 14 tests covering the eligibility helper, featured selection, and wiring checks (see below) |

## Shared eligibility approach

`getMarketEligibility()` is a single pure function taking `{status}` and returning every boolean `MarketCard`'s JSX already branched on, plus `canStake` (`= isActive`). `MarketCard` and `FeaturedMarketCard` both call it; `PredictionsPageClient` and `StakeModal` call it too, for selection and for the defense-in-depth guard, respectively. There is now exactly one place that decides "is this market real and open," matching the audit's recommendation to extract rather than reimplement. `nonTradeableLabel(status)` centralizes the exact copy ("Demo — not tradeable", "Voided — refunded", "Resolved Yes"/"Resolved No", "Closed") so `MarketCard`, `FeaturedMarketCard`, and `StakeModal` show consistent wording.

`MarketCard.tsx`'s own JSX and CSS were left untouched beyond the one-line derivation swap — it was already correct per the audit, so it was reused, not rewritten.

## Featured-selection behaviour: before / after

**Before:**
```ts
markets.find(m => m.id === 'urgent-rba-rate') ?? markets.find(m => m.status === 'active') ?? markets[0]
```
Always returned *something* if `markets` was non-empty, regardless of status — the demo RBA market whenever present, or an arbitrary (possibly resolved/voided) market otherwise.

**After:**
```ts
markets.find(m => getMarketEligibility(m).canStake) ?? null
```
Returns the first genuinely active market, or `null`. `activeCount` and `selectFeaturedMarket` now use the identical activeness rule (`status === 'active'`), so they cannot disagree — the "0 markets but featured market" contradiction is structurally impossible now, not just patched around.

No editorial pinning was introduced, per the batch's explicit scope limit — a real active market is chosen by array order only.

## Tests executed and results

```
$ npx tsc --noEmit
(clean, no output)

$ npx vitest run
 ✓ src/lib/__tests__/mp-score-copy.test.ts (7 tests)
 ✓ src/lib/__tests__/market-eligibility.test.ts (14 tests)
 Test Files  2 passed (2)
      Tests  21 passed (21)

$ npm run build
✓ Compiled successfully in 7.9s
✓ TypeScript: passed
✓ Generating static pages (54/54)
(/predictions and /issue/[id] both built successfully as dynamic routes)

$ node scripts/secret-scan.mjs
secret-scan: no suspicious patterns found in tracked files.

$ npx eslint <changed files>
2 pre-existing errors in PredictionsPageClient.tsx (react-hooks/set-state-in-effect,
lines 121 & 125 — setBillMarkets/setProposals inside useEffect) — confirmed present
before this batch's edits and untouched by them; not introduced by this change.
1 pre-existing warning in MarketCard.tsx (no-img-element) — also untouched by this batch.
```

The 14 new tests cover:
- **Eligibility helper** — active → `canStake: true`; demo, resolved-yes, resolved-no, voided → `canStake: false` (with the correct specific flag also set)
- **`nonTradeableLabel`** — correct truthful copy per status
- **Featured selection** — first active market wins; the hardcoded `urgent-rba-rate` demo market is not selected even when its id matches; `null` when zero markets are active; `null` for an empty array
- **The core invariant** — `activeCount === 0` and `selectFeaturedMarket()` returning `null` hold simultaneously for the same input array
- **Wiring checks** (source-content assertions, matching this repo's existing test style in `mp-score-copy.test.ts`) — `PredictionsPageClient.tsx` no longer contains the old hardcoded lookup or a `markets[0]` fallback and does call `selectFeaturedMarket`; `FeaturedMarketCard.tsx` calls `getMarketEligibility` and gates on `canStake`; `StakeModal.tsx` calls `getMarketEligibility` and checks `marketEligibility.canStake`

## Known limitations

- **No component-render tests.** `vitest.config.ts` runs in a `node` environment with no `jsdom`/`@testing-library/react` installed — this repo has never had DOM-rendering test coverage (the one pre-existing test file asserts against raw source text instead). Genuinely rendering `FeaturedMarketCard` with an active vs. demo market and asserting on the DOM output was not done; the wiring/source-content tests above are the closest equivalent under current infra. Adding `jsdom` + RTL would be a reasonable follow-up but is a real new dependency, so it wasn't added inside this "tightly scoped" batch.
- `vitest.config.ts`'s missing `@/*` alias was a pre-existing gap (the repo's only prior test avoided needing it) — fixing it was necessary to make the requested tests importable at all, so it's included here rather than deferred, but it is technically outside this batch's original file list.
- Featured-market selection is array-order-only (no tie-breaking by urgency/participants/pinning) — acceptable for this batch per its explicit scope, but worth deciding deliberately in Batch C.

## Follow-up recommendations for Batches B–D

- **Batch B (data-source unification):** `PredictionMarketGrid.tsx` on `/issue/[id]` is untouched — it still uses the separate `IssueMarket`/`MarketOutcome` type, a different DB-row mapper (`mapIssueMarketRecord`), and has "Buy Yes"/"Buy No" buttons with no click handler. Decide whether to migrate it onto `PredictionMarket` + the new `market-eligibility.ts` helper, or scope its removal.
- **Batch C (real featured-market selection):** the current rule is "first active market in array order." Consider a deliberate rule (most urgent real `closes_at`, most participants, or an explicit admin-set pinned flag on a real `issue_markets` row) once there's a product decision on what "featured" should mean.
- **Batch D (remaining market-page cleanup):** `getLiveBillMarkets()` still only queries live data for `category = 'bill'` — civic/election/mp-vote markets remain always-mock and therefore, under the new selection rule, can never be featured (since they can never have `status: 'active'` from a real row). This is a behavior change worth flagging: the featured slot will likely show nothing at all in most environments until either real bill markets go active or live queries are extended to other categories. That is the correct truthful behavior per the constitution ("no verified data available" over fake content), but it does mean the featured slot may look empty more often than before — worth confirming this is the desired interim UX before Batch C/D land.

## Confirmation that production was untouched

No database migrations were modified or applied. No `supabase`/admin commands were run. No commits, staging, pushes, or deploys were performed — `git status` still shows all changes as unstaged working-tree edits. `npm run build` was run locally only, to verify compilation; it does not deploy anything. Pre-existing uncommitted work (the large set of modified/untracked files unrelated to this batch, per the original `git status`) was left untouched — this batch's diff is confined to the seven files listed above.
