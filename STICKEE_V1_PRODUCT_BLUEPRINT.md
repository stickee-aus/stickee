# Stickee — Version 1 Product Blueprint

Governed by `AGENTS.md`. Produced by a Level 3 Stickee Governance Council review — see `STICKEE_V1_EXECUTIVE_SUMMARY.md` for the full council synthesis, approval matrix, and gating decisions this blueprint operates under. **This is a design document. No code, CSS, routes, or data were changed to produce it.**

Read alongside `docs/philosophy/STICKEE_CHARTER.md`, the canonical statement of the beliefs behind the product mission stated below (short introduction: `docs/philosophy/HOW_STICKEE_THINKS.md`) — this blueprint is that philosophy applied to a specific redesign, not a competing source of it.

This is the canonical product specification for Stickee as if Version 1 were launching today. The current implementation is treated throughout as evidence of existing features, architecture, data models, technical constraints, verified infrastructure, and known debt — never as proof that the current UX is correct. Every recommendation below distinguishes **concept worth keeping**, **implementation worth replacing**, **feature worth relocating**, and **feature worth removing** — a sound idea with a bad build is not discarded; a bad idea is not kept because it already exists.

---

## 1. Product mission

Stickee exists to help Australians:

- understand what is happening
- understand why it matters
- understand what government has done
- understand what is likely to happen next
- understand who is responsible
- understand the impact of decisions
- meaningfully participate in democracy

**Every screen's job is to reduce the work required to understand politics.** That sentence is the test every element on every page must pass. An element that doesn't reduce that work — a decorative stat, a duplicate list, a second unrelated mini-app bolted onto a page — fails the test regardless of how well-built it is.

## 2. Product identity

Stickee should feel: **modern, calm, trustworthy, serious, academic, evidence-first, structured, futuristic, database-like but readable.**

Stickee should never feel: retro, crypto, casino, betting-first, startup dashboard, government bureaucracy, social media, or five unrelated applications sharing a navbar.

This identity is not new — it is `AGENTS.md`'s constitution, restated as the test for this specific redesign. Every one of the twelve Council reviews independently applied it; see `SIMPLIFICATION_RECOMMENDATIONS.md` for the current-codebase violations found against it.

## 3. Design north star — principles, not a template

The National Design Studio tradition (GOV.UK and its peers) is instructive for what it does structurally, not for how it looks. Its actual, transferable lesson — confirmed this session by fetching GOV.UK's own published design principles and current site structure, not relied on from memory — is narrower than "copy the five-item nav": GOV.UK's real information architecture is a large, flat, 16-category task directory, not a tightly curated top nav. What genuinely transfers is the discipline underneath it: **a page states its one job in its structure, before a single word is read**, and a multi-step task is broken into one question per screen rather than several questions competing for one screen (`design-system.service.gov.uk/patterns/question-pages`).

Extracted principles, applied in Stickee's own vocabulary:

