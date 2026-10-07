# Responsibility Engine & Canonical Civic Graph — Design Report

**Status: Documentation only at the time this report was written. The First Implementation Batch recommended in §14 has since shipped** — see [RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md](RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md) for the mp-scorecard fix, the Evidence/Portfolio/Department schema, and the Person↔Portfolio/Issue↔Portfolio relationships actually built. Nothing was staged, committed, pushed, or deployed in either pass; production was not accessed in either pass.

Prepared per AGENTS.md's task-execution protocol. Read before/during this work: `docs/philosophy/HOW_STICKEE_THINKS.md`, `docs/philosophy/STICKEE_CHARTER.md`, `STICKEE_V1_PRODUCT_BLUEPRINT.md`, all files under `docs/architecture/`, `docs/page-audits/RESPONSIBILITY_MAP_SPEC.md`, `ISSUE_DETAIL_V1_REPORT.md`, `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`, `PEOPLE_V1_REFINEMENT_REPORT.md`, `POLITICAL_PULSE_V1_REPORT.md`, `STICKEE_V1_CROSS_PAGE_CONSISTENCY_REPORT.md`, `docs/STICKEE_COUNCIL.md`, `agents/council-chair.md`, all 17 Supabase migrations, and the relevant application source (types, mock data, DB query layers, sync routes) for every civic entity named in the task.

Five companion documents were produced alongside this report and are referenced throughout rather than duplicated:

- [docs/architecture/CANONICAL_CIVIC_GRAPH.md](docs/architecture/CANONICAL_CIVIC_GRAPH.md)
- [docs/architecture/RESPONSIBILITY_ENGINE.md](docs/architecture/RESPONSIBILITY_ENGINE.md)
- [docs/architecture/CANONICAL_ID_STRATEGY.md](docs/architecture/CANONICAL_ID_STRATEGY.md)
- [docs/architecture/CIVIC_EVENT_MODEL.md](docs/architecture/CIVIC_EVENT_MODEL.md)
- [docs/architecture/EVIDENCE_PROVENANCE_MODEL.md](docs/architecture/EVIDENCE_PROVENANCE_MODEL.md)

---

## Pre-existing state noted before this task began

`git status` at the start of this task showed a large number of already-modified files (a navigation/home-page redesign in progress across most of `src/app` and `src/components`, plus `AGENTS.md` itself). None of this pre-existing work was touched, staged, or referenced as if it were part of this task's output. This report and its companion documents are new files only.

---

## 1. Current duplicated models

Full detail in [CANONICAL_CIVIC_GRAPH.md](docs/architecture/CANONICAL_CIVIC_GRAPH.md) §2. Summary of the costliest duplications found:

1. **Issue vs. Bill vs. Decision** — three overlapping "government is considering X" models. `issues` (real, uuid-adjacent text PK) and the mock `Decision` type (own id scheme, own status enum, primary consuming page already retired) are the clearest case; `BillVoteRow` (mock, House and Senate copies with different fabricated numbers) is a third, coexisting with real TVFY-derived bill data on `/parliament`.
2. **Vote (mock) vs. `member_votes` (real)** — a fully duplicated concept: the mock version assigns every MP of a party the same vote (party-line fabrication) and was already pulled from `/mp/[id]` for truthfulness; the real per-MP version exists in `member_votes` but is unwired to that page.
3. **Four MP identifier schemes** (`mp-*`, `house-live-*`/`senate-*`, `tvfy-*`, and a disconnected `mp-<surname>` namespace) — detailed in [CANONICAL_ID_STRATEGY.md](docs/architecture/CANONICAL_ID_STRATEGY.md) §1.
4. **Three independent electorate-name→MP maps**, three party-colour maps, two party-normalisation functions, three separately-declared state/territory type unions.
5. **`IssueMarket` vs. `PredictionMarket`** — two shapes for one concept, bridged by a mapper rather than unified.
6. **Civic Pillar / Indicator tables** (`pillar_metrics`, `pillar_time_series`, `pillar_scores`) — real schema, confirmed by grep to be queried by **zero** application code; every rendered civic indicator comes from a mock file whose own header says it "simulates" the data.

