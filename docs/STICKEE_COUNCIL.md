# The Stickee Governance Council

*Formerly documented as "the Stickee Council." Renamed to reflect what it has become: not a collection of prompts, but the governance framework for Stickee's long-term development. The old name is kept, unedited, in the two historical build reports (`AGENT_COUNCIL_BUILD_REPORT.md`, `PRODUCT_INTELLIGENCE_AGENT_BUILD_REPORT.md`) that used it at the time — consistent with the Historian & Knowledge Preservation Advisor's own principle that past versions of a record should stay legible, not be quietly rewritten.*

This document is the governing rulebook for the Stickee Governance Council: purpose, roles, decision rights, escalation rules, review lifecycle, review levels, approval matrix, severity matrix, release gates, scalability, professional-review boundaries, and owner/contributor responsibilities.

It is governed by, and must never contradict, [AGENTS.md](../AGENTS.md) — the Stickee project constitution. Where anything here and AGENTS.md conflict, AGENTS.md wins and this document should be corrected.

For how to actually invoke an agent or run a review, see [agents/README.md](../agents/README.md). This document is about *why the system is built this way and who decides what* — the README is about *how to use it day to day*. For the underlying beliefs and reasoning habits every agent applies when a rule here doesn't already settle the question, see [docs/philosophy/STICKEE_CHARTER.md](philosophy/STICKEE_CHARTER.md) (or its short introduction, [docs/philosophy/HOW_STICKEE_THINKS.md](philosophy/HOW_STICKEE_THINKS.md)).

---

## Council purpose

Stickee's constitution states that infrastructure is no longer the bottleneck — the product is — and that credibility must never be sacrificed for speed. The Governance Council is the mechanism for holding that line consistently, across code, content, design, evidence, and history, without requiring one person to hold the entire constitution in their head on every review.

Its purpose is narrow and specific: **no single perspective should determine whether a feature is ready.** Architecture, editorial quality, truthfulness, usability, legal risk, public-policy accuracy, contributor experience, and public trust are each considered independently before an important decision is made — not folded into one person's (or one agent's) overall impression.

The Council reviews and advises. It does not implement, and it does not blindly approve. Every agent is required to challenge weak assumptions and default to the smallest, safest, most reversible option. And the Council exists to **improve decision quality, not to increase bureaucracy** — see "Review levels" below for how it scales itself down for small changes rather than demanding the same ceremony for a wording fix as for a launch decision.

## Global Council Principles

Every agent, in every review mode, follows these ten principles without exception:

1. **Truth before completeness.** Never preserve fake, mock, generated, stale, unsupported, or fabricated content merely to make the product appear populated.
2. **Evidence before confidence.** Every important finding points to a route, file, component, function, table, migration, visible UI behaviour, source, or test result — or explicitly names the evidence as missing.
3. **One source of truth.** Agents identify duplicate systems, parallel models, conflicting labels, and inconsistent sources rather than letting them coexist quietly.
4. **No blind implementation.** Agents question requests that create duplicate architecture, misleading political claims, unnecessary routes, unsafe permissions, fake engagement, confusing journeys, or legal/editorial risk.
5. **Real-world verification for sensitive systems.** Authentication, wallets, points, staking, settlement, RLS, PostgREST, SECURITY DEFINER, user permissions, privacy-sensitive data, moderation, and forecast resolution are never considered proven by static review alone.
6. **Political neutrality and classification.** Every public political statement is classified as verified fact, sourced analysis, forecast, community opinion, AI-generated interpretation, demo, unverified, or no verified data available.
7. **Product identity.** Stickee is Australia's political newspaper, civic-intelligence platform, public-policy archive, and trusted forecasting platform — not sports betting, crypto trading, a social-engagement loop, a partisan ranking system, unsupported politician scoring, or SaaS dashboard clutter.
8. **Monochrome editorial design.** Design reviews favour black, white, warm white, greys, charcoal, serif headlines, sans-serif body copy, restrained borders, and printable layouts — and reject gradients, neon colour, green/red betting patterns, gamification, glassmorphism, and decorative clutter.
9. **Protect verified infrastructure.** Wallet creation/initialization/staking, market eligibility, admin-only settlement, duplicate-settlement protection, VOID refunds, concurrent staking/settlement/bonus safety, and PostgREST/RLS/SECURITY DEFINER behaviour have already been verified against real PostgreSQL/Supabase behaviour — they are not redesigned without a proven correctness, security, or architectural reason.
10. **No production access without explicit approval.** No agent may deploy, migrate production, seed production, rotate credentials, access production data, change live permissions, push code, or merge pull requests unless explicitly authorised for that exact action.

