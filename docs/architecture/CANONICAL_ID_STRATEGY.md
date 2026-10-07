# Canonical ID Strategy

Status: **Design document. Not implemented as a standalone `people`/`person_external_ids` migration.** The V1 Foundation batch's Person↔Portfolio relationships (migration 020) reference the existing `members.id` uuid directly instead of building this document's proposed canonical `people` table — see [RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md](../../RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md) §6 for the reasoning (every Australian Minister is a sitting parliamentarian, so `members.id` was judged sufficient for V1's scope) and its one known limitation (a former Minister who has left Parliament is out of scope until this document's broader migration happens). The `mp-*`/`house-live-*`/`senate-*`/`tvfy-*` reconciliation described below remains entirely undone — V1 did not touch it, per the task's explicit instruction to avoid a full canonical-id migration unless strictly required for safety, which it was not.

Governed by [AGENTS.md](../../AGENTS.md). Companion to [CANONICAL_CIVIC_GRAPH.md](CANONICAL_CIVIC_GRAPH.md). This document exists because the current codebase has **no single identifier per civic entity** — it has several, they collide in mock data and diverge in real data, and every attempted fix so far has been a local, silent join rather than a systemic one. Per the task's explicit instruction, this document does not propose silent string matching as the solution — it proposes removing it.

## 1. The problem, precisely

Independently confirmed by re-auditing the codebase (not just citing prior reports):

**Four incompatible person identifier schemes are simultaneously in production:**

| Scheme | Example | Origin | Stability |
|---|---|---|---|
| `mp-*` | `mp-labor-2` | Hand-authored, `mock-data.ts`, House only | Stable *within the mock dataset*, but disconnected from any real upstream id |
| `house-live-<n>` / `senate-<party>-<n>` | `house-live-3`, `senate-labor-3` | Synthesized positionally at request time in `live-parliament.ts`, whenever a live TVFY row's electorate string fails a `.toLowerCase()` match against the mock roster (House), or always (Senate — there is no mock Senate roster to match against) | **Not stable** — regenerated per request, changes if sort order or roster size changes |
| `tvfy-<tvfy_id>` | `tvfy-10029` | Wraps the real TheyVoteForYou integer person id, stored in Supabase `members.tvfy_id` | **The only genuinely stable, real, upstream-sourced id in the set** — but it is islanded: nothing joins it back to `mp-*` |
| `mp-<surname>` | `mp-albanese` | A second, unrelated informal namespace in `mock-civic-data.ts`/`mock-simulator-data.ts` | Looks like scheme 1 by coincidence of prefix; does not resolve against `MPIndex` |

