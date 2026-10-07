# Design System Phase 3A — Home Page Migration Report

Date: 2026-08-05. Scope: `src/app/page.tsx` only, per `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` Phase 3A. Issues, Government, Parliament, Forecasts, People, account pages, admin pages, and modals were **not** migrated — that's Phase 3B onward.

## 1. Homepage structure — before and after

**Before** (approved composition items in brackets):

1. `.simple-hero` — two-column grid: headline/copy/CTAs on the left, a live-looking `.simple-score-card` ("Australia today", `56`-style National Civic Score, "Mixed" badge) on the right. **[Hero + National snapshot bolted together]**
2. `.simple-quick-section` — 3 icon quick-action cards (Issues/Government-as-decisions/Forecasts) + 2 secondary text links (Simulator, Campaigns). **[Primary destinations]**
3. "What's getting better — and worse" — a 4-card grid driven by `CIVIC_PILLARS` mock data (score, trend arrow, "Improving"/"Under pressure" label). **[A second, redundant National-snapshot-shaped section]**
4. `.simple-decisions-wrap` — "Recent decisions, decoded", 3 rows pulled from the hardcoded `DECISIONS` mock array, each with an impact badge. **[Government activity]**
5. Forecasts section (added in the prior, already-truthful batch — see `HOMEPAGE_FORECASTS_BATCH_REPORT.md`) — real `getLiveBillMarkets()` data. **[Forecasts]**
6. `.simple-cta` — "Make it yours" personalisation banner. **[Personalisation]**

**After** — matches the approved composition 1:1, with the redundant second snapshot section folded into one:

