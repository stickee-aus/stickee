# Issues (`/issues`, `/issue/[id]`) — Page Audit

Governed by [`AGENTS.md`](../../AGENTS.md). List-page findings verified against `IssuesPageClient.tsx`; detail-page findings verified against `issue/[id]/page.tsx` and `MPVoteGrid.tsx`/`PredictionMarketGrid.tsx` — none of these files have been touched since `PAGE_AND_ROUTE_INVENTORY.md`, `CORE_PAGE_REDESIGN.md`, and `SIMPLIFICATION_RECOMMENDATIONS.md` verified them line-by-line (confirmed absent from current `git status`), so this audit cites those line numbers directly rather than re-deriving them. Detail-page-specific findings are expanded further in `DETAIL_PAGE_AUDIT.md`#issue-detail.

## Is this an issue catalogue, a bill tracker, a vote board, or a prediction surface?

**All four, on one page, today — this is the core defect.** `/issue/[id]` stacks: an editorial context block (catalogue), status/vote-total tiles (tracker), a 150-row MP vote grid with its own bolted-on "predict how each MP voted" mini-game (vote board), an inline Yes/No poll, and a full prediction-market order-book widget (prediction surface) — ten distinct content/interaction blocks with no progressive disclosure (`issue/[id]/page.tsx`, full page; `USER_JOURNEY_MAPS.md` Journey 2). The correct target, per `CORE_PAGE_REDESIGN.md`, is: Issues is the catalogue/tracker (editorial + one real prediction affordance + a real action); the vote board belongs to Government/People; the prediction surface belongs to Forecasts. Issues *links* to both, it does not *contain* both.

## Truthfulness classification of key elements

| Element | Classification | Basis |
|---|---|---|
| Issue title/status/summary (Supabase-backed) | **Verified fact**, when Supabase is configured and the record is populated | `issues` table, real |
| Issue title/status/summary (mock fallback) | **Demo content, currently unlabeled** | Silent fallback to a 5-item mock array with no visible "example content" marker (`docs/audits/DATA_AND_CONTENT_AUDIT.md` §1) |
| "Who supports" / "who opposes" narrative text | **Unsupported** | Specific, real-party-attributed claims with no citation despite `issues.source_url` existing and going unused for this exact field (`docs/audits/DATA_AND_CONTENT_AUDIT.md` §3, P0) |
| MP Yes % / vote-total tiles (list row) | **Verified fact**, when sourced from real `mp_yes_count`/`mp_no_count`/`mp_abstain_count` columns; **inferred fallback** when the mock path is active | `issues-db.ts`'s dual path |
| Market probability shown on the list row | **Forecast** | Real `issue_markets`, but this is Forecasts' job rendered a second time on Issues (`IssuesPageClient.tsx:69-83`) |
| Inline Yes/No pass-prediction poll (detail page) | **Community opinion** (real, Supabase `predictions`) | Genuinely real and correctly labeled as a pick, not a fact |
| Prediction-market order-book widget (detail page) | **Forecast**, but duplicative | Same underlying market as Forecasts', reimplemented here (formerly had non-functional Buy buttons — fixed in Batch 1, but the whole embedded widget remains) |
| 150-row MP vote grid "MP Vote" badges | **Removed as of Batch 8** | Previously `PARTY_VOTE_MAP`-derived fabrication; now replaced with a truthful "being verified" notice (`STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md` §3, fix 4) — confirmed still in place |
| MP vote grid's "Predict" column | **Community opinion** (real) | Computed purely from other users' own submitted picks, no fabricated ground truth (confirmed in Batch 8 report) |

## OUTPUT PER PAGE — Issues (list)

