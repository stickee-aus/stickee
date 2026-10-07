# Stickee V1 — Implementation Batches

Companion to all six prior deliverables. **This document extends `PAGE_REFACTOR_ROADMAP.md` (Batches 1–7, of which 1/2/2.5 are already implemented) — it does not replace it**, per the Product Strategist's explicit Council finding that this program's five-page hierarchy independently converges with that roadmap's own destination. New batches below are numbered 8 onward to avoid collision. Where a new batch is the layout/content execution detail for an already-planned Batch 3/4/5, that's stated explicitly rather than treated as new scope.

**Nothing in this document authorises implementation.** Per `AGENTS.md` and `docs/STICKEE_COUNCIL.md`, this is the plan; each batch still requires the specific owner decision named in `STICKEE_V1_EXECUTIVE_SUMMARY.md` before work begins, and no batch may be staged, committed, or deployed without separate, explicit authorisation at that time.

---

## Sequencing

```
Batch 8  (truthfulness sweep — independent, no gate) ─────────────────────────────┐
                                                                                     │
Batch 9  (schema foundations — owner approves merge strategy) ──┬─────────────────┼─→ Batch 11 (Issues/Government/
                                                                   │                 │             Government Decision)
                                                                   │                 │
                                                                   ├─→ Batch 10 (Today + Political Pulse V1) ┤
                                                                   │                                          │
                                                                   └─→ Batch 13 (People/MP profile) ──────────┤
                                                                                                                │
Batch 14 (legal & policy review track — runs in parallel, gates copy/mechanic sign-off, not structural work) ─┤
                                                                                                                │
                                                          Batch 12 (Forecasts — gated on Batch 14's D1 review) ┘

Batch 15 (Community) ─── not scheduled — prerequisites in Batch 14, revisit after
```

Batch 8 has no dependency on anything and should land first regardless of any other decision, matching the precedent this repository already set with Batches 1/2/2.5. Batches 10, 11, 13 depend on Batch 9's schema decision. Batch 12 is structurally independent of Batch 9 but gated on Batch 14's legal review before its engagement-mechanic copy/features are called finished — the visual/structural work may proceed in parallel with that review, per the Legal Advisor's own framing (design toward the calm/evidence-first direction now; don't call the mechanic question resolved until reviewed).

---

## Batch 8 — Truthfulness sweep

**Status: Partially implemented (2026-08-05).** The two P0 items the owner explicitly approved as the first V1 implementation slice — the Government nav destination, and every live fabricated-politician-scoring system — are done. See `STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md` for full detail. The rest of this batch's list below (feed badges/share-for-points, `ProposeMarketModal` removal, `MarketCard`/`FeaturedMarketCard` AI-fallback and fake-volume suppression, `CampaignModal` mailto/pressure-counter fix) has **not** been started. Independent, no dependency on any other batch — same risk class as the already-shipped Batches 1/2/2.5.

**Goal:** Fix every P0/blocking-equivalent finding from the Council review that requires no schema change, no new route, and no legal gate — the smallest, safest, highest-corroboration fixes in the whole program.

