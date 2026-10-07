# Cross-Page Consistency Audit

Governed by [`AGENTS.md`](../../AGENTS.md). This document covers **structural/interaction consistency** (page grammar, filter model, hero-stat discipline, empty-state pattern, mobile behaviour) — the axis the brief's "Consistency Audit" section asks for. It deliberately does not re-derive **visual-system consistency** (colour, shadow, radius, typography), which `CIVIC_DESIGN_SYSTEM.md` and `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` already audit exhaustively and which this audit is not authorised to redesign (no CSS changes, per this task's own rules). Where the two overlap, this document cites the existing visual audit rather than repeating it.

## Design-system migration status (context, not new findings)

Per `CIVIC_DESIGN_SYSTEM.md` (2026-08-05 status note): Phase 0 (creative direction), Phase 1 (tokens), Phase 2 (shared primitives: `PageShell`, `SectionHeader`, `ArticleCard`, `StatusTag`, `UnderlineFilter`, `MetaLine`, `StatHeader`, `EmptyState`, `LinkButton`), and Phase 3A (Home page) are implemented. Every other page still runs the older dark "Kalshi" visual system, a light "simple-*" system exclusive to chrome (Navbar/BottomNav), and assorted unstyled shadcn defaults — four coexisting visual dialects, per that document's own Executive Summary. This audit's structural findings below are independent of that migration status: a page can be visually unmigrated and still follow (or violate) the correct page grammar, and vice versa.

## Proposed shared page grammar (from the audit brief, evaluated against current pages)

```
PageHeader
→ one-sentence purpose
→ optional source/update line
→ one primary content block
→ minimal filters
→ flat readable list or record
→ related information
→ evidence/source block
→ truthful empty state
```

