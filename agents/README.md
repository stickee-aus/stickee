# The Stickee Governance Council

*Formerly "the Stickee Council" — renamed to reflect that this is no longer just a set of prompts but the governance framework for Stickee's long-term development. See the note at the top of `docs/STICKEE_COUNCIL.md` for why the name changed and why the old name is preserved, unedited, in the two historical build reports that used it.*

The Stickee Governance Council is a set of thirteen specialist review personas used to critique Stickee's product, code, content, and user journeys from distinct professional angles before something ships. Its purpose is that no single perspective — architecture, editorial quality, truthfulness, usability, legal risk, public-policy accuracy, contributor experience, or public trust — determines on its own whether something is ready. This directory defines who they are; `agents/templates/` defines the intake forms for each review mode; `docs/STICKEE_COUNCIL.md` is the governing rulebook.

This is a **documentation and process system**, not a piece of software. There is no runtime, no API, and no autonomous execution. "Invoking an agent" means: open the relevant `agents/*.md` file, load it as the persona/instructions for a review, fill in the matching template from `agents/templates/`, and produce written findings. A human (you, or Claude Code acting on your instruction) plays the role each time — there is no standing background process.

The Council is governed by [AGENTS.md](../AGENTS.md), the Stickee project constitution. Nothing here overrides it. Where a council file and AGENTS.md conflict, AGENTS.md wins.

The Council exists to **improve decision quality, not to increase bureaucracy** — see "Review levels" below for how it scales itself to the size of the change.

## What the Council is for

Stickee's constitution says infrastructure is no longer the bottleneck — the product is, and credibility must never be sacrificed for speed. The Council exists to apply that standard consistently: catching duplicated systems, fabricated content, misleading political framing, legal exposure, confusing journeys, and contributor-hostile setup *before* they reach a merge, a release, or a public repository.

The Council does not rubber-stamp work. Every agent is instructed to challenge weak assumptions, ask for evidence, and recommend the smallest safe change rather than the most ambitious one.

## What the Council cannot replace

None of these agents are real professionals, and none may be presented as such:

- The **Public Policy Advisor** is not a political scientist.
- The **Legal, Privacy and Regulatory Risk Advisor** is not a lawyer. Its output is never legal advice.
- The **Editorial Advisor** is not a journalist or a masthead.
- The **UX Researcher** is not a substitute for real usability testing with real users.
- The **Civic Technology Advisor** is not a government accessibility auditor.
- The **Product Intelligence & Benchmarking Advisor** is not a UX researcher running primary studies on Stickee's own users, and not a copyright lawyer — it studies other products' public behaviour and documentation, and its adoption/adaptation recommendations are inputs to council review, never authority to implement.
- The **Data & Evidence Steward** is not a professional fact-checker, archivist, or data engineer — it cannot perform a live sync-health check it has no access to, and says so rather than assuming a pipeline is healthy.
- The **Historian & Knowledge Preservation Advisor** is not a professional archivist or records manager — genuine statutory retention questions go to the Legal Advisor.

Every agent must flag when a finding needs a real qualified professional, real user research, or real database verification, rather than presenting AI analysis as if it settles the question. See "Evidence standards" in each agent file and the escalation rules in `docs/STICKEE_COUNCIL.md`.

## The thirteen agents

| # | Agent | File | Reviews |
|---|-------|------|---------|
| 1 | Software Architect | [software-architect.md](software-architect.md) | Architecture, duplication, data flow, testing, security boundaries |
| 2 | Product Strategist | [product-strategist.md](product-strategist.md) | Scope, priority, sequencing, product identity |
| 3 | Public Policy and Political-Science Advisor | [public-policy-advisor.md](public-policy-advisor.md) | Political accuracy, neutrality, institutional correctness |
| 4 | Civic Technology and Open-Government Advisor | [civic-technology-advisor.md](civic-technology-advisor.md) | Public interest, transparency, accessibility, correction pathways |
| 5 | Legal, Privacy and Regulatory Risk Advisor | [legal-regulatory-advisor.md](legal-regulatory-advisor.md) | Privacy, consumer law, electoral, IP, prediction-market risk |
| 6 | Editorial and Parliamentary Research Advisor | [editorial-research-advisor.md](editorial-research-advisor.md) | Headlines, sourcing, tone, fact/opinion/forecast separation |
| 7 | UX Researcher | [ux-researcher.md](ux-researcher.md) | Usability, comprehension, cognitive load, first-time clarity |
| 8 | Open-Source Maintainer | [open-source-maintainer.md](open-source-maintainer.md) | Contributor readiness, docs, CI, governance |
| 9 | UX Journey and Bottleneck Analyst | [ux-journey-bottleneck-analyst.md](ux-journey-bottleneck-analyst.md) | End-to-end journeys, abandonment, trust friction |
| 10 | Product Intelligence & Benchmarking Advisor | [product-intelligence-benchmarking-advisor.md](product-intelligence-benchmarking-advisor.md) | Product-pattern research, transferability, adaptation vs. copying |
| 11 | Data & Evidence Steward | [data-evidence-steward.md](data-evidence-steward.md) | Provenance, citations, freshness, sync health, evidence chains |
| 12 | Historian & Knowledge Preservation Advisor | [historian-knowledge-preservation-advisor.md](historian-knowledge-preservation-advisor.md) | Permanent URLs, canonical IDs, chronology, revision history |
| 13 | Council Chair and Synthesis Reviewer | [council-chair.md](council-chair.md) | Synthesis, conflict resolution, merge recommendation |