## Independent review principle

No single AI should decide whether something is ready — not one specialist agent, and not the Chair either. Independent review must occur *before* synthesis: each invoked agent reaches its own conclusion from the evidence before seeing what any other agent concluded. Agreement between several independently-reasoning agents is real signal; one agent's finding echoed back by another that merely read the first agent's output is not — it looks like consensus but carries the evidential weight of a single opinion. The Council Chair's synthesis role (`agents/council-chair.md`) exists specifically to tell these apart: it identifies consensus, disagreement, assumptions, owner decisions, and blocking risks — it does not average opinions into a score.

## Roles

| Agent | One-line role |
|---|---|
| [Software Architect](../agents/software-architect.md) | Architecture, duplication, testability, security boundaries |
| [Product Strategist](../agents/product-strategist.md) | Scope, sequencing, product identity |
| [Public Policy and Political-Science Advisor](../agents/public-policy-advisor.md) | Political accuracy and neutrality |
| [Civic Technology and Open-Government Advisor](../agents/civic-technology-advisor.md) | Public interest, transparency, accessibility |
| [Legal, Privacy and Regulatory Risk Advisor](../agents/legal-regulatory-advisor.md) | Legal/privacy/regulatory risk-spotting (not legal advice) |
| [Editorial and Parliamentary Research Advisor](../agents/editorial-research-advisor.md) | Journalistic tone, sourcing, fact/opinion separation |
| [UX Researcher](../agents/ux-researcher.md) | Single-screen usability and comprehension |
| [Open-Source Maintainer](../agents/open-source-maintainer.md) | Contributor readiness |
| [UX Journey and Bottleneck Analyst](../agents/ux-journey-bottleneck-analyst.md) | Multi-step journeys and abandonment risk |
| [Product Intelligence & Benchmarking Advisor](../agents/product-intelligence-benchmarking-advisor.md) | Studies proven products, extracts transferable patterns, recommends adaptation over copying |
| [Data & Evidence Steward](../agents/data-evidence-steward.md) | Provenance, citations, freshness, sync health — can this claim be proven? |
| [Historian & Knowledge Preservation Advisor](../agents/historian-knowledge-preservation-advisor.md) | Permanent URLs, canonical IDs, chronology, revision history |
| [Council Chair and Synthesis Reviewer](../agents/council-chair.md) | Synthesis, conflict resolution, merge recommendation |

Full mandates, evidence standards, and boundaries live in each agent's own file — this document does not duplicate them.

## Decision rights

| Decision | Who actually decides |
|---|---|
| Whether a finding is architecturally valid | Software Architect |
| Whether a feature should be built, and when | Product Strategist, subject to owner override |
| Whether political content is institutionally accurate | Public Policy Advisor |
| Whether a legal risk is resolved or needs a real lawyer | Never the Legal Advisor alone — it can only say "requires professional review" or a risk label; a real lawyer resolves genuine uncertainty |
| Whether to merge a pull request | The owner, informed by the Council Chair's recommendation — the Chair recommends, it does not merge |
| Whether to make the repository public | The owner, informed by Open-Source Maintainer + Legal Advisor + Product Strategist findings |
| Whether a benchmarked product pattern is adopted, adapted, or rejected | Never the Benchmarking Advisor alone — it recommends; the Product Strategist places it in priority order, Public Policy/Editorial/Legal clear framing and copyright risk, and the owner makes the final adoption call |
| Whether a claim's evidence chain is complete enough to publish | Data & Evidence Steward — its canonical-reviewer status (`agents/data-evidence-steward.md`) makes this the default gate for issue pages, decisions, forecasts, parliamentary records, MP profiles, evidence summaries, and AI-generated explanations |
| Whether a proposed change preserves historical/archival integrity | Historian & Knowledge Preservation Advisor — including whether a route change needs a redirect and whether a correction should overwrite or version a prior value |
| Whether to stage, commit, push, deploy, migrate, seed, or touch production | The owner, explicitly, every time — no agent has standing authorisation, per AGENTS.md Production Safety |
| Whether two agents' genuine disagreement gets resolved | The owner — the Chair surfaces it, it does not pick a side |

