# Stickee — Page Audit Index

Governed by [`AGENTS.md`](../../AGENTS.md) and produced under the Level 3 audit brief dated 2026-08-07. **Documentation only — no application code, CSS, routes, database, or production system was touched to produce this file or any other file in `docs/page-audits/`.**

## How this audit relates to existing documentation

This is not the first systems-level or page-level audit of Stickee. A prior session (2026-08-03 → 2026-08-05) already produced two complete, evidence-traced audit generations that this document builds on rather than repeats:

1. **Generation 1 — route/IA audit** (`PAGE_AND_ROUTE_INVENTORY.md`, `INFORMATION_ARCHITECTURE_AUDIT.md`, `CONSOLIDATION_AND_REDIRECT_PLAN.md`, `docs/audits/DATA_AND_CONTENT_AUDIT.md`, `docs/architecture/*`) — every route traced by direct file read, every mock-data path confirmed live.
2. **Generation 2 — full twelve-agent Council review of a first-principles V1 redesign** (`STICKEE_V1_EXECUTIVE_SUMMARY.md` + its seven companions: `STICKEE_V1_PRODUCT_BLUEPRINT.md`, `CORE_PAGE_REDESIGN.md`, `LOW_FIDELITY_WIREFRAMES.md`, `CONTENT_HIERARCHY.md`, `USER_JOURNEY_MAPS.md`, `SIMPLIFICATION_RECOMMENDATIONS.md`, `IMPLEMENTATION_BATCHES.md`) — this is, in substance, the same exercise this brief asks for (per-page first-principles purpose, truthfulness classification, simplification ledger, Council approval matrix), already run at Level 3 against Today/Issues/Government/Forecasts/People/Political Pulse and their detail pages.

**This audit (Generation 3) does three things Generations 1–2 did not:**
- Applies the brief's own **OUTPUT PER PAGE template** (25 fields) to every page and tab, including secondary pages Generation 2 did not cover in first-principles depth (`/decisions`, `/leaderboard`, `/campaigns`, `/profile`, `/notifications`, `/impact`, `/simulator`, `/donate`, `/onboarding`, auth, `/u/[handle]`).
- Builds the two frameworks that did not exist before this audit: a cross-cutting **Responsibility Map** (`RESPONSIBILITY_MAP_SPEC.md`) and a **Civic Action Model** (`CIVIC_ACTION_MODEL.md`).
- Reclassifies every major visible element using the brief's specific ten-value truthfulness taxonomy (verified fact / sourced analysis / forecast / community opinion / AI-generated interpretation / demo / unverified / no verified data available / hardcoded / inferred fallback / unsupported) — Generation 2 used the Council's P0–P3 severity model, which is a different axis (how bad) from this one (what kind of claim is this).

Where Generation 1/2 findings still hold (verified by a fresh code check during this audit — see "Ground truth check" below), this audit **cites them rather than re-deriving them**, per `AGENTS.md`'s instruction to prefer extending existing work over duplicating it. Where this audit's fresh read disagrees with or updates a prior finding, that is stated explicitly.

## Ground truth check (2026-08-07)

Before writing anything, this audit re-verified: current `git status` (30+ modified files, ~60 untracked docs — all pre-existing uncommitted work from prior sessions, none touched by this audit); `src/lib/navigation.ts` (five primary items — Today/Issues/Government/Forecasts/People — confirmed current, Government correctly points at `/parliament`, matching `STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md`'s shipped fix); the full `src/app` route tree (32 `page.tsx` routes, confirmed against `PAGE_AND_ROUTE_INVENTORY.md`'s count); and confirmed **no `/election` or `/election/[id]` page route exists anywhere** — only `src/app/api/election` (a live-data API consumed as an embedded widget on `/predictions` and `/leaders`). This audit treats "Election" as a **feature/widget, not a route**, consistent with `docs/architecture/STICKEE_SYSTEM_ARCHITECTURE.md`'s System 14 and `CONSOLIDATION_AND_REDIRECT_PLAN.md`.

Batch 8's truthfulness fixes (Government nav destination; four fabricated-politician-score systems removed) are confirmed shipped in the current working tree. Everything else in `IMPLEMENTATION_BATCHES.md` (Batches 9–15) is confirmed **not started** — this audit's findings should be read as still-current, not superseded.

---

## Primary pages (five-item nav)

