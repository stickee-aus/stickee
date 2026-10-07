# Evidence & Provenance Model

Status: **Design document. Partially implemented.** The minimum `evidence`/`evidence_links` schema from §1–§3 (Charter's 8-way classification, no numeric confidence score, append-only corrections via `superseded_by_id`) shipped in migration 018 — see [RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md](../../RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md) §2. The `asserted_by_type`/`asserted_by_id` fields from §7 (AI-authored evidence) were simplified in V1 to `created_by`/`reviewed_by` (both `auth.users` references) since only admin-authored evidence is possible in this batch — no agent writes to `evidence` yet. The source map (§5) remains entirely unimplemented; no ingestion exists for any listed source.

Governed by [AGENTS.md](../../AGENTS.md) and [docs/philosophy/STICKEE_CHARTER.md](../philosophy/STICKEE_CHARTER.md) §5, §8, §9. Companion to [RESPONSIBILITY_ENGINE.md](RESPONSIBILITY_ENGINE.md), which depends on this document for every relationship's `evidence_id[]`.

Independently confirmed during this audit: **outside `issue_markets.resolution_source` (real, used) and `issues.source_url`/`pillar_metrics.source` (real, unpopulated/unqueried), no table in the current schema carries a retrieval date, a confidence classification, or a methodology link.** DOMAIN_MODEL.md calls this "the most consequential missing piece of the domain model" — this document is the direct response to that finding.

## 1. What "evidence" must answer

Restating the task brief's list as the required fields on every Evidence record:

| Question | Field |
|---|---|
| What source supports this? | `source_name`, `source_url` |
| When was it published? | `source_published_at` |
| When did Stickee retrieve it? | `retrieved_at` |
| Is it official? | `source_type` (official / secondary-reporting / dataset / Stickee-editorial) |
| Is it historical? | derived from `source_published_at` vs. now, not a separate flag |
| Is it inferred? | `classification` (see §2) — inferred content is `ai_generated_interpretation` or explicitly `disputed`, never silently folded into `verified_fact` |
| Is it disputed? | `classification = disputed`, with `dispute_note` |
| Has it been corrected? | `superseded_by_id` pointing to a newer Evidence row; the old row is never deleted (§4) |
| Who or what created the relationship? | `asserted_by_type` (human editor / agent), `asserted_by_id`, and — if agent-authored — `reviewed_by` (human, required for any high-risk content per Charter §8) |

## 2. Classification — reuse, do not reinvent

The Charter (§5, restated in every prior audit report) already defines the exact 8-way taxonomy every public claim must carry:

```
verified_fact | sourced_analysis | forecast | community_opinion |
ai_generated_interpretation | disputed_claim | demo_content | unknown_no_verified_data
```

`Evidence.classification` uses this enum directly — it is not a new taxonomy layered on top of the existing one. This is a direct instance of AGENTS.md's "does this duplicate an existing system?" test: the classification already exists as an operating convention across every page audit read for this task; the schema's job is to make it a real column instead of a per-page judgement call re-derived each time.

**A relationship record without a classification is not permitted to render publicly** — same rule as the Charter's non-negotiables list (§19), enforced at the schema/query layer this time rather than only as an editorial convention.

## 3. Evidence attaches to relationships, not just objects

An Evidence row supports a specific *claim* — usually a specific row in the Responsibility Engine's relationship table (RESPONSIBILITY_ENGINE.md §2), sometimes a standalone factual statement on an object (e.g. an Issue's summary text). Design:

```
Evidence {
  id
  source_name, source_url, source_type
  source_published_at, retrieved_at
  classification                    -- Charter's 8-way enum
  dispute_note                      -- required if classification = disputed_claim
  superseded_by_id                  -- nullable, points to a newer Evidence row
  asserted_by_type, asserted_by_id  -- human editor, or agent
  reviewed_by                       -- human reviewer id, required if asserted_by_type = agent AND content is high-risk (Charter §8)
  created_at
}

EvidenceLink {
  evidence_id  -> Evidence.id
  claim_type   -- 'relationship' | 'object_field'
  claim_id     -- the Relationship.id, or a (object_type, object_id, field_name) tuple for object_field
}
```

