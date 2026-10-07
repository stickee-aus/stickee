# Real Issues V1 — First Curated Civic Dataset

**Status: Data-quality/editorial-foundation batch. Local/dev-scoped only. Production was not accessed. Nothing was staged, committed, pushed, or deployed.**

Governed by [AGENTS.md](AGENTS.md). Read before/during this work: `docs/philosophy/STICKEE_CHARTER.md`, [RESPONSIBILITY_ENGINE_DESIGN_REPORT.md](RESPONSIBILITY_ENGINE_DESIGN_REPORT.md), [RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md](RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md), [RESPONSIBILITY_ENGINE_V1_FIRST_REAL_SLICE_REPORT.md](RESPONSIBILITY_ENGINE_V1_FIRST_REAL_SLICE_REPORT.md), [CANONICAL_PERSON_IDENTITY_V1_REPORT.md](CANONICAL_PERSON_IDENTITY_V1_REPORT.md), [ISSUE_DETAIL_V1_REPORT.md](ISSUE_DETAIL_V1_REPORT.md), migrations 018–023, `src/lib/responsibility-db.ts`, `src/lib/responsibility-data.ts`, `src/components/IssueResponsibilitySection.tsx`, `supabase/migrations/007_issues_and_markets.sql`, `supabase/seed.sql`, `src/lib/mock-data.ts`.

Goal, per the task brief: replace demo-only issue records with a small, genuinely sourced, evidence-backed first dataset — quality over quantity, roughly five candidates, no forcing.

---

## 1. Candidate issues audited

The five demo issues that exist today, all mock-only (`src/lib/mock-data.ts:205-256`) — **none of the five previously existed as a database row at all**, confirmed by reading `supabase/seed.sql` (which seeds only `test-market-*` fixtures) and by the fact that migration 021's guard already required inserting `housing-affordability` fresh, not updating an existing row.

