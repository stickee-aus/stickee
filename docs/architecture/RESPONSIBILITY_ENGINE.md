# The Responsibility Engine

Status: **Design document. Partially implemented.** The V1 Foundation batch (Evidence, Portfolio, Department, `department_portfolios`, `person_portfolio_roles`, `issue_portfolios` — migrations 018–020) shipped the `responsibility` kind of the seven-kind taxonomy below for Person↔Portfolio and a general `responsibility_kind` column for Issue↔Portfolio; Committee, `civic_events`, and the other six kinds beyond what V1 needed remain design-only. See [RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md](../../RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md) for exactly what shipped, what didn't, and why. The design below is unchanged from the original proposal — implementation followed it rather than revising it.

Governed by [AGENTS.md](../../AGENTS.md) and [docs/philosophy/STICKEE_CHARTER.md](../philosophy/STICKEE_CHARTER.md) §10 (Accountability), which this document implements rather than reinterprets. Builds on [CANONICAL_CIVIC_GRAPH.md](CANONICAL_CIVIC_GRAPH.md) and [CANONICAL_ID_STRATEGY.md](CANONICAL_ID_STRATEGY.md). Every relationship defined here requires [EVIDENCE_PROVENANCE_MODEL.md](EVIDENCE_PROVENANCE_MODEL.md)-shaped provenance before it may render publicly as anything above "Unverified."

Direct predecessor: [docs/page-audits/RESPONSIBILITY_MAP_SPEC.md](../page-audits/RESPONSIBILITY_MAP_SPEC.md), which specified the *content block* ("Who can change this?") that should appear on civic object pages, but explicitly deferred the schema question. This document answers that deferred question. It does not replace RESPONSIBILITY_MAP_SPEC.md — that document is still the correct UI/content spec once real data exists to back it.

---

## 0. Precedent this design must respect

[ISSUE_DETAIL_V1_REPORT.md](../../ISSUE_DETAIL_V1_REPORT.md) §6 documents that a prior attempt to ship a Responsibility Map on `/issue/[id]` was **deliberately not built** as a per-issue attributed table, because `issues` carries no `level`/`portfolio`/`minister`/`department`/`committee` relationship — showing generic institutional roles under a specific issue's "Who is responsible?" heading would have implied a link that didn't exist. What shipped instead: one honest "we haven't yet verified who has primary responsibility" sentence, plus a separated, explicitly-labelled "general civics, not specific to this issue" block.

This is the bar the Responsibility Engine must clear before it earns the right to show anything more specific than that: **a relationship must be real and evidenced before it is rendered as if it applies to a particular object.** Nothing in this design should be read as license to backfill plausible-sounding relationships to make pages look more complete.

## 1. Responsibility is not one field

Charter §10 names six distinct kinds of responsibility that can attach to different actors for the same outcome. The Responsibility Engine represents each as a **distinct relationship type**, never collapsed into a single `responsible_person_id` column on any object:

| Kind | Definition | Example actor for "housing affordability" |
|---|---|---|
| **Authority** | Has the formal power to make the decision | Commonwealth Parliament (for federal housing policy levers), State Parliament (for planning law) |
| **Responsibility** | Is politically accountable for the outcome, whether or not they hold direct authority | The Housing Minister, the Treasurer (for interest-rate-adjacent settings) |
| **Implementation** | Actually administers/delivers the decision once made | The relevant Department (e.g. Housing/Treasury), a state housing authority |
| **Oversight** | Monitors or reviews the decision or its administration | A parliamentary committee, the Auditor-General |
| **Scrutiny** | Publicly examines and questions the decision without formal power over it | Opposition MPs, a Senate estimates committee, the press |
| **Influence** | Can shape the outcome without deciding or administering it | The Reserve Bank of Australia (via interest rates), industry bodies, advocacy groups |
| **Representation** | Represents the affected public in the process | A local MP for their electorate, a local council for its residents |

A single issue like housing affordability legitimately has **entries in most or all seven categories, from multiple levels of government, simultaneously**. The schema must allow many-to-many, not force a ranking. This is the concrete design consequence of Charter §10's ban on "the government did this" collapse — modelled as a relationship *type* enum, not as a priority order among actors.

## 2. Core relationship model

All relationships share this shape (concrete columns are illustrative, not a migration):

