# Product Intelligence & Benchmarking Advisor — Build Report

Task: extend the Stickee Council with an eleventh specialist agent — the **Product Intelligence & Benchmarking Advisor** — governed throughout by [AGENTS.md](AGENTS.md). This report covers what was created, what was updated, the initial benchmark exercise, and confirmation of scope boundaries.

## 1. New agent created

`agents/product-intelligence-benchmarking-advisor.md` — full mandate following the same structure as the existing ten agents: mandate, areas reviewed, the benchmark set (Kalshi, Ground News, X, Wikipedia, GOV.UK, The Economist, Financial Times, Bloomberg, GitHub, Stripe, Apple, Linear, Notion, Figma, Google Maps, Duolingo), standard questions, the ten-step responsibility process, Stickee's mission filter, evidence standards, hard boundaries against cloning interfaces/copying proprietary wording/reproducing copyrighted designs/scraping restricted systems, the Pattern Evaluation Scorecard as its required output format, its own recommendation-label model (Adopt / Adapt / Experiment first / Defer / Reject / Requires professional review) in place of P0–P3, approval criteria, escalation rules, and interaction rules with the other ten agents.

`agents/templates/product-benchmark-review.md` — the new review-mode template, listing typical reviewers, the input format, the per-pattern scorecard output (max 10 patterns), relevant-reviewer routing, Council Chair synthesis, and the mandatory pattern-library update step.

## 2. Files updated

