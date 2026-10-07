# Issue Detail V1 — The Canonical Civic Object Page

Governed by [`AGENTS.md`](AGENTS.md) and [`docs/philosophy/STICKEE_CHARTER.md`](docs/philosophy/STICKEE_CHARTER.md) — the fifth Charter-governed simplification batch, following `ISSUES_V1_SIMPLIFICATION_REPORT.md`, `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`, `PEOPLE_V1_REFINEMENT_REPORT.md`, and `FORECASTS_V1_SIMPLIFICATION_REPORT.md`. Scope: `/issue/[id]` and its loading skeleton only. No other core page was touched. Nothing was staged, committed, pushed, or deployed. Production was not accessed.

Read before starting: `AGENTS.md`, `docs/philosophy/HOW_STICKEE_THINKS.md`, `docs/philosophy/STICKEE_CHARTER.md`, `STICKEE_V1_PRODUCT_BLUEPRINT.md`, `docs/page-audits/DETAIL_PAGE_AUDIT.md`, `docs/page-audits/RESPONSIBILITY_MAP_SPEC.md`, `docs/page-audits/CIVIC_ACTION_MODEL.md`, `docs/page-audits/CROSS_PAGE_CONSISTENCY_AUDIT.md`, `ISSUES_V1_SIMPLIFICATION_REPORT.md`, `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`, `PEOPLE_V1_REFINEMENT_REPORT.md`, `FORECASTS_V1_SIMPLIFICATION_REPORT.md`, `CIVIC_DESIGN_SYSTEM.md`, `DESIGN_SYSTEM_MIGRATION_ROADMAP.md`. The approach was reviewed and approved by the owner across three rounds of revision before any code was written (see §12).

---

## 1. What Issue Detail now exists to do

`/issue/[id]` answers **"What is happening, why does it matter, who is responsible, what has happened so far, what may happen next, and what can I do?"** as a single, linear investigation — not a dashboard. It connects Issue → Evidence → Government activity → Responsibility → Forecasts → Civic action, in that order, with exactly one column, no competing prediction mechanisms, and no claim shown with more confidence than its actual, traceable source supports.

## 2. Structure before and after

