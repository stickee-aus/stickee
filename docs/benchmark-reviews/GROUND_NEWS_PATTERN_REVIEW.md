# Benchmark Pattern Review — Ground News

Documentation-only review by the **Product Intelligence & Benchmarking Advisor**, using the [Product Benchmark Review](../../agents/templates/product-benchmark-review.md) template and the standards in [docs/PRODUCT_BENCHMARKING_METHOD.md](../PRODUCT_BENCHMARKING_METHOD.md). No application code was changed to produce this review.

## Input

```
User problem or product area under study: How should Stickee help a reader see
  more than one account of a government decision or political event, without
  Stickee itself becoming the arbiter of which account is correct?
Products considered: Ground News (public-facing product pages and published
  methodology descriptions)
Evidence gathered: Publicly observable story-comparison pages and Ground News'
  own published methodology explanations for its bias/factuality ratings.
  No authenticated account or scraped content was used.
Restricted access note: Confirmed — no scraping, no authenticated access.
```

Ground News' single biggest risk for Stickee is its bias/ideology labelling system — a third-party methodology Stickee has no relationship with, cannot independently verify, and which sits close to the "unsupported ideological labelling" and "opaque scoring" AGENTS.md and the Public Policy Advisor explicitly warn against. Every pattern below is assessed with that risk foregrounded, not treated as a footnote.

---

## 1. Multi-source story aggregation

Problem solved: A reader sees one outlet's account of an event and has no easy way to compare it with how other outlets covered the same thing.
Observed implementation: A single story page lists multiple outlets' coverage of the same underlying event, with headline and outlet shown for each.
Transferability to Stickee: High as a principle — directly serves source transparency and the "one source of truth is not the same as one *perspective* on a decision" distinction Stickee needs for its Decisions/Issues content.
Risks: Requires either linking out (low legal risk, lower content control) or excerpting (higher legal risk, needs fair-use scoping) — a real content pipeline decision, not just a UI one.
What not to copy: Presenting the aggregation itself as neutral when the *selection* of which outlets to include is itself an editorial choice that needs disclosure.
Recommended adaptation: For a Stickee decision/issue page, show official government statement, parliamentary record, journalism coverage, and expert analysis side by side — see `Source comparison` in `docs/PRODUCT_PATTERN_LIBRARY.md`.
Smallest experiment: Manually build one comparison view for a single already-covered decision.
Relevant council reviewers: Editorial Advisor, Public Policy Advisor, Legal Advisor (excerpting/redistribution rights).
Decision recommendation: **Experiment first**

## 2. Bias/ideology labelling (reject)

