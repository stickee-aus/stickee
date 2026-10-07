# Stickee V1 — Cross-Page Consistency Sprint

Governed by [`AGENTS.md`](AGENTS.md) and [`docs/philosophy/STICKEE_CHARTER.md`](docs/philosophy/STICKEE_CHARTER.md) — a consistency pass across the eight core surfaces that have each already been through their own Charter-governed V1 batch (`ISSUES_V1_SIMPLIFICATION_REPORT.md`, `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`, `PEOPLE_V1_REFINEMENT_REPORT.md`, `FORECASTS_V1_SIMPLIFICATION_REPORT.md`, `ISSUE_DETAIL_V1_REPORT.md`, `POLITICAL_PULSE_V1_REPORT.md`). This sprint does not redesign any page's purpose, information architecture, or data model — it audits and fixes *how consistently* the shared Civic Design System vocabulary (`PageShell`, `PageHeader`, `SectionHeader`, `RecordRow`, `StatusLabel`, `MetadataLine`, `UnderlineTabs`, `EmptyState`, `Skeleton`, `LinkButton`) is actually applied across all eight surfaces, and closes the gaps found. Nothing was staged, committed, pushed, or deployed. Production was not accessed. No schema, route, or feature was added.

---

## 1. Audit matrix (before)

Read directly from source (`src/app/page.tsx`, `IssuesPageClient.tsx`, `issue/[id]/page.tsx`, `parliament/page.tsx` + `ParliamentExperienceClient.tsx` + `ChamberSummaryCard.tsx`, `PredictionsPageClient.tsx`, `leaders/page.tsx`, `mp/[id]/page.tsx`, `PoliticalPulseClient.tsx`), not inferred from prior reports alone.

