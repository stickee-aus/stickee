# Stickee — Design System Migration Roadmap

Depends on `CIVIC_DESIGN_SYSTEM.md` (the target specification) and the owner decisions in its Part 6. Coordinates with, but is independent of, `PAGE_REFACTOR_ROADMAP.md` (the content/route consolidation roadmap) — see "Relationship to the IA roadmap" below.

**Status (2026-08-05):**
- **Phase 0 — Approved.** See `CIVIC_DESIGN_SYSTEM.md`'s new "Phase 0 — approved creative direction" section.
- **Phase 1 — Implemented.** Token foundation (`globals.css`, `layout.tsx`) rewritten; see `DESIGN_SYSTEM_FOUNDATION_BATCH_REPORT.md`.
- **Phase 2 — Implemented.** 10 of 12 listed primitives were newly built (`PageShell`, `PageHeader`, `SectionHeader`, `ArticleCard`, `RecordRow`/`DataRow`, `StatusLabel`/`StatusTag`, `MetadataLine`/`MetaLine`, `UnderlineTabs`/`UnderlineFilter`, `EvidenceBlock`, extended `EmptyState`); `Button` and the `Dialog`/overlay shell were extended in place rather than rebuilt (see report for why).
- **Phase 3A (Home only) — Implemented 2026-08-05.** `src/app/page.tsx` rebuilt onto `PageShell`/`SectionHeader`/`ArticleCard`/`EmptyState`/`LinkButton`; every homepage-only `.simple-*` rule (hero, score card, quick-action grid, decisions list, forecast cards, CTA) deleted from `globals.css` — only the Navbar/BottomNav-shared `.simple-nav*`/`.simple-brand*`/`.simple-support-link`/`.simple-bottom-nav` rules remain. The fabricated National Civic Score and mock "recent decisions" were replaced with truthful empty states (no real data source exists for either — see `DESIGN_SYSTEM_PHASE_3A_HOME_REPORT.md`).
- **Phase 3B (Issues, Parliament) — Implemented, as part of Charter-governed batches.** See `ISSUES_V1_SIMPLIFICATION_REPORT.md` and `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`. Parliament's top-level page, `ParliamentExperienceClient`, `PriorityBillFocus`, and `MPActionStrip` now compose `PageShell`/`PageHeader`/`SectionHeader`/`RecordRow`/`StatusLabel`/`MetadataLine`/`EmptyState`/`UnderlineTabs`/`LinkButton`; the SVG chamber visualisation (`HouseChamber`, `SenateView`) and civics explainer (`TwoHousesExplainer`) internals were left on their existing styling — truthfulness fixes only, per that report's stated scope. Decisions and Government-redirect remain **not started**.
- **Phase 4 onward — Not started.**

## Sequencing philosophy

Token-first, then shared primitives, then pages — in that order, because the audit found the same handful of ad hoc patterns (grade→colour logic, stat-header numerals, card shells) reimplemented independently 3-5 times across the app. Fixing the token layer and building each primitive once means every page migration after Phase 2 is a search-and-replace onto an existing component, not a bespoke rebuild. Attempting page-by-page visual fixes before the tokens exist would recreate the exact problem this document is meant to solve (a fifth dialect).