`EvidenceLink` is the many-to-many join — one piece of evidence (e.g. a single machinery-of-government listing) commonly supports several relationships at once (a portfolio's whole department list), and one relationship can accumulate multiple pieces of evidence over time (an initial announcement, then a later correction). This mirrors the pattern already used correctly for `issue_markets.resolution_source` — a single named source justifying a single factual outcome — generalised to every relationship instead of just market settlement.

## 4. Corrections are append-only

Directly implements Charter §9 ("corrections are public, dated, explained, and linked to the evidence that prompted them... never silently applied") and the task brief's "has it been corrected?" requirement:

- A correction never deletes or overwrites an Evidence row.
- It inserts a new Evidence row with `classification` and content reflecting the corrected understanding, and sets `superseded_by_id` on the old row to point to the new one.
- The relationship(s) linked via `EvidenceLink` are re-evaluated: if the correction changes *which* relationship is true (e.g. a machinery-of-government correction moves a department between portfolios), the old `Relationship` row gets `effective_to` set (per RESPONSIBILITY_ENGINE.md §6) rather than being edited, and a new `Relationship` row is inserted pointing at the new Evidence.
- Public pages must be able to render "this was corrected on [date] — here's what it said before, and why it changed" for any canonical claim. This is the revision-history mechanism named as a required-but-unbuilt gap in Charter §9 and `docs/PRODUCT_PATTERN_LIBRARY.md` — this schema is what makes that feature buildable; building the actual UI is out of scope here.

## 5. Source map — who owns which fact

Per-domain authoritative sources, with review flags. This does not authorise ingestion of any of these — it states which source *should* back a fact, for whenever ingestion work is scoped and approved separately.

| Domain | Likely authoritative source | Machine-readable? | Review flag |
|---|---|---|---|
| Parliament / votes | TheyVoteForYou (already integrated; itself sourced from Hansard/APH) | Yes — already integrated | None additional; already in production use |
| Bills / legislative stage | Australian Parliament House (aph.gov.au) bill tracker | Partial (structured pages, no public API found in this audit) | Confirm whether scraping APH pages is consistent with their terms of use before building an ingestion job — **flag for Legal/Regulatory review** |
| AEC / elections | Australian Electoral Commission (aec.gov.au) — results, electorate boundaries (GeoJSON published) | Yes for boundaries; results vary by feed | None additional — public government data, standard attribution |
| Ministerial roles / Cabinet | Prime Minister's official website (pm.gov.au), Department of the Prime Minister and Cabinet machinery-of-government listings | No public API identified in this audit; these are published as PDF/HTML "Administrative Arrangements Orders" | **Flag: no machine-readable source identified.** Ingestion would be manual/editorial (human-entered from a cited AAO document), not a sync job — set expectations accordingly in any implementation plan |
| Departments | Same AAO listings as above | Same as above | Same as above |
| Committees | Australian Parliament House committee pages | Partial (structured pages, per-committee) | Flag for scraping-terms review, same as Bills |
| Budget measures | Budget Papers (budget.gov.au), published annually | PDF only, no structured API identified | Manual/editorial ingestion; large effort, low priority unless a specific feature needs it |
| ABS | Australian Bureau of Statistics (abs.gov.au) — has a public API (ABS.Stat) | Yes | None additional beyond standard attribution; matches `pillar_metrics`'s already-intended purpose |
| RBA | Reserve Bank of Australia (rba.gov.au) — publishes structured statistical tables | Yes (CSV/XML tables) | Note the Responsibility Engine's own rule from RESPONSIBILITY_ENGINE.md §4: RBA relationships must be classified as **Influence**, never Authority/Responsibility, given its statutory independence — flag for Public Policy review when this source is actually ingested, to confirm the framing is held to on real content |
| Treasury | treasury.gov.au — policy/measures pages, budget-adjacent | Partial | Same review posture as Budget measures |
| State governments | Each state's own parliament/government site — 8 separate sources, no unified feed | No | Large effort; explicitly out of scope for V1 (see design report §9) |
| Local government | 500+ councils, no unified feed | No | Explicitly out of scope, named in CANONICAL_CIVIC_GRAPH.md §4 as not scheduled until a source is confirmed |

## 6. Confidence vs. classification — not the same axis

The Charter's classification (§2 above) answers "*what kind* of claim is this" (fact vs. forecast vs. disputed vs. AI interpretation). A separate, optional `confidence` note on an Evidence row (free text, not a numeric score) may explain *why* something is classified as it is — e.g. "single secondary source, not yet corroborated by the primary AAO document." This is deliberately **not a number**. RESPONSIBILITY_MAP_SPEC.md's ban on numeric influence/power scores extends here: a numeric "confidence: 73%" field would invite exactly the fabricated-precision failure mode the Charter's non-negotiables list forbids ("no fabricated statistic... ever"). Confidence is expressed by classification + a human-readable note, never a synthesized number.

## 7. AI-authored evidence

Per Charter §8, an agent may draft or classify an Evidence row, but:

- `asserted_by_type = 'agent'` is always visible on the record (never silently presented as if a human entered it — same authorship-disclosure rule Political Pulse already implements for feed posts, see CIVIC_EVENT_MODEL.md).
- High-risk content (per Charter §8's list: accusations against real people, anything affecting a public figure's accountability record — which is exactly what most Responsibility Engine relationships are) requires `reviewed_by` (a human) before the Evidence row may back a public relationship.
- An agent may populate `EvidenceLink`s automatically from a structured, already-verified input (e.g. TheyVoteForYou's division data, which is itself the primary source) without additional human review per record — this matches the Charter's "automatic AI publication is allowed only when input is structured and already verified" carve-out, and is exactly the existing pattern `parliament-watcher`/`bill-stage-tracker` already use safely for feed posts.

## 8. What this document does not do

- Does not build an ingestion pipeline for any source in §5 — sourcing work requires its own scoped, owner-approved plan per source, especially where a Legal/Regulatory review flag is set.
- Does not define a numeric trust/confidence score — deliberately rejected, see §6.
- Does not change how `issue_markets.resolution_source` works today — that mechanism is already correct and is the closest existing precedent for this design, not a system to be replaced.