| Dimension | Today | Issues | Issue Detail | Government/Parliament | Forecasts | People | MP Profile | Political Pulse |
|---|---|---|---|---|---|---|---|---|
| **PageShell width** | Hero: bespoke `max-w-3xl`; body: `PageShell` default (`max-w-5xl`) | default | **`width="narrow"` (`max-w-2xl`)** | default | `width="default"` (explicit) | default | default | default |
| **Top spacing** | Hero `py-16 md:py-24`; `PageShell` `py-10` | `py-10` | `py-10` | `py-10` | `py-10` | `py-10` | `py-10` | `py-10` |
| **PageHeader pattern** | N/A — bespoke marketing hero (documented exception, `DESIGN_SYSTEM_PHASE_3A_HOME_REPORT.md`) | `PageHeader` | `PageHeader` | `PageHeader` | `PageHeader` | `PageHeader` | **No `PageHeader` — bespoke avatar-identity header** | `PageHeader` |
| **Eyebrow format** | "Australia, in plain English" (hero, not an eyebrow) | `Australia · Issues` | *(none — detail page)* | **`Government · Federal Parliament`** ← inconsistent | `Australia · Forecasts` | `Australia · People` | *(none — profile page)* | `Australia · Civic record` |
| **Title size** | Bespoke hero `clamp()` | `text-page-title` | `text-page-title` | `text-page-title` | `text-page-title` | `text-page-title` | `text-2xl font-bold` (bespoke, avatar header) | `text-page-title` |
| **Summary width** | `max-w-xl` | `max-w-2xl` (PageHeader default) | `max-w-2xl` | `max-w-2xl` | `max-w-2xl` | `max-w-2xl` | N/A | `max-w-2xl` |
| **Headline metric placement** | N/A (correctly absent) | `PageHeader.metric` | N/A (detail page) | `PageHeader.metric` | `PageHeader.metric` | `PageHeader.metric` | N/A | `PageHeader.metric` |
| **Metadata/source line** | N/A | `MetadataLine` via `PageHeader` | `MetadataLine` via `PageHeader` + `EvidenceBlock` | `MetadataLine` via `PageHeader` | `MetadataLine` via `PageHeader` (source only — correct, page mixes real+demo rows) | `MetadataLine` via `PageHeader` | `MetadataLine`, called directly (not via `PageHeader`) | `MetadataLine` via `PageHeader` |
| **Section heading style** | `SectionHeader` | *(single block, none needed)* | `SectionHeader` ×8 | `SectionHeader` throughout | `SectionHeader` | `SectionHeader` | Bespoke `<h2 className="font-semibold">` ×3 (icon-led cards, not `SectionHeader`) | `SectionHeader` per date group |
| **Section spacing** | `space-y-16` | N/A | `mt-8` per section | `space-y-10` | `mt-8`/`mt-10` mixed | `mt-8`/`mt-10` mixed | `mb-6`/`mb-4` mixed | `mb-8` per group |
| **Row/card component** | `ArticleCard` | `RecordRow` | `RecordRow` (Related), `EvidenceBlock` | `RecordRow` | `RecordRow` (via `MarketCard`) | `RecordRow` | *(no list — single profile)* | `RecordRow` |
| **Filter component** | N/A | `UnderlineTabs` | N/A | `UnderlineTabs` (chamber, inside `ChamberSummaryCard`) | `UnderlineTabs` ×2 (category, status) | `UnderlineTabs` (chamber) | N/A | `UnderlineTabs` |
| **Status treatment** | N/A | `StatusLabel` | `StatusLabel` | `StatusLabel` | `StatusLabel` | `StatusLabel` | **Raw shadcn `Badge`** (pill radius) ← inconsistent | *(none — engagement-free by design)* |
| **Primary action** | `LinkButton` (filled) | `RecordRow` row-level link | `EmailMPButton` | `LinkButton` | Stake buttons (gated) | Directory row link | `SimulateThisButton` | `RecordRow` row-level link |
| **Secondary action** | `LinkButton` (outline) | *(none)* | `LinkButton` (outline) ×2 | `LinkButton` (outline) | `LinkButton` (outline, sign-in) | `LinkButton` (outline) | *(none)* | *(none — read-only by design)* |
| **Empty-state component/copy** | `EmptyState` (2×) | `EmptyState` | Inline honest sentences (no `EmptyState` component, same pattern as Government/Forecasts inline text) | `EmptyState` | `EmptyState` | `EmptyState` | Inline honest sentences | `EmptyState` |
| **Loading skeleton** | N/A (not a data-dependent shell) | **Missing entirely** | `Skeleton`-based, matches structure | Hand-rolled, promised a retired 2-column dashboard | Hand-rolled, promised a retired dashboard-tile grid | Hand-rolled divs, structure roughly correct | `Skeleton`-based but promised a retired 4-tile stats row | Hand-rolled divs (from last session), structure correct |
| **Mobile layout** | Responsive grid, no `hidden sm:*` | No `hidden sm:*` | No `hidden sm:*` | No `hidden sm:*` in live components | No `hidden sm:*` in live components | No `hidden sm:*` | No `hidden sm:*` | No `hidden sm:*` |
| **Hover/focus behaviour** | `transition-calm` | `transition-calm` | `transition-colors` (equivalent) | `transition-calm` | `transition-calm` | `transition-calm` | `transition-colors` | `transition-calm` |
| **Motion** | Colour/opacity only | Colour/opacity only | Colour/opacity only | **`ChamberSummaryCard`: `slide-in-from-top-2` (translateY) + animated `transition-transform` chevron** ← violation | **Animated `transition-transform` chevron** ← inconsistent with People's instant-flip | Instant `rotate-180` flip, no animated transform | N/A | N/A |
| **Use of shadows** | None | None | None | None | None | None | None | None |
| **Use of pills** | None | None | None | **`ChamberSummaryCard` "Live" badge — custom, not `StatusLabel`** | None (live `MarketCard`) | None | **Raw shadcn `Badge` (`rounded-4xl`)** ← violation | None |
| **Use of custom colours** | None | None | None | **`ChamberSummaryCard` "Live" badge: `#f5a623`/`#3a2e10`** ← violation | None (live `MarketCard`; legacy dead-code block excluded, see §7) | `PARTY_COLORS[party] ?? '#999'` (legitimate party-identity exception) | Same party-identity exception | None |
| **Page-specific visual dialect** | None (Phase 3A reference implementation) | None | None | `ChamberSummaryCard`'s arbitrary `font-mono text-[9–11px]` instead of `text-micro-label`/`text-metadata` | None | None | None (post-fix) | None |

