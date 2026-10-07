# Detail Page Audit

Governed by [`AGENTS.md`](../../AGENTS.md). Covers the six detail-page object types named in the audit brief: Issue, Government Decision, Forecast, MP profile, Election, Civic Proposal. Three of these (Government Decision, Forecast, Civic Proposal) **do not exist as real, complete pages today** — this is itself the primary finding for each, not a gap in this audit.

---

## Issue detail {#issue-detail}

**Route:** `/issue/[id]`. Full OUTPUT PER PAGE template already applied in [`ISSUES_PAGE_AUDIT.md`](ISSUES_PAGE_AUDIT.md) (Issues and Issue detail are audited together there, since the redesign target collapses them into one article pattern, not two structurally different pages). Summary: real Supabase-backed core content, undermined by ten stacked content blocks including two competing prediction mechanisms and two embedded (should-be-linked) sub-systems. **What should never appear, restated because this is the single most overloaded page found in this entire audit:** a full order-book market widget; a full 150-row MP vote grid with an unrelated "guess the vote" mini-game; two separate prediction mechanisms on one page; a Simulator strip above the fold.

---

## Government Decision {#government-decision}

**Route:** No real route exists. `/decisions` today shows a truthful transitional state (post-Batch-8), not this target page — see [`SECONDARY_PAGES_AUDIT.md`](SECONDARY_PAGES_AUDIT.md)#decisions for that page's own audit. This section specifies the *target object page*, which must not be built against `mock-government-data.ts` even as an interim placeholder.

**Status:** Not yet a real, evidence-complete object. Per the Domain Model (`docs/architecture/DOMAIN_MODEL.md`): the mock `Decision` type has no source field at all, structurally; its ID scheme is incompatible with `issues.id`; `DecisionMaker.approvalRating`/`trustScore` (fabricated numbers on real named ministers) were removed from the type in Batch 8, but the type still has no real minister/department attribution to replace them with — Minister and Department are **not currently modeled as first-class objects anywhere in the schema.**

**Truthfulness classification:** Every element of a hypothetical Government Decision page built today would classify as either **hardcoded** (the mock `Decision` array) or **no verified data available** (the honest alternative, already shipped on `/decisions`). There is no path to "verified fact" for this object type without new schema work.