| Route | Current purpose | Proposed single purpose | Health | Priority | Full audit |
|---|---|---|---|---|---|
| `/` (Today) | National front door; three destination cards + two duplicate content-preview sections + quick-action links | "What is happening?" — a dispatcher to Issues/Government/Forecasts, plus a real "what changed" strip | 🟡 Fair — truthful (no fabrication after Batch 1/8) but duplicative and missing its own core content (Pulse strip) | P1 | [`TODAY_PAGE_AUDIT.md`](TODAY_PAGE_AUDIT.md) |
| `/issues` | Filterable bill/issue list, Supabase-first with mock fallback | "Why is this happening?" — the one canonical bill/issue/decision list | 🟡 Fair — real core data, but list row is overloaded (7 data points) and no topic search | P0 | [`ISSUES_PAGE_AUDIT.md`](ISSUES_PAGE_AUDIT.md) |
| `/parliament` (nav label "Government") | Chamber/vote evidence layer + duplicate bill feed + hardcoded header stats | "What has government actually done?" — executive + legislative evidence layer | 🔴 Poor→🟡 improving — real chamber/vote data undermined by fabricated header stats and a bill list that duplicates Issues | P0 | [`GOVERNMENT_PAGE_AUDIT.md`](GOVERNMENT_PAGE_AUDIT.md) |
| `/predictions` (nav label "Forecasts") | Market board + wallet + leaderboard + election widget + propose-market form, all on one page | "What is likely to happen next?" — the participation layer, board only | 🟡 Fair — real staking core (verified infra) buried under five unrelated header controls and two fake/duplicate systems (propose form, second wallet) | P0 | [`FORECASTS_PAGE_AUDIT.md`](FORECASTS_PAGE_AUDIT.md) |
| `/leaders` (nav label "People") | MP directory + community leaders, post-truthfulness-batch cleanup | "Who represents Australians, and what have they done?" | 🟡 Fair — truthful after Batch 2.5, but chamber/education blocks duplicate Government and precede the directory | P1 | [`PEOPLE_PAGE_AUDIT.md`](PEOPLE_PAGE_AUDIT.md) |
| `/feed` (not in primary nav; proposed "Political Pulse") | Ranked, engagement-styled activity stream, mostly agent-authored | "What changed?" — a chronological, sourced civic-alert stream | 🔴 Poor — real ranking engine, but bot authorship is hidden and engagement mechanics (boosted badge, share-for-points, letter grades) contradict a "civic alert" framing | P1 | [`POLITICAL_PULSE_PAGE_AUDIT.md`](POLITICAL_PULSE_PAGE_AUDIT.md) |

## Detail pages

| Route | Object | Health | Full audit |
|---|---|---|---|
| `/issue/[id]` | Issue/Bill detail | 🔴 Poor — 10 stacked content blocks, two competing prediction mechanisms, one with dead Buy buttons removed but the whole widget still embedded | [`DETAIL_PAGE_AUDIT.md`](DETAIL_PAGE_AUDIT.md)#issue-detail |
| Government Decision (no real route — `/decisions` today) | Executive decision | 🔴 Poor — not a real object yet (no source field, incompatible ID scheme); `/decisions` shows an honest transitional state, not the target page | [`DETAIL_PAGE_AUDIT.md`](DETAIL_PAGE_AUDIT.md)#government-decision |
| `/forecasts/[id]` (does not exist) | Forecast market | ⚫ Missing — genuine gap, no per-market detail page anywhere | [`DETAIL_PAGE_AUDIT.md`](DETAIL_PAGE_AUDIT.md)#forecast-detail |
| `/mp/[id]` | MP profile | 🟡 Fair — truthful (correct "being verified" empty state) but real `member_votes` data sits unused | [`DETAIL_PAGE_AUDIT.md`](DETAIL_PAGE_AUDIT.md)#mp-profile |
| Election detail (no route — `/api/election` widget only) | Live election snapshot | ⚫ Not modeled as a page | [`DETAIL_PAGE_AUDIT.md`](DETAIL_PAGE_AUDIT.md)#election |
| Civic Proposal detail (no route — closest precedent `ProposeMarketModal`) | Civic/market proposal | ⚫ Not modeled; closest precedent is fully decorative | [`DETAIL_PAGE_AUDIT.md`](DETAIL_PAGE_AUDIT.md)#civic-proposal |

## Secondary pages