## 2. Shared grammar adopted

Every applicable page now follows: `PageShell` → `PageHeader` (eyebrow `Australia · {Section}`, title, one-sentence purpose, `MetadataLine`, one real metric) → primary content → minimal `UnderlineTabs` filters where needed → `RecordRow`/`ArticleCard` rows → truthful `EmptyState` or inline honest text → related links. Issue Detail and MP Profile are the two deliberate, documented exceptions to the literal `PageHeader` shape (see §7) — both still sit inside `PageShell` and use `MetadataLine`, matching the "even exceptions sit inside a consistent page frame" instruction.

## 3. Visual inconsistencies fixed

1. **Parliament's eyebrow** — `"Government · Federal Parliament"` (a page-unique Section·Subsection arrangement) → `"Australia · Government"`, matching the `Australia · {Section}` pattern every other page already used (Issues, Forecasts, People, Political Pulse). `src/app/parliament/page.tsx`.
2. **MP Profile's party tag** — replaced the raw shadcn `Badge` (`rounded-4xl`, a filled pill with white-on-colour text — banned per `CIVIC_DESIGN_SYSTEM.md` Part 5, and a stronger "legible by colour alone" violation than the alternative) with the same small colour-swatch + plain-text pattern already shipped on `/leaders`' `CompositionList` — reusing an existing pattern rather than inventing a new one. `src/app/mp/[id]/page.tsx`.
3. **MP Profile's card radius** — three `rounded-xl` panels (role card, voting-analysis card, voting-history card) → `rounded-[var(--radius)]`, matching Issue Detail's identical card convention. Same file.
4. **`ChamberSummaryCard`'s "Live" indicator** — a hardcoded amber pill (`color: '#f5a623', borderColor: '#3a2e10'`) → `StatusLabel status="active" label="Live"`, removing the last hardcoded hex colour and custom pill shape from this component. `src/components/ChamberSummaryCard.tsx`.
5. **`ChamberSummaryCard`'s arbitrary typography** — `font-mono text-[9px]`/`text-[10px]`/`text-[11px]` one-off sizes (the summary line, the "Explore Chamber →" hint, the Simulate/Map buttons, the MP-breakdown toggle, the Senate hint) → the shared `text-micro-label`/`text-metadata` tokens used everywhere else in the app. Same file.

## 4. Interaction inconsistencies fixed

Five different disclosure ("show more") controls existed across the audited pages, each built independently:

| Control | Before | After |
|---|---|---|
| `ParliamentExperienceClient`'s "How Parliament works" accordion | `↑`/`↓` text glyphs, **no `aria-expanded`** | `ChevronDown` + `rotate-180` instant flip, `aria-expanded={open}` |
| `ChamberSummaryCard`'s MP-breakdown toggle | `ChevronRight` + animated `transition-transform duration-200` spin, no `aria-expanded` | `ChevronRight` + instant `rotate-90` flip (no animated transform), `aria-expanded={showMPBreakdown}` |
| `ChamberSummaryCard`'s expand/collapse reveal | `animate-in fade-in slide-in-from-top-2` (a translateY transform — banned per `CIVIC_DESIGN_SYSTEM.md` Part 3.5, "no transform, no translateY") | `animate-in fade-in` only (opacity, permitted) |
| Forecasts' "How forecasting works" toggle | Animated `transition-transform` spin | Instant flip, no animated transform |
| People's composition/role toggles | Already correct (instant `rotate-180 transition-calm`, `aria-expanded` present) | Unchanged — this was the reference pattern the other four were brought into line with |

