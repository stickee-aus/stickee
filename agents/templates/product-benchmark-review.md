# Template — Product Benchmark Review

Use when studying proven products to solve a specific Stickee user problem, before or alongside a Feature Review. See [agents/README.md](../README.md) for how to invoke agents, and [docs/PRODUCT_BENCHMARKING_METHOD.md](../../docs/PRODUCT_BENCHMARKING_METHOD.md) for the full research methodology.

Agents typically involved: **Product Intelligence & Benchmarking Advisor** (lead), **Product Strategist** (priority/timing), **Public Policy Advisor** and **Editorial Advisor** (if the pattern touches political framing or sourcing), **Civic Technology Advisor** (if it touches participation/accessibility), **Legal Advisor** (if it touches copyright, privacy, or gambling-adjacent risk), **Software Architect** (feasibility), **Council Chair**.

This template produces recommendations only. It never authorises implementation — see the Implementation boundaries in `agents/README.md`.

---

## Input

```
User problem or product area under study: <the Stickee problem — not "copy product X"; frame it as the user need>
Products considered: <from the benchmark set in docs/PRODUCT_BENCHMARKING_METHOD.md, or a proposed addition with rationale>
Evidence gathered: <public documentation, observed public behaviour, cited user research — list what was consulted and when>
Restricted access note: confirm no authenticated, paywalled, or scraped-restricted content was used
```

## Output

### Patterns identified

No more than 10 high-value patterns per review (per `docs/PRODUCT_BENCHMARKING_METHOD.md`'s guidance against over-collecting). Each pattern uses the full scorecard from [agents/product-intelligence-benchmarking-advisor.md](../product-intelligence-benchmarking-advisor.md):

```
Pattern name:
Origin product:
User problem:
Observed implementation:
Why it may work:
Evidence level:
Sources used:
Risks:
What not to copy:
Stickee adaptation:
Mission fit:
Trust impact:
Accessibility impact:
Legal/editorial concerns:
Technical complexity:
Dependencies:
Smallest experiment:
Success metrics:
Recommended decision: Adopt / Adapt / Experiment first / Defer / Reject / Requires professional review
Priority:
Owner approval required?:
```

### Relevant council reviewers per pattern

For each pattern, name which other council agents must independently review the adaptation before it proceeds past "Experiment first" (e.g. a Ground News-style comparison pattern needs Public Policy + Editorial; a Kalshi-style resolution-criteria pattern needs Public Policy + Legal + Software Architect).

### Rejected or constrained patterns

Patterns explicitly considered and rejected, or accepted only with a "what not to copy" constraint — recorded here even when the answer is no, so the reasoning is preserved in `docs/PRODUCT_PATTERN_LIBRARY.md` rather than lost.

### Council Chair synthesis

Using `agents/templates/council-summary.md`, with the Product Intelligence & Benchmarking Advisor's findings treated as one recommendation among several inputs — never as authority on its own. The Chair decides among: experiment / reject / adapt with conditions / defer / proceed to implementation planning (see `agents/council-chair.md`).

### Pattern library update

Every pattern reviewed — adopted, experimental, deferred, or rejected — gets an entry or status update in `docs/PRODUCT_PATTERN_LIBRARY.md`. This step is not optional; it's what makes the library durable rather than a one-off memo.