Each agent file defines: mandate, areas reviewed, standard questions, evidence standards, boundaries, required output format, severity model, approval criteria, escalation rules, and how it should interact with the other twelve.

## How to invoke one agent

1. Open the agent's file in `agents/`.
2. Pick the matching template in `agents/templates/` (most single-agent reviews use `page-review.md`, `content-review.md`, or `feature-review.md`).
3. Fill in the template's **Input** section with real evidence: routes, file paths, component names, screenshots, page copy, or an explicit note that evidence is unavailable.
4. Produce the output in the agent's required format, using the shared severity model (P0–P3).

Example prompts:

> "Review `/decisions` using the UX Researcher and Public Policy Advisor."

> "Use the Legal, Privacy and Regulatory Risk Advisor to check the daily-bonus and staking copy for consumer-law risk."

> "Have the Editorial Advisor review the MP profile summary on `/leaders/[id]` for unsupported claims."

> "Use the Product Intelligence & Benchmarking Advisor to study how Kalshi presents resolution criteria, and whether that pattern fits a Stickee forecast page."

> "Use the Data & Evidence Steward to check whether the claims on this MP profile actually trace to a source."

> "Use the Historian to check whether renaming this route will break any permanent links."

## How to invoke the full council

1. Choose the review mode (see below) and fill in its template from `agents/templates/`.
2. Decide the review level (Level 1, 2, or 3 — see "Review levels" below) and pick the reviewer set accordingly; a full council does not mean all twelve specialists for every task, only for Level 3.
3. Run each selected specialist agent independently. Do not let later agents simply restate the first agent's conclusions — each must review the evidence itself and reach its own findings.
4. Run the **Council Chair** last, using `agents/templates/council-summary.md`, to merge duplicate findings, list disagreements explicitly, and issue one recommendation.

Example prompts:

> "Run the full council against this pull request."

> "Run the full council on the `/parliament` page before we link it from the home page."

> "Run a product benchmark review on how other products handle source comparison, then run the full council on the adaptation."

## Review modes — when to use each

| Mode | Template | Use when |
|------|----------|----------|
| Page Review | `page-review.md` | Reviewing a single route end-to-end |
| Feature Review | `feature-review.md` | Deciding whether/how to build a proposed feature, before code exists |
| Pull Request Review | `pull-request-review.md` | Reviewing a diff before merge |
| Open-Source Readiness Review | `open-source-readiness-review.md` | Deciding whether the repo (or a part of it) is ready for outside contributors |
| User-Journey Review | `user-journey-review.md` | Mapping a specific end-to-end task a user is trying to complete |
| Content Review | `content-review.md` | Reviewing an issue page, decision, MP profile, forecast, or article copy |
| Architecture Review | `architecture-review.md` | Reviewing a schema, route tree, or proposed refactor |
| Product Benchmark Review | `product-benchmark-review.md` | Studying how proven products solve a problem Stickee also has, before proposing a feature |

Example prompts:

> "Map the signed-out Forecasts journey using the user-journey-review template."

> "Review whether Stickee is ready for public open source."

> "Study how Kalshi, Ground News and X each solve a specific problem, using the product-benchmark-review template, before we design a new forecast page."

## Review levels — how much Council do I need?

Not every change needs every agent. `docs/STICKEE_COUNCIL.md`'s "Review levels" section defines three tiers:

- **Level 1** (wording, nav labels, styling, accessibility tweaks, isolated bug fixes) — one or two relevant agents, no Chair synthesis required
- **Level 2** (a new page, workflow, forecast feature, Parliament enhancement, contributor tooling) — three to five relevant agents plus the Chair
- **Level 3** (production launch, open source, forecast engine, data architecture, political methodology, prediction mechanics, auth redesign) — full Council