The standard adopted: a disclosure chevron **flips instantly** on state change (a static rotation, not an animated spin) — this is what `globals.css`'s own `--motion-calm: color, background-color, border-color, opacity` token already implies by deliberately excluding `transform`, but three of five existing toggles weren't actually following it. `aria-expanded` is now present on every toggle audited.

## 5. Mobile inconsistencies fixed

No new `hidden sm:*`-wrapped functional control was found on any of the eight pages' live (non-legacy) code — the one historical bug class named in `CROSS_PAGE_CONSISTENCY_AUDIT.md` (Issues' expand-chevron, Forecasts' wallet controls) had already been fixed by earlier V1 batches. This sprint's mobile fix was in the **loading skeletons**, which are part of the mobile experience during a slow load and had drifted from the real layout:

- `src/app/predictions/loading.tsx` contained a `hidden sm:block` probability-bar placeholder for a dashboard-tile row `MarketCard` no longer renders (`FORECASTS_V1_SIMPLIFICATION_REPORT.md` already removed the tile; the skeleton was never updated). Removed.
- Every rewritten skeleton (see §6) now uses simple, single-column-safe `flex`/`space-y` layouts with no responsive-hidden blocks, so nothing is silently hidden on a narrow viewport during load.

## 6. Loading/skeleton findings

| Route | Before | After |
|---|---|---|
| `/issues` | **No `loading.tsx` at all** — a slow fetch showed nothing rather than a placeholder, the only core route in this state | New skeleton, matches `PageHeader` + `UnderlineTabs` + `RecordRow`-list structure |
| `/issue/[id]` | Already correct (`Skeleton`-based, single-column, matches current layout) | Unchanged |
| `/parliament` | Hand-rolled divs promising the **retired** two-column dashboard (`grid-cols-1 lg:grid-cols-3`, a bills table, `rounded-lg`/`rounded-xl`/`rounded-full`) — none of this layout has existed since `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md` | Rewritten on `Skeleton`, matches the current `PageHeader` → info block → priority-bill → representative → chamber structure |
| `/predictions` | Hand-rolled divs with a `hidden sm:block` dashboard-tile probability bar (retired by `FORECASTS_V1_SIMPLIFICATION_REPORT.md`) | Rewritten on `Skeleton`, matches `PageHeader` → participation line → dual filter tabs → flat forecast rows |
| `/leaders` | Hand-rolled divs, structurally already close to correct | Refactored onto the shared `Skeleton` primitive (visual/token consistency only — no structural change needed) |
| `/mp/[id]` | `Skeleton`-based but showed a **4-tile stats row** and a **6-row voting table with pill badges** — neither exists on the real, already-truthful "not yet available" profile page (`PEOPLE_TRUTHFULNESS_BATCH_REPORT.md` removed the fabricated score this stats row was for) | Rewritten to match the real single-column profile: avatar header, party tag, role card, Simulate button, voting-analysis/voting-history honest-empty sections. Now `width="narrow"` to match the real page (§7) |
| `/feed` | `Skeleton` component not used (hand-rolled `bg-border animate-pulse` divs from the Political Pulse batch); structure already correct | Refactored onto the shared `Skeleton` primitive |

Every loading skeleton in the app now uses the one shared `Skeleton` component (`src/components/ui/skeleton.tsx`, `rounded-md bg-muted/40 animate-pulse`) rather than a mix of that primitive and independently hand-rolled placeholder divs.

## 7. Accessibility findings