## 2. Canonical object list

Full 23-row audit table in [CANONICAL_CIVIC_GRAPH.md](docs/architecture/CANONICAL_CIVIC_GRAPH.md) §2, re-verified against the current codebase rather than solely against the earlier `DOMAIN_MODEL.md` audit. Headline finding: **Minister, Department, Committee, Portfolio, Election, Saved Topic/Watchlist, and a general-purpose Evidence/Citation record do not exist in any form** — no table, no TypeScript type, prose only (or, for Committee, literally zero references anywhere in the codebase outside narrative bio strings). This is the concrete gap the Responsibility Engine exists to close, independently confirmed across four previously-separate documents (DOMAIN_MODEL.md, FUTURE_SYSTEMS.md, RESPONSIBILITY_MAP_SPEC.md, CIVIC_ACTION_MODEL.md) plus this audit's own re-verification.

## 3. Canonical ID strategy

Full design in [CANONICAL_ID_STRATEGY.md](docs/architecture/CANONICAL_ID_STRATEGY.md). Core decision: **one Stickee-issued canonical id per entity type** (`people.id`, `electorates.id`, `parties.id`), with a typed **external-id mapping table per type** (not one polymorphic table for everything — rejected for loss of FK integrity) recording every external identifier ever seen, with a source, a validity range, and who/what asserted the mapping. `tvfy_id` (already real and stable) becomes the trusted anchor for people while they're sitting federal parliamentarians, but the canonical id must outlive that anchor (a person who leaves and re-enters parliament, or becomes a Minister, keeps the same `people.id`). `house-live-*`/`senate-*` are deleted outright, not migrated — they were never identity, only a rendering artifact of a failed join. A separate, more urgent finding: `mp-scorecard.ts` currently joins real MP data to human user accounts by exact-match on a user-editable display-name field — flagged in §11 (Migration risks) as higher priority than the cosmetic id cleanup.

## 4. Relationship model

Full design in [RESPONSIBILITY_ENGINE.md](docs/architecture/RESPONSIBILITY_ENGINE.md) §2. Every relationship (Issue→level, Issue→portfolio, Portfolio→Person, Portfolio→Department, Bill→Division, Division→member vote, Person→electorate, etc.) is modelled with explicit direction, cardinality, an evidence requirement, and — where the underlying fact changes over time — `effective_from`/`effective_to`. Minister and Department attach to Issue **through Portfolio**, not as flat nullable columns on `issues`, specifically to avoid recreating the `mp_yes_count`-style bug class (a column that exists, looks authoritative, and nothing keeps current) and because a reshuffle should update one row, not every Issue referencing that portfolio.

## 5. Responsibility taxonomy

Seven distinct relationship kinds, per Charter §10: **authority, responsibility, implementation, oversight, scrutiny, influence, representation.** Full definitions and a worked example (housing affordability — nine actors, six kinds, three levels of government, with the RBA deliberately modelled as *influence* rather than *authority/responsibility* given its statutory independence) in [RESPONSIBILITY_ENGINE.md](docs/architecture/RESPONSIBILITY_ENGINE.md) §1 and §4. Enforced structurally, not just by convention: no query path may collapse the set to a single "most responsible person," and no relationship carries a numeric weight or score — there is no column for one.

## 6. Evidence/provenance model