| Route | Current purpose | Health | Priority | Full audit |
|---|---|---|---|---|
| `/decisions` | Post-Batch-8 honest transitional state ("verified records being prepared" + link to `/parliament`) | 🟢 Good (honest) / 🔴 stale as IA (still a separate route+page for a merged-away concept) | P2 | [`SECONDARY_PAGES_AUDIT.md`](SECONDARY_PAGES_AUDIT.md)#decisions |
| `/government` | Bare redirect to `/parliament` | 🟢 Fine, zero content of its own | P3 | [`SECONDARY_PAGES_AUDIT.md`](SECONDARY_PAGES_AUDIT.md)#government-redirect |
| `/leaderboard` | Honest "rankings not available yet" state (post-Batch 1) | 🟢 Good (honest) / duplicate route vs. embedded Forecasts leaderboard slot | P2 | [`SECONDARY_PAGES_AUDIT.md`](SECONDARY_PAGES_AUDIT.md)#leaderboard |
| `/campaigns` | Labeled-illustrative advocacy list, real mechanic lives elsewhere (`/parliament`'s `CampaignModal`) | 🟡 Fair (labeled, not fabricated) but still a second, disconnected "campaign" concept | P1 | [`SECONDARY_PAGES_AUDIT.md`](SECONDARY_PAGES_AUDIT.md)#campaigns |
| `/profile` | Real-auth-gated personal dashboard, truthful empty tabs (post-Batch 1) | 🟢 Good (honest) / two wallet systems still feed it | P2 | [`SECONDARY_PAGES_AUDIT.md`](SECONDARY_PAGES_AUDIT.md)#profile |
| `/notifications` | Real notification inbox, demo-array bug fixed (post-Batch 1) | 🟢 Good | P3 | [`SECONDARY_PAGES_AUDIT.md`](SECONDARY_PAGES_AUDIT.md)#notifications |
| `/impact` | Pillar "civic score" deep-dive | 🔴 Poor — entirely mock (`mock-civic-data.ts`), same defect class as the now-fixed Government page, not yet fixed here | P1 | [`SECONDARY_PAGES_AUDIT.md`](SECONDARY_PAGES_AUDIT.md)#impact |
| `/simulator` | Deterministic what-if sandbox, explicitly labeled | 🟢 Good content / 🟡 over-exposed as standalone top-level-adjacent page | P2 | [`SECONDARY_PAGES_AUDIT.md`](SECONDARY_PAGES_AUDIT.md)#simulator |
| `/donate`, `/donate/success`, `/donate/cancel` | Real Stripe + Supabase flow | 🟢 Good — cleanest cluster in the app | P3 | [`SECONDARY_PAGES_AUDIT.md`](SECONDARY_PAGES_AUDIT.md)#donate |
| `/onboarding` | Static "how it works" page, disconnected from the real onboarding modal | 🟡 Fair (honest, but duplicate/orphaned) | P2 | [`SECONDARY_PAGES_AUDIT.md`](SECONDARY_PAGES_AUDIT.md)#onboarding |
| `/auth/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password` | Real Supabase Auth flows | 🟢 Good | — | [`SECONDARY_PAGES_AUDIT.md`](SECONDARY_PAGES_AUDIT.md)#auth |
| `/u/[handle]` | Fictional citizen "civic voice" social profile | 🔴 Poor — 4 hardcoded fictional people presented as real users | P1 | [`SECONDARY_PAGES_AUDIT.md`](SECONDARY_PAGES_AUDIT.md)#u-handle |

**Not present anywhere in the codebase (confirmed by directory search):** `/privacy`, `/terms`, `/about`, `/election`, `/election/[id]`, any Civic Proposal detail route. See `SECONDARY_PAGES_AUDIT.md` and `DETAIL_PAGE_AUDIT.md` for what this means per page.

## In-page tabs, toggles, and modes

Every tab/mode named in the brief (Issues' All/Active/Passed/Rejected; Government/Parliament's Priority Bill/Active Bills/Your Rep/Chamber/House/Senate/Live Election/How They Voted/My Campaign/How Parliament Works; Forecasts' category and status filters, wallet controls, proposal flow, leaderboard; People's House/Senate/Current Chamber/Live Election/How They Voted/My Campaign/party filters/sort/MP side panel) is catalogued with its own health/truthfulness verdict in [`TAB_AND_MODE_AUDIT.md`](TAB_AND_MODE_AUDIT.md).

## Cross-cutting frameworks (new in this audit generation)

- [`RESPONSIBILITY_MAP_SPEC.md`](RESPONSIBILITY_MAP_SPEC.md) — "who can change this" for Issue, Bill, Government Decision, Policy, Forecast, MP, Minister, Department, Committee, Election, Civic Proposal.
- [`CIVIC_ACTION_MODEL.md`](CIVIC_ACTION_MODEL.md) — "How can I influence this?" replacing "Email your MP" as the default/only action.
- [`CROSS_PAGE_CONSISTENCY_AUDIT.md`](CROSS_PAGE_CONSISTENCY_AUDIT.md) — page grammar, visual-system, and interaction-density comparison across every page (extends, does not duplicate, `CIVIC_DESIGN_SYSTEM.md`).

## Recommended implementation order

See [`PAGE_IMPROVEMENT_ROADMAP.md`](PAGE_IMPROVEMENT_ROADMAP.md) for the full 12-batch plan and its reconciliation with the two already-existing roadmaps (`PAGE_REFACTOR_ROADMAP.md` Batches 1–7, `IMPLEMENTATION_BATCHES.md` Batches 8–15).

## Summary report

[`PAGE_BY_PAGE_AUDIT_REPORT.md`](../../PAGE_BY_PAGE_AUDIT_REPORT.md) (repo root, per the brief's required-deliverables list) is the top-level findings report — read it first if you haven't read this index.

**Health legend:** 🟢 Good (truthful and clear) · 🟡 Fair (truthful but confusing/duplicative, or a real gap honestly labeled) · 🔴 Poor (fabricated, broken, or badly overloaded) · ⚫ Missing (no page/route exists).