Highest-traffic and highest-violation-density surfaces move first within that constraint: `/predictions` carries the most constitution violations (Part 5's ban list is almost entirely evidenced there) but also the most risk (real financial-equivalent copy, per Owner Decision 4), so it is sequenced after the pattern is proven on lower-risk pages, not first.

## Relationship to the IA roadmap

`PAGE_REFACTOR_ROADMAP.md` is already mid-flight (Batches 1, 2, and 2.5 implemented) and addresses a different axis: which routes exist, what data backs them, and where they link. This roadmap addresses how every page looks and feels once it exists. They can run in parallel:

- Do **not** block IA/route consolidation on this roadmap, or vice versa.
- When a page is touched by an IA batch (e.g. Issues/Decisions merge in IA Batch 3), build its new/merged version directly against the Civic Design System tokens rather than the current dark system — this avoids migrating it twice.
- When this roadmap reaches a page that IA batches plan to retire or merge (e.g. `/decisions` as a standalone route, `/leaders` before its People merge), do the token-level fixes (colour, shadow, radius, type) but hold off on a full component rebuild until its IA fate is decided — cheap fixes now, no wasted structural work.

## Phase 0 — Approve the system (owner + Council)

- Resolve the four open owner decisions in `CIVIC_DESIGN_SYSTEM.md` Part 6 (light/dark default, accent colour, serif choice, predictions-copy governance).
- Per `docs/STICKEE_COUNCIL.md`, this is a Level 3 change — route through at minimum UX Researcher + Product Strategist + Software Architect + Editorial Advisor (matching the existing "Homepage"/"Navigation" release gates) before Phase 1 starts.
- **Exit criteria:** a single approved token sheet (final hex values, final font stack) to build Phase 1 against. No code work should start before this, since every subsequent phase depends on these values.

## Phase 1 — Token foundation ✅ Implemented 2026-08-05

**Scope:** `src/app/globals.css`, `src/app/layout.tsx` only. No page-level markup changes.

- Load the serif font (`next/font/google`, IBM Plex Serif or the Phase 0 choice) alongside the existing Plex Sans/Mono in `layout.tsx:2`.
- Replace `:root`/`.dark` colour tokens (`globals.css:58-127`) with the Part 3.1 palette. Point `--font-heading` (`globals.css:12`, already exists) at the new serif variable instead of `var(--font-sans)`.
- Remove `.k-grade-*`, `.impact-*`, `.sentiment-*`, `.trending-pill` (`globals.css:141-165`) — these get rebuilt as the shared status-tag component in Phase 2, not patched in place.
- Remove the neutered `.gradient-text`/`.hero-gradient`/`.glow-*` utilities (`globals.css:167-184`) outright rather than leaving them as unused-but-present classes.
- Fold the `.simple-*` block (`globals.css:186-311`) into the new token system rather than leaving it as a second, page-scoped design language — its good ideas (warm paper background, section rhythm) move into the shared tokens; its violations (pill radii, shadows, gradient, orange accent) are dropped.
- **Risk:** low — this is CSS-variable-only work, but every page currently reads these variables, so a visual smoke pass across a representative page from each domain (Home, Decisions, Predictions, Profile, Admin) is required before merging, since the whole app repaints at once.
- **Exit criteria:** `globals.css` contains exactly one colour/type/radius system; no `.simple-*`, `.k-grade-*`, or gradient utility remains.

## Phase 2 — Shared primitives ✅ Implemented 2026-08-05

**Scope:** new/rebuilt components in `src/components/ui/` (or wherever the project's shared-component convention lives — check before adding a new directory, per `AGENTS.md`'s duplication-avoidance principle).

Build once, per Part 4 of the design system doc:

- `ArticleCard` — the canonical card shell, replacing the independent card markup currently duplicated across `DecisionCard.tsx`, `MarketCard.tsx`, `FeaturedMarketCard.tsx`, `LeaderProfileDetail.tsx` panels, `PillarCard.tsx`, and others.
- `StatusTag` — replaces the three independent grade/impact/sentiment colour implementations (`PillarCard.tsx`, `PillarGradeChip.tsx`, `globals.css`'s removed classes) with one component and one colour function.
- `UnderlineFilter` — generalises the pattern `IssuesPageClient.tsx` already implements correctly, replacing `ChamberToggle.tsx`'s pill/shadow segmented control and the ad hoc tab markup on Leaders/Predictions/Feed.
- `MetaLine` — the byline-format metadata row (source · date · retrieved).
- `StatHeader` — the large numeral page-header pattern currently reimplemented with slightly different `clamp()` values on Decisions, Issues, Leaders, Notifications, Feed, Parliament, and Simulator.
- `Button` (filled/outlined, no shadow, no pill) — audit whether this can extend the existing shadcn `Button` primitive (`src/components/ui/`) rather than adding a parallel one; per the constitution's "does this duplicate an existing system" question, extending is preferred if shadcn's Button is already the base for most current buttons.
- **Risk:** low-medium — no page depends on these yet, so they can be built and unit/visually tested in isolation. Risk shows up in Phase 3+ when pages start consuming them.
- **Exit criteria:** each primitive has at least one real page consuming it (built alongside the first Phase 3 page, not shipped speculatively unused) plus a basic rendering test, matching this repo's existing pattern of pairing UI changes with regression tests.

## Phase 3 — Core editorial pages

**Pages:** Home (correcting the `.simple-*` violations in place), Issues, Decisions, Parliament, Government (currently just a redirect — low effort).

- These are the app's actual "front page" and "evidence layer" surfaces per the IA audit's recommended hierarchy — get them right first since they're what a first-time visitor sees.
- If IA Batch 3 (Issues/Decisions merge) lands before this phase starts, build the merged page directly in the new system instead of migrating the old `/decisions` first — check `PAGE_REFACTOR_ROADMAP.md`'s current batch status before starting this phase.
- **Risk:** low-medium. No data-model or route changes, matching IA Batch 1/2's risk profile.
- **Owner decisions required:** none beyond Phase 0's.
- **Tests:** visual/snapshot check per page (no page renders a `box-shadow`, `rounded-full`, or off-palette hex — a simple grep-based regression test, matching this repo's existing pattern of grep-assertable regression tests, e.g. `src/lib/__tests__/*.test.ts`, is a cheap and effective guard here).

### Phase 3A — Home ✅ Implemented 2026-08-05

Home page work turned out to be a full rebuild onto the Phase 2 primitives, not a corrective re-skin — see `DESIGN_SYSTEM_PHASE_3A_HOME_REPORT.md` for the complete before/after, test list, and visual-verification method. Summary:

- `PageShell` + `SectionHeader` + `ArticleCard` + `EmptyState` + `LinkButton` now compose the page; the bespoke hero keeps its own larger heading treatment (a marketing hero legitimately isn't a `PageHeader`).
- Every homepage-only `.simple-*` rule was deleted from `globals.css` once `page.tsx` no longer referenced it — confirmed via repo-wide grep before deletion. Navbar/BottomNav's `.simple-nav*`/`.simple-brand*`/`.simple-support-link`/`.simple-bottom-nav` were left in place (still consumed, out of this batch's scope).
- The fabricated `CIVIC_PILLARS` National Civic Score and the mock `DECISIONS` "recent decisions" list were both removed and replaced with truthful empty states — no real `pillar_metrics`/decisions data source exists anywhere in the app today (confirmed by grep; `/impact` itself is still equally fabricated, unchanged, flagged for a near-term fix).
- `DailyBonusBanner.tsx`'s hardcoded dark-theme hex colours (`#041008`/`#0e3020`/`#2ec266`) were re-themed onto the civic tokens — presentation-only, no change to its auth gate or claim logic.

### Phase 3B — Issues, Decisions, Parliament, Government-redirect

**Issues (`/issues`, plus the minimum necessary `/issue/[id]` fixes) — ✅ Implemented**, as part of `ISSUES_V1_SIMPLIFICATION_REPORT.md`'s Charter-governed truthfulness/simplification batch: `IssuesPageClient.tsx` now composes `PageShell`/`PageHeader`/`RecordRow`/`StatusLabel`/`UnderlineTabs`/`EmptyState` rather than its own dark-system markup (`RecordRow` was extended with an optional summary line for this, not duplicated). `/issue/[id]` was not fully migrated — per that batch's scope, only the immediately-visible fabricated/unsupported content was gated or removed; its layout still runs the older markup and is not yet a Phase 3B page in its own right.

**Parliament (`/parliament`) — ✅ Implemented**, as part of `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`'s Charter-governed truthfulness/simplification batch: `page.tsx` and `ParliamentExperienceClient.tsx` now compose `PageShell`/`PageHeader`/`SectionHeader`/`RecordRow`/`StatusLabel`/`MetadataLine`/`EmptyState`/`UnderlineTabs`/`LinkButton`; `ChamberToggle`'s banned pill/sliding-thumb pattern was replaced with `UnderlineTabs`. Per that batch's scope, the SVG chamber visualisation (`HouseChamber`, `SenateView`) and the `TwoHousesExplainer` civics content kept their existing internal styling — only the truthfulness-mandated behavioural changes touched them, not a full token re-skin.

Decisions and Government-redirect remain **not started**.

## Phase 4 — Forecasts / Predictions

**Pages:** `/predictions`, `/leaderboard`, `/simulator`.

- Highest violation density in the app (see design system doc's People/Predictions/Simulator/Impact findings) — token and component migration here is mechanical (swap `MarketCard`/`FeaturedMarketCard`/`PortfolioPanel`/`StakeModal` onto `ArticleCard`/`StatusTag`), but the **copy** (shares/payout/¢/buy-sell language) is a substantive, financial-equivalent-feature change.
- Sequence: land the visual/token migration first (card shape, colour, shadow removal — Phase 4a), then route the copy rewrite through Product Strategist + Legal Advisor review per Owner Decision 4 before shipping wording changes (Phase 4b) — these do not need to ship in the same PR.
- Remove `TickerBar.tsx`'s scrolling-ticker pattern entirely (banned per Part 5) rather than re-theming it.
- **Risk:** medium. No wallet/settlement logic changes — this phase is presentation-only — but per `AGENTS.md`'s verified-infrastructure list, confirm with a real look at `usePredictionWallet`/`StakeModal` that no visual change accidentally touches the staking flow's actual behaviour, not just its appearance.
- **Owner decisions required:** Owner Decision 4 (predictions copy governance) before Phase 4b.

## Phase 5 — People / Impact / Account / Feed

**Pages:** `/leaders`, `/leaders/[id]`, `/mp/[id]`, `/impact`, `/profile`, `/notifications`, `/feed`, `/onboarding`, `/u/[handle]`, `/donate` + success/cancel.

**`/leaders` and `/mp/[id]` — ✅ Implemented**, as part of `PEOPLE_V1_SIMPLIFICATION_REPORT.md`'s Charter-governed truthfulness/simplification batch, ahead of this phase's original bulk-migration sequencing (same pattern as Issues/Parliament shipping ahead of their own formal phase kickoffs). `/leaders/page.tsx` now composes `PageShell`/`PageHeader`/`SectionHeader`/`RecordRow`/`StatusLabel`/`MetadataLine`/`EmptyState`/`UnderlineTabs`/`LinkButton`; the embedded full interactive chamber and live-election toggle (a Government/Parliament duplication, not a token-migration item) were removed, not just re-themed. `/mp/[id]` received the same primitive treatment (`PageShell`/`MetadataLine`) plus a generic Responsibility block, without a full rebuild. `/leaders/[id]` was left as-is (already correct, truthful "not available yet" state). `/impact`, `/profile`, `/notifications`, `/feed`, `/onboarding`, `/u/[handle]`, `/donate` remain **not started** — this phase's gamification-removal item (`StreakBadge`, `DailyBonusBanner`, etc.) was not touched, since none of those live on the pages this batch scoped.

- Bulk migration phase — mechanical application of Phase 2 primitives now that they're proven on Phases 3-4.
- Explicitly remove gamification here: `StreakBadge.tsx`, `StreakMilestone.tsx`, `BadgeDisplay.tsx`'s glow/gradient, `DailyBonusBanner.tsx`'s claim-banner styling, referral point-bonus chips on sign-in — re-theme the underlying mechanic (if it stays) onto plain text/typographic treatment per Part 4's ban list, or flag for Product Strategist removal if the mechanic itself (not just its styling) is out of scope for a civic platform (a product question, not answered by this document).
- Delete `src/components/FeedPost.tsx` and `src/app/feed/page.tsx.bak` as dead code — no migration needed, they're not live.
- **Risk:** low. Mostly presentation swaps on already-functioning pages.

## Phase 6 — Chrome and remaining shells

**Scope:** `Navbar.tsx`, `BottomNav.tsx`, `CommandPalette.tsx`, `AuthButton.tsx`, `CookieBanner.tsx`, modals (`SupportModal.tsx`, `NominationModal.tsx`, `EmailMPModal.tsx`, `OnboardingModal.tsx`, `StakeModal.tsx`, `CampaignModal.tsx`), auth pages.

- Re-theme `CommandPalette.tsx` and every `Dialog`-based modal onto the same tokens as the nav they open from — closes the "three systems visible on screen at once" finding.
- Auth pages (`sign-in`, `sign-up`, `forgot-password`, `reset-password`) get the type/colour token swap; drop the 🎉 referral emoji copy per Part 5.
- **Risk:** low-medium — chrome is high-visibility (renders on every page), so regressions here are immediately noticeable; test across the widest range of pages.

## Phase 7 — Admin console

**Pages:** `/admin/*`.

- Lowest priority — internal-only tool, explicitly out of scope for the IA audit's public-trust findings, and not something end users see.
- Token-level consistency only (same palette, no shadow/gradient) — no need to rebuild admin's dense data-table/metric-dashboard idiom into the `ArticleCard` pattern, which is designed for editorial content, not operational tooling.
- **Risk:** low.

## Phase 8 — Cleanup

- Remove any remaining unused CSS from the pre-migration systems (`.simple-*` if not already folded in Phase 1, any residual `k-grade`/`impact`/`sentiment` references missed by earlier phases).
- Repo-wide grep pass confirming zero remaining instances of the Part 5 ban list (`box-shadow`, `rounded-full` outside avatars, `linear-gradient`/`radial-gradient`, banned hex values) — turn this into a permanent lint rule or CI grep check if the project has a place for one, so the four-systems problem this document exists to fix doesn't quietly recur.

---

## Sequencing summary

```
Phase 0 (owner decisions + Council) ─┐
Phase 1 (tokens) ─────────────────────┴─→ Phase 2 (primitives) ─┬─→ Phase 3 (Home/Issues/Decisions/Parliament)
                                                                  │        │
                                                                  │        ▼
                                                                  ├─→ Phase 4 (Predictions/Leaderboard/Simulator)
                                                                  ├─→ Phase 5 (People/Impact/Account/Feed)
                                                                  └─→ Phase 6 (Chrome/modals/auth)
                                                                            │
                                                                            ▼
                                                                     Phase 7 (Admin) ─→ Phase 8 (Cleanup)
```

Phases 3, 4, 5, and 6 are independent of each other once Phase 2's primitives exist and can be reordered or parallelised freely — the dependency that matters is Phase 0 → 1 → 2 before any page work, and Phase 8 last.

## What this roadmap does not decide

- Whether any given gamification *mechanic* (not just its styling) survives at all — that's a Product Strategist scope call, out of this document's remit.
- The exact final hex values and font choice — Phase 0's job, not pre-empted here.
- Whether `/predictions`' underlying wording changes ship — Phase 4b names the required reviewers but doesn't pre-approve the copy.
- Any route, redirect, or data-model change — entirely `PAGE_REFACTOR_ROADMAP.md`'s remit, referenced here only for sequencing coordination.
