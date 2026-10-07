# Civic Event Model

Status: **Design document. No schema exists yet.**

Governed by [AGENTS.md](../../AGENTS.md). Companion to [RESPONSIBILITY_ENGINE.md](RESPONSIBILITY_ENGINE.md) (relationships answer "who," CivicEvent answers "what happened, when") and [EVIDENCE_PROVENANCE_MODEL.md](EVIDENCE_PROVENANCE_MODEL.md) (every event should be evidence-linkable).

## 1. Starting point: Political Pulse is the closest working precedent, not a blank slate

Political Pulse (`/feed`, backed by `feed_posts`, documented in [POLITICAL_PULSE_V1_REPORT.md](../../POLITICAL_PULSE_V1_REPORT.md) and [docs/page-audits/POLITICAL_PULSE_PAGE_AUDIT.md](../page-audits/POLITICAL_PULSE_PAGE_AUDIT.md)) already implements most of what a CivicEvent stream needs to be:

- Chronological, not engagement-ranked.
- Filtered to exactly four verified, source-attributed agents (`parliament-watcher`, `bill-stage-tracker`, `prediction-resolver`, `electorate-pulse`) — a fifth agent (`mp-scorecard`) is deliberately excluded because its underlying number is admitted, in its own source comment, to be a proxy rather than a real measurement.
- No mock fallback — the empty state reads "No verified civic updates are available for this period," which is exactly the CivicEvent design principle this document would otherwise have to invent from scratch.
- Every row discloses authorship ("Automated update · {Agent name}") as plain text, never colour-only.
- Already has a documented, binding content-type scope gate (real pipeline required before a content type is admitted) in the Political Pulse page audit — this is the *right* mechanism, and CivicEvent should extend that gate rather than replace it.

**This is the strongest single reason to evaluate "should CivicEvent become the canonical event layer" as *extend*, not *replace*.**

## 2. The proposed CivicEvent shape (per task brief §7)

```
CivicEvent {
  id
  type                    -- e.g. division_result, stage_transition, market_resolved, minister_appointed, correction_issued
  occurred_at              -- when the real-world event happened
  observed_at               -- when Stickee's system recorded it
  actor_id                 -- who/what did this (Person, Department, Committee, or 'stickee-system' for e.g. market resolution)
  object_id                -- what it happened to (Bill, Issue, Portfolio, ...)
  related_issue_id          -- optional, for feed grouping
  source_id                -- FK to Evidence
  summary                  -- plain-language, Charter-compliant text
  automated_by              -- agent id, nullable if human-authored
  verification_status       -- mirrors Evidence.classification, not a separate scale
}
```

This is structurally very close to today's `feed_posts` (`type`≈`content_type`, `occurred_at`≈implicit in `posted_at`, `actor_id`/`object_id` are new, `source_id` formalises what `linked_bill_id`/`linked_decision_id` currently do informally, `automated_by`≈`source_agent_id`, `verification_status` is new but maps directly onto the Charter classification `feed_posts` rows already implicitly carry via their agent-gate).

## 3. Evaluation: extend `feed_posts`, or build a new table?

Per the task brief's instruction not to assume yes, here is the actual trade-off:

### Option A — Extend `feed_posts` in place

**For:**
- `feed_posts` is real, in production, already has the authorship-disclosure and no-mock-fallback properties this design wants.
- Avoids the exact anti-pattern AGENTS.md warns against — a parallel table duplicating a system that already does most of the job.
- The existing agents (`parliament-watcher`, `bill-stage-tracker`, `prediction-resolver`, `electorate-pulse`) keep writing to one place.