1. **One question per page.** Every top-level page and every detail page answers exactly one question, stated as its heading, not implied by its content.
2. **Simplicity is subtraction first.** Before adding a component, remove what doesn't serve the page's one question. Every specialist agent in this review defaulted to this instinct independently.
3. **Hierarchy communicates trust, not just layout.** The most prominent element on a page is its most important, verified content — not its loudest widget.
4. **Plain language over institutional jargon**, without sacrificing institutional accuracy (see Public Policy's findings in the Council review — plain language and correct terminology are not in tension when done properly).
5. **Consistency of interaction model.** One filter grammar (underline tabs, per the already-approved `CIVIC_DESIGN_SYSTEM.md`), one card grammar, one hero-stat pattern, everywhere — a reader who has learned one page has learned all of them.
6. **Obvious actions.** Every page has exactly one primary action and a small number of clearly secondary ones — never a wall of equally-weighted buttons.
7. **Accessibility as structure, not decoration.** Keyboard/focus behaviour, heading hierarchy, and honest empty states are load-bearing, not polish (Civic Technology Advisor's findings apply here directly).

**What does not transfer, and must not be copied:** GOV.UK's branding, layout, typography, colour palette, illustrations, wording, or distinctive UI. Stickee's visual language is already decided — see §4. The evidence for this section's specific claims, and the corrected finding that the five-page nav is better attributed to editorial/newsroom-section convention than to GOV.UK, are in the Product Intelligence & Benchmarking Advisor's Council findings (`STICKEE_V1_EXECUTIVE_SUMMARY.md`, Consensus C9 and Benchmarking scorecards).

## 4. Design language — already decided, not re-opened

Per `AGENTS.md` and `CIVIC_DESIGN_SYSTEM.md` Phase 0 (owner-approved 2026-08-05), this blueprint builds on, and does not re-litigate:

- **Typography:** IBM Plex Serif (headings), IBM Plex Sans (body), IBM Plex Mono (metadata/dates/identifiers/tabular values only).
- **Theme:** Light default. Warm white paper (`#FAF9F4`), not a dark trading terminal.
- **Accent:** One restrained civic accent, deep indigo (`#2E3A8C`) — never a second decorative colour.
- **Shape:** Small modern corners (~4–6px). No pill radii.
- **Elevation:** Borders before shadows. No `box-shadow` anywhere in the product-facing app.
- **Motion:** Calm — colour/opacity transitions only, no lift-on-hover, no scrolling tickers, no confetti.
- **One shared component vocabulary:** `PageShell`, `SectionHeader`, `ArticleCard`, `StatusTag`, `UnderlineFilter`, `MetaLine`, `StatHeader`, `EmptyState`, `LinkButton` (per `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` Phase 2, already built) — every page in this blueprint composes from these, none invents a new pattern.

This blueprint's job is product/content/IA design. It does not propose new visual tokens, new component patterns, or a competing design system.

## 5. The five questions — the structural spine of V1

Every top-level page exists to answer exactly one question. This five-way split was independently arrived at twice in this codebase's own history — once by `INFORMATION_ARCHITECTURE_AUDIT.md`'s Option C, once by this Council's Public Policy, Product Strategist, and Benchmarking reviews working from the mission brief alone — and the Public Policy Advisor found it the *institutionally* correct structure, not just a legible one (see Executive Summary, Consensus C9): separating executive action (Government) from the legislature's own membership (People) prevents the common civic misconception that MPs collectively are "the government."

| Page | The one question | Institutional register |
|---|---|---|
| **Today** | What is happening? | Editorial front page — dated, chronological, cross-cutting |
| **Issues** | Why is this happening? | Explainer/context — evergreen, updated when facts materially change |
| **Government** | What has government actually done? | Executive record + legislative evidence (Parliament nests here) |
| **Forecasts** | What is likely to happen next? | Participation layer, built on top of understanding |
| **People** | Who represents Australians, and what have they done? | Representation record — the whole Parliament, not just the governing party |

Full page-by-page specification: `CORE_PAGE_REDESIGN.md`. Wireframes: `LOW_FIDELITY_WIREFRAMES.md`.

### Political Pulse — placement decision

Political Pulse (the redesign of `/feed` into a chronological civic timeline) is **not a sixth primary-nav item**. Per the Product Strategist's finding (re-adding a sixth top-level destination repeats the exact "too many top-level concepts" problem the standing IA audit diagnosed) and the UX Journey Analyst's finding (Today currently has no link at all to the one system built for "what changed," which is its own defect independent of this decision): Political Pulse is **both** a compact, real-data module surfaced on Today (a "what changed" strip, sourced from the same data, not a duplicate feed) **and** its own secondary page reachable from Today and the header, for the reader who wants the full chronological record. It never competes with the five primary pages for nav real estate.

### Community — deferred, not designed for V1 launch

Per Executive Summary Owner Decision 6, Community (structured contribution of ideas, evidence, proposals, and people-nominations) is **explicitly out of V1 launch scope.** It is documented in this blueprint (§8) as a concept worth having eventually, gated on a real lawyer's review and a built moderation queue — neither exists today. Nothing in this program should be implemented in a way that forecloses it later, but nothing in V1 should promise it either.

## 6. Forecasts — kept, reframed, not removed

The brief is explicit and this blueprint honours it exactly: **forecasting is not being removed.** Australians enjoy prediction and participation, and it remains one of Stickee's defining features.

**Kept:** probability, history, virtual points, forecasting, portfolio, resolution, evidence, arguments.

**Removed:** fake urgency, fake volume, fake traders, fake leaderboards, casino styling, fabricated engagement.

**The reframe:** Forecasts becomes the participation layer built on top of understanding, not a standalone product competing with the rest of the app for attention:

```
Issue  →  Government activity  →  Evidence  →  Timeline  →  Forecast
```

A user should be able to follow this progression across real pages, not just conceptually. **This progression is currently only half-real** — the Data & Evidence Steward's review found it evidence-supportable at three of five steps (Issue, Government activity, Forecast) and broken at two (Evidence — schema exists, is populated on almost nothing; Timeline — no real table exists, `bill-stage-tracker` currently infers transitions from a hash rather than writing durable history). Building the visual promise of this progression before the underlying Timeline table exists would ship a page whose middle two steps are empty or silently approximated. See Owner Decision 2/4 in the Executive Summary; full detail in `CONTENT_HIERARCHY.md` and `IMPLEMENTATION_BATCHES.md`.

**On "engaging but not compulsive":** per Executive Summary Disagreement D1, this blueprint adopts the Product Strategist and Benchmarking Advisor's operational definition — engagement should come from *epistemic satisfaction* (a real question, resolved by real evidence) not *behavioural-loop satisfaction* (variable reward, loss-aversion, social comparison) — while flagging, unresolved, that the Legal Advisor rates the underlying mechanic (not just its styling) as requiring a real lawyer's review before any engagement-feature work is called finished. This blueprint does not pre-empt that review.

## 7. Government + Parliament — one evidence layer, correctly distinguished internally

Per the Public Policy Advisor's review, "Government" nesting Parliament under one banner is sound *if and only if* the page carries an explicit internal split between executive action (ministerial decisions, announcements, regulations) and legislative record (bills, votes, committees) — conflating the two under one undifferentiated feed would recreate, at the page-content level, exactly the institutional blur the five-page split exists to avoid at the nav level. See `CORE_PAGE_REDESIGN.md` §Government for the required internal structure.

**Government Decision** is a real, worth-keeping concept — but it is currently, per the Domain Model and this Council's own Software Architect and Data & Evidence Steward findings, not a real object: it has no source field, an incompatible ID scheme from the real `issues` table, and fabricated approval/trust scores on real named ministers baked into its type signature. This blueprint specifies the redesigned target; `IMPLEMENTATION_BATCHES.md` sequences the schema work required before it can be built on real data.

## 8. Community — the deferred concept, specified for later

Documented now so the decision to defer is deliberate, not a gap:

- **Idea/proposal submission** does not map to any existing real system. `ProposeMarketModal.tsx` is the closest precedent, and it is a cautionary one — fully decorative, never persists.
- **Evidence submission** should not get its own bespoke store. It should be the trigger to finally build the `evidence`/`citations` table the Domain Model already names as the single most consequential missing piece of Stickee's schema (Software Architect finding).
- **People-nominations** ("people they believe could improve Australia") is architecturally the Community Leader system, already real in part (`leader_supports`), already disabled once for exactly the risk this feature would reintroduce at greater severity (real people, not fictional ones).

None of these three should be built as one undifferentiated "Community" feature. If and when this is picked back up, model it on a **visible-status contribution lifecycle** (submitted → under review → accepted/declined with a stated reason) — the GitHub/Linear/Notion pattern the Benchmarking Advisor evaluated — not an open comment/reaction feed. Structured civic collaboration, never social media: no follower counts, no upvote-as-legitimacy, no public commenting on a nomination until a real, gaming-resistant mechanism and moderation capacity exist.

## 9. Non-negotiables

Carried forward from `AGENTS.md` and reaffirmed by every relevant Council agent — this blueprint does not touch, and no implementation of it should touch, without the specific gate named:

- **Verified infrastructure stays verified.** Wallet creation/staking, market eligibility, admin-only settlement, PostgREST/RLS/SECURITY DEFINER behaviour — none of this is redesigned without a specific, evidenced correctness or security defect (none was found).
- **No fabricated content, ever**, regardless of how much "more populated" it would make a page look. Every claim carries one of `AGENTS.md`'s eight classifications or doesn't ship.
- **No gambling-adjacent mechanic changes ship without a real lawyer's review** (§6, Executive Summary D1).
- **No real-person nomination or scoring feature ships without a real lawyer's review** (§8, Executive Summary D2).
- **Production is never touched by this program without explicit, per-action owner authorisation.**

## 10. How to read the rest of this blueprint

Start with `STICKEE_V1_EXECUTIVE_SUMMARY.md` if you haven't already — it carries the full approval matrix and the gates referenced throughout this document. Then:

- For the detailed spec of any single page: `CORE_PAGE_REDESIGN.md`.
- For what it should look like structurally: `LOW_FIDELITY_WIREFRAMES.md`.
- For what data backs it and how it's sourced: `CONTENT_HIERARCHY.md`.
- For how a real user's path through it changes: `USER_JOURNEY_MAPS.md`.
- For exactly what's being removed and why: `SIMPLIFICATION_RECOMMENDATIONS.md`.
- For the sequenced plan to build it: `IMPLEMENTATION_BATCHES.md`.