- **`agents/README.md`** — agent count updated to eleven throughout; new agent added to the roster table, "what the Council cannot replace" list, full-council invocation count, example prompts, review-modes table (new Product Benchmark Review row), a new "when a Product Benchmark Review is required" release-gate section, evidence-you-should-provide guidance, and a note on the two agents (Legal, Benchmarking) that use their own recommendation labels instead of P0–P3.
- **`docs/STICKEE_COUNCIL.md`** — new agent added to the roles table; a new decision-rights row (adoption decisions are never the Benchmarking Advisor's alone); two new cross-cutting escalation rules (copyright/imitation-risk patterns escalate to Legal before adaptation work; sub-"established convention" evidence never earns stronger than "Experiment first"); the approval matrix and severity-matrix sections extended with the Product Benchmarking row/label set; the professional-review-boundaries list extended; a new **Release-gate recommendations** section listing the eight feature types that require this agent plus the four change types that don't; and a fourth worked sample review ("Product Benchmark — Experiment first") demonstrating a case where the Chair does not let a favourable Benchmarking verdict override an unresolved Public Policy condition.
- **`agents/council-chair.md`** — agent count updated to ten specialists; a new **"Reviewing Product Intelligence & Benchmarking Advisor findings"** section with the seven required Chair questions from the brief and the five benchmarking-specific synthesis outcomes (Experiment / Reject / Adapt with conditions / Defer / Proceed to implementation planning); approval matrix extended; boundaries and escalation rules extended so a Benchmarking "Reject" is treated as blocking-equivalent to a P0 and an "Adopt"/"Adapt" never skips standard council review.
- **`agents/templates/council-summary.md`** — review-mode list and approval matrix extended to include Product Benchmark Review and the Product Benchmarking row.
- **`docs/AGENT_AUTOMATION_ROADMAP.md`** — a new, separate proposed (not implemented) workflow for automating product-benchmark research, explicitly flagged as higher-caution than the existing PR-automation proposal (scraping/ToS risk, copyright/imitation risk, evidence-classification blur), with its own phased rollout gated on owner approval at every phase.

No other existing agent file, template, or document was modified.

## 3. New agent's mandate (summary)

Study proven products as sources of transferable *patterns*, not templates to reproduce; separate the underlying user problem and mechanism from a product's specific execution; score every pattern against Stickee's eight-point mission filter (helps Australians understand politics, explains government/Parliament clearly, improves source transparency, distinguishes fact/analysis/opinion/forecast, eases navigation, builds trust, supports civic participation, avoids gambling/crypto/outrage/addictive/partisan design); and recommend adaptation, never copying — with hard, non-negotiable boundaries against cloning interfaces, copying proprietary wording, reproducing copyrighted designs, and scraping restricted systems. Its findings are explicitly recommendations to the Council, never authority — an "Adopt" verdict never bypasses the standard Feature Review / Architecture Review process or owner approval.

## 4. Benchmarking methodology

`docs/PRODUCT_BENCHMARKING_METHOD.md` defines: purpose, research standards (public sources only, no scraping of restricted systems, cite what was consulted, describe rather than reproduce), copyright/imitation boundaries (deferring final legal judgement to the existing Legal Advisor), the seven-level evidence classification (Observed pattern → Public documentation → User-research evidence → Established convention → Plausible benefit → Inference → Unverified assumption), product-selection criteria for extending the benchmark set, the ten-step review lifecycle, experiment design principles (smallest testable version, pre-defined success metrics, reversibility, time-boxing), how approved patterns enter the roadmap (via the normal Feature Review process, not a shortcut), how rejected patterns stay on record rather than being deleted, and five concrete guards against cargo-cult copying.

## 5. Initial product reviews

Three documentation-only reviews created in `docs/benchmark-reviews/`, each capped at the requested maximum of 10 patterns and each independently researched from public product behaviour and documentation only (no scraping, no authenticated access):

- **`KALSHI_PATTERN_REVIEW.md`** — 8 patterns. Two explicit rejects (trading-floor aesthetics, urgency/closing-soon pressure) on mission-fit grounds. Notably, inspecting Stickee's own code found that the "probability history chart" and "resolves-by" lifecycle patterns **already exist** (`FeaturedMarketCard.tsx`'s `ProbabilityHistoryChart`, `mock-market-data.ts`'s `history` arrays) — the real gap is a missing truthfulness disclosure on existing mock data, not new construction. No pattern reached "Adopt."
- **`GROUND_NEWS_PATTERN_REVIEW.md`** — 7 patterns. Sharp split between rejected labelling/scoring mechanics (bias/ideology axis, blindspot detection built on that axis, personalized bias tracking — all fail the mission filter and duplicate the "unsupported ideological labelling" AGENTS.md explicitly warns against) and strong transparency mechanics (multi-source aggregation, objective source metadata, published methodology) that map directly onto sourcing gaps already documented elsewhere in this Council's work.
- **`X_PATTERN_REVIEW.md`** — 7 patterns. The most significant finding in this entire exercise: **Stickee already has a live "Political Pulse"-equivalent feature at `/feed`**, with a real ranking API, personalization, and reactions — so this review correctly reframed itself around auditing and incrementally improving that existing feature rather than proposing a new one. It also surfaced that `/feed`'s hardcoded heart/fire/flag reaction counts are the same fabricated-engagement-signal problem already flagged as a P0 on `/decisions`, and flagged the `/api/feed/ranked` "ranked" logic as needing Software Architect investigation before its ranking criteria can be trusted.

## 6. Initial pattern library entries

`docs/PRODUCT_PATTERN_LIBRARY.md` created with all 14 requested candidate entries (Question-centric forecast page, Transparent resolution criteria, Probability history with methodology, Source comparison, Framing comparison, Blindspot or missing-context identification, Citation-first claim presentation, Political Pulse, Primary-source timeline, Evidence-based public corrections, Topic following, Progressive disclosure, Canonical page revision history, Public contribution and correction workflow), each using the full required structure (origin product, problem solved, observed behaviour, underlying principle, why it may work, evidence level, risks, what Stickee must not copy, Stickee adaptation, affected domains, dependencies, smallest experiment, success metrics, status, owner decision, last reviewed).

Per the brief, **no entry is marked Adopted** — 12 are `Candidate`, and 2 (Political Pulse, Probability history with methodology) were upgraded to `Under review` after codebase inspection revealed they weren't greenfield proposals but findings about existing features requiring correction rather than new experiments.

## 7. Most promising patterns for Stickee

1. **Citation-first claim presentation** (Wikipedia) — directly and cheaply addresses the already-documented P1 sourcing gap on `/decisions`; lowest risk, clearest mission-fit, no new UI required.
2. **Progressive disclosure** (GOV.UK/Stripe/Linear/Notion/Figma, applied selectively) — directly fixes the already-documented `DecisionCard` density problem from the government-page dry review; validated by general HCI research, not just borrowed from one product.
3. **Source metadata + methodology disclosure** (Ground News, minus its ideology axis) — a safe, evidenced way to add source transparency without the labelling risk that makes the rest of Ground News' model unsuitable.
4. **Transparent resolution criteria** (Kalshi, adapted) — strong principle, but explicitly gated on per-forecast Public Policy review given genuine political-event ambiguity.

## 8. Patterns explicitly rejected or constrained

- Kalshi's **trading-floor visual language** and **urgency/closing-soon pressure** — direct conflicts with AGENTS.md's monochrome-editorial identity and anti-gambling-framing principles.
- Ground News' **bias/ideology labelling**, the **blindspot detection built on it**, and **personalized "my bias" tracking** — fail the mission filter outright and would reproduce a third-party, unverifiable ideological score, exactly what AGENTS.md and the Public Policy Advisor prohibit.
- X's **algorithmic engagement-ranking** (flagged pending Software Architect investigation of the existing `/feed` ranking logic, not cleared either way) and **anonymous/unsupported trending signals**.
- X's **vanity-metric reaction counts** — not really a "reject a foreign pattern" finding at all: it's a live finding that `/feed` already has this problem today, same as `/decisions`.

## 9. Recommended first experiment

**Add source/methodology disclosure fields and populate them for a small pilot set of decisions and one forecast card**, combining the Citation-first claim presentation and Probability-history-methodology patterns. This is recommended over any of the more novel patterns because: it directly closes an already-documented P1 (not a new hypothesis), requires no new UI component, needs no new infrastructure beyond a schema field, and can be scoped to a handful of records as a true "smallest experiment" per `docs/PRODUCT_BENCHMARKING_METHOD.md`. Runner-up: a Council Page Review of the existing `/feed` (Software Architect, Product Strategist, Editorial Advisor, UX Journey and Bottleneck Analyst), since the X benchmark review surfaced live findings serious enough to warrant the same scrutiny `/decisions` already received.

Both of these are recommendations for the owner to approve — this report does not constitute that approval, and no implementation work has begun.

## 10. Files changed

**Created:**
- `agents/product-intelligence-benchmarking-advisor.md`
- `agents/templates/product-benchmark-review.md`
- `docs/PRODUCT_BENCHMARKING_METHOD.md`
- `docs/PRODUCT_PATTERN_LIBRARY.md`
- `docs/benchmark-reviews/KALSHI_PATTERN_REVIEW.md`
- `docs/benchmark-reviews/GROUND_NEWS_PATTERN_REVIEW.md`
- `docs/benchmark-reviews/X_PATTERN_REVIEW.md`
- `PRODUCT_INTELLIGENCE_AGENT_BUILD_REPORT.md` (this file)

**Updated:**
- `agents/README.md`
- `docs/STICKEE_COUNCIL.md`
- `agents/council-chair.md`
- `agents/templates/council-summary.md`
- `docs/AGENT_AUTOMATION_ROADMAP.md`

**Not touched:** every other file in the repository, including all files already modified or untracked before this task began (verified via `git status` at both the start and end of this task — the pre-existing page-refactor work, batch reports, `src/lib/navigation.ts`, and the earlier Council build's own files are all unchanged).

## 11. Limitations

- This is documentation and process guidance, not software — nothing here enforces that the Benchmarking Advisor is actually consulted before a relevant feature is built; that depends on the release-gate discipline documented in `docs/STICKEE_COUNCIL.md` being followed.
- The three benchmark reviews were produced from general knowledge of each product's publicly observable behaviour and widely published design conventions, consistent with the "public sources only, no scraping" research standard — they were not produced by live-browsing each product during this session. Where a specific claim would benefit from a fresher, directly-cited public source, that's noted via the evidence-level labelling (most claims sit at "Established convention" or "Public documentation," not the stronger "User-research evidence" level) rather than overstated.
- The `/feed` and `FeaturedMarketCard`/`mock-market-data.ts` findings are based on reading the current source directly (cited by file/line in the relevant reviews) — this is real, verified evidence, but a full Page Review of `/feed` (recommended above) has not been performed; the benchmark reviews flag it as a next step rather than substituting for it.
- No pattern in this build has been reviewed by the Public Policy, Editorial, Civic Technology, or Legal Advisors — those are named as required next steps throughout, not completed here. This build creates the agent and its research; it does not run the multi-agent council synthesis on any specific pattern.

## 12. Professional and copyright boundaries

Restated per the brief: the Product Intelligence & Benchmarking Advisor is not a UX researcher running primary studies on Stickee's own users, and not a copyright lawyer. It never clones interfaces, copies proprietary wording, reproduces copyrighted designs, or scrapes restricted/authenticated systems — these are hard boundaries in its own agent file, not soft guidance. Every pattern recommendation stronger than "Experiment first" requires independent clearance from the relevant specialists (Public Policy and Editorial for political/sourcing framing, Legal for copyright/privacy/gambling-adjacent risk, Software Architect for feasibility), and the Council Chair is instructed never to let a favourable Benchmarking verdict substitute for those independent reviews or for owner approval.

## 13. Confirmations

- **No application code was changed.** Zero files under `src/` were created or modified by this task (the `/feed` and `FeaturedMarketCard` code was read for evidence, never edited).
- **No database migration, schema, or Supabase behaviour was touched.**
- **Production was not accessed, deployed to, migrated, or seeded.**
- **Nothing was staged, committed, or pushed.** All new/updated files remain in the working tree exactly as the constitution's Task Execution rules require pending explicit instruction.
- **No external service was connected**, and no restricted/authenticated/paywalled system was scraped or accessed to produce the benchmark reviews.
- **Pre-existing uncommitted work was preserved** — verified via `git status` before and after this task; every file already modified or untracked at the start remains exactly as it was.
