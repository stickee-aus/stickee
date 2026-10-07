# Stickee — Page Refactor Batch 1 Report

Implementation report for `PAGE_REFACTOR_ROADMAP.md`'s Batch 1 ("Remove misleading and empty experiences"). No routes were renamed, merged, or redirected — this batch only fixed truthfulness and dead-control bugs in place, per scope.

---

## 1. Misleading experiences removed

- **Home page pillar cards linked to a broken id namespace.** `/issue/${pillar.id}` (pillar ids like `housing`, `cost-of-living`) never matched any real issue id (`housing-affordability`, `tax-cuts`, etc.), so every pillar card 404'd in the mock-fallback state. Fixed by giving each `PillarCard` a real DOM anchor (`id={pillar.id}`) and pointing the home page cards at `/impact#{pillar.id}` — `/impact` is the real, existing deep-dive of the exact same pillar data, not an invented page.
- **`/profile` rendered a hardcoded `DEMO_USER.isLoggedIn = true`.** Every visitor, signed in or not, saw a fake "logged in" dashboard with a fabricated name ("Demo User"), handle, and civic score. The page now uses `useAuthStatus()` (the same real Supabase-backed hook used elsewhere in the app) and shows a genuine signed-out state, a loading state while auth is resolving, and — for real signed-in users — their actual email instead of a fake identity.
- **`/profile`'s Score tab, Activity tab, and Predictions tab fabricated personal data.** `SCORE_BREAKDOWN` was a fixed array of invented percentages (72%/55%/48%) explicitly commented `mock — in production derived from real actions`. The Activity tab showed other mock users' feed posts as "your activity." The Predictions tab showed hardcoded picks against a **`Math.random()`-generated "crowd %" recomputed on every render**. All three are replaced with truthful empty states pointing to where the real thing lives (`/feed`, `/predictions`).
- **`WeeklyReportCard` (embedded in `/profile`) fabricated a percentile rank every render** — `"Top X% of users in NSW"` with `X` computed from a formula mixing real and invented numbers, plus a `Math.random()`-selected "top focus area" pillar. This is no longer rendered on `/profile`. The component file itself is left in place (now unused) — recommend deleting it in Batch 7's cleanup pass rather than in this batch, to keep the diff reversible.
- **`/notifications` masked the real empty state with 6 hardcoded demo notifications** whenever the real list was empty — meaning every new user saw fake notifications indistinguishable from real ones, and clicking one called `markRead()` against an id that didn't exist. `DEMO_NOTIFICATIONS` is removed entirely; the real empty state is now always reachable.
- **The embedded top-6 leaderboard on `/predictions` and the full `/leaderboard` page** both rendered the exact same hardcoded 12-user array (fake names, accuracy %, points, streaks) as if it were real. Both surfaces now show a restrained "predictor rankings aren't available yet" message instead. `/leaderboard` also dropped its fabricated `#14 "your rank"` and a `RankDelta` widget that manufactured a "you moved up 3 spots" signal from nothing.
- **`/campaigns` presented fabricated participant counts** (e.g. "31,847 of 50,000 Australians") as if they were a real, live tally, with milestone unlocks implied to be real civic outcomes. The page now labels this content as illustrative/example and does not claim the counts are live.
- **`/campaigns`' propose-a-campaign flow claimed** *"if it gets 100 upvotes from the community, we'll launch it officially"* and, on click, told signed-in users *"Campaign proposals are ready for the review flow"* — there is no upvote system, review queue, or launch pipeline anywhere in the codebase. This claim is removed and replaced with an honest "not connected to a review pipeline yet" notice.

## 2. Controls connected to real implementations

None of the audited controls had a genuine backend to connect to within this batch's scope (per the roadmap, building new voting/tracking/forecasting backends was explicitly out of scope). Where a control's *real* equivalent already exists elsewhere in the app, it's now linked instead of duplicated or faked:

