# Benchmark Pattern Review — X

Documentation-only review by the **Product Intelligence & Benchmarking Advisor**, using the [Product Benchmark Review](../../agents/templates/product-benchmark-review.md) template and the standards in [docs/PRODUCT_BENCHMARKING_METHOD.md](../PRODUCT_BENCHMARKING_METHOD.md). No application code was changed to produce this review.

## Input

```
User problem or product area under study: How should Stickee give readers a fast,
  trustworthy sense of "what's happening in politics right now"?
Products considered: X (publicly observable product behaviour and published
  platform documentation; no authenticated scraping)
Evidence gathered: Public-facing timeline/discovery behaviour as generally
  observable, plus a check of Stickee's own existing codebase for anything
  already solving this problem (see finding below).
Restricted access note: Confirmed — no scraping, no authenticated access to X.
```

**Material finding before pattern analysis:** Stickee already has a live, working feature answering this exact problem — `/feed` (`src/app/feed/page.tsx`), backed by a real `/api/feed/ranked` endpoint (with an honest `source: 'ranked' | 'mock-fallback'` flag), `src/lib/mock-feed-data.ts` post types (`civic_alert`, `leader_update`, `user_post`, `decision_update`), heart/fire/flag reactions gated behind sign-in, and electorate/topic personalization via stored preferences. A `page.tsx.bak` alongside it is an earlier version, not evidence this is unbuilt. Per the Software Architect's "does this already exist" principle, this review is reframed: instead of proposing a new "Political Pulse," each X pattern below is assessed **against the existing `/feed` implementation**, to identify what it already does well, what it should not add, and what gaps (if any) remain — a Page Review of `/feed` by the full council is the concrete next step this review recommends, not a new build.

---

## 1. Real-time, topic-organized information flow

Problem solved: A reader wants current political information without following dozens of individual accounts one by one.
Observed implementation (X): Real-time aggregation into a scannable timeline, discoverable by topic/hashtag rather than only by who posted.
Status in Stickee: Partially present — `/feed` aggregates multiple post types into one stream and supports an "electorate"/"my-electorate" filter and topic preferences, but its `FilterId` set (`all` / `community` / `leaders` / `my-electorate`) is organized more by *source type* than by *topic* — closer to "who posted" than X's topic-first model.
Risks: None significant in the current implementation; the gap is a possible enhancement, not a correctness problem.
What not to copy: Algorithmic engagement-maximizing ranking — the `source: 'ranked'` field should be reviewed to confirm what "ranked" means today and that it isn't optimizing for engagement over relevance (Software Architect + Product Strategist to verify, not assumed either way by this review).
Recommended adaptation: Consider adding a genuine topic-filter dimension (e.g. filter by issue, not just by post-source-type) to `/feed`'s existing filter bar, as an incremental improvement rather than a new feed.
Smallest experiment: Add one topic-based filter chip to the existing filter bar and observe usage.
Relevant council reviewers: Software Architect (confirm ranking logic), UX Researcher.
Decision recommendation: **Adapt**

## 2. Vanity-metric reactions (heart / fire / flag)

Problem solved: N/A directly — engagement-signalling is the pattern under scrutiny, not a problem Stickee needs solved.
Observed implementation: X's like/repost counts function as a popularity signal, often read by users as a proxy for a post's credibility or importance.
Status in Stickee: **Already present and already a risk.** `/feed`'s heart/fire/flag reaction counts in `mock-feed-data.ts` are hardcoded per post (e.g. a `leader_update` shown with `{ heart: 892, fire: 341, flag: 3 }`) — this is the same fabricated-engagement-signal pattern the government-page dry review already flagged as a P0 for `/decisions`' likes/dislikes bar. This is not a hypothetical risk to guard against when building something new; it is a live finding about an existing page.
Risks: Presenting fabricated reaction counts as real community sentiment is a direct AGENTS.md truthfulness violation, independent of anything to do with X specifically.
What not to copy: Treating reaction counts as a popularity-equals-importance signal; keeping any hardcoded/mock counts live without a demo label.
Recommended adaptation: This is not a "don't copy X" instruction — it's a "fix an existing Stickee page" finding. Recommend an immediate Content/Page Review of `/feed`'s reaction counts by the Editorial Advisor and Product Strategist, following the same remediation path already specified for `/decisions` in `docs/council-reviews/GOVERNMENT_PAGE_DRY_REVIEW.md` (label as demo, or back with real counts, before any further promotion of the page).
Smallest experiment: Not an experiment — a correction. Add a "demo data" disclosure or replace with real counts (zero, if no real reactions have occurred yet) before this page receives more traffic.
Relevant council reviewers: Editorial Advisor (mandatory), Product Strategist, UX Journey and Bottleneck Analyst.
Decision recommendation: **Reject** (of the current mock-count presentation, as-is) / flagged for urgent remediation, not a benchmarking "adopt/adapt" question at all

## 3. Primary-source discovery

Problem solved: Readers often see commentary about an event before (or instead of) the original statement or document.
Observed implementation: Direct links to and quoting of primary-source posts appear inline alongside commentary.
Status in Stickee: Not clearly present — `/feed`'s post types (`civic_alert`, `leader_update`, `decision_update`, `user_post`) don't obviously distinguish a primary-source link (e.g. a direct Hansard/gazette reference) from secondary commentary, based on the fields inspected.
Risks: Low to adopt; omission risk (missing an opportunity to strengthen sourcing) rather than a risk of harm.
What not to copy: Treating any social-media post as "primary" regardless of who posted it or whether it's verified.
Recommended adaptation: Add an optional primary-source link field to `decision_update`/`civic_alert` post types where a genuine primary record exists. See `Primary-source timeline` in `docs/PRODUCT_PATTERN_LIBRARY.md`.
Smallest experiment: Add a primary-source link to a handful of existing `decision_update` posts.
Relevant council reviewers: Editorial Advisor, Software Architect (schema change).
Decision recommendation: **Adapt**