`docs/STICKEE_COUNCIL.md`'s "Release gates" table gives the recommended reviewer set for common change types (UI tweak, navigation, homepage, forecast engine, MP profile, government page, database schema, open-source readiness, major release) — use it to pick *which* agents a Level 1 or 2 change needs. When in doubt between two levels, use the higher one.

## When a Product Benchmark Review is required

Run the Product Intelligence & Benchmarking Advisor (as part of a full council review) before, or alongside, a Feature Review for any of these:

- A new major product feature
- A new home-page section
- A new forecast experience
- A new source-comparison feature
- A new feed or "Political Pulse"-style surface
- A new onboarding flow
- A new contributor workflow
- A major navigation or information-architecture refactor

It is **not required** for typo fixes, dependency-only changes, small internal refactors with no product-facing effect, or test-only changes — see `docs/STICKEE_COUNCIL.md` for the full release-gate list.

## Evidence you should provide

The Council cannot see the running app, the database, or analytics unless you give it to them. Before a review, gather what's relevant:

- Route path(s) and the component files behind them
- The actual page copy (not a paraphrase)
- Screenshots, if reviewing visual/UX behaviour
- The data source: real Supabase query, or a mock/fixture file — name it explicitly
- Relevant migrations, RPCs, or RLS policies for anything touching wallets, staking, settlement, or auth
- Existing related docs (`docs/audits/`, `PAGE_AND_ROUTE_INVENTORY.md`, etc.) so agents don't re-derive what's already documented
- For a Product Benchmark Review: which products to study (from the benchmark set in `docs/PRODUCT_BENCHMARKING_METHOD.md`, or a proposed addition with rationale), and any public documentation or observed behaviour already gathered — never authenticated or paywalled content
- For the Data & Evidence Steward: the specific source, publication/retrieval dates, and methodology (or confirmation that none of these exist yet) behind any claim under review
- For the Historian: the current route/URL, any proposed redirect, and whether a prior version of the content needs to remain accessible

If evidence is missing, agents must say so — "no verified data available" or "evidence not provided" — rather than guessing.

## How findings are prioritised

All agents use one severity model:

- **P0** — critical security, deception, corruption, or launch-blocking issue
- **P1** — high trust, correctness, legal, architectural, or abandonment risk
- **P2** — meaningful quality or usability issue
- **P3** — minor improvement

Truthfulness and security outrank feature completeness. Blocking risks outrank polish. See `docs/STICKEE_COUNCIL.md` for the full severity and approval matrix.

Two agents use their own labels instead of P0–P3, because a bare severity number doesn't capture their actual decision space: the **Legal Advisor** uses risk labels (Informational / Low / Moderate / High / Requires professional legal review / Do not launch before legal review), and the **Product Intelligence & Benchmarking Advisor** uses recommendation labels (Adopt / Adapt / Experiment first / Defer / Reject / Requires professional review). The Council Chair treats the blocking-equivalent labels from both (e.g. "Do not launch before legal review," "Reject") exactly as it treats a P0 — see `agents/council-chair.md`.

## How owner approval works

The Council reviews and plans. It does not implement.

For anything that would change code, content, data, or infrastructure:

1. Produce the council review.
2. Produce an implementation plan.
3. Explicitly list the decisions that belong to the product owner (you), not the agents.
4. Wait for your approval.
5. Only then begin implementation — and only the part you approved.

No agent may stage, commit, push, deploy, migrate, seed, rotate secrets, or touch production under any review mode. That boundary is absolute regardless of what a review concludes.

## Adding a future agent

The Council is intentionally extensible — adding a new permanent agent should never require restructuring the ones that already exist. See `docs/STICKEE_COUNCIL.md`'s "Scalability" section for the full principle and a list of plausible future candidates (an Accessibility Specialist, a Search & Information Retrieval Advisor, a Performance Engineer, a Visual Design Advisor, a Data Science Advisor, a Community & Moderation Advisor, a Security Operations Advisor) named there so they aren't re-litigated from scratch when proposed. Mechanically:

1. Add a new `agents/<name>.md` file following the same structure as the existing thirteen (mandate, areas, questions, evidence standards, boundaries, output format, severity model, approval criteria, escalation rules, interaction rules).
2. Add it to the table above and to the approval matrix in `docs/STICKEE_COUNCIL.md`.
3. Decide which existing review-mode templates and Release Gates rows it participates in, and update those templates' "Agents typically involved" line — a new template is only needed if the agent introduces a genuinely new *kind* of review.
4. Update `council-chair.md` interaction rules if the new agent can produce a blocking (P0, or equivalent) finding.
5. Do not give a new agent authority to bypass the implementation boundaries above — that applies to every agent, present and future, without exception.
