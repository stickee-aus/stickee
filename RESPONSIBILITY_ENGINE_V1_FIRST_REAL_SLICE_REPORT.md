# Responsibility Engine V1 — First Real Data Slice Report

**Status: Implementation batch. Local/dev-scoped only. Production was not accessed. Nothing was staged, committed, pushed, or deployed.**

Governed by [AGENTS.md](AGENTS.md). Read before/during this work: `docs/philosophy/HOW_STICKEE_THINKS.md`, `docs/philosophy/STICKEE_CHARTER.md`, [RESPONSIBILITY_ENGINE_DESIGN_REPORT.md](RESPONSIBILITY_ENGINE_DESIGN_REPORT.md), [RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md](RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md), [docs/architecture/RESPONSIBILITY_ENGINE.md](docs/architecture/RESPONSIBILITY_ENGINE.md), [docs/architecture/EVIDENCE_PROVENANCE_MODEL.md](docs/architecture/EVIDENCE_PROVENANCE_MODEL.md), [docs/architecture/CANONICAL_CIVIC_GRAPH.md](docs/architecture/CANONICAL_CIVIC_GRAPH.md), `ISSUE_DETAIL_V1_REPORT.md`, migrations 018–020, and `src/app/issue/[id]/page.tsx` (the existing Issue Detail responsibility loader).

Goal, per the task brief: prove the Responsibility Engine works with **one** real Australian civic issue, using authoritative evidence. This report documents exactly what was proved, what was blocked, and why.

---

## Pre-existing state noted before this task began

