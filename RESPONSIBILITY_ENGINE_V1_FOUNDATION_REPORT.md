# Responsibility Engine V1 — Foundation Batch Report

**Status: Implementation batch. Local/dev-scoped only. Production was not accessed. Nothing was staged, committed, pushed, or deployed.**

Governed by [AGENTS.md](AGENTS.md). Prepared per its task-execution protocol: read before/during this work — `docs/philosophy/HOW_STICKEE_THINKS.md`, `docs/philosophy/STICKEE_CHARTER.md`, [RESPONSIBILITY_ENGINE_DESIGN_REPORT.md](RESPONSIBILITY_ENGINE_DESIGN_REPORT.md), [docs/architecture/CANONICAL_CIVIC_GRAPH.md](docs/architecture/CANONICAL_CIVIC_GRAPH.md), [docs/architecture/RESPONSIBILITY_ENGINE.md](docs/architecture/RESPONSIBILITY_ENGINE.md), [docs/architecture/CANONICAL_ID_STRATEGY.md](docs/architecture/CANONICAL_ID_STRATEGY.md), [docs/architecture/EVIDENCE_PROVENANCE_MODEL.md](docs/architecture/EVIDENCE_PROVENANCE_MODEL.md), [docs/architecture/CIVIC_EVENT_MODEL.md](docs/architecture/CIVIC_EVENT_MODEL.md), `ISSUE_DETAIL_V1_REPORT.md`, `PEOPLE_V1_REFINEMENT_REPORT.md`, `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`, `POLITICAL_PULSE_V1_REPORT.md`, all 17 pre-existing Supabase migrations, `src/lib/agents/mp-scorecard.ts`, and every person/member/issue data loader touched by this batch.

This is the first implementation batch of the Responsibility Engine, scoped exactly to the six items in the task brief. Everything explicitly excluded from scope (Committees, `civic_events`, Cabinet accountability pages, Department pages, public scoring, the Issue/Bill/Decision merge, new community/forecast features, new UI, and a full canonical MP-id migration) was not built.

---

## Pre-existing state noted before this task began

`git status` at the start of this task showed the same large set of pre-existing uncommitted work already noted in `RESPONSIBILITY_ENGINE_DESIGN_REPORT.md` (an in-progress navigation/home-page redesign across most of `src/app`/`src/components`, plus the previously-published design-report deliverables). None of it was touched. Every file this report lists as changed is new.

---

## 1. mp-scorecard bug fix

**File:** `src/lib/agents/mp-scorecard.ts`.