```
Relationship {
  id
  subject_type, subject_id       -- the civic object the claim is about (e.g. Issue)
  responsibility_kind            -- authority | responsibility | implementation | oversight | scrutiny | influence | representation
  object_type, object_id         -- the actor (e.g. Minister, Department, Committee, level-of-government)
  effective_from, effective_to   -- null effective_to = currently in effect
  confidence                     -- see EVIDENCE_PROVENANCE_MODEL.md classification
  evidence_id[]                  -- 1..n, required, see EVIDENCE_PROVENANCE_MODEL.md
  asserted_by                    -- human editor id, or agent id + human-reviewer id for AI-assisted entries
  created_at, superseded_at      -- append-only; see §6
}
```

### Named relationship types and their cardinality/evidence rules

| Relationship | Direction | Cardinality | Evidence requirement | Effective-dated? | History preserved? |
|---|---|---|---|---|---|
| Issue → level of government | Issue → {Federal, State, Local} | 0..n (an issue can span levels) | A cited government source describing which level legislates/administers this area | No (rarely changes; if it does, yes) | Yes |
| Issue → portfolio | Issue → Portfolio | 0..n | Cited machinery-of-government listing | Yes — portfolios reshuffle | Yes, required |
| Issue → minister | Issue → Person (via Portfolio) | Derived, not stored directly (see §4) | n/a — derived from Portfolio→Person | Yes | Yes |
| Issue → department | Issue → Department | 0..n | Cited machinery-of-government listing | Yes | Yes |
| Issue → committee | Issue → Committee | 0..n | Cited committee inquiry/reference | No | Yes |
| Issue → regulator | Issue → Agency | 0..n | Cited statutory role | No | Yes |
| Issue → bill | Issue → Bill | 0..n | Direct link, Stickee-editorial (both are Stickee-native objects once merged, see design report) | No | Yes |
| Bill → chamber | Bill → {House, Senate} | 1..2 | Structural, derived from Division data | No | n/a |
| Bill → division | Bill → Division | 0..n | Real, TVFY-sourced | No | Yes (a bill can have many divisions across its stages) |
| Division → member vote | Division → (Person, VoteValue) | 1..n | Real, TVFY-sourced, already implemented | No | Yes — a vote record is never edited after the fact, only superseded by a correction record |
| Minister → portfolio | Person → Portfolio | 1..n at a time, time-ranged | Cited machinery-of-government / Cabinet announcement | Yes, required | Yes, required — a person's ministerial history is itself a public record |
| Portfolio → department | Portfolio → Department | 0..n at a time, time-ranged | Cited machinery-of-government listing | Yes, required | Yes, required |
| Person → electorate/state | Person → Electorate \| State | 1 at a time (electorate), time-ranged | Real, AEC-sourced | Yes | Yes |
| Person → current role | Person → Role (MP, Senator, Minister, ...) | 0..n concurrently (can be MP + Minister) | Real (MP/Senator via sync) or cited (Minister) | Yes, required | Yes, required |
| Event → civic object | CivicEvent → any object | n..n | See CIVIC_EVENT_MODEL.md | No (events are instants) | Append-only by construction |
| Evidence → claim/relationship | Evidence → any relationship | 1..n per relationship | Self-referential — see EVIDENCE_PROVENANCE_MODEL.md | n/a | Append-only |

### Why Minister and Department attach to Issue *through* Portfolio, not directly

