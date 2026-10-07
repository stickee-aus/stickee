# Government / Parliament V1 — Truthfulness and Simplification Report

Governed by [`AGENTS.md`](AGENTS.md) and [`docs/philosophy/STICKEE_CHARTER.md`](docs/philosophy/STICKEE_CHARTER.md) — the second Charter-governed implementation batch, following the same discipline as `ISSUES_V1_SIMPLIFICATION_REPORT.md`. Scope: `/parliament` (nav label "Government"), the components it renders, and the minimum data-layer fixes required to stop fabricating content on it. No other core page was touched. Nothing was staged, committed, pushed, or deployed. Production was not accessed.

`PAGE_IMPROVEMENT_ROADMAP.md`, named in this batch's brief, does not exist in this repository (confirmed via `ls *.md`) — treated as a missing/renamed reference; no fabricated update was made to it.

---

## 1. What Government/Parliament now exists to do

`/parliament` answers: **"What is Federal Parliament doing right now, and who represents you there?"** It no longer implies it is the whole of "government" — a permanent, always-visible block states plainly that executive government (PM, Cabinet, ministers, departments, agencies) is a separate part of government this page does not yet cover. It no longer duplicates Issues' bill catalogue, and it no longer presents inferred or fabricated data as fact anywhere on the page.

## 2. Structure before and after