**The bug (confirmed by re-reading the file before any other work, per the task's explicit "fix and test this before creating any migration" instruction):** the agent computed a per-MP "civic alignment score" and, to persist it, looked up `user_profiles` by exact string equality on `display_name`:

```ts
const { data: prior } = await ctx.admin
  .from('user_profiles')
  .select('user_id, civic_score')
  .eq('display_name', m.name)
  .maybeSingle()
```

`display_name` is a real, user-editable field on a real human account (see `handle_new_user()` in migrations 011/012) — not an identity column for anyone, let alone a sitting MP. Any user who set their own display name to match an MP's name (by accident, or deliberately) would have had their account's `civic_score` silently overwritten, and a fabricated "leader_update" feed post published in their name (`feed_posts.author_id = u.user_id`, `author_name = u.name`, `author_verified: true`). This is a real correctness/privacy defect, independent of the Responsibility Engine work — it was found during the architecture audit, not invented for this batch.

**The fix:** the handler is now a full, safe no-op. It performs **zero** reads or writes against `user_profiles`, `members`, `divisions`, `member_votes`, `predictions`, or `feed_posts`. No replacement heuristic (fuzzy name match, electorate match, or otherwise) was introduced — per the task's explicit instruction, since no canonical Person↔User-account relationship exists anywhere in this schema, there is no safe join to fall back to, and inventing one would just move the bug, not close it. It returns `status: 'warn'` (not `'ok'`) with an explanatory summary, so the disabled state is visible in `agent_runs`/`agents.last_status` rather than silently reporting healthy forever. The agent's `enabled` flag in the `agents` table was left untouched — the code-level fix is the authoritative safety boundary regardless of whether the cron scheduler continues to invoke it.

Separately noted, not acted on in this batch: the underlying "civic score" methodology is, by the original file's own comment, "the cheapest plausible proxy for public opinion" — the same defect class as the MP voting-consistency score already removed from `/mp/[id]`. Re-enabling this agent requires both a real identity link *and* a real methodology meeting `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md`; neither exists today, and building either is out of scope for this batch.

**Tests:** `src/lib/__tests__/mp-scorecard-disabled.test.ts` (7 tests, all passing) — proves the handler touches no Supabase table at all, writes nothing, returns a `'warn'` status with an explanatory summary, and that the source contains no `display_name`/`user_profiles` query pattern, no `.ilike()`, and no fuzzy-matching helper (comment text is stripped before scanning, so the file's own explanatory prose naming the removed pattern doesn't false-positive against itself).

---

## 2. Evidence/Citation schema

**Migration:** `supabase/migrations/018_responsibility_evidence.sql`.

Two tables:

- **`evidence`** — one row per citation. Reuses the Charter's existing 8-way classification (`verified_fact`, `sourced_analysis`, `forecast`, `community_opinion`, `ai_generated_interpretation`, `disputed_claim`, `demo_content`, `unknown_no_verified_data`) as a `CHECK`-constrained column, rather than inventing a parallel taxonomy. Minimum fields from the task brief are all present: `source_type`, `title`, `source_url`, `publisher`, `source_published_at`, `retrieved_at`, `classification`, `verification_status` (`unreviewed`/`human_reviewed`, distinct from `classification` — see below), `notes`, `dispute_note`/`superseded_by_id` as correction metadata. **No numeric confidence score field exists anywhere** — verified by both a `CHECK`-constraint reading of the migration and a dedicated test (§10).
- **`evidence_links`** — the many-to-many join letting a relationship reference one or more Evidence records (and one Evidence record back several relationships). Deliberately polymorphic (`subject_type` + `subject_id`, not FK-enforced) rather than one join table per relationship type — see §3 below for that trade-off.

Two `CHECK` constraints worth calling out: `evidence_dispute_note_required` (a `disputed_claim` row must carry a `dispute_note` — enforced at the database level, not just as an editorial convention), and `evidence_source_url_required_unless_editorial` (every non-`stickee_editorial` source must carry a URL).

**Corrections are append-only, not in-place edits.** A correction inserts a *new* Evidence row and points the old one at it via `superseded_by_id`; the old row's core fields (`source_url`, `title`, `publisher`, `source_type`, `source_published_at`, `classification`, `retrieved_at`, `created_at`, `created_by`, `is_test_fixture`) become immutable the moment `superseded_by_id` is set, enforced by the `enforce_evidence_immutable_core()` trigger. Only the review workflow fields (`verification_status`, `reviewed_by`, `notes`) and the correction pointer itself may change after creation.

---

## 3. Portfolio schema

**Migration:** `supabase/migrations/019_responsibility_portfolio_department.sql`.

`portfolios(id, canonical_name, jurisdiction, effective_from, effective_to, is_test_fixture, created_by, created_at)`. `jurisdiction` is `CHECK`-constrained to `commonwealth | nsw | vic | qld | wa | sa | tas | act | nt | local` (matches the task brief's "jurisdiction / government level" as one field, read as a single concept rather than two). **No current Cabinet list is hardcoded or seeded** — the table starts empty; every real row requires an admin insert with at least one linked, evidence-backed citation (enforced at the read-path level, §11 below — not by a schema constraint, since a portfolio can legitimately be created and evidenced in two separate steps).

History: never updated in place except to set `effective_to` (closing the row) — enforced by a shared trigger, `enforce_history_append_only()` (§8).

---

## 4. Department schema

Same migration file, same shape as Portfolio: `departments(id, canonical_name, jurisdiction, effective_from, effective_to, is_test_fixture, created_by, created_at)`.

**`department_portfolios`** is the time-ranged many-to-many join between the two — a department is not assumed to sit under exactly one portfolio forever (a reorganisation moves it; in principle a department can concurrently support more than one portfolio). A partial unique index (`department_id, portfolio_id) WHERE effective_to IS NULL`) prevents the exact same pair being inserted twice while both are active, without limiting how many *distinct* portfolios a department can concurrently sit under.

---

## 5. Person-role relationships

**Migration:** `supabase/migrations/020_responsibility_person_issue.sql`.

`person_portfolio_roles(id, member_id, portfolio_id, role_type, responsibility_kind, effective_from, effective_to, is_test_fixture, created_by, created_at)`.

- `role_type` is `CHECK`-constrained to exactly `minister | assistant_minister` — **never a boolean `is_minister`**, and **no Shadow Minister**: the task brief only permits it "if explicitly in the approved model," and `docs/architecture/RESPONSIBILITY_ENGINE.md` never discusses opposition/shadow roles (it only models Portfolio→Person in terms of who holds government office) — adding it would require a party/opposition-structure concept this batch doesn't build, so it was left out rather than approximated.
- `responsibility_kind` is carried per-row from the full seven-kind taxonomy (`authority | responsibility | implementation | oversight | scrutiny | influence | representation`), defaulting to `'responsibility'` — see §7 for which of the seven this batch actually uses.
- **No name/fuzzy matching anywhere.** `member_id` is a real Postgres foreign key to `members(id)` — the existing, already-real uuid primary key every synced sitting parliamentarian has (migration 002). See §6 for why this was judged sufficient without building `docs/architecture/CANONICAL_ID_STRATEGY.md`'s proposed `people`/`person_external_ids` tables.

---

## 6. Issue→Portfolio relationships

Same migration. `issue_portfolios(id, issue_id, portfolio_id, responsibility_kind, effective_from, effective_to, is_test_fixture, created_by, created_at)`.

**Deliberately a join table, not a `portfolio_id` column on `issues`.** A bare column was explicitly rejected — it would recreate the exact defect already found and fixed once on `issues.mp_yes_count` (a column that exists, looks authoritative, and that nothing keeps current — see `ISSUE_DETAIL_V1_REPORT.md` §5). The join table supports both directions of cardinality the task brief requires:

- **One issue → multiple portfolios**: no constraint limits how many portfolios an issue can reference; a partial unique index only blocks the exact same `(issue_id, portfolio_id, responsibility_kind)` triple being active twice.
- **One portfolio → multiple issues**: same index, same reasoning, the other direction.

Both directions are exercised by real tests, not just asserted — see §11 (Test 11/12 in the SQL suite, and the `groupIssuePortfoliosByIssue`/`groupIssuePortfoliosByPortfolio` unit tests).

**On "canonical person IDs" for this batch (task's "no silent ID reconciliation" instruction):** the only person-identity decision this batch had to make was how `person_portfolio_roles.member_id` should reference a person. The full canonical-id migration proposed in `CANONICAL_ID_STRATEGY.md` (a new `people` table, `person_external_ids` mapping, retiring `mp-*`/`house-live-*`/`senate-*`) was **not built** — and, per the task's explicit "stop and report the blocker rather than inventing a temporary mapping" instruction, this is the place to be explicit about why that's safe rather than a corner cut:

- `members.id` (migration 002) is already a real, stable, database-issued uuid — not a string scheme, not derived from a name, not positionally synthesized. It is not one of the fragile schemes (`mp-*`, `house-live-*`, `senate-*`) identified in the architecture audit; it's the one identifier in that audit explicitly called out as *already correct*.
- Every Australian Minister and Assistant Minister must, by constitutional convention, be a sitting member of the House or Senate — so every real row this table will ever hold has a `members.id` to reference. There is no case in V1's scope where a person needs a role recorded without also being a current, synced parliamentarian.
- The scenario the broader migration exists to handle — a person's identity needing to outlive their `tvfy_id`-anchored `members` row (e.g. a former Minister who has left Parliament) — does not arise for any relationship this batch writes, since V1 only models current officeholders.

This is therefore not a blocker that was silently worked around; it's a real foreign key to a real, already-canonical column, used within the scope where it's sufficient. The one honest limitation: **a Minister who leaves Parliament while still notionally tracked (e.g., for historical record) is out of scope until the broader people-identity migration happens** — their `person_portfolio_roles` row would need `effective_to` set at the point they leave, same as any reshuffle, and no further history about them can be attached via this table afterward. This is recorded as an open item, not silently absorbed.

---

## 7. Responsibility taxonomy — what shipped vs. what's unused

All seven approved kinds (`authority`, `responsibility`, `implementation`, `oversight`, `scrutiny`, `influence`, `representation`) are valid values in both `person_portfolio_roles.responsibility_kind` and `issue_portfolios.responsibility_kind` — the column accepts any of the seven, so future batches can use the others without a schema change. **This batch's actual inserts (test fixtures and the read path) only ever use `responsibility`**, since that's the kind Charter §10 and `RESPONSIBILITY_ENGINE.md` §4's worked example assign to "who holds a portfolio" (a Minister) and to the most common Issue→Portfolio case (the portfolio-holder is politically accountable for the issue area). The SQL test suite does exercise `influence`, `implementation`, and `representation` on `issue_portfolios` (Test 11/12) to prove the column isn't hardcoded to one value — but no *real* (non-fixture) row asserting one of those was created in this batch, since no real portfolio data was seeded (see §10). **No new relationship-kind labels were invented.**

---

## 8. History strategy

Shared trigger `public.enforce_history_append_only()` (defined once, in migration 019, attached to all five time-ranged tables: `portfolios`, `departments`, `department_portfolios`, `person_portfolio_roles`, `issue_portfolios`):

- A row may be updated exactly once after creation: to set `effective_to` (closing it).
- A row that is already closed (`effective_to is not null`) can never be updated again — attempting to raises an exception naming the row.
- An update that tries to change any field *other than* `effective_to` is rejected — enforced generically via `to_jsonb(old) - 'effective_to' <> to_jsonb(new) - 'effective_to'`, so one function covers all five tables without per-table logic.
- A companion trigger, `public.prevent_row_delete()`, blocks `DELETE` outright on all five tables **and** on `evidence` — and, critically, this is a database trigger, not an RLS policy, so it holds even against the service-role admin client used by the agent runner (`src/lib/supabase-admin.ts`), which bypasses RLS entirely. RLS-only protection would not have covered that access path; this does.

`evidence_links` is the one table in this batch that permits `DELETE` (admin-only, via RLS) — a wrongly-linked citation can be unlinked without that being treated as rewriting history, since the underlying Evidence row and the relationship it was mistakenly linked to are both still fully intact and still append-only. This is a deliberate, narrower exception, not an oversight — documented in the migration's own comment.

Evidence's correction path is a variant of the same principle, handled separately (§2): instead of `effective_to`, it uses `superseded_by_id`, since a citation doesn't have a validity *period* — it's either the current understanding or it's been superseded by a newer one.

---

## 9. RLS

Every new table follows the same pattern, deliberately matching the existing `issues`/`issue_markets` public-read + `is_app_admin()`-gated-write convention already established in this codebase (migrations 007, 009, 017) rather than inventing a new one:

| Table | Public SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `evidence` | `is_test_fixture = false OR is_app_admin()` | admin only | admin only | blocked (trigger) |
| `evidence_links` | non-fixture evidence OR admin | admin only | — (no update policy; links are immutable once created, only deletable) | admin only |
| `portfolios` | `is_test_fixture = false OR is_app_admin()` | admin only | admin only | blocked (trigger) |
| `departments` | same | admin only | admin only | blocked (trigger) |
| `department_portfolios` | same | admin only | admin only | blocked (trigger) |
| `person_portfolio_roles` | same | admin only | admin only | blocked (trigger) |
| `issue_portfolios` | same | admin only | admin only | blocked (trigger) |

Test fixtures (`is_test_fixture = true`) are excluded from every public read policy — they are visible only to `is_app_admin()` — so a test row can never leak into a public page even if a future page forgets to filter for it explicitly (defence in depth: the read path in `responsibility-db.ts` *also* filters `is_test_fixture = false` at the query level by default, matching `issues-db.ts`'s existing pattern, so a fixture is excluded twice over, not just once).

**Not executed against a real database in this session** — see §10. This is a real limitation of the guarantees in this table: they are what the SQL as written should do, not what has been observed to happen.

---

## 10. Test fixtures / real-data verification

**No real ministerial, portfolio, or department data was seeded or inserted anywhere — locally or otherwise.** Per the task's explicit instruction ("do not bulk-populate unsupported political relationships... for any real seed record, require a real source and evidence entry"), and because no machine-readable authoritative source for current Australian ministerial/portfolio/department data was identified during the architecture audit (`docs/architecture/EVIDENCE_PROVENANCE_MODEL.md` §5 — Administrative Arrangements Orders are published as PDF/HTML, not an API), building even one real row would have meant hand-transcribing a claim from a document I did not fetch or verify in this session. That would be exactly the "fabricate public data to make the graph look complete" failure mode the task explicitly forbids. **This is stated plainly rather than worked around**: no trustworthy real example was inserted.

All fixture data used to exercise the schema — in both the SQL test file and the vitest test file — is clearly labelled `[TEST FIXTURE]` in its `title`/`canonical_name` fields and has `is_test_fixture = true`, matching the existing convention from `issue_markets`' own test fixtures (migration 017 / `supabase/tests/003_market_eligibility.test.sql`).

**This batch's migrations and SQL tests were authored, not executed, in this session** — this environment has no Supabase CLI (`supabase: command not found`) and no running Docker daemon (`docker info` fails to connect: `dial unix /Users/jacksontaylor/.docker/run/docker.sock: connect: no such file or directory`), confirmed by direct check before writing any SQL. This is the same situation the three pre-existing files in `supabase/tests/` (`002_wallet_lockdown.test.sql`, `003_market_eligibility.test.sql`, `004_settlement.test.sql`) were already written under, and this batch's SQL test file (`005_responsibility_engine_v1.test.sql`) follows their exact established convention: a header stating this plainly, exact `psql`/`supabase db reset` commands to run it locally, and the entire file wrapped in `begin; ... rollback;` so it never persists data even against a real local/dev database.

What **was** actually run and passed in this session (no live database required):

- `npx tsc --noEmit` — clean, no errors.
- `npx vitest run` — **532 tests passed, 0 failed**, across all 20 test files including the two new ones (`mp-scorecard-disabled.test.ts`: 7 tests; `responsibility-engine-v1.test.ts`: 23 tests). No pre-existing test was broken.
- `npm run build` — succeeded; the route list is unchanged from before this batch (no new pages, matching scope).
- `node scripts/secret-scan.mjs` — reported "no suspicious patterns found in tracked files." **Caveat:** this script scans `git ls-files` output (tracked + staged files) — since nothing in this batch was staged (per instruction), the new files were not covered by that run. I manually re-applied the script's own five regex patterns directly against every new file in this batch (migrations, TS modules, tests, this report) and found no matches — reported here rather than silently assumed clean.

Because the SQL test suite is authored-not-executed, the "one local, evidence-backed example: Issue → Portfolio → Minister/person → Department → Evidence" the task asks for is proven at the **TypeScript logic level** (real, executed, passing tests on `resolveVerificationState`/`attachVerification`/the grouping helpers in `responsibility-engine-v1.test.ts`) and **authored** at the **database level** (Test 2 of `005_responsibility_engine_v1.test.sql` inserts exactly this chain as fixtures and asserts non-null ids back). Both are clearly fixtures, not real data, consistent with the instruction above.

---

## 11. Read path

**File:** `src/lib/responsibility-db.ts` (I/O) + `src/lib/responsibility-data.ts` (pure logic, mirroring the existing `issues-db.ts`/`issues-data.ts` split already used in this codebase).

`getIssueResponsibilityGraph(issueId)` resolves, for a given Issue: its currently-active `issue_portfolios` rows → each linked Portfolio → that portfolio's currently-active `person_portfolio_roles` (with the member's name) and `department_portfolios` → each linked Department → the Evidence linked to every one of those (issue_portfolio, portfolio, person_portfolio_role, department_portfolio, department) via `evidence_links`. This is the full Issue → Portfolio → Person role → Department → Evidence chain the task asked to prove end-to-end.

**Verification state is computed at read time, never stored.** `resolveVerificationState()` reduces a relationship's linked, non-superseded Evidence down to one Charter classification, with a deliberately conservative precedence: a `disputed_claim` or `demo_content` piece of evidence always wins over a `verified_fact` linked to the same relationship (so a relationship is never shown as verified just because it also happens to have one clean citation alongside a disputed or demo one); zero qualifying evidence resolves to `unknown_no_verified_data`, never to a default of "probably fine." `isVerified()` only returns `true` for `verified_fact`/`sourced_analysis` — this is the concrete mechanism satisfying "unverified relationships cannot be exposed as verified," and it's unit-tested directly (§10/§12), not just asserted.

**No new page or route was added.** This module is not imported by any file under `src/app` — it exists as the internal extension point a future Issue Detail batch would build on, per the task's explicit "do not redesign Issue Detail yet... do not add a new public page solely to demonstrate the model" instruction.

---

## 12. Blockers found

None that stopped this batch. Two things worth recording as near-blockers that were resolved by scoping decisions documented above, not by working around them silently:

1. **No machine-readable ministerial/portfolio/department source** — resolved by seeding nothing real (§10), consistent with the task's instructions, rather than inventing a plausible-looking fixture and mislabelling it.
2. **No Supabase CLI/Docker in this environment** — resolved by following the existing repo convention for authored-not-executed SQL tests (§10), not by skipping the SQL test or silently claiming it was run.

---

## 13. Owner decisions still open

Unchanged from `RESPONSIBILITY_ENGINE_DESIGN_REPORT.md` §13, restated with this batch's effect on each:

1. **Sequencing against the Issue/Bill/Decision merge** — still open. This batch's `issue_portfolios` table works today against the existing `issues.id` text PK regardless of when/whether that merge happens; no rework was required to ship V1 ahead of it, but a future merge will still need to re-point any real rows this table accumulates.
2. **Ongoing editorial burden of manual ministerial/portfolio data entry** — still open, and now concretely blocking: **no real portfolio/department/minister data can be entered until this is answered**, since §10 confirms no automated source exists. This is the most load-bearing open decision for this system to become useful beyond fixtures.
3. **`civic_events` direction** — untouched by this batch, as scoped.
4. **Committee** — untouched, as scoped. Still no confirmed source.
5. **`mp-scorecard.ts` fix priority** — resolved by this batch (§1); no longer open.
6. **State/local government scope** — untouched. The schema's `jurisdiction` column already supports state/local values (`nsw`, `vic`, ..., `local`) so no future migration is needed to *allow* them, but no real state/local data exists or was implied by shipping this column.
7. **Legal review timing** — untouched; still open, still not resolved by this batch (see §14).

One new item, surfaced by this batch specifically:

8. **Whether `members.id`-as-person-identity (§6) is an acceptable permanent design, or a V1-only shortcut that must be replaced when the broader `people`/`person_external_ids` migration eventually happens.** This batch treats it as sufficient for V1's scope (current officeholders only) but does not resolve whether Person↔Portfolio history should ever need to reference a person who is no longer a sitting MP — that's a real product question (does Stickee want to show "X was Housing Minister from 2019–2022" after X left Parliament entirely?), not just a technical one.

---

## 14. Professional-review gates

Not resolved, silently or otherwise, in this batch — restated as still-open per the task's explicit instruction not to resolve them here:

- **APH scraping / source terms of use** — this batch did not require touching this gate at all: no ingestion of any kind was built, and no real Portfolio/Department/Evidence data was seeded (§10), so no scraping occurred and none was needed to complete the batch. This satisfies the task's "must not require scraping APH if the schema can be implemented without it" condition.
- **Accountability-page legal review** — not applicable to this batch; no accountability page or public-facing UI was built.
- **Privacy implications of future identity/account linkage** — directly relevant to Owner Decision 8 above (§13) and to the mp-scorecard fix (§1): if a future batch ever proposes linking a real Person to a real User account for any reason, that proposal should go through this gate before being built, precisely because this batch just removed one unreviewed, unsafe version of that link.

---

## 15. Files changed

All new files; nothing pre-existing was modified except `src/lib/agents/mp-scorecard.ts` (rewritten) and the five implementation-status annotations listed below.

**Code (rewritten):**
- `src/lib/agents/mp-scorecard.ts`

**Code (new):**
- `src/lib/responsibility-data.ts`
- `src/lib/responsibility-db.ts`

**Migrations (new):**
- `supabase/migrations/018_responsibility_evidence.sql`
- `supabase/migrations/019_responsibility_portfolio_department.sql`
- `supabase/migrations/020_responsibility_person_issue.sql`

**Tests (new):**
- `src/lib/__tests__/mp-scorecard-disabled.test.ts` (7 tests)
- `src/lib/__tests__/responsibility-engine-v1.test.ts` (23 tests)
- `supabase/tests/005_responsibility_engine_v1.test.sql` (12 scenarios, authored not executed — see §10)

**Documentation (new):**
- `RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md` (this file)

**Documentation (implementation-status annotations only, per the task's explicit "update only implementation-status annotations... do not rewrite historical design findings" instruction):**
- `RESPONSIBILITY_ENGINE_DESIGN_REPORT.md` (status line + §14 marked implemented)
- `docs/architecture/RESPONSIBILITY_ENGINE.md`
- `docs/architecture/CANONICAL_CIVIC_GRAPH.md`
- `docs/architecture/CANONICAL_ID_STRATEGY.md`
- `docs/architecture/EVIDENCE_PROVENANCE_MODEL.md`

`docs/architecture/CIVIC_EVENT_MODEL.md` was **not** annotated — nothing in this batch touched or changed its status; it remains entirely design-only, as scoped.

---

## 16. Migrations

Three new migration files, `018`–`020`, sequential after the existing `017_market_lifecycle_and_settlement.sql`. Full table/index/FK/RLS/history detail is in §2–§9 above; summarised:

| Migration | Tables created | Shared functions/triggers introduced |
|---|---|---|
| 018 | `evidence`, `evidence_links` | `prevent_row_delete()`, `enforce_evidence_immutable_core()` |
| 019 | `portfolios`, `departments`, `department_portfolios` | `enforce_history_append_only()` |
| 020 | `person_portfolio_roles`, `issue_portfolios` | (reuses 019's `enforce_history_append_only()`) |

Each file's own header comment states its exact reversal (`drop table if exists ...; drop function if exists ...;`), since this repo has no separate down-migration convention (confirmed by inspecting all 17 pre-existing migrations — none has one). **Not applied to any database in this session** — see §10 for why and what was verified instead.

---

## 17. Tests

- `src/lib/__tests__/mp-scorecard-disabled.test.ts` — 7 tests, executed, passing.
- `src/lib/__tests__/responsibility-engine-v1.test.ts` — 23 tests, executed, passing. Covers: verification-state precedence (including the disputed/demo-trumps-verified cases), zero-evidence and all-superseded-evidence both resolving to `unknown_no_verified_data`, `attachVerification` never silently upgrading an unverified relationship, one-issue-to-many-portfolios and one-portfolio-to-many-issues cardinality (including mixed responsibility kinds on the same issue), and a set of migration-source-scan checks: no numeric confidence/trust/weight column anywhere, no `ALTER TABLE issues ADD COLUMN` (i.e. no bare `portfolio_id` shortcut), every time-ranged table has both required triggers, the dispute-note `CHECK` constraint exists, every write policy is admin-gated, every read policy respects the fixture/admin split, `member_id` is a real FK to `members(id)`, no `mp-*`/`house-live-*`/`tvfy-*` string scheme appears in executable SQL, and no `.toLowerCase()`/`.ilike()`/name-matching pattern exists in the new TS modules.
- `supabase/tests/005_responsibility_engine_v1.test.sql` — 12 scenarios, authored, **not executed** (§10): non-admin insert rejected; admin insert succeeds; fixture rows invisible to non-admin readers; non-fixture rows publicly readable; closing a row (setting `effective_to`) succeeds; in-place edits to an open row rejected; edits to an already-closed row rejected; `DELETE` rejected even for the table-owning connection role (proving the trigger, not just RLS, is what's stopping it); Evidence immutable once superseded; `disputed_claim` without `dispute_note` rejected by the `CHECK` constraint; one issue with multiple concurrent portfolio relationships; one portfolio linked from multiple issues.

Full-suite result: **532 passed, 0 failed** (`npx vitest run`), including all pre-existing tests — no regression.

---

## Final response

1. **mp-scorecard bug fix** — the `display_name`-based MP↔user-account join is fully removed, not replaced; the agent is now a documented, tested, safe no-op (`status: 'warn'`). See §1.
2. **Evidence/Citation schema** — `evidence` + `evidence_links` (migration 018), Charter's 8-way classification reused verbatim, append-only corrections via `superseded_by_id`, no numeric confidence field. See §2.
3. **Portfolio schema** — `portfolios` (migration 019), time-ranged, no hardcoded Cabinet list. See §3.
4. **Department schema** — `departments` + time-ranged `department_portfolios` many-to-many (migration 019). See §4.
5. **Person-role relationships** — `person_portfolio_roles` (migration 020): `member_id → members(id)` real FK, `role_type` enum (`minister`/`assistant_minister`, no boolean, no Shadow Minister), `responsibility_kind` from the seven-kind taxonomy. See §5–§6.
6. **Issue→Portfolio relationships** — `issue_portfolios` (migration 020): many-to-many join table, explicitly not a bare column on `issues`; both cardinality directions tested. See §6.
7. **History handling** — shared `enforce_history_append_only()` trigger across all five time-ranged tables; shared `prevent_row_delete()` blocking deletes even for the table-owning/service-role connection; Evidence's own immutable-core-fields trigger. See §8.
8. **RLS** — public read of non-fixture rows, `is_app_admin()`-gated writes, no delete policy anywhere (deletes blocked at the trigger level instead), matching the existing `issues`/`issue_markets` convention. See §9. **Not verified against a live database in this session** — authored only, same as the pre-existing `supabase/tests/*.sql` files this batch follows the convention of.
9. **Migrations** — three new files, `018`–`020`, each with a stated reversal path in its header. See §16.
10. **Tests** — 30 new TypeScript tests (all executed, all passing) + 12 SQL scenarios (authored, not executed — no local Postgres/Docker available in this environment). Full suite: 532/532 passing, no regressions. See §17.
11. **Verification** — `npx tsc --noEmit` clean; `npx vitest run` 532/532 passing; `npm run build` succeeds with an unchanged route list; `node scripts/secret-scan.mjs` clean on tracked files, manually re-applied against every new untracked file in this batch with no matches. See §10.
12. **Blockers** — none stopped the batch; two near-blockers (no ministerial data source, no local Postgres) resolved by scoping/convention decisions, not workarounds. See §12.
13. **Owner decisions** — 7 carried over from the design report, 1 new (whether `members.id`-as-identity is permanent or V1-only). See §13.
14. **Professional-review gates** — none required or resolved by this batch; APH scraping gate specifically confirmed unnecessary for what was actually built (no ingestion occurred). See §14.
15. **Files changed** — see §15 for the complete list (2 code files, 3 migrations, 3 test files, 1 new report, 5 status-only doc annotations).
16. **Confirmation** — production was not accessed. Nothing was staged, committed, pushed, or deployed. `git status` confirms only the files listed in §15 changed; every other pre-existing uncommitted change in the working tree (the in-progress nav/homepage redesign, and the design-report batch's own six files) is untouched.