| Issue (mock id) | Live/current? | Title accurate? | Object type | Authoritative source available? | Status terminology fits? | Graduated? |
|---|---|---|---|---|---|---|
| `housing-affordability` | Yes | Roughly, adjusted (see §3) | Broad, ongoing civic issue | Yes — Help to Buy Act 2024, Housing Australia | Yes (`active`) | **Yes** |
| `climate-safeguard` | The 2023 reform itself is concluded; the scheme it created operates on an ongoing annual cycle | Adjusted for precision (see §3) | Enacted legislation, now in ongoing regulatory operation | Yes — Safeguard Mechanism (Crediting) Amendment Act 2023, DCCEEW | Yes (`passed`, with a caveat — see §6) | **Yes** |
| `ndis-reform` | Yes — one Act already passed; the larger "foundational supports" change is still in progress | Accurate as-is | Broad, ongoing civic issue containing one already-enacted sub-object | Yes — NDIS Amendment Act 2024, NDIS.gov.au, health.gov.au | Yes (`active`) | **Yes** |
| `tax-cuts` | No — fully concluded, in effect since 1 July 2024 | Retitled for clarity (see §3) | Enacted legislation (historical outcome) | Yes — Treasury Laws Amendment (Cost of Living Tax Cuts) Act 2024 | Yes (`passed`) | **Yes** |
| `misinformation-bill` | **No** — the government confirmed it will not proceed with this bill | Now inaccurate (implies it's still being debated) | Was a parliamentary bill; is now an abandoned legislative proposal | Yes, but proves the *opposite* of the mock content | **No** — none of `active`/`passed`/`rejected` truthfully describes "withdrawn before a vote" | **No — retired from the real dataset** |

**Method**: every fact below was retrieved via live web search/fetch in this session (current date August 2026, past this session's stated knowledge cutoff of January 2026) — not from model memory. Every citation is a primary source (Federal Register of Legislation, a Commonwealth department, or a minister's own portfolio site), per the task's source standard. No Wikipedia, party page, or news article was used as a sourcing citation (news/law-firm summaries surfaced in search results were used only to *locate* primary sources, never cited as the source itself).

---

## 2. Issues promoted to real

Four: `housing-affordability`, `ndis-reform`, `climate-safeguard`, `tax-cuts`. Real (`is_test_fixture = false`) `issues` rows for all four, authored in `supabase/migrations/024_real_issues_v1_data.sql`.

## 3. Issues left as demo / retired / renamed

**`misinformation-bill` — retired from the real dataset, left demo-only.** This is the audit's most consequential single finding. The Communications Legislation Amendment (Combatting Misinformation and Disinformation) Bill 2024 was introduced 12 September 2024, referred to a Senate committee, and — per the government's own subsequent public position — **will not proceed**. No `issues` row was inserted for this id. `issues.status` is `CHECK`-constrained to exactly `('active', 'passed', 'rejected')`; none of these three values is honest here: `active` would misrepresent an abandoned bill as still live; `rejected` would misrepresent a withdrawal (no vote occurred) as a formal defeat. Per the task's explicit "if it cannot be made truthful, leave it demo" instruction, this issue stays exactly where it already was — mock-only, unpromoted — rather than being forced into a misleading status. **This is a real schema gap, not a workaround**: see §6.

**No issue was renamed in the database** (all four keep their original mock ids, preserving any existing inbound links), but two titles were adjusted for accuracy when promoted to real content:
- `housing-affordability`: title shortened from "Housing Affordability Crisis" to **"Housing Affordability"** — "crisis" wasn't sourced to any specific claim this batch verified, and the Charter (§17) asks for calm, non-sensational language by default.
- `tax-cuts`: title changed from "Stage 3 Tax Cuts (Modified)" to **"Stage 3 Tax Cuts (Revised)"** — "modified" and "revised" are synonyms; "revised" was chosen only because it's the more common term in the primary sources checked. No substantive change.
- `climate-safeguard`: title changed from "Climate Safeguard Mechanism" to **"Safeguard Mechanism (Climate)"** for consistency with how DCCEEW and legal commentary name the scheme.
- `ndis-reform`: title ("NDIS Reform") unchanged — already accurate.

---

## 4. Authoritative sources used

All fetched live this session (web search/fetch), not from memory:

| Issue | Primary source(s) | Publisher |
|---|---|---|
| Housing | [Help to Buy Act 2024](https://www.legislation.gov.au/C2024A00124/asmade); [Housing Australia launch release, 28 Nov 2025](https://www.housingaustralia.gov.au/media/more-australians-supported-home-ownership-launch-australian-government-help-buy-scheme) | Federal Register of Legislation; Housing Australia |
| NDIS | [NDIS Amendment (Getting the NDIS Back on Track No. 1) Act 2024](https://www.legislation.gov.au/C2024A00081/asmade); [NDIS.gov.au news item](https://www.ndis.gov.au/news/10304-critical-ndis-legislation-becomes-law) | Federal Register of Legislation; National Disability Insurance Agency |
| Climate (Safeguard Mechanism) | [Safeguard Mechanism (Crediting) Amendment Act 2023](https://www.legislation.gov.au/C2023A00014); [DCCEEW Safeguard Mechanism overview](https://www.dcceew.gov.au/climate-change/emissions-reporting/national-greenhouse-energy-reporting-scheme/safeguard-mechanism/overview) | Federal Register of Legislation; Department of Climate Change, Energy, the Environment and Water |
| Tax cuts | [Treasury Laws Amendment (Cost of Living Tax Cuts) Act 2024](https://www.legislation.gov.au/C2024A00003/asmade) | Federal Register of Legislation |
| Ministerial appointments (all four) | [Instruments of appointment of ministers of state, 13 May 2025](https://www.pmc.gov.au/resources/instruments-appointment-ministers-state-13-may-2025); [Administrative Arrangements Order, 13 May 2025](https://www.pmc.gov.au/resources/aao-13-may-2025) | Department of the Prime Minister and Cabinet — the same instrument already used for Housing in migration 021; independently re-confirmed this session by direct fetch, not assumed still valid |
| Misinformation Bill (negative finding) | Search results directly quoting the government's "will not proceed" position, corroborated by the bill's own Parliament of Australia and Senate committee pages | Parliament of Australia; government statements |

No secondary/news source was used as a citation of record; law-firm and news summaries were used only to locate the primary documents above.

---

## 5. Issue-vs-bill-vs-decision findings

Every candidate was explicitly classified, per the task's instruction not to silently collapse these:

- **`housing-affordability`** — broad, ongoing civic issue. Help to Buy is one government *program* addressing it (already enacted and running), not the whole issue; the issue itself has no natural "passed/rejected" endpoint.
- **`ndis-reform`** — broad, ongoing civic issue **containing** one already-enacted sub-object (the 2024 Act, in force since 3 October 2024) and one not-yet-operating sub-object (foundational supports). The current schema has no way to represent "this issue's first phase passed; its second phase hasn't started" other than prose in `what_is_happening` — flagged explicitly rather than solved.
- **`climate-safeguard`** — genuinely dual-natured: the *2023 Amendment Act* is enacted legislation (a historical, concluded event — `passed` is correct for it), but the *Safeguard Mechanism itself* is an ongoing regulatory regime that will keep operating and generating new facts (compliance data, credit trading) every year through 2030. `issues.status = 'passed'` correctly describes the legislative event but cannot describe the ongoing operation — see §6.
- **`tax-cuts`** — cleanly a **historical outcome**: one Act, enacted, in effect, nothing pending. The cleanest of the four to classify.
- **`misinformation-bill`** — was a **parliamentary bill**; is now neither passed nor rejected in the formal sense — an abandoned legislative proposal. No existing category in the task's own list ("broad civic issue / parliamentary bill / enacted legislation / government policy-decision / historical outcome") cleanly fits "bill the government chose to abandon before a vote" — this is itself worth naming as a sixth category a future taxonomy should consider.

**The Issue/Bill/Decision schema merge itself was not performed** — out of scope, per the task's explicit instruction — but this audit adds one concrete, real data point to the existing case for it: `ndis-reform` is a live example of one Issue legitimately containing both a `passed` bill-shaped sub-object and an `active` still-developing one, which the current single-`status`-column model cannot represent without prose workarounds.

---

## 6. Responsibility relationships created

All via the existing Responsibility Engine only (`portfolios`, `departments`, `department_portfolios`, `issue_portfolios`, `person_portfolio_roles`, `evidence`, `evidence_links`) — no hardcoded page-specific relationship, no new table.

| Issue | Portfolio | Department | Minister(s) | Evidence count on the relationship |
|---|---|---|---|---|
| `housing-affordability` | Housing (pre-existing from migration 021) | Department of the Treasury | Clare O'Neil (tvfy_id 10814) | 3 (021) + 2 new (Help to Buy Act, Housing Australia release) |
| `ndis-reform` | National Disability Insurance Scheme (new) | Department of Health, Disability and Ageing (new) | **Mark Butler (tvfy_id 10086) AND Jenny McAllister (tvfy_id 10839)** — both real, concurrent `minister` roles | 3 |
| `climate-safeguard` | Climate Change and Energy (new) | Department of Climate Change, Energy, the Environment and Water (new) | Chris Bowen (tvfy_id 10060) | 2 |
| `tax-cuts` | Treasury (new — distinct from the Housing portfolio, same department) | Department of the Treasury (reused from 021) | Jim Chalmers (tvfy_id 10809) | 1 |

**NDIS's two ministers are a genuine finding, not a data-entry ambiguity resolved by guessing.** The 13 May 2025 Instrument of Appointment names Mark Butler as "Minister for Health and Ageing and Minister for Disability and the National Disability Insurance Scheme" **and** Jenny McAllister as "Minister for the National Disability Insurance Scheme" — two people, two overlapping NDIS-related offices, neither styled "Assistant Minister" in the instrument. Both are recorded as `role_type = 'minister'` on the same portfolio. This is the Responsibility Engine's many-to-many `person_portfolio_roles` design working exactly as intended — Charter §10's "responsibility is frequently held by different people... for the same outcome" — rather than a bug requiring one name to be picked.

**Partial-graph discipline was followed throughout**: every relationship inserted required its own qualifying Evidence before insertion (each migration guards on the relevant Evidence row already existing); nothing was inserted "to complete the picture." No fifth portfolio/minister relationship was attempted for `misinformation-bill` — correctly, since it was never promoted.

---

## 7. Evidence created

**8 new real Evidence rows** (`is_test_fixture = false`, `classification = 'verified_fact'`, `source_type = 'official'`), authored in `supabase/migrations/025_real_issues_v1_portfolios.sql`:

1. National Disability Insurance Scheme Amendment (Getting the NDIS Back on Track No. 1) Act 2024 — legislation.gov.au
2. "Critical NDIS legislation becomes law" — NDIS.gov.au
3. Safeguard Mechanism (Crediting) Amendment Act 2023 — legislation.gov.au
4. Safeguard Mechanism overview — DCCEEW
5. Treasury Laws Amendment (Cost of Living Tax Cuts) Act 2024 — legislation.gov.au
6. Help to Buy Act 2024 — legislation.gov.au
7. Housing Australia Help to Buy launch media release — Housing Australia
8. (Existing, reused via lookup by `source_url`, not duplicated): the 13 May 2025 Instrument of Appointment and Administrative Arrangements Order, already in the database from migration 021, linked to five additional new subjects (three new portfolios, one new department, four new minister roles).

Every classification used across both new migrations is one of the Charter's 8-way values (`verified_fact` exclusively, in this batch) — enforced by a dedicated test (§14). No numeric confidence/trust score exists on any row.

**Schema gap found and deliberately not worked around**: `evidence_links.subject_type` is `CHECK`-constrained to `('portfolio', 'department', 'department_portfolio', 'person_portfolio_role', 'issue_portfolio')` — **it does not include `'issue'`**. This means an Issue's own primary sourcing (e.g., the Help to Buy Act, as a citation for the *Housing issue itself*, not just its Portfolio relationship) has no typed home in the schema; only `issues.source_url` (one URL) can hold it directly. This batch's workaround — linking issue-level evidence to the issue's `issue_portfolio` relationship instead, since that's the closest valid `subject_type` — is a reasonable use of what exists, not a fix. **Flagged as a real, unresolved schema gap** (see §12), consistent with the task's "document every place the current schema forces a misleading representation" instruction. Not fixed in this batch — extending `evidence_links`'s subject-type enum is a schema change, and this batch's mandate was data, not schema.

---

## 8. Minister identity mappings

All four via `members.tvfy_id` only — the canonical anchor established in `CANONICAL_PERSON_IDENTITY_V1_REPORT.md` — never by name, electorate, or house:

| Minister | tvfy_id | Chamber | How resolved |
|---|---|---|---|
| Clare O'Neil | 10814 | House (Hotham) | Already resolved (migration 023, reused) |
| Mark Butler | 10086 | House (Hindmarsh) | New this batch |
| Jenny McAllister | 10839 | **Senate** (NSW) | New this batch — resolved identically to the House cases, purely via `tvfy_id`, proving Senate identity doesn't need a different mechanism |
| Chris Bowen | 10060 | House (McMahon) | New this batch |
| Jim Chalmers | 10809 | House (Rankin) | New this batch |

Every `tvfy_id` was retrieved via one live, read-only call to TheyVoteForYou's `/people.json` this session (the same call pattern already established and reported in `CANONICAL_PERSON_IDENTITY_V1_REPORT.md`), then independently cross-checked against the same primary instrument (13 May 2025) that names each person's office. **No name-matching or electorate-fallback logic (migration 022's pattern) was used or needed anywhere in this batch** — verified by a dedicated test (§14).

---

## 9. Department/portfolio mappings

Three new Portfolios, three new (or one reused) Departments — all `commonwealth` jurisdiction, all `effective_from = '2025-05-13'` (the earliest date this batch has direct evidence for the *current* administrative arrangement — not a claim about when the department or portfolio itself was founded; same explicit caveat migration 021 already established for Housing/Treasury, restated in each new migration's comments):

- **National Disability Insurance Scheme** portfolio → **Department of Health, Disability and Ageing** (new department; the AAO explicitly transfers NDIS + Foundational Supports into this portfolio from the former Social Services arrangement).
- **Climate Change and Energy** portfolio → **Department of Climate Change, Energy, the Environment and Water** (new department).
- **Treasury** portfolio → **Department of the Treasury** (department reused from migration 021, via lookup — not duplicated; this is the many-to-many `department_portfolios` design working as intended: one department, Treasury, now correctly shown administering two distinct portfolios, Housing and Treasury).

---

## 10. Forecast relationships

**None created.** No `issue_markets` row was inserted for any of the four promoted issues — confirmed by a dedicated test scanning migration 024 for any `insert into issue_markets` statement (none found). This is a deliberate finding, not an oversight: no real, eligible forecast market exists for any of these four issues in this environment, and the task explicitly forbids creating one "merely to make an issue look complete." A real issue with no real forecast is the correct, honest state — `getIssueDetailData()`'s existing mock-forecast-fallback removal (already shipped in `ISSUE_DETAIL_V1_REPORT.md` §10) means none of these four issues can accidentally surface a demo forecast either, since that fallback path was already closed before this batch began.

---

## 11. Housing: full chain, proven again with real content

Migration 021 (from the prior identity-verification session) already proved the Housing chain mechanically using a synthetic, explicitly-labelled local-only placeholder issue row. This batch replaces that placeholder with genuine content (migration 024) and adds two further pieces of Evidence (the Help to Buy Act and the Housing Australia launch release, migration 025) to the same, pre-existing `issue_portfolio` relationship. Re-verified end-to-end against a real local Postgres database, through the exact anonymous PostgREST access path the app uses:

```
Housing Affordability (real issue, status=active)
  → Housing (Portfolio, commonwealth)
    → Minister: Clare O'Neil (tvfy_id 10814)
    → Department: Department of the Treasury
  ← Evidence: PM&C instrument + AAO + Treasury ministers directory (021) + Help to Buy Act + Housing Australia launch release (025)
```

No Housing-specific code was written or touched. `IssueResponsibilitySection` and `getIssueResponsibilityGraph` are entirely generic (re-confirmed unchanged, byte-for-byte, by `git status`) — this batch is data only.

---

## 12. Unresolved data gaps

Named plainly, not worked around:

1. **`evidence_links.subject_type` has no `'issue'` case** (§7) — an Issue's own sourcing has no typed home beyond one `source_url` string. Fixing this is a schema change and an owner decision (§15).
2. **`issues.status` cannot express "withdrawn before a vote"** (§1/§3/§6) — the direct reason `misinformation-bill` couldn't be promoted. A `status` value like `withdrawn` or `not_proceeding`, or a separate `object_type`/`kind` column distinguishing "broad issue" from "specific bill" (already an open item from `ISSUE_DETAIL_V1_REPORT.md` §17.2), would resolve this.
3. **No column distinguishes "the legislative event passed" from "the resulting scheme/program is ongoing"** (§5/§6, Safeguard Mechanism) — `climate-safeguard`'s `status = 'passed'` is correct for the 2023 Act but understates that the scheme is a live, annually-operating regime; the same gap affects `ndis-reform`'s "one sub-object passed, one hasn't started" shape.
4. **`published_at` (distinct from `updated_at`) and a formal `truth classification` enum on `issues` do not exist** — the task's own "ISSUE RECORD STANDARD" names these as desired fields; this batch did not add them (adding columns is a schema change beyond this batch's data-only mandate) and instead carried the equivalent information in each Evidence row's `source_published_at`/`retrieved_at`/`classification`, which is complete for the *portfolio relationship* but not reachable from the Issue itself (same root cause as gap 1).
5. **`who_supports`/`who_opposes` for all four issues are conservatively hedged**, not exhaustively sourced — this batch verified the *government's own actions and dates* to primary-source standard, but did not independently verify a full account of every party's or stakeholder group's position for each issue. Where this batch could not cite a specific source for an opposition claim, the field says so explicitly (e.g., "not yet independently sourced for this batch") rather than asserting an unsourced characterisation. This is a real, named gap — not filled with plausible-sounding but unverified political framing.
6. **Foundational supports (NDIS) has no confirmed national operating date** in the sources checked this session — `ndis-reform`'s content states this plainly rather than guessing.

---

## 13. Local DB verification

Followed the exact workflow documented in `CANONICAL_PERSON_IDENTITY_V1_REPORT.md` §5–§6: local Docker + `npx supabase start` (isolated from the remote project referenced in `.env.local`, which remains untouched and unreachable from this environment).

**One new, minor operational finding this session**: `supabase start` (unlike a already-initialized `db reset`) attempts to apply every migration file present, in order, on first bring-up — so migrations 021/023/024/025/026 (each of which guards on a precondition that doesn't yet exist at that point in a from-scratch sequence) were temporarily held out of `supabase/migrations/` during the initial `start`, then moved back and applied individually via `psql -f`, in dependency order: **024 (issue content) → 021 (Housing portfolio) → [live member sync] → 023 (Housing minister) → 025 (NDIS/Climate/Treasury portfolios) → 026 (NDIS/Climate/Treasury ministers)**. This is the same manual-sequencing workaround the identity report already used and documented for 021/023, extended by one step (024 must run before 021, since 021's guard now depends on it) — not a new problem this batch introduced, and not a workaround that touched any shared or production environment.

A second, unrelated flake was hit and resolved: `supabase start`'s health checks for Analytics/Realtime/Storage/Studio containers (none of which this verification needs) timed out twice in this environment; `--ignore-health-check` was used to proceed once Postgres and PostgREST were confirmed healthy, which is all this batch's verification required.

**Verified live, via the real anonymous PostgREST access path** (the same one `src/lib/supabase-server.ts` uses):
- All four real issues are publicly readable, with correct `status` and `is_test_fixture = false`.
- `misinformation-bill` returns zero rows — confirmed absent from the database entirely, not merely filtered.
- The full chain resolves for all four issues (superuser join query, cross-checked against individual anon-key REST calls for NDIS specifically): Issue → Portfolio → Minister(s) → Department, with NDIS correctly showing **two** minister rows.
- Evidence counts confirmed per relationship (3 for NDIS's `issue_portfolio`, matching the AAO + Act + NDIA-news trio).
- Both new migrations (025, 026) re-run cleanly with no side effect (`already exists — skipping` for every row) — idempotency proven, not just asserted.

Local stack stopped with `--no-backup` at the end of this session; no state persists.

---

## 14. Tests

**24 test files, 592 tests, all passing** (`npx vitest run`) — 573 pre-existing (no regressions) + 1 new file, `src/lib/__tests__/real-issues-v1.test.ts` (19 tests), covering every item on the task's required list:

- Real issues (024) have primary evidence: every promoted issue has a non-empty `source_url`.
- `misinformation-bill` never appears in any of the three new migrations — demo issues remain clearly demo.
- Issue content (024) and Responsibility Engine relationships (025/026) are structurally separate migrations — a DB row alone cannot imply a verified responsibility graph (024 contains zero `portfolios`/`issue_portfolios`/`person_portfolio_roles` writes).
- Every relationship-creating insert in 025 has a matching (or greater) count of `evidence_links` inserts — no responsibility relationship renders without evidence.
- 026 resolves every minister via `tvfy_id` only — regex-scanned for the absence of name/electorate/house/`ilike`/`display_name` predicates.
- NDIS's two concurrent minister roles are both present and both real — partial/distributed responsibility graphs remain valid, not collapsed to one name.
- Housing/NDIS are `active`; Climate/Tax are `passed` — broad ongoing issues are not mislabelled with bill lifecycle terms, and genuinely concluded legislative events are not left `active`.
- No `issue_markets` insert anywhere in the new migrations — real issues do not use a mock/demo forecast fallback.
- Every Evidence classification used is one of the Charter's 8-way values.
- Both new relationship migrations (025, 026) are proven idempotent by source-scan (`already exists — skipping` present) and by the live re-run in §13.

All 573 pre-existing tests re-run, not assumed still valid — including `responsibility-tvfy-identity.test.ts`'s 16 tests (re-confirming Housing's tvfy-based resolution is untouched) and `issue-detail-v1.test.ts`'s 26 tests (re-confirming the generic Issue Detail page and its mock-forecast-removal are unchanged).

**Executed this session, all clean:**
```
npx tsc --noEmit               → clean, 0 errors
npx vitest run                 → 592/592 passed (24 files), no regressions
npm run build                  → succeeded, route list unchanged (no new pages)
node scripts/secret-scan.mjs   → "no suspicious patterns found in tracked files"
```
New files (three migrations, one test file, this report) are untracked, so — same caveat as every prior batch in this session — they were manually checked against `secret-scan.mjs`'s own five patterns; no matches.

---

## 15. Owner decisions

1. **Extend `evidence_links.subject_type` to include `'issue'`** (§7/§12) — the most concrete, specific schema change this batch's findings point to. Not applied here (schema change, out of this batch's data-only mandate).
2. **Add a `status` value (or separate `object_type`) that can truthfully represent "withdrawn/not proceeding"** (§3/§6/§12) — the direct blocker on promoting `misinformation-bill`. Until this exists, that issue should stay demo-only; it should not be force-fit into `rejected`.
3. **Whether/when to add `published_at` and a formal per-Issue truth-classification column** (§12) — carried from the task's own "ISSUE RECORD STANDARD" wishlist; this batch routed the equivalent information through Evidence instead, which is real but only reachable via the Portfolio relationship, not the Issue directly.
4. **Whether to research and independently source a fuller `who_supports`/`who_opposes` account for each of the four promoted issues** (§12) — this batch deliberately left several of these hedged rather than invent plausible-sounding political framing; a follow-up editorial pass could close this with dedicated Hansard/committee-submission research.
5. **Carried over, unaffected, from `CANONICAL_PERSON_IDENTITY_V1_REPORT.md`**: whether to apply any of these migrations (021/023/024/025/026) to the actual remote Supabase project — still unreachable from this environment, still an owner decision for whoever has access to it.
6. **Recommended next five issues** (§16) — an owner call on sequencing, not a technical blocker.

---

## 16. Recommended next 5 issues

Not researched or verified in this session — named only as reasonable next candidates, based on what already has an obvious, checkable primary-source trail and an identifiable Commonwealth portfolio, consistent with this batch's "quality over quantity" approach:

1. **Aged care reform** (Aged Care Act 2024 — has its own clean Act/commencement-date trail, likely a similarly clean promotion to `tax-cuts`).
2. **Nature Positive / Environmental law reform** (a live, evolving issue distinct from the Safeguard Mechanism — tests the schema's ability to hold a genuinely `active`, undecided issue with a real portfolio link).
3. **Student debt / HELP indexation changes** (Treasury/Education-adjacent, another enacted-legislation case with a clean date trail).
4. **Aboriginal and Torres Strait Islander Voice / follow-on policy work** — high sensitivity; would specifically test the Charter's contested-topic discipline (§6) and should not be attempted without deliberate editorial care, flagged here rather than attempted casually.
5. **RBA / interest rate framework reforms** (RBA governance reform Act) — tests a portfolio (Treasury) already built by this batch, low incremental Responsibility Engine cost.

---

## 17. Files changed

**New:**
- `supabase/migrations/024_real_issues_v1_data.sql` — real content for 4 issues.
- `supabase/migrations/025_real_issues_v1_portfolios.sql` — 3 new Portfolios, 2 new Departments, 1 reused Department, 8 new Evidence rows, all relationship joins.
- `supabase/migrations/026_real_issues_v1_ministers.sql` — 4 new Minister roles, all via `tvfy_id`.
- `src/lib/__tests__/real-issues-v1.test.ts` — 19 new tests.
- `REAL_ISSUES_V1_DATA_REPORT.md` (this file).

**Modified:** none. `src/lib/mock-data.ts`, `src/app/issue/[id]/page.tsx`, `src/components/IssueResponsibilitySection.tsx`, `src/lib/responsibility-db.ts`/`responsibility-data.ts`, and every migration 001–023 are byte-for-byte unchanged.

**Nothing staged, committed, pushed, or deployed.**

---

## 18. Confirmation production was untouched

Production/remote was not accessed. The remote Supabase project referenced by `.env.local` was neither read from nor written to at any point (same DNS-unreachable backstop already documented in `CANONICAL_PERSON_IDENTITY_V1_REPORT.md` applies unchanged). Every database operation in this report targeted `127.0.0.1:54321`/`54322` only — a local, Docker-based Postgres instance brought up and torn down (`supabase stop --no-backup`) entirely within this session. The only external requests made were read-only: web search/fetch against public government sites (legislation.gov.au, PM&C, DCCEEW, NDIS.gov.au, Housing Australia, Treasury) to source real content, and one read-only call to TheyVoteForYou's public API using the already-configured credential, exactly as in the prior identity-verification session.
