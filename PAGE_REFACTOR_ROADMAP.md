# Stickee — Page Refactor Roadmap

Planning document. Batch 1 has been implemented — see `PAGE_REFACTOR_BATCH_1_REPORT.md` for the full report. Batches 2–7 below remain planning only: no routes, components, navigation, or database structures have been changed for them. Each batch is scoped so a future session can pick it up independently, in order — later batches assume earlier ones landed, per the dependencies noted in `CONSOLIDATION_AND_REDIRECT_PLAN.md`.

---

## Batch 1 — Remove misleading and empty experiences

> **Status: Implemented.** See `PAGE_REFACTOR_BATCH_1_REPORT.md` for what changed, files touched, tests run, and remaining known gaps. No route structure or navigation changed, per scope. Production was not touched.

**Goal:** Fix the highest-trust-risk bugs found in this audit — places where the app currently shows fabricated/demo content as if real, or where a control does nothing — without touching route structure or navigation. This is the safest, most self-contained batch and should land first regardless of which navigation option is chosen later.

**Exact routes affected:** `/`, `/profile`, `/notifications`, `/decisions`, `/issue/[id]`.

**Components affected:** `src/app/page.tsx` (pillar-grid id mismatch), `src/app/profile/page.tsx` (hardcoded `DEMO_USER.isLoggedIn`), `src/app/notifications/page.tsx` (`DEMO_NOTIFICATIONS` masking the real empty state), `src/components/DecisionCard.tsx` (non-functional CTA button, dead `showEmailMP`/`market` prop paths), `src/components/PredictionMarketGrid.tsx` (non-functional Buy Yes/Buy No buttons on `/issue/[id]`).

**Data implications:** None — these are all client-side/presentation fixes. No migration, no schema change. `/profile` gaining a real auth check is the closest thing to a data-flow change (redirect signed-out users instead of rendering fake data), and only reads the session that already exists.

**Tests required:** Unit/regression tests asserting the specific bugs don't reappear (matching this repo's existing pattern, e.g. `src/lib/__tests__/mp-score-copy.test.ts`): a test that `/` no longer links pillars to a mismatched id namespace; a test that `/profile` redirects or shows a real signed-out state rather than `DEMO_USER`; a test that `/notifications`' empty state is reachable when there's genuinely nothing to show; a test that `DecisionCard`'s CTA either has a real handler or is removed/disabled rather than decorative.

**Risk level:** **Low.** No route moves, no navigation changes, no data-model changes — purely fixing broken/fake behavior in place.

**Owner decisions required:** Should `/profile` require sign-in outright (redirect to `/auth/sign-in`), or show a real "sign in to see your profile" empty state like `/predictions`' wallet panel already does? Should the non-functional market Buy buttons on `/issue/[id]` be wired to the real stake flow now, or simply hidden/disabled until Batch 5 gives them a proper home?