Full design in [EVIDENCE_PROVENANCE_MODEL.md](docs/architecture/EVIDENCE_PROVENANCE_MODEL.md). Reuses the Charter's existing 8-way classification (`verified_fact` / `sourced_analysis` / `forecast` / `community_opinion` / `ai_generated_interpretation` / `disputed_claim` / `demo_content` / `unknown_no_verified_data`) as the `Evidence.classification` column, rather than inventing a parallel taxonomy. Evidence attaches to relationships (and to individual object fields) via a many-to-many `EvidenceLink`, mirroring the pattern already correctly implemented for `issue_markets.resolution_source`. No numeric confidence score — confidence is expressed as classification plus a human-readable note, consistent with the existing ban on fabricated-precision numbers (MP scores, influence percentages). A source map (§5 of that document) names likely authoritative sources per domain (Parliament, AEC, ministerial roles, Cabinet, departments, committees, budget, ABS, RBA, Treasury, state, local) and flags which require Legal/Regulatory review (primarily: scraping terms-of-use for APH bill/committee pages) before any ingestion work is scoped.

## 7. Temporal/history model

Full design in [RESPONSIBILITY_ENGINE.md](docs/architecture/RESPONSIBILITY_ENGINE.md) §6. Time-sensitive relationships never get updated in place — a reshuffle sets `effective_to` on the old row and inserts a new one, never an `UPDATE`. Five timestamp fields distinguish real-world change from Stickee's awareness of it: `effective_from`, `effective_to`, `observed_at`, `source_published_at`, `retrieved_at`. Votes and divisions are append-only by nature already; a correction supersedes rather than overwrites (`Evidence.superseded_by_id`).

## 8. Civic event recommendation