## 4. Topic following (subscribe to a subject, not a person)

Problem solved: Readers often care more about an issue than about any specific account discussing it.
Observed implementation: Users follow topics/hashtags directly.
Status in Stickee: Partially present — `/feed` already reads a stored `topIssues` preference (`loadUserPrefs`) to personalize the ranked feed request, which is functionally topic-following, just not exposed as an explicit "follow this issue" UI action on issue pages themselves.
Risks: Low.
What not to copy: Follower-count/status hierarchy for the people/leaders being followed.
Recommended adaptation: Surface an explicit "follow this issue" control on `/issues` pages that writes to the same `topIssues` preference `/feed` already reads — reusing existing plumbing rather than building parallel infrastructure.
Smallest experiment: Add the follow control to one issue page.
Relevant council reviewers: Software Architect (confirm reuse, not duplication), UX Researcher.
Decision recommendation: **Adapt**

## 5. Public corrections / community notes

Problem solved: Published claims are sometimes wrong; readers need a visible, evidenced way to see that a correction happened.
Observed implementation: Crowd-sourced context notes attached to specific posts, shown publicly once a consensus process approves them.
Status in Stickee: Not present in `/feed` or elsewhere, as far as evidence gathered shows — this is a genuine gap, not an existing feature to fix.
Risks: X's version is unmoderated-by-default (relies on a crowd algorithm); copying that directly risks the same misinformation-amplification failure mode it's meant to solve.
What not to copy: Fully unmoderated, crowd-approved corrections applied to political content without editorial review.
Recommended adaptation: An editorially-reviewed correction pathway (see `Evidence-based public corrections` in the pattern library) — visible status, not unmoderated crowd consensus.
Smallest experiment: A simple "report an error" pathway on one content type, manually triaged.
Relevant council reviewers: Civic Technology Advisor (mandatory), Legal Advisor, Editorial Advisor.
Decision recommendation: **Experiment first**

## 6. Algorithmic engagement ranking (reject)

Problem solved: N/A — exclusion pattern.
Observed implementation: Content ranking optimized for engagement/watch-time rather than chronological or relevance order.
Status in Stickee: Uncertain — `/feed` has a `source: 'ranked'` state whose actual ranking logic was not inspected as part of this documentation-only review (the API implementation was out of scope here). This is flagged as **requires further Software Architect review**, not resolved either way by this review.
Risks: If `ranked` does optimize for engagement rather than relevance/recency/civic importance, it would conflict with the mission filter regardless of how well it performs.
What not to copy: Engagement-time or click-through optimization as a ranking objective for civic content.
Recommended adaptation: Software Architect to document what `/api/feed/ranked` actually optimizes for; if it's engagement-based, adapt it toward relevance/recency/civic-importance criteria instead.
Smallest experiment: Not applicable until the existing logic is documented.
Relevant council reviewers: Software Architect (mandatory, first), Product Strategist.
Decision recommendation: **Requires professional review** (internally — an architecture/product investigation, not an external legal one, but this agent cannot resolve it without seeing the ranking implementation)

## 7. Anonymous pile-ons and unsupported trending signals (reject)

Problem solved: N/A — exclusion pattern.
Observed implementation: Trending topics/hashtags surfaced with no disclosed methodology, and anonymous, unmoderated dogpiling on individuals.
Status in Stickee: No direct equivalent found in `/feed`, but `/decisions`' unexplained "Trending" flag (already a P1 finding in the government-page dry review) is the same underlying failure mode — a signal shown with no disclosed method.
Risks: Same truthfulness/trust risk already documented elsewhere in this Council's work.
What not to copy: Any "trending" or "hot" signal without a stated, reproducible method; any feature enabling anonymous, targeted commentary on named individuals.
Recommended adaptation: None new — this reinforces the existing recommendation (see the pattern library's methodology-disclosure guidance) to either explain or remove the `/decisions` "Trending" flag; no anonymous-commentary feature should be built at all.
Smallest experiment: Not applicable.
Relevant council reviewers: Public Policy Advisor, Editorial Advisor, Legal Advisor.
Decision recommendation: **Reject**

---

## Summary

Seven patterns reviewed (within the 10-pattern cap). The most important outcome of this review is procedural: X's core "real-time political pulse" problem is **already solved, in production, by `/feed`** — the review correctly did not recommend building a second, parallel system, in line with the Software Architect's duplication-first principle. Within the existing `/feed` implementation, one pattern (hardcoded heart/fire/flag reaction counts) is flagged as an urgent existing-page correction, not a benchmarking question at all — it's the same fabricated-engagement-signal problem already documented for `/decisions`. Two patterns are explicit rejects (algorithmic engagement optimization pending investigation, anonymous/unsupported trending). The remaining candidates (topic following, primary-source links, evidence-based corrections) are incremental, low-risk extensions of infrastructure that already exists, not new builds.

**Recommended immediate next step:** a full council Page Review of `/feed` itself (Software Architect, Product Strategist, Editorial Advisor, UX Journey and Bottleneck Analyst at minimum) — this benchmark review surfaced enough live findings that `/feed` warrants the same scrutiny `/decisions` already received, independent of any new X-inspired feature work.