**Acceptance criteria:** No page in the app renders fabricated personal data for a signed-out user; every visible button either does something real or is visually/structurally marked as not-yet-available (per the constitution's "no verified data available" preference); the home page's issue links resolve correctly against real content.

---

## Batch 2 — Simplify navigation and labels

> **Status: Implemented.** See `PAGE_REFACTOR_BATCH_2_REPORT.md`. One shared nav config (`src/lib/navigation.ts`) now backs Navbar, BottomNav and CommandPalette; approved 5-item primary nav (Today/Issues/Government/Forecasts/People) is live pointing at legacy routes, per plan. No routes renamed, no redirects added. Production was not touched.

**Goal:** Make the three inconsistent navigation registries (desktop Navbar, mobile BottomNav, Command Palette) agree with each other, and fix the one confirmed mislabeled entry (Command Palette's "Decisions" pointing at `/government`), without yet changing which routes exist.

**Exact routes affected:** None directly — this batch touches navigation *components*, not route destinations (Batch 7 handles actual redirects once destinations move).

**Components affected:** `src/components/Navbar.tsx`, `src/components/BottomNav.tsx`, `src/components/CommandPalette.tsx` (specifically its `NAV_ITEMS` array), ideally consolidated into one shared nav-config source all three read from, to prevent this drift from recurring.

**Data implications:** None.

**Tests required:** A single source-of-truth test asserting Navbar, BottomNav, and Command Palette's static nav entries reference a shared config (or, short of a shared config, a snapshot test that fails if their label/href pairs diverge for the same destination).

**Risk level:** **Low.** Presentation-only; every destination in this batch still exists at its current URL.

**Owner decisions required:** Which navigation option (A/B/C from `INFORMATION_ARCHITECTURE_AUDIT.md`) to adopt — this determines the final label set, but the *mechanism* (one shared config, consistent labels) can be built before that decision is finalized by using today's routes with corrected/consistent labels as an interim state.

**Acceptance criteria:** The same destination has the same label everywhere it appears in navigation; no nav entry points at a route different from what its label describes; Simulator's mobile label ("Test") matches its desktop label ("Simulator") or whatever the chosen nav option renames it to.

---

## Batch 2.5 — People-page truthfulness (inserted)

> **Status: Implemented.** See `PEOPLE_TRUTHFULNESS_BATCH_REPORT.md`. Inserted ahead of Batch 3 because `/leaders` and `/mp/[id]` had live, public-facing trust problems (fabricated politician scores, fake hash-seeded "community approval" on real named MPs, a fictional "Rising Leaders" section presented as real Australians) that were independent of the Issues/Decisions/Parliament data-model merge and safe to fix without it. Not part of the original batch numbering — kept as "2.5" rather than renumbering 3–7 to avoid invalidating their existing cross-references.

**Goal:** Ensure `/leaders`, `/mp/[id]`, and `/leaders/[id]` never mix verified parliamentary information with fabricated scores, fake community approval, fictional people, or unsupported analysis, without redesigning the whole People section.

**Exact routes affected:** `/leaders`, `/mp/[id]`, `/leaders/[id]`. No routes renamed.

**Components affected:** `src/app/leaders/page.tsx` (removed `POLITICIAN_SCORECARDS` scorecards, the entire fake `useApproval` community-rating system, and the "Rising Leaders" section; added canonical `/mp/[id]` links to every directory row), `src/app/leaders/[id]/page.tsx` (fictional nominee profiles neutralized to a truthful notice), `src/app/mp/[id]/page.tsx` (removed the fabricated per-party "Voting History" list).

**Data implications:** None — no migrations, no new tables, no new scoring/approval system built. Purely removed fabricated display logic and fixed a missing real link.

**Tests required/added:** `src/lib/__tests__/people-truthfulness.test.ts` (23 tests) — unsupported score/grade absence, fake approval absence, Rising Leaders absence, `/mp/[id]` fabricated vote-list absence, canonical MP-route linking, genuine data retained.

**Risk level:** **Low.** Presentation/removal only; the one addition (MP row → `/mp/[id]` links) is a pure improvement to an existing dead-end.

**Owner decisions required:** Whether "Rising Leaders" becomes a real, clearly-separated future product (Community voices / Candidate directory / Emerging leaders) — not resolved, see the report's §5/§9.

**Acceptance criteria:** No fabricated score, grade, or approval percentage appears anywhere on the three pages; no fictional person is presented as real; every real MP is discoverable via a working link to `/mp/[id]`; signed-out visitors see no personalised claims.

---

## Batch 3 — Consolidate Issues and Bills

> **Ground truth (2026-08-05):** `/decisions` and `/government` have not yet been merged or retired — that data-model work is still this batch's, unstarted. But `STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md`'s truthfulness fix landed ahead of this batch, as approved: primary navigation's "Government" item and `/government`'s redirect now point at `/parliament` (not `/decisions`), and `/decisions` now shows a truthful transitional state instead of the fictional decision feed. `/decisions` still exists at its current URL with no redirect, per that report — this batch's eventual "retired, becomes a redirect" plan below is unaffected and still the intended end state.

**Goal:** Merge `/decisions` and `/government` into `/issues`, give every issue/decision a real detail page for the first time, and remove the duplicated bill-list UI from `/parliament` in favor of linking back to the unified list.

**Exact routes affected:** `/issues`, `/issue/[id]` → `/issues/[slug]`, `/decisions` (retired, becomes a redirect), `/government` (retired, becomes a redirect or a real Government landing per the nav decision), `/parliament` (bill-list section removed).

**Components affected:** `src/components/IssuesPageClient.tsx`, `src/app/issue/[id]/page.tsx` and its subtree (`PredictionMarketGrid`, `MPVoteGrid` — converted from embeds to links per Batch 5/4), `src/components/DecisionCard.tsx` (retired or repurposed as an Issue-type-specific card variant), `src/lib/issues-data.ts`/`issues-db.ts` (data-layer merge), `src/lib/mock-government-data.ts` (decisions data folded into the issues model), `src/components/BillSmartRow.tsx`/`PriorityBillFocus.tsx` (Parliament's bill list, now link-only).

**Data implications:** **This is the batch with real data-model work.** Issues and Decisions currently have disjoint id namespaces and one is Supabase-backed while the other is 100% hardcoded — merging them requires an explicit decision (own table vs. presentation-layer merge of two sources) flagged as an owner/engineering decision in the Consolidation plan, not something to resolve unilaterally here.

**Tests required:** Data-mapping tests verifying every existing Decision id still resolves to *some* real content post-merge (no silent content loss); a redirect test for `/decisions/*` → `/issues/*` equivalents; a component test that the merged detail page renders exactly one prediction affordance (not the current issue page's two: poll + market widget) and no non-functional buttons.

**Risk level:** **Medium-high.** The only batch touching a real data model change; also the batch most other pages (home, Parliament, admin markets console) have incoming links into, so link updates have a wide blast radius (see Migration risks in the Consolidation plan).

**Owner decisions required:** The Issues/Decisions data-model merge strategy (see above); whether "Decision" survives as a visible content-type filter on the unified list or is fully absorbed without a visible seam; what happens to `DecisionCard`'s currently-decorative sentiment bar (real, remove, or relabel as illustrative).

**Acceptance criteria:** One list, one detail-page pattern, one id namespace; every card's visible action does something real; `/parliament` no longer re-lists bills, only links to them; admin's market-resolution flow (which reads `issue_markets.issue_id`) is re-verified against a real database post-merge, per the constitution's mandatory real-DB-testing rule for anything touching settlement.

---

## Batch 4 — Consolidate Parliament

**Goal:** Establish Parliament as the single evidence layer (chamber, real votes, real campaign actions) and connect People/MP profiles to it properly — including finally linking `/leaders`' MP table to individual MP pages and reconciling the three incompatible MP id schemes found in this audit.

**Exact routes affected:** `/parliament` → `/government/parliament`, `/leaders` → `/people`, `/leaders/[id]` → `/people/community/[id]`, `/mp/[id]` → `/people/[id]`.

**Components affected:** `src/components/ParliamentExperienceClient.tsx`, `HouseChamber.tsx`, `SenateView.tsx`, `MPActionStrip.tsx`, `ParliamentMap.tsx` (already the one correct MP-link path — becomes the template for others), `src/app/leaders/page.tsx` (MP table gains real links, "featured politicians" mock block retired), `src/lib/mock-data.ts` (`MPIndex`) vs `src/lib/mock-civic-data.ts` (`POLITICIAN_SCORECARDS`) vs live Supabase `members` — id reconciliation.

**Data implications:** Wiring `/mp/[id]`'s (soon `/people/[id]`'s) "voting analysis" to the real `member_votes` data that already exists (synced via TheyVoteForYou) instead of the current fixed-per-party mock — this is the fix `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` already specifies; this batch is the natural place to finally implement it, gated behind `NEXT_PUBLIC_MP_SCORE_ENABLED` as already scaffolded.

**Tests required:** An id-resolution test proving every id in `MPIndex`, `POLITICIAN_SCORECARDS`, and the live Supabase roster resolves to the same canonical MP record post-reconciliation; a navigation test that `/leaders`' (now `/people`'s) MP rows link to a real detail page (regression test for the currently-broken no-op click).

**Risk level:** **Medium.** Route renames are mechanical; the id-scheme reconciliation and real-vote-data wiring are the substantive risk, and the latter is exactly the kind of change the constitution flags as needing real-database verification, not just a typecheck.

**Owner decisions required:** Whether to finally flip `NEXT_PUBLIC_MP_SCORE_ENABLED` on as part of this batch (requires the real per-MP vote calculation to be correct and tested first) or leave the placeholder in place and only fix navigation/id issues this round; how prominently community-nominated leaders should sit relative to the MP roster on the merged People page.

**Acceptance criteria:** One id per real MP, used consistently everywhere; every MP mention in the app links to the same real detail page; community leaders remain clearly distinguished from elected MPs on the same People page, not blended.

---

## Batch 5 — Consolidate Markets and Forecasts

**Goal:** Slim `/predictions` (renamed `/forecasts`) down to its real core (board, featured market, staking), move wallet/portfolio to Account, resolve the leaderboard duplication, give election-pulse a contextual home, and build the canonical per-market detail page that doesn't exist today.

**Exact routes affected:** `/predictions` → `/forecasts`, new `/forecasts/[id]`, `/leaderboard` (hidden per Consolidation plan), `/profile` → `/account` gains `/account/wallet`.

**Components affected:** `src/components/PredictionsPageClient.tsx` (split into a slimmed board component + an Account wallet component), `PortfolioPanel.tsx` (moves to Account), `ProposeMarketModal.tsx` (needs a real backend or removal — currently `localStorage`-only despite "pending review" copy), `LiveElectionPulse.tsx` (moves to a contextual/conditional render, e.g. home page banner only when `useLiveElection().active`), `src/hooks/useWallet.ts` vs `usePredictionWallet.ts` (reconciliation).

**Data implications:** The `useWallet`/`usePredictionWallet` reconciliation is the substantive risk here — two independent "points balance" systems for the same user need to become one, which is a real data-migration question (which numbers win, does `useWallet`'s `localStorage` balance get discarded, migrated, or kept as a separate "practice mode"). This directly touches the verified wallet infrastructure (`place_wallet_stake`, `is_market_open`) that prior audits confirmed is production-safe — **any change here must be re-verified against a real database**, not just typechecked, per the constitution's mandatory testing rule for wallet/settlement changes.

**Tests required:** A single-source-of-truth test that only one wallet balance concept exists per user post-reconciliation; a new-route test for `/forecasts/[id]` rendering question/probability/evidence-link/stake action; a regression test that the leaderboard's data source is no longer duplicated in two components.

**Risk level:** **High.** This is the batch most likely to touch the verified, financially-equivalent wallet/settlement system that prior audits (`docs/audits/DATABASE_VERIFICATION_REPORT.md`) already proved safe — any change here needs the same rigor (real Postgres testing, not static review) that batch received, per AGENTS.md's constitution.

**Owner decisions required:** How to reconcile the two wallet systems (migrate, unify, or deliberately keep `useWallet` as an unrelated "practice"/badge-streak currency distinct from real staking — in which case it needs a different name, not "points," to stop implying it's the same balance); whether `ProposeMarketModal` gets a real backend this batch or is removed until it does; where election-pulse's contextual home lives.

**Acceptance criteria:** `/forecasts` contains only the market board and featured market; every market is individually linkable; wallet/portfolio lives in Account with one, single-sourced balance; the leaderboard (if un-hidden) computes from real data, not a shared mock array; election content only appears when actually relevant.

---

## Batch 6 — Simplify Simulator and Campaigns

**Goal:** Remove Simulator's standalone top-level nav slot in favor of its already-working contextual entry points; replace `/campaigns`' fake, disconnected mechanic with the real bill-pressure `CampaignModal` system, promoted to a proper linked "Take action" destination.

**Exact routes affected:** `/simulator` (kept, removed from primary nav), `/campaigns` → `/action`.

**Components affected:** `Navbar.tsx`/`BottomNav.tsx` (Simulator entry removed from primary slots — coordinated with Batch 2's shared nav config), `src/components/CampaignModal.tsx` (promoted from a `/parliament`-only embed to a reusable, linkable pattern), `src/app/campaigns/page.tsx` (retired or rebuilt on top of the real mechanic), `PriorityBillFocus.tsx`/`BillSmartRow.tsx`/`BillCampaignCard.tsx`/`SwingVotePanel.tsx` (already call the real API — become the template other pages link into rather than being Parliament-exclusive).

**Data implications:** None beyond what already exists — `/api/bills/[billId]/pressure` is already real and working; this batch is a UI/routing consolidation around an already-correct backend, not new data work.

**Tests required:** A test that the real campaign-action pathway (`/api/bills/[billId]/pressure`) is reachable from more than one page without duplicating its implementation; a regression test that no page still contains the old fake `/campaigns` join/propose/share-for-points mechanic once retired.

**Risk level:** **Low-medium.** The real mechanic being reused is proven; the risk is purely in making sure the fake mechanic's removal doesn't leave any page linking to a route that no longer does what it used to.

**Owner decisions required:** Should `/action` be bill-specific only (matching what `CampaignModal` already does), or does the product want independently-trackable campaigns beyond a single bill (which would be new scope, not consolidation) — this determines whether Batch 6 is purely a simplification or also a small feature addition.

**Acceptance criteria:** Exactly one "join a campaign" mechanic exists and it's real; Simulator remains fully functional and discoverable from every context it's currently linked from, just not from primary nav.

---

## Batch 7 — Redirects and cleanup

**Goal:** Once Batches 1–6 have landed and the new route tree is stable, implement the redirect table from `CONSOLIDATION_AND_REDIRECT_PLAN.md`, remove now-dead code (old components, the retired `/decisions`/`/leaders`/`/predictions`/`/campaigns` route files, the stray `feed/page.tsx.bak`), and do a final link-integrity pass across the whole app (hardcoded `href`s, `CommandPalette` index, `simulator-bridge.ts` entity links, admin console references).

**Exact routes affected:** All old routes retired in prior batches gain redirects; no new destination routes are introduced in this batch.

**Components affected:** `next.config.ts` (or route-level `redirect()` calls, per whichever pattern this Next.js version's docs recommend — check `node_modules/next/dist/docs` before implementing, per `AGENTS.md`), plus a repo-wide search-and-replace pass for every hardcoded old-route `href` found during this audit.

**Data implications:** None — purely routing/link cleanup.

**Tests required:** A redirect-integrity test suite hitting every entry in the redirect table and asserting the correct destination and status code; a full link-crawl test (or manual pass) across every remaining page confirming no internal link points at a retired route.

**Risk level:** **Low**, contingent on all prior batches being complete and stable — attempting this batch early (before destinations exist) would be the highest-risk mistake possible in this whole roadmap.

**Owner decisions required:** Redirect status code convention (308 permanent recommended, matching the "these are permanent renames" intent) and how long legacy redirects should be kept before removal (low stakes currently, since the app has no public traffic yet per the GitHub-push-readiness audit — but worth deciding once it does).

**Acceptance criteria:** Every route in the "old" column of `PROPOSED_ROUTE_TREE.md`'s mapping table either still works or redirects correctly; no dead links remain anywhere in the app; `src/app/feed/page.tsx.bak` and any other stray dead files identified across this audit series are finally removed.

---

## Sequencing summary

```
Batch 1 (trust fixes) ──┐
Batch 2 (nav consistency) ┴─→ Batch 3 (Issues/Decisions) ─┬─→ Batch 4 (Parliament/People) ─┐
                                                            ├─→ Batch 5 (Markets/Forecasts)  ├─→ Batch 7 (redirects/cleanup)
                                                            └─→ Batch 6 (Simulator/Campaigns)┘
```

Batches 1 and 2 are independent of everything else and can land immediately. Batch 3 is the load-bearing dependency for 4, 5, and 6 (all three link into the unified Issues content). Batch 7 must be last.
