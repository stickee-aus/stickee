# Dry Review — `/decisions` ("Government")

**Status: demonstration of the Council workflow, not a production decision.** No code was changed to produce this review. This exercises the review process defined in [agents/README.md](../../agents/README.md) against a real, current page, using the [Page Review](../../agents/templates/page-review.md) template.

## Input

```
Route: /decisions
Nav label shown to users: "Government" (src/lib/navigation.ts, PRIMARY_NAV, id: 'government')
Page's own header: eyebrow "Government" / H1 "Decisions"
Screenshots: not captured — reviewed from source and rendered JSX structure
Page text (verbatim, src/app/decisions/page.tsx):
  "Every government decision — federal, state, and local. Track what happened,
  who made it, and what it means for you."
  "This is Stickee's Government section for now — it doesn't yet include the
  full parliamentary record. For chamber composition, MP votes and real
  campaign actions, see Parliament."
Relevant components: src/app/decisions/page.tsx, src/components/DecisionCard.tsx
Data source: MOCK — src/lib/mock-government-data.ts (DECISIONS array, DECISION_MAKERS array).
  No Supabase query is used on this route. No `source`, `sourceUrl`, `citation`,
  or `verified` field exists anywhere on the Decision or DecisionMaker types
  (src/types/government.ts).
Related existing docs: PAGE_AND_ROUTE_INVENTORY.md, PROPOSED_ROUTE_TREE.md,
  CONSOLIDATION_AND_REDIRECT_PLAN.md
```

**Correction to the review brief:** the brief that requested this dry review assumed 19 decisions. The actual current count in `DECISIONS` is **30** (confirmed by counting `id:` fields in `src/lib/mock-government-data.ts`, lines 189–795). This discrepancy is itself reported below as an Editorial/evidence-accuracy note — it did not change the review's substance.

Agents invoked: Product Strategist, Public Policy Advisor, Editorial Advisor, UX Researcher, UX Journey and Bottleneck Analyst, Council Chair.

---

## Product Strategist

```
Problem statement: A user wants to know what government has actually decided
  and what it means for them.
Target user: Politically engaged and disengaged Australians looking for a
  factual record of government action.
Product value: High in principle — a factual decision archive is core to
  Stickee's identity as a civic-intelligence platform.
Alternatives considered: N/A — reviewing existing page, not a new proposal.
Recommendation: Do not promote or expand this page further until it is
  reconnected to a real, sourced data pipeline. The page currently delivers
  the *appearance* of the product's core value proposition without the
  substance.
What to defer: Any further UI polish, new filters, or new decision types
  until the underlying data is real.
Success criteria: Every decision on this page traceable to a real government
  source (Hansard, an official release, a Budget paper, or a state/local
  government record).
Priority tier: 2 ("Replace fake data") — the page currently sits at Tier 8
  levels of polish (search, filters, trending, sentiment bars, inline
  prediction, email-MP, simulate) while resting entirely on Tier-2, unresolved
  fake data. This is the priority-order violation AGENTS.md explicitly warns
  against.
Dependencies: A real government-decisions data pipeline (or, at minimum,
  per-decision source citations) does not yet exist for this route.
Owner decisions required: Whether to (a) build a real sourcing pipeline for
  this page, (b) relabel it clearly as demo content in the interim, or
  (c) reduce its prominence in navigation until (a) is done.
```

## Public Policy and Political-Science Advisor

*(Not a political scientist — see boundaries in [agents/public-policy-advisor.md](../../agents/public-policy-advisor.md).)*

