# Homepage Forecasts Batch Report

## Previous homepage gap

The homepage (`src/app/page.tsx`) had no visible presence for the forecasting/prediction-market product at all. `/predictions` existed as a fully-built page but was reachable only via the nav, and the global `DailyBonusBanner` — the one homepage-visible touchpoint referencing the product — labelled it "Markets" and let *any* visitor, signed in or not, click "Claim" and receive a bonus written to a device-local `localStorage` wallet with no real account behind it.

## Section added

A new "Forecasts" section was inserted between the existing "What government is doing" (decisions) section and the "Make it yours" personalisation CTA, matching the task's required placement. It answers "What is likely to happen next?" and uses only the public label **Forecasts** — never "Markets" or "Predictions" — in all homepage-facing copy.

## Data source used

The section reuses `getLiveBillMarkets()` from `src/lib/predictions-db.ts` — the exact function `/predictions/page.tsx` already uses for its live, Supabase-backed markets. It does **not** touch `allMarkets`/`STATIC_NON_BILL_MARKETS` (the static mock array `/predictions` separately blends in), so no fabricated probability, volume, or participant data can reach the homepage.

## Active-forecast eligibility rules

```ts
const liveMarkets = await getLiveBillMarkets()
const activeForecasts = liveMarkets
  .filter(market => getMarketEligibility(market).canStake)
  .slice(0, 2)
```

`getMarketEligibility(...).canStake` is the same single-source-of-truth helper (`src/lib/market-eligibility.ts`) that already gates `MarketCard` and `FeaturedMarketCard`. `canStake` is true only when `status === 'active'`, which excludes `demo`, `voided`, `resolved-yes`, and `resolved-no`. Critically, `getLiveBillMarkets()` falls back to the static mock bill markets on a Supabase error or an empty table — but every mock market has `status: 'demo'`, so that fallback is automatically filtered out here without any homepage-specific logic. No new eligibility rule was invented; the existing canonical one was reused, per the constitution's "prefer extending existing systems."

At most two forecasts are shown (`.slice(0, 2)`). Each card shows only verified fields: question, category (via the existing `CATEGORY_LABELS` map), probability (the DB-stored value, not fabricated), and `resolvesBy` — plus a link to `/predictions`. No staking buttons, volume, or "24h move" figures are rendered on the homepage.

## Empty-state behaviour

When `activeForecasts.length === 0`, the section renders:

> "No verified forecasts are currently open."

with a "See all forecasts" link to `/predictions`. The Forecasts section itself is never hidden — only its contents switch between the card grid and this empty state.

## Daily bonus banner changes

`src/components/DailyBonusBanner.tsx`:
- The "Markets" link label was renamed to "Forecasts"; wallet copy was reworded from "prediction points" to "forecast points".
- Added a real authentication gate via `usePredictionWallet()` (the same hook that drives `/predictions`' real Supabase wallet). Signed-out visitors (`authenticated === false`) now see **"Sign in to claim your daily forecasting bonus"** with a "Sign in" link to `/auth/sign-in` — never a Claim button or a fake claimed state.
- Authenticated users keep the existing local-wallet claim flow unchanged. That flow is pre-existing, documented debt (see `PAGE_REFACTOR_BATCH_1_REPORT.md` §7 — `useWallet` is a device-local balance, deliberately not yet reconciled with the real Supabase wallet, scoped to a future "Batch 5"). Reconciling the two wallet systems was out of scope for this batch and was not attempted.

## Files changed

- `src/app/page.tsx` — added Forecasts section, changed quick actions to 3 cards (Explore the issues / See what government is doing / View forecasts), added a `secondaryActions` row (Explore scenarios, Take action) below the quick-action grid, converted `HomePage` to an async server component.
- `src/app/globals.css` — added `.simple-secondary-actions`, `.simple-secondary-link`, `.simple-forecast-*` rules (monochrome, thin-border, newspaper-card styling consistent with the existing `simple-*` system) and one responsive rule.
- `src/components/DailyBonusBanner.tsx` — Forecasts terminology, real-auth gate, sign-in prompt for signed-out visitors.
- `src/lib/__tests__/homepage-forecasts.test.ts` (new) — 19 tests covering all items below.

## Tests and results

Authored and executed `src/lib/__tests__/homepage-forecasts.test.ts` (19 tests), following the repo's existing source-string regression pattern (`page-refactor-batch-1.test.ts`) plus direct behavioural tests against the real `getMarketEligibility()` helper. Covers:

- Forecasts section renders with label "Forecasts", placed after the decisions section and before the CTA
- Homepage never labels the section "Markets" or "Predictions"
- Data sourced from `getLiveBillMarkets()`/`predictions-db`, never `allMarkets`/`STATIC_NON_BILL_MARKETS`
- Eligibility gated through `getMarketEligibility(...).canStake`
- At most two forecasts shown
- Truthful empty state text and conditional rendering
- No staking controls (`onStake`, `StakeModal`, Yes/No buttons) on the homepage
- Links point to `/predictions`
- Quick actions: exactly 3 primary cards including "View forecasts"; scenarios/take-action demoted to `secondaryActions`
- Eligibility composition logic: excludes demo/voided/resolved statuses, caps at 2, returns empty (not mock data) when nothing is active
- Daily bonus banner: no "Markets" text, real-auth gate present, sign-in prompt text present, Claim button only reachable when authenticated

Commands run:

```
npx tsc --noEmit        → clean, no errors
npx vitest run          → 6 files, 122 tests passed (including the 19 new ones)
npm run build           → succeeded; `/` is now a dynamic (ƒ) route (expected — it fetches live data)
node scripts/secret-scan.mjs → no suspicious patterns found
```

## Known limitations / remaining route-terminology debt

- `/predictions` was not renamed; all homepage links point there, as instructed.
- The two wallet systems (`useWallet` local vs `usePredictionWallet` real) remain unreconciled; only the homepage banner's signed-out state was fixed in this batch. Authenticated users still claim into the local wallet, not the real Supabase one — pre-existing, previously-documented debt, out of scope here.
- `PredictionsPageClient` (the `/predictions` page itself) still blends genuine DB-backed bill markets with a static mock array (`STATIC_NON_BILL_MARKETS`) for non-bill categories. The homepage does not surface any of that static content, but `/predictions` itself was not touched and still has this known duplication (tracked separately in the constitution's "Current known product debt").
- No serif headline font exists yet in `globals.css` (`--font-heading` currently aliases to sans); the new Forecasts section matches the current homepage's existing sans-only styling rather than introducing a new typographic layer, consistent with "do not redesign the entire homepage."

## Production confirmation

No database or migration changes were made. No environment variables, secrets, or credentials were touched. Nothing was staged, committed, pushed, or deployed. `npm run build` ran locally only; no production system was accessed.