**Before:** two-column dashboard (`lg:grid-cols-3`) stacking a Simulator strip directly under the header, a green/red MP vote-count tile block, `PredictionWidget` (a "will this pass" Yes/No poll claiming "you earn points when you get it right" — no such reward exists), `PredictionMarketGrid` (a third, separate order-book market widget with inert "Buy Yes"/"Buy No" buttons), and `MPVoteGrid` (a 151-row table with a client-only "guess the vote" mini-game computing a fake "implied probability" from nothing but the visitor's own unsaved guesses) — ten stacked content blocks, three of them competing prediction mechanisms, with no Responsibility Map, no structured evidence block, and a mislabeled "Back to Dashboard" link pointing at `/`.

**After**, single column, in order:
1. **Overview** — title, summary, `StatusLabel`, verification metadata, demo banner when applicable, "← Back to Issues" (fixed).
2. **What is happening?** — `issue.whatIsHappening`, verbatim.
3. **Why this matters** — `issue.content`, verbatim.
4. **Latest recorded update** — real updated date + source, honest limits stated.
5. **Evidence** — `EvidenceBlock` + re-styled who-supports/who-opposes.
6. **What has government done?** — real status only; the vote-count figures are **not rendered** (see §5).
7. **Who is responsible?** — an honest "still being verified" line + a clearly-separated generic civics block.
8. **Forecasts** — a small, real, canonical-pipeline summary, or an honest unavailable line.
9. **How can I influence this?** — real, working actions only.
10. **Related** — plain links (Government, People, Forecasts, other issues), Simulator demoted here.

## 3. Visible-claim classification (this session's audit)

| Element | Classification | Basis |
|---|---|---|
| Title, summary, `whatIsHappening`, `content`, status | Verified DB-backed fact when `source==='database'`; demo/illustrative on the mock fallback | `issues` table, unchanged |
| **`mp_yes_count`/`mp_no_count`/`mp_abstain_count`** | **Unproven provenance — removed from the public page** (see §5, dedicated section) | No confirmed sync from `divisions`/`member_votes`/TheyVoteForYou; `source_url` cannot be confirmed to specifically support these totals |
| **`PredictionWidget`'s "you earn points when you get it right"** | **Fabricated claim** — found this session | Writes real rows to a `predictions` table, but no reward mechanism anywhere in the codebase (`usePredictionWallet`/`useWallet`) references that table |
| **`MPVoteGrid`'s "Your implied probability"** | **Fabricated** | `useState` only, computed from the current visitor's own unsaved guesses, never persisted |
| `PredictionMarketGrid` | Duplicate system (separate `IssueMarket` type/mapper from the canonical `PredictionMarket`/`issue_markets` pipeline `/predictions` uses); "Buy Yes"/"Buy No" buttons with no `onClick` at all | `docs/audits/FEATURED_MARKET_DUPLICATION_AUDIT.md`, re-confirmed unchanged this session |
| Real forecast (bill markets) | Forecast, verified infrastructure, now including `resolution_source` once resolved | `issue_markets`, via the same `mapIssueMarketRecordToPredictionMarket`/`getMarketEligibility` pipeline `/predictions` uses |
| `EmailMPButton`/`EmailMPModal` | Real, working `mailto:` resolution for ~30/151 MPs; honest disabled state for the rest | Unchanged, already correctly reframed by `ISSUES_V1_SIMPLIFICATION_REPORT.md` |
| `who_supports`/`who_opposes` | Sourced analysis when `source_url` present; "not yet documented"/"not yet sourced" otherwise | Already correct (ISSUES_V1), re-styled only |
| Responsibility ("who's responsible") | Previously absent entirely; now an explicit "not yet verified" state | No `level`/`portfolio`/`minister`/`department`/`committee` relationship exists on `issues` |
| Timeline / event history | No real event-history table exists (`issue_timeline_events` is a documented future model, not built) | Confirmed via `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md` §6, re-verified this session |
| `SimulateThisButton` + `RecentRehearsalsStrip` | Real, working, but previously placed directly under the H1 — exactly what `DETAIL_PAGE_AUDIT.md` names as something that "should never appear" | Presentation/placement defect, not truthfulness |

## 4. What was removed

- `PredictionWidget` and its page-level `getPredictionCounts()` helper (the localStorage/`predictions`-table Yes/No poll with the fabricated points claim).
- `MPVoteGrid` (the 151-row "guess the vote" mini-game and its fabricated "implied probability").
- `PredictionMarketGrid` (the third, duplicate market widget) — replaced by a small, canonical-pipeline forecast summary.
- `RecentRehearsalsStrip` (the above-the-fold Simulator strip) — `SimulateThisButton` alone survives, moved to Related.
- The green/red MP vote-count stat tiles, and the `mp_yes_count`/`mp_no_count`/`mp_abstain_count` figures themselves — not merely re-styled, **not rendered at all** (see §5).
- The `lg:grid-cols-3` two-column dashboard layout — single column throughout, including the loading skeleton.
- `Badge` (shadcn default, pill radius, banned per `CIVIC_DESIGN_SYSTEM.md` Part 5) → `StatusLabel`.
- The mislabeled "Back to Dashboard" → `/` link → "← Back to Issues" → `/issues`.

None of the removed components were deleted from the repo — `PredictionWidget.tsx`, `MPVoteGrid.tsx`, and `PredictionMarketGrid.tsx` remain in place, unused, matching this codebase's established convention for orphaned components.

## 5. MP vote-total provenance decision (dedicated section, per plan-review instruction)

`issues.mp_yes_count`/`mp_no_count`/`mp_abstain_count` are real columns on the real `issues` table, and were being shown (gated behind `source === 'database'`) as "Voted Yes / Voted No / Abstained" stat tiles. Three things were checked to establish provenance:

1. **A sync path from `divisions`/`member_votes` (the real, TheyVoteForYou-backed tables `/api/sync/divisions` populates).** None exists — a full-repo search found zero writes to `issues.mp_yes_count`/`mp_no_count`/`mp_abstain_count` from any sync job. The only live reference is `src/lib/agents/bill-stage-tracker.ts`, which *reads* these columns to compose a feed-post summary; it never writes them.
2. **A `source_url`-based citation specifically supporting the totals.** `source_url` is a general per-issue citation field, not a claim that it specifically substantiates these three numbers — it cannot be treated as proof of the vote count's accuracy without reading and verifying the linked page per-issue, which this session did not do and cannot generalise.
3. **An admin/editorial entry path (the same legitimate provenance already accepted for `title`/`summary`/`resolution_source` elsewhere).** No admin UI, seed script, or other write path referencing these columns was found anywhere in the codebase.

**Decision (per explicit owner instruction at plan review): omit the counts from the public "What has government done?" section entirely**, rather than downgrade them to a softer label ("Parliamentary vote summary" / "Vote figures recorded in Stickee") — being database-backed does not, by itself, establish independent verification, and no safer label was available that this session could actually stand behind. This is a stricter standard than `ISSUES_V1_SIMPLIFICATION_REPORT.md` applied to the same field (that batch treated the DB-backed path as "real DB aggregate" without demanding proof of an automated sync) — this batch's fresh check found no such proof exists, and the owner's explicit instruction was to act on that finding rather than defer to the earlier, less-scrutinised classification. **Data-quality gap, documented, not resolved:** a genuine per-issue division tally, sourced from `divisions`/`member_votes` and correctly ID-mapped, would be real and valuable — it does not exist today in a provable form on the `issues` row.

## 6. Responsibility findings

No Responsibility Map existed anywhere on this page before this batch. `RESPONSIBILITY_MAP_SPEC.md`#issue-bill's own template (House/Senate/Minister/Committee/Department role rows) was **not** built as an issue-attributed table, per an explicit correction at plan review: presenting those generic institutional roles under a "Who is responsible?" heading for a specific issue risked implying they were responsible *for this issue* when the `issues` schema carries no `level`/`portfolio`/`minister`/`department`/`committee` relationship at all (`ISSUES_V1_SIMPLIFICATION_REPORT.md` §5 already found this gap; re-confirmed this session). The section now shows exactly one honest line ("We haven't yet verified who has primary responsibility for this issue. As that work is completed, Stickee will identify the relevant minister, department, committee or institution together with the evidence supporting that relationship."), followed by a **visually and textually separate** "How responsibility usually works" block, explicitly labelled "General civics — not specific to this issue," stating only generic, unattributed facts (Parliament makes/reviews laws; Ministers lead portfolios; Departments administer policy; Committees investigate).

## 7. Government-action findings

"What has government done?" now shows only the one provable fact — the issue's real `status` (Active/Passed/Rejected) — plus an honest statement that a detailed, sourced record of the individual actions behind that status (a bill introduced, a committee inquiry, a scheduled vote) isn't available. The `mp_yes_count` figures are not shown here either (§5). No mock or unrelated decision data was pulled in to fill the gap.

## 8. Timeline findings

No "Timeline" section was built. A single `updated_at` timestamp is metadata, not a chronology — presenting it as a timeline (even a one-event one) would have manufactured a false sense of event-by-event history. Replaced with **"Latest recorded update"**: the real updated date, the real source when present, and an explicit statement that what changed in that update isn't recorded and a full history isn't available, naming the future model (date, event type, description, source, actor, related object, correction/revision history) without building or simulating it.

## 9. Evidence findings

`EvidenceBlock` (pre-existing, unmodified component) now renders real `source`/`freshness`/verification data. Who-supports/who-opposes content is unchanged in substance from `ISSUES_V1_SIMPLIFICATION_REPORT.md`'s already-correct treatment (sourced analysis with citation when `source_url` exists, honest "not yet sourced" otherwise) — only its visual treatment changed, from filled green/red background panels to plain bordered ones (Design System Part 2 rule 4: "no card should be legible-by-colour-alone").

## 10. Forecast findings

The forecast block now sources exclusively from the canonical `PredictionMarket`/`market-eligibility.ts` pipeline `/predictions` already uses — `getIssueDetailData()` (`issues-db.ts`) was changed to map the real `issue_markets` row through `mapIssueMarketRecordToPredictionMarket` (previously used the older, separate `mapIssueMarketRecord`/`IssueMarket` type that only `PredictionMarketGrid` consumed) and to select `resolution_source`, which it did not before. **No mock fallback**: the mock/demo path now always returns `market: null` (previously populated from `mockIssueMarkets`), so a demo issue can never show a forecast summary. The rendered summary shows question, probability, status, resolves-by, resolution source (once resolved), and a "View forecast →" link to `/predictions` — no inline stake buttons, no fake participants/volume/24h-move (consistent with `FORECASTS_V1_SIMPLIFICATION_REPORT.md`'s finding that those figures have no live update mechanism regardless of page).

## 11. Civic-action findings

`EmailMPButton`/`EmailMPModal` (confirmed real and unchanged) remain the only contact mechanism, re-confirmed with the existing honest copy ("Stickee can confirm your email client opens... not that your MP's office reads or responds"). Added: a link to `/parliament` ("View parliamentary activity") and, only when a real, currently-stakeable market exists, a link into Forecasts. **Not added:** a "Follow this issue" control — `CIVIC_ACTION_MODEL.md` confirms no real watchlist/topic-follow system exists (`user_follows` only follows other users, not topics), so none was built, per "only present actions that genuinely function."

## 12. Plan-review revisions (for the record)

The plan was revised twice after initial approval, both times before any code was written:
1. Do not call `mp_yes_count` etc. a "Recorded division" without proven provenance → omit entirely (§5).
2. Do not let the Responsibility section imply issue-specific responsibility from generic civics knowledge → honest "still being verified" line + clearly separated generic block (§6).
3. Do not call one `updated_at` value a "Timeline" → "Latest recorded update" (§8).
4. Final section reorder (understanding → evidence → accountability → prediction → action) and refined Responsibility empty-state copy.

## 13. Missing schema relationships (named, not built)

- `issues.level`/`portfolio`/`minister_id`/`department_id`/`committee_id` — none exist.
- `issue_timeline_events` — does not exist; `bill-stage-tracker` infers transitions from a hash, doesn't write durable history.
- A verified, queryable path from `issues.mp_yes_count` to a real `divisions`/`member_votes` record — does not exist.
- `saved_topics`/issue watchlist — does not exist (`user_follows` only follows users).
- `evidence`/`citations` table — does not exist (named in `STICKEE_V1_PRODUCT_BLUEPRINT.md` §8 as the most consequential missing schema piece).

## 14. Files changed

- `src/lib/issues-db.ts` — `getIssueDetailData()`: added `resolution_source` to its `issue_markets` select; changed `market` from `IssueMarket | null` (via `mapIssueMarketRecord`) to `PredictionMarket | null` (via `mapIssueMarketRecordToPredictionMarket`); mock/demo path now always returns `market: null` (no mock forecast fallback). `getIssuesPageData()` — **untouched**, still serves `/issues` with its own independent query and the older `IssueMarket` type.
- `src/app/issue/[id]/page.tsx` — full rewrite: single-column, 10 sections in the approved order; removed `PredictionWidget`/`getPredictionCounts`/`MPVoteGrid`/`PredictionMarketGrid`/`RecentRehearsalsStrip`/`Badge`; added `PageShell`/`PageHeader`/`SectionHeader`/`RecordRow`/`StatusLabel`/`EvidenceBlock`/`LinkButton`; fixed the "Back to Dashboard" → `/` link to "Back to Issues" → `/issues`; fetches `getIssuesPageData()` for the Related section's other-issues links.
- `src/app/issue/[id]/loading.tsx` — updated to match the new single-column layout (found and fixed this session: the old skeleton still rendered the retired two-column grid, which would have caused a visible layout shift on every load).
- `src/lib/__tests__/issue-detail-v1.test.ts` — new, 26 tests.
- `src/lib/__tests__/issues-v1-simplification.test.ts` — two pre-existing assertions updated in place: one previously pinned the MP vote-count tiles being *gated* on `source === 'database'`, now pins them being *absent entirely* (this batch's stricter finding, §5); one previously pinned `PredictionMarketGrid`'s embed condition, now pins the canonical summary's honest-unavailable text and `PredictionMarketGrid`'s absence.

No other file was modified. `EmailMPButton.tsx`/`EmailMPModal.tsx`, `market-eligibility.ts`, `mock-data.ts`, `PredictionWidget.tsx`, `MPVoteGrid.tsx`, `PredictionMarketGrid.tsx` were read for audit purposes only, not changed.

## 15. Tests and results

```
npx tsc --noEmit               → clean, 0 errors
npx vitest run                 → 405/405 passed (16 files), including the new
                                  issue-detail-v1.test.ts (26/26)
npm run build                  → succeeded (Next.js 16.2.1 / Turbopack), all 46
                                  routes compiled, including /issue/[id]
node scripts/secret-scan.mjs   → "no suspicious patterns found in tracked files"
```

The 26 new tests cover: `PredictionWidget`/`MPVoteGrid`/`PredictionMarketGrid` absent; no fabricated "earn points"/"implied probability" strings; no `mp_yes_count`-derived public figures ("Voted Yes"/"Voted No"/"Recorded division"); the canonical forecast mapper and `resolution_source` wiring; the mock path never populates a market; no `StakeModal`/`usePredictionWallet` on this page; the exact approved Responsibility unavailable copy, with the generic-civics block explicitly labelled as general; truthful unavailable states for Government-action and the renamed Latest-recorded-update section; `EvidenceBlock` rendering with real data; honest civic-action framing (no "notified"/"will respond" claims, no fake "Follow" control); single-column layout (no `lg:grid-cols-3`); Simulator demoted below the main content; exact approved section order; and real, canonical Related links.

## 16. Visual/HTML verification

**No headless-browser screenshot tooling is available in this environment** (consistent with every prior batch) — no pixel-level screenshots were taken, stated plainly.

Verified instead against the already-running local `next dev` server (PID 91137, port 3001 — the same server every prior batch in this session reused, not started by this session): `housing-affordability`, `ndis-reform`, `climate-safeguard` (status `passed`), `tax-cuts` (status `passed`), and `misinformation-bill` — all HTTP 200. Each page's rendered HTML was confirmed to contain every required section heading in order, the exact Responsibility unavailable copy, the demo banner (this environment resolves to the mock fallback, consistent with every prior batch's documented finding), and a working "Email my MP" action; and to be free of every banned string ("implied probability", "earn points", "Voted Yes"/"Voted No", ">Take Action<"). One residual match for `grid-cols-3` was investigated and traced to an unrelated Next.js-bundled prefetch/RSC payload for other linked routes (not this page's own markup or skeleton — confirmed by direct source inspection and the passing `issue-detail-v1.test.ts` layout assertions), not a real two-column regression. `/issues`, `/predictions`, `/parliament`, and `/leaders` were spot-checked and remain unaffected (all 200). A real click-through at mobile viewport width, and switching between resolved/active issues in an actual browser session, was **not** performed — no interactive browser session was available; the single-column, no-`hidden sm:*` structure was instead verified at the source level.

## 17. Owner decisions still required

Restated, not resolved:

1. **Issue/Bill/Decision object model** — unchanged, still open (`STICKEE_V1_EXECUTIVE_SUMMARY.md` Owner Decision 2).
2. **Issue lifecycle taxonomy** — whether Active/Passed/Rejected needs a `kind`/`object_type` distinction (bill vs. broad issue), per `ISSUES_V1_SIMPLIFICATION_REPORT.md` §4/§14.
3. **Responsibility Map schema** — whether/when `level`/`portfolio`/`minister_id`/`department_id`/`committee_id` become real, modeled relationships.
4. **Minister/portfolio/department data pipeline** — no ingestion or admin-entry path exists today.
5. **Government-action relationship model** — a real, per-event action record (bill introduced, committee inquiry, vote scheduled) does not exist; this batch's finding that even `mp_yes_count`'s provenance can't be proven sharpens the urgency of this gap.
6. **Timeline/event model** — `issue_timeline_events` (date, event type, description, source, actor, related object, correction/revision history) is specified conceptually, not built.
7. **`who_supports`/`who_opposes` editorial methodology** — whether individual claims within that free-text field eventually need per-sentence citation versus one issue-level source.
8. **Full Civic Action system** — beyond the real `EmailMPButton`/`bill_pressures` mechanisms, the broader model in `CIVIC_ACTION_MODEL.md` (contact-the-minister, committee submissions, consultations) remains unbuilt, correctly.
9. **Follow/notification model** — `saved_topics`/issue watchlist does not exist; no "Follow this issue" control was added.
10. **Eventual forecast-detail route and issue linkage** — `/predictions/[id]` still does not exist (per `FORECASTS_V1_SIMPLIFICATION_REPORT.md`'s own deferral); this page's forecast summary links to the list, not a per-forecast page.

## 18. Confirmation

- Production was not accessed, modified, or deployed to.
- Nothing was staged, committed, or pushed.
- No migration was created or applied; no database was written to. `resolution_source` already existed as a real column — this batch only starts reading it in one more place.
- No secret values were printed; `scripts/secret-scan.mjs` found nothing suspicious.
- Only `/issue/[id]`, its loading skeleton, `issues-db.ts`'s `getIssueDetailData()`, and the two named test files were changed. Today, Issues list, Government, People, Forecasts, Political Pulse, and every account/admin page were not touched, and `getIssuesPageData()` (which `/issues` depends on) was read but not modified.
- No wallet, staking, settlement, or Supabase RPC behaviour was changed — no staking UI was added to this page at all.
- No large, pre-existing uncommitted working-tree changes present at session start were modified, reverted, or overwritten.