Full evaluation in [CIVIC_EVENT_MODEL.md](docs/architecture/CIVIC_EVENT_MODEL.md). Political Pulse (`feed_posts`, filtered to four verified agents, no mock fallback, existing content-type admission gate) is the strongest working precedent for an event layer and should not be redesigned from scratch. Recommendation, evaluated rather than assumed: **build a new, cleanly-typed `civic_events` table (Option B) rather than extending `feed_posts` in place (Option A)**, because `feed_posts` has already accumulated untyped polymorphic reference columns (`linked_bill_id`/`linked_decision_id`/`linked_leader_id`/`linked_electorate`, none FK'd) and a mixed-meaning `author_id` column — extending it further compounds a pattern rather than fixing it. Political Pulse should become a *reader* of `civic_events`, not maintain a separate store. This recommendation is **provisional pending Software Architect and Data & Evidence Steward sign-off** (see Council Review, §Council below) and is not scheduled in the Minimum V1 or First Implementation Batch — it is a direction, not committed work.

## 9. Minimum V1 schema

Verified against the four named pages rather than assumed. What's actually load-bearing:

| Page | What's currently blocked | What Minimum V1 unblocks |
|---|---|---|
| **Issue Detail** (`ISSUE_DETAIL_V1_REPORT.md`) | Explicitly did *not* ship a Responsibility Map because `issues` has no `level`/`portfolio`/`minister`/`department`/`committee` relationship — shipped an honest "not yet verified" sentence instead | `Issue → Portfolio` relationship + `Portfolio → Person` (Minister) + `Portfolio → Department`, each evidence-linked, makes the RESPONSIBILITY_MAP_SPEC.md issue/bill template buildable for real, for the first time |
| **Government** (`GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`, `docs/page-audits/GOVERNMENT_PAGE_AUDIT.md`) | Executive government (PM, Cabinet, ministers, departments) explicitly out of scope — page states this outright | Same Portfolio/Department/Minister entities let a real, evidence-linked "who holds this portfolio, what department administers it" listing exist, replacing the current explicit disclaimer |
| **People** (`PEOPLE_V1_REFINEMENT_REPORT.md`) | MP profile has no ministerial/portfolio attribution at all ("No portfolio, ministerial, or department responsibility is implied... none exists for any MP today") | `Person → Portfolio` (time-ranged) makes a real "this MP is also the Minister for X, since [date]" line possible, sourced |
| **Political Pulse** | No blocker from this design specifically — Pulse's existing four-agent model is untouched by Minimum V1 | A future `minister_appointed` CivicEvent type becomes possible once `civic_events` exists (§8), but this is explicitly **not** part of Minimum V1 |

**Minimum V1 is therefore:** the Evidence/Citation schema (foundational — nothing else can be shown as verified without it) + Portfolio + Department + `Person→Portfolio` (time-ranged) + `Portfolio→Department` (time-ranged) + `Issue→Portfolio`, each evidence-linked. **Committee is explicitly excluded from Minimum V1** — no authoritative machine-readable source was identified in this audit (see EVIDENCE_PROVENANCE_MODEL.md §5), and building an entity with no real ingestion path would only recreate the pattern this whole design exists to end (a column that exists and looks authoritative but nothing populates it). The `civic_events` migration is also excluded from V1 — Political Pulse already works, and forcing that migration into the same batch as the Responsibility Engine's first real schema increases blast radius for no V1-page benefit.

This confirms, with verification rather than assumption, that the task brief's own guess at Minimum V1 (§9: "Issue → level → responsible portfolio → minister → department → related bill/committee → evidence") was close but slightly too large — **committee** should be deferred, and **level of government** (Federal/State/Local) can likely be inferred cheaply from Portfolio without its own relationship type, since Australian portfolios are level-specific by construction (a decision for the Software Architect/Product Strategist, not asserted here as settled).

## 10. Future extensions

Evaluated, not committed: promises/commitments tracking, inquiries, corrections-as-a-visible-feature, implementation-status tracking, and public accountability records. All of these are **queries over the relationship graph plus the CivicEvent stream**, once both exist — Charter §10's 11-component accountability record (responsible-for, committed-to, decisions made, evidence, outcomes, criticism, response, inquiries, corrections, current status) becomes a *view*, not a hand-maintained document, which is the main long-term architectural payoff of this design. Explicitly **not** part of any future extension: a numeric accountability score, a "what they did wrong" list, or anything that would violate Charter §10's ban on collapsing a fair record into blame. Local council coverage (500+ councils, no unified feed) and state-government coverage (8 separate sources) are named as real future scope but are not sequenced here — they require their own source-mapping work first.

## 11. Migration risks

Ranked by severity, not by document order:

1. **`mp-scorecard.ts`'s name-matching join against `user_profiles.display_name`** (a real, user-editable field) is a live correctness/privacy risk today, independent of whether the Responsibility Engine is ever built — a real user could collide with an MP's name and have their `civic_score` silently overwritten. This should be treated as its own, smaller, urgent fix rather than bundled into the larger ID-reconciliation batch — see §14.
2. **Historical backfill of ministerial/portfolio data is manual/editorial**, not a sync job (no machine-readable AAO source was identified). This is an ongoing maintenance cost, not a one-time migration cost — an owner decision (§13) about whether that ongoing burden is accepted is a precondition for building Minimum V1 at all.
3. **The Issue/Bill/Decision merge** (named repeatedly as the highest-priority pre-existing duplication) is **not** part of this design and should not be conflated with it — but Minimum V1's `Issue → Portfolio` relationship is easiest to build cleanly *after* that merge, since it removes the ambiguity of which of three overlapping id schemes a Portfolio relationship should point at. Building Minimum V1 before the merge is possible but means re-pointing the relationship once the merge lands — an explicit, bounded, and acceptable rework, not a blocker.
4. **New tables mean new RLS policies.** Per AGENTS.md, any RLS/PostgREST change requires real-database verification before being treated as safe — this applies to every new table in this design (Evidence, EvidenceLink, Portfolio, Department, person_external_ids, electorates, Relationship), even though none of them touch wallets, staking, or settlement. Static schema review in this report is not a substitute for that verification.
5. **`civic_events`, if pursued, requires a migration/retirement decision for `feed_posts`** — a live table with four production agents writing to it and one page reading from it. This is the highest-blast-radius piece of the whole design and is explicitly not scheduled in the first implementation batch (§14) for that reason.

## 12. Professional-review gates

- **Legal/Regulatory:** scraping terms-of-use for Australian Parliament House bill-tracker and committee pages, before any ingestion job is built against them (EVIDENCE_PROVENANCE_MODEL.md §5).
- **Legal/Regulatory:** publishing accountability records about real, named political figures carries inherent defamation-adjacent risk even when every individual claim is sourced and neutrally framed — the Legal Advisor should review the *aggregate* presentation (an accountability record page, once buildable) before it ships, not just individual claims in isolation. Flagged here as a gate for a later implementation review, not resolved in this document.
- **Public Policy/academic:** machinery-of-government classification correctness (which body sits in "authority" vs. "implementation" vs. "oversight" for a given portfolio) is a real institutional-accuracy question that benefits from expert review before the taxonomy is applied at scale, not just for the RBA example worked through in this report.
- **No real-database verification was performed or is claimed** — this is a design task; any schema in these documents requires the standard AGENTS.md real-Postgres/Supabase verification before being treated as production-ready, same as any other schema change.

## 13. Owner decisions required

Listed separately from findings, per this repo's own Council convention:

1. **Sequencing** — does Minimum V1 (Portfolio/Department/Minister/Evidence) proceed before, after, or in parallel with the pre-existing Issue/Bill/Decision merge? (§11.3)
2. **Ongoing editorial burden** — is manual/editorial entry of ministerial and department data (backed by cited AAO documents, since no API exists) an acceptable ongoing cost? This is not a one-time migration; it recurs on every reshuffle.
3. **`civic_events` direction** — accept the Option B recommendation (new table, `feed_posts` becomes a read-model over it) as the eventual direction, even though it's not scheduled now? Or keep `feed_posts` as the durable event store and revisit later? (CIVIC_EVENT_MODEL.md §3)
4. **Committee** — defer indefinitely (current recommendation, given no source), or invest specifically in finding/confirming an authoritative source before deciding?
5. **`mp-scorecard.ts` fix priority** — treat the name-matching join as an independent, urgent fix now, decoupled from the broader ID-reconciliation timeline? (Recommended: yes — see §14.)
6. **State/local government scope** — confirmed out of scope for the foreseeable future, or worth scoping a source-discovery pass now?
7. **Legal review timing** — commission the scraping-terms-of-use and accountability-record-presentation reviews now (ahead of any implementation), or gate them at the point each specific ingestion/feature is actually proposed?

## 14. Recommendation for the first implementation batch

**Implemented — see [RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md](RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md).** Items 1–4 below shipped as written; item 5 remains correctly deferred.

Smallest, safest, most reversible first — this is a recommendation for a future, separately-approved implementation plan, not authorisation to start building:

1. **Fix the `mp-scorecard.ts` name-matching join** (§11.1). Small, isolated, addresses a real correctness/privacy defect, requires no new schema, and is valuable regardless of any other decision in this report.
2. **Evidence/Citation schema** (EVIDENCE_PROVENANCE_MODEL.md). Foundational — already ranked #1 in `FUTURE_SYSTEMS.md`'s independent sequencing, and nothing else in this design can be shown as verified without it.
3. **Portfolio, Department, and the time-ranged `Person→Portfolio`/`Portfolio→Department` relationships**, each evidence-linked from day one (not backfilled later) — this is Minimum V1's core and directly unblocks Issue Detail, Government, and People per §9.
4. **`Issue → Portfolio`** relationship wiring on top of (3), enabling the first real (not generic-civics-only) RESPONSIBILITY_MAP_SPEC.md block on `/issue/[id]`.
5. **Everything else** — Committee, `civic_events`, the Issue/Bill/Decision merge, state/local government coverage, promises/accountability views — is deliberately **not** in this first batch. Each requires its own owner decision (§13) and, in several cases, a real source before it can be scoped honestly.

---

## Council Review

Per the task's explicit instruction, a focused Level 3 review (this is major data-architecture work, per `docs/STICKEE_COUNCIL.md`'s Level 3 criteria) was run using this repository's own Governance Council structure and agent mandates (`agents/*.md`, `docs/STICKEE_COUNCIL.md`), scoped to the eight roles the task named: Software Architect, Public Policy Advisor, Civic Technology Advisor, Data & Evidence Steward, Historian, Legal/Privacy Advisor, Product Strategist, and Council Chair. Each reviewed the design independently before synthesis, per this repo's Independent Review Principle.