1. **Hero** — single-column, centered, serif headline ("Know what's changing. Know what to do."), two `LinkButton` primary actions (Explore the issues / Personalise my brief). No score card.
2. **Primary product destinations** — one `SectionHeader` ("Where to start") + three `ArticleCard`s (Issues / Government / Forecasts, matching `src/lib/navigation.ts`'s canonical labels exactly) + the same two secondary text links.
3. **National snapshot** — one `SectionHeader` + one `EmptyState`: *"Verified national indicators are being prepared."* Replaces both the old hero score card and the pillar grid — there was never two real sections here, just one fabricated claim rendered twice.
4. **Government activity** — one `SectionHeader` (with an "All decisions →" link) + one `EmptyState`: *"Verified government decisions are being prepared."*
5. **Forecasts** — unchanged data logic (`getLiveBillMarkets()` + `getMarketEligibility().canStake`, capped at 2, real `EmptyState` when none are open), re-skinned onto `ArticleCard`/`EmptyState`.
6. **Personalisation CTA** — same copy and destination (`/onboarding`), re-skinned onto a bordered `PageShell`-width panel with a `LinkButton`.

Wrapper structure: hero is a bespoke full-bleed `<section>` (border-b only, no background band); sections 2–6 sit inside one `PageShell` (max-w-5xl, consistent gutters), separated by `space-y-16` rather than the old alternating full-bleed colour bands — this is a deliberate change, not an oversight: alternating background bands were themselves a homepage-only pattern no other page uses or will use, and the goal of this batch is that the homepage *is* what other pages copy.

## 2. Shared primitives adopted

| Primitive | Used for |
|---|---|
| `PageShell` | The single container for every section below the hero |
| `SectionHeader` | Every section title (Where to start / National snapshot / Government activity / Forecasts) |
| `ArticleCard` | The 3 primary-destination cards and the (up to 2) real forecast cards |
| `EmptyState` | National snapshot, Government activity, and the no-active-forecasts state — three of this batch's four truthful-absence messages |
| `LinkButton` (existing, not new — `src/components/LinkButton.tsx`) | Both hero CTAs and the final personalisation CTA button |
| `buttonVariants` (existing, from `ui/button.tsx`) | `DailyBonusBanner`'s Sign in/Claim/Forecasts buttons |

**Deliberately not used:** `PageHeader` (the hero is a marketing hero, not a list-page header — forcing it into `PageHeader`'s eyebrow/title/summary/metric shape would have shrunk the headline and lost the "strong hero" the brief asked to preserve); `RecordRow`/`StatusLabel`/`MetadataLine`/`UnderlineTabs`/`EvidenceBlock` (no dense list, status badge, sourced claim, or filter exists on this page — forcing them on would be decoration, not consistency, per the brief's own instruction not to force every primitive).

## 3. `.simple-*` usage — removed vs. retained

**Retained** (still consumed by `Navbar.tsx`/`BottomNav.tsx`, confirmed by repo-wide grep before touching anything): `.simple-nav`, `.simple-brand`, `.simple-brand-mark`, `.simple-nav-link` (+ `:hover`/`.is-active`), `.simple-support-link`, `.simple-bottom-nav`.

**Removed outright** (grep-confirmed zero remaining consumers once `page.tsx` was rewritten): `.simple-home`, `.simple-shell`, `.simple-hero`/`.simple-hero-grid`/`.simple-hero-actions`, `.simple-eyebrow`/`.simple-kicker`/`.simple-lede`, `.simple-button`/`.simple-button-primary`/`.simple-button-secondary`/`.simple-button-light`, `.simple-score-*`, `.simple-live`, `.simple-card-link`, `.simple-quick-*`, `.simple-icon-box`, `.simple-section*`, `.simple-issue-*`, `.simple-trend*`, `.simple-read-more`, `.simple-decisions-wrap`/`.simple-decision-*`, `.simple-impact`, `.simple-cta`, `.simple-secondary-*`, `.simple-forecast-*`, plus their two responsive `@media` blocks.

The homepage now imports zero `.simple-*` classnames. `globals.css` carries a comment marking exactly this at the point the block was deleted.

## 4. Unsupported content removed

- **National Civic Score** (`nationalCivicScore(CIVIC_PILLARS)`, the `56/100`-style numeral, the "Mixed"/"Tracking well" label) — removed. Confirmed by direct code search that no application code anywhere reads the real `pillar_metrics`/`pillar_scores`/`pillar_time_series` tables (they exist only in the generated `database.types.ts`); `/impact` — the page this section was supposed to summarise — is itself 100% `mock-civic-data.ts`. There is no verified indicator data to show, so none is shown.
- **Pillar trend grid** ("What's getting better — and worse", the improving/under-pressure badges) — removed for the same reason; this was the same fabricated claim as the score, rendered a second time.
- **Mock "recent decisions"** (`DECISIONS` from `mock-government-data.ts`, impact badges, level/status copy) — removed. `/decisions` itself has no Supabase read at all today (confirmed in `STICKEE_SYSTEM_ARCHITECTURE.md`'s Government Record System entry) — there is no genuine record to summarise on the homepage.
- Per instruction, the Forecasts section's already-real data path (`getLiveBillMarkets()`/`getMarketEligibility().canStake`) was preserved exactly as-is — no logic touched, only re-skinned.

## 5. Visual consistency improvements

- The homepage no longer maintains an independent visual grammar — every section uses the same primitives, tokens, and type scale (`font-heading`/`.text-*` classes) that Phase 2 built for every future page to share.
- `DailyBonusBanner` (the one other homepage-visible component, per Phase I's explicit scope) had its hardcoded dark-theme hex (`#041008` background, `#0e3020` border, `#2ec266` text/icon/button) replaced with `bg-card`/`border-border`/`text-foreground`/`var(--civic-accent)` and the shared `buttonVariants` — it had been rendering a dark, off-palette green banner on top of the now-light page.
- All three primary-destination cards, all forecast cards, and the empty states now share one card/empty-state shape instead of three different bespoke ones.

## 6. Accessibility checks

No axe/Lighthouse/browser accessibility tool was available in this environment (see §8) — the following is a source/token-level review, not a verified audit:

- **Heading order:** one `<h1>` (hero) → `<h2>`s via `SectionHeader`/the CTA panel, in document order, no skipped levels.
- **Landmarks:** `page.tsx` renders no extra `<main>` — the root `layout.tsx` already provides the single `<main>` landmark; avoided a duplicate-landmark regression.
- **Keyboard focus:** relies on the global `:focus-visible { outline: 2px solid var(--civic-accent) }` rule shipped in Phase 1 — every link/button on this page is a real `<a>`/`<button>` (via `Link`/`LinkButton`/`buttonVariants`), none are `<div onClick>`, so native focus order and keyboard activation are preserved.
- **Link purpose:** every link's visible text names its destination in context (e.g. "Explore Issues", "See all forecasts", "All decisions") rather than a bare "click here"/"→".
- **Contrast:** body text is `--ink` (#15171B) on `--paper`/`--paper-raised` (#F7F7F4/#FFFFFF) — high contrast; the one accent-coloured element on the page (`DailyBonusBanner`'s icon) is decorative, not the sole carrier of the adjacent text's meaning.
- **Readable line length:** hero paragraph is capped at `max-w-xl` (~576px) at 15px body size — roughly a 65–75 character measure.
- **No colour-only meaning:** the two `EmptyState`s and the Forecasts empty state pair an icon with explicit text; nothing on this page communicates status by colour alone (no `StatusLabel` usage here since no status exists to show).
- **Mobile layout:** all grids (`grid gap-4 md:grid-cols-3`, `md:grid-cols-2`) collapse to a single column below `md` by default (Tailwind mobile-first) — not independently verified in a real viewport (see §8).
- **Reduced motion:** the page introduces no new animation; it relies on the global `@media (prefers-reduced-motion: reduce)` rule from Phase 1, and (per the new Phase 3A tests) contains no `transform`/`translateY`/hover-scale of its own.

## 7. Tests and results

Three files touched:

- **New:** `src/lib/__tests__/phase-3a-home.test.ts` (22 tests) — covers every bullet in the batch's Phase K checklist: primitive usage, serif font on the hero, no gradient/hover-lift/orange, no fake score, no mock decisions, no fake percentages, Forecasts empty state, primary actions present, nav-terminology consistency (cross-checked directly against `src/lib/navigation.ts`'s `PRIMARY_NAV`), no pill-shaped actions.
- **Updated:** `src/lib/__tests__/homepage-forecasts.test.ts` (21 tests, was 19) — rewritten to match the new markup while preserving every behavioural guarantee it originally pinned (real data source, eligibility gate, ≤2 cards, truthful empty state, no staking controls, `/predictions` links, 3 primary destinations, secondary actions retained); added one new test that `DailyBonusBanner` no longer hardcodes the removed dark hex values.
- **Updated:** `src/lib/__tests__/page-refactor-batch-1.test.ts` — the one test asserting pillar cards linked to `/impact#${pillar.id}` was superseded (there are no pillar cards on the homepage anymore) and replaced with a test asserting the mock grid is gone and the truthful empty state is present; `PillarCard.tsx` itself (used elsewhere, e.g. `/impact`) is untouched and still tested.
- **Updated:** `src/lib/__tests__/navigation.test.ts` — one assertion that pinned the exact old copy "See what government is doing" was loosened to check for the new "Government" terminology instead, preserving its original intent (never regress to the ambiguous "See decisions" label).

Commands run:

```
npx tsc --noEmit          → clean (after fixing a CSS-comment bug below)
npx vitest run            → 8 files, 197/197 passed (73 new/updated, zero regressions)
npm run build              → succeeded, all 46 routes compiled; `/` is still a dynamic (ƒ) route
node scripts/secret-scan.mjs → no suspicious patterns found
```

**One real bug caught and fixed during this batch:** a comment I wrote in `globals.css` marking the deleted `.simple-*` block contained the literal sequence `*/` inside `.simple-brand*/` — this terminated the CSS comment early and broke `next build`'s CSS parser (surfaced as a `CssSyntaxError` during a mid-task build). Reworded the comment to avoid any `*/`-shaped substring and reconfirmed with a full rebuild. (Same class of bug as a JSDoc `*/` issue caught in the Phase 1/2 batch — worth remembering when writing comments that describe glob-like class-name patterns near either language's comment syntax.)

## 8. Visual verification performed

**No browser or screenshot tool was available in this environment** — the following is the strongest verification possible without one, and should not be read as a substitute for an actual visual pass at desktop/tablet/mobile widths:

- Used the repo's own already-running dev server (an existing `next dev` process, not one newly started, to avoid disrupting other in-progress work) and fetched `/`, `/issues`, `/decisions`, `/predictions`, `/leaders` — all `200`.
- Fetched the rendered homepage HTML and confirmed the new content markers are present (`"Verified national indicators are being prepared."`, `"Verified government decisions are being prepared."`, `"Where to start"`, the hero headline) and that old markers are fully absent (`simple-hero`, `simple-score-card`, `"Mixed results"`, `"National Civic Score"` — zero occurrences).
- Fetched the compiled CSS bundle and confirmed zero remaining occurrences of the deleted homepage-only selectors (`.simple-hero`, `.simple-score-card`, `.simple-issue-card`, `.simple-cta`), confirmed the Navbar/BottomNav-shared selectors are still present, and confirmed `--civic-accent`/`--radius` resolve to the expected token values.
- Spot-fetched `/issues`, `/decisions`, `/predictions`, `/leaders` HTML and grepped for `shadow-2xl`/`shadow-xl` (0 hits in each page's server-rendered HTML — though client-only elements like `CommandPalette` wouldn't appear here) and `rounded-full` (1–2 hits each) — consistent with the known, documented, not-yet-migrated debt on those pages; not a new finding.
- **Not done:** an actual rendered screenshot at desktop/tablet/mobile breakpoints, real keyboard-navigation walkthrough, or contrast-ratio measurement tool. Recommend a real browser pass (and ideally axe/Lighthouse) before this ships, same recommendation carried over from the Phase 1/2 report.

## 9. Remaining inconsistencies across other pages

Unchanged from the Phase 1/2 report, still true after this batch: `/predictions` and `/leaders` still carry hardcoded off-palette hex (`#0a0a0b`-family) in `MarketCard`, `StakeModal`, `TwoHousesExplainer`'s party colours, etc.; `CommandPalette` still has its own `shadow-2xl`/`rounded-2xl` (not visible in the server-rendered HTML checked above, since it's a client-only overlay); ~225 `rounded-full` usages and ~28 `shadow-*` usages remain across untouched pages. New, specific to this batch: **`/impact` is now the most visible remaining inconsistency** — it still renders the exact fabricated `56/100`-style National Civic Score the homepage just removed, so a user clicking from Home's honest "Verified national indicators are being prepared." straight to `/impact` would see the opposite of what Home just told them. This is the same underlying data problem (no real `pillar_metrics` source), just not yet fixed on its own page.

## 10. Recommended Phase 3B scope

**Issues** (`/issues`) first, matching the Phase 1/2 report's original recommendation and now doubly justified: it's the destination the new homepage's first primary card and first hero CTA both point to, so it's the very next page a user following Home's own navigation will land on. Recommend fixing `/impact` in the same batch or immediately after — it's now the one page most visibly contradicting the homepage's newly-honest tone, and the fix is presentational (swap the fabricated score for the same truthful empty state Home now uses), not a new data pipeline.

## Files changed

Modified: `src/app/page.tsx` (full rebuild), `src/app/globals.css` (deleted dead `.simple-*` rules), `src/components/DailyBonusBanner.tsx` (re-themed onto tokens, no logic change).

Updated tests: `src/lib/__tests__/homepage-forecasts.test.ts`, `src/lib/__tests__/page-refactor-batch-1.test.ts`, `src/lib/__tests__/navigation.test.ts`.

New: `src/lib/__tests__/phase-3a-home.test.ts`, `DESIGN_SYSTEM_PHASE_3A_HOME_REPORT.md` (this file).

Also updated: `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` (Phase 3A marked complete, Phase 3B scoped), `CIVIC_DESIGN_SYSTEM.md` (ground-truth correction noting Home's violations are resolved and `/impact`'s are not).

Not touched: `/issues`, `/decisions`, `/government`, `/parliament`, `/predictions`, `/leaders`, `/impact`, any account/admin page, any modal, any database/migration file, any wallet/settlement/authentication code, any route definition.

## Production safety confirmation

No `git add`/commit/push. No deploy. No database or migration operation. No environment file, credential, or secret was read, written, or printed (`node scripts/secret-scan.mjs` confirms). All changes are local, uncommitted working-tree edits plus new files, exactly as scoped.