**OUTPUT PER PAGE:**
**PAGE:** Government Decision
**ROUTE:** None (target: nested under Issues, e.g. `/issues/[slug]` with a decision-type filter, per `CONSOLIDATION_AND_REDIRECT_PLAN.md`)
**CURRENT PURPOSE:** N/A — object does not exist in real form
**PROPOSED PURPOSE:** What was decided, by whom, and when
**SINGLE QUESTION:** What was decided, by whom, and when?
**PRIMARY USER:** Someone verifying a specific claim about an executive decision
**FIRST 30 SECONDS:** N/A until built
**WHAT IS ESSENTIAL:** Decision title, real decision-maker (minister/department), status (using a distinct announce/action/implement vocabulary — never the same "Passed/Rejected" label used for Bills), real source, real timeline
**WHAT IS OPTIONAL:** Linked forecast, if one exists
**WHAT IS DUPLICATED ELSEWHERE:** The concept overlaps entirely with Issues/Bills today — this is exactly why the schema merge (Batch 9) is the load-bearing decision
**WHAT BELONGS ON A DETAIL PAGE INSTEAD:** N/A — this is the detail page
**WHAT SHOULD BECOME CONTEXTUAL:** N/A
**WHAT SHOULD BE REMOVED:** `mock-government-data.ts` as a data source for this object, in full — including as an interim placeholder
**WHAT SHOULD NEVER APPEAR:** `DecisionMaker.approvalRating`/`trustScore` or any successor field carrying the same shape; fabricated `isTrending`/`isControversial`/`likes`/`dislikes` engagement fields; the same "Passed/Rejected" status label used interchangeably for a Bill and an executive act
**FAKE/UNSUPPORTED:** The entire current mock `Decision` object, if it were used as this page's source
**WHAT IS GENUINELY REAL AND WORTH PRESERVING:** `DecisionMaker`'s real identity fields (name, role, party, electorate) — kept in the type post-Batch-8, worth carrying forward into a real, merged schema
**DEAD/DECORATIVE CONTROLS:** N/A until built
**PRIMARY ACTION:** Understand what was decided
**SECONDARY ACTIONS:** Take real action (bill_pressures-equivalent, if applicable); see related forecast
**EMPTY STATE:** "Verified executive-decision records are being prepared" — already the shipped, correct interim pattern on `/decisions`
**MOBILE PRIORITIES:** Same single-column article pattern as Issue detail
**CANONICAL DATA SOURCE:** Should be `issues` (post-merge) with a `level`/`decision_type` distinction, per `docs/architecture/DOMAIN_MODEL.md`'s Issue/Bill/Decision entry
**REQUIRED SHARED COMPONENTS:** Identical article grammar to Issue detail and Forecast detail — a Government Decision is a type/status of Issue, not a structurally separate page
**RESPONSIBILITY MAP NEEDS:** Full Responsibility Map block, with the decision-maker (Minister/Department) as the lead role — see `RESPONSIBILITY_MAP_SPEC.md`#government-decision
**CIVIC ACTION NEEDS:** Full model, same as Issue detail
**LEGAL / EDITORIAL / POLICY RISKS:** A real, citable source is mandatory before publication (Editorial Advisor's whole-page-unsourced-premise blocker) — this is a build requirement, not a style preference
**SMALLEST SAFE FIX:** N/A — nothing to fix incrementally; the honest transitional state already shipped is the correct interim, not a bug
**IDEAL V1 STRUCTURE:** Per `CORE_PAGE_REDESIGN.md`#Government-Decision — title/status → decision-maker (with institutional context) → what/why → real timeline → linked evidence → linked forecast → real action
**IMPLEMENTATION PRIORITY:** Blocked on Batch 9 (schema foundations) — do not build ahead of the schema decision
**OWNER DECISIONS:** The Issue/Decision merge strategy (`IMPLEMENTATION_BATCHES.md` Batch 9); whether Minister/Department become real, normalized, first-class objects (currently free-text inside a mock type) — a genuine new-object decision, not a duplication question

---

## Forecast detail (`/forecasts/[id]`) {#forecast-detail}

**Route:** Does not exist anywhere in the app. Confirmed by route-tree search — every forecast's entire on-platform presence today is a card on the Forecasts board plus a stake modal.

**Status:** A genuine current gap, not a truthfulness defect — nothing fabricated is displayed in this page's place; the page simply doesn't exist, so the dense content that belongs here (evidence, resolution criteria, AI bull/bear, history) is instead crammed onto the list-grid `MarketCard`, which is the actual defect (see `FORECASTS_PAGE_AUDIT.md`).

**Truthfulness classification (of what would populate this page):** Current probability → **forecast**; resolution criteria → **sourced analysis** (once stated in advance, per the benchmarking-derived pattern); AI bull/bear → **AI-generated interpretation**, must be explicitly labeled; `resolution_source` (once resolved) → **verified fact**, currently trapped at the database layer and invisible to readers.

**OUTPUT PER PAGE:**
**PAGE:** Forecast detail
**ROUTE:** `/forecasts/[id]` (new)
**CURRENT PURPOSE:** N/A — does not exist
**PROPOSED PURPOSE:** What does the crowd expect for this specific question, and why?
**SINGLE QUESTION:** What does the crowd expect, and why?
**PRIMARY USER:** Someone arriving from the Forecasts board or a link from an Issue page
**FIRST 30 SECONDS:** Question, current probability, then immediately why
**WHAT IS ESSENTIAL:** Question, current probability + brief history, real evidence/news (linked from the originating issue, not duplicated), resolution criteria stated in advance, the stake action
**WHAT IS OPTIONAL:** AI-generated bull/bear commentary, explicitly labeled as such
**WHAT IS DUPLICATED ELSEWHERE:** Evidence/context should link to, not re-author, the originating Issue's own editorial content
**WHAT BELONGS ON A DETAIL PAGE INSTEAD:** This is the detail page — the finding is that this content currently has nowhere else to live but the list card, which is the wrong place
**WHAT SHOULD BECOME CONTEXTUAL:** N/A
**WHAT SHOULD BE REMOVED:** N/A — nothing to remove from a page that doesn't exist
**WHAT SHOULD NEVER APPEAR:** AI-generated commentary without an explicit "AI-generated interpretation" label; fake volume/24h-move figures; any framing implying financial advice
**FAKE/UNSUPPORTED:** N/A on this page directly; inherited risk if `MarketCard`'s existing AI-fallback/fake-volume defects (see `FORECASTS_PAGE_AUDIT.md`) are copied into the new page rather than fixed when building it
**WHAT IS GENUINELY REAL:** The underlying market data (`issue_markets`), once this page reads it directly instead of via a list-card summary
**DEAD/DECORATIVE CONTROLS:** N/A
**PRIMARY ACTION:** Understand the current estimate and why
**SECONDARY ACTIONS:** Stake a view (sign-in gated); jump to the originating issue
**EMPTY STATE:** N/A — this page only exists for real, eligible markets
**MOBILE PRIORITIES:** Single-column article + one inline action, same grammar as Issue/Government-Decision detail
**CANONICAL DATA SOURCE:** `issue_markets`, via `market-eligibility.ts` — the same source the board already uses correctly
**REQUIRED SHARED COMPONENTS:** Article grammar shared with Issue detail and Government Decision detail
**RESPONSIBILITY MAP NEEDS:** A link back to the Issue's own Responsibility Map — a forecast doesn't have its own decision-maker, it has a subject
**CIVIC ACTION NEEDS:** "Follow this forecast"; link to the Issue's civic-action set (staking is not, itself, civic influence — see `CIVIC_ACTION_MODEL.md`)
**LEGAL / EDITORIAL / POLICY RISKS:** Resolution criteria for a *political* forecast need institutional review on a case-by-case basis for ambiguous resolution (e.g. "was a bill passed" when amended versions differ) — Public Policy Advisor finding, per `docs/STICKEE_COUNCIL.md`'s sample review; the Kalshi-derived "state resolution criteria in advance" pattern is rated "Adapt," conditional on this review, not unconditionally adoptable
**SMALLEST SAFE FIX:** N/A — build, don't patch
**IDEAL V1 STRUCTURE:** Per `CORE_PAGE_REDESIGN.md`#Forecast-detail — question → current estimate + methodology line → resolution criteria → evidence/history → linked issue → stake action
**IMPLEMENTATION PRIORITY:** P1 — structurally independent of the Issue/Decision schema merge (Batch 9), can proceed once the Forecasts board itself is slimmed (Batch 12)
**OWNER DECISIONS:** Whether resolution-criteria wording for politically contested bills needs a standing Public Policy review step before each new forecast opens, or only for edge cases flagged by staff

---

## MP profile (`/mp/[id]`) {#mp-profile}

**Route:** `/mp/[id]` (target `/people/[id]`). Full detail already covered in `PEOPLE_PAGE_AUDIT.md`'s classification table. This entry adds the OUTPUT PER PAGE template specifically for the profile (as distinct from the directory).

**Truthfulness classification (recap):** Identity fields (name/party/electorate) → **verified fact**. "Voting analysis is being verified" placeholder → **no verified data available, correctly stated**. Real `member_votes`/`divisions` exist and are unused here — a real-data opportunity, not a defect to fix by removal.

**OUTPUT PER PAGE:**
**PAGE:** MP profile
**ROUTE:** `/mp/[id]` (target `/people/[id]`)
**CURRENT PURPOSE:** Identity header + Simulate-this button (first interactive element) + honest "being verified" voting placeholder
**PROPOSED PURPOSE:** What has this specific MP done?
**SINGLE QUESTION:** What has this MP done?
**PRIMARY USER:** Someone arriving via People's directory or a link from an issue/vote
**FIRST 30 SECONDS:** Currently sees identity, then a prominent Simulate button, before any record content
**WHAT IS ESSENTIAL:** Identity, real vote history (raw, dated, sourced)
**WHAT IS OPTIONAL:** Committee membership (not yet a modeled object — see `RESPONSIBILITY_MAP_SPEC.md`); Simulate-this
**WHAT IS DUPLICATED ELSEWHERE:** None — this is the correct single home for MP-specific content
**WHAT BELONGS ON A DETAIL PAGE INSTEAD:** N/A — this is the detail page
**WHAT SHOULD BECOME CONTEXTUAL:** Simulate-this — a chip beside the record, not the first thing below the header (`mp/[id]/page.tsx:71-80`)
**WHAT SHOULD BE REMOVED:** Nothing currently fabricated remains to remove (Batches 2.5/8 already did this)
**WHAT SHOULD NEVER APPEAR:** Any computed score/grade not satisfying `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` in full; the fabricated per-party voting-history list already removed once
**FAKE/UNSUPPORTED:** None currently live
**WHAT IS GENUINELY REAL AND WORTH PRESERVING:** Identity fields; the honest placeholder wording (keep until real data replaces it, then remove — don't leave stale)
**DEAD/DECORATIVE CONTROLS:** None found
**PRIMARY ACTION:** Read the MP's real record
**SECONDARY ACTIONS:** Simulate this MP's stance on a live issue; contact this MP
**EMPTY STATE:** "Being verified against the real parliamentary record" — correct, temporary
**MOBILE PRIORITIES:** De-emphasise Simulate's current top-of-page prominence; no other structural change needed
**CANONICAL DATA SOURCE:** `member_votes`/`divisions`, keyed to `members.id`/`tvfy_id` — never the retired `PARTY_VOTE_MAP` under any name
**REQUIRED SHARED COMPONENTS:** Filterable vote-history list (new, real); identity header (already correct)
**RESPONSIBILITY MAP NEEDS:** A one-line "what this MP can and can't do" role note (they vote and represent an electorate; they do not personally decide policy or run a department) — see `RESPONSIBILITY_MAP_SPEC.md`#mp
**CIVIC ACTION NEEDS:** "Contact this MP" via the real mechanism (`bill_pressures`/`CampaignModal` pattern, not a bespoke mailto)
**LEGAL / EDITORIAL / POLICY RISKS:** None currently live; the MP canonical-ID migration (Historian, P1) must precede wiring real vote data, since a wrong ID mapping would attribute one MP's vote to another — a real-person accuracy risk, not just a technical one
**SMALLEST SAFE FIX:** De-emphasise Simulate's placement (chip, not top banner) — presentation-only
**IDEAL V1 STRUCTURE:** Per `CORE_PAGE_REDESIGN.md`#MP-profile — header → real voting record → context (if Committee is ever built) → Simulate (de-emphasised)
**IMPLEMENTATION PRIORITY:** P1 — wiring real vote data is high-value, real-data work, gated only on the ID migration, not on any other batch
**OWNER DECISIONS:** Approve the MP canonical-ID mapping plan (`IMPLEMENTATION_BATCHES.md` Batch 13) before `/people/[id]` ships with real vote data

## Council review (Level 2 — MP profile; per Release Gates: Editorial Advisor + Public Policy Advisor + Data & Evidence Steward)

```
Editorial:        Approved — no unsourced claim currently rendered
Public Policy:    Approved with conditions — real vote data must be correctly ID-mapped before wiring, or risk misattributing one MP's vote to another (Historian, P1, shared finding)
Data & Evidence:  Approved with conditions — same ID-mapping condition; once satisfied, this becomes one of the strongest evidence-backed pages in the app

Overall recommendation: Merge the Simulate-demotion fix now; gate real vote-data wiring on the ID-migration plan (Batch 13).
```

---

## Election {#election}

**Route:** **Does not exist as a page.** Confirmed by direct route-tree search (`find src/app -iname "*election*"` → only `src/app/api/election`, an API route). Live election data exists solely as `LiveElectionPulse`, a widget embedded on `/predictions` and `/leaders`, backed by `useLiveElection()`/the AEC live scrape (`docs/architecture/STICKEE_SYSTEM_ARCHITECTURE.md` System 14).

**Truthfulness classification:** The underlying live snapshot → **verified fact**, with the one exemplary source-trust disclosure found anywhere in the app: *"projected government status is Stickee's summary from official AEC counts. It is not an AEC declaration"* (`docs/audits/DATA_AND_CONTENT_AUDIT.md` §6). This pattern should be copied elsewhere, not fixed.

**OUTPUT PER PAGE:**
**PAGE:** Election
**ROUTE:** None exists; not recommended as a standalone route
**CURRENT PURPOSE:** A permanently-mounted widget on Forecasts and People, regardless of whether an election is active
**PROPOSED PURPOSE:** Show real-time results only when an election is genuinely in progress
**SINGLE QUESTION:** What's happening in a live election, right now?
**PRIMARY USER:** Someone checking live results during an actual election period — a rare, time-boxed audience, not every visitor
**FIRST 30 SECONDS:** N/A — currently always visible, most of the time showing an inactive/dormant state that still consumes page real estate
**WHAT IS ESSENTIAL:** Live seat/result snapshot, the AEC-attribution disclosure, a clear "not an AEC declaration" framing
**WHAT IS OPTIONAL:** Everything else
**WHAT IS DUPLICATED ELSEWHERE:** The widget itself is duplicated across two pages (`/predictions` and `/leaders`) rather than living in one contextual place
**WHAT BELONGS ON A DETAIL PAGE INSTEAD:** N/A — this is inherently a live, transient surface, not an archival detail page (no `elections` table exists — by design, per `docs/architecture/DOMAIN_MODEL.md`)
**WHAT SHOULD BECOME CONTEXTUAL RATHER THAN ALWAYS VISIBLE:** The entire widget — gate on `useLiveElection().active`, per `CONSOLIDATION_AND_REDIRECT_PLAN.md`
**WHAT SHOULD BE REMOVED:** Its permanent placement on Forecasts specifically — a live-election tracker has no reason to sit inside the prediction-market board when no election is live
**WHAT SHOULD NEVER APPEAR:** A live-election claim without the existing AEC-attribution disclosure; a persisted historical "election" record implying more permanence than the system's intentionally-stateless design provides
**FAKE/UNSUPPORTED:** None found — this is the one feature audited across every generation of this repo's review with zero truthfulness defect
**WHAT IS GENUINELY REAL AND WORTH PRESERVING:** The entire mechanism, unchanged — this is a placement problem, not a data problem
**DEAD/DECORATIVE CONTROLS:** None found
**PRIMARY ACTION:** Check current live results (only when an election is active)
**SECONDARY ACTIONS:** None needed
**EMPTY STATE:** When no election is active, the widget should not render at all (not an inactive placeholder taking up space)
**MOBILE PRIORITIES:** Same as desktop — no election-specific mobile work identified
**CANONICAL DATA SOURCE:** Live AEC Tally Room scrape via `src/lib/aec-election.ts` — stateless, no database table, by design
**REQUIRED SHARED COMPONENTS:** `LiveElectionPulse`, unchanged
**RESPONSIBILITY MAP NEEDS:** N/A — an election is a process, not a decision-maker
**CIVIC ACTION NEEDS:** None beyond what already exists (viewing results is not itself a civic action)
**LEGAL / EDITORIAL / POLICY RISKS:** Electoral-law exposure if Election ever becomes a Political Pulse chronological content type (excluded at V1, per `CONTENT_HIERARCHY.md` §3) — flagged for future review, not a current risk given today's live-only scope
**SMALLEST SAFE FIX:** Gate the existing widget on `useLiveElection().active` — the signal already exists in code, it's simply not used to conditionally render (per `SIMPLIFICATION_RECOMMENDATIONS.md`)
**IDEAL V1 STRUCTURE:** A single contextual banner, rendered only when active, on one canonical page (recommend Today or Government, not Forecasts — an election result is a governance event, not a forecast)
**IMPLEMENTATION PRIORITY:** P2 — no truthfulness risk, a real but low-urgency placement fix (most of the year, no election is active, so the cost of the current always-mounted placement is intermittent, not constant)
**OWNER DECISIONS:** Which page hosts the contextual banner when this work is scheduled (Today vs. Government vs. a dedicated seasonal surface); add basic scrape-failure alerting given the system has no fallback data source if AEC's HTML structure changes (architecture doc's own flagged gap)

---

## Civic Proposal {#civic-proposal}

**Route:** **Does not exist as a real, persisted object anywhere.** The closest precedent, `ProposeMarketModal.tsx` (market-proposal submission on Forecasts), is confirmed to never persist past `localStorage` despite a "Pending Review" badge implying real moderation (`docs/architecture/DOMAIN_MODEL.md`'s Policy/Proposal entry; `SIMPLIFICATION_RECOMMENDATIONS.md`).

**Truthfulness classification:** A submitted "civic proposal" via the current closest-precedent flow → **unsupported** (implies review that never happens). There is no truthful version of this object today; the only honest treatment is to not present a submission as accepted-for-review.

**OUTPUT PER PAGE:**
**PAGE:** Civic Proposal
**ROUTE:** None (deferred — see `CORE_PAGE_REDESIGN.md`#Community, `STICKEE_V1_PRODUCT_BLUEPRINT.md` §8)
**CURRENT PURPOSE:** N/A for a real object; `ProposeMarketModal`'s decorative form is the only thing resembling this today
**PROPOSED PURPOSE (deferred, specified for later):** Let a user submit an evidence-backed idea attached to an existing object (an issue's evidence, a bill's pressure campaign), with a visible status lifecycle
**SINGLE QUESTION:** How can I contribute directly?
**PRIMARY USER:** A civically engaged user with evidence or an idea to contribute
**FIRST 30 SECONDS:** N/A — not built
**WHAT IS ESSENTIAL (once built):** What's being proposed, attached object, current status (submitted/under review/accepted/declined with a stated reason)
**WHAT IS OPTIONAL:** N/A until scoped
**WHAT IS DUPLICATED ELSEWHERE:** `ProposeMarketModal` (Forecasts) and the Community Leader nomination flow (`NominationModal.tsx`, People) are both partial, disconnected precedents — a future Civic Proposal object should not be a third parallel system
**WHAT BELONGS ON A DETAIL PAGE INSTEAD:** N/A
**WHAT SHOULD BECOME CONTEXTUAL:** N/A
**WHAT SHOULD BE REMOVED NOW (independent of the deferred feature):** `ProposeMarketModal`'s "+Propose" entry point and its "Pending Review" badge — see `FORECASTS_PAGE_AUDIT.md`; this removal does not wait for the Civic Proposal feature to be designed
**WHAT SHOULD NEVER APPEAR, EVER, IN ANY VERSION:** An open comment/reaction wall on real, named people; a "credibility score" computed from unverified crowd input with no disclosed methodology; any popularity-contest mechanic for a real, identifiable individual (`CORE_PAGE_REDESIGN.md`#Community, verbatim)
**FAKE/UNSUPPORTED:** `ProposeMarketModal`'s current implied review pipeline
**WHAT IS GENUINELY REAL AND WORTH PRESERVING:** The `evidence`/`citations` table this feature should be built to depend on, once it exists (Batch 9) — a Civic Proposal without real evidence infrastructure underneath it would repeat the exact "looks populated, isn't real" pattern already fixed elsewhere
**DEAD/DECORATIVE CONTROLS:** `ProposeMarketModal`'s submit button
**PRIMARY ACTION (once built):** Submit a proposal attached to a real object
**SECONDARY ACTIONS:** Track a submitted proposal's status
**EMPTY STATE:** N/A until built
**MOBILE PRIORITIES:** N/A until built
**CANONICAL DATA SOURCE (once built):** A new, real submission table with a visible-status lifecycle — never `localStorage`
**REQUIRED SHARED COMPONENTS:** A status-lifecycle pattern (submitted → under review → accepted/declined) — the GitHub/Linear/Notion convention, per the Product Intelligence & Benchmarking Advisor, not an open comment/reaction feed
**RESPONSIBILITY MAP NEEDS:** Who reviews a proposal, and on what authority — must be specified before this ships, currently undefined
**CIVIC ACTION NEEDS:** This *is* one of the civic actions in `CIVIC_ACTION_MODEL.md` ("submit evidence" / "support an evidence-backed proposal") — but only once real, not as a placeholder
**LEGAL / EDITORIAL / POLICY RISKS:** Gated on: a real lawyer's review of real-person nomination/scoring if proposals ever touch people (not just bills/evidence); a built admin moderation queue (System 12 has none today — direct database access is the only path to act on a report); an explicit owner decision that this is in scope at all for the near-term roadmap
**SMALLEST SAFE FIX:** Remove `ProposeMarketModal`'s decorative entry point now (independent, no dependency, same risk class as Batch 1) — this is the only in-scope action for this object type at V1
**IDEAL V1 STRUCTURE:** Not specified for V1 — see `CORE_PAGE_REDESIGN.md`#Community for the eventual target, documented so a future build doesn't restart from zero
**IMPLEMENTATION PRIORITY:** Explicitly deferred (`IMPLEMENTATION_BATCHES.md` Batch 15, "not scheduled") — the only in-scope work now is removing the decorative precedent
**OWNER DECISIONS:** Whether Civic Proposal is in scope at all post-V1 (Product Strategist's priority order places new features last, behind still-open Tier 1–3 debt); commission the real lawyer's review and build the moderation queue before revisiting

## Council review (Level 3 — Civic Proposal / Community; reuses `STICKEE_V1_EXECUTIVE_SUMMARY.md` Consensus C5, Disagreement D2)

```
Software Architecture:  Approved with conditions — reuse leader_supports/NominationModal.tsx infrastructure once legally cleared, don't build a fourth system
Legal and Regulatory:   Requires professional legal review — real-person nomination/scoring is a materially different risk than the fictional-profile version already once disabled
Product Benchmarking:   Blocked pending professional review
Product:                 Recommends deferring any new Community/Civic-Proposal surface past V1

Overall recommendation: Do not build. Remove the one live decorative precedent (ProposeMarketModal) now; revisit only after the named legal review and moderation-queue prerequisites are met.
```
