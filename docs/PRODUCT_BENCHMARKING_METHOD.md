# Product Benchmarking Method

This document defines how the **Product Intelligence & Benchmarking Advisor** ([agents/product-intelligence-benchmarking-advisor.md](../agents/product-intelligence-benchmarking-advisor.md)) researches other products and how the Council turns that research into safe, adapted experiments — never wholesale copies.

Governed by [AGENTS.md](../AGENTS.md) and the [Global Council Principles](STICKEE_COUNCIL.md#global-council-principles). See [docs/STICKEE_COUNCIL.md](STICKEE_COUNCIL.md) for the Council's governing rules and [agents/README.md](../agents/README.md) for how to invoke any agent.

---

## Purpose

Stickee doesn't need to reinvent every UI or interaction pattern from scratch, and it shouldn't reject a good idea just because another company thought of it first. But copying a product wholesale — its interface, wording, or design — both risks real legal/imitation exposure and risks quietly importing that product's values (engagement-first, betting-first, outrage-first) into a platform whose whole premise is the opposite.

This method exists to make "learn from strong products" a disciplined, evidenced, and safe practice rather than a source of cargo-cult copying or IP risk.

## Research standards

- **Public sources only.** Use publicly observable product behaviour (using the product as any member of the public could) and publicly published documentation (engineering/design blog posts, help centres, published research). Never use authenticated internal tooling, admin panels, leaked material, or anything behind a login that isn't a normal public account.
- **No scraping of restricted systems.** Do not scrape paywalled content, rate-limited APIs without authorisation, or any system whose terms of service prohibit automated collection. Manual, occasional observation of public-facing behaviour is different from automated scraping — when in doubt, don't.
- **Cite what was actually consulted.** Every pattern write-up records its sources (what was read/observed, and roughly when) in the scorecard's "Sources used" field. This isn't academic formality — it's what lets a later reviewer judge whether the evidence has gone stale (products change).
- **Describe, don't reproduce.** Write the pattern in your own words, as a principle ("the product states in advance exactly what evidence will settle an open question") rather than a copy of the product's own copy or layout.

## Copyright and imitation boundaries

These are hard boundaries, not judgement calls, per the brief and the Legal Advisor's existing IP mandate:

- Never clone another product's interface, layout, component structure, or visual design.
- Never copy proprietary wording, marketing copy, help-text, or documentation text verbatim or near-verbatim.
- Never reproduce copyrighted illustrations, icon sets, photography, or brand assets.
- Never recommend "copy this wholesale" as an adaptation — every recommendation must describe what changes and why, specifically the "what Stickee must not copy" field that's mandatory on every pattern entry.
- Any adaptation that would require reproducing specific protected expression (not just the underlying idea) is escalated to the **Legal, Privacy and Regulatory Risk Advisor** as "Requires professional review" before further work — see `agents/legal-regulatory-advisor.md`'s existing IP/copyright mandate, which this method defers to rather than duplicates.

Ideas, product principles, and functional patterns (e.g. "show resolution criteria before an event resolves") are not, in general, protected expression in the way that specific wording, code, and visual design are — but that line is a legal judgement, not one this agent makes for itself. When genuinely uncertain, escalate rather than assume it's fine.

## Evidence classification

Every claim about why a pattern works is labelled with one of the following, from strongest to weakest. Never round up.

| Level | Meaning |
|---|---|
| Observed pattern | Directly observed the product's actual public behaviour |
| Public documentation | The product's own published design/engineering writing describes the pattern and its rationale |
| User-research evidence | A cited, real study (published by the product or independently) supports the claimed effect |
| Established convention | Adopted across multiple unrelated products, suggesting a learned user expectation |
| Plausible benefit | A reasoned hypothesis with no direct evidence yet |
| Inference | Reasoning from adjacent evidence, not direct observation |
| Unverified assumption | Explicitly flagged as unconfirmed; must never be presented as more certain than this |

A pattern is never described as "proven" unless it sits at User-research evidence or Public documentation level, and even then the specific evidence is cited, not asserted.

## Product-selection criteria

The initial benchmark set (Kalshi, Ground News, X, Wikipedia, GOV.UK, The Economist, Financial Times, Bloomberg, GitHub, Stripe, Apple, Linear, Notion, Figma, Google Maps, Duolingo) was chosen because each is a proven, widely-used product solving at least one problem structurally similar to something Stickee faces: forecasting and evidence (Kalshi), source comparison (Ground News), real-time information flow (X), citation and correction culture (Wikipedia), plain-English civic services (GOV.UK), editorial authority (The Economist, FT, Bloomberg), contribution workflows (GitHub), progressive disclosure and onboarding (Stripe, Apple, Linear, Notion, Figma), and legible information hierarchy (Google Maps, Duolingo).

To add a product to the benchmark set, it should meet at least one of:

- Solves a user problem Stickee also has, at meaningful scale and with observable success
- Has published credible design/engineering rationale for the pattern being studied
- Is frequently cited as a convention-setter in its category (so a pattern from it is more likely "established convention" than a one-off guess)

A product should **not** be added solely because it's popular, monetizes attention effectively, or is a direct competitor — none of those are evidence that a given pattern serves Stickee's mission.

## Review lifecycle

```
1. Frame the problem      → a Stickee user problem, not "copy product X"
2. Select products         → from the benchmark set, or propose an addition with rationale
3. Research                → public documentation + observed public behaviour only; cite sources
4. Extract patterns         → underlying principle, not surface UI; max 10 per review
5. Score each pattern       → full scorecard (agents/product-intelligence-benchmarking-advisor.md)
6. Route to specialists     → Public Policy / Editorial / Civic Tech / Legal / Architect as relevant
7. Council Chair synthesis  → treats findings as recommendations, not authority
8. Owner decision            → approve an experiment, defer, or reject
9. (If approved) Small experiment → measured, scoped, reversible
10. Update the pattern library → status change recorded regardless of outcome
```

This mirrors the Council's general review lifecycle in `docs/STICKEE_COUNCIL.md`, with steps 1–5 specific to benchmarking and step 10 specific to keeping the pattern library durable.

## Experiment design

Every pattern recommended above "Reject"/"Defer" needs a **smallest testable version** before any larger build:

- Scope it to the smallest surface that could validate or falsify the pattern's assumed benefit (one page, one component, one user segment — not a site-wide rollout)
- Define success metrics *before* running it, and be explicit when no analytics exist yet to measure them (see the UX Researcher's and UX Journey Analyst's evidence standards in their own agent files — the same "don't invent data" discipline applies here)
- Make it reversible — if it doesn't work, removing it should not require a schema change or leave orphaned data
- Time-box it — an experiment with no end date and no decision criteria isn't an experiment, it's a permanent feature with extra steps

## Success metrics

Because Stickee has no analytics platform described in this documentation set, most experiments will initially rely on:

- Direct observation (does the page/feature actually get used as intended, checked manually)
- Qualitative feedback (if a correction/feedback pathway exists, per the Civic Technology Advisor's mandate)
- A committed, explicit set of metrics to instrument *if and when* real analytics exist — labelled as "not yet measured," never fabricated

Any claim that an experiment "succeeded" must cite what was actually measured. If nothing was measured, the honest status is "ran, outcome not evaluated" — not a claimed success.

## Council escalation

- Political-framing patterns (source comparison, resolution criteria, claim classification) always get independent Public Policy and Editorial review before a recommendation stronger than "Experiment first."
- Copyright/imitation-risk patterns always get Legal review before any adaptation work begins.
- Participation/moderation patterns (corrections, curated lists, contribution workflows) always get Civic Technology and Legal review.
- Architectural feasibility is the Software Architect's call, not the Benchmarking Advisor's — a pattern can be a great idea and still require the Architect to say "not without a schema change we haven't scoped."
- See the cross-cutting escalation rules in `docs/STICKEE_COUNCIL.md` for how the Chair weighs a "Reject" or "Requires professional review" against other favourable findings (it never gets averaged away).

## How approved patterns enter the roadmap

An "Adopt" or "Adapt" recommendation, once cleared by the relevant specialists and the Council Chair, becomes a normal Feature Review input (see `agents/templates/feature-review.md`) — it does not skip that process. The Product Strategist places it in the standard priority order (removing misleading content → replacing fake data → unifying duplicate systems → improving sourcing → improving political accuracy → improving usability → improving contributor experience → new features, per AGENTS.md). Only after a Feature Review (and, where relevant, an Architecture Review) produces an implementation plan does the pattern proceed to actual code — with explicit owner approval, per the Council's implementation boundaries.

## How rejected patterns are recorded

Every pattern reviewed — including "Reject" and "Defer" — gets an entry in `docs/PRODUCT_PATTERN_LIBRARY.md` with its reasoning intact. A rejected pattern is not deleted from the record; its status is set to "Rejected" with the reasoning preserved, so that if the same idea resurfaces in six months, the next reviewer starts from the existing analysis instead of re-litigating it from zero. If circumstances genuinely change (e.g. a legal constraint is resolved, or Stickee's own data situation changes), a rejected pattern can be reopened — set status back to "Under review" and note why in the entry, don't silently flip it to "Adopted."

## How to avoid cargo-cult copying

Cargo-cult copying is adopting a pattern's surface form without the underlying reason it worked — e.g. adding a "Trending" badge because X has one, without X's actual signal-detection behind it. Guard against it by requiring, for every pattern, before any recommendation stronger than "Experiment first":

1. **A stated user problem**, independent of the origin product — if you can't state the problem without naming the product, you don't understand the pattern yet.
2. **A stated mechanism** — *why* the pattern solves the problem, not just that a successful product has it.
3. **An explicit "what not to copy"** — every pattern entry requires this field; a blank or trivial answer here is itself a red flag that the review hasn't separated principle from surface.
4. **A mission-fit check independent of the pattern's popularity** — "everyone does this" is evidence of "established convention," not evidence of Stickee mission-fit; these are scored separately.
5. **A real mechanism behind any displayed signal** — never add a badge, score, or social-proof element whose underlying computation doesn't exist or isn't real, regardless of how effective the pattern looks elsewhere. This is the same truthfulness principle that already governs the rest of the Council (`docs/STICKEE_COUNCIL.md`'s Global Council Principle #1) — benchmarking a pattern is never grounds for an exception to it.
