# Product Pattern Library

A durable registry of product patterns studied by the **Product Intelligence & Benchmarking Advisor**, their evidence, risks, and current status. This is a permanent record, not a scratch list of ideas — every pattern ever reviewed (including rejected ones) stays here with its reasoning intact, per [docs/PRODUCT_BENCHMARKING_METHOD.md](PRODUCT_BENCHMARKING_METHOD.md#how-rejected-patterns-are-recorded).

Governed by [AGENTS.md](../AGENTS.md), [docs/STICKEE_COUNCIL.md](STICKEE_COUNCIL.md), and [docs/PRODUCT_BENCHMARKING_METHOD.md](PRODUCT_BENCHMARKING_METHOD.md). See [agents/product-intelligence-benchmarking-advisor.md](../agents/product-intelligence-benchmarking-advisor.md) for the agent that maintains this library.

**No pattern in this document is adopted.** Every entry below is `Candidate` or `Under review` — initial candidates identified while building this system, not yet taken through independent Public Policy / Editorial / Legal / Architecture review. None has owner approval. See the three initial benchmark reviews in `docs/benchmark-reviews/` for the fuller per-product analysis these summaries draw from.

## Statuses

- **Candidate** — identified, not yet independently reviewed by other council agents
- **Under review** — actively being assessed by relevant specialist agents
- **Approved for experiment** — owner has approved a small, scoped test
- **Adopted** — experiment succeeded (or evidence was already strong enough), pattern is part of Stickee's standard toolkit
- **Rejected** — fails the mission filter, requires copying protected expression, or specialists could not clear it
- **Superseded** — replaced by a later, better-evidenced pattern; kept for history

---

## Question-centric forecast page

Origin product: Kalshi
Problem solved: A reader wants to know "will X happen" and everything relevant to answering that question, without hunting across pages.
Observed behaviour: Each market is organized around one specific, falsifiable question, with the question itself as the primary heading, evidence and context arranged beneath it, and current probability shown prominently.
Underlying principle: Organize a page around the question a user actually has, not around the entity issuing the answer.
Why it may work: Reduces the cognitive step of translating "what I want to know" into "where do I find it" — the page title *is* the question.
Evidence level: Established convention (shared by most prediction-market and forecasting products)
Risks: Can overstate certainty if the probability number is shown without the evidence and methodology behind it; can read as gambling if paired with trading-style aesthetics.
What Stickee must not copy: Kalshi's trading-floor visual language (tickers, buy/sell buttons, real-money framing), urgency cues ("closing soon"), or any implication that virtual points have monetary value.
Stickee adaptation: An editorial forecast page — question as headline, sourced evidence and current expert/community view beneath it, framed as analysis rather than a trade.
Affected Stickee domains: `/predictions`, forecast detail pages
Dependencies: Requires resolved forecast-question data model; overlaps with existing `mock-market-data.ts` structure (see Software Architect review before any schema work)
Smallest experiment: Redesign one existing forecast's detail page around the question-first layout, no new data, and compare qualitatively against the current layout.
Success metrics: Not yet measured — no analytics instrumented; propose manual comparison of task completion (can a reader state the resolution criteria after reading the page) as a first step.
Status: Candidate
Owner decision: Whether to invest in a forecast-page redesign now, given other open Tier 1–3 debt (AGENTS.md priority order).
Last reviewed: 2026-08-05

## Transparent resolution criteria

Origin product: Kalshi
Problem solved: A reader can't judge a forecast's credibility unless they know exactly what would make it resolve YES or NO.
Observed behaviour: Every market states, before the event occurs, the precise, objective condition that will determine its resolution.
Underlying principle: State the evidence bar for a claim before the outcome is known, so resolution can't be quietly reinterpreted after the fact.
Why it may work: Removes ambiguity and post-hoc argument; a core piece of what makes a forecasting product feel trustworthy rather than arbitrary.
Evidence level: Established convention (standard practice across prediction markets and forecasting-tournament platforms)
Risks: Political events are frequently genuinely ambiguous (e.g. "was a bill passed" when amended versions differ, or a policy is "implemented" in stages) — a resolution rule that looks precise can still mislead if the underlying event is contested.
What Stickee must not copy: Kalshi's dispute/appeals process as-is (designed around real-money stakes) or any implication that resolution is purely mechanical for inherently political judgement calls.
Stickee adaptation: A visible "How this resolves" section on every forecast, reviewed by the Public Policy Advisor case-by-case for genuinely ambiguous political events, with an explicit note when a resolution required editorial judgement rather than a mechanical check.
Affected Stickee domains: Forecast detail pages, `src/types` forecast/market types
Dependencies: Public Policy Advisor review per forecast type; Legal Advisor review of any residual gambling-adjacent framing
Smallest experiment: Add resolution criteria copy to one existing forecast and have the Public Policy Advisor review it before publishing.
Success metrics: Not yet measured.
Status: Candidate
Owner decision: Whether resolution criteria should be mandatory for all forecasts going forward, and who owns writing/reviewing them.
Last reviewed: 2026-08-05

## Probability history with methodology

Origin product: Kalshi
Problem solved: A single current probability number gives no sense of whether opinion is stable, volatile, or trending, and no way to audit how it was derived.
Observed behaviour: A probability-over-time chart accompanies each market, alongside a stated methodology for how the number is calculated.
Underlying principle: Show the trajectory and the derivation, not just the current value — a number without a method is not evidence, it's an assertion.
Why it may work: Builds trust by making the number auditable rather than a black box, and gives context for whether a shift is meaningful.
Evidence level: Public documentation (prediction markets publish how their probabilities are derived from trading activity, though Stickee's mechanism would necessarily differ since there's no real-money trading)
Risks: If Stickee's probability is derived from very few participants, a history chart could visually imply more statistical weight than the underlying sample supports.
What Stickee must not copy: Presenting the number with trading-market authority when the actual sample size or methodology is thin — the chart must not outrun the evidence.
Stickee adaptation: **Correction on inspection — the chart already exists.** `src/components/FeaturedMarketCard.tsx` already renders a `ProbabilityHistoryChart` fed by a `history` array in `src/lib/mock-market-data.ts` (14 daily closing values per market), and states a resolution date ("resolves {market.resolvesBy}"). What's missing is not the chart but (a) a visible methodology statement — the page doesn't currently say how the probability or its history is derived, or what "resolves" actually means as a condition — and (b) the fact that the whole `history` array is hardcoded mock data with no real prediction volume behind it, which is exactly the same fabricated-signal problem already flagged for `/decisions` sentiment bars in the government-page dry review. The adaptation work here is disclosure and truthfulness, not new UI.
Affected Stickee domains: `FeaturedMarketCard.tsx`, `mock-market-data.ts`, forecast/market detail pages
Dependencies: None to build the chart (exists); requires either real prediction-volume data or an explicit "demo data" label until it exists (Product Strategist/Editorial decision)
Smallest experiment: Add a one-line methodology/demo-data disclosure directly beneath the existing chart on one market card, with no other change, and get Editorial + Public Policy sign-off on the wording.
Success metrics: Not yet measured.
Status: Under review
Owner decision: Whether to label current market history as demo data now (low effort, directly addresses a truthfulness gap) versus waiting for real prediction-volume infrastructure.
Last reviewed: 2026-08-05

## Source comparison

Origin product: Ground News
Problem solved: A reader sees one framing of a story and doesn't know how other, differently-positioned sources covered the same event.
Observed behaviour: A single story page aggregates how multiple outlets covered it, with outlet metadata (ownership, factuality rating from a stated third party) shown alongside each.
Underlying principle: Put multiple accounts of the same event side by side so the reader draws their own comparison, rather than presenting one account as definitive.
Why it may work: Directly counters the single-framing problem that makes political news feel one-sided, without requiring the platform itself to adjudicate which framing is "right."
Evidence level: Observed pattern (product's core, publicly visible mechanism)
Risks: Ground News' own bias/factuality ratings come from a third-party methodology Stickee has no relationship with and cannot verify; reproducing an ideological label without a reproducible, disclosed methodology is exactly the failure mode AGENTS.md warns against.
What Stickee must not copy: Any unsupported ideological labelling (e.g. "left/center/right" tags) without a transparent, reproducible, and disclosed methodology of Stickee's own.
Stickee adaptation: For a given decision or issue, show official government statement, parliamentary record, journalism coverage, and expert analysis side by side, each explicitly labelled by *type* (fact/analysis/opinion/forecast, per AGENTS.md's classification) rather than by political lean.
Affected Stickee domains: `/issues`, `/decisions`, new source-comparison surface (release-gated per `docs/STICKEE_COUNCIL.md`)
Dependencies: Requires a real multi-source content pipeline (does not exist today per current mock data); Legal review of redistributing third-party excerpts/headlines
Smallest experiment: Manually build one comparison view for a single, already-covered decision, sourced by hand, reviewed by Editorial and Public Policy before publishing.
Success metrics: Not yet measured.
Status: Candidate
Owner decision: Whether building a real multi-source pipeline is the right Tier-2/Tier-4 priority investment now (AGENTS.md priority order).
Last reviewed: 2026-08-05

## Framing comparison

Origin product: Ground News
Problem solved: Even when sources agree on the facts, differences in headline framing and emphasis shape reader perception.
Observed behaviour: The product highlights differences in headline wording and story emphasis across outlets covering the identical event.
Underlying principle: Make framing itself visible as data, rather than letting it operate invisibly on the reader.
Why it may work: Meta-awareness of framing is a well-established media-literacy technique; making it visible in-product could transfer some of that benefit without requiring the reader to seek it out separately.
Evidence level: Plausible benefit (the media-literacy research behind framing awareness is broader than product-specific evidence that this exact UI works)
Risks: Could itself become a subtle editorializing act if Stickee selects which framing differences to highlight; requires a clear, disclosed method for selection.
What Stickee must not copy: Presenting framing differences as evidence that one source is "biased" and another isn't — the goal is descriptive, not evaluative.
Stickee adaptation: A "how this was described elsewhere" panel showing verbatim (properly attributed, fair-use-scoped) headline excerpts, with no editorial ranking of which framing is correct.
Affected Stickee domains: Same surfaces as Source comparison
Dependencies: Legal review of excerpt length/fair use; Editorial Advisor review of selection methodology
Smallest experiment: Add a "described elsewhere" panel with 2–3 manually curated excerpts to one existing issue page.
Success metrics: Not yet measured.
Status: Candidate
Owner decision: Whether framing comparison ships as part of the same feature as source comparison or separately.
Last reviewed: 2026-08-05

## Blindspot or missing-context identification

Origin product: Ground News
Problem solved: Readers often don't know what they're *not* seeing — stories under-covered by outlets aligned with their own habitual sources.
Observed behaviour: The product flags stories with lopsided coverage patterns as a "blindspot."
Underlying principle: Surface absence, not just presence — what's missing from a reader's likely information diet is itself information.
Why it may work: Directly targets filter-bubble effects, which is squarely aligned with a civic-intelligence mission.
Evidence level: Plausible benefit (compelling concept, but Ground News' own effectiveness at reducing filter-bubble behaviour isn't independently verified here — evidence unavailable at this review's research depth)
Risks: "Blindspot" framing implies a confident claim about what a reader would otherwise miss, which requires knowing their existing habits — Stickee doesn't have that data and shouldn't infer it.
What Stickee must not copy: Personalized "your blindspot" framing that implies knowledge of an individual user's media diet Stickee doesn't actually have.
Stickee adaptation: A general "missing context" note on a decision/issue page — e.g. "this decision affects renters specifically; that angle is covered in [N] of the sources linked here" — descriptive of the coverage set shown, not a claim about the reader's personal habits.
Affected Stickee domains: `/issues`, `/decisions`
Dependencies: Requires the source-comparison pipeline above to exist first
Smallest experiment: Manually written "missing context" note on one existing decision page, reviewed by Public Policy and Editorial.
Success metrics: Not yet measured.
Status: Candidate
Owner decision: Sequencing relative to Source comparison (this pattern depends on it).
Last reviewed: 2026-08-05

## Citation-first claim presentation

Origin product: Wikipedia
Problem solved: A reader can't judge whether a claim is trustworthy without knowing where it came from.
Observed behaviour: Individual factual claims carry inline citations to a specific source, visible at the point of the claim rather than only in a general bibliography.
Underlying principle: Attach evidence at the claim level, not the page level — a page can be "sourced" overall while individual sentences within it are not.
Why it may work: This is the single most direct, evidenced fix for the sourcing gap already identified in Stickee's own decision/issue content (see `docs/council-reviews/GOVERNMENT_PAGE_DRY_REVIEW.md`).
Evidence level: Established convention (citation-level sourcing is the norm across reference and academic publishing, not just Wikipedia)
Risks: Low, relative to most patterns here — this is close to a pure sourcing improvement rather than a UX pattern with tradeoffs. Main risk is under-resourcing it (adding a citation field without populating it, leaving it as decorative as the current unsourced fields).
What Stickee must not copy: Wikipedia's specific citation template syntax or visual footnote style — the principle (claim-level sourcing) transfers; the specific implementation doesn't need to.
Stickee adaptation: Add a `source`/`sourceUrl`/`retrievedDate` structure to the `Decision` and `Issue` types, and require it be populated (or explicitly marked unverified) at the point a claim is written, not bolted on after.
Affected Stickee domains: `src/types/government.ts`, `src/types` issue types, `/decisions`, `/issues`, MP profile claims
Dependencies: Schema change (Software Architect review); content backfill effort (Product Strategist priority-tier decision)
Smallest experiment: Add the source fields to the type and populate them for a handful of the highest-traffic decision records as a pilot.
Success metrics: Number of decision records with a real, checkable citation, before/after.
Status: Candidate
Owner decision: Whether to prioritize this immediately given it directly addresses an already-documented P1 finding (the dry review referenced above).
Last reviewed: 2026-08-05

## Political Pulse

Origin product: X (pattern only — not the underlying mechanics)
Problem solved: A reader wants a fast sense of "what's happening in politics right now" without following dozens of individual accounts.
Observed behaviour: Real-time aggregation of short updates from many sources into one scannable stream, organized around topics/hashtags a user follows.
Underlying principle: Aggregate many small, timely updates into one place, organized by topic rather than by who posted them.
Why it may work: Matches a genuine information need (staying current) that Stickee's slower-moving decision/issue pages don't serve well today.
Evidence level: Inference (the underlying need for a real-time political update stream is well established by X's scale and by news-aggregator products generally; the *specific* curated, non-algorithmic version Stickee would need has no direct precedent to point to as evidence)
Risks: This is the single highest-risk pattern in this batch — X's actual engagement mechanics (algorithmic ranking, vanity metrics, outrage amplification, anonymous pile-ons, unsupported "trending" signals, repost-driven misinformation spread) are close to the exact opposite of Stickee's mission. Getting the adaptation wrong here is easy.
What Stickee must not copy: Algorithmic engagement ranking, like/retweet/follower counts as a credibility signal, anonymous commentary, unmoderated repost mechanics, or any "Trending" signal without a disclosed, reproducible methodology (directly relevant given `docs/council-reviews/GOVERNMENT_PAGE_DRY_REVIEW.md` already flagged exactly this problem on `/decisions`).
Stickee adaptation: **Correction on inspection — this is not a greenfield pattern.** `/feed` (`src/app/feed/page.tsx`) is already a live, working feature: it calls a real `/api/feed/ranked` endpoint (with an honest `source: 'ranked' | 'mock-fallback'` flag — a good existing example of not silently presenting fallback data as real), supports electorate/topic personalization, and renders `civic_alert` / `leader_update` / `user_post` / `decision_update` post types from `src/lib/mock-feed-data.ts`, with heart/fire/flag reactions gated behind sign-in. A `src/app/feed/page.tsx.bak` sits alongside it — an earlier version, not evidence of an unbuilt feature. The X-inspired "Political Pulse" idea should therefore be reframed entirely as an **evaluation of the existing `/feed`** against this pattern's principles (topic-organized, no vanity-metric ranking, no algorithmic amplification, curated rather than crowd-posted) rather than a proposal to build something new — building a second, parallel feed would be exactly the duplicate-system problem the Software Architect exists to catch.
Affected Stickee domains: `/feed`, `src/lib/mock-feed-data.ts`, `/api/feed/ranked`
Dependencies: None to build — this is now a review-existing-feature task. Requires Software Architect and Product Strategist review of `/feed` before any further investment, plus Legal/Civic Technology review of the reaction/moderation model already in production.
Smallest experiment: Not applicable as an experiment — recommend a full Page Review (or Council review) of the existing `/feed` first, using this pattern's risk list (heart/fire/flag reactions read as vanity metrics; `user_post` type implies user-generated content with a moderation question) as the review's starting checklist.
Success metrics: Not yet measured.
Status: Under review
Owner decision: Whether `/feed` should be reviewed and iterated on now (Tier 3, "unify duplicate systems," per AGENTS.md priority order) rather than treated as a source of net-new feature ideas — this is a release-gate item (major navigation/IA implications) per `docs/STICKEE_COUNCIL.md`.
Last reviewed: 2026-08-05

## Primary-source timeline

Origin product: X
Problem solved: Readers often only see commentary *about* an event, not the original statement, document, or vote itself.
Observed behaviour: Direct links to and quoting of primary-source posts (official accounts, direct statements) appear inline in the timeline rather than only in secondary reporting.
Underlying principle: Put the primary source next to the commentary, not behind it.
Why it may work: Directly supports source transparency and lets readers form their own view before reading interpretation — well aligned with the civic-technology transparency principle.
Evidence level: Established convention (linking directly to primary sources is standard journalistic and reference practice, independent of X specifically)
Risks: Low, if scoped to genuinely primary sources (Hansard, official releases) rather than any social-media post treated as "primary."
What Stickee must not copy: Treating any social-media statement as equally "primary" regardless of who posted it or whether it's been verified — X's discovery mechanism surfaces volume, not necessarily authoritativeness.
Stickee adaptation: On a decision/bill timeline, link each stage directly to the primary record (Hansard entry, official gazette notice, government media release) rather than only to secondary summary text.
Affected Stickee domains: `DecisionCard` timeline component, bill pages
Dependencies: Requires access to or linking against real Hansard/government-record URLs (research needed on availability/API access)
Smallest experiment: Add primary-source links to the timeline of a small number of existing decision records.
Success metrics: Not yet measured.
Status: Candidate
Owner decision: None significant — this is a low-risk sourcing improvement; mainly a resourcing/sequencing question for the Product Strategist.
Last reviewed: 2026-08-05

## Evidence-based public corrections

Origin product: X (community correction culture) and Wikipedia (correction workflow)
Problem solved: Published claims are sometimes wrong, and readers need a visible, trustworthy way to see that a correction happened and why.
Observed behaviour: X surfaces community-sourced context/corrections attached to specific claims; Wikipedia maintains a visible edit/revision history with reasons for each change.
Underlying principle: Make corrections visible and evidenced, rather than silently editing or never correcting at all.
Why it may work: Directly serves the Civic Technology Advisor's "can someone challenge or correct this information" standard, already identified as a gap on `/decisions` in the government-page dry review.
Evidence level: Established convention (correction/errata practices are standard in professional journalism and reference publishing, independent of either origin product)
Risks: X's version of this (crowd-sourced, unmoderated) carries real misinformation risk if copied directly; needs an editorial moderation layer Stickee would have to build and staff.
What Stickee must not copy: Fully unmoderated crowd-sourced corrections — any correction that changes what's displayed to readers needs an editorial review step, not automatic publication.
Stickee adaptation: A visible "Report an error" pathway on content pages (per the required journey #10 in `agents/ux-journey-bottleneck-analyst.md`) feeding an editorially-reviewed correction log, shown on the page once resolved.
Affected Stickee domains: Decision/issue/MP profile pages; new correction-workflow surface (release-gated)
Dependencies: Editorial review capacity/process (currently undocumented); Software Architect review of correction-log data model
Smallest experiment: A simple "Report an error" mailto or form on one page type, manually triaged, before building a full correction-log UI.
Success metrics: Number of corrections submitted and resolved; not yet measured.
Status: Candidate
Owner decision: Whether Stickee has (or will build) the editorial capacity to triage corrections before shipping the pathway that invites them.
Last reviewed: 2026-08-05

## Topic following

Origin product: X
Problem solved: Readers care about specific issues (housing, health) more than about specific people or accounts, but most social platforms organize around who you follow, not what you care about.
Observed behaviour: Users can follow topics/hashtags directly, independent of following any specific account.
Underlying principle: Let users subscribe to a subject, not a personality.
Why it may work: Matches Stickee's own issue-centric structure better than a personality-driven follow model would, and avoids building a politician-popularity mechanic AGENTS.md explicitly warns against.
Evidence level: Established convention (topic/tag following is standard across many content platforms, not X-specific)
Risks: Low in principle; main risk is notification design drifting toward addictive engagement patterns if not deliberately restrained.
What Stickee must not copy: Follower-count/status hierarchy, or notification patterns designed to maximize return visits rather than inform.
Stickee adaptation: Let a signed-in user follow an issue or electorate and see relevant updates on their own terms (e.g. a digest, not a push-notification stream), consistent with the monochrome, calm editorial tone.
Affected Stickee domains: `/issues`, user profile/notifications (`useNotifications` hook already exists — check before building a parallel system, per Software Architect duplication principle)
Dependencies: Existing notification infrastructure review
Smallest experiment: Add "follow this issue" to one issue page backed by the existing notification system, no new infrastructure.
Success metrics: Not yet measured.
Status: Candidate
Owner decision: None significant if built on existing notification infrastructure; owner input needed only on digest cadence/tone.
Last reviewed: 2026-08-05

## Progressive disclosure

Origin product: GOV.UK, Stripe, Linear, Notion, Figma (studied selectively)
Problem solved: Showing all information/complexity at once overwhelms a first-time or infrequent user.
Observed behaviour: Simple default view with a clear path to reveal more detail on demand (GOV.UK's "what this means for you" expandable sections; Stripe/Linear/Notion's layered documentation and settings).
Underlying principle: Default to the minimum a user needs, with an obvious, low-cost way to go deeper.
Why it may work: Directly addresses the UX Researcher's existing finding that `DecisionCard` currently does five things at once at equal visual weight (see the government-page dry review) — this is a fix for an already-identified problem, not a speculative addition.
Evidence level: User-research evidence (progressive disclosure's usability benefit is well studied in HCI literature generally, independent of any single product)
Risks: Very low — this is a widely validated usability principle, not a stylistic borrow. Main risk is under-implementing it (hiding information a user actually needed by default).
What Stickee must not copy: Any SaaS-feeling visual chrome (card shadows, modal-heavy interaction, dashboard widgets) that would make Stickee feel like generic software rather than an editorial product — the *information-hierarchy principle* transfers, the *visual language* must stay within the monochrome/editorial system per AGENTS.md.
Stickee adaptation: Restructure `DecisionCard`'s expanded view so the factual summary/timeline is the default reveal, with prediction/email-MP/simulate actions behind a clearly secondary "Get involved" disclosure — exactly the smallest-fix already recommended in the government-page dry review.
Affected Stickee domains: `DecisionCard`, similar dense components elsewhere
Dependencies: None significant — this is a UI restructuring, not a new data dependency
Smallest experiment: Apply the restructuring to `DecisionCard` on `/decisions` only, and compare qualitatively against the current layout.
Success metrics: Not yet measured; propose a simple task-completion check (UX Researcher's existing proposal in the dry review).
Status: Candidate
Owner decision: None significant — this is one of the lowest-risk, most directly-evidenced patterns in this library and could reasonably be approved for experiment quickly.
Last reviewed: 2026-08-05

## Canonical page revision history

Origin product: Wikipedia
Problem solved: Readers (and editors) can't tell whether a page's content is stable, recently changed, or actively contested.
Observed behaviour: Every page exposes a full revision history with timestamps and edit summaries.
Underlying principle: Make a canonical object's change history part of the object itself, not a separate hidden log.
Why it may work: Directly supports transparency and accountability — if a decision's status or a claim changes, readers should be able to see that it changed and why, rather than the page silently updating.
Evidence level: Established convention (version history is standard in reference publishing and software documentation, independent of Wikipedia specifically)
Risks: Low; mainly an engineering-effort question rather than a mission-fit risk.
What Stickee must not copy: Wikipedia's open, anyone-can-edit revision model — Stickee's content is editorially controlled, so the adaptation is a read-only change log, not an editable history.
Stickee adaptation: A "last updated" + brief change note on canonical political objects (decisions, MP profiles, forecasts) whenever a material fact changes, tied to the Evidence-based public corrections pattern above.
Affected Stickee domains: Decision/issue/MP profile data model
Dependencies: Requires a changelog data structure (Software Architect review); depends on Evidence-based public corrections workflow existing first
Smallest experiment: Manually maintained "last updated" note on a handful of decision records as a pilot, no schema change yet.
Success metrics: Not yet measured.
Status: Candidate
Owner decision: Sequencing relative to the correction-workflow pattern above (natural pairing, not a standalone priority).
Last reviewed: 2026-08-05

## Public contribution and correction workflow

Origin product: GitHub
Problem solved: External contributors and readers need a structured, transparent way to propose changes or flag problems, with visible review and status.
Observed behaviour: Issues, pull requests, and status checks give every proposed change a visible lifecycle (open → reviewed → merged/closed) that anyone can follow.
Underlying principle: Make the review process itself visible and structured, not just the eventual outcome.
Why it may work: Directly serves both the Open-Source Maintainer's contributor-readiness mandate and the Civic Technology Advisor's correction-pathway mandate — this pattern serves two existing council concerns at once.
Evidence level: Observed pattern (GitHub's own workflow is directly observable and extremely widely adopted for code; the specific extension to *editorial content corrections* rather than code is this review's inference, not a directly observed precedent)
Risks: A public issue tracker for political-content corrections could itself become a venue for bad-faith political argument if unmoderated.
What Stickee must not copy: Fully open, unmoderated public commentary on politically sensitive corrections — needs the same editorial moderation layer noted under Evidence-based public corrections.
Stickee adaptation: For code contributions, adopt GitHub's issue/PR/review model largely as-is (already partially true of this repository). For content corrections, adapt the *lifecycle visibility* principle (submitted → under review → resolved, with a public status) without necessarily using GitHub Issues for politically sensitive claims.
Affected Stickee domains: Repository contributor workflow (`.github/`, `docs/audits/OPEN_SOURCE_READINESS.md`); potential content-correction surface
Dependencies: Open-Source Maintainer review of current `.github/` setup; Legal/Civic Technology review before any content-facing version
Smallest experiment: For the code side, ensure issue/PR templates exist and are used (Open-Source Maintainer's existing mandate); for content, pilot a simple status-visible correction log manually before building tooling.
Success metrics: Not yet measured.
Status: Candidate
Owner decision: Whether the content-correction variant should reuse GitHub Issues, a separate lightweight system, or wait until correction volume justifies either.
Last reviewed: 2026-08-05