### Software Architect — Approved with conditions

The three-table-family approach to canonical ids (§4 of CANONICAL_ID_STRATEGY.md) correctly avoids both extremes — a single under-typed polymorphic table, and N bespoke tables with no shared pattern. Routing Minister/Department through Portfolio rather than flat columns on `issues` is the right call and matches the `mp_yes_count` lesson this codebase already learned once. Conditions: (1) the `civic_events` Option B recommendation must not be scheduled until a real migration/retirement plan for `feed_posts` is written and reviewed separately — CIVIC_EVENT_MODEL.md already defers this correctly, and that deferral should hold; (2) every new table needs RLS policy design reviewed and verified against real Postgres before merge, per AGENTS.md, no exception for the fact that these tables are civic-data rather than financial.

### Public Policy and Political-Science Advisor — Approved with conditions

The seven-kind responsibility taxonomy (authority/responsibility/implementation/oversight/scrutiny/influence/representation) is institutionally sound, and the housing-affordability worked example correctly keeps the RBA out of "authority/responsibility" given its statutory independence — this is exactly the kind of distinction a less careful design would collapse. Condition: machinery-of-government classification (which body is "implementation" vs. "oversight" for a given portfolio) is genuinely contestable in edge cases and should get real academic review before the taxonomy is applied at scale, not just asserted correct from this report's single worked example (flagged already in §12 — this office affirms that gate is necessary, not optional).