**Before:** four hardcoded header stats → `PriorityBillFocus` (streak badge, countdown, public-vs-parliament gap bar, MP alignment aligned/misaligned) → a full independently-filterable bill feed (`BillSmartRow` × N, its own filter tabs) → `MPActionStrip` (alignment dial, disagreements list, no link to the MP's own profile) → `ChamberSummaryCard` (pill/sliding-thumb chamber toggle; `HouseChamber` with a fabricated "Swing Votes" mode and a "My Campaign" mode with fake local-only Agree/Disagree buttons) → collapsed civics explainer.

**After:**
1. `PageHeader` — "Government · Federal Parliament", one-sentence purpose, `MetadataLine` (source + verified/demo), one real metric (MPs tracked).
2. Always-visible Government-vs-Parliament explainer block.
3. "Current parliamentary activity" — one truthful priority-bill module (or an honest empty state), a short 2–3 row preview of other bills (no per-row filtering), "View all issues →" link.
4. "Your representative" — identity only, a working link to `/mp/[id]`, an electorate-confirmation flow that never overstates certainty.
5. "Parliament" — chamber visualisation, `UnderlineTabs` House/Senate switch (replacing the banned pill toggle).
6. "Related" — links to Issues (full catalogue) and People/Leaders (all representatives).
7. "How Parliament works" — unchanged civics content, collapsed by default.

## 3. Visible-claim classification (this session's audit)

| Element | Before | Classification | After |
|---|---|---|---|
| 4 header stats (incl. "74% Predict Acc.", "14,351 Campaigns") | `parliament/page.tsx` literals | Hardcoded, never computed | Removed. One real metric (MPs tracked) in its place. |
| "Public %" / `PublicVsParliamentBar` | `mock-parliament-data.ts` hand-authored **and** fabricated in the real DB path (`parliament-db.ts`: `d.passed ? 75 : 25 : 50`) | Fabricated — even the "real" path invented it; no polling/market source exists | Removed everywhere. `publicPrediction`/`publicSupport` now `null` in the real path, never a proxy. |
| `CampaignModal`'s participant counter | `bill.campaignCount` (mock) | Fabricated on the fallback path; real endpoint existed but was unused | Wired to `/api/bills/pressure-summary` (real, already-built). |
| `CampaignModal`'s "Contact MP" tile | Clipboard-copy, zero `mailto:` | Broken — implied a real contact mechanism, did nothing beyond a copy | Removed. `EmailMPButton`/`EmailMPModal`'s real mailto flow is the only contact mechanism now, everywhere on this page. |
| "{mpName} is watching their inbox" / "N MPs are undecided" | `CampaignModal` impact step | Unverifiable guarantee / fabricated swing claim | Removed. |
| `SWING_MPS_DATA` (reasons, pressure %, contact counts) | `mock-parliament-data.ts` | 100% hand-authored; DB bills always had `swingMPIds: []` | No longer rendered anywhere (swing view mode, swing panel, MP-panel swing block all removed). |
| Streak badge / "Start your streak" | `useStreak`, `StreakBadge` in `PriorityBillFocus` | Engagement-loop gamification | Removed. |
| Countdown / urgency badge | `daysUntilVote`, `BillUrgencyBadge` | Hand-authored per mock bill; never set by the real DB transform | Removed. |
| MP "alignment %" (dial, aligned/misaligned) | `MPActionStrip`, `PriorityBillFocus`, `lib/alignment.ts` | Built on party-line vote inference, presented as a personal score | Removed entirely (satisfies both the gamification ban and the inferred-vote-as-fact defect in one fix). |
| **`MPDrilldownTable`'s "Public align" column** (found this session, not in prior audits) | Live in `/parliament`'s "View individual MP breakdown" | Fabricated — computed from the same non-existent public-opinion source, in *both* the real and mock code paths | Removed. |
| "These are real votes on laws" | `HouseChamber`'s `MPInfoPanel` | False whenever the vote shown was a party-line inference — which is every case today (see §6) | Removed. Panel now says plainly when it's showing a party position, not a personal record. |
| Fake "pressure" Agree/Disagree buttons | `HouseChamber`'s `MPInfoPanel` | Local `useState` only, never persisted, implied a real action | Removed. |
| Duplicate bill catalogue | `BillSmartRow` list + independent filter tabs | Same concept as Issues, different components | Removed; replaced with a short preview and a link to `/issues`. |
| Electorate "your representative" via location detect | `/api/electorate-lookup` (state-bounding-box, arbitrary first-known electorate) | Coarse, not a real geographic match, previously auto-applied | Now a suggestion requiring explicit user confirmation before any MP is labelled "your representative" (see §5). |
| Chamber composition, party breakdown, real MP identities | `members`, TheyVoteForYou sync | Verified fact | Unchanged. |
| Real division totals, `parliamentSupportPct()` | `totalFor`/`totalAgainst`/`totalAbstain` | Verified fact (real when DB-backed) | Unchanged, now shown as plain text instead of paired with the removed fake public %. |
| `bill_pressures` write/read paths | Real API | Verified, real | Unchanged; now actually displayed correctly (see above). |
| "How Parliament works" civics content | `TwoHousesExplainer` | Sourced analysis, factually uncontested | Unchanged, still collapsed by default. |

## 4. Government vs. Parliament

A permanent block (not collapsible, not a tooltip) sits directly under the page header:

> **Government is broader than Parliament.** This page currently covers Federal Parliament — the House of Representatives, the Senate, bills, votes, and representation.
>
> Executive government — the Prime Minister, Cabinet, ministers, departments, and agencies — is a separate part of government that Stickee does not yet cover here. Nothing on this page should be read as a record of executive decisions.

No executive-government content was built or implied to exist (per instructions).

## 5. Representative-lookup findings

`/api/electorate-lookup` was confirmed, by direct code reading, to be a coarse state-bounding-box match that returns the **first electorate known in that state** — not a real geographic boundary lookup. Previously, `useElectorate.ts`'s `detectByLocation()` called `setElectorate(detected)` directly, immediately presenting that arbitrary match as "your representative."

**Fixed:** `useElectorate.ts` now exposes a `suggestedElectorate` (never auto-committed) plus `confirmSuggestedElectorate()`/`rejectSuggestedElectorate()`. `MPActionStrip` shows the suggestion with explicit "this is not a precise electorate boundary match" copy and requires the user to confirm it, or enter their electorate manually, before any MP is shown as their representative. Manual entry remains a direct, immediate match (an exact, user-asserted electorate name is unambiguous — the uncertainty was only ever in the geolocation step). `MPActionStrip` also now links to the canonical `/mp/[id]` profile, which was previously a confirmed dead end (zero links anywhere in the component).

## 6. Chamber vote-data findings

The plan for this batch assumed a real `voteMatrix` (from `parliament-db.ts`, keyed `tvfy-<id>`) could be threaded into `HouseChamber`'s seat-level display to replace the party-line inference. **This was attempted and abandoned after direct code reading showed it would silently never work**: `HouseChamber` sources member identities from `useLiveParliamentMembers()` (`/api/parliament/members`), which assigns ids like `house-live-3`/`senate-<party>-N` — a completely disjoint scheme from `voteMatrix`'s `tvfy-<id>` keys. Wiring the two together as planned would have looked fixed while never actually matching a single MP.

This is the same MP canonical-identifier reconciliation gap already named as future, larger, owner-gated work in `STICKEE_V1_EXECUTIVE_SUMMARY.md` Owner Decision 10 and `STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md` — this batch corroborates it with fresh evidence rather than re-solving it.

**The honest fix applied instead:** `getSeatFill()` and `MPInfoPanel` no longer claim "these are real votes on laws." The seat coloring and MP panel are now explicitly labelled as showing the MP's own recorded vote *where one exists*, falling back to their party's position otherwise (`getMPVoteForBill()`'s actual, real behaviour) — never presented as equivalent to an individually recorded division. `MPDrilldownTable`'s "Public align" column (a second, previously undocumented instance of the fabricated-public-opinion defect, live on this page) was also found and removed; its "Party align"/swing-MP indicator was kept, since that one is genuinely computed from real party-position data when DB-backed.

The fabricated "swing" and "sentiment" ("My Campaign" local-only Agree/Disagree) view modes were removed outright — both were confirmed 100% fabricated or non-persisted.

## 7. Civic-action findings

- **`EmailMPButton`/`EmailMPModal`** — confirmed real, working `mailto:` resolution. This is now the *only* MP-contact mechanism reachable from this page.
- **`CampaignModal`** — confirmed its "Contact MP" tile had zero `mailto:` occurrences (clipboard-copy only) and its participant counter read the mock `bill.campaignCount`/`campaignDailyGrowth` while the real `/api/bills/pressure-summary` endpoint sat unused nearby, exactly as `CIVIC_ACTION_MODEL.md` described. Both fixed: the clipboard tile is retired, and the counter (plus the "N Australians have registered a position" copy throughout `PriorityBillFocus`) now reads the real endpoint. A real per-electorate count (`pressureSummary.byElectorate`) was also wired in, replacing a `localCount={0}` hardcoded constant that had made that whole UI branch permanently unreachable.
- **`POST /api/bills/[billId]/pressure`** — confirmed real and unchanged; the write path was already correct, only the *display* of its result was wrong.
- The fabricated "{mpName} is watching their inbox" and "{N} MPs are undecided" claims were removed from `CampaignModal`'s confirmation step.

## 8. Responsibility Map findings

Not built, per instructions. `RESPONSIBILITY_MAP_SPEC.md`'s data-readiness table is unchanged by this batch: Minister, Department, and Committee remain unmodeled objects, and nothing on `/parliament` names them. The Government-vs-Parliament explainer (§4) is the minimum educational context required by this batch's "Responsibility explanation" section, not a Responsibility Map implementation.

## 9. Shared primitives adopted

`PageShell`, `PageHeader`, `SectionHeader`, `RecordRow`, `StatusLabel`, `MetadataLine`, `EmptyState`, `UnderlineTabs`, `LinkButton` — all pre-existing, none newly invented. `ChamberToggle`'s banned pill/sliding-thumb pattern was replaced by `UnderlineTabs` at its one call site. Per this batch's scope (truthfulness and structural simplification, not a full visual migration), the SVG chamber visualisation (`HouseChamber`, `SenateView`) and `TwoHousesExplainer`'s internal styling were left as they were — only the truthfulness-mandated behavioural changes touched them, mirroring Issues V1's precedent of leaving several sub-widgets' visual styling untouched.

## 10. Files changed

- `src/app/parliament/page.tsx` — rebuilt on `PageShell`/`PageHeader`; removed 4 hardcoded stats; added Government-vs-Parliament block.
- `src/components/ParliamentExperienceClient.tsx` — removed the duplicate bill feed and its filter tabs; added a short bill preview + Issues link; added a Related section; rewired `useElectorate`'s new confirmation flow; removed `useStreak`.
- `src/components/PriorityBillFocus.tsx` — rewritten: no streak/countdown/urgency/public-%/alignment/swing-panel; real pressure count; source-aware `MetadataLine`.
- `src/components/MPActionStrip.tsx` — rewritten: no alignment dial; added `/mp/[id]` link; added the electorate-confirmation flow.
- `src/components/CampaignModal.tsx` — removed the clipboard Contact-MP tile and fabricated claims; now takes a real `PressureSummary` instead of a mock count.
- `src/components/HouseChamber.tsx` — removed swing/sentiment view modes and the fake pressure buttons; fixed the false "real votes on laws" claim; simplified `getSeatFill`.
- `src/components/MPDrilldownTable.tsx` — removed the fabricated "Public align" column (found this session).
- `src/components/ChamberSummaryCard.tsx` — `ChamberToggle` → `UnderlineTabs`.
- `src/lib/parliament-db.ts` — removed the fabricated `publicPrediction`/`publicSupport` proxy from the real-data transform (now `null`).
- `src/lib/mock-parliament-data.ts` — widened `publicPrediction`/`publicSupport` to `number | null`; `computeGap()` now null-safe; `getPublicAlignment()` marked deprecated (orphaned).
- `src/hooks/useElectorate.ts` — added the suggestion/confirm/reject flow; detection no longer auto-commits.
- `src/components/BillCampaignCard.tsx`, `src/components/BillSmartRow.tsx`, `src/components/GapExplainerPanel.tsx`, `src/components/PartyVotingGrid.tsx`, `src/components/BillTracker.tsx` — minimal type-safety patches only (`?? 0`/`?? 50` null-guards), so these already-orphaned or newly-orphaned files still compile; no behavioural changes, no scope expansion into rebuilding them.
- `src/lib/__tests__/government-v1-truthfulness.test.ts` — new, 33 tests.
- `src/lib/__tests__/issues-v1-simplification.test.ts` — 2 pre-existing assertions updated (they pinned `CampaignModal`'s now-fixed clipboard-contact and mock-counter behaviour as a documented, then-unfixed gap; updated to assert the fix instead of the bug).
- `DESIGN_SYSTEM_MIGRATION_ROADMAP.md`, `STICKEE_V1_EXECUTIVE_SUMMARY.md` — status annotations updated (see §14).

No other file was modified. `SenateView.tsx`, `ImpactSimulator.tsx`, `ParliamentMap.tsx`, `TwoHousesExplainer.tsx` were read for audit purposes only.

## 11. Deferred cleanup — orphaned components

The following have **zero live importers** after this batch (confirmed by repo-wide grep) and were deliberately **not deleted**, per instructions and this codebase's established convention (`STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md` §3) of leaving dead components in place rather than removing them mid-batch. Their continued presence in the repo is not a signal that they are an active system — do not treat them as such, and do not add new imports of them without re-auditing the content they render:

- `src/components/BillSmartRow.tsx`
- `src/components/GapExplainerPanel.tsx` (only reachable via the now-orphaned `BillSmartRow`)
- `src/components/BillStageTimeline.tsx` (only reachable via the now-orphaned `BillSmartRow`)
- `src/components/SwingVotePanel.tsx` (only reachable via the now-orphaned `BillSmartRow`)
- `src/components/PublicVsParliamentBar.tsx` (only reachable via the already-dead `BillCampaignCard`)
- `src/components/BillUrgencyBadge.tsx` (only reachable via the already-dead `BillCampaignCard`)
- `src/components/ChamberToggle.tsx`
- `src/lib/alignment.ts` (`computeAlignmentScore`)
- `src/components/BillCampaignCard.tsx` — already orphaned before this batch (reachable only via `SwingVotePanel`, itself unreachable from any route); unaffected by this batch's changes beyond a type-safety patch.
- `src/components/PartyVotingGrid.tsx`, `src/components/BillTracker.tsx` — already orphaned before this batch (zero importers found predating this session); unaffected beyond a type-safety patch.

## 12. Tests and results

```
npx tsc --noEmit               → clean, 0 errors
npx vitest run                 → 284/284 passed (11 files), including the new
                                  government-v1-truthfulness.test.ts (33/33)
npm run build                  → succeeded (Next.js 16.2.1 / Turbopack), all 46
                                  routes compiled, including /parliament
node scripts/secret-scan.mjs   → "no suspicious patterns found in tracked files"
```

Two pre-existing tests in `issues-v1-simplification.test.ts` asserted `CampaignModal`'s then-known, then-unfixed clipboard-contact and mock-counter behaviour as a documented gap ("confirmed unchanged, documented as a known gap"). Both were updated in place to assert the fix now shipped in this batch, consistent with how `STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md` updated `phase-3a-home.test.ts`/`navigation.test.ts` when it fixed the behaviour they'd pinned. No other pre-existing test needed a change; the full suite passes with no regressions.

The 33 new tests cover: absence of the four hardcoded header stats, streak mechanic, countdown/urgency, public-support percentage, MP alignment score, and swing-vote panel; the fabricated `parliament-db.ts` public-support proxy and `MPDrilldownTable`'s "Public align" column are gone; `HouseChamber` no longer claims individually recorded votes or renders the fake pressure buttons; the Government-vs-Parliament explainer text is present; the electorate-suggestion confirmation flow exists and never auto-commits; `/mp/[id]` is linked; `CampaignModal`'s broken contact tile is gone and its counter reads real data; the duplicate bill catalogue is gone and Issues/People are linked; shared primitives are used; `ChamberToggle` is replaced by `UnderlineTabs`.

## 13. Visual verification method

**No headless-browser/screenshot tooling is installed in this environment** (consistent with `ISSUES_V1_SIMPLIFICATION_REPORT.md`'s finding) — no pixel-level screenshots were taken, stated plainly rather than claimed otherwise.

Verification performed instead: an already-running local `next dev` server for this exact project (confirmed via `lsof`'s `cwd`, PID 91137, port 3001 — not started by this session) was queried via `curl` for `/`, `/parliament`, `/issues`, `/leaders`, and one real `/mp/[id]` (`/mp/mp-ca-1`) — all returned HTTP 200. The rendered `/parliament` HTML was grepped to confirm: all banned strings ("14,351", "74%", "Predict Acc", "Start your streak", "These are real votes on laws") are absent; required content (the Government-vs-Parliament paragraph, "MPs tracked", "Current parliamentary activity", "Your representative", "View all issues") is present; the desktop and mobile nav both correctly render `aria-current="page"` on the Government item. This environment resolved to the mock/demo data path (confirmed by real mock bill titles — "Help to Buy (Housing)," "NDIS Reform Bill" — appearing in the output, same finding as the Issues V1 report), and the page correctly showed "Illustrative demo data" rather than a false "TheyVoteForYou" verification claim. This confirms correct server-rendered output and content-level truthfulness, not verified visual layout/spacing/contrast, which would require the unavailable browser tooling.

## 14. Roadmap status updates

- `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` — Phase 3B's status line and detail section updated to record Parliament as implemented alongside Issues, with the explicit scoping note that the chamber SVG/civics-explainer internals were left unstyled by design.
- `STICKEE_V1_EXECUTIVE_SUMMARY.md` — Owner Decision 9 given a dated addendum recording this batch's fixes (the header stats, the DB-path public-support fabrication, `MPDrilldownTable`'s "Public align" column, the vote-inference disclosure, the bill-catalogue de-duplication). Owner Decision 10 (MP canonical-identifier migration) given a dated addendum corroborating the gap with the fresh `house-live-*` vs `tvfy-*` id-mismatch evidence found this session — the underlying finding and its "not yet resolved" status were not changed, only reinforced with new evidence.
- No historical audit finding was rewritten in place.

## 15. Owner decisions still required

1. **MP canonical-identifier reconciliation** (`STICKEE_V1_EXECUTIVE_SUMMARY.md` Owner Decision 10) — unresolved, now corroborated with concrete id-scheme evidence from this session. Required before `HouseChamber`'s seat-level display or `MPInfoPanel` can show a genuinely individual, verified vote instead of a party-position fallback.
2. **Issue/Bill/Decision schema-merge strategy** (Owner Decision 2) — unchanged, unresolved; this batch does not require or pre-empt it.
3. **Real executive-decision/minister-attribution content** — whether and how to build this at all for V1 remains a genuine, unscoped content-modeling gap (`GOVERNMENT_PAGE_AUDIT.md`'s existing framing, unchanged here).
4. **Responsibility/portfolio data model** (Minister, Department, Committee) — whether to build these as real, modeled objects before any Responsibility Map work begins.

## 16. Remaining executive-government work

None was begun, per instructions: no ministerial/department attribution, no Cabinet/department pages, no executive-decision ingestion, no `evidence`/`citations` table, no Responsibility Map, no Civic Action system rebuild beyond the three scoped fixes in §7, no Issue/Bill/Decision schema migration.

## 17. Confirmation

- Production was not accessed, modified, or deployed to.
- Nothing was staged, committed, or pushed.
- No migration was created or applied; no database was written to.
- No secret values were printed; `scripts/secret-scan.mjs` found nothing suspicious.
- Only `/parliament` and the components it renders (plus the minimal, non-behavioural type-safety patches listed in §10) were changed. Today, Issues, Forecasts, People, Political Pulse, and account pages were not touched.
- No unrelated pre-existing working-tree changes present at session start (the design-system migration files, roadmap documents, `agents/`/`docs/` directories, and the other already-modified pages listed in `git status`) were modified or overwritten.