| Page | Header states purpose in one sentence? | Source/update line? | One primary block or several competing? | Filter model | Empty state |
|---|---|---|---|---|---|
| Today | No explicit one-sentence purpose statement (hero is marketing copy, not a stated page purpose) | N/A | Several — 3 destination cards + up to 3 more sections | None (no filters — correct, Today shouldn't have any) | Correct, honest, per-section |
| Issues | Yes (implicit via filter tabs + hero count) | No | One (list) — correct | Underline tabs (status) — **correct pattern** | Correct, honest |
| Issue detail | No | Partial (issue metadata, not evidence metadata) | **Several, competing** (editorial + poll + market widget + vote grid) | N/A (detail page) | Missing — no distinct empty/partial-data state for an under-sourced issue |
| Government/Parliament | No (four unrelated stat tiles substitute for a stated purpose) | Partial ("Source: TheyVoteForYou" appears in some but not all sections) | **Several, competing** (priority + bill feed + rep + chamber + education) | Chamber toggle (House/Senate/Current/Live) — correct pattern where it exists; bill feed has its own separate filter model | Partial — chamber itself has no "empty" case (always real), bill feed's empty case not audited as distinctly as Issues' |
| Forecasts | Partial (hero count states scope, not purpose) | No | **Several, competing** (board + wallet + leaderboard + election + propose) | Underline tabs (category/status) — correct pattern, buried under unrelated header controls | Correct, honest ("no verified forecasts") |
| People | Yes (hero + source line — **the best-executed header in the app**, per `CORE_PAGE_REDESIGN.md`) | **Yes — the template every other page should copy** | Several (chamber + education + directory + community leaders) — directory itself is one clean block | Sort/filter chips (directory) — correct pattern | Correct, honest ("being verified") throughout |
| Political Pulse | No | No (authorship itself is concealed, see `POLITICAL_PULSE_PAGE_AUDIT.md`) | One (the stream) — correct shape, wrong ranking model (engagement-weighted, not chronological) | Category filter — not yet re-scoped | Not yet built to spec |

**Finding:** exactly one page (People) fully satisfies the proposed grammar's header requirement today; it is explicitly named across three separate documents (`CORE_PAGE_REDESIGN.md`, `CONTENT_HIERARCHY.md` §6, this audit) as the pattern to copy, not a page needing its own header fixed. Every other core page's header either states scope without purpose (Issues, Forecasts) or substitutes unrelated stats for either (Government/Parliament).

## Hero-stat discipline (extends `CONTENT_HIERARCHY.md` §6, re-verified)

| Page | Current state | Consistent with People's template? |
|---|---|---|
| Today | None (correct — no live indicator exists to show) | N/A, correctly absent |
| Issues | One number, stated three times (hero line, duplicate stat tiles, filter-tab counts) | No — same number should appear once |
| Government/Parliament | Four hardcoded literals, none computed from the page's own content | No — least consistent page in the app on this axis |
| Forecasts | One number, sharing a header row with five unrelated controls | Partially — the number itself is real, but not "alone in its row" |
| People | One number, real, sourced, alone in its row | **Yes — the reference implementation** |

## Filter-grammar consistency

Underline tabs (the approved pattern, per `CIVIC_DESIGN_SYSTEM.md` Part 2) are used correctly on Issues (status), Forecasts (category/status), and People (chamber toggle, where retained). **Inconsistency found:** Government/Parliament's bill feed uses a *different* filter component from Issues' status tabs despite filtering the same underlying concept (bills) — this is a structural duplication (see `TAB_AND_MODE_AUDIT.md`), not only a visual one. Once the bill list is removed from Government per `GOVERNMENT_PAGE_AUDIT.md`, this specific inconsistency resolves itself as a side effect, not a separate fix.

## Card grammar ("every card is an article, not a widget" — Design Principle 5, `CIVIC_DESIGN_SYSTEM.md`)

- **Article-shaped (compliant):** `ArticleCard`-based destination cards (Today), Issues' row list.
- **Dashboard-tile-shaped (non-compliant):** `MarketCard`/`FeaturedMarketCard` (probability figure, coloured pill, buy-adjacent action — a dashboard-tile grammar, per `CIVIC_DESIGN_SYSTEM.md` §1.2's own finding, independently confirmed by this audit's `FORECASTS_PAGE_AUDIT.md`); `DecisionCard` (sentiment bar, badge grid).
- This is the same underlying finding as the visual-system audit's crypto/betting scorecard row — cited here because it is *also* a structural-consistency problem (one page's cards read as articles, another's read as a trading terminal), not only a colour/shadow problem.

## Metadata and source-line consistency

Only two surfaces in the app consistently show a real "Source: X · synced [date]" line: People's directory header and (partially) Government's chamber sections. Every other page either omits a source line entirely (Today's destination cards, Forecasts' header) or shows page-level metadata without a source (Issues' hero count). **Recommendation:** the `MetaLine` shared component (already built, per `CIVIC_DESIGN_SYSTEM.md` §4) should be mandatory on every real-data hero/header, not optional per page.

## Mobile behaviour consistency

Two independent, identical-shaped bugs found across different pages: a real, tap-reachable control silently disappearing on mobile inside a `hidden sm:flex` wrapper instead of reflowing —
- Issues' row expand-chevron (`CORE_PAGE_REDESIGN.md`#Issues)
- Forecasts' wallet/propose/sign-in controls (`CORE_PAGE_REDESIGN.md`#Forecasts)

Both are the same class of defect (a responsive utility class hiding a functional control rather than restyling it), found independently on two unrelated pages — worth a shared lint/test rule (e.g. flag any interactive element wrapped only in `hidden sm:*` with no mobile-equivalent affordance) rather than two separate manual fixes, per `AGENTS.md`'s "prefer extending existing systems" principle applied to bug classes, not just features.

## Interaction-density comparison (qualitative, not measured — no analytics exist)

Ranked most to least overloaded, by distinct interaction/content blocks stacked with no progressive disclosure:

1. Issue detail — 10 blocks
2. Forecasts — 9 header/board elements before the grid
3. Government/Parliament — 6 (priority, bill feed, rep, chamber, education, +header stats as a de facto 6th "block")
4. People — 4 (chamber, education, directory, community leaders)
5. Today — 5 sections, but 2 are single-line honest empty states (low real cost per block)
6. Issues (list) — 1 primary block (list), correctly minimal
7. Political Pulse — 1 primary block (stream), correctly minimal in shape (wrong in ranking model and mechanics, per its own audit)

This ranking corroborates, independently, `SIMPLIFICATION_RECOMMENDATIONS.md`'s per-page block counts — cited as convergent evidence, not re-derived from nothing.

## Recommendation

Adopt the brief's proposed page grammar as the standard for every page rebuild in `PAGE_IMPROVEMENT_ROADMAP.md`, using People's header as the literal reference implementation (copy its structure, not just its intent) and the two `hidden sm:*` mobile bugs as a shared regression-test pattern rather than two independent fixes.
