# Stickee — Page Refactor Batch 2 Report

Implementation report for `PAGE_REFACTOR_ROADMAP.md`'s Batch 2 ("Navigation consistency and terminology cleanup"). No route folders were renamed, no redirects were created, and no data models were touched — this batch only unified navigation labels/structure and public-facing terminology. See `PAGE_REFACTOR_BATCH_1_REPORT.md` for the prior batch this builds on.

---

## 1. Navigation — before and after

**Desktop `Navbar`**
- Before: logo → `/` (no text label), then `Issues · Decisions · People · Simulator` (4 items, no Today, no Forecasts, "People" already correct but inconsistent with mobile's other labels).
- After: `Today · Issues · Government · Forecasts · People` (the approved 5), each with `aria-current="page"` when active. `Support` remains a separate, secondary link outside this group.

**Mobile `BottomNav`**
- Before: `Home · Issues · Decisions · People · Test` (5 items, but "Home"/"Decisions"/"Test" all diverged from desktop's own labels for the same destinations).
- After: `Today · Issues · Government · Forecasts · People` — identical labels, order and destinations to desktop, sourced from the same config.

**⌘K `CommandPalette`**
- Before: a fourth, independent registry — `Dashboard` (`/`), `Feed`, `Parliament`, **`Decisions` → `/government`** (a bare redirect, not `/decisions`), `Issues & Bills`, `Campaigns`, `Predictions` (`/predictions`), `Leaderboard`, `Notifications`, `My Profile`.
- After: the "Navigation" group now leads with the same five primary items (`Today`, `Issues`, `Government → /decisions`, `Forecasts`, `People`), pulled directly from the shared config, followed by secondary destinations (`Feed`, `Parliament`, `Campaigns`, `Leaderboard`, `Notifications`, `My Profile`, `Support`). The old `Decisions → /government` entry — which sent users through a pointless redirect hop to reach the very route the *new* Government item now points to directly — is gone.

**Footer**
- Audited: **no footer navigation exists anywhere in the codebase** (confirmed by `INFORMATION_ARCHITECTURE_AUDIT.md` and a repo search — no `<footer>` component, nothing rendered in `layout.tsx`). Per the task's own list of "keep as secondary" links (`Support`, `Privacy`, `Terms`, `About`), only `Support` and `Privacy`/`Terms`-adjacent routes exist today (`/donate` is real; `/privacy`, `/terms`, `/about` do not exist at all — a pre-existing gap `PAGE_AND_ROUTE_INVENTORY.md` already flags as "requiring owner review"). **No footer was created in this batch** — inventing one with links to non-existent `/privacy`/`/terms`/`/about` routes would reintroduce exactly the kind of broken-link bug Batch 1 removed. `Support` remains reachable via the existing header link. This is called out below as a deferred item, not silently skipped.

## 2. Terminology changes

| Old / inconsistent | New | Where |
|---|---|---|
| "Decisions" (as a nav label) | "Government" | Navbar, BottomNav, CommandPalette |
| "Home" (mobile only) | "Today" | BottomNav |
| "Test" (mobile only) | *(removed — Simulator is no longer a primary nav item, per approved 5)* | BottomNav |
| "Markets — Stickee" / "Civic Prediction Markets" (page title) | "Forecasts — Stickee" | `src/app/predictions/layout.tsx` |
| "Leaders — Stickee" / "Civic Leaders" (page title) | "People — Stickee" | `src/app/leaders/layout.tsx` |
| *(no dedicated title)* | "Government — Stickee" | new `src/app/decisions/layout.tsx` |
| "Australia · Parliament & Leaders" | "Australia · People" | `/leaders` page header |
| "Australia · Federal Parliament" | "Government · Federal Parliament" | `/parliament` page header |
| "Australia · Prediction Leaderboard" | "Forecasts · Leaderboard" | `/leaderboard` page header |
| "Australia · Prediction Markets" / "{n} markets" | "Australia · Forecasts" / "{n} forecasts" | `/predictions` page header |
| "All Markets" (filter chip) | "All Forecasts" | `/predictions` |
| "Market board" (section eyebrow) | "Forecast board" | `/predictions` |
| "Prediction Market" (`<h2>`) | "Forecast" | `PredictionMarketGrid` (embedded on `/issue/[id]`) |
| "← Leaders" (back link) | "← People" | `LeaderProfileDetail` (`/leaders/[id]`) |
| "Simulate this bill/decision/leader/campaign/market" | "Explore scenarios for this bill/decision/…" | `SimulateThisButton`'s default label (used app-wide — issue pages, MP pages, campaigns, market cards, leader profiles) and `FeaturedMarketCard`'s explicit override |
| "See decisions" (homepage quick action) | "See what government is doing" | `/` |
| "Test an idea" (homepage quick action) | "Explore scenarios" | `/` |

`/decisions` also gained an explicit, honest framing it didn't have before: an eyebrow tag reading "Government" above its `<h1>Decisions</h1>`, plus a line clarifying *"This is Stickee's Government section for now — it doesn't yet include the full parliamentary record,"* linking to `/parliament` for the real evidence layer. This satisfies the task's requirement to mark `/decisions` as the temporary Government destination without claiming it's the whole thing.

**Not renamed:** the word "market"/"markets" as a *domain/mechanic* term (stake amounts, `MarketCard`, `StakeModal`, category filter chips like "Bills"/"Elections"/"MP Votes", footer captions like "3 markets · Points are virtual…") was left alone. The inconsistency the task flags is *product-section naming* ("Markets" vs "Predictions" as two different names for the same destination), not the underlying vocabulary of a prediction-market mechanic — renaming every occurrence of "market" would touch the market data/staking components the task explicitly says not to migrate in this batch.

## 3. Shared navigation configuration

**Established:** `src/lib/navigation.ts` is now the single source of truth for the five primary sections (`id`, `label`, `href`, `icon`, `activePrefixes`) plus `SECONDARY_NAV` (`Support → /donate`). It exports `isPrimaryNavItemActive()` and `activePrimaryNavId()` — pure functions, unit-tested directly (see §5) — so active-state logic isn't duplicated as ad-hoc `pathname.startsWith(...)` checks in three different components.

`Navbar.tsx`, `BottomNav.tsx` and `CommandPalette.tsx` all now import from this one file instead of declaring their own arrays. `CommandPalette`'s secondary entries (Feed, Parliament, Campaigns, Leaderboard, Notifications, Profile) remain a separate, palette-specific list, per the task's instruction to let secondary-navigation entries stay separate rather than forcing everything into one array.

## 4. Active-state logic

Government, Forecasts and People still point at legacy routes, so active-state is prefix-based rather than exact-match:

- **Today** — exact match on `/` only.
- **Issues** — `/issues` plus the legacy singular detail route `/issue/[id]`.
- **Government** — `/decisions` (its href) plus `/government` and `/parliament`. No dedicated `/election*` route exists anywhere in the codebase today (live election results are an embedded widget on `/predictions`/`/leaders`, not a standalone route) — so there was nothing further to wire up here; noted as a gap below.
- **Forecasts** — `/predictions`.
- **People** — `/leaders` (its href) plus `/mp`.

This is implemented as one small shared helper (`isPrimaryNavItemActive`) rather than a hardcoded list of exact URLs, so a new sub-route under an existing prefix (e.g. a future `/parliament/bills/[id]`) activates the right section automatically.

## 5. Files changed

```
src/lib/navigation.ts                        new — shared primary/secondary nav config + active-state helpers
src/components/Navbar.tsx                     desktop nav now reads from shared config, adds Today, aria-current
src/components/BottomNav.tsx                  mobile nav now reads from shared config (was its own array)
src/components/CommandPalette.tsx             primary items sourced from shared config; fixed /government → /decisions
src/app/predictions/layout.tsx                title: Forecasts
src/app/leaders/layout.tsx                    title: People
src/app/decisions/layout.tsx                  new — title: Government
src/app/decisions/page.tsx                    "Government" eyebrow + honest temporary-destination note
src/app/parliament/page.tsx                   eyebrow now reads "Government · Federal Parliament"
src/app/leaders/page.tsx                      eyebrow now reads "Australia · People"
src/app/leaderboard/page.tsx                  eyebrow now reads "Forecasts · Leaderboard"
src/components/PredictionsPageClient.tsx      "Forecasts"/"forecasts" replaces "Prediction Markets"/"markets" in headers
src/components/PredictionMarketGrid.tsx       "Forecast" replaces "Prediction Market" heading
src/components/LeaderProfileDetail.tsx        "← People" replaces "← Leaders"
src/components/simulator/SimulateThisButton.tsx  default labels use "Explore scenarios"
src/components/FeaturedMarketCard.tsx         explicit SimulateThisButton label updated to match
src/app/page.tsx                              homepage quick-action labels updated
src/lib/__tests__/navigation.test.ts          new — 36 regression tests (see §6)
```

No route folders were renamed. No redirects were added. `/government`, `/predictions`, `/leaders`, `/decisions` all still resolve exactly as before. `src/components/BillSmartRow.tsx` retains the pre-existing, unrelated accessibility fix from before this session — untouched.

## 6. Tests

**Authored and executed** — `src/lib/__tests__/navigation.test.ts`, 36 tests:
- Primary nav has exactly the 5 approved labels in order, with the correct temporary hrefs.
- Support is confirmed secondary (present in `SECONDARY_NAV`, absent from `PRIMARY_NAV`).
- Active-state mapping tested directly against `activePrimaryNavId()` (not string-matched) for every path the task lists: `/`, `/issues`, `/issue/[id]`, `/decisions`, `/government`, `/parliament`, `/predictions`, `/leaders`, `/mp/[id]`, plus negative cases (`/campaigns`, `/profile` → no primary section) and a check that no pathname ever activates two primary items at once.
- Regression assertions that Navbar/BottomNav/CommandPalette import the shared config rather than redefining their own arrays, and that the old inconsistent labels (`Home`, `Test`, `Decisions`, `Leaders` as nav labels; `Decisions → /government`) are gone.
- Page-title and contextual-link terminology assertions for every fix in §2.

**Commands run:**
- `npx tsc --noEmit` — clean (after regenerating `.next/types` via a build; see note below).
- `npx vitest run` — **80/80 tests pass** (7 pre-existing `mp-score-copy`, 14 pre-existing `market-eligibility`, 23 Batch 1, 36 new Batch 2).
- `npm run build` — production build succeeds, all 54 routes generate.
- `node scripts/secret-scan.mjs` — no suspicious patterns found.

**Note:** adding `src/app/decisions/layout.tsx` (new) left Next's typed-routes cache (`.next/dev/types` vs `.next/types`) briefly out of sync — a stale-generated-file mismatch between the running dev server and the last production build, not a real code error. It cleared after running `npm run build`, which regenerates `.next/types` to match the current route tree. No source files were affected; a running `next dev` process was left untouched (not restarted or killed).

No manual browser testing was performed in this session — recommend a manual pass over keyboard navigation (focus order through the 5 primary items, `aria-current` announcing correctly), the mobile bottom nav at a real viewport width, and the ⌘K palette's grouped results before this lands.

## 7. Known inconsistencies deferred to later batches

- **`/feed`'s internal filter chip and stat label still say "Leaders"** (`type === 'leader_update'` post category) rather than "People." `/feed` was not in this batch's "at minimum inspect" list, and its "Leaders" here labels a *content type* inside the Feed's own filter UI, not a navigation destination — left untouched to avoid scope creep, but flagged for whoever does Feed's eventual re-scope (`PAGE_REFACTOR_ROADMAP.md`'s Feed/Community item).
- **No `/election*` route exists** for the "election-related routes should activate Government" requirement to apply to — live election data is an embedded widget (`LiveElectionPulse`, `useLiveElection`) on `/predictions` and `/leaders`, not a standalone page. Nothing to wire up until such a route exists (see `PROPOSED_ROUTE_TREE.md`'s Elections section, scoped as contextual/seasonal, not a route).
- **No footer exists** (see §1) — `/privacy`, `/terms`, `/about` remain unbuilt, which is the actual blocker to adding one truthfully, not a navigation-consistency problem this batch can resolve.
- **`/government` is still a bare redirect to `/decisions` with no identity of its own** — the approved nav intentionally routes the "Government" label straight to `/decisions` rather than through `/government`, so this redirect is now unused by any nav surface, but the route file itself is untouched (removing/repurposing it is Batch 7 cleanup or the eventual `/government` hub work, not this batch).
- **`/campaigns`, `/simulator`'s own page identity, and `/impact`** were reviewed but needed no terminology changes beyond what's listed in §2 — their existing public copy didn't conflict with the approved terms.

## 8. Recommended next batch

Per `PAGE_REFACTOR_ROADMAP.md`, **Batch 3 (Consolidate Issues and Bills)** is next in the dependency chain — it's the load-bearing batch for 4, 5 and 6, but requires an owner decision on the Issues/Decisions data-model merge strategy before starting (one Supabase table vs. presentation-layer merge of two sources), per the roadmap's explicit flag. Batch 2's navigation work does not block or get blocked by that decision, so it was safe to land independently as the roadmap intended.

## 9. Production safety

No database, migration, or deployment operations were performed. No files were staged, committed, pushed, or deployed. All changes are local, uncommitted working-tree edits. The one build/tsc run in §6 was local verification only (no deploy).