- **Fixed:** `ParliamentExperienceClient`'s "How Parliament works" toggle had no `aria-expanded` at all — added. `ChamberSummaryCard`'s MP-breakdown toggle likewise had none — added (its outer chamber-expand toggle already had one).
- **Fixed:** decorative chevron icons across the newly-standardised toggles now consistently carry `aria-hidden="true"`, matching People's existing pattern (previously inconsistent — some toggles' icons had it, some didn't).
- **Verified, unchanged:** heading hierarchy (`PageHeader` renders one `<h1>`, `SectionHeader` renders `<h2>`) was already correct on every page carrying `PageHeader`; `role="list"`/`role="listitem"` list semantics were already correct on Issues, Parliament's bill preview, and Political Pulse; no nested interactive elements were found (every `RecordRow` with an `href` is a single `<Link>`, never a link-in-a-link).
- **Status not colour-only:** already true everywhere `StatusLabel` is used (text label always renders). The one place this wasn't true — `ChamberSummaryCard`'s "Live" badge, which relied on the amber `#f5a623` colour with only an icon + text "Live" — is unaffected in practice (it already had a text label), but is now built from the same shared, colour-token-based component as every other status in the app rather than a bespoke implementation.
- **`MP Profile`/`Issue Detail` back-links** — confirmed byte-for-byte identical, accessible pattern (`<ArrowLeft /> Back to {Section}`) already shared between the two before this sprint; no change needed.
- **Not attempted:** a full WCAG audit or keyboard-navigation click-through — no interactive browser tooling is available in this environment (see §9). Findings above are from direct source inspection, matching every prior V1 batch's accessibility-verification method.

## 8. Intentionally preserved exceptions

Per this sprint's explicit instructions not to flatten distinct visualisations or redesign page purpose:

- **Issue Detail's `width="narrow"` (`max-w-2xl`)** — kept, and MP Profile was brought *into* alignment with it (see below), not the reverse. A single-column investigative/profile page reads better at article width than the app's general `max-w-5xl` list-page width; this is a deliberate content-shape choice made through `PageShell`'s own `width` variant (one shared component, not a bespoke value), which satisfies "sit inside a consistent page frame" without forcing every page to an identical number.
- **MP Profile's bespoke avatar-identity header** (avatar + name + electorate + party tag, not a literal `PageHeader`) — kept, for the same reason Today's marketing hero isn't a `PageHeader` (`DESIGN_SYSTEM_PHASE_3A_HOME_REPORT.md`): an identity/profile header and a list-page header are genuinely different shapes. It does, however, now share `PageShell`'s width, `MetadataLine`, the same back-link pattern as Issue Detail, and (after this sprint) the same non-pill party-tag treatment as `/leaders` — the parts of it that *should* be consistent now are.
- **`HouseChamber`/`SenateView`'s internal SVG styling** — not touched, per this sprint's explicit "do not flatten special visualisations into generic RecordRows" instruction. Only `ChamberSummaryCard`'s outer container, header, "Live" indicator, motion, and typography were standardised — the chamber visualisation itself is unchanged.
- **Forecasts' `PageHeader` metadata omits a page-level `verification` badge** — kept as-is, deliberately. Unlike Government/People (uniformly real-or-demo per page), Forecasts' list genuinely mixes real bill markets with permanently-demo civic/election/mp-vote rows (`FORECASTS_V1_SIMPLIFICATION_REPORT.md`); a page-level "Verified" badge would misrepresent the demo rows sitting right below it. Each row already carries its own honest `StatusLabel`.
- **`MarketCard.tsx`'s "legacy subcomponents" block** (hardcoded hex colours, a `linear-gradient`, a hover-`scale` transform) — confirmed still fully dead code, unreachable from the live render tree, kept only because the also-unused `FeaturedMarketCard.tsx` imports it, and explicitly commented in-file as "do not extend or fix bugs in this block." Left untouched per that standing instruction rather than fixed for a code path that never renders — fixing dead code has zero user-visible effect and risks contradicting a previous batch's deliberate decision.
- **`/onboarding`'s own visual dialect** (all-`font-mono` headings, no `PageShell`/`PageHeader`, three page-specific accent hex colours) — **not** migrated in this sprint. `/onboarding` is not one of the eight named core surfaces, and `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` already scopes it to a not-yet-started later phase. Only the Today-page CTA copy pointing at it was fixed (§"Today CTA truthfulness" below) — that is what this sprint's "Today page" instruction actually asked for.
- **`StakeModal.tsx`'s "Shares"/"¢"/"Potential profit" copy** — untouched, still gated behind the Product Strategist + Legal Advisor review named in `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` Phase 4b and `FORECASTS_V1_SIMPLIFICATION_REPORT.md`. Not this sprint's scope.

