# The Canonical Civic Graph

Status: **Design document. Partially implemented.** Portfolio, Department, and their evidence-linked relationships (§3, rows for Minister/Department/Portfolio) now exist as real tables (migrations 018–020) — see [RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md](../../RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md). Committee, CivicEvent, Election, and Saved Topic/Watchlist remain design-only, as does the canonical `people`/`person_external_ids` identity layer in CANONICAL_ID_STRATEGY.md (V1 referenced the existing `members` table directly instead — see that report §6 for why this was judged safe for V1's scope).

Governed by [AGENTS.md](../../AGENTS.md) and [docs/philosophy/STICKEE_CHARTER.md](../philosophy/STICKEE_CHARTER.md) §17 ("Knowledge on Stickee is connected as a graph, not filed away as isolated pages"). This document defines the target *object* layer of that graph — the entity types, their canonical identity, and their real-vs-missing status today. Relationship semantics (direction, cardinality, evidence requirement) live in [RESPONSIBILITY_ENGINE.md](RESPONSIBILITY_ENGINE.md); identifier mechanics live in [CANONICAL_ID_STRATEGY.md](CANONICAL_ID_STRATEGY.md); source/citation mechanics live in [EVIDENCE_PROVENANCE_MODEL.md](EVIDENCE_PROVENANCE_MODEL.md); the shared history/event stream lives in [CIVIC_EVENT_MODEL.md](CIVIC_EVENT_MODEL.md).

This supersedes nothing. [docs/architecture/DOMAIN_MODEL.md](DOMAIN_MODEL.md) and [docs/architecture/RELATIONSHIP_GRAPH.md](RELATIONSHIP_GRAPH.md) remain the accurate record of *today's* implementation and its gaps. This document is the *target* the Responsibility Engine work should converge toward, built by re-auditing the current codebase against the Charter's entity list rather than assuming DOMAIN_MODEL.md's audit (from an earlier batch) is still current.

---

## 1. What "canonical" means here

A civic object is canonical when:

1. It has exactly one identifier scheme (see CANONICAL_ID_STRATEGY.md), not several that happen to overlap in mock data.
2. It has exactly one authoritative table, not a mock array and a DB table that diverge silently.
3. Every relationship it participates in carries evidence (see EVIDENCE_PROVENANCE_MODEL.md) — a relationship without a source is not a relationship, it's a guess wearing a schema.
4. Its history is preserved, not overwritten (see RESPONSIBILITY_ENGINE.md §6, temporal model).

None of the objects below fully meet this bar today. That is the point of the audit — it says where each object currently sits against these four tests, not just whether it "exists."

---

## 2. Canonical object list

Re-verified against the current codebase (not solely against DOMAIN_MODEL.md, which predates this audit and in places is now slightly stale — e.g. it undercounts the number of active party-normalisation/electorate-matching utilities). Status column uses: **Real** (single source, DB-backed, no fabricated fields) / **Mixed** (real DB table exists alongside a mock fallback, or real data with fabricated fields mixed in) / **Mock-only** / **Not modeled** (no table, no type, prose only).

| # | Object | Current table(s) | Current ID scheme(s) | Status | Pages using it | Duplicate models |
|---|---|---|---|---|---|---|
| 1 | **Issue** | `issues` (real) + `mock-data.ts` fallback | `issues.id` (text slug) | Mixed | `/issues`, `/issue/[id]`, `/predictions` | Overlaps conceptually with Decision (#3) |
| 2 | **Bill** | Derived from `divisions`/`member_votes` (real) or `mock-parliament-data.ts`/`mock-senate-data.ts` (mock) | Real: `tvfy-<tvfy_id>`. Mock: same slug scheme as Issue | Mixed, page-dependent | `/parliament`, `BillTracker`, `PartyVotingGrid`, `HouseChamber` | House vs Senate mock copies of the same 5 bills, with different fabricated numbers |
| 3 | **Decision** (government decision/announcement) | `mock-government-data.ts` only | Own string scheme (`d-*`) | Mock-only; primary consuming page (`/decisions`) already retired to an honest empty state | `LeaderProfileDetail` only | Incompatible with Issue's id scheme and status enum |
| 4 | **MP (House member)** | `members` (real, TheyVoteForYou sync) + `mock-data.ts` (mock, House-only, real names) | 4 incompatible schemes — see CANONICAL_ID_STRATEGY.md | Mixed; `/mp/[id]` uses mock only | `/mp/[id]`, `HouseChamber`, `/leaders` | 2 party normalisers, 2 MP indexes |
| 5 | **Senator** | `members` filtered `house='senate'` (real, no state) + `mock-senate-data.ts` (aggregate counts only) | `senate-<party>-<n>` (synthetic, positional, never stable) | Mixed, per-senator identity thin | `SenateView`, `AustraliaSenateMap` | 3 party colour maps |
| 6 | **Minister / Cabinet member** | none | none | **Not modeled** | Explicitly disclaimed on `/parliament` and `/mp/[id]` | — |
| 7 | **Department** | none | none | **Not modeled** | Free text inside leader bios only | — |
| 8 | **Agency / Regulator** | none | none | **Not modeled** | Free text inside issue prose only | — |
| 9 | **Committee** | none | none | **Not modeled at all** — zero references anywhere in the codebase outside narrative bio strings | — | — |
| 10 | **Division** (parliamentary vote event) | `divisions` (real, TVFY sync) | `tvfy_id` (integer, real, stable) | Real — the one object in this list with no mock substitute; either real or absent | `parliament-watcher`, `parliament-db.ts` | none |
| 11 | **Vote** (individual member ballot) | `member_votes` (real) vs `Vote` type (mock, party-line fabrication) | Real: `(member_tvfy_id, division_tvfy_id)`. Mock: `(mpId, issueId)` | Mock version already removed from `/mp/[id]` for truthfulness; real version exists but is unwired to that page | `MPDrilldownTable` (real), removed from MP profile | Clearest full duplicate in the repo |
| 12 | **Forecast / prediction market** | `issue_markets` (real, bill-category only) + `mock-market-data.ts` (civic/election/mp-vote categories, always mock) | `issue_markets.issue_id` (text, FK-enforced) | Mixed, explicitly labelled `'demo'` status where no real backing row exists | `/predictions`, `StakeModal` | `IssueMarket` vs `PredictionMarket` shapes |
| 13 | **Forecast resolution / settlement** | `issue_markets.outcome/resolved_by/resolved_at/resolution_source`, `wallet_positions.status/payout` | n/a (DB columns) | **Real** — atomic, admin-gated, idempotent (`resolve_market()`) | `/admin/markets` | none |
| 14 | **Political Pulse / civic event** | `feed_posts` filtered to 4 verified agent ids | `feed_posts.id` (text slug) | Real or empty — no mock fallback exists | `/feed` | Coexists with a separate mock `FEED_POSTS` array used by a different feed-ranking path over the same table |
| 15 | **Evidence source / citation** | none general-purpose; only `issues.source_url`, `pillar_metrics.source` (unqueried table), `issue_markets.resolution_source` (real, used) | none | **Not modeled** as a general entity — "the most consequential missing piece" per DOMAIN_MODEL.md, independently confirmed | `EvidenceBlock`/`MetadataLine` (presentation only, no backing table) | — |
| 16 | **Electorate** | no table; `members.electorate` (real string) + `ELECTORATE_MP_MAP` (mock) + coarse hash-based user lookup | plain name string | Mixed; MP-side real when synced, user→electorate resolution explicitly a guess | `useElectorate`, `BillCampaignCard` | 3 independent electorate-name→MP maps |
| 17 | **State/Territory** | no table; `au-senate-states.ts` geometry (real) + `MP_STATES` (mock, unverified) | 3 separately-declared 8-value unions | Structure real, per-member assignment mock/absent | `SenateView` | 3 duplicate type unions |
| 18 | **Party** | no table; `members.party` (real when synced) + hardcoded colour/short-name maps | canonical `Party` union + escape hatch | Affiliation real, entity metadata (colour, display name) hardcoded, not a row | Ubiquitous | 2 normalisers, 3 colour maps |
| 19 | **Civic action / bill pressure** | `bill_pressures` (real) | `(bill_id, user_id\|session_id)` | Real action, but displayed aggregate = real count + hardcoded mock baseline added together | `CampaignModal`, `BillCampaignCard` | Separate, unrelated `/campaigns` page reuses the word "campaign" for pure mock UI |
| 20 | **Timeline event** | none; nested `TimelineEvent[]` inside mock `Decision` only | none | **Not modeled** as a durable table. `bill-stage-tracker` detects real stage transitions but posts a feed alert rather than writing to a queryable timeline | `Decision.timeline` (dead, page retired) | Parallel to `BillStageTimeline.tsx`'s own separately-hardcoded stage progression |
| 21 | **Election** | none persisted | n/a | **Not modeled** — live AEC scrape is stateless pass-through, no `elections` table | Live election surface | — |
| 22 | **Saved topic / watchlist** | `user_follows` (real, but follows *users*, not issues/MPs/pillars) | n/a | **Not modeled** for civic objects | — | — |
| 23 | **Civic Pillar / Indicator metric** | `pillar_metrics`, `pillar_time_series`, `pillar_scores` (real tables) — but **zero application code queries any of them** | uuid | Schema real and unused; everything rendered comes from `mock-civic-data.ts`, whose own header says it "simulates" the data | `/impact`, `CivicScorecard`, `WeeklyReportCard` | — |

---

## 3. Objects the Responsibility Engine must introduce or formalise

Cross-referenced independently by DOMAIN_MODEL.md, FUTURE_SYSTEMS.md, RESPONSIBILITY_MAP_SPEC.md, and CIVIC_ACTION_MODEL.md — this convergence across four separately-authored documents is itself evidence these are the right gaps, not a novel claim invented for this task:

- **Minister** — a role occupied by a Person over a time range, distinct from "is an MP."
- **Department** — a normalized entity, not a free-text label.
- **Committee** — does not exist in any form today.
- **Portfolio** — the *area of responsibility* a Minister holds (e.g. "Housing," "Treasury") — currently conflated informally with "Department" in prose; the Responsibility Engine must keep these separate, because one minister can hold a portfolio spanning parts of several departments, and portfolios are reshuffled far more often than departments are renamed.
- **Evidence / Citation** — a general-purpose, polymorphic source-attribution record.
- **Timeline Event** (superseded in this design by **CivicEvent**, see CIVIC_EVENT_MODEL.md — do not build both).

The Responsibility Engine's Minimum V1 (§9 of the design report) does **not** require building all of these immediately — see that section for what's actually load-bearing for the four target pages.

## 4. Objects explicitly out of scope for this design

- **Committee** membership rosters and hearing transcripts — real gap, but no authoritative machine-readable Australian source has been identified in this pass (see EVIDENCE_PROVENANCE_MODEL.md §5, source map). Do not schedule until a source is confirmed.
- **Local council** decisions — over 500 councils, no single feed; explicitly named as a professional-review-gated future scope, not V1.
- **Promises / commitments tracking** — addressed conceptually in the design report's §10 (Future Accountability) but not schemed here; it depends on Evidence + CivicEvent existing first.

## 5. Relationship inventory (summary — full semantics in RESPONSIBILITY_ENGINE.md)

The Charter (§17) names the mission-level edge set: *Issues, promises, decisions, bills, votes, people, portfolios, departments, committees, agencies, evidence, timelines, forecasts, outcomes, civic actions.* Restated as directed edges, deduplicating Decision into Issue (see RESPONSIBILITY_ENGINE.md §0 for why):

```
Issue        --level-of-government-->   {Federal, State, Local}
Issue        --portfolio-->              Portfolio
Issue        --bill-->                   Bill
Issue        --committee-->              Committee            (0..n, evidence-gated)
Issue        --regulator-->               Agency               (0..n, evidence-gated)
Bill         --chamber-->                 {House, Senate}
Bill         --division-->                Division             (0..n)
Division     --member-vote-->             (Person, VoteValue)  (1..n)
Portfolio    --held-by-->                 Person               (time-ranged: Minister)
Portfolio    --department-->              Department           (0..n, time-ranged)
Person       --electorate/state-->        Electorate | State
Person       --current-role-->            Role                 (time-ranged: MP, Senator, Minister, ...)
CivicEvent   --about-->                   <any civic object>
Evidence     --supports-->                <any relationship or claim>
```

Every edge in this list requires, at minimum, an `effective_from` and a `source_id` before it may be rendered publicly as anything stronger than "Unverified" per the Charter's 8-way classification. See RESPONSIBILITY_ENGINE.md §3 for the per-relationship table (cardinality, evidence requirement, historical-preservation rule).

## 6. Non-goals of this document

- Does not propose SQL. Column-level schema belongs to an implementation plan, gated on owner approval per AGENTS.md.
- Does not resolve the Issue/Decision/Bill merge (`DOMAIN_MODEL.md`'s "highest priority fix") — that merge is a *prerequisite* consumer of this graph, not part of defining it, and is called out as an owner decision in the design report.
- Does not introduce a numeric "responsibility weight" or influence score for any actor — forbidden by RESPONSIBILITY_MAP_SPEC.md and the Charter's ban on unapproved scoring methodologies.