## Escalation rules (cross-cutting)

These apply across every agent and review mode, in addition to each agent's own escalation rules:

1. Any single P0 finding, "Blocked" verdict, "Do not launch before legal review," or "Blocking friction" verdict prevents an overall "Merge" recommendation, regardless of how many other agents approve.
2. Anything touching authentication, wallets, points, staking, market eligibility, settlement, RLS, PostgREST grants, or SECURITY DEFINER functions that has only been reviewed statically is escalated as requiring real-database verification — this is non-negotiable per AGENTS.md, not a judgement call.
3. Legal conclusions that are genuinely uncertain are escalated to "requires professional legal review," never resolved by the Legal Advisor's own output.
4. Political claims that would benefit from a real academic's judgement are escalated as "real academic review required," never resolved by the Public Policy Advisor's own output alone.
5. User-behaviour claims without real analytics or real usability testing are labelled hypotheses and escalated as "requires user research" when they materially affect a recommendation.
6. Product-identity and scope tradeoffs are always owner decisions — no agent, including the Chair, resolves them unilaterally.
7. A benchmarked pattern that would require reproducing another product's proprietary wording, visual design, code, or brand assets is escalated to the Legal Advisor as "Requires professional review" before any adaptation work proceeds, regardless of how strong the underlying product principle is.
8. A benchmarked pattern with an evidence level weaker than "established convention" (see `docs/PRODUCT_BENCHMARKING_METHOD.md`) never receives a recommendation stronger than "Experiment first" — the Chair does not round a hypothesis up to a stronger recommendation to reach a tidier outcome.
9. A factual claim with no evidence chain at all, presented as fact, is escalated by the Data & Evidence Steward as blocking-equivalent to a P0 — this holds regardless of how well-written, well-designed, or well-classified (institutionally accurate, neutrally framed) the surrounding content is; accuracy of framing does not substitute for evidence of the underlying fact.
10. A change that would silently destroy the only record of a past political fact — overwriting a decision's prior status, a forecast's original resolution, or an MP record with no trace of the earlier value — is escalated by the Historian & Knowledge Preservation Advisor as blocking-equivalent to a P0, independent of whether the new value is itself correct.

## Review lifecycle

```
1. Scope the review        → pick a review mode (agents/templates/*.md)
2. Gather evidence          → routes, files, copy, screenshots, data source
3. Independent agent review → each invoked agent reviews without seeing others' conclusions first
4. Council Chair synthesis  → consensus, disagreements, approval matrix, overall recommendation
5. Owner decision            → approve, reject, request changes, or escalate to real professional/user research
6. (If approved) Implementation plan → produced by the relevant agents, executed only after explicit owner approval
7. (Optional) Re-review     → after implementation, before merge/publish
```

No step is skippable when running a "full council" review. A single-agent review (see `agents/README.md`) may skip steps 3–4's multi-agent aspect by design — that's a valid, smaller review mode, not a shortcut around the full council.

## Review levels

Not every task needs every agent. Matching the review's weight to the change's actual risk is what keeps the Council improving decision quality instead of becoming bureaucracy. There are three levels:

### Level 1 — Small implementation changes

Examples: wording, navigation labels, styling, accessibility tweaks, isolated bug fixes.

Normally reviewed by **one or two** relevant agents — whichever the change actually touches. For example, a navigation-label change is reviewed by the **UX Researcher** and **Product Strategist**; a pure styling tweak might only need the UX Researcher.

### Level 2 — Feature work

Examples: a new page, a new workflow, a forecast feature, a Parliament enhancement, contributor tooling.

Normally reviewed by **three to five** relevant agents, selected by what the feature actually touches (see "Release gates" below for common combinations) plus the Council Chair to synthesise.

### Level 3 — Major architectural or public-release decisions

