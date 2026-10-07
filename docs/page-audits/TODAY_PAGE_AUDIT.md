# Today (`/`) — Page Audit

Governed by [`AGENTS.md`](../../AGENTS.md). Verified against `src/app/page.tsx` as of 2026-08-07 (read in full for this audit — not inferred). Builds on `CORE_PAGE_REDESIGN.md`'s "Today" section and `SIMPLIFICATION_RECOMMENDATIONS.md`'s "Today" ledger; corrections to those documents are marked **[fresh finding]**.

## Current structure (verified by direct read)

Hero (headline + "Explore the issues" / "Personalise my brief") → **Where to start** (3 destination `ArticleCard`s: Issues, Government→`/parliament`, Forecasts→`/predictions`) + two inline secondary links (Explore scenarios→`/simulator`, Take action→`/campaigns`) → **National snapshot** (honest empty state) → **Government activity** (honest empty state, links to `/parliament`) → **Forecasts** (real, live — up to 2 stakeable markets from `getLiveBillMarkets()` filtered through `getMarketEligibility().canStake`, or an honest empty state) → **Personalisation CTA** ("Build my brief" → `/onboarding`).

**[fresh finding, refines `SIMPLIFICATION_RECOMMENDATIONS.md`'s "duplicated three times" claim]:** only **two** of the three destination cards are duplicated by a matching section below (Government, Forecasts) — Issues has no matching lower section; "National snapshot" is a distinct, currently-empty civic-indicator concept, not an Issues duplicate. The duplication finding is real but was one destination narrower than previously stated.

## Truthfulness classification of every visible element

| Element | Classification | Basis |
|---|---|---|
| Hero headline/subhead | Editorial framing, not a claim | No factual assertion made |
| 3 "Where to start" destination cards | Navigational | Real links to real pages |
| "Explore scenarios" / "Take action" links | Navigational | Real links; destinations audited separately (`/simulator` good, `/campaigns` fair — see `SECONDARY_PAGES_AUDIT.md`) |
| National snapshot empty state | **No verified data available** | Honest — `pillar_metrics` is real schema, never populated (`docs/architecture/STICKEE_SYSTEM_ARCHITECTURE.md` System 3) |
| Government activity empty state | **No verified data available** | Honest — correctly does not fall back to `mock-government-data.ts` |
| Forecasts section (populated) | **Forecast** | Real, live `issue_markets` via `getLiveBillMarkets()`/`getMarketEligibility()` — verified infrastructure per `AGENTS.md` |
| Forecasts section (empty state) | **No verified data available** | Honest |
| "Personalise my brief" / "Build my brief" CTAs | **Unsupported** — the CTA implies an action its destination cannot perform | `/onboarding` is a static informational page with zero data-collection fields (confirmed, `SECONDARY_PAGES_AUDIT.md`#onboarding); the one flow that actually collects electorate/issue preferences (`OnboardingModal`) is a different, disconnected component this button never opens |

**No fabricated or hardcoded content found on this page** — the two empty states and the demo-filtered forecast query are the correct pattern (Batch 1/Phase 3A fixes hold). The one live defect is the personalisation CTA's broken promise, not a truthfulness violation in the classic (fabricated-data) sense.

## OUTPUT PER PAGE

**PAGE:** Today
**ROUTE:** `/`
**CURRENT PURPOSE:** National front door and dispatcher into Issues/Government/Forecasts, with an (honestly empty) civic-indicator snapshot and a personalisation pitch.
**PROPOSED PURPOSE:** Unchanged in direction, tightened: dispatcher first, plus the one thing only Today can do — a real, dated "what changed" strip.
**SINGLE QUESTION:** What is happening?
**PRIMARY USER:** First-time and returning visitors alike — the one page everyone lands on.
**FIRST 30 SECONDS:** Read the one-sentence thesis, see three real destinations, either click one or scroll past two currently-empty sections to reach the one section with real content (Forecasts).
**WHAT IS REAL:** The three destination links; the Forecasts section's live market data; both empty states (correctly honest, not fabricated).
**WHAT IS FAKE OR UNSUPPORTED:** Nothing fabricated. One unsupported promise: "Personalise/Build my brief" → `/onboarding`, a page that collects nothing.
**WHAT TO KEEP:** The three-destination "Where to start" pattern; the honest empty-state discipline; the live, filtered Forecasts query (do not let this regress to a second mock path).
**WHAT TO REMOVE:** The "Government activity" and "Forecasts" sections as *separate* sections from their destination cards — fold each card's real content preview into the card itself (one unit: why go here + live preview), per `CORE_PAGE_REDESIGN.md`.
**WHAT TO MOVE:** "Explore scenarios" and "Take action" — off the hero-adjacent position, onto the specific issue/bill/person pages they act on (Simulator and Civic Action are contextual tools, not front-page destinations — see `CIVIC_ACTION_MODEL.md`).
**WHAT TO MERGE:** "National snapshot" and "Government activity" empty states — two consecutive "we don't have this yet" blocks read as an unfinished product; collapse to one muted line each, not a full section+heading+card per absence.
**WHAT TO ADD:** A real "What changed today" strip (2–3 dated items sourced from `feed_posts` civic alerts with visible authorship), linking to Political Pulse — currently, Today has **zero link anywhere to `/feed`** (confirmed, `USER_JOURNEY_MAPS.md` Journey 1) despite being the one page whose implicit promise is exactly this question.
**PRIMARY ACTION:** Choose a destination (Issues / Government / Forecasts).
**SECONDARY ACTIONS:** Personalise (once `/onboarding` is fixed or replaced — see `SECONDARY_PAGES_AUDIT.md`); see the full Political Pulse timeline (once the strip exists).
**EMPTY STATE:** Already correct pattern (`EmptyState` component, "being prepared" language) — extend it, don't replace it.
**MOBILE PRIORITIES:** Hero → destination cards (stacked) → Pulse strip (collapsed to 2–3 items) → personalisation CTA last, never competing with orientation content above the fold.
**CANONICAL DATA SOURCE:** `issue_markets`/`getLiveBillMarkets()` (Forecasts); `feed_posts` (once the Pulse strip is built); `pillar_metrics` (once real, for National snapshot — not before).
**REQUIRED SHARED COMPONENTS:** `PageShell`, `SectionHeader`, `ArticleCard`, `EmptyState`, `LinkButton` — already in use; no new pattern needed.
**RESPONSIBILITY MAP NEEDS:** None directly — Today is a dispatcher, not an object page. It should not embed a Responsibility Map.
**CIVIC ACTION NEEDS:** None directly — actions belong on the object pages Today links to, not on Today itself, per `CIVIC_ACTION_MODEL.md`.
**LEGAL / EDITORIAL / POLICY RISKS:** None found — this is the one core page with zero live truthfulness defect today.
**SMALLEST SAFE FIX:** Point "Personalise my brief"/"Build my brief" at a working personalisation flow (reopen `OnboardingModal`, or write real fields into a rebuilt `/onboarding` — see `SECONDARY_PAGES_AUDIT.md`), and collapse the two empty sections to one line each. Both are presentation-only, no schema change, same risk class as Batch 1.
**IDEAL V1 STRUCTURE:** Hero → 3 destination cards (each carrying its own live preview or honest one-line status) → compact Pulse strip → one personalisation CTA that works. Per `CORE_PAGE_REDESIGN.md`.
**IMPLEMENTATION PRIORITY:** P1 — no fabrication risk, but the missing Pulse strip is Today's single biggest gap relative to its own stated purpose, and depends on Political Pulse's `source_agent_id` restoration (Batch 8 remainder).
**OWNER DECISIONS:** Whether `/onboarding` is rebuilt as a real data-collecting page or retired in favour of always reopening `OnboardingModal` (see `SECONDARY_PAGES_AUDIT.md`#onboarding — the same decision affects both pages, should not be made twice).

## Council review (Level 2 — homepage; per `docs/STICKEE_COUNCIL.md` release gates: UX Researcher + Editorial Advisor + Product Strategist)

```
UX Researcher:        Approved with changes — duplication and the broken personalisation CTA are the only frictions found
Editorial Advisor:    Approved — no unsourced claim on this page; empty states correctly avoid implying more than is known
Product Strategist:   Approved with conditions — the missing Pulse strip is a real scope gap, not just a polish item; ship Batch 10 (Today + Pulse V1) before calling Today "done"

Overall recommendation: Merge the smallest-safe-fix now; treat the Pulse strip as a tracked follow-up, not a blocker to shipping the fix.
```

This reuses, and does not contradict, the twelve-agent Level 3 review already run against this page in `STICKEE_V1_EXECUTIVE_SUMMARY.md` (see Consensus C7, C1-adjacent, and Batch 10's scope) — Today was found sound in direction with two gaps (personalisation dead-end, missing Pulse content), both confirmed still open by this audit's fresh code read.
