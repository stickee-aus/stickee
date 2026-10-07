# Stickee — Page-by-Page Audit Report

Level 3 product, UX, information-architecture, truthfulness, and design-consistency audit, per the task brief dated 2026-08-07. Governed by [`AGENTS.md`](AGENTS.md). **Documentation only — no application code, CSS, routes, database schema, or production system was changed to produce this report or any file in `docs/page-audits/`.**

**Read `docs/page-audits/PAGE_AUDIT_INDEX.md` for the full navigable index.** This report is the top-level summary the brief requires.

## Relationship to prior work

This audit does not start from zero. Two prior audit generations already exist in this repository: a route/IA audit (`PAGE_AND_ROUTE_INVENTORY.md`, `INFORMATION_ARCHITECTURE_AUDIT.md`, `docs/architecture/*`) and a full twelve-agent Council review of a first-principles V1 redesign (`STICKEE_V1_EXECUTIVE_SUMMARY.md` and its seven companions). This audit's contribution is threefold: it applies the brief's specific 25-field OUTPUT PER PAGE template to every page including secondary ones neither prior generation covered at first-principles depth; it builds the two frameworks that didn't exist before (Responsibility Map, Civic Action Model); and it reclassifies every major element against the brief's exact ten-value truthfulness taxonomy. Every finding below cites its evidentiary source — this audit's own fresh code read, or a specific prior document — so direct code evidence, prior audit findings, and this audit's own analysis remain distinguishable.

---

## 1. Every page and tab audited

**32 `page.tsx` routes** (25 user-facing + 7 admin, admin out of scope per the brief) traced. Full breakdown in `docs/page-audits/PAGE_AUDIT_INDEX.md`:

- **6 core pages:** Today, Issues, Government, Forecasts, People, Political Pulse — each with a dedicated audit file.
- **6 detail-page object types:** Issue, Government Decision, Forecast, MP profile, Election, Civic Proposal — three of which (Government Decision, Forecast detail, Civic Proposal) do not exist as real pages today; documented in `DETAIL_PAGE_AUDIT.md`.
- **11 secondary pages:** `/decisions`, `/government` (redirect), `/leaderboard`, `/campaigns`, `/profile`, `/notifications`, `/impact`, `/simulator`, `/donate` cluster, `/onboarding`, auth cluster, `/u/[handle]` — `SECONDARY_PAGES_AUDIT.md`.
- **Every named tab/toggle/mode** (Issues' status filters; Government/Parliament's Priority Bill/Bill feed/Your Rep/Chamber/Live Election/How They Voted/My Campaign/education; Forecasts' filters/wallet/proposal/leaderboard; People's chamber/party filters/directory/side panel) — `TAB_AND_MODE_AUDIT.md`.
- **Confirmed absent from the codebase:** `/privacy`, `/terms`, `/about`, `/election`, `/election/[id]` (live election is a widget, not a route), any Civic Proposal route.

## 2. The single purpose of each core page

| Page | Single question |
|---|---|
| Today | What is happening? |
| Issues | Why is this happening? |
| Government | What has government actually done? |
| Forecasts | What is likely to happen next? |
| People | Who represents Australians, and what have they done? |
| Political Pulse | What changed? |

## 3. The five biggest product problems