```
Political object under review: DECISIONS array — 30 records mixing DecisionType
  values Bill / Policy Change / Announcement / Funding Allocation / Regulation /
  Infrastructure, across federal, state, and local levels.
Institutional context: Federal (majority of records), NSW/VIC/QLD state, and a
  smaller number of local-council records.
Accuracy concerns:
  - Status values (Proposed / In Debate / Passed / Rejected / Implemented) and
    their timelines correspond to plausible real events (e.g. HECS indexation
    reform, bulk-billing incentive, Housing Australia Future Fund) with
    specific real-looking dates, but none carry a citation. A reader cannot
    tell whether "Passed both chambers, 2023-09-13" is a verified fact or a
    plausible-sounding fabrication — that ambiguity is itself the finding,
    independent of whether the underlying dates happen to be correct.
  - One record (a Peter Dutton nuclear-energy "Announcement") is marked
    'Proposed' with only a single timeline event ("Policy released by
    Opposition") — this correctly distinguishes an opposition policy release
    from an enacted government decision, which is good institutional practice
    the page should be given credit for.
Neutrality concerns: No neutrality problem found in the sampled framing —
  status language ("Proposed," "Passed") is neutral. The concern is evidentiary,
  not tonal.
Missing context: No source is shown for any record. AGENTS.md requires every
  public political claim to be classified as verified fact / sourced analysis
  / forecast / community opinion / AI-generated interpretation / demo /
  unverified / no verified data available — none of these 30 records carry
  any such classification today.
Does the page distinguish government action from party proposal?: Partially —
  the Dutton nuclear-energy record does, structurally, by status. But nothing
  on the page tells the reader this distinction exists or how to read it.
Terminology recommendation: Add a visible, per-decision evidence classification
  (per AGENTS.md) rather than relying on structural correctness a reader can't see.
Source needs: All 30 records need a citable source (Hansard record, government
  media release, Budget paper, or state/local government notice) before this
  can be called a decision archive rather than a demo.
Severity: P1 — not P0, because the sampled institutional classifications
  (government vs. opposition, level of government) appear structurally
  correct; but P1 because zero sourcing on 30 specific factual claims about
  real, named politicians is a significant trust gap.
Real academic review required?: No — this is a sourcing/evidence gap, not a
  contested interpretive question.
```

## Editorial and Parliamentary Research Advisor

*(Not a journalist — see boundaries in [agents/editorial-research-advisor.md](../../agents/editorial-research-advisor.md).)*

```
Copy under review: Page header + representative DecisionCard content (see Input above)
Classification: Unverified. Every decision record on this page should currently
  be classified "Unverified" or "Demo content" per AGENTS.md's evidence
  categories — none carry a source, publication date, or retrieval date, and
  none are labelled as demo. The page presents them with the visual authority
  of verified reporting (status badges, dates, timelines, sentiment
  percentages) with no hedge.
Unsupported claims:
  - "8,740 likes / 3,210 dislikes → 73% agree" (Housing Australia Future Fund,
    and equivalent numbers on all 30 records) — presented as if it reflects
    real public sentiment. There is no user-facing indication this is
    fabricated. This is the single highest-severity editorial finding on the
    page.
  - "Trending" badge (isTrending: true) on several records — presented as an
    observed signal with no stated methodology (what makes something
    trending? Over what window? Compared to what baseline?).
  - Inline prediction widget's "X% yes" / "N votes," and the post-vote
    "You're with the majority — X% of N Australians agree" reveal — this is
    the most editorially serious individual component on the page: it tells
    an individual user they are "with the majority" of a specific fabricated
    number of "Australians," which reads as a factual social-proof claim, not
    a demo.
Missing sourcing: All 30 records; no source field exists in the underlying
  type (src/types/government.ts) for this to even be added without a schema
  change.
Revised framing: Until real data/sourcing exists, either (a) do not display a
  numeric agree/disagree percentage or a "with the majority" claim at all, or
  (b) visibly and unavoidably label it "Demo — not real user data" at the
  point of display, not just in a methodology doc. [SOURCE NEEDED] on every
  decision record's factual claims.
Correction risk: High if any single one of these 30 records is inaccurate on
  a real, contestable point (e.g. a status or date) — there is currently no
  correction pathway visible on the page (see Civic Technology concerns in
  the Council Chair synthesis below).
Publication readiness: Not ready, specifically for the sentiment/trending/
  social-proof numbers. The factual decision records (title, summary, status,
  timeline) are lower-severity and closer to ready pending sourcing.
Severity: P0 for the "with the majority" social-proof claim and the
  likes/dislikes sentiment bar (both state fabricated numbers as if they
  describe real Australians' opinions); P1 for unsourced decision records and
  unexplained "Trending" methodology.
```

## UX Researcher

```
User: First-time signed-out visitor arriving at /decisions (or via "Government" nav)
Task: Understand what government has recently decided
Observed issue: The page's one main question is reasonably clear ("what did
  government decide"), and the ten-second test broadly passes — header,
  search, and filters communicate purpose quickly. Friction begins inside
  each DecisionCard, which does five distinct things at once when expanded:
  read a summary, read short/long-term effects, answer an inline yes/no
  prediction, email your MP, and "simulate" the decision. (src/components/
  DecisionCard.tsx)
Friction: Observed (from component structure, not a live user test)
Severity: P2
Consequence: A user who opened the card to understand "what happened" is
  presented with three additional, unrelated calls to action
  (predict / email / simulate) before or alongside the information they came
  for, diluting the primary task.
Smallest fix: Keep the factual summary, status, and timeline as the default
  expanded view; move prediction/email/simulate below a secondary
  "Get involved" affordance rather than presenting all five actions with
  equal visual weight.
Usability test to validate: A short task-based test — "find out what the
  government decided about X and tell us what it means for you" — checking
  whether users can state the outcome accurately without also completing (or
  being distracted by) the secondary actions.
Success metric: Not yet measured — no analytics instrumented on this route
  today (proposal: rate of card expansion that leads to a stated
  understanding of the decision vs. rate that leads to interacting with a
  secondary action first).
```