Consequence: real per-MP vote history in `member_votes` cannot be safely wired into `/mp/[id]` profiles, because the page's `mp-*` id and the vote table's `tvfy_id` have no reconciling join. The one attempt to reconcile them (`live-parliament.ts`'s electorate-name match) fails silently on any electorate-name mismatch (redistribution, hyphenation, a seat the mock roster lacks) and falls back to a non-stable synthetic id with no error surfaced.

**A second class of the same problem exists for electorates** — three independent electorate-name→MP maps (`ELECTORATE_MP_MAP` in mock data, `mockHouseByElectorate` in `live-parliament.ts`, `electorateMPMap` in `parliament-db.ts`) do the same conceptual join with three different keyspaces, string-matched, no shared normalization, no AEC electorate code anywhere in the schema.

**A third site is actively dangerous, not just fragile**: `src/lib/agents/mp-scorecard.ts` joins real TVFY member records to the `user_profiles` table (real human users) by exact-match on `display_name` — a user-editable field. A real user who sets their display name to match an MP's name would have their `civic_score` silently overwritten by the cron agent. This is flagged here because a canonical ID strategy that only fixes MP↔MP joins and leaves MP↔User joins on name-matching has not actually closed the vulnerability class.

## 2. Design principle

**One canonical identity per real-world entity, with all external references stored as explicit, provenanced mappings — never inferred at read time.**

Concretely: introduce a canonical `civic_entities`-style identity per entity *type* (people, electorates, parties — not a single polymorphic table for everything, see §4 for why), and a companion **external-id mapping table** that records, for every external identifier Stickee has ever seen for that entity, which system it came from, when it was recorded, and who/what asserted the mapping.

This is the same shape decision the codebase has already made correctly in one place: `divisions`/`member_votes` key off `tvfy_id`, a real upstream id, rather than a Stickee-invented one — and Stickee's own uuid PK on those tables is a *storage* detail, not the join key. The canonical ID strategy generalises that pattern to every entity type, and closes the gap where MP identity currently has three more schemes bolted on beside it.

## 3. Canonical identity per entity type

| Entity type | Canonical id | Backing/anchor | Notes |
|---|---|---|---|
| **Person** (MP, Senator, future Minister) | `people.id` (uuid, Stickee-issued) | `tvfy_id` is the trusted external anchor while a person is a sitting federal parliamentarian | A person's canonical id must **outlive** their `tvfy_id` — someone who leaves parliament and later returns, or who becomes a Minister (a role, not a re-identification), must keep the same `people.id`. This is why the canonical id cannot simply *be* `tvfy_id`. |
| **Electorate** | `electorates.id` (AEC electorate code, where available, else Stickee-issued uuid) | AEC boundary data | Electorates are redrawn (redistribution). Historical electorate names must resolve to the electorate-*at-that-time*, not silently remap to the current boundary. See RESPONSIBILITY_ENGINE.md §6 for how time-ranging handles this. |
| **Party** | `parties.id` (Stickee-issued, one row per real party) | none external | Collapses the current 2 normalisers + 3 colour maps into one table with `display_name`, `short_name`, `colour_token` (referencing the monochrome design-token set — no party gets a distinguishing colour under AGENTS.md's monochrome rule; differentiation is typographic/positional, not chromatic). |
| **Bill / Division** | `divisions.tvfy_id` (already real and stable) | TheyVoteForYou | Already correctly implemented — the "Bill" abstraction layered over it in mock data (`BillVoteRow`) should be retired in favour of a Division-backed Bill once the Issue/Bill/Decision merge (owner decision, see design report) happens. |
| **Issue** | `issues.id` (existing text slug) | none external (Stickee-authored editorial content) | Already a real FK-enforced key (`issue_markets.issue_id → issues.id`). Keep it. The problem here is not Issue's own id — it's that nothing links it *out* to Minister/Portfolio/Department/Committee. |
| **Minister / Portfolio / Department / Committee** (new) | Stickee-issued uuid per entity | No single authoritative machine-readable Australian source identified (see EVIDENCE_PROVENANCE_MODEL.md §5) | Each of these is a role or institution, not a synced external record — build with the assumption that ingestion will be evidence-linked citations pointing at parliament.gov.au / PM&C pages, not an API sync job. |

## 4. Why not one polymorphic `external_ids` table for everything

A single table `(entity_type, entity_id, source, source_id)` was considered and rejected for V1: it optimises for "never write a migration again" at the cost of losing per-type foreign-key integrity (Postgres can't enforce `entity_id` as an FK when `entity_type` varies), which directly conflicts with AGENTS.md's requirement to avoid parallel, ungoverned structures. Instead:

- **Person external ids**: `person_external_ids (person_id → people.id, source text, source_id text, valid_from, valid_to, recorded_at, asserted_by)`. `source` is a constrained enum: `'tvfy'`, `'aec'`, `'mock_legacy'` (see migration path below). Unique constraint on `(source, source_id)` where `valid_to is null` — this is what makes a silent double-mapping impossible; the database rejects it instead of a UI comment warning about it.
- **Electorate external ids**: same shape, `source` = `'aec'`.
- No external-id table needed for Party (small, closed, hand-curated set), Issue (Stickee-native), Division (already correctly `tvfy_id`-anchored).

This keeps referential integrity per type while still giving one consistent *pattern* (not one shared table) across the graph — consistent with "prefer extending existing systems" and "avoid parallel architectures" without literally forcing every entity through one under-typed table.

## 5. Migration path for the four existing MP schemes

Not proposed as work to execute now — this is the reconciliation *plan* an implementation batch would follow, so the strategy is falsifiable rather than hand-wavy:

1. **`tvfy-*` becomes the seed.** Every row in `members` gets a `people.id` (new uuid) minted once, with `person_external_ids` recording `(source='tvfy', source_id=tvfy_id)`.
2. **`mp-*` (mock) rows are matched to real `people` rows by a one-time, human-reviewed reconciliation pass** — electorate + name, surfaced as a diffable list for a person to confirm, not committed automatically. Where a mock row has no real counterpart (a seat TVFY doesn't currently return, a data lag), it stays unresolved and is flagged, not guessed. This is the one and only place manual reconciliation is acceptable, precisely because it happens once, with a human confirming each row, and produces a permanent mapping — the opposite of the current pattern of re-guessing the join on every request.
3. **`house-live-*`/`senate-*` are deleted**, not migrated. They were never identity — they were a per-request rendering artifact of the old join failure. Once `/mp/[id]`, `HouseChamber`, and `SenateView` all read from `people`/`person_external_ids`, nothing needs to synthesize a positional id at render time.
4. **`mp-<surname>` (the `mock-civic-data.ts`/`mock-simulator-data.ts` namespace) is retired** as part of whatever batch finally wires the Civic Pillar tables to real data (already an open item in FUTURE_SYSTEMS.md, independent of this design) — flagged here so it isn't forgotten as a fifth scheme once the other four are reconciled.
5. **The `mp-scorecard.ts` agent's name-matching join against `user_profiles.display_name` is replaced** with an explicit statement: Stickee does not currently have a verified mechanism for linking a human user account to a real MP's identity, and should not compute or store a `civic_score` keyed by name-match at all until one exists. This is a correctness/safety fix, not a nice-to-have, and should be treated as higher priority than the cosmetic id-scheme cleanup — see design report §11 (migration risks).

## 6. Electorate canonicalisation

Same pattern: introduce `electorates` keyed by AEC electorate code (stable, redistribution-aware — the AEC assigns a persistent code across most renames, and where a seat is genuinely abolished/created, that is itself a historical fact worth an `effective_to`/`effective_from` pair rather than a silent overwrite). Retire the three ad-hoc `ELECTORATE_MP_MAP`-style maps in favour of `people.electorate_id → electorates.id`, time-ranged (an MP's electorate assignment is itself a role fact, see RESPONSIBILITY_ENGINE.md §2).

The user→electorate lookup (`/api/electorate-lookup`) is a **separate problem** — it's not an identity-scheme mismatch, it's a genuinely unimplemented geographic boundary lookup (currently a documented coarse guess). Canonicalising the electorate entity does not fix that; a real boundary lookup (e.g. against AEC's published electorate GeoJSON) is a separate, smaller, and non-blocking piece of work. Do not conflate the two in an implementation plan.

## 7. What this strategy deliberately does not do

- Does not introduce a new id scheme for Divisions/Bills — `tvfy_id` is already correct there.
- Does not attempt to resolve state/territory-per-senator, since (per the codebase's own comment in `au-senate-states.ts`) no real source for that mapping has been identified — this is a data-availability gap, not an id-scheme gap, and belongs in EVIDENCE_PROVENANCE_MODEL.md's source map, not here.
- Does not propose a single global UUID namespace across all entity types ("everything is a `civic_object`") — rejected for the same referential-integrity reason as §4.