## 9. Today CTA truthfulness

`/onboarding` is a static three-card guide page (Track your seat / Pick an issue / Test the market) plus a short habits list — confirmed by direct reading it has **no interactive electorate or issue-preference picker anywhere on the page itself**. That functionality exists only in a separate, already-real system: `OnboardingController`/`OnboardingModal` (mounted globally in `layout.tsx`, auto-shown once per browser on first visit), which genuinely saves an electorate and up to three top issues to `localStorage` and, for a signed-in user, to `user_profiles` via `/api/onboarding`.

Today's two CTA buttons linking to `/onboarding` — **"Personalise my brief"** (hero) and **"Build my brief"** (bottom CTA, under the heading "Your electorate. Your issues. One useful weekly brief.") — promised exactly the electorate/issue-personalisation action that page doesn't perform, and no "brief" object or weekly-brief feature exists anywhere in the codebase to be built. This is the misleading-CTA gap this sprint's brief named.

**Smallest truthful remediation applied**, entirely on `src/app/page.tsx`, no new personalisation system built:
- Hero button: "Personalise my brief" → **"How Stickee works"**.
- Bottom CTA: heading "Your electorate. Your issues.<br/>One useful weekly brief." → **"A short guide to tracking your seat,<br/>your issues, and what happens next."**; eyebrow "Make it yours" → **"New here?"**; button "Build my brief" → **"See how it works"**.

Both buttons still link to `/onboarding` — that destination is correct, only the promise attached to it was wrong. `/onboarding`'s own copy was left unchanged: it already frames itself as a guide to the app's workflow ("Use Stickee in one clear loop") rather than claiming to perform the personalisation itself, so it did not need a truthfulness fix. `OnboardingModal.tsx` and `/api/onboarding` were read for context but not modified — they are a real, working (if separately-triggered) mechanism, not the thing this instruction named.

## 10. Files changed