### Civic Technology and Open-Government Advisor — Approved

The design correctly treats "no confirmed machine-readable source" as a reason to defer (Committee, state/local government) rather than a reason to approximate. The source map (EVIDENCE_PROVENANCE_MODEL.md §5) is honest about which domains genuinely lack public APIs today (ministerial/Cabinet data, committees, budget measures) versus which have real structured access (ABS, RBA, AEC boundaries, TheyVoteForYou). No transparency concerns; this design increases the platform's ability to disclose *why* a fact isn't shown, which is itself a transparency improvement over the current silent gaps.

### Legal, Privacy and Regulatory Risk Advisor — Professional review required (scoped, not blocking this document)

Two items require professional review before implementation, not before this document: (1) APH bill-tracker/committee-page scraping terms-of-use, before any ingestion job touches them; (2) the aggregate presentation of a real person's accountability record — even fully sourced and neutrally framed, a page that compiles "everything a real, named politician is responsible for, has committed to, and has been criticised for" is exactly the kind of aggregated public-figure content that benefits from a real lawyer's read before it ships, distinct from reviewing each individual sourced claim. Neither item blocks this design *document* — both are correctly already flagged in §12 as pre-implementation gates, which this office confirms are appropriately scoped (not over- or under-inclusive).

### Editorial and Parliamentary Research Advisor — Not invoked

Not named in the task's eight-role scope; no editorial/sourcing-tone content was produced in this pass (the documents are schema/architecture, not published claims), so this reviewer's domain wasn't touched. Noted per the Chair's obligation to record gaps against the full twelve-agent Level 3 roster explicitly, rather than silently treating an eight-agent review as complete.

### Product Strategist — Approved with conditions

Minimum V1's re-scoping (dropping Committee and full `level`-of-government relationships from the task brief's own guess) is the right instinct — it matches this repo's established pattern of shipping the smallest honest thing rather than the largest plausible thing. Condition: sequencing against the Issue/Bill/Decision merge (§13, Owner Decision 1) is a real product-priority tradeoff this office cannot resolve alone — both are legitimate "do this first" cases, and the report correctly surfaces it as an owner decision rather than picking one.