**PAGE:** Issues
**ROUTE:** `/issues`
**CURRENT PURPOSE:** Filterable list of bills/issues with status, MP-vote %, market %, participant counts, sentiment, and an email-MP action, all visible before any click.
**PROPOSED PURPOSE:** The single canonical list of what government is considering or has decided — absorbing `/decisions`' content type.
**SINGLE QUESTION:** Why is this happening?
**PRIMARY USER:** Someone who heard about a bill/issue and wants context, or is browsing what's currently active.
**FIRST 30 SECONDS:** Scan a filterable list, find something by status — cannot currently search by topic/keyword at all (confirmed absent).
**WHAT IS ESSENTIAL:** Status badge, title, one-line summary, one real support/status figure.
**WHAT IS OPTIONAL:** Everything else currently rendered before a click.
**WHAT IS DUPLICATED ELSEWHERE:** Market probability (duplicates Forecasts' whole job); MP Yes% shown here and again, in full, on Government/People.
**WHAT BELONGS ON A DETAIL PAGE INSTEAD:** Nothing currently on the list belongs *more* on the detail page — the list is actually over-detailed relative to its own row, not under.
**WHAT SHOULD BECOME CONTEXTUAL RATHER THAN ALWAYS VISIBLE:** MP Yes%, market probability + trend arrow, participant count, sentiment bar, Yes/No/Abstain row — 7 data points render before any click today (`IssuesPageClient.tsx:59-109`); target is 2 (status, one figure).
**WHAT SHOULD BE REMOVED:** The active/passed counts currently stated three times on one header (hero line, duplicate stat tiles, filter-tab counts — `IssuesPageClient.tsx:196-220`).
**WHAT SHOULD NEVER APPEAR:** A second, independently-computed count for the same filter; a market-probability figure with no link to the real Forecasts record it belongs to.
**FAKE/UNSUPPORTED:** Silent mock-fallback content with no visible label (see classification table); who-supports/opposes narrative with no citation.
**WHAT IS GENUINELY REAL AND WORTH PRESERVING:** The status filter tabs (All/Active/Passed/Rejected — correct pattern, see `TAB_AND_MODE_AUDIT.md`); Supabase-first data path; expand-in-place row interaction.
**DEAD/DECORATIVE CONTROLS:** None found on the list itself (Batch 1 already removed `DecisionCard`'s dead CTA on the sibling `/decisions` page — Issues' own list controls were already functional).
**PRIMARY ACTION:** Open an issue.
**SECONDARY ACTIONS:** Filter by status; (missing) search by topic/keyword.
**EMPTY STATE:** "No bills match this filter" — already correct, truthful.
**MOBILE PRIORITIES:** The row's expand chevron must stay visible outside any `hidden sm:flex` wrapper — currently it disappears on mobile while the row remains tap-expandable, an invisible-but-present control (`CORE_PAGE_REDESIGN.md`).
**CANONICAL DATA SOURCE:** `issues`/`issue_markets` tables via `issues-db.ts`, real path — never the mock fallback for a public launch (label it "example content" until removed if it must ship in the interim).
**REQUIRED SHARED COMPONENTS:** `UnderlineFilter` (status tabs), `ArticleCard`/row-list pattern, `EmptyState`.
**RESPONSIBILITY MAP NEEDS:** Each row's expanded/detail state needs a compact "who decides this" strip — see `RESPONSIBILITY_MAP_SPEC.md`#issue-bill.
**CIVIC ACTION NEEDS:** The list itself needs none; the detail page needs the full model — see below.
**LEGAL / EDITORIAL / POLICY RISKS:** Uncited party-position claims (`whoSupports`/`whoOpposes`) are a live P0 per the Data & Evidence Steward and Editorial Advisor (`docs/audits/DATA_AND_CONTENT_AUDIT.md` §3; `STICKEE_V1_EXECUTIVE_SUMMARY.md` consensus-adjacent finding) — real, named political claims with no source trail.
**SMALLEST SAFE FIX:** Collapse the row to 2 data points; add topic/keyword search; either populate `source_url` for who-supports/opposes claims or label them "illustrative — not sourced" until they are.
**IDEAL V1 STRUCTURE:** Per `CORE_PAGE_REDESIGN.md`#Issues — hero count stated once, status tabs, topic search, flat expand-in-place row list.
**IMPLEMENTATION PRIORITY:** P0 — highest-traffic page in the app's core five, carries the highest-severity live truthfulness defect (uncited political claims) of any core page still unfixed.
**OWNER DECISIONS:** The Issue/Decision schema-merge strategy (own-table vs. presentation-layer) — see `IMPLEMENTATION_BATCHES.md` Batch 9; whether "Decision" survives as a visible content-type filter post-merge.

## OUTPUT PER PAGE — Issue detail

**PAGE:** Issue detail
**ROUTE:** `/issue/[id]` (target `/issues/[slug]`)
**CURRENT PURPOSE:** Simultaneously an editorial brief, a live poll, a trading terminal, and an MP scoreboard.
**PROPOSED PURPOSE:** One editorial article: context, evidence, one real prediction affordance, one real action.
**SINGLE QUESTION:** Why is this happening, and what's likely to happen next?
**PRIMARY USER:** Someone who clicked through from Issues, a search engine, or a shared link wanting the full story.
**FIRST 30 SECONDS:** Currently: scroll past a Simulate chip, a rehearsals strip, and 3 stat tiles before reaching any editorial text at all.
**WHAT IS ESSENTIAL:** Status/title/summary, "what's happening" context text, who supports/opposes (sourced), one prediction affordance, one real action.
**WHAT IS OPTIONAL:** Simulate-this (a chip, not a strip); recent-rehearsals content.
**WHAT IS DUPLICATED ELSEWHERE:** The full market order-book (duplicates Forecasts entirely); the full 150-row MP vote grid (duplicates Government/People entirely).
**WHAT BELONGS ON A DETAIL PAGE INSTEAD (i.e., correctly here):** The editorial context, the sourced who-supports/opposes text (once sourced), the real timeline (once built).
**WHAT SHOULD BECOME CONTEXTUAL:** Simulate-this — a single chip near the headline, not a strip above the fold.
**WHAT SHOULD BE REMOVED:** The second prediction mechanism (keep the poll or the market link, not both — `issue/[id]/page.tsx:124,135`); the embedded MP-vote grid's now-vestigial "predict the vote" mini-game shell now that its badges are removed.
**WHAT SHOULD NEVER APPEAR:** Two Yes/No prediction affordances on one page; an embedded, full-size version of another canonical page's entire widget.
**FAKE/UNSUPPORTED:** Who-supports/opposes narrative (see table); mock-fallback issue content when Supabase is empty, unlabeled.
**WHAT IS GENUINELY REAL:** The real Supabase `predictions` poll; the real MP-vote-row links to `/mp/[id]`; the underlying market data (once linked rather than embedded).
**DEAD/DECORATIVE CONTROLS:** Buy Yes/Buy No buttons — already fixed in Batch 1 (replaced with a real link to the staking flow); nothing else dead found.
**PRIMARY ACTION:** Take real action (contact MP / add bill-pressure) or follow the forecast link.
**SECONDARY ACTIONS:** Simulate this (chip); the real poll.
**EMPTY STATE:** Where Supabase has no record, this should say so, not fall back to mock content unlabeled.
**MOBILE PRIORITIES:** Single-column article read order; evidence/action above the (removed) embedded widgets.
**CANONICAL DATA SOURCE:** `issues`, `predictions`, `issue_markets` (linked, not embedded), `member_votes` (linked, not embedded).
**REQUIRED SHARED COMPONENTS:** Single-column article pattern (matching Forecast detail and Government Decision detail — "a reader who has learned one has learned all of them," `STICKEE_V1_PRODUCT_BLUEPRINT.md` §3).
**RESPONSIBILITY MAP NEEDS:** Full Responsibility Map block — see `RESPONSIBILITY_MAP_SPEC.md`#issue-bill.
**CIVIC ACTION NEEDS:** Full "How can I influence this?" model — see `CIVIC_ACTION_MODEL.md`; today's page has only an Email-MP modal, not the fuller action set.
**LEGAL / EDITORIAL / POLICY RISKS:** Same uncited-claims risk as the list page, concentrated here since this is where the full narrative text renders.
**SMALLEST SAFE FIX:** Convert the embedded market widget and MP-vote grid to linked summary chips ("62% likely — see the forecast →", "MPs voted 87–56 — see how →") — already scoped, zero schema change, per `CONSOLIDATION_AND_REDIRECT_PLAN.md`.
**IDEAL V1 STRUCTURE:** Per `CORE_PAGE_REDESIGN.md`#Issues (detail) and `SIMPLIFICATION_RECOMMENDATIONS.md` — 10 blocks → 6, two of which become one-line links.
**IMPLEMENTATION PRIORITY:** P0 — same page family as the list, same schema dependency (Batch 9).
**OWNER DECISIONS:** Whether the Yes/No poll or the market link is the "one" prediction affordance kept (recommend: poll for pass/fail sentiment, market link for probability — they answer different questions, but only one should be *embedded*, the market should always be a link).

## Council review (Level 3 gate — Issues carries the schema-merge decision; reuses `STICKEE_V1_EXECUTIVE_SUMMARY.md`'s full twelve-agent review rather than re-running it)

```
Software Architecture:  Approved with conditions — schema-merge strategy (own-table vs. presentation-layer) is the load-bearing decision (Owner Decision 2)
Public Policy:           Approved with conditions — who-supports/opposes claims need real citation or explicit "illustrative" labeling before this counts as institutionally accurate
Editorial:               Blocked (as currently unsourced) — see Data & Evidence Steward
Data & Evidence:         Blocked — uncited real-party political claims are a P0, independent of the redesign
UX:                      Approved with changes — 10-block detail page confirmed overloaded
Journey/Bottleneck:      Significant friction — Journey 2 (`USER_JOURNEY_MAPS.md`) rates this High cognitive load, Medium trust

Overall recommendation: Requires owner decision (schema merge) before structural rebuild; the citation fix for who-supports/opposes is independent and should not wait for it.
```