**Exact routes/components affected:**
- ✅ **Done** `src/lib/navigation.ts` — points "Government" at `/parliament` instead of `/decisions`; `/decisions` itself now shows a truthful transitional state instead of the mock decision feed; `/government`'s redirect target updated to match.
- ✅ **Done** `src/components/HouseChamber.tsx` — `generateScores()` and its Approval/Trust/Public-Pressure bar rendering removed entirely.
- ✅ **Done** `src/lib/mock-government-data.ts`, `src/types/government.ts` — `DecisionMaker.approvalRating`/`trustScore`/`totalRatings` fields removed (no live component rendered them, but the fields were removed from the type/data to prevent reintroduction). Also fixed in this pass: `POLITICIAN_SCORECARDS` no longer renders on `/impact` (`CivicScorecard`), and `MPVoteGrid.tsx`'s `PARTY_VOTE_MAP`-derived per-MP "MP Vote" badge on `/issue/[id]` — a fourth live instance of the same defect, not originally listed in this bullet list, found during the import trace. See `STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md`.
- ⬜ Not started `src/components/DecisionCard.tsx` — remove the decorative Yes/No poll and the "✓ You're with the majority — X% of Australians agree" social-proof line.
- ⬜ Not started `src/app/parliament/page.tsx` — remove or compute the four header stat tiles; at minimum remove "74% Predict Acc." (internally contradicts Forecasts' own honest copy).
- ⬜ Not started `src/components/ProposeMarketModal.tsx`, `PredictionsPageClient.tsx` — remove the "+Propose" entry point until a real backend exists.
- ⬜ Not started `src/components/MarketCard.tsx`, `FeaturedMarketCard.tsx` — suppress AI bull/bear fallback rendering when no real analysis exists (don't substitute generic template text); flag fake volume/24h-move fields for removal or real wiring.
- ⬜ Not started `src/components/CampaignModal.tsx` — add real `mailto:` resolution (reuse `EmailMPModal.tsx`'s working pattern); replace the hardcoded mock participant counter with a call to the already-real `/api/bills/pressure-summary`.
- ⬜ Not started Feed data-access layer (`rowToFeedPost` or equivalent) — restore `source_agent_id` to the client shape.
- ⬜ Not started `src/app/feed/page.tsx` — remove the "↑ BOOSTED" badge, the share-for-points bonus, and `scoreToGrade` badge rendering.

**Data implications:** None — every fix above is presentation/removal, matching Batch 1's precedent exactly. No migration, no schema change.

**Tests required:** Regression tests per the repo's existing grep-assertable pattern (see `PAGE_REFACTOR_BATCH_1_REPORT.md`'s precedent) confirming each removed element doesn't reappear; a test that `CampaignModal`'s contact action produces a real `mailto:` link; a test that the feed client shape includes authorship disclosure.

**Risk level:** Low — no route moves, no data-model changes, purely fixing broken/fake behaviour in place, identical risk profile to Batches 1/2.5.

**Owner decisions required:** None beyond confirming the batch — every item is already-established known debt (`AGENTS.md`'s Current Known Product Debt, plus the four newly-surfaced fabricated-score/broken-mechanism findings this Council review adds).

**Acceptance criteria:** No page in the app shows a fabricated politician score; the "Government" nav item leads to real content; every "take action" button produces a genuine, real-world effect; `/feed`'s client shape discloses automated authorship.

---

## Batch 9 — Schema foundations

**Status: Not started.** Depends on owner approval; unblocks Batches 10, 11, 13.

**Goal:** Resolve the three schema gaps this Council review found load-bearing for the rest of the program: the Issue/Bill/Decision merge (this is the same data-model work `PAGE_REFACTOR_ROADMAP.md`'s Batch 3 already scoped as its highest-risk item — this batch supplies the Council's additional evidence for why it must happen before, not alongside, page-level work), a real `evidence`/`citations` table, and a real `issue_timeline_events` table.

**Exact tables/types affected:** `issues` (extend with `level`/`decision_type` if the merge strategy needs it), `src/types/government.ts`'s `Decision` type (retire), `mock-government-data.ts` (retire), new `evidence`/`citations` table, new `issue_timeline_events` table (written to by the existing `bill-stage-tracker` agent, which is already positioned to write real history instead of inferring transitions from a hash).

**Data implications:** This is the one batch in the whole program involving a real data migration — per the Software Architect's finding, own-table vs. presentation-layer merge strategy for Issue/Decision is an explicit owner decision, not resolvable unilaterally. The Historian's review meaningfully de-risks this: since the mock `Decision` side has no real history to preserve, this is a content-authoring migration, not a historical-integrity one.

**Tests required:** A test that every existing mock-Decision-shaped concept resolves to real content post-merge (no silent content loss, even though the source was fictional); a schema test confirming `evidence`/`citations` and `issue_timeline_events` exist and are FK-linked correctly.

**Risk level:** Medium-high — the only batch with a real schema change, but lower risk than it looks per the Historian's finding above.

**Owner decisions required:** Issue/Decision merge strategy (own-table vs. presentation-layer); whether "Decision" survives as a visible content-type filter on the merged Issues list.

**Acceptance criteria:** One `issues`-backed object, one ID namespace; a real, populated evidence table for at least the highest-traffic issue/decision records; `bill-stage-tracker` writes durable timeline rows, not just feed posts.

---

## Batch 10 — Today + Political Pulse V1

**Status: Not started.** Depends on Batch 8 (`source_agent_id` restoration) as a hard prerequisite; benefits from, but doesn't strictly require, Batch 9.

**Goal:** Build the redesigned Today page (per `CORE_PAGE_REDESIGN.md`) and Political Pulse as a secondary page, scoped to the evidence-supportable content types only (`CONTENT_HIERARCHY.md` §3: Parliament, Bills status/source, Forecast openings/resolutions).

**Exact routes/components affected:** `src/app/page.tsx` (unify the duplicate destination cards/sections), new Political Pulse route (redesign of `src/app/feed/page.tsx`), a new chronological (not engagement-weighted) query path alongside the existing `src/lib/feed/ranker.ts`.

**Data implications:** New query path over existing `feed_posts` — no new table. Confirm `feed_posts`'s type enum can carry the actor-type tag requirement (`CONTENT_HIERARCHY.md` §3); extend if not.

**Tests required:** A test that Today's destination representation appears exactly once per destination (regression guard against the current duplication); a test that Political Pulse never renders one of the six excluded content types; a test that every entry carries a visible actor-type tag.

**Risk level:** Low-medium — presentation and a new read-only query, no write-path changes.

**Owner decisions required:** Confirm Political Pulse ships as secondary/contextual, not a sixth primary-nav item (Product Strategist, already recommended); confirm the six excluded content types stay excluded until each has real infrastructure, rather than shipping with placeholder/demo entries.

**Acceptance criteria:** Today shows each destination once; a real "what changed" strip is present; Political Pulse is chronological, sourced, actor-tagged, and contains only evidence-supportable content.

---

## Batch 11 — Issues, Government, Government Decision

**Status: Not started.** Depends on Batch 9. This batch is the layout/content execution detail for `PAGE_REFACTOR_ROADMAP.md`'s existing Batch 3 (Issues/Decisions consolidation) and Batch 4's Government-page portion — not new scope layered on top of them.

**Goal:** Ship the redesigned Issues list/detail, Government (with the explicit executive/legislature split), and Government Decision pages per `CORE_PAGE_REDESIGN.md`, built on Batch 9's merged schema.

**Exact routes/components affected:** `IssuesPageClient.tsx`, `issue/[id]/page.tsx` → `/issues/[slug]`, `parliament/page.tsx` (remove duplicate bill list, add explicit executive/legislature sections), `MPActionStrip.tsx` (add the missing link to `/mp/[id]`), retire `/decisions` and `/campaigns`' fake mechanic in favour of the real `CampaignModal`/`bill_pressures` path.

**Data implications:** Consumes Batch 9's merged schema; no additional migration.

**Tests required:** A test that the merged detail page renders exactly one prediction affordance; a redirect test for `/decisions/*` → `/issues/*` equivalents; a test that Parliament's bill section is link-only, not a second filterable list.

**Risk level:** Medium — mechanical once Batch 9 lands, but wide blast radius (many pages link into Issues).

**Owner decisions required:** None beyond Batch 9's, already covered.

**Acceptance criteria:** One canonical bill/issue list and ID namespace; Government explicitly distinguishes executive from legislative content; every "take action" button on these pages uses the one real `bill_pressures` mechanism.

---

## Batch 12 — Forecasts, Forecast detail, wallet/leaderboard consolidation

**Status: Not started.** Structurally independent of Batch 9. **Gated on Batch 14's engagement-mechanic legal review (D1) before final copy/mechanic sign-off** — visual and structural work (removing wallet/leaderboard/election-pulse/propose from the board, building `/forecasts/[id]`) may proceed in parallel with that review per the Legal Advisor's own framing, since none of that work touches the mechanic itself. This batch is the layout execution detail for `PAGE_REFACTOR_ROADMAP.md`'s existing Batch 5.

**Goal:** Ship the slimmed Forecasts board, the new `/forecasts/[id]` detail page, and retire `useWallet.ts` in favour of the single real wallet.

**Exact routes/components affected:** `PredictionsPageClient.tsx` (split into board + relocated Account components), new `/forecasts/[id]`, `PortfolioPanel.tsx`/`WeeklyReportCard.tsx`/`DailyBonusBanner.tsx` (re-point to `usePredictionWallet`), `LiveElectionPulse.tsx` (gate on `useLiveElection().active`).

**Data implications:** Wallet consolidation touches AGENTS.md's verified financial-equivalent infrastructure — **requires real Postgres/Supabase re-verification before shipping, not static review**, per the constitution's mandatory rule. This is independent of, and does not wait for, the legal-mechanic review (D1) — one is a correctness/security gate, the other is a regulatory-risk gate.

**Tests required:** A single-source-of-truth test that only one wallet balance concept exists per user; a route test for `/forecasts/[id]` rendering question/probability/evidence/resolution-criteria/stake action; a regression test that the leaderboard's data source is no longer duplicated.

**Risk level:** High for the wallet-consolidation piece specifically (touches verified infrastructure); Low-medium for the rest (presentation-only relocation).

**Owner decisions required:** How to reconcile `useWallet`/`usePredictionWallet` (migrate, unify, or explicitly rename `useWallet`'s content as a distinct non-forecasting currency if it survives at all); commission the D1 legal review before treating any engagement mechanic (daily bonus, streak freeze) as resolved.

**Acceptance criteria:** Forecasts board contains only board content; one real wallet; `/forecasts/[id]` exists and links back to its originating issue; no engagement mechanic is presented as "fixed" without the D1 legal review having occurred.

---

## Batch 13 — People, MP profile

**Status: Not started.** Depends on Batch 9 only loosely (real vote-history wiring benefits from it, isn't blocked by it). This batch is the layout execution detail for `PAGE_REFACTOR_ROADMAP.md`'s existing Batch 4.

**Goal:** Ship the redesigned People directory (chamber map removed in favour of a static composition strip, electorate tool relocated here) and MP profile (real vote history wired in, Simulate demoted).

**Exact routes/components affected:** `src/app/leaders/page.tsx` → `/people`, `mp/[id]/page.tsx` → `/people/[id]` (canonical-ID migration — see below), `MPActionStrip.tsx` (move or duplicate its electorate tool onto People, add the missing profile link).

**Data implications:** The MP canonical-identifier migration the Historian's review flags: `/people/[id]` must be keyed off `members.id`/`tvfy_id`, not the current mock `MPIndex` scheme — this is an identifier migration, not a cosmetic route rename, and needs an explicit id-mapping table before the route ships. Wiring real `member_votes`/`divisions` into the profile is real, valuable work already scoped by `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md`'s adjacent requirements.

**Tests required:** An id-resolution test proving every id in the current mock scheme resolves to the correct `members.id` post-migration; a test that `MPActionStrip`'s result links to the correct profile; a test that no fabricated score (`generateScores()`, `POLITICIAN_SCORECARDS`, `PARTY_VOTE_MAP`) is reachable from any surface this batch touches (should already be true after Batch 8, re-verified here since this batch is the natural place a regression would resurface).

**Risk level:** Medium — route rename is mechanical; the ID-scheme reconciliation and real-vote-data wiring are the substantive risk.

**Owner decisions required:** Approve the MP canonical-ID mapping plan before `/people/[id]` ships; confirm whether community-nominated leaders remain visible on this page or are held back pending the Community feature's broader legal review (Batch 14) — the two are related but not identical: keeping the *existing, already-shipped* community-leader section visible (correctly labelled) is not the same decision as *building new* Community features.

**Acceptance criteria:** One id per real MP, used consistently everywhere; `/people/[id]` shows real, dated, sourced vote history; the electorate tool and the MP profile are linked in both directions.

---

## Batch 14 — Legal & policy review track

**Status: Not started.** Runs in parallel with the batches above, not sequentially after them. Not a page-implementation batch — a professional-review batch.

**Goal:** Commission a real, qualified Australian lawyer to resolve the items this Council review could only risk-spot, per the Legal Advisor's mandatory escalation rule that none of these may be resolved by this program's own output.

**Items requiring review:**
1. The forecast engagement-mechanic question (D1) — whether the daily-bonus/streak-freeze/probability-staking combination, independent of visual styling, requires treatment beyond a re-skin.
2. The Community real-person nomination/scoring feature (D2/C5) — before any reactivation or new build.
3. Privacy Policy and Terms of Service — confirmed absent from the entire repository despite real auth/wallet/donation data already being collected.
4. Political Pulse's "source corrections" mechanism — defamation-adjacent exposure of a corrections workflow, before that content type is built (already excluded from V1 per Batch 10/`CONTENT_HIERARCHY.md`, so this is preparatory, not blocking Batch 10).
5. Moderation/Online Safety Act exposure — before any new user-generated-content surface ships (relevant to Batch 15, not the five core pages).
6. Electoral-law exposure for live election content, if/when Election becomes a Political Pulse content type in a future batch.

**Data implications:** None directly — this is a review, not an implementation step.

**Tests required:** Not applicable.

**Risk level:** Not applicable — this batch exists to resolve risk, not create it.

**Owner decisions required:** Commission the review; this is the one batch that is entirely an owner action, not an engineering one.

**Acceptance criteria:** A real lawyer's written opinion exists for each of the six items above before the gated work in Batches 12 and 15 is called complete.

---

## Batch 15 — Community

**Status: Not scheduled.** Explicitly deferred past V1 launch per `STICKEE_V1_PRODUCT_BLUEPRINT.md` §8. Listed here only so its prerequisites are visible, not to imply it's next.

**Prerequisites, all of which must be satisfied before this batch may be scheduled:**
- Batch 14 item 2 (Legal review of real-person nomination/scoring) resolved.
- A built admin moderation queue (System 12 currently has none — direct database access is the only path to act on a report today).
- A real, populated `evidence`/`citations` table (Batch 9) — a "submit evidence" feature has nothing real to attach to otherwise.
- An explicit owner decision that Community is in scope at all for the near-term roadmap, per the Product Strategist's priority order (new features rank last, behind still-open Tier 1–3 debt).

**If and when scheduled:** build per `CORE_PAGE_REDESIGN.md`'s Community specification (a visible-status submit → review → accepted/declined lifecycle attached to existing objects) — not before, and not as an open comment/reaction feed under any circumstance.

---

## What this plan does not decide

Restated from the Executive Summary so it isn't lost in batch detail: the Issue/Decision merge strategy, whether Political Pulse's "Decision" survives as a filter, the wallet reconciliation approach, the MP canonical-ID mapping mechanism, and whether Community proceeds at all past its prerequisites — all remain owner decisions, not resolved by sequencing them into batches.
