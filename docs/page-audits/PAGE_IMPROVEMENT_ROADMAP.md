# Page Improvement Roadmap

Governed by [`AGENTS.md`](../../AGENTS.md). Structured in the twelve batches requested by this audit's brief. **This does not replace the two existing roadmaps** — `PAGE_REFACTOR_ROADMAP.md` (Batches 1–7, of which 1/2/2.5 are shipped) and `IMPLEMENTATION_BATCHES.md` (Batches 8–15, of which Batch 8 is partially shipped). Every batch below states which existing batch(es) it corresponds to, so a reader working from any of the three documents lands on the same plan. Nothing in this document authorises implementation — per `AGENTS.md` and `docs/STICKEE_COUNCIL.md`, each batch requires its own owner decision before work begins, and no batch may be staged, committed, or deployed without separate, explicit authorisation.

## Batch cross-reference table

| This roadmap | Corresponds to | Status |
|---|---|---|
| Batch 1 — Remove fabricated content | `PAGE_REFACTOR_ROADMAP.md` Batches 1, 2.5 (shipped) + `IMPLEMENTATION_BATCHES.md` Batch 8 (partially shipped) | 🟡 Partially shipped — remainder below |
| Batch 2 — Shared page grammar | New — extends `PAGE_REFACTOR_ROADMAP.md` Batch 2's navigation-consistency work to page structure | ⬜ Not started |
| Batch 3 — Issues simplification | `PAGE_REFACTOR_ROADMAP.md` Batch 3 + `IMPLEMENTATION_BATCHES.md` Batches 9, 11 | 🟡 List-page simplification and detail-page truthfulness fixes shipped (see `ISSUES_V1_SIMPLIFICATION_REPORT.md`); schema-merge/Decision-retirement portion still not started (owner decision pending) |
| Batch 4 — Government/Parliament simplification | `PAGE_REFACTOR_ROADMAP.md` Batch 4 (Parliament half) + `IMPLEMENTATION_BATCHES.md` Batch 11 | ⬜ Not started |
| Batch 5 — People simplification | `PAGE_REFACTOR_ROADMAP.md` Batch 4 (People half) + `IMPLEMENTATION_BATCHES.md` Batch 13 | ⬜ Not started |
| Batch 6 — Forecast list simplification | `PAGE_REFACTOR_ROADMAP.md` Batch 5 + `IMPLEMENTATION_BATCHES.md` Batch 12 (list portion) | ⬜ Not started |
| Batch 7 — Forecast detail page | `IMPLEMENTATION_BATCHES.md` Batch 12 (detail-page portion) | ⬜ Not started — genuine net-new page |
| Batch 8 — Political Pulse remediation | `IMPLEMENTATION_BATCHES.md` Batch 10 (Pulse portion) | ⬜ Not started |
| Batch 9 — Responsibility Map | New — no prior roadmap scoped this | ⬜ Not started |
| Batch 10 — Civic Action model | New — extends `PAGE_REFACTOR_ROADMAP.md` Batch 6's Campaigns consolidation | ⬜ Not started |
| Batch 11 — Secondary/account pages | `PAGE_REFACTOR_ROADMAP.md`'s implied Account work + this audit's `SECONDARY_PAGES_AUDIT.md` findings | ⬜ Not started |
| Batch 12 — Route cleanup and redirects | `PAGE_REFACTOR_ROADMAP.md` Batch 7 | ⬜ Not started (must be last) |

---

## Batch 1 — Remove remaining fabricated or unsupported content