Problem solved: N/A — exclusion pattern, though the underlying reader need (understanding a source's likely perspective) is real.
Observed implementation: Outlets are tagged with a left/centre/right-style label and a numeric "factuality" score, sourced from a third-party ratings methodology.
Transferability to Stickee: None, as executed. This is the clearest example in this whole benchmark set of a pattern that fails the mission filter outright: AGENTS.md explicitly prohibits inventing or displaying agreement/scoring claims without a transparent, reproducible methodology Stickee itself controls and can defend, and the Public Policy Advisor's mandate specifically excludes "unsupported ideological labelling."
Risks: Reproducing a third-party ideological label Stickee didn't produce and can't fully verify would be presenting someone else's contested judgement as if it were Stickee's own neutral fact — a direct Editorial and Public Policy P0.
What not to copy: The left/centre/right tag, the numeric factuality score, and any implication that political position is a single-axis, objectively measurable quantity.
Recommended adaptation: None as a labelling system. If source-type context is needed, use only objectively verifiable metadata (see pattern #3) rather than an ideological score.
Smallest experiment: Not applicable.
Relevant council reviewers: Public Policy Advisor (mandatory), Legal Advisor, Editorial Advisor.
Decision recommendation: **Reject**

## 3. Source metadata (ownership, type, publication date)

Problem solved: A reader can better judge a source's likely perspective from objectively verifiable facts (who owns it, what kind of source it is, when it was published) without needing a subjective ideology score.
Observed implementation: Each outlet listed carries ownership information and publication metadata alongside its story.
Transferability to Stickee: High — this is the safe, evidenced alternative to pattern #2. Ownership and publication-type are checkable facts, not editorial judgements.
Risks: Low, provided the metadata is sourced and kept current (ownership changes).
What not to copy: Bundling this factual metadata with the ideological score from pattern #2 as if they were the same kind of information.
Recommended adaptation: Show source type (official record / journalism / expert analysis / opinion), publication date, and retrieval date on every cited source — this maps directly onto AGENTS.md's existing evidence-classification requirement.
Smallest experiment: Add this metadata to citations on one pilot decision page (paired with the `Citation-first claim presentation` pattern).
Relevant council reviewers: Editorial Advisor, Civic Technology Advisor.
Decision recommendation: **Adapt**

## 4. Blindspot detection

Problem solved: Readers don't know what they're not seeing — stories under-covered relative to their likely information diet.
Observed implementation: Stories with lopsided coverage patterns (heavily covered by one side of Ground News' own left/right classification, under-covered by the other) are flagged as a "blindspot."
Transferability to Stickee: Low as directly implemented, because it depends entirely on the ideology classification rejected in pattern #2 — you can't detect a left/right blindspot without a left/right axis.
Risks: Re-introduces the same unsupported-labelling problem by the back door if implemented literally.
What not to copy: Any personalized "your blindspot" framing implying knowledge of an individual reader's media habits Stickee doesn't have, and any framing that depends on the rejected ideology axis.
Recommended adaptation: A depersonalized, non-ideological "missing context" note describing what a shown set of sources does and doesn't cover on a given decision (e.g. "of the sources here, none address the impact on renters specifically") — see `Blindspot or missing-context identification` in the pattern library.
Smallest experiment: A manually written missing-context note on one decision page.
Relevant council reviewers: Public Policy Advisor (mandatory), Editorial Advisor.
Decision recommendation: **Experiment first**

## 5. Methodology disclosure

Problem solved: A reader who wants to know *how* Ground News decided something (its ratings, its blindspot detection) can read a stated methodology.
Observed implementation: A public methodology page explains the rating process, even though the underlying inputs remain a third-party's proprietary process.
Transferability to Stickee: High as a general practice — Stickee should disclose methodology for anything it classifies or scores, independent of whether it adopts any Ground-News-specific classification.
Risks: Low. The risk is not in disclosing methodology, but in disclosing a methodology that, once stated plainly, turns out not to be reproducible or well-founded (the actual test AGENTS.md sets).
What not to copy: Publishing a methodology page as a trust signal while the underlying classification (e.g. "Trending" on `/decisions`, already flagged as unexplained in the government-page dry review) still has no real method behind it — disclosure only works if there's something real to disclose.
Recommended adaptation: Write and publish a plain methodology explanation for any existing or new Stickee classification (starting with "Trending"/"Controversial" flags already identified as a gap).
Smallest experiment: Draft a methodology note for the existing "Trending" flag on `/decisions`, or remove the flag if no real methodology can be stated.
Relevant council reviewers: Product Strategist, Editorial Advisor, Public Policy Advisor.
Decision recommendation: **Adapt**

## 6. Framing comparison (headline wording differences)

Problem solved: Even sources that agree on facts differ in emphasis and word choice, shaping perception in ways readers may not notice.
Observed implementation: Side-by-side or highlighted differences in how outlets headlined the same event.
Transferability to Stickee: Moderate — genuinely useful for media literacy, but the selection of which framing differences to highlight is itself an editorial act that needs a disclosed method.
Risks: Could look evaluative ("outlet A is spinning this") even when only trying to be descriptive.
What not to copy: Any implied ranking of which framing is more "biased" or more "correct."
Recommended adaptation: A purely descriptive "described elsewhere" panel with verbatim, attributed excerpts and no ranking — see `Framing comparison` in the pattern library.
Smallest experiment: Add 2–3 manually curated excerpts to one existing issue page.
Relevant council reviewers: Editorial Advisor, Legal Advisor (excerpt length/fair use), Public Policy Advisor.
Decision recommendation: **Experiment first**

## 7. "My News Bias" personalized feed framing (reject)

Problem solved: N/A — exclusion pattern.
Observed implementation: A personalized view showing a reader their own aggregate "bias" based on reading history.
Transferability to Stickee: None — depends entirely on the rejected ideology axis (pattern #2), and additionally requires tracking individual reading behaviour in a way that raises its own privacy questions.
Risks: Combines the ideology-labelling problem with a privacy/data-collection problem (tracking and characterising an individual's political reading habits) — a clear Legal Advisor escalation territory ("personal political opinion or affiliation being inferred... about an identifiable person").
What not to copy: Any feature that infers or displays an individual user's presumed political leaning from their reading behaviour.
Recommended adaptation: None.
Smallest experiment: Not applicable.
Relevant council reviewers: Legal Advisor (mandatory), Public Policy Advisor.
Decision recommendation: **Reject**

---

## Summary

Seven patterns reviewed (within the 10-pattern cap). The central lesson from Ground News is a sharp split: its **labelling/scoring mechanics** (bias axis, blindspot detection built on that axis, personalized bias tracking) fail Stickee's mission filter outright and are rejected, while its **transparency mechanics** (multi-source aggregation, objective source metadata, published methodology) are strong, well-evidenced candidates that map directly onto gaps Stickee's own council reviews have already found (unsourced decisions, unexplained "Trending" flags). None reach "Adopt" in this documentation-only pass — Public Policy, Editorial, and Legal review are named as mandatory next steps on every non-rejected pattern here, reflecting how directly this product touches political framing.
