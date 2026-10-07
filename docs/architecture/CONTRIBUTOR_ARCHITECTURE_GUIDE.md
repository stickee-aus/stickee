Governed by [`AGENTS.md`](../../AGENTS.md) — read that first; this guide operationalises it for architecture-level work. Documentation only, no code changed.

# Stickee — Contributor Architecture Guide

Read this before implementing any feature, whether you're a software engineer, a designer, a policy or civics expert reviewing content accuracy, a lecturer using this codebase as a teaching example, or an open-source contributor seeing Stickee for the first time. It orients you to the rest of `docs/architecture/` and tells you which document to open for which kind of question.

## What Stickee is, in one paragraph

Stickee is becoming Australia's civic intelligence platform: a connected record of what government is doing, what's likely to happen next, and how a citizen can meaningfully participate — built to feel like a printed newspaper or parliamentary report, not a trading terminal, social network, or game. Every engineering and design decision is evaluated against that identity first (`AGENTS.md`).

Before product, editorial, AI, moderation, or civic-data work specifically, also read `../philosophy/STICKEE_CHARTER.md` — it's the canonical philosophy behind the identity this paragraph summarises (`../philosophy/HOW_STICKEE_THINKS.md` is a short introduction to it).

## How to think about the codebase

Stop thinking in pages. Think in **systems** — bounded, reusable responsibilities with one canonical data source each (14 currently exist; see `STICKEE_SYSTEM_ARCHITECTURE.md`). A page is a *composition* of systems, never a system in its own right. If you're about to write logic that could plausibly belong to an existing system, it belongs there — not in the page file you're currently editing.

## Which document answers which question

| Your question | Read |
|---|---|
| "What systems exist, and what's each one's job/health/owner?" | `STICKEE_SYSTEM_ARCHITECTURE.md` |
| "What is an Issue/MP/Market/etc., exactly, and where does it live in the schema?" | `DOMAIN_MODEL.md` |
| "How do these objects connect, and which connections are real vs. mocked?" | `RELATIONSHIP_GRAPH.md` |
| "I'm building/changing a page — what should it compose?" | `PAGE_COMPOSITION_GUIDE.md` |
| "Can I add this field/table/feature to this system? What's off-limits?" | `SYSTEM_BOUNDARIES.md` |
| "What rules should every change follow?" | `ENGINEERING_PRINCIPLES.md` |
| "What's already broken/duplicated, and in what order should it get fixed?" | `FUTURE_SYSTEMS.md` |
| "What does this term/abbreviation/table mean?" | `SYSTEM_GLOSSARY.md` |
| "What does the actual visual design system specify?" | `../../CIVIC_DESIGN_SYSTEM.md` (companion, pre-existing) |
| "What's the current per-page/per-route status (real/mock/broken)?" | `../../PAGE_AND_ROUTE_INVENTORY.md`, `../audits/FEATURE_AND_ROUTE_INVENTORY.md` (pre-existing) |
| "How does code review/governance actually work here?" | `../STICKEE_COUNCIL.md`, `../../agents/README.md` (pre-existing) |

## Before you build anything: a five-question checklist

Lifted directly from `AGENTS.md`'s engineering principles and restated as an action checklist:

1. **Does this duplicate an existing system?** Check `STICKEE_SYSTEM_ARCHITECTURE.md`'s "deliberately not listed as systems" section and `FUTURE_SYSTEMS.md`'s "already duplicated" table first — several plausible-sounding new features (a new leaderboard, a new campaign type, a new score) are things Stickee has already built once, incorrectly, twice.
2. **Is there already an implementation?** Check `DOMAIN_MODEL.md` for the object's canonical source before writing a new fixture, table, or fetch function.
3. **Can existing code be extended instead?** Check `SYSTEM_BOUNDARIES.md`'s per-system "may interact with" list — most new features are a new capability on an existing system, not a new system.
4. **Does this create unnecessary complexity?** If your feature needs a new mock-fallback path, a new wallet-like balance, or a new nav registry, stop — these are named, closed questions in this codebase, not open design space.
5. **Does this increase long-term maintenance?** If yes because it duplicates something, fix the duplication instead of adding to it, per `ENGINEERING_PRINCIPLES.md` #6–10.

## The single most important current fact to internalise

Roughly half of this app's real-feeling content is backed by static mock files imported directly into production pages, with no UI signal distinguishing "real" from "illustrative" (`docs/audits/DATA_AND_CONTENT_AUDIT.md`). This is not scattered evenly — it concentrates in the **Civic Indicator System** (home page, `/impact`) and in several silent Supabase-first-mock-fallback patterns across **Government Record**. Any new contributor's default assumption about a number, score, or claim they see rendered in the app should be "verify this against `STICKEE_SYSTEM_ARCHITECTURE.md`'s stated canonical source before trusting it," not "it's on the page, so it must be real."

## What "good" looks like here

- A new feature imports from the system's shared `lib`/component, never duplicates its logic.
- A new claim renders with a source line, or an explicit "no verified data available"/"demo" label — never bare.
- A new page's `page.tsx` is short: it composes systems, it doesn't contain business logic.
- A new score or metric has a written methodology before it ships, per the bar set in `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md`.
- A new component reaches for `CIVIC_DESIGN_SYSTEM.md`'s tokens before reaching for a shadow, gradient, or pill radius.
- A large or sensitive change (auth, wallets, settlement, RLS) ships with a real-database test, and with an explicit implementation plan reviewed before the refactor lands, per `AGENTS.md`'s workflow section.

## What "bad" looks like here (all observed at least once, and fixed or flagged)

- A second wallet, leaderboard, campaign mechanic, or navigation list.
- A UI claim of "live"/"real" sitting on top of a mock fixture.
- A per-MP or per-politician score computed from anything other than that MP's actual recorded record.
- A fallback array so complete it masks the true empty state.
- A dropped disclosure field (`source_agent_id`) that existed specifically to satisfy a trust requirement.
- A component with its own bespoke shadow/gradient/colour choice instead of the shared design tokens.

If you're about to do one of these, re-read `SYSTEM_BOUNDARIES.md` for the specific system involved before writing the code.