```
User: First-time visitor comparing "Government," "Issues," and "Parliament"
Task: Understand where to look for a specific piece of political information
Observed issue: The page's own copy acknowledges the overlap ("This is
  Stickee's Government section for now — it doesn't yet include the full
  parliamentary record... see Parliament"), and the primary nav's own code
  comment (src/lib/navigation.ts) states the "Government" nav item also
  activates for /parliament even though it links to /decisions — the
  distinction is currently held together by a code comment and one sentence
  of page copy, not by structure a user can perceive.
Friction: Observed
Severity: P2
Consequence: Users likely cannot predict, before clicking, whether
  "Government" will show them decisions, Parliament, or both.
Smallest fix: The disclosure sentence already on the page is a reasonable
  interim mitigation; consider surfacing the same distinction in the nav
  item itself (e.g. a "Government" landing view that explicitly branches to
  Decisions vs. Parliament) rather than only in the destination page's body copy.
Usability test to validate: First-click testing — ask users where they'd click
  to find "what Parliament voted on this week" vs. "what a government decision
  means for me," and see whether they land where the IA intends.
```

## UX Journey and Bottleneck Analyst

**Journey mapped: #6, "What is government doing about an issue?"** Confidence: Observed (traced through actual route/component code).

```
User: Politically engaged, signed-out visitor
Goal: Understand what government is doing about a specific issue (e.g. housing)
Entry point: Home page or direct nav to "Government"
Current route(s): / → /decisions (nav item id 'government', href '/decisions')
Current steps: Land on /decisions → read header disclosure → search "housing" or
  filter by impact/level → open a matching DecisionCard → read summary/timeline
  → optionally answer inline prediction / email MP / simulate
Expected outcome: A clear, sourced answer to "what has government done" plus a
  clear next step
Actual outcome: A plausible-looking but unsourced answer, presented with
  fabricated engagement signals (likes/dislikes, "Trending," "X% agree") that
  are visually indistinguishable from real ones
Bottlenecks:
  - Trust (category: Trust) — P0. The core deliverable of this journey (an
    honest account of government action) is undermined by fabricated
    sentiment/trending data presented without any demo label.
  - Duplicate system / Information architecture (category: Duplicate system) —
    P2. "Government" nav destination vs. "Parliament" overlap, mitigated but
    not resolved by page copy (see UX Researcher finding above).
Trust risks: A user who later learns the agree/disagree percentages and
  "Trending" flags are hardcoded mock values (not derived from real user
  votes or real trend detection) has reason to distrust the rest of the page,
  including the factual decision records that may well be accurate.
Dead ends: None found in the traced journey — search, filters, and card
  expansion all function.
Unnecessary steps: None beyond the UX Researcher's card-density finding above.
Missing information: No source/citation on any record; no visible methodology
  for "Trending" or "Controversial."
Proposed route: Same route structure; change what's rendered, not where it lives.
Recommended fix: (1) Remove or clearly label the likes/dislikes sentiment bar
  and "with the majority" reveal as demo content until backed by real votes;
  (2) state a methodology for "Trending"/"Controversial" or remove the badges;
  (3) add a visible per-record source link once sourcing exists.
Priority: P0 (trust bottleneck), P2 (IA overlap)
Confidence: Observed
```

## Council Chair — Synthesis

### Approval matrix

```
Software Architecture:      Not applicable (not invoked for this dry review — no architecture change proposed)
Product:                     Blocked
Public Policy:                Approved with conditions
Civic Technology:            Not applicable (not invoked — see limitation note below)
Legal and Regulatory:        Not applicable (not invoked — see limitation note below)
Editorial:                    Blocked
UX:                           Approved with changes
Open Source:                  Not applicable
Journey and Bottlenecks:      Blocking friction
```

### Consensus findings

1. **No decision record on this page carries a real source.** Raised independently by Product Strategist, Public Policy Advisor, and Editorial Advisor. This is the single dominant finding.
2. **The likes/dislikes "agree %" and post-vote "with the majority" claim are fabricated numbers presented as if they describe real Australians.** Raised independently by Editorial Advisor (as the top publication-readiness blocker) and the UX Journey Analyst (as the top trust bottleneck). This is the most severe individual finding in the review.
3. **"Trending" and "Controversial" badges have no stated methodology.** Raised by Public Policy Advisor and Editorial Advisor.
4. **"Government" vs. "Parliament" vs. "Issues" boundary is real but only communicated via one sentence of page copy and a code comment invisible to users.** Raised by UX Researcher and UX Journey Analyst.
5. **The page's polish (search, filters, five card actions) is out of step with the unresolved Tier-2 data problem underneath it.** Raised by Product Strategist, reinforced by the Editorial Advisor's "publication readiness: not ready" verdict.