- `PredictionMarketGrid` (embedded on `/issue/[id]`) now links to `/predictions`, where the same bill market (same `issue_id`) is genuinely stakeable via `usePredictionWallet` + `StakeModal`. Verified by tracing `getLiveBillMarkets()` / the mock fallback (`allMarkets.filter(category === 'bill')`) — the same id appears on both surfaces in both the Supabase-configured and mock-fallback states.
- `/campaigns`' cards now link to `/parliament`, the one place the real, API-connected `CampaignModal` (`POST /api/bills/[billId]/pressure`) already lives.

## 3. Controls removed or disabled

- **`DecisionCard`'s top-level CTA button** (`Predict Outcome` / `Agree / Disagree` / `Track Impact`) — its `onClick` only called `e.stopPropagation()`, so it visibly did nothing. Removed entirely. The card's real affordances (expand for detail, the inline Yes/No pick, Email MP when enabled) are unaffected. The inline pick's toast no longer implies the pick is "saved" anywhere — it now says "this session only, not saved to your account," since it's local React state with no persistence.
- **`PredictionMarketGrid`'s "Buy Yes" / "Buy No" buttons** on `/issue/[id]` had no `onClick` at all. Removed, along with the now-empty "Trade" column, and replaced with an honest link to the real staking flow (see §2).
- **`/campaigns`' "Join campaign" button** — local-state-only, incremented the *displayed public counter* and claimed "+50 pts" that were never awarded anywhere. Removed and replaced with a link to the real action surface (`/parliament`).
- **`/campaigns`' "Share +50pts" button** — the share action itself is real (native share sheet / clipboard), but the "+50pts" claim was fabricated. The share function is kept; the point claim is removed.
- **`/campaigns`' propose-campaign button** — removed (see §1); no functioning alternative exists yet, so the page now says so rather than pretending one does.

## 4. Files changed

```
src/app/page.tsx                          home page pillar-card links
src/components/PillarCard.tsx             real anchor id per pillar
src/app/profile/page.tsx                  full rewrite — real auth gate, truthful tabs
src/hooks/useNotifications.ts             added distinct `error` state
src/app/notifications/page.tsx            removed demo fallback, added loading/error/empty states
src/components/PredictionsPageClient.tsx  removed embedded fake leaderboard
src/components/LeaderboardGrid.tsx        full rewrite — honest "not available" state
src/app/leaderboard/page.tsx              full rewrite — removed fake rank/wallet display
src/components/DecisionCard.tsx           removed dead CTA button, honest pick-toast wording
src/components/PredictionMarketGrid.tsx   removed inert Buy buttons, added real link
src/app/campaigns/page.tsx                disabled fake join/propose, labeled demo content
src/components/DailyBonusBanner.tsx       hidden on /predictions (wallet audit, see §7)
src/lib/__tests__/page-refactor-batch-1.test.ts   new regression tests (see §5)
```

No routes were added, renamed, or deleted. `src/components/BillSmartRow.tsx` had a pre-existing uncommitted accessibility fix (nested-button hydration bug) from before this session — left untouched and not part of this batch.

## 5. Tests

**Authored and executed** — `src/lib/__tests__/page-refactor-batch-1.test.ts`, 23 tests, following the repo's existing source-string regression pattern (`mp-score-copy.test.ts`). Covers every fix in §1–3: home page links, profile auth gate and fabricated-data removal, notifications loading/error/empty distinction, leaderboard removal on both surfaces, DecisionCard's dead button, PredictionMarketGrid's dead buttons, campaigns' fake mechanics, and the DailyBonusBanner wallet-collision fix.

**Commands run:**
- `npx tsc --noEmit` — clean, no errors.
- `npx vitest run` — 44/44 tests pass (7 pre-existing `mp-score-copy`, 14 pre-existing `market-eligibility`, 23 new).
- `npm run build` — production build succeeds, all 54 routes generate.
- `node scripts/secret-scan.mjs` — no suspicious patterns found.