### Data & Evidence Steward — Approved with conditions

This is the correct order of operations: Evidence/Citation schema first (§14, item 2), before any relationship that depends on it. The reuse of the Charter's existing 8-way classification, rather than a new taxonomy, is exactly right — a second classification scheme would itself have been a duplication this design should be catching, not creating. Condition: the ongoing editorial burden of manual ministerial/portfolio data entry (Owner Decision 2) needs a real answer before Minimum V1 is built, not after — an Evidence-linked relationship with no realistic maintenance plan behind it will go stale exactly the way `mp_yes_count` did, silently.

### Historian and Knowledge Preservation Advisor — Approved

The append-only correction model (EVIDENCE_PROVENANCE_MODEL.md §4) and the never-overwrite temporal model (RESPONSIBILITY_ENGINE.md §6) directly satisfy this office's standing requirement: no design in this report destroys the only record of a past political fact. The explicit rule that a reshuffle inserts a new row rather than updating the old one is exactly the pattern this office would otherwise have to demand as a condition — it is already present unprompted.

### Council Chair — Synthesis

**Consensus findings:** Evidence-first sequencing (Data & Evidence Steward, Software Architect, Product Strategist all independently converge on this); Portfolio-as-intermediate-entity over flat Minister/Department columns (Software Architect, Data & Evidence Steward); defer-rather-than-approximate for unsourced domains, specifically Committee (Civic Technology Advisor, Public Policy Advisor, Data & Evidence Steward all independently affirm).

**Disagreements:** None found to be irreconcilable. The closest is a difference in emphasis, not fact: Software Architect treats the `civic_events` migration risk as primarily an architectural/blast-radius concern, while the Product Strategist's framing (not directly stated but implied by "smallest honest thing") would weigh it more on user-facing value delivered per unit of risk. Both land on the same recommendation (defer), so this is not surfaced as a genuine disagreement requiring owner adjudication.

**Blocking risks:** None found in the *design* itself. Two pre-implementation gates exist and are correctly scoped, not blocking this document: Legal Advisor's scraping-terms and accountability-page reviews (§12), and the standard AGENTS.md real-database RLS verification requirement that applies to any future schema work regardless of domain.

**Owner decisions required:** All seven listed in §13, unchanged by Council review — none were resolvable by any single agent, correctly.

**Roster gap noted:** this review used the task's requested eight-role subset, not the full twelve-agent roster `docs/STICKEE_COUNCIL.md` specifies for a Level 3 review (the Editorial and Parliamentary Research Advisor, UX Researcher, UX Journey and Bottleneck Analyst, and Product Intelligence & Benchmarking Advisor were not invoked). For a documentation-only design review with no UI or published-copy surface yet, this is a reasonable scope-down — but a future review of the *implementation* (once Minimum V1 has actual pages/copy) should include Editorial and UX Researcher at minimum, since RESPONSIBILITY_MAP_SPEC.md's plain-language rendering rules are exactly their domain.

**Overall recommendation: Requires owner decision.**

Not because any agent found a blocking defect in the design — none did — but because the design correctly surfaces seven real product/priority/scope tradeoffs (§13) that are the owner's to make, not the Council's or this report's to assume. The design itself (the five companion documents) is ready to stand as the reference architecture once those decisions are made; it does not need rework contingent on any single owner decision's outcome, since each decision changes *sequencing and scope*, not the underlying model.

**Implementation order (if proceeding, after owner decisions):** As listed in §14 — the `mp-scorecard.ts` fix first (independent of everything else), then Evidence/Citation, then Portfolio/Department/Minister relationships, then Issue→Portfolio wiring, with Committee/`civic_events`/the Issue-Bill-Decision merge/state-local coverage each gated on their own owner decision and, in several cases, a confirmed source.
