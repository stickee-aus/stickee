# Agent Automation Roadmap (Proposal — Not Implemented)

This document proposes a future automated workflow for running the Stickee Governance Council against pull requests. **Nothing in this document is implemented.** No external service, webhook, GitHub Action, or bot has been connected as part of building this Council. This is a design proposal for the owner to evaluate and explicitly approve before any part of it is built.

Governed by [AGENTS.md](../AGENTS.md) — in particular the Production Safety and "no production access without explicit approval" principles in [STICKEE_COUNCIL.md](STICKEE_COUNCIL.md#global-council-principles), which apply to any future automation exactly as they apply to manual review today.

## Why this is a roadmap, not a build

The manual Council (see [agents/README.md](../agents/README.md)) already works today with no infrastructure, no credentials, and no standing process — a human loads an agent file and produces a review. Automating it trades that simplicity for speed and consistency, at the cost of new attack surface (a bot with repo/CI access) and new failure modes (an automated review posted with false confidence). That tradeoff should be made deliberately, in phases, not by connecting a webhook because it's technically possible.

## Proposed future workflow

```
1. Trigger:            GitHub pull request opened or updated
2. Agent selection:    relevant agents chosen based on changed files
3. Independent review: each selected agent generates findings from the diff
4. Synthesis:          Council Chair merges findings into one recommendation
5. CI attachment:      test/build/lint results attached to the same report
6. Posting:            merge recommendation posted as a PR comment/check
7. Human decision:     repo owner approves or rejects the merge — the bot never merges
```

### 1. Trigger

- GitHub Actions `pull_request` event (opened, synchronize, reopened).
- Never triggered on `push` to `main` directly — the Council reviews proposed changes, not already-merged ones (a post-merge audit mode could be a separate, later proposal).

### 2. Agent selection logic

Select agents by changed-file path, not by running all twelve on every PR:

| Changed paths | Agents selected |
|---|---|
| `src/app/**`, `src/components/**` (UI only) | Software Architect, UX Researcher |
| `supabase/migrations/**`, RPC/SQL files | Software Architect (escalates to "requires real-database verification" by default) |
| Content/copy in issue, decision, MP, or forecast components | Data & Evidence Steward, Public Policy Advisor, Editorial Advisor, Civic Technology Advisor |
| Route renames, redirects, or canonical-ID/slug changes | Historian, Software Architect |
| Anything touching auth, wallets, points, staking, settlement | Software Architect + explicit flag that automation cannot substitute for real-database testing |
| `README.md`, `CONTRIBUTING`, `.github/**`, CI config | Open-Source Maintainer |
| Anything touching data collection, consent, third-party datasets, terms | Legal Advisor |
| Any PR touching 3+ of the above categories, or explicitly labelled `full-council` | All twelve specialists + Chair |

The Product Strategist and UX Journey and Bottleneck Analyst are harder to trigger automatically (they need judgement about product intent and multi-step journeys) — propose these run on-demand via a PR label (`council-review: product`, `council-review: journey`) rather than automatically on every diff.

### 3. Required inputs

- The diff itself
- Changed file list
- CI results (test/build/lint) from the existing pipeline
- Any linked issue/ticket describing intent
- For content changes: the actual rendered copy, not just the diff (a diff of JSX doesn't show final rendered text clearly)

### 4. Outputs

- One PR comment containing the Council Chair's approval matrix and overall recommendation
- A GitHub Check run (pass/fail/neutral) reflecting the overall recommendation — neutral (not a hard fail) for "Requires owner decision," "Requires real professional review," "Requires user research," and "Requires real-database verification," since these need a human, not a red X
- Full per-agent findings collapsed by default (e.g. in a `<details>` block) to avoid overwhelming the PR

### 5. False-positive risks

- **Static analysis mistaken for verification.** The biggest risk: an automated "Approved" on a wallet/staking/settlement change could be read as sufficient, when AGENTS.md requires real-database testing. Mitigation: automation must never output a bare "Approved" for these paths — only "Requires real-database verification," always, regardless of how clean the diff looks.
- **Stale agent selection.** File-path-based triggers can miss a genuinely cross-cutting change (e.g. a component rename that touches political-content rendering but lives in a "UI-only" path). Mitigation: allow any human to force a full-council run via a label.
- **Automated content classification errors.** An LLM-driven Editorial/Policy check could misclassify a claim's evidence status. Mitigation: automated classification is always advisory, and human review remains the actual gate before merge for anything content-facing.
- **Prompt injection via PR content.** A malicious or careless PR description/diff could contain text designed to manipulate the reviewing agent. Mitigation: treat PR content as untrusted input; never let it instruct the agent to skip checks, approve itself, or reveal secrets.

### 6. Human review points

- Every PR still requires a human merge action — the bot posts a recommendation and a check status, never merges.
- "Blocked," "Do not launch before legal review," and "Requires real-database verification" outcomes require explicit human override (not just re-running the bot) to merge anyway, and that override should be logged (who, when, why) given AGENTS.md's emphasis on accountability for sensitive systems.
- Any first-time run of automation against a real PR should be shadow-mode first (posts findings as a comment, doesn't gate the merge) for a trial period before it's allowed to block.

### 7. Security boundaries

- The automation account/token should have the minimum GitHub scope needed to read PR content and post comments/checks — never merge, push, or admin scope.
- No agent invoked by automation may access production data, secrets, or environment variables beyond what's already exposed to the existing CI pipeline for tests.
- The automation must not be able to modify its own review criteria (this document, the `agents/` files) as part of a PR it's reviewing — a PR that edits `agents/*.md` should always route to a human-run full council, not the automation reviewing changes to its own rules.

### 8. Privacy considerations

- PR diffs and comments may be sent to an LLM API as part of generating reviews — this should be disclosed in `CONTRIBUTING.md` before public contributors submit PRs, so they know their code/comments are processed this way.
- No user data, production database contents, or real Supabase records should ever be part of an automated review's input — only code, schema *structure* (not data), and documentation.
- If Stickee ever handles genuinely sensitive user data (e.g. real emails collected via `EmailMPButton`), automation must never have read access to that data as part of a "helpful context" fetch.

## Phased implementation (proposed, not started)

| Phase | Scope | Gate to advance |
|---|---|---|
| 0 (current) | Manual invocation only, as documented in `agents/README.md` | N/A — this is where the project is today |
| 1 | Shadow mode: automation posts a comment on PRs, doesn't gate merge, minimum-scope token | Owner reviews shadow output accuracy for several real PRs before trusting it |
| 2 | Soft gate: Check run shows non-blocking status (neutral) for all outcomes except a clean "Merge" | Confirms false-positive rate is acceptable; owner still merges everything manually |
| 3 | Hard gate on defined categories only (e.g. block merge on Legal "Do not launch," never on Product/UX judgement calls) | Owner explicitly approves which categories are allowed to block, in writing, before enabling |
| 4 (not currently planned) | Any broader autonomous behaviour | Requires a new, separate owner-approved proposal — out of scope for this roadmap |

No phase beyond 0 should be started without the owner explicitly authorising that specific phase, per AGENTS.md's production-safety and no-hidden-autonomous-behaviour requirements.

## Proposed future workflow — product benchmarking

This is a second, separate proposal, for automating the **Product Benchmark Review** process (see [agents/product-intelligence-benchmarking-advisor.md](../agents/product-intelligence-benchmarking-advisor.md) and [docs/PRODUCT_BENCHMARKING_METHOD.md](PRODUCT_BENCHMARKING_METHOD.md)) rather than pull-request review. It is independent of the PR-automation proposal above and carries a different risk profile — it involves external research rather than just reading Stickee's own diff. **Nothing in this section is implemented.** No external research tool, scraper, or service has been connected.

```
1. Owner names a product or user problem  → e.g. "how should we show source diversity on decisions?"
2. Benchmarking agent researches patterns → public documentation + observed public behaviour only, per the research standards in docs/PRODUCT_BENCHMARKING_METHOD.md
3. Relevant council agents review          → Public Policy / Editorial / Civic Technology / Legal / Architect, selected by what the pattern touches
4. Council Chair synthesises               → treats benchmarking findings as one recommendation among several, never authority (agents/council-chair.md)
5. Owner approves a small experiment       → explicit, scoped, reversible — never a full build on the strength of research alone
6. Implementation issue is created         → normal Feature Review / Architecture Review process, not a shortcut
7. Experiment is measured                  → against success metrics defined before the experiment ran
8. Pattern library status is updated       → docs/PRODUCT_PATTERN_LIBRARY.md reflects the real outcome, whatever it was
```

### Why this is a separate, higher-caution proposal than PR automation

PR automation reviews Stickee's own code — a closed, fully-visible input. Benchmarking automation would need to research *other companies' products*, which introduces risks the PR workflow doesn't have:

- **Scraping/ToS risk.** An automated research step could be tempted to script data collection from a competitor's site in ways that violate that site's terms of service or cross from "observing public behaviour" into prohibited scraping. Per `docs/PRODUCT_BENCHMARKING_METHOD.md`, only public documentation and manually observed public behaviour are permitted — any automation of this step must enforce that boundary structurally (e.g. only reading from an owner-curated set of already-collected public sources), not rely on the agent choosing correctly every time.
- **Copyright/imitation risk.** An automated summarizer could inadvertently reproduce a competitor's proprietary wording or design description too closely. Any automation here needs a review gate (the existing Legal Advisor escalation) before output is treated as a clean paraphrase.
- **Stale or fabricated "evidence."** Automated research is more likely to blur the evidence-classification levels in `docs/PRODUCT_BENCHMARKING_METHOD.md` (e.g. presenting an inferred rationale as "public documentation") than a human researcher checking their own sources. Any automated output must retain the "Sources used" field and the evidence-level label, unedited, for a human to spot-check.

### Phased approach (proposed, not started)

| Phase | Scope | Gate to advance |
|---|---|---|
| 0 (current) | Manual-only, as documented in `agents/product-intelligence-benchmarking-advisor.md` | N/A — this is where the project is today |
| 1 | Owner manually supplies research inputs (links, docs, screenshots); automation only assists with drafting the scorecard from supplied evidence — no automated fetching of external sites | Owner reviews scorecard-drafting accuracy against several manually-supplied inputs |
| 2 | Automation may fetch from an owner-approved allowlist of public documentation URLs (e.g. a product's own published design-blog posts) — never general web scraping | Owner explicitly approves the allowlist per product, in writing |
| 3 (not currently planned) | Any broader autonomous research capability | Requires a new, separate owner-approved proposal — out of scope here |

As with the PR-automation roadmap, no phase beyond 0 starts without explicit owner authorisation, and every output remains a recommendation for council and owner review — never a standing authorisation to implement.
