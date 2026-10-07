# Issues V1 — Truthfulness and List-Page Simplification

Governed by [`AGENTS.md`](AGENTS.md) and [`docs/philosophy/STICKEE_CHARTER.md`](docs/philosophy/STICKEE_CHARTER.md) — the first implementation batch run under the Charter. Scope: `/issues` (full simplification) and the minimum safe truthfulness fixes on `/issue/[id]` required for the list→detail journey to be honest. No other core page was touched. No code was staged, committed, pushed, or deployed. Production was not accessed.

---

## 1. What the Issues page now exists to do

`/issues` answers exactly one question: **"What major problems is Australia dealing with, and why do they matter?"** It is a flat, readable catalogue — title, one-line summary, truthful status, and a single "View issue" action per row. It no longer behaves as a bill tracker, MP voting dashboard, prediction market, opinion poll, or campaign system on the list surface; those concepts are now either removed, gated behind a real-data check, or left to the detail page.

## 2. What was removed (from the list page)

| Element | Was | Removed because |
|---|---|---|
| MP Yes % per row | Computed from `issue.voteSummary` — real DB aggregate when Supabase-backed, **fully inferred from `PARTY_VOTE_MAP` (party-line assumption) in the mock/fallback path** | Unsupported percentage on the list; the underlying figure isn't an individual MP vote even when "real" (see §4) |
| Yes/No/Abstain bar + counts | Same source as above | Same as above — a vote-count visualisation belongs on a detail/tracker surface, not a catalogue row |
| Market probability + trend arrow + participant count | `markets[issue.id]`, **100% hand-authored fabricated numbers** in the mock fallback (`mock-market-data.ts`'s `marketRaw` array) | Fake probabilities/participants/movement are banned outright; even when real, this duplicates Forecasts' job |
| "Email your MP" | `EmailMPModal`, opened inline from the expanded row | Task requirement; also implied guaranteed influence with no per-row context |
| "Predict outcome" link | `Link` to `/predictions?market=...` | Prediction controls banned from the list page |
| Expand-in-place row state | `useState`/`setExpanded`, revealing "What's happening"/who-supports/who-opposes inside the row | Replaced by a real link to the canonical detail route (see §3 — this didn't exist before) |
| Duplicate headline count | Total shown in hero, again in a `hidden sm:flex` stat-tile block, again per status tab | Reduced to one hero number; tabs now carry plain labels with no embedded count |
| "Bills & Issues" / "bills tracked" framing | Page eyebrow and hero unit label | See §4 — not every row is a bill; replaced with neutral "Issues" / "Issues tracked" |

## 3. What verified information was preserved, and what was newly built

- **Title, summary, status** — kept, DB-backed when real.
- **Status filter (All/Active/Passed/Rejected)** — kept. Confirmed a correct, working pattern in the existing audits, and no live mismatch exists in the current dataset (see §4 for the underlying risk that remains).
- **A real link to the canonical detail route did not exist before this batch.** The previous `IssueCard` was a pure expand/collapse `<button>` with no `<Link href="/issue/[id]">` anywhere — a first-time reader had no way to reach `/issue/[id]` from the list at all. This batch adds the one dominant "View issue" action, using `RecordRow`'s `href`.
- **`issues.updated_at` and `issues.source_url`** exist in the schema (`supabase/migrations/007_issues_and_markets.sql`) but were never selected by `issues-db.ts`. Both are now fetched and surfaced: `updated_at` as a real "Updated [date]" meta line (database-backed rows only), `source_url` as a real citation link on the detail page when populated.
- **A new, page-wide truthful data-source classification.** `getIssuesPageData()`/`getIssueDetailData()` now return an explicit `source: 'database' | 'mock'` alongside the data, instead of silently returning mock content indistinguishable from real content. The list page shows a `MetadataLine` verification badge ("Verified"/"Demo data") in the header and a per-row "Demo" `StatusLabel` next to the status badge when on the mock path; the detail page shows a page-level demo banner. **This is the single most consequential fix in this batch** — before it, a first-time visitor had no way to know that every issue currently visible in this environment is illustrative, not a real parliamentary record (see §10).
- **"View related forecast" context** — shown as plain text ("Forecast available") in a row's meta line, never as a second link nested inside the row's anchor (see §9 — deliberate accessibility decision), and only when `source === 'database'` **and** a real `issue_markets` row exists for that issue. Never rendered from the mock `issueMarkets` fallback.

## 4. Issue-versus-Bill findings

Confirmed by reading `mock-data.ts` directly: the current mock dataset mixes genuine bill-like objects (Climate Safeguard Mechanism, Stage 3 Tax Cuts, the Misinformation Bill) with broad societal issues that aren't really bills at all (Housing Affordability Crisis, NDIS Reform) — all under one `status: 'active' | 'passed' | 'rejected'` column with no field distinguishing which kind of object a row actually is. In the current dataset no live contradiction exists (no broad-topic row is currently marked "Passed" or "Rejected"), but nothing in the schema (`issues` table `CHECK` constraint) prevents a future editor from marking "Housing Affordability Crisis" as "Rejected," which would be nonsensical for an ongoing societal problem, not a bill that failed a vote.

Per this batch's explicit instruction, **no schema migration or new taxonomy was invented.** The smallest truthful fix applied: the page's own framing no longer calls every row a "bill" — "Bills & Issues" → "Issues," "bills tracked" → "Issues tracked," "No bills match this filter" → "No issues match this filter." The status filter itself was kept, since it's accurate for the present dataset and previously confirmed a correct interaction pattern.

**Owner decision required:** whether Issue objects need a `kind`/`object_type` field (bill vs. broad issue vs. government decision) before the status vocabulary can be made structurally safe, or whether "Active/Passed/Rejected" is retired in favour of a genuinely neutral lifecycle model. This is the same decision already named, unresolved, in `ISSUES_PAGE_AUDIT.md` and `STICKEE_V1_EXECUTIVE_SUMMARY.md` Owner Decision 2 (the Issue/Bill/Decision schema-merge strategy) — this batch does not resolve it, only avoids making it worse.

## 5. Responsibility findings

No responsibility/portfolio line was added to the list row. The `issues` table has **no `level`, `portfolio`, or equivalent column** — `RESPONSIBILITY_MAP_SPEC.md`'s claim that "Federal Government (as a level)" is "real, implicit in `issues.level`" does not hold against the actual schema (`supabase/migrations/007_issues_and_markets.sql` has no such column). Adding a "Federal" label to every row would either be an invented per-row claim or a content-free constant repeated on every card — neither passes the Charter test ("does this reduce cognitive load," "is it verified"). Per this batch's explicit instruction not to build the full Responsibility Map, this is correctly deferred, not silently skipped: `docs/page-audits/RESPONSIBILITY_MAP_SPEC.md`'s own data-readiness table should be corrected to reflect that Federal-level scoping is not currently schema-backed for Issues, only implied by the product's overall federal-politics scope. **Owner decision required:** whether to add a real `level`/`portfolio` column (Batch 9, Responsibility Map) before any per-row responsibility line is attempted.

## 6. Civic-action findings

Audited, not modified, per this batch's explicit instruction:

- **`EmailMPButton`/`EmailMPModal`** — confirmed the one real, working contact mechanism: resolves an actual `mailto:` link for MPs present in the hardcoded `MP_EMAILS` map (~30 of 151 MPs have a real address; the rest show a disabled "Open in email" button with a working "Copy text" fallback). Removed from the list page per instructions; kept on the detail page, reframed under the heading "How can I influence this?" with an explicit statement of what Stickee can and cannot confirm ("can confirm your email client opens... not that your MP's office reads or responds").
- **`CampaignModal`** — confirmed still broken exactly as `CIVIC_ACTION_MODEL.md` describes: its "email" action only copies a template to the clipboard (zero `mailto:` occurrences anywhere in the file, confirmed by full-file grep); its participant counter (`totalCount`) initialises from `bill.campaignCount`, a hardcoded mock field, and is never reconciled against the real `/api/bills/pressure-summary` endpoint (zero occurrences of that string in the file). It does, however, genuinely persist a real `bill_pressures` row via `POST /api/bills/[billId]/pressure` when an action is taken — the write path is real, the displayed count is not.
- **`/api/bills/pressure-summary`** — confirmed real and independently working (queries `bill_pressures`, aggregates support/oppose/electorate breakdown), currently unused by `CampaignModal`.
- **Not wired into `/issues` or `/issue/[id]` today** — `CampaignModal` is only reachable from `/parliament`; this batch did not add it anywhere, per instructions not to build a new civic-action system.

**For the dedicated Civic Action batch (`PAGE_IMPROVEMENT_ROADMAP.md` Batch 10):** retire `CampaignModal`'s clipboard-copy "email" action in favour of `EmailMPButton`'s real mailto flow; wire its participant counter to the real `/api/bills/pressure-summary` endpoint; this is presentation/wiring-only work with no new backend required, exactly as already scoped.

## 7. Forecast findings

The market data backing `/issues` in the mock/fallback path (`mock-market-data.ts`'s `marketRaw`) is entirely hand-authored: fixed probabilities, participant counts, volumes, 14-day history arrays — none of it computed from anything. Confirmed removed from the list page entirely. On the detail page, the embedded `PredictionMarketGrid` (¢-denominated order book, sparklines, 24h-change chips) is now gated on `source === 'database' && market` — it never renders against the mock fallback. When gated out, the page shows a plain, honest line: "No verified forecast is linked to this issue yet." No fake probability, participant count, or movement can currently reach either page. Forecast settlement and wallet infrastructure were not touched.

## 8. Files changed

- `src/lib/issues-data.ts` — added `updatedAt`/`sourceUrl` to `IssueWithStats`; added the `IssuesDataSource` type.
- `src/lib/issues-db.ts` — select `source_url`/`updated_at`; both data-fetch functions now return an explicit `source: 'database' | 'mock'`.
- `src/components/ui/record-row.tsx` — extended with an optional `summary` line (body-copy styled, not metadata-styled); no new component created.
- `src/components/IssuesPageClient.tsx` — rewritten onto `PageShell`/`PageHeader`/`RecordRow`/`StatusLabel`/`UnderlineTabs`/`EmptyState`.
- `src/app/issues/page.tsx` — passes the new `source` field through.
- `src/app/issue/[id]/page.tsx` — demo banner, gated probability badge/vote tiles/market grid, "How can I influence this?" reframing, source citation line. Layout, `SimulateThisButton`, `RecentRehearsalsStrip`, `PredictionWidget`, and `MPVoteGrid` untouched.
- `src/lib/__tests__/issues-v1-simplification.test.ts` — new, 37 tests.
- `docs/page-audits/PAGE_IMPROVEMENT_ROADMAP.md`, `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` — status annotations updated (see §13).

No other file was modified. `IssueAccordion.tsx` and `CampaignModal.tsx` were read for audit purposes only, not changed.

## 9. Accessibility

- **Heading hierarchy:** `PageHeader` renders a single `<h1>` per page; `RecordRow` renders row content as paragraphs, not headings, avoiding a heading-per-row anti-pattern.
- **List semantics:** the row collection is wrapped in `role="list"` / `role="listitem"`.
- **No nested interactive controls:** each row is a single `<Link>` (via `RecordRow`'s `href`). The "View related forecast" mention is deliberately rendered as **plain text**, not a second link, specifically because nesting an `<a>` inside another `<a>` is invalid HTML and would have reintroduced the exact "nested-button regression" this batch's own test list asks to guard against. The actual forecast link lives on the detail page instead, where it isn't nested.
- **Keyboard/focus:** unchanged shared-component behaviour (`RecordRow`, `UnderlineTabs` are both plain, unstyled-for-focus-suppression interactive elements; no custom `tabIndex`/`outline: none` was introduced).
- **No control hidden without a mobile alternative:** the previous `hidden sm:flex` wrapper (which hid the MP-Yes/market/expand-chevron block on mobile while the row remained tap-expandable — `CROSS_PAGE_CONSISTENCY_AUDIT.md`'s documented mobile bug) no longer exists; there is nothing responsive-hidden in the new row at all, since the removed content was the thing that needed hiding.
- **Status not colour-only:** every `StatusLabel` renders its text label; colour reinforces, never replaces it.
- **Reduced motion:** no new transition/animation was introduced beyond the existing shared-component `transition-calm` (colour/opacity only, matching `CIVIC_DESIGN_SYSTEM.md` Part 3.5 — no `transform`/scale/spring easing).
- **Meaningful link text:** each row's accessible name is its full text content (title + summary + status), not a bare "click here"; the trailing "View issue →" is additive, not the sole cue.

These were verified by direct code inspection and by the accessibility-focused assertions in the new test file (list/listitem roles, absence of nested `<button>`/`<a>`, absence of `hidden sm:*` wrappers) — not by a certified WCAG audit, which this batch does not claim to be.

## 10. Shared primitives adopted

`PageShell`, `PageHeader`, `RecordRow` (extended), `StatusLabel`, `UnderlineTabs`, `EmptyState`, `MetadataLine` (via `PageHeader`'s `metadata` prop). No new Issues-specific component or CSS was created; `RecordRow` was extended once, for every future consumer, rather than duplicated.

## 11. Tests and results

```
npx tsc --noEmit                → pass, 0 errors
npx vitest run                  → pass, 10 files, 251 tests (37 new)
npm run build                   → pass, /issues and /issue/[id] both compiled (ƒ dynamic, as expected)
node scripts/secret-scan.mjs    → pass, no suspicious patterns in tracked files
```

All 37 new tests in `src/lib/__tests__/issues-v1-simplification.test.ts` pass, covering: banned list-page content absent (MP Yes%, vote bars, market data, Email MP, prediction controls, expand state, "bills" terminology, duplicate counts); required content present (real titles/summaries, one-sentence purpose, one headline metric, one dominant "View issue" action reaching the canonical route, shared primitives, no bespoke hex/shadow, honest demo labelling, truthful empty state); accessibility (no hidden-without-alternative controls, list semantics, no nested interactive controls); `RecordRow`'s extension; `issues-db.ts`'s truthful source classification and new column fetches; the detail page's gated fabricated-content removal; and the civic-action audit facts (`mailto:` present in `EmailMPModal`, absent in `CampaignModal`; the real pressure-summary endpoint unused by `CampaignModal`).

No pre-existing test was modified or weakened; the full suite (251 tests) passes with no regressions.

## 12. Visual verification method

**No headless-browser/screenshot tooling (Playwright, Puppeteer) is installed in this project or reachable without a network install**, so no pixel-level screenshots were taken — stated plainly per this batch's instructions, not claimed otherwise.

Verification performed instead: an existing local `next dev` server (already running before this session, on port 3001 — reused rather than duplicated; a second instance I started on port 3002 to check availability was stopped, leaving the pre-existing server untouched) was queried via `curl` for `/issues`, two `/issue/[id]` pages (`housing-affordability`, `tax-cuts`), and `/`, `/parliament`, `/predictions`, `/leaders` (all confirmed HTTP 200, no new server errors in the dev log — the one recurring `pressure-summary fetch error` predates this session by hours and is unrelated to `/issues`). The rendered HTML was grepped to confirm: banned strings (MP Yes, Email your MP, Predict outcome, bills tracked) are absent; required content (Issues tracked, View issue, real issue titles, status/demo labels, underline tabs with plain labels) is present; the detail pages render the demo banner, the "How can I influence this?" heading, and the "No verified forecast is linked" fallback, with no fabricated probability/participant badge. This confirms correct server-rendered output, not verified visual layout/spacing/contrast at desktop, tablet, and mobile widths, which would require the unavailable browser tooling.

**Local environment note:** `.env.local` has Supabase environment variable names configured, but the live `/issues` fetch resolved to the mock fallback path in this environment (confirmed by the real mock issue titles — "Housing Affordability Crisis," "Climate Safeguard Mechanism," "NDIS Reform" — appearing in the rendered output), meaning either no real, non-test-fixture `issues` rows exist in whatever Supabase project is configured, or the connection didn't resolve. No database was queried outside of what the app's own normal page-load path already does; no write, migration, or admin action was performed against it.

## 13. Roadmap status updates

- `docs/page-audits/PAGE_IMPROVEMENT_ROADMAP.md` — Batch 3 ("Issues simplification") status line updated from "⬜ Not started (owner decision pending)" to reflect that the list-page simplification and detail-page truthfulness fixes described in this report are complete; the schema-merge/Decision-retirement portion of that batch remains not started and still requires Owner Decision 2.
- `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` — Phase 3B's "Issues, Decisions, Parliament, Government-redirect (not started)" note updated to record that Issues' list page (and the minimum necessary detail-page fixes) now consume the Phase 2 shared primitives; Decisions, Parliament, and Government-redirect remain not started.
- `STICKEE_V1_EXECUTIVE_SUMMARY.md` — not modified. It already tracks this work at a program level (Owner Decisions 2 and 9), and this batch does not resolve Owner Decision 2 (the schema-merge strategy) or change the Council's existing findings — only Owner Decision 9's already-`✅ Implemented` truthfulness line remains accurate as written; no new annotation was needed there without resolving the schema question.

No historical audit finding was rewritten in place.

## 14. Owner decisions still required

1. **Issue lifecycle taxonomy** (§4) — whether to add a `kind`/`object_type` column distinguishing bill-like objects from broad issues before the Active/Passed/Rejected vocabulary can be considered structurally safe, independent of the Issue/Bill/Decision schema-merge decision.
2. **Issue/Bill/Decision schema-merge strategy** — unchanged, still open (`STICKEE_V1_EXECUTIVE_SUMMARY.md` Owner Decision 2); this batch does not require or pre-empt it.
3. **Responsibility/portfolio data** (§5) — whether to build a real `level`/`portfolio` column before any per-row responsibility line is added (Batch 9).
4. **Civic Action consolidation** (§6) — retire `CampaignModal`'s broken email/participant-count paths in favour of the real mechanisms, per the already-scoped Batch 10; not resolved by this batch.
5. **`who_supports`/`who_opposes` sourcing** — the real (database) path now shows a citation when `source_url` is populated, or an explicit "not yet sourced" label when it isn't; whether individual claims within that free-text field eventually need per-sentence citation (versus one issue-level source) is an editorial-capacity decision, not resolved here.
6. **Topic/keyword search** — named in prior audits as missing; not built in this batch (not requested by this batch's scope).

## 15. Confirmation

- **Only** `/issues`, `/issue/[id]`, `RecordRow` (a shared primitive, extended additively), and one new test file were changed. Government, Forecasts, People, Today, Political Pulse, and account pages were not touched.
- No database was modified, migrated, or seeded. No production environment was accessed, modified, or deployed to.
- Nothing was staged, committed, pushed, or deployed — all changes remain as working-tree edits for review.
- All unrelated pre-existing working-tree changes present at session start were left exactly as found.