Same large pre-existing uncommitted working tree noted in both prior reports (an in-progress navigation/home-page redesign across most of `src/app`/`src/components`, plus the two prior Responsibility Engine batches' own files). None of it was touched beyond this batch's own intended edits. `src/app/issue/[id]/page.tsx` was already among the pre-existing modified files (part of that redesign) before this session began — this session's diff against it is additive on top of that, not a reversion of it.

---

## 1. Chosen issue

**`housing-affordability`** — the task's preferred default. See §2 for why it was used despite an important caveat this session could not fully resolve.

## 2. Why it was selected — and the honest limit on "confirming real, not demo"

This environment has **no live database access** (re-confirmed at the start of this task: `docker info` fails to connect to the daemon, `supabase` CLI is not installed — identical to the finding in `RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md` §10). That means this session cannot query the `issues` table to directly confirm whether a real, non-fixture `housing-affordability` row exists — and, for the same reason, **cannot enumerate what real issues exist in any database either**, so the task's fallback instruction ("identify the safest real issue already in the database") is not something this session can execute any better for a different candidate issue than for this one. Switching issues would not avoid this limitation; it would just relocate it.

Given that, the actual safeguard is structural, not observational: `issue_portfolios.issue_id` (migration 020) is a hard foreign key to `issues(id)`. A real (`is_test_fixture = false`) `issue_portfolios` row cannot be inserted against an id that has no real `issues` row — the database itself enforces this, not a manual check. Migration 021 (§4 below) adds an explicit, friendly guard on top of that FK (`RAISE EXCEPTION` with a clear message if `housing-affordability` isn't found as a real row) specifically so that if this assumption turns out to be wrong when the migration is actually run, it fails loudly with a clear explanation — never silently attaching real responsibility data to a demo issue. This is the direct implementation of the task's "do not attach real responsibility relationships to a demo issue as though the entire issue record were verified" instruction, enforced at the point of execution rather than asserted in this report.

`housing-affordability` was kept as the target because: (1) it's the task's explicit preference; (2) it's the Charter's own worked example for exactly this kind of multi-actor responsibility relationship (`docs/architecture/RESPONSIBILITY_ENGINE.md` §4); (3) the FK-enforced guard makes the choice of *which* candidate issue low-stakes from a safety standpoint, since the same protection applies regardless of which id is targeted.

## 3. Authoritative sources used

All fetched live in this session via web search/fetch — **not from model memory** (this session's stated knowledge cutoff, January 2026, predates the current date, August 2026, so anything about who currently holds this office had to be independently verified, not recalled). No Wikipedia, media summary, party website, or search-snippet-only claim was used as a citation; every Evidence record's `source_url` is a page this session directly fetched and read.

| # | Source | Publisher | What it establishes |
|---|---|---|---|
| 1 | [Instruments of appointment of ministers of state: 13 May 2025](https://www.pmc.gov.au/resources/instruments-appointment-ministers-state-13-may-2025) | Department of the Prime Minister and Cabinet | The Governor-General's constitutional instrument appointing Clare Ellen O'Neil to (a) administer the Department of the Treasury and (b) hold the offices of Minister for Housing, Minister for Homelessness, and Minister for Cities. Primary source for the Minister↔Portfolio relationship and for that minister's administration of Treasury. |
| 2 | [Administrative Arrangements Order — 13 May 2025](https://www.pmc.gov.au/resources/aao-13-may-2025) | Department of the Prime Minister and Cabinet | Machinery-of-government order transferring "housing, rental and homelessness policy" (and land/planning/cities/urban policy) into the Treasury portfolio. Primary source for Department↔Portfolio and Issue↔Portfolio. |
| 3 | [The Hon Clare O'Neil MP — Ministers for the Treasury portfolio](https://ministers.treasury.gov.au/ministers/clare-oneil-2025) | Australian Government — The Treasury | Live, current-status confirmation that O'Neil is presently listed as Minister for Housing/Homelessness/Cities. Corroborating source. |

Two independent, official confirmations were used before treating the appointment as still current as of this session's stated date (August 2026): a targeted search for any 2026 federal ministerial reshuffle affecting Housing (none found — the only 2026 result was a Victorian *state* appointment, a different portfolio entirely), and the live Treasury ministers directory page (source 3), which lists O'Neil as the current officeholder.

## 4. Evidence records created

Three real (`is_test_fixture = false`) `evidence` rows, authored in migration 021 (§9). Each carries: `source_type='official'`, a `title`, the exact `source_url`, a `publisher`, `classification='verified_fact'`, and a `notes` field quoting or summarising the exact source text this session read, plus a note that it was retrieved via live fetch in this session (not memory). `source_published_at` is set to `2025-05-13` for the two dated PM&C documents, and left `null` for the live/undated Treasury directory page (retrieved_at records when this session fetched it instead — no publish date was guessed).

## 5. Portfolio created

**Housing** (`jurisdiction = 'commonwealth'`, `effective_from = '2025-05-13'`). This date is the earliest date this batch has real evidence for — **not** a claim that the Housing portfolio didn't exist before 13 May 2025 (it did, under the prior Social Services-administered arrangement); this batch did not attempt to research or verify that earlier history, and the migration's own comments say so explicitly rather than leaving the date to be misread as a founding date.

## 6. Department created

**Department of the Treasury** (`jurisdiction = 'commonwealth'`, `effective_from = '2025-05-13'`), with the identical caveat as §5 — Treasury itself long predates this date; only the *evidenced* start of its administration of housing policy is dated here.

## 7. Minister relationship created

**Not created in this batch.** This is the primary blocker — reported plainly per the task's explicit instruction, not worked around:

- `person_portfolio_roles.member_id` is a real foreign key to `members(id)` (migration 020), and this codebase's one already-canonical external anchor for a person is `members.tvfy_id` (TheyVoteForYou's numeric person id — see `docs/architecture/CANONICAL_ID_STRATEGY.md`).
- This session attempted to retrieve Clare O'Neil's real `tvfy_id` from TheyVoteForYou directly: her profile page (`theyvoteforyou.org.au/people/representatives/hotham/clare_o'neil`) returned **HTTP 403**; their API (`theyvoteforyou.org.au/api/v1/people.json`) returned **HTTP 401**, requiring an API key (`THEYVOTEFORYOU_API_KEY`, already named as a known-rotation item in AGENTS.md's product-debt list) that is not available in this session.
- Per the task's explicit instruction — "If the current minister cannot be safely mapped to `members.id`: stop and report the canonical-id blocker" — **no name-based or fuzzy substitute was used.** No `person_portfolio_roles` row was inserted for the minister in migration 021.

A **proposed, non-default alternative** was authored and left inert (commented out, not executable as shipped) in migration 022: matching by `members.electorate = 'Hotham' AND members.house = 'representatives'`, both real, already-in-schema, non-name columns (migration 002), defensively checked for exactly one match before use. This is not name-string matching or fuzzy matching — Clare O'Neil's electorate was independently confirmed via an official Australian Parliament House source (`parlinfo.aph.gov.au`, biography id `handbook/allmps/140590`), not just TheyVoteForYou's own listing. It is, however, a *different* identifier than the one this codebase treats as canonical for people, so it is presented as an owner decision (§13, Owner Decision 1) rather than applied unilaterally. See migration 022's header for the full reasoning and the exact SQL that would apply it.

## 8. Issue relationship created

**`housing-affordability` → Housing portfolio**, `responsibility_kind = 'responsibility'`, `effective_from = '2025-05-13'`. This is the only `responsibility_kind` inserted for this issue in this batch — per the task's "insert only the minimum real records required to prove the chain" instruction, this does not attempt the fuller multi-actor model `docs/architecture/RESPONSIBILITY_ENGINE.md` §4 describes for housing affordability generally (state governments, the RBA, local councils each with their own kind).

## 9. Identity mapping method

See §7. Summary: **no identity mapping was performed for the minister** — the intended method (matching `members.tvfy_id` against a value independently retrieved from TheyVoteForYou) was blocked by an inaccessible credential, and the task's explicit instruction is to stop and report rather than substitute a different, unreviewed method. No other person identity was needed in this batch (Portfolio, Department, and the Issue↔Portfolio relationship reference no `members` row at all).

## 10. Temporal dates and sources

Every `effective_from` inserted in this batch is `2025-05-13`, sourced to the Administrative Arrangements Order and the Instrument of Appointment (§3, sources 1–2), both dated 13 May 2025 by the issuing authority (Department of the Prime Minister and Cabinet). No date was invented or estimated. Every `effective_to` is left `null` — correct only because this session independently confirmed (§3) that no more recent reshuffle has superseded this arrangement; if that changes, the correct action is to close these rows (`effective_to`) and insert new ones, never edit them in place (enforced by the append-only triggers from migration 019).

## 11. Issue Detail wiring

`src/app/issue/[id]/page.tsx`'s existing "Who is responsible?" section (§7 of that page) was extended, not replaced: it now calls the generic `getIssueResponsibilityGraph(issue.id)` (only when the Issue record itself is DB-sourced, `isVerified === true`) and renders `<IssueResponsibilitySection graph={...} />` when `selectVerifiedEntries(graph).length > 0`; otherwise it renders the **exact, unchanged** pre-existing fallback paragraph ("We haven't yet verified who has primary responsibility for this issue…") — verified by an executed test (§12) that checks the literal string is unchanged, not just visually similar.

`IssueResponsibilitySection` (`src/components/IssueResponsibilitySection.tsx`) is a new, fully generic component — it imports no issue-specific data, contains no `if (issue.id === 'housing-affordability')` branch, and gets every display label from `JURISDICTION_LABELS`/`RESPONSIBILITY_KIND_LABELS`/`PERSON_ROLE_TYPE_LABELS` (new, generic lookup maps added to `src/lib/responsibility-data.ts`). It renders, per verified entry: the portfolio's jurisdiction + name, verified ministers (or "No verified minister on record." — the honest state this batch's own data currently produces for Housing, since §7 above blocked that insert), verified departments, the plain-language relationship-kind label, and a full evidence list (title linked to its source URL, publisher, published/retrieved date, and classification — nothing hidden behind a developer-only field). A department is only shown as verified if the **relationship** connecting it to this specific portfolio has its own evidence — not merely because the department entity exists (§ below, "read path").

The page-level `try`/`catch` around the graph fetch means a missing table (e.g. an environment where migrations 018–022 haven't been applied yet) cannot break Issue Detail for any issue — it falls through to the same honest fallback state.

## 12. Tests

All executed via `npx vitest run`, all passing (**557/557** across the whole suite, no regressions):

- **`src/lib/__tests__/responsibility-read-path.test.ts`** (7 tests, new) — exercises the real `getIssueResponsibilityGraph` function (not a reimplementation of it) against a lightweight fake Supabase client that genuinely applies `.eq()`/`.in()`/`.is()` filters. Proves: the full Issue→Portfolio→Person role→Department→Evidence chain resolves correctly end-to-end; multiple portfolios are supported for one issue; an unrelated issue resolves to an empty graph; an expired (`effective_to` set) ministerial role is excluded and never rendered as current; a portfolio with zero linked evidence is never `isVerified`, even though the row exists; a department is only verified via its *own* `department_portfolios` relationship evidence, not a department entity's unrelated evidence; test-fixture rows are excluded by default.
- **`src/lib/__tests__/responsibility-first-real-slice.test.ts`** (18 tests, new) — source-scan and regression coverage: migration 021's real-issue guard and idempotency check exist; every Evidence classification used is one of the Charter's 8-way values; no numeric confidence/trust/weight score anywhere; no Committee or `civic_events` row created; migration 022 is fully inert (every executable statement is inside a block comment); migration 022's proposed resolution uses electorate+house, never a name/`ilike` predicate, and guards against zero-or-multiple matches; neither migration matches an MP by a bare name-equality predicate; the component and read path contain no hardcoded "Housing"/"O'Neil"/"Clare"/"Treasury"/"housing-affordability" strings in *executable* code (comments may discuss them); the component renders off the generic label maps, never an `issue.id ===` branch; `page.tsx` wires the generic `getIssueResponsibilityGraph`/`selectVerifiedEntries` functions, not an issue-specific branch; the pre-existing fallback copy is preserved verbatim; the graph fetch is wrapped in `try`/`catch`.
- **`src/lib/__tests__/responsibility-engine-v1.test.ts`** (updated, 1 assertion) — the prior batch's "018/019/020 are the newest migrations" check was loosened to "018/019/020 exist, and the full migration sequence has no gaps," since this batch legitimately adds 021/022 after them — this is an expected update as the codebase grows, not a weakening of the original guarantee (still fails if a migration number is skipped or duplicated).
- A **test-infrastructure addition** was required to make any of this executable at all: `server-only` (imported by `responsibility-db.ts`, following this codebase's existing convention for that marker) is resolved by Next.js's own bundler, not a real npm dependency — it fails to resolve under plain vitest. `vitest.config.ts` now aliases the bare specifier `server-only` to a new, empty stub module (`src/test-stubs/server-only.ts`), so files carrying that marker can be imported directly in tests. This changes nothing about the real module's behaviour under Next.js, which resolves it independently; the alias only applies inside the vitest test runner. This is a general, reusable addition (any future `server-only`-tagged module becomes testable the same way), not specific to this batch.

## 13. DB verification method

**Not executed against a live database in this session.** Confirmed at the start of this task (re-verified, not assumed carried over from the prior batch): `docker info` fails to connect to the daemon; the `supabase` CLI is not installed. Migrations 021 and 022 were **authored, not run** — this is stated plainly per the task's explicit instruction, not glossed over.

What *was* verified, and how:
- The read path (`getIssueResponsibilityGraph`) was exercised against a real, filter-applying fake Supabase client (§12) — this proves the query construction is correct, though it cannot prove the real Postgres schema/RLS/triggers behave as designed (that remains authored-but-unverified, same limitation as migrations 018–020 in the prior batch, tracked in `supabase/tests/005_responsibility_engine_v1.test.sql`).
- Migration 021's own guard logic (the real-issue existence check, the idempotency check) was verified via source-scan tests (§12), not by actually running the migration.
- No new `supabase/tests/*.sql` file was added in this batch specifically for 021/022's data — the existing `005_responsibility_engine_v1.test.sql` (from the prior batch) already covers the RLS/trigger *mechanics* those tables share; 021/022 add *data*, not new mechanics, so no new mechanical behaviour needed a new SQL test file. If and when this migration is actually run locally, the correct verification is: run `supabase db reset`, then confirm `select canonical_name from portfolios where jurisdiction = 'commonwealth'` returns `Housing`, and that `/issue/housing-affordability` renders the new "Who is responsible?" block.

## 14. Blockers

1. **TheyVoteForYou identity resolution (§7/§9)** — the primary blocker. Her profile page returned HTTP 403 (likely bot protection); their API returned HTTP 401, requiring a credential (`THEYVOTEFORYOU_API_KEY`) not available in this session. No workaround was attempted (no scraping infrastructure was built, per the task's explicit rule; no name-matching was substituted). Resolved by *not* inserting the Person→Portfolio row, and authoring — but not applying — a reviewable alternative (migration 022).
2. **No live database in this environment** (§13) — same category of blocker as both prior batches; resolved the same way, by authoring and stating plainly rather than pretending execution occurred.

Neither blocker stopped the batch from producing real, evidence-backed Portfolio/Department/Issue↔Portfolio data — only the one relationship that specifically required person identity was affected.

## 15. Owner decisions

1. **Whether to apply migration 022's electorate-based minister identity resolution now, or wait for a real `/api/sync/members` run and re-author it against `tvfy_id`.** Both are legitimate; this report does not pick one. If a real member sync has already happened in whatever environment this is reviewed in, re-authoring against `tvfy_id` (the already-canonical anchor) is the cleaner option and should be preferred over applying 022 as-is.
2. **Whether `THEYVOTEFORYOU_API_KEY` should be made available to a research/authoring session like this one in future**, given it would have let this batch complete the Minister relationship using the codebase's actual canonical identifier on the first attempt, rather than needing a proposed alternative.
3. **Whether the `effective_from = '2025-05-13'` caveat on Portfolio/Department (§5–§6 — "earliest evidenced date, not founding date") is acceptable as a permanent characteristic of this data**, or whether a future batch should research and backfill each entity's actual founding/creation date. Not resolved here; flagged so it isn't silently forgotten as if today's date were a real historical claim.
4. Carried over, unaffected by this batch: Owner Decisions 2–7 from `RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md` §13 (ongoing editorial burden of manual portfolio/department data entry — this batch is a live example of exactly that burden; `civic_events` direction; Committee; state/local scope; legal review timing) and Owner Decision 8 (whether `members.id`-as-identity is a permanent V1 design) remain open.

## 16. Confirmation production was untouched

Production was not accessed at any point in this task. No `supabase db push`, no deploy, and no connection to any hosted database occurred — the only database-shaped work performed was authoring SQL and exercising it against an in-memory fake client in tests (§12–§13). Nothing was staged, committed, or pushed to git. `git status` confirms the only files changed are the ones listed below; every other pre-existing uncommitted change in the working tree (the in-progress nav/homepage redesign, and both prior Responsibility Engine batches' own files) is untouched beyond this batch's own intended edits.

**Files changed:**

New:
- `supabase/migrations/021_responsibility_first_real_slice.sql`
- `supabase/migrations/022_responsibility_minister_identity_pending_review.sql`
- `src/components/IssueResponsibilitySection.tsx`
- `src/test-stubs/server-only.ts`
- `src/lib/__tests__/responsibility-read-path.test.ts`
- `src/lib/__tests__/responsibility-first-real-slice.test.ts`
- `RESPONSIBILITY_ENGINE_V1_FIRST_REAL_SLICE_REPORT.md` (this file)

Modified:
- `src/lib/responsibility-db.ts` — department verification now gated on the `department_portfolios` relationship's own evidence, not the department entity's; added the shared `selectVerifiedEntries()` selector.
- `src/lib/responsibility-data.ts` — added `JURISDICTION_LABELS`, `RESPONSIBILITY_KIND_LABELS`, `PERSON_ROLE_TYPE_LABELS`.
- `src/app/issue/[id]/page.tsx` — wired the generic read path into the existing "Who is responsible?" section, gated and defensively wrapped (§11).
- `vitest.config.ts` — added the `server-only` test alias (§12).
- `src/lib/__tests__/responsibility-engine-v1.test.ts` — loosened one assertion to accommodate migrations added after 020 (§12).