- `src/app/page.tsx` — eyebrow/heading/button copy fix (§9) only; no structural change.
- `src/app/parliament/page.tsx` — eyebrow `"Government · Federal Parliament"` → `"Australia · Government"`.
- `src/app/mp/[id]/page.tsx` — `PageShell width="narrow"`; `Badge` → swatch+text party tag; 3× `rounded-xl` → `rounded-[var(--radius)]`.
- `src/components/ChamberSummaryCard.tsx` — "Live" badge → `StatusLabel`; removed `slide-in-from-top-2` transform and one animated `transition-transform` chevron spin; `aria-expanded` added to the MP-breakdown toggle; arbitrary `font-mono text-[Npx]` → `text-micro-label`/`text-metadata`.
- `src/components/ParliamentExperienceClient.tsx` — "How Parliament works" accordion: `↑`/`↓` glyphs → `ChevronDown` + instant flip; `aria-expanded` added.
- `src/components/PredictionsPageClient.tsx` — "How forecasting works" chevron: removed animated `transition-transform`.
- `src/app/issues/loading.tsx` — **new**.
- `src/app/parliament/loading.tsx`, `src/app/predictions/loading.tsx`, `src/app/mp/[id]/loading.tsx` — rewritten to match current page structure, on `Skeleton`.
- `src/app/leaders/loading.tsx`, `src/app/feed/loading.tsx` — refactored onto `Skeleton` (structure already correct).
- `src/lib/__tests__/cross-page-consistency.test.ts` — **new**, 60 tests.
- `src/lib/__tests__/navigation.test.ts` — one pre-existing assertion updated (`'Government ·'` substring → the new `'Australia · Government'` eyebrow), consistent with this codebase's established convention of updating a pinned assertion only when the current batch's own brief is the direct cause.
- `src/lib/__tests__/phase-3a-home.test.ts` — one pre-existing assertion updated (`'Personalise my brief'` → `'How Stickee works'`).
- `src/lib/__tests__/homepage-forecasts.test.ts` — one pre-existing assertion updated (`'Make it yours'` → `'New here?'`, an index-ordering check unrelated to the CTA's meaning).

No other file was modified. `HouseChamber.tsx`, `SenateView.tsx`, `TwoHousesExplainer.tsx`, `MarketCard.tsx`, `StakeModal.tsx`, `OnboardingModal.tsx`, `/api/onboarding/route.ts`, `IssuesPageClient.tsx`, `issue/[id]/page.tsx`, `issue/[id]/loading.tsx`, `PoliticalPulseClient.tsx`, and every other page/component were read for audit purposes only, not changed.

## 11. Tests

```
npx tsc --noEmit               → clean, 0 errors
npx vitest run                 → 502/502 passed (18 files), including the new
                                  cross-page-consistency.test.ts (60/60)
npm run build                  → succeeded (Next.js 16.2.1 / Turbopack), all 46
                                  routes compiled, including every touched route
node scripts/secret-scan.mjs   → "no suspicious patterns found in tracked files"
```

Three pre-existing assertions were updated in place (§10), each pinning copy this sprint's own brief specifically instructed to change — the same established convention every prior V1 batch report in this repo has followed. No other pre-existing test was modified or weakened; all 442 pre-existing tests continue to pass unmodified.

The 60 new tests in `cross-page-consistency.test.ts` cover, directly per the task's test list: every applicable core page uses `PageShell`; every list/detail page uses `PageHeader` with the canonical `Australia · {Section}` eyebrow (and Parliament's old page-unique arrangement is confirmed gone); MP Profile and Issue Detail share the narrow `PageShell` width; `StatusLabel` replaces the bespoke `Badge` pill on MP Profile and the hardcoded-hex "Live" indicator on `ChamberSummaryCard`; no touched file contains a banned shadow/pill-radius/gradient class, with `rounded-full` confirmed present *only* on the MP loading skeleton's genuine avatar placeholder; every loading skeleton uses the shared `Skeleton` primitive and no longer promises a retired layout; no `hidden sm:*` wrapper hides a control; the five disclosure controls share one instant-flip, `aria-expanded`-carrying chevron pattern; Today's CTA copy contains neither "Personalise my brief," "Build my brief," nor "One useful weekly brief," and both `/onboarding` links use the new truthful copy; and — as regression guards proving this sprint made no functional change — Political Pulse stays engagement-free, Issue Detail stays single-column, People stays directory-first (no embedded chamber), Forecasts stays a flat list (no featured slot/proposal modal), and Government/Parliament still states the Government-is-broader-than-Parliament distinction.

## 12. Visual verification

**No headless-browser/screenshot tooling is installed in this environment**, consistent with every prior V1 batch's finding — no pixel-level screenshots were taken.

Verified instead against the already-running local `next dev` server (PID 91137, port 3001 — not started by this session, the same server every prior V1 batch reused): `/`, `/issues`, `/issue/housing-affordability`, `/parliament`, `/predictions`, `/leaders`, `/mp/mp-labor-1`, `/feed` all returned HTTP 200. Rendered HTML was inspected directly and confirmed:

- `/parliament` — eyebrow renders as `"Australia · Government"`; the old `"Government · Federal Parliament"` string is gone; the Government-vs-Parliament explainer paragraph is present and unchanged.
- `/mp/mp-labor-1` — no `rounded-4xl` (the shadcn `Badge` class) anywhere in the output; the party swatch+text markup (`h-2.5 w-2.5 shrink-0 border`) is present.
- `/predictions` — "Forecasts" title and purpose sentence render; "Shares," "Buy Yes," "Buy No," "Featured," and "Leaderboard" are all absent, confirming this sprint didn't reintroduce anything `FORECASTS_V1_SIMPLIFICATION_REPORT.md` removed.
- `/leaders` — "House members tracked" and "Representative directory" render correctly, confirming this sprint didn't disturb the existing People page.
- `/feed` — "Political Pulse" and the truthful empty state still render, confirming this sprint didn't disturb Political Pulse.