A naive design gives `issues` two nullable columns, `minister_id` and `department_id`. This was considered and rejected: it re-creates the exact bug class already found and fixed once (`mp_yes_count` etc. — a column that exists and looks authoritative but nothing writes to it, and there's no way to tell a stale value from a current one). Routing through **Portfolio** as an explicit, time-ranged intermediate entity means:

- A reshuffle updates one row (`Portfolio → Person`), not every Issue that happens to reference that portfolio.
- "Who was the Housing Minister when this bill was introduced in March 2024?" is answerable by querying Portfolio→Person at that date — which the flat-column design cannot do at all, since it has no history.
- It matches how the domain actually works: an Issue is about a *policy area*, and policy areas map to portfolios, which are held by people — the indirection is not overengineering, it's the actual shape of the institution being modelled.

## 3. Responsibility ≠ blame — enforcement, not just a principle

Concretely, in addition to §1's multi-kind model, the engine enforces this at the query/rendering layer, not just by convention:

- No query path may resolve "Issue → single most-responsible person." Every read returns the full set of relationships across all seven kinds, and rendering code must show them as a set (per RESPONSIBILITY_MAP_SPEC.md's existing "plain-language role statements" rule), never collapse them to a headline name.
- No relationship carries a numeric weight, score, or ranking field. This is a hard schema constraint, not a UI convention — there is no column for it, so there is nothing for a future feature to accidentally surface. Any future "how much power does X actually have" feature requires the same methodology-review bar as `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` and is out of scope for this engine entirely.
- A person's accountability record (Charter §10's 11-component list: responsible-for, committed-to, decisions made, evidence, outcomes, criticism, response, inquiries, corrections, current status) is assembled by *querying* the relationship graph and the CivicEvent stream for that person — it is not a separate authored document that could drift from the underlying facts. This is the direct payoff of building the graph: the accountability record becomes a view, not a maintained artifact.

## 4. Worked example — housing affordability

Applying the model to the Charter's own example (§4 of the task brief):

| Actor | Relationship kind(s) | Evidence needed |
|---|---|---|
| Commonwealth Parliament | Authority (over Commonwealth Rent Assistance, NHFIC/Housing Australia, immigration settings affecting demand) | Cited legislative basis |
| State governments | Authority (over planning law, land release, stamp duty) | Cited legislative basis, per state |
| Local councils | Implementation (development approvals) | Cited local-government act reference |
| Treasury (Commonwealth) | Implementation, Influence (fiscal settings, tax concessions) | Cited machinery-of-government + budget papers |
| Housing Minister | Responsibility (portfolio-holder) | Portfolio→Person, time-ranged |
| Planning ministers (state) | Responsibility (state portfolio) | Same pattern, per state |
| RBA | Influence (interest rates, explicitly *not* Authority or Responsibility — the RBA is statutorily independent of government direction) | Cited statutory independence + published rate decisions |
| A relevant Senate committee | Oversight (if an active inquiry exists) | Cited committee reference — **only if one is actually running**; do not assert a standing oversight relationship where none currently exists |
| The local MP | Representation | Person→Electorate |

Nine actors, six distinct relationship kinds, three levels of government, one that is deliberately excluded from "Authority/Responsibility" (the RBA) because collapsing central-bank independence into "the government is responsible for interest rates" would itself be a Charter-violating factual error, not just an oversimplification. This is what "the model must allow shared responsibility" (task brief §4) looks like as actual output, not a slogan.

## 5. Claim provenance — see EVIDENCE_PROVENANCE_MODEL.md

Every relationship's `evidence_id[]` is non-empty before the relationship may be shown as anything above "Unverified" per the Charter's 8-way classification. Full model, including how disputed/corrected/inferred evidence is represented, lives in that document — not duplicated here to avoid the two documents drifting apart.

## 6. Temporal model

All time-sensitive relationships (Portfolio→Person, Portfolio→Department, Person→Electorate, Person→Role) use:

- `effective_from` (required)
- `effective_to` (nullable — null means "still in effect")
- `observed_at` (when Stickee's system or an editor first recorded this row)
- `source_published_at` (when the underlying source document was published — may predate `observed_at` significantly for backfilled history)
- `retrieved_at` (when Stickee fetched/read the source)

**Rule: rows are never updated in place when the underlying fact changes.** A reshuffle does not `UPDATE portfolio_holders SET person_id = ...` — it sets `effective_to` on the old row and inserts a new row. This is the direct implementation of Charter §9 ("corrections are never silently applied") and the task brief's "do not overwrite history" instruction. The cost is a slightly more complex "current value" query (`WHERE effective_to IS NULL`); the benefit is that "who was the Housing Minister in 2023" remains answerable indefinitely, which is a Charter-level requirement (§10's "current status" component implies the record must show status *at points in time*, not just now).

Divisions and member votes are append-only by nature already (a vote, once cast, is a historical fact) — no `effective_to` needed, only a separate **correction** record if TheyVoteForYou itself issues a correction, which supersedes rather than overwrites (see EVIDENCE_PROVENANCE_MODEL.md §4).

## 7. What this document does not do

- Does not define the CivicEvent schema in detail (see CIVIC_EVENT_MODEL.md).
- Does not define the Evidence table schema in detail (see EVIDENCE_PROVENANCE_MODEL.md).
- Does not propose which of these relationships get built first — see the design report's Minimum V1 (§9) and First Implementation Batch (§8 of the deliverables list) for sequencing.
- Does not define UI/copy — RESPONSIBILITY_MAP_SPEC.md remains the correct reference for how this data, once real, should be rendered.