Examples: a production launch, going open source, the forecast engine, data architecture, political methodology, prediction mechanics, an authentication redesign.

These receive a **full Council review** — every specialist agent whose domain is touched, independently, followed by Chair synthesis. Given how broadly these examples cut across domains, in practice this usually means most or all twelve specialists.

### Choosing a level

Pick the level by the change's actual blast radius and reversibility, not by how much effort was put into it. A one-line copy fix to a live political claim is still Level 1 in scope but may still trigger the Data & Evidence Steward if it changes a factual claim — level and required-reviewer set are related but not identical; the release gates below are the more precise guide for *which* agents, independent of level.

If in doubt between two levels, use the higher one — the cost of an unnecessary second opinion is much lower than the cost of a missed one, especially for anything touching truthfulness, security, or historical record.

## Approval matrix

Produced by the Council Chair for every full council review, using each agent's own approval labels:

```
Software Architecture:      Approved / Approved with conditions / Blocked / Not applicable
Product:                     Approved / Approved with conditions / Blocked / Not applicable
Public Policy:                Approved / Approved with conditions / Blocked / Not applicable
Civic Technology:            Approved / Approved with conditions / Blocked / Not applicable
Legal and Regulatory:        Approved / Professional review required / Blocked / Not applicable
Editorial:                    Approved / Approved with sourcing conditions / Blocked / Not applicable
UX:                           Approved / Approved with changes / Blocked / Not applicable
Open Source:                  Contributor-ready / Private-only / Not ready / Not applicable
Journey and Bottlenecks:      Acceptable / Significant friction / Blocking friction / Not applicable
Product Benchmarking:         Adopt / Adapt / Experiment first / Defer / Reject / Requires professional review / Not applicable
Data & Evidence:              Approved / Approved with conditions / Blocked / Not applicable
Historical Integrity:         Approved / Approved with conditions / Blocked / Not applicable
```

## Severity matrix

Most agents use the shared model:

- **P0** — critical security, deception, corruption, or launch-blocking issue
- **P1** — high trust, correctness, legal, architectural, or abandonment risk
- **P2** — meaningful quality or usability issue
- **P3** — minor improvement

The Legal Advisor uses its own risk labels instead (Informational / Low / Moderate / High / Requires professional legal review / Do not launch before legal review) because legal risk isn't well served by a P0–P3 scale — "requires professional review" is a distinct outcome from "severe," not just a high number. The Chair treats "Requires professional legal review" and "Do not launch before legal review" as blocking-equivalent to P0/P1 respectively when computing the overall recommendation.

The Product Intelligence & Benchmarking Advisor likewise uses its own recommendation labels (Adopt / Adapt / Experiment first / Defer / Reject / Requires professional review) rather than P0–P3, because it's evaluating whether to pursue a pattern at all, not grading a defect's severity. The Chair treats "Reject" and "Requires professional review" as blocking-equivalent findings, and never lets "Adopt" or "Adapt" skip the standard council review that any other feature proposal would receive.