No manual browser testing was performed in this session (no UI verification against a running dev server) — recommend a manual pass on `/profile` (signed-in and signed-out), `/notifications`, `/predictions`, `/leaderboard`, `/campaigns`, and `/issue/[id]` before this lands, since several of these are conditional-render-heavy (auth state, hydration, Supabase-configured vs. mock fallback).

## 6. Fake data still remaining (explicitly out of scope for this batch)

Per the roadmap, Batch 1 fixes truthfulness/dead-control bugs only — it does not merge data models or rebuild backends. Known remaining mock content, unchanged by design:

- `/decisions` — still 100% hardcoded (19 items, no Supabase), including `DecisionCard`'s sentiment bar (`X% agree` computed from hardcoded like/dislike counts). Fixing this requires the Issues/Decisions data-model merge (Batch 3).
- `/campaigns`' participant counts and milestone numbers are still fabricated — now clearly labeled as example content rather than removed, per the instruction to prefer labeling over deleting when a real replacement doesn't exist yet.
- `/leaders`' disconnected "featured politicians" mock scorecard block, `/u/[handle]`'s 4 fictional citizen profiles, `/issue/[id]`'s 150-row MP-vote grid with its own unpersisted "predict how each MP votes" mini-game — untouched, out of this batch's file list.
- `ProposeMarketModal` on `/predictions` (`localStorage`-only "pending review" proposals) — untouched.
- `/profile`'s referral flow ("+250 pts" for a successful referral) — the link-copy mechanic is real; whether the 250pt reward is actually paid out on a successful referral was not verified and is not claimed as fixed here. Flagged for a future pass, not fixed in this batch (no referral tracking/attribution system was found).

## 7. Wallet-system findings

Confirmed two independent, unsynced point-balance systems, exactly as flagged in the audit docs:

| System | Backing | Used on |
|---|---|---|
| `useWallet` | `localStorage` (`stickee_wallet_v2`) | `/profile`, `/leaderboard` (now removed), `DailyBonusBanner` (global), `WeeklyReportCard` (now unused) |
| `usePredictionWallet` | Real Supabase (`wallets` table, authenticated) | `/predictions` only |

**Collision found and fixed in this batch:** `DailyBonusBanner` is mounted globally in `src/app/layout.tsx` and displays/claims `useWallet`'s localStorage balance on every page — including `/predictions`, which simultaneously shows the real `usePredictionWallet` balance in its own panel. A user could see two different "points" numbers in the same view. Fixed by hiding the banner on `/predictions` (`DailyBonusBanner.tsx`'s new `HIDDEN_ON_PREFIXES`) rather than reconciling the two systems, per the roadmap's explicit instruction not to redesign wallets in this batch.

**Not fixed (correctly deferred to Batch 5 per the roadmap):** the two systems still exist independently. `/profile`'s streak-freeze purchase still spends `useWallet`'s local balance — this is now explicitly labeled in the UI ("stored on this device, not your account") rather than presented as an account balance. Reconciling `useWallet` and `usePredictionWallet` into one system is real data-migration work (which balance wins, or whether `useWallet` becomes a clearly-named separate "practice" currency) that the roadmap correctly scopes to Batch 5, gated on real-database verification per the constitution's rule for anything wallet-adjacent.

## 8. Recommended next batch

Per `PAGE_REFACTOR_ROADMAP.md`'s sequencing, **Batch 2 (navigation consistency)** is the next low-risk, independent batch — it touches only `Navbar.tsx`/`BottomNav.tsx`/`CommandPalette.tsx` and requires no data-model decisions. It can land before or in parallel with further truthfulness work. Batch 3 (Issues/Decisions consolidation) is the next load-bearing batch but requires an owner decision on the data-model merge strategy first, per the roadmap.

## 9. Production safety

No database, migration, or deployment operations were performed. No files were staged, committed, pushed, or deployed. All changes are local, uncommitted working-tree edits, consistent with the task instructions.