1. **The core five pages carry ten cross-cutting duplicate systems**, not ten independent bugs — two wallets, two leaderboards, two "campaign" concepts, three-to-five representations of "a person in politics," two civics-education instances, two independently-filterable bill lists (Issues and Government). Fixing any one page without retiring its duplicate elsewhere relocates the defect rather than resolving it (`CROSS_PAGE_CONSISTENCY_AUDIT.md`, `SIMPLIFICATION_RECOMMENDATIONS.md`'s cross-cutting table).
2. **Issue detail is simultaneously an editorial brief, a live poll, a trading terminal, and an MP scoreboard** — ten stacked content blocks including two competing prediction mechanisms, with no progressive disclosure (`ISSUES_PAGE_AUDIT.md`).
3. **Forecasts' real, verified staking core is buried under five unrelated header controls** (wallet, positions, sign-in, propose, election toggle) that belong elsewhere or nowhere (`FORECASTS_PAGE_AUDIT.md`).
4. **No per-market Forecast detail page exists anywhere** — every forecast's entire on-platform presence is a list card plus a modal, forcing dense evidence/history/AI content onto a surface built for scanning, not reading (`DETAIL_PAGE_AUDIT.md`#forecast-detail).
5. **Two working "contact your MP" implementations exist, one real and one broken, with no way for a user to tell which is which** — `EmailMPButton` sends a real email; `CampaignModal`'s "Contact MP" copies text to the clipboard and does nothing (`CIVIC_ACTION_MODEL.md`).

## 4. The five biggest trust problems

1. **`/impact`'s pillar scoreboard remains entirely mock, presented with a "live"/"real metrics" framing**, the same defect class already fixed on Home (Batch 1) and Government (Batch 8) but not yet fixed here — `AGENTS.md`'s own Known Product Debt list names this, and it remains open (`SECONDARY_PAGES_AUDIT.md`#impact, rated **P0**).
2. **`/issue/[id]`'s who-supports/who-opposes narrative attributes specific positions to real political parties with no citation**, despite `issues.source_url` existing and going unused for exactly this claim type (`ISSUES_PAGE_AUDIT.md`).
3. **`/parliament`'s "How They Voted" mode and `MPActionStrip`'s alignment % present an inferred party-line vote as if it were a recorded division**, with no visual or textual distinction from real `member_votes` data — shared across Government and People (`GOVERNMENT_PAGE_AUDIT.md`, `TAB_AND_MODE_AUDIT.md`).
4. **`/feed`'s bot-authored civic alerts are indistinguishable from human commentary** — the one database field that would disclose automated authorship (`source_agent_id`) is deliberately dropped before reaching the client (`POLITICAL_PULSE_PAGE_AUDIT.md`).
5. **`/u/[handle]` presents four fictional citizens as real Stickee users**, with no label distinguishing them, and `CampaignModal`'s participant counter is hardcoded rather than reading the real, already-built aggregation endpoint sitting unused beside it (`SECONDARY_PAGES_AUDIT.md`#u-handle, `CIVIC_ACTION_MODEL.md`).

## 5. The five biggest consistency problems

1. **Only one core page (People) fully satisfies the proposed shared page grammar** — a stated one-sentence purpose, a source/update line, one hero number computed from real content. Government/Parliament is the least consistent, substituting four hardcoded stats for a stated purpose entirely (`CROSS_PAGE_CONSISTENCY_AUDIT.md`).
2. **The same real chamber/vote/live-election mechanism is independently implemented on two pages** (Government and People) rather than built once and referenced twice — a fix to one copy does not automatically reach the other (`TAB_AND_MODE_AUDIT.md`).
3. **Hero-number discipline is inconsistent app-wide**: Issues states its count three times on one header; Government shows four uncomputed literals; only People shows one real, sourced number alone in its row (`CONTENT_HIERARCHY.md` §6, re-verified in `CROSS_PAGE_CONSISTENCY_AUDIT.md`).
4. **The same mobile bug class (a functional control hidden, not reflowed, inside `hidden sm:*`) recurs independently on two unrelated pages** — Issues' row-expand chevron and Forecasts' wallet/propose controls (`CROSS_PAGE_CONSISTENCY_AUDIT.md`).
5. **Card grammar diverges page to page** — Today and Issues render article-shaped cards (kicker → headline → summary → metadata); Forecasts' `MarketCard`/`FeaturedMarketCard` and `DecisionCard` render dashboard-tile-shaped cards (big number, coloured pill, buy-adjacent action) — a structural inconsistency independently corroborated by, but distinct from, the visual-system audit's own colour/shadow findings (`CROSS_PAGE_CONSISTENCY_AUDIT.md`).

## 6. The proposed Responsibility Map

Full spec: `docs/page-audits/RESPONSIBILITY_MAP_SPEC.md`. A cross-cutting "Who can change this?" content block, not a new page — plain-language role statements (Federal Government / Responsible Minister / House / Senate / your local MP / Committee / Department / State Government / Local Council), each tagged with a stage indicator and, critically, **honestly marked "not yet available" for any role Stickee's schema doesn't yet model** (Minister, Department, and Committee are all confirmed **not currently modeled as first-class objects anywhere in the codebase** — `docs/architecture/DOMAIN_MODEL.md`). No numeric influence/power score exists anywhere in the spec, and none may be added without the same methodology review already binding on MP scoring (`docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md`).

## 7. The proposed Civic Action model

Full spec: `docs/page-audits/CIVIC_ACTION_MODEL.md`. Replaces "Email your MP" as the default/only action with an 11-item contextual menu (understand → see who decides → follow → track the vote → contact your MP → contact the minister → committee submission → attend a consultation → follow amendments → support an evidence-backed proposal → add bill-pressure), each specified with when it's available, who receives it, its realistic outcome, and — critically — **what confirmation Stickee can truthfully provide**, since the audit found the app's own current mechanism for this exact action is broken (`CampaignModal`'s contact button) beside a working one it doesn't use (`EmailMPButton`). Three of the eleven actions have zero infrastructure today (contact the minister, committee submissions, consultations) and are honestly marked as such rather than faked.

## 8. Recommended implementation order

Full plan: `docs/page-audits/PAGE_IMPROVEMENT_ROADMAP.md` (12 batches, cross-referenced against the two existing roadmaps so nothing is duplicated or lost).

```
Batch 1  Remove remaining fabricated content (no dependency — start immediately)
Batch 2  Shared page grammar
Batch 3  Issues simplification (gated on the Issue/Decision schema-merge owner decision)
Batch 4  Government/Parliament simplification
Batch 5  People simplification
Batch 6  Forecast list simplification (High risk — touches verified wallet infrastructure)
Batch 7  Forecast detail page (new)
Batch 8  Political Pulse remediation
Batch 9  Responsibility Map (new)
Batch 10 Civic Action model (new)
Batch 11 Secondary/account pages
Batch 12 Route cleanup and redirects (must be last)
```

Batch 1 has no dependency on any other decision and should land first. Batches 9–11 are net-new work this audit generation adds; none block, or are blocked by, the schema-merge decision gating Batches 3–7.

## 9. Owner decisions required

Consolidated from every audit file — none resolved by this report:

1. **The Issue/Bill/Decision schema-merge strategy** (own-table vs. presentation-layer) — gates Batches 3, 4, 7, and the Government Decision object entirely.
2. **Whether real executive-decision/Minister/Department content is scoped as first-class objects** — the largest content gap in the Responsibility Map.
3. **How to reconcile `useWallet`/`usePredictionWallet`** before any wallet relocation — requires real-database re-verification, not static review, per `AGENTS.md`.
4. **Whether `/onboarding` is rebuilt as a real data-collecting page or retired in favour of always reopening `OnboardingModal`** — referenced identically from both Today's and Onboarding's own audits; one decision, not two.
5. **Whether community-nominated leaders stay visible on People pending the separate Community-feature legal review** — the *existing, shipped* section is a different decision from *new* Community scope.
6. **Whether `/u/[handle]` is hidden outright or repurposed as Political Pulse's real author-identity view.**
7. **Fund wiring `pillar_metrics` to a real source for `/impact`, or explicitly relabel it illustrative** — the single highest-priority open truthfulness item this audit found.
8. **Commission the D1 legal review** (the forecast engagement mechanic — daily bonus, streak-freeze purchase, probability staking — independent of visual styling) before treating any Forecasts relocation as fully resolved.
9. **Whether `/action`/the rebuilt `/campaigns` supports campaigns beyond a single bill** (new scope) or stays bill-specific (pure consolidation of the existing real mechanism).
10. Every schema/legal/professional-review gate already named in `STICKEE_V1_EXECUTIVE_SUMMARY.md` (unchanged, not re-litigated by this audit — see that document for the full list).

## 10. Files created

**`docs/page-audits/`:** `PAGE_AUDIT_INDEX.md`, `TODAY_PAGE_AUDIT.md`, `ISSUES_PAGE_AUDIT.md`, `GOVERNMENT_PAGE_AUDIT.md`, `FORECASTS_PAGE_AUDIT.md`, `PEOPLE_PAGE_AUDIT.md`, `POLITICAL_PULSE_PAGE_AUDIT.md`, `DETAIL_PAGE_AUDIT.md`, `SECONDARY_PAGES_AUDIT.md`, `TAB_AND_MODE_AUDIT.md`, `RESPONSIBILITY_MAP_SPEC.md`, `CIVIC_ACTION_MODEL.md`, `CROSS_PAGE_CONSISTENCY_AUDIT.md`, `PAGE_IMPROVEMENT_ROADMAP.md`.

**Repo root:** `PAGE_BY_PAGE_AUDIT_REPORT.md` (this file).

No existing file was modified or overwritten. Every pre-existing uncommitted change present in the working tree at the start of this task (per `git status` — ~30 modified application files and ~60 untracked prior-audit documents) was left exactly as found.

## 11. Confirmation

No application code, CSS, database schema, or migration was changed. No route was added, renamed, or redirected. Production, staging, the Git remote, and the staging area were not accessed. Nothing was staged, committed, or pushed. This task consisted entirely of reading existing source files and prior audit documentation, and writing the fifteen new documentation files listed above.