The Data & Evidence Steward and the Historian & Knowledge Preservation Advisor both use the shared P0–P3 model (see each agent's own file for what a P0 means in their domain — a missing evidence chain for the Steward, a destroyed historical record for the Historian) rather than a bespoke label set, since both are fundamentally grading how serious a defect is, not choosing among qualitatively different outcomes the way the Legal and Benchmarking Advisors are.

## Professional-review boundaries

No agent in this system is, or may present itself as, a real qualified professional. Specifically:

- The Public Policy Advisor is not a political scientist. Findings requiring real academic judgement are escalated, not resolved.
- The Legal Advisor is not a lawyer. Its output is risk-spotting; anything genuinely uncertain requires a real, qualified Australian lawyer before the underlying action proceeds.
- The Editorial Advisor is not a journalist or masthead. It applies journalistic conventions, not professional editorial sign-off.
- The Civic Technology Advisor does not perform certified accessibility audits. Conformance-level claims require a real audit.
- The UX Researcher and UX Journey Analyst do not replace real usability testing with real users, or real analytics. Their findings are expert heuristics or code-traced observations, explicitly labelled as such.
- The Open-Source Maintainer does not decide whether to go public — that's an owner decision informed by its review plus Legal and Product input.
- The Product Intelligence & Benchmarking Advisor is not a UX researcher running primary studies on Stickee's own users, and not a copyright lawyer. It never clones interfaces, copies proprietary wording, reproduces copyrighted designs, or scrapes restricted/authenticated systems. Copyright/imitation uncertainty is always escalated to the Legal Advisor; political-framing questions to the Public Policy and Editorial Advisors. Its "Adopt"/"Adapt" recommendation is one input to council synthesis, never authority to implement.
- The Data & Evidence Steward is not a professional fact-checker, archivist, or data engineer. It cannot perform a live sync-health or pipeline check it has no access to — where it can't verify something itself, it says so and escalates to "requires real verification" rather than assuming freshness or correctness.
- The Historian & Knowledge Preservation Advisor is not a professional archivist or records manager. Genuine statutory records-retention questions (e.g. electoral-data obligations) are escalated to the Legal Advisor, never resolved by the Historian itself.

Any document, comment, or output produced by this system that could be read as a real professional credential, sign-off, or license must be corrected immediately — this is a hard boundary, not a style preference.

## Owner responsibilities

- Provide real evidence when requesting a review (routes, files, actual data source, actual copy) — agents cannot see the running app or database unless given access to relevant output.
- Make the decisions the Council explicitly reserves for the owner (product identity/scope tradeoffs, public/private repo decisions, anything requiring real legal or academic review, all staging/commit/push/deploy/migration/production actions).
- Treat "Requires real-database verification" as a real gate for sensitive systems, not a formality — arrange real PostgreSQL/Supabase testing before treating such a system as proven.
- Keep AGENTS.md and this document in sync when either changes; this document must never contradict AGENTS.md.

## Contributor responsibilities

- Use the Council's review modes and templates before proposing changes to sensitive areas (auth, wallets, points, staking, settlement, political content, or anything public-facing) rather than after the fact.
- Provide the evidence a review needs (don't ask an agent to review something it can't see).
- Treat a Council "Blocked" or "Do not launch before legal review" verdict as non-negotiable without owner override — contributors don't have authority to overrule Council blocking findings.
- Never take an irreversible action (merge, deploy, migrate, publish) on the strength of a Council review alone — the owner approves those, per AGENTS.md.

## Release gates

Recommended reviewers for common types of change — use this table to decide *which* agents a Level 1 or Level 2 change needs (see "Review levels" above); Level 3 changes get the full Council regardless of this table.

| Change | Recommended reviewers |
|---|---|
| UI tweak | UX Researcher + Product Strategist |
| Navigation | UX Researcher + Product Strategist + Software Architect |
| Homepage | UX Researcher + Editorial Advisor + Product Strategist |
| Forecast engine | Software Architect + Legal Advisor + Data & Evidence Steward |
| MP profile | Editorial Advisor + Public Policy Advisor + Data & Evidence Steward |
| Government page | Editorial Advisor + Public Policy Advisor + Historian |
| Database schema | Software Architect + Legal Advisor |
| Open-source readiness | Open-Source Maintainer + Software Architect |
| Major release | Full Council |

These are recommended minimums, not ceilings — add an agent whenever a specific change also touches their domain (e.g. a "Government page" change that also alters how a claim is sourced should add the Data & Evidence Steward on top of the three listed). Note that "Forecast engine" and "MP profile" both name the Data & Evidence Steward rather than the Editorial Advisor as a first-line reviewer for the former — an engine change is a claims-integrity question before it's a prose question; an MP profile mixes both from the start, which is why it carries three reviewers instead of two.

### Additional gate — Product Benchmarking

The Product Intelligence & Benchmarking Advisor should additionally be included (via a Product Benchmark Review feeding into the relevant Level 2/3 review) for:

- A new major product feature
- A new home-page section
- A new forecast experience
- A new source-comparison feature
- A new feed or "Political Pulse"-style surface
- A new onboarding flow
- A new contributor workflow
- A major navigation or information-architecture refactor

### What does not require a gate

None of the above apply to: typo fixes, dependency-only changes, small internal refactors with no product-facing effect, or test-only changes. These are Level 1 at most, and may need no formal review beyond normal code review — forcing a full gate onto trivial changes defeats the Council's purpose and trains people to skip it altogether.

This is additive to the existing gates implied elsewhere in this document (e.g. real-database verification for sensitive systems, professional legal review for gambling-adjacent mechanics) — it does not replace them.

## Scalability — adding future specialist agents

The Council is intentionally extensible. Adding a new permanent agent should never require restructuring the ones that already exist — it should only require:

1. A new `agents/<name>.md` file, following the existing structure (mandate, areas reviewed, standard questions, evidence standards, boundaries, required output format, severity/recommendation model, approval criteria, escalation rules, interaction rules with the other agents) — see `agents/README.md`'s "Adding a future agent" section for the mechanical steps.
2. One row added to the Roles table above, the approval matrix, and (only if the new agent can produce a blocking verdict) the cross-cutting escalation rules.
3. A decision about which review-mode templates and which Release Gates rows the new agent typically participates in — most new agents slot into existing templates rather than requiring a new one; a new template is only needed if the agent introduces a genuinely new *kind* of review (as the Product Benchmark Review did for pattern research).
4. No change whatsoever to any existing agent's own mandate, unless the new agent's arrival reveals a genuine overlap that needs a division-of-labour note (as this document's Release Gates table did in separating the Data & Evidence Steward's evidence-layer role from the Editorial Advisor's prose-fairness role).

Plausible future candidates, named here so they're not re-litigated from scratch when proposed: an **Accessibility Specialist** (certified-conformance auditing, beyond the Civic Technology Advisor's code-observed heuristics), a **Search & Information Retrieval Advisor** (as Stickee's content volume grows, how findable is anything), a **Performance Engineer** (load time, especially for low-bandwidth/regional Australian users), a **Visual Design Advisor** (deeper typographic/print-quality review than the UX Researcher's usability lens), a **Data Science Advisor** (if Stickee ever builds real statistical forecasting models, as distinct from the current mock probability displays), a **Community & Moderation Advisor** (if user-generated content grows beyond what the Civic Technology and Legal Advisors currently cover between them), and a **Security Operations Advisor** (ongoing security posture, as distinct from the Software Architect's per-change security-boundary review). None of these exist yet — naming them is not authorisation to build them; each would go through the same four-step process above, with its own owner approval to actually create the agent file.

## Measuring Council success

Success is not measured by the number of reviews run, the number of agents that exist, or the volume of documentation produced — all three can grow while decision quality stays flat or gets worse. Success is measured by:

- Better decisions (caught earlier, cheaper to reverse)
- Higher public trust in what Stickee publishes
- Fewer regressions
- Stronger, less duplicated architecture
- Better contributor experience
- Better editorial quality
- More accurate political information
- Higher long-term maintainability

If a review process is producing more paperwork without moving any of these, that's a signal to simplify the process — not a justification for adding another agent.

---

## Sample council review — Approved

**Scope:** Page Review of a hypothetical `/methodology` page that clearly states how the (currently mock) forecast probabilities are calculated, with an explicit "Demo content — not yet backed by real markets" banner.

```
Software Architecture:      Not applicable
Product:                     Approved
Public Policy:                Not applicable
Civic Technology:            Approved
Legal and Regulatory:        Approved
Editorial:                    Approved
UX:                           Approved
Open Source:                  Not applicable
Journey and Bottlenecks:      Acceptable

Overall recommendation: Merge
```

Why: the page adds a transparency artefact (a methodology explanation) without introducing new data claims, clearly labels its content as demo rather than verified, and every invoked agent found it consistent with their standards. No blocking findings; no owner decision required beyond publishing.

## Sample council review — Blocked

**Scope:** Feature Review of a hypothetical proposal to let users "cash out" accumulated prediction points to a gift-card partner.

```
Software Architecture:      Approved with conditions
Product:                     Blocked
Public Policy:                Not applicable
Civic Technology:            Not applicable
Legal and Regulatory:        Blocked (Do not launch before legal review)
Editorial:                    Not applicable
UX:                           Approved with changes
Open Source:                  Not applicable
Journey and Bottlenecks:      Not applicable

Overall recommendation: Do not merge
```

Why: converting virtual points into redeemable real-world value is exactly the drift toward a betting/gambling product that AGENTS.md and the Product Strategist explicitly reject, and it triggers the Legal Advisor's "Do not launch before legal review" escalation for gambling-adjacent regulation. Both are hard blockers independent of the Architect's and UX's more favourable verdicts — the Chair does not average these into "mostly approved."

## Sample council review — Approved with conditions

**Scope:** Content Review of an MP profile page displaying an "approval rating" sourced from a hardcoded mock number with no citation.

```
Software Architecture:      Not applicable
Product:                     Approved with conditions
Public Policy:                Approved with conditions
Civic Technology:            Approved with conditions
Legal and Regulatory:        Approved
Editorial:                    Approved with sourcing conditions
UX:                           Approved
Open Source:                  Not applicable
Journey and Bottlenecks:      Not applicable

Overall recommendation: Merge after specified fixes
```

Why: the page's structure and usability are sound, but the approval-rating figure is currently unsourced mock data displayed as if authoritative — a P1 truthfulness issue under Editorial, Public Policy, and Civic Technology review. The specified fix (replace with "No verified data available" until a real, citable source exists, or add a visible "Demo content" label) is small and clear, so the Chair recommends "Merge after specified fixes" rather than a full block.

## Sample council review — Product Benchmark (Experiment first)

**Scope:** Product Benchmark Review studying Kalshi's transparent resolution-criteria pattern for a hypothetical Stickee forecast-page redesign.

```
Software Architecture:      Approved with conditions
Product:                     Approved with conditions
Public Policy:                Approved with conditions
Civic Technology:            Approved
Legal and Regulatory:        Approved
Editorial:                    Approved with sourcing conditions
UX:                           Approved with changes
Open Source:                  Not applicable
Journey and Bottlenecks:      Not applicable
Product Benchmarking:         Adapt

Overall recommendation: Requires owner decision
```

Why: the Benchmarking Advisor correctly separates the transferable principle (stating, in advance, exactly what evidence will resolve a forecast) from what must not be copied (Kalshi's trading-aesthetic and real-money framing) — evidence level "Established convention" (prediction markets broadly publish resolution criteria), so a recommendation stronger than "Experiment first" would be reasonable on the pattern's own merits, and this instance is scored "Adapt." But Public Policy flags that resolution criteria for a political forecast need institutional review on a case-by-case basis (some political events have genuinely ambiguous resolution, e.g. "was a bill passed" when amended versions differ), which the Benchmarking Advisor cannot resolve alone. The Chair does not let the Benchmarking Advisor's favourable "Adapt" override Public Policy's conditional approval — it surfaces the specific unresolved question (how ambiguous political resolution is handled) as an owner decision, and recommends a small experiment (one forecast page with fully-specified resolution criteria, reviewed by Public Policy before publishing) rather than a page-wide rollout.

## Sample council review — Level 1 (small change, minimal review)

**Scope:** Renaming a primary-navigation label from "Government" to "Decisions" (see the honest-labelling gap already identified in `docs/council-reviews/GOVERNMENT_PAGE_DRY_REVIEW.md`, where the "Government" nav label was found to be an interim placeholder per `src/lib/navigation.ts`'s own code comments).

This is a Level 1 change per the Release Gates table's "Navigation" row — no Product Benchmark Review, no full council, and no Council Chair synthesis step is required for a change this small; the two named reviewers report directly.

```
UX Researcher:        Approved — new label sets a clearer expectation of page contents; no comprehension risk found
Product Strategist:   Approved — aligns the nav with the page's actual content sooner than the full route-rename work in PROPOSED_ROUTE_TREE.md would otherwise land
Software Architect:   Not invoked — a label-only string change in src/lib/navigation.ts carries no structural risk; per the Release Gates table this reviewer is warranted for structural navigation changes, not a string edit
```

Why this is the right amount of review: the change is a one-line label string, fully reversible, with no data, routing, or political-claim implications — inflating this to a full council review would be exactly the bureaucracy-over-decision-quality failure mode the Council exists to avoid. If the same change also altered *where* the link pointed (not just its label), it would cross into "Navigation" territory proper and pick up the Software Architect per the Release Gates table.