**Purpose:** Finish the truthfulness sweep `IMPLEMENTATION_BATCHES.md` Batch 8 started — every item below has no schema dependency and is ready now.
**Pages affected:** `/impact` (P0 — see `SECONDARY_PAGES_AUDIT.md`#impact), `/issue/[id]` (who-supports/opposes citations), `/parliament` (four hardcoded header stats, party-line vote-inference disclosure), `/predictions` (AI bull/bear fallback, fake volume/24h-move, `ProposeMarketModal` removal), `/parliament`'s `CampaignModal` (mailto fix, real participant count), `/feed` (`source_agent_id` restoration, remove boosted badge/share-for-points/letter grades), `/u/[handle]` (hide route).
**Files likely affected:** `CivicScorecard.tsx`/`impact/page.tsx`, `issue/[id]/page.tsx` + `issues-db.ts` (source_url wiring), `parliament/page.tsx`, `MarketCard.tsx`/`FeaturedMarketCard.tsx`/`ProposeMarketModal.tsx`, `CampaignModal.tsx`, `src/lib/feed/ranker.ts`/`rowToFeedPost`, `src/app/feed/page.tsx`, `src/app/u/[handle]/page.tsx` (or its route entirely).
**Data dependencies:** None — every item is presentation/removal, same risk class as the already-shipped Batch 1/2.5/8.
**Fake content removed:** `/impact`'s live-presented mock pillar scoreboard; uncited who-supports/opposes claims; four hardcoded parliament stats; undisclosed party-line vote inference; AI bull/bear fallback text; fake volume/24h-move; `ProposeMarketModal`'s implied review pipeline; feed's boosted badge/letter grades/share-for-points; fictional `/u/[handle]` profiles.
**Components reused:** `EmptyState` (already built, already the correct pattern everywhere else) — extend to `/impact`, feed's empty period.
**Tests:** Regression tests per the repo's established grep-assertable pattern (`page-refactor-batch-1.test.ts`, `batch-8-truthfulness.test.ts` precedent) — one assertion per removed/fixed element.
**Council reviewers:** Data & Evidence Steward + Editorial Advisor + Public Policy Advisor (per `docs/STICKEE_COUNCIL.md` release gates for a truthfulness-class change).
**Owner decisions:** None beyond confirming the batch — every item is already-named debt, no new scope.
**Acceptance criteria:** No page in the app presents mock/hardcoded/inferred content with the same visual authority as verified fact; every "take action" control produces a real, traceable effect or is honestly disabled.

---

## Batch 2 — Shared page grammar

**Purpose:** Apply `CROSS_PAGE_CONSISTENCY_AUDIT.md`'s proposed grammar (PageHeader → one-sentence purpose → source line → one primary block → minimal filters → flat list → related info → evidence block → truthful empty state) to every core page's header, using People's header as the literal reference implementation.
**Pages affected:** Today, Issues, Government/Parliament, Forecasts (People already compliant — no change needed there beyond serving as the template).
**Files likely affected:** Each page's header section; promote `StatHeader`/`MetaLine` (already-built shared primitives, per `CIVIC_DESIGN_SYSTEM.md` Phase 2) to mandatory use on every real-data header.
**Data dependencies:** None for the grammar itself; computing Government's "one real hero stat" and Issues' single-instance count requires no new data, only removing the duplicate renderings.
**Fake content removed:** N/A (structural batch, not a truthfulness batch — but shares Batch 1's finding that Government's stats are hardcoded, so this batch depends on Batch 1 having removed them first).
**Components reused:** `StatHeader`, `MetaLine`, `SectionHeader` — no new component needed.
**Tests:** A snapshot/structural test asserting every core-page header contains exactly one hero number and one source/update line.
**Council reviewers:** UX Researcher + Software Architect (per Release Gates' "Navigation"/"UI tweak" rows, since this changes structure without changing routes).
**Owner decisions:** None — this is a direct, uncontested application of a pattern already proven live on one page.
**Acceptance criteria:** Every core page's header states its purpose in one sentence, carries at most one computed hero number, and (where real data backs it) a source/update line.

---

## Batch 3 — Issues simplification

**Status: 🟡 Partially shipped.** The list-row collapse (to title/summary/status/one action), the "Bills & Issues" → "Issues" terminology fix, and the detail-page truthfulness gating described below are complete — see `ISSUES_V1_SIMPLIFICATION_REPORT.md` for the full before/after. Topic search and the `/decisions` retirement (both dependent on the schema-merge decision) remain not started.

**Purpose:** Collapse the list row to 2 data points, add topic search, and — pending the owner's schema-merge decision — retire `/decisions` into Issues as a content-type filter.
**Pages affected:** `/issues`, `/issue/[id]` → target `/issues/[slug]`, `/decisions` (retires).
**Files likely affected:** `IssuesPageClient.tsx`, `issue/[id]/page.tsx`, `issues-data.ts`/`issues-db.ts`, `mock-government-data.ts` (retires), `DecisionCard.tsx` (retires or becomes an Issue-type variant).
**Data dependencies:** **Load-bearing:** the Issue/Bill/Decision schema-merge strategy (own-table vs. presentation-layer) — an explicit owner decision, not resolvable by this batch alone.
**Fake content removed:** N/A directly (Batch 1 already removed the live fabrications on this page family) — this batch is a structural simplification of already-truthful content.
**Components reused:** `UnderlineFilter`, `ArticleCard`/row-list pattern.
**Tests:** Data-mapping test that every existing mock-Decision-shaped concept resolves to real content post-merge; component test that the merged detail page renders exactly one prediction affordance.
**Council reviewers:** Software Architect + Data & Evidence Steward + Historian (schema/history-integrity implications) + UX Researcher.
**Owner decisions:** The schema-merge strategy itself (`IMPLEMENTATION_BATCHES.md` Batch 9); whether "Decision" survives as a visible filter.
**Acceptance criteria:** One list, one ID namespace, one detail-page pattern; collapsed row shows 2 data points, not 7; embedded market widget and MP-vote grid become linked summary chips.

---

## Batch 4 — Government/Parliament simplification

**Purpose:** Remove the duplicated bill list, compute the header stat honestly, add the explicit executive/legislature split, fix `MPActionStrip`'s dead profile link, and disclose the party-line vote inference.
**Pages affected:** `/parliament` → target `/government/parliament`.
**Files likely affected:** `ParliamentExperienceClient.tsx`, `parliament/page.tsx`, `MPActionStrip.tsx`, `HouseChamber.tsx` (disclosure fix, shared with People).
**Data dependencies:** None for the stat/link/disclosure fixes; the executive-content split depends on whether real Government Decision content is scoped for this batch (recommend: defer executive content to Batch 3/9's schema work, ship the structural split as an empty-but-honest section in the meantime).
**Fake content removed:** Four hardcoded header stats (if not already removed in Batch 1); undisclosed vote inference.
**Components reused:** `StatHeader`; the existing chamber toggle (kept unchanged — correctly built).
**Tests:** A test that Parliament's bill section is link-only, not a second filterable list; a link-integrity test for `MPActionStrip` → `/mp/[id]`.
**Council reviewers:** Public Policy Advisor + Editorial Advisor + Historian (per Release Gates' "Government page" row) + Data & Evidence Steward (vote-inference disclosure).
**Owner decisions:** Whether real executive-decision content is scoped for this batch at all.
**Acceptance criteria:** No duplicate bill list; one computed hero stat; `MPActionStrip` links to a real profile; inferred votes are visually/textually distinct from recorded divisions.

---

## Batch 5 — People simplification

**Purpose:** Promote the directory above the chamber/education blocks, replace the full interactive chamber with a static composition strip, relocate the electorate tool here with a working profile link, de-duplicate the civics accordion.
**Pages affected:** `/leaders` → target `/people`.
**Files likely affected:** `src/app/leaders/page.tsx`, `MPActionStrip.tsx` (relocated or duplicated with a fixed link), a new static composition-strip component.
**Data dependencies:** The MP canonical-ID migration (`members.id`/`tvfy_id`, not the current mock `MPIndex` scheme) benefits this batch but doesn't block the structural reordering.
**Fake content removed:** N/A — already clean post-Batch-2.5; this is a pure structural simplification.
**Components reused:** Existing directory sort/filter/search (unchanged, already correct); `StatHeader` (already correct here — the template, not a target).
**Tests:** A test that the electorate tool's result links to the correct MP profile; a regression test that no fabricated score (`generateScores()`, `POLITICIAN_SCORECARDS`, `PARTY_VOTE_MAP`) is reachable from any surface this batch touches.
**Council reviewers:** Public Policy Advisor + Civic Technology Advisor + Editorial Advisor + Data Steward (per the brief's own "People and Responsibility Map" reviewer list).
**Owner decisions:** Approve the MP canonical-ID mapping plan before wiring real vote history; confirm whether community-nominated leaders stay visible pending the separate Community legal review.
**Acceptance criteria:** Directory is the first content block below the hero; electorate tool lives here with a working link; chamber reduces to a static strip; one shared civics-education instance, not two.

---

## Batch 6 — Forecast list simplification

**Purpose:** Slim the board to hero + featured + filters + grid; move wallet/portfolio to Account; remove/hide the leaderboard slot; gate election pulse on activity; remove the propose-modal entry point (if not already done in Batch 1).
**Pages affected:** `/predictions` → target `/forecasts`.
**Files likely affected:** `PredictionsPageClient.tsx` (split into board + relocated Account components), `PortfolioPanel.tsx`, `LiveElectionPulse.tsx` (gate on `useLiveElection().active`), `useWallet.ts`/`usePredictionWallet.ts` (reconciliation).
**Data dependencies:** **High-risk:** wallet reconciliation touches AGENTS.md's verified financial-equivalent infrastructure — requires real Postgres/Supabase re-verification before shipping, not static review, per the constitution's mandatory rule.
**Fake content removed:** N/A directly if Batch 1 already handled AI-fallback/volume; this batch's own removal is the duplicate wallet and leaderboard *systems*, not additional fabricated content.
**Components reused:** `UnderlineFilter`, `ArticleCard`-equivalent market card (once brought into article grammar per `CROSS_PAGE_CONSISTENCY_AUDIT.md`'s card-grammar finding).
**Tests:** Single-source-of-truth test that only one wallet balance concept exists per user; regression test that the leaderboard's data source is no longer duplicated.
**Council reviewers:** Software Architect + Legal Advisor + Data & Evidence Steward (per Release Gates' "Forecast engine" row).
**Owner decisions:** How to reconcile `useWallet`/`usePredictionWallet`; commission the D1 legal-review question (engagement mechanic) before calling any relocation "resolved."
**Acceptance criteria:** Board contains only board content; one real wallet; election content only appears when relevant; no engagement mechanic presented as "fixed" without the D1 legal review having occurred.

---

## Batch 7 — Forecast detail page

**Purpose:** Build `/forecasts/[id]`, the genuine current gap — question, current probability + history, resolution criteria, evidence (linked from the originating issue), stake action.
**Pages affected:** New `/forecasts/[id]`.
**Files likely affected:** New route + component; `MarketCard.tsx` (add a link to the new detail page); the originating Issue's forecast-summary chip (from Batch 3) should point here.
**Data dependencies:** `resolution_source` must be surfaced publicly (currently DB-only) — a presentation fix, no schema change.
**Fake content removed:** Prevents re-introducing AI-fallback/fake-volume defects into the new page — must be built clean, not by copying `MarketCard`'s current implementation wholesale.
**Components reused:** Article grammar shared with Issue detail and Government Decision detail (per `STICKEE_V1_PRODUCT_BLUEPRINT.md` §3's "one card grammar, one hero-stat pattern, everywhere").
**Tests:** Route test asserting the page renders question/probability/evidence-link/resolution-criteria/stake action for a real eligible market.
**Council reviewers:** Legal Advisor (resolution-criteria wording for politically contested bills) + Product Intelligence & Benchmarking Advisor (Kalshi-derived pattern, rated "Adapt," conditional) + Public Policy Advisor.
**Owner decisions:** Whether resolution-criteria wording needs a standing Public Policy review step per new forecast, or only for flagged edge cases.
**Acceptance criteria:** Every real forecast is individually linkable; AI-generated content is explicitly labeled; no fake volume/24h-move ships on the new page.

---

## Batch 8 — Political Pulse remediation

**Purpose:** Restore authorship disclosure, remove engagement mechanics, build the chronological (not engagement-weighted) query path, scope content strictly to the evidence-supportable subset.
**Pages affected:** `/feed` (re-scoped, not renamed).
**Files likely affected:** `src/lib/feed/ranker.ts` (new chronological path alongside, not replacing, the existing one), `rowToFeedPost`, `src/app/feed/page.tsx`.
**Data dependencies:** None new — reads existing `feed_posts`; confirm the type enum can carry the mandatory actor-type tag, extend if not.
**Fake content removed:** "↑ BOOSTED" badge, `scoreToGrade` badges, share-for-points, concealed authorship (if not already fixed in Batch 1).
**Components reused:** A dated list-entry pattern shared with Today's "what changed" strip (Batch 2/Today rebuild) — one implementation, two lengths, not two implementations.
**Tests:** A test that Political Pulse never renders one of the six excluded content types (Committees/ABS/RBA/Treasury/Speeches/Source-corrections); a test that every entry carries a visible actor-type tag.
**Council reviewers:** Data & Evidence Steward + Editorial Advisor + Software Architect + Civic Technology Advisor (per Consensus C2's four independent raisers).
**Owner decisions:** Confirm the six excluded content types stay excluded until each independently has real infrastructure.
**Acceptance criteria:** Chronological, sourced, actor-tagged; zero engagement mechanics; zero excluded content types.

---

## Batch 9 — Responsibility Map

**Purpose:** Build the "Who can change this?" block per `RESPONSIBILITY_MAP_SPEC.md`, for the object types with real data readiness today (Issue/Bill, MP; Election needs no new content).
**Pages affected:** Issue detail, MP profile (Government Decision, Minister, Department, Committee, Civic Proposal remain "not yet available," honestly stated, until their underlying objects are real).
**Files likely affected:** New shared `ResponsibilityMap` component; wired into `issue/[id]/page.tsx` and `mp/[id]/page.tsx`.
**Data dependencies:** None beyond what Issue/Bill and MP already have real (level, `divisions`, `members.electorate`) — this batch is presentation over existing real data, with explicit "not yet available" states for the not-yet-modeled roles (Minister/Department/Committee).
**Fake content removed:** N/A — this batch's entire discipline is *not* inventing plausible-sounding Minister/Department/Committee names to fill a visually complete block; a partial, honest Map is the correct output, not a blocker.
**Components reused:** `EmptyState`-equivalent per-row treatment for "not yet available" roles.
**Tests:** A test that no Responsibility Map row for Minister/Department/Committee renders a name where the object isn't yet modeled; a test that every rendered role includes a stage/status qualifier.
**Council reviewers:** Public Policy Advisor + Civic Technology Advisor + Data & Evidence Steward.
**Owner decisions:** Whether to prioritize building Minister/Department as real, normalized objects now (unlocking a materially more complete Map) or defer — a genuine new-scope decision, not covered by any existing roadmap batch.
**Acceptance criteria:** Every Issue/Bill and MP page shows a Responsibility Map block; no invented role names; every role carries a stage indicator; zero numeric influence scores anywhere in the implementation.

---

## Batch 10 — Civic Action model

**Purpose:** Retire `CampaignModal`'s broken contact action in favour of the real `EmailMPButton` flow; wire the real participant-count endpoint; promote the real `bill_pressures` mechanism beyond `/parliament`-only; build the "How can I influence this?" block per `CIVIC_ACTION_MODEL.md`.
**Pages affected:** Issue detail, `/parliament`, `/campaigns` (retired in favour of the real mechanism, per `CONSOLIDATION_AND_REDIRECT_PLAN.md`'s `/action` proposal).
**Files likely affected:** `CampaignModal.tsx`, `EmailMPButton.tsx`/`EmailMPModal.tsx`, `src/app/campaigns/page.tsx`, a new shared "How can I influence this?" component reading real availability per object stage.
**Data dependencies:** None new — `/api/bills/[billId]/pressure` and `/api/bills/pressure-summary` are both already real and unused/misused respectively.
**Fake content removed:** `CampaignModal`'s hardcoded mock participant count; its non-functional clipboard-copy "contact" action; `/campaigns`' standalone fake join/propose mechanic (already labeled illustrative post-Batch-1 — this batch replaces it with the real thing rather than leaving it labeled indefinitely).
**Components reused:** `EmailMPButton`/`EmailMPModal` (the one working contact mechanism) becomes the sole contact implementation app-wide.
**Tests:** A test that the real campaign-action pathway is reachable from more than one page without duplicating its implementation; a test that no page still contains the old fake `/campaigns` mechanic once retired.
**Council reviewers:** Civic Technology Advisor + Legal Advisor + UX Researcher + Public Policy Advisor (per the brief's own "Civic Action" reviewer list).
**Owner decisions:** Whether `/action` (or the rebuilt `/campaigns`) is bill-specific only or supports independently-trackable campaigns (new scope vs. consolidation).
**Acceptance criteria:** Exactly one "contact your MP" mechanism, real, everywhere; exactly one "add pressure" mechanism, real, everywhere; every action's confirmation copy matches what Stickee can actually verify (see `CIVIC_ACTION_MODEL.md`'s per-action truthful-confirmation column).

---

## Batch 11 — Secondary/account pages

**Purpose:** Fix `/onboarding`'s broken promise (either rebuild as real data-collection or always reopen `OnboardingModal`); consolidate `/profile` toward `/account`; retire the `useWallet`/`useAuthStatus` duplication remnants; hide `/u/[handle]` until real.
**Pages affected:** `/onboarding`, `/profile` → `/account`, `/notifications` → `/account/notifications`, `/u/[handle]`.
**Files likely affected:** `src/app/onboarding/page.tsx`, `OnboardingModal.tsx`, `src/app/profile/page.tsx`, `src/app/u/[handle]/page.tsx` (or removed from the route tree).
**Data dependencies:** None new for the onboarding/profile fixes; `/u/[handle]`'s hide is a route-visibility decision, not a data change.
**Fake content removed:** `/u/[handle]`'s fictional citizen profiles (hidden, not fixed-in-place, since no real feature underlies them yet).
**Components reused:** `OnboardingModal`'s existing real, persisting write path — extended rather than left orphaned next to a static duplicate page.
**Tests:** A test that Today's personalisation CTAs lead to a flow that actually collects and persists a preference; a test that `/u/[handle]` is unreachable (404 or explicit hidden state) once retired.
**Council reviewers:** UX Journey and Bottleneck Analyst (personalisation dead-end, already rated "Blocking friction") + Product Strategist.
**Owner decisions:** Rebuild `/onboarding` vs. always-reopen `OnboardingModal` (one decision, referenced identically from `TODAY_PAGE_AUDIT.md` and `SECONDARY_PAGES_AUDIT.md` — do not decide it twice); whether `/u/[handle]` is hidden outright or repurposed as Political Pulse's real author-identity view.
**Acceptance criteria:** Every personalisation CTA on Today actually personalises something; no fictional person is presented as a real Stickee user anywhere in the app.

---

## Batch 12 — Route cleanup and redirects

**Purpose:** Once Batches 1–11 are stable, implement the redirect table from `CONSOLIDATION_AND_REDIRECT_PLAN.md`, remove now-dead code, and do a final link-integrity pass.
**Pages affected:** All routes retired or renamed by prior batches (`/decisions`→`/issues`, `/predictions`→`/forecasts`, `/leaders`→`/people`, `/issue/[id]`→`/issues/[slug]`).
**Files likely affected:** `next.config.ts` or route-level `redirect()` calls (check `node_modules/next/dist/docs` for this Next.js version's recommended pattern, per `AGENTS.md`), plus a repo-wide search-and-replace for every hardcoded old-route `href`.
**Data dependencies:** None — purely routing/link cleanup.
**Fake content removed:** N/A — this batch is integrity cleanup, not truthfulness work.
**Components reused:** N/A.
**Tests:** A redirect-integrity test suite hitting every entry in the redirect table; a full link-crawl pass confirming no internal link points at a retired route.
**Council reviewers:** Software Architect + Historian (permanent-URL/redirect integrity, per Release Gates).
**Owner decisions:** Redirect status-code convention (308 recommended); how long legacy redirects should be kept.
**Acceptance criteria:** Every route in the "old" column of `PROPOSED_ROUTE_TREE.md`'s mapping table either still works or redirects correctly; no dead links remain; `feed/page.tsx.bak` and other stray dead files are finally removed.

---

## Sequencing

```
Batch 1 (truthfulness) ──┬─→ Batch 2 (page grammar) ─→ Batch 3 (Issues) ─┬─→ Batch 4 (Government) ─┐
                          │                                              ├─→ Batch 5 (People)      ├─→ Batch 12 (redirects)
                          │                                              ├─→ Batch 6 (Forecasts)   │        (last, always)
                          │                                              │      └─→ Batch 7 (Forecast detail)
                          │                                              └─→ Batch 9 (Responsibility Map, once Issue detail is stable)
                          └─→ Batch 8 (Political Pulse) ─────────────────────────────────────────────┤
                                                                                                        │
Batch 10 (Civic Action) — independent, can start any time after Batch 1 ─────────────────────────────┤
Batch 11 (Secondary/account pages) — independent, can start any time after Batch 1 ────────────────────┘
```

Batch 1 has no dependency and should land first, matching the precedent every prior audit generation has already set (Batches 1/2/2.5/8 in the existing roadmaps). Batch 12 must be last. Batches 9, 10, and 11 are the genuinely new work this audit generation adds — none were scoped by the two prior roadmaps, and none block or are blocked by the schema-merge decision that gates Batches 3–7.