**Against:**
- `feed_posts` was designed as a *feed* (a rendering-oriented, chronological list for one page), not a generalized *event log* other systems query. Its `linked_bill_id`/`linked_decision_id`/`linked_leader_id`/`linked_electorate` columns are already an ad-hoc, unenforced polymorphic-reference pattern (no FK, per migration 013's own comment) — extending this further would compound rather than fix that.
- `author_id text` already mixes `'system'`, user ids, and leader slugs in one untyped column (migration 013 comment, confirmed in the codebase audit) — a sign this table has already outgrown a single clean shape.
- A general CivicEvent log needs to support event types `feed_posts` never anticipated (e.g. `minister_appointed`, `correction_issued`) whose natural `object_type` isn't "a feed-displayable post" at all.

### Option B — New `civic_events` table; Political Pulse becomes one *reader* of it, not its own store

**For:**
- Clean `(actor_id, object_id)` shape with real polymorphic-reference discipline from day one (paired `object_type`/`object_id`, not a growing list of nullable `linked_*` columns).
- Other consumers (People timelines, Government activity, Forecast resolution history, a future "What changed" strip) can query it without inheriting Political Pulse's feed-specific concerns (ranking exclusions, per-agent gating for *that page specifically*).
- `parliament-watcher` etc. already produce structured, real data — pointing them at a second, cleaner sink is a small, well-scoped change, not a rewrite.

**Against:**
- Two tables temporarily coexist during migration; must avoid the Issue/Decision-style permanent duplication trap.
- Requires a migration and a decision about whether `feed_posts` becomes a *view* over `civic_events` (filtered/joined for feed rendering) or is retired entirely once all four agents + `/feed` are re-pointed.

### Recommendation

**Option B, with `feed_posts` retired in favour of a view/read-model over `civic_events`, not kept as a second independent table.** The deciding factor is `feed_posts`' `linked_*` column sprawl and untyped `author_id` — these are exactly the "duplicate business logic waiting to happen" pattern AGENTS.md's five duplication questions are meant to catch, and the cost of carrying them into a general-purpose event log compounds every time a new consumer (People timeline, Government activity feed) has to learn feed_posts' feed-specific quirks. This is **not** a recommendation to build immediately — see the design report's migration-risk section; it's a recommendation for *when* the event layer is built, that it should be built this way rather than as `feed_posts` v2.

This recommendation should be treated as provisional pending Software Architect and Data & Evidence Steward review — flagged explicitly in the Council review (design report §10).

## 4. Should CivicEvent become the canonical source for the four named use cases?

Per task brief §7, evaluated individually rather than assumed:

| Use case | Verdict | Reasoning |
|---|---|---|
| **Issue timelines** | Yes, once `civic_events` exists | Directly replaces the never-built `issue_timeline_events` table named in DOMAIN_MODEL.md — a CivicEvent with `related_issue_id` set *is* a timeline entry. No separate timeline table needed; this is the clearest "avoid duplicate architecture" win in this whole design. |
| **People timelines** | Yes, with a caveat | A person's CivicEvents (votes cast, appointments, statements) plus their Responsibility Engine relationships (RESPONSIBILITY_ENGINE.md) together form Charter §10's 11-component accountability record. The caveat: vote-casting at scale (every division, every MP) would be a *lot* of CivicEvent rows if modelled 1:1 — consider whether individual votes stay in `member_votes` (already correct, high-volume, tabular) and only *notable* vote events (rebellions, deciding votes) get a CivicEvent, with the person's full voting record queried separately. Recommend the latter — do not duplicate `member_votes` row-for-row into `civic_events`. |
| **Government activity** | Yes | This is close to what `parliament-watcher`/`bill-stage-tracker` already produce; no new concept required, just the cleaner sink from §3. |
| **Forecast resolution history** | Partially | `resolve_market()` already writes an atomic, auditable record (`issue_markets.outcome/resolved_by/resolved_at/resolution_source`). A CivicEvent *pointing at* that resolution (for feed/timeline display) makes sense; CivicEvent should not become the system of record for the resolution itself — that's already correctly and rigorously implemented in the `issue_markets`/`resolve_market()` path (per AGENTS.md's "verified infrastructure," §current-priorities framing) and should not be redesigned without cause. |
| **Today's "What changed" strip** | Yes, this is close to Political Pulse's existing purpose already | Directly served by `civic_events` filtered to `occurred_at` within a window — this is Political Pulse's chronological ordering, generalised. |

## 5. Content-type admission gate — reuse, extend, don't replace

Political Pulse's existing gate (`docs/page-audits/POLITICAL_PULSE_PAGE_AUDIT.md`) is the correct mechanism for deciding which event `type`s are allowed to write to `civic_events` at all: a content type is admitted only once it has a real, traceable pipeline, no exceptions "for design or launch-date reasons." The event model should inherit this gate verbatim rather than re-litigate it — new event types (`minister_appointed`, `correction_issued`, `committee_report_tabled`) each need their own real source (see EVIDENCE_PROVENANCE_MODEL.md §5) before being added to the enum, exactly as Decisions/Committees/Elections/ABS/RBA/Treasury/Speeches remain excluded from Political Pulse today pending real pipelines.

## 6. What this document does not do

- Does not migrate `feed_posts` — that is an implementation decision requiring its own plan and owner approval, flagged as a migration risk in the design report, not executed here.
- Does not add new event types beyond what §4/§5 already justify — `minister_appointed` and `correction_issued` are named as plausible future types, not committed schema.
- Does not change Political Pulse's current agents, page, or empty-state behaviour — those remain correct as-is until (if ever) the `civic_events` migration is approved and executed.