**One environment-level finding, disclosed plainly:** the Home page's (`/`) curl output did **not** reflect this session's CTA-copy fix (§9) at the time of checking — it still showed the pre-fix "Personalise my brief"/"Build my brief" strings, even after a retry and touching the file to force a re-watch. Every other route checked (`/parliament`, `/mp/mp-labor-1`, `/feed`) *did* correctly reflect this same session's edits, including edits made after the stale Home request, so this is not a whole-server staleness issue — it appears specific to the `/` route on this particular long-running (since 2026-08-06) dev server instance, most plausibly because this session's own `npm run build` run (required by §11) touched the shared `.next` directory the dev server also reads from. Restarting that server was not attempted, since it is a long-running process this session didn't start and doing so wasn't requested. **The fix itself is independently confirmed correct** by three stronger signals than a single dev-server curl: (1) direct inspection of `src/app/page.tsx` on disk shows the new copy and confirms the old strings are fully gone; (2) `npm run build` — a full, from-scratch production compile of the exact same file — succeeded; (3) the new regression test in `cross-page-consistency.test.ts` asserting the exact new/old strings passes. Stated plainly rather than glossed over, per this sprint's own truthfulness standard.

## 13. Owner decisions

None of the following were resolved by this sprint — restated so they aren't lost:

1. **Whether `/onboarding` itself should eventually gain a real electorate/issue picker** (converging it with `OnboardingModal`'s already-real mechanism), rather than remaining a read-only guide that a returning user (who already dismissed the modal) has no way to re-open. This sprint only fixed the CTA copy that pointed at it; it did not change what `/onboarding` does.
2. **Whether `/onboarding`'s own visual dialect** (all-mono headings, page-specific accent colours, no shared primitives) **gets migrated onto the Civic Design System**, and when — `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` already scopes this to a not-yet-started phase; this sprint didn't pull it forward.
3. **Whether `MarketCard.tsx`'s dead "legacy subcomponents" block and `FeaturedMarketCard.tsx`** should finally be deleted together, as `FORECASTS_V1_SIMPLIFICATION_REPORT.md` already recommended — unresolved, unchanged by this sprint.
4. **Whether MP Profile should eventually compose the literal `PageHeader` primitive** instead of its bespoke avatar-identity header, once/if a generic "entity header with avatar" variant is designed — not attempted here; the current bespoke header was judged a legitimate, documented exception (§8), not a gap to close by force-fitting a primitive that doesn't natively support an avatar slot.
5. **The stale-dev-server finding in §12** — worth a note for future sessions: running `npm run build` in the same working directory as a long-running `next dev` process can leave that dev server serving inconsistent output for some routes until it's restarted. No action taken this sprint beyond disclosing it.

## 14. Confirmation

- Production was not accessed, modified, or deployed to.
- Nothing was staged, committed, or pushed.
- No migration was created or applied; no database was written to; no schema, route, or feature was added.
- No secret values were printed; `scripts/secret-scan.mjs` found nothing suspicious.
- Only the 12 files listed in §10 were changed (3 new, 9 edited-in-place), across the eight named core surfaces plus their shared sub-components (`ChamberSummaryCard`, `ParliamentExperienceClient`). No page's purpose, information architecture, or data model was altered — every fix in this sprint is presentation/interaction-only or a copy-truthfulness fix, per this sprint's own explicit rules.
- Verified directly: excluding this sprint's own changed files and this report, `git status --short` shows the same pre-existing working-tree entries present at session start, unmodified — the large existing diff from earlier sessions (Political Pulse, and the still-uncommitted Issues/Government/People/Forecasts/Issue Detail batches) was left exactly as found.
- Political Pulse, Issue Detail, People, Forecasts, and Government/Parliament's core content/behaviour are unchanged and independently confirmed unchanged by this sprint's own regression tests (§11).