### Disagreements

None substantive — all four invoked specialist agents converged on sourcing/fabrication as the dominant issue from their own independent evidence and standards. The Public Policy Advisor rated its own finding P1 (institutional classification is structurally sound, only sourcing is missing) while the Editorial Advisor rated the sentiment/social-proof numbers P0 (fabricated engagement presented as real). This is not a conflict — they're evaluating different parts of the page (factual record vs. sentiment display) and both verdicts stand.

### Blocking risks

1. **P0 — Fabricated "with the majority" / agree-percentage social proof presented without a demo label** (Editorial, Journey Analyst). This is a direct instance of the AGENTS.md-prohibited pattern: inventing public support percentages and displaying fabricated content as if verified.
2. **P1 — 30 decision records with zero source citations, no schema field to hold one.** (Public Policy, Product Strategist)
3. **P1 — "Trending"/"Controversial" flags with no stated methodology.** (Public Policy, Editorial)
4. **P2 — Government/Parliament IA overlap communicated only in body copy.** (UX Researcher, Journey Analyst)
5. **P2 — DecisionCard bundles five distinct actions, diluting the core informational task.** (UX Researcher)

### Owner decisions required

- Whether to invest in a real sourcing pipeline for government decisions now (Tier 2 per AGENTS.md priority order), or reduce this page's prominence/navigation weight until that investment happens.
- Whether the likes/dislikes/"agree %"/"Trending" mechanics should be removed, clearly demo-labelled, or replaced with a real methodology — this is a product-identity decision (does Stickee want any sentiment/engagement display at all on unsourced content), not something the Council resolves unilaterally.
- Whether "Government" as a nav label is the intended long-term identity for this section, given `src/lib/navigation.ts` and `PROPOSED_ROUTE_TREE.md` both describe the current route as an interim state pending a `/government` hub.

### Overall recommendation: Do not merge (applied here as: do not expand, promote, or link this page further as-is)

**Why:** This was a review of an existing, already-shipped page, so "merge" doesn't apply literally — the equivalent judgement is whether the page is fit to keep live and to build further on. It is not, in its current form, without either (a) removing/labelling the fabricated sentiment and trending signals, or (b) sourcing the underlying decision records. Both the Editorial Advisor and the UX Journey Analyst independently reached a P0 on the same root cause (fabricated data presented as real), which per the cross-cutting escalation rules in `docs/STICKEE_COUNCIL.md` prevents an overall "acceptable" verdict regardless of the page's otherwise-reasonable structure and the Public Policy Advisor's more moderate P1.

### Implementation order (if the owner approves proceeding)

1. Smallest, safest first: add a visible "Demo — not based on real votes" label directly on the sentiment bar and the post-prediction "majority" reveal (a copy/UI change, no schema change, reversible immediately).
2. Decide and document a real methodology for "Trending"/"Controversial," or remove the badges until one exists.
3. Add a `source` / `sourceUrl` field to the `Decision` type and populate it for at least the highest-traffic records, in place of the current unsourced mock array.
4. Revisit the Government/Parliament IA overlap once (1)–(3) are done, since it's a smaller issue than the trust findings above.

Each of these is a product/content/architecture decision requiring explicit owner approval before implementation, per the Council's implementation boundaries — this review does not implement any of them.

---

## Limitations of this dry review

- **Civic Technology Advisor and Legal Advisor were not invoked**, though the task brief's required-agent list didn't include them either. A fuller review of this page would likely benefit from the Civic Technology Advisor (is there a correction pathway for a wrong decision record? there does not appear to be one) and the Legal Advisor (does the "with the majority... Australians agree" claim carry consumer-law risk as a misleading representation?). Flagged here as a gap, not resolved.
- **No real analytics were available or used.** All UX and Journey findings are labelled Observed (code-traced) rather than backed by real user behaviour data, per each agent's evidence standards.
- **No screenshots were captured**; findings are based on the actual source (JSX structure, copy strings, and type definitions), which is a permitted but lower-fidelity evidence source than a live screenshot per the Page Review template.
- This document is a demonstration of the Council workflow on a real page. It is **not** an authorization to change `/decisions`, and no part of it was implemented.
