# Stickee V1 — Batch 8 Truthfulness Report

Implements the two independent P0 truthfulness fixes named in `STICKEE_V1_EXECUTIVE_SUMMARY.md` Owner Decision 9 and `IMPLEMENTATION_BATCHES.md`'s Batch 8, per the owner's scoped instruction: fix the Government navigation destination and remove fabricated politician scoring — nothing else from Batch 8's fuller list (feed badges, ProposeMarketModal, AI bull/bear fallback, CampaignModal mailto, etc.), and none of the full Issues/Government/Forecasts/People/Political Pulse redesign. Governed by `AGENTS.md`. No route was renamed, no database or migration work occurred, nothing was staged, committed, or deployed.

---

## 1. Where Government now leads

**Before:** `src/lib/navigation.ts`'s `PRIMARY_NAV` pointed the "Government" item at `/decisions` — a page rendering `mock-government-data.ts`, 100% fictional decision records with fabricated engagement fields (`likes`, `dislikes`, `isTrending`, `isControversial`), a decorative Yes/No poll that discarded input, and no `source` field anywhere in the `Decision` type.

**After:** "Government" points at `/parliament`, the real, Supabase-backed parliamentary record (TheyVoteForYou-synced chamber composition, bills, votes).

Changed:
- `src/lib/navigation.ts` — `PRIMARY_NAV`'s `government` entry: `href: '/decisions'` → `href: '/parliament'`; `activePrefixes` now includes `/decisions` (so a visitor who lands on the transitional page still sees Government highlighted) instead of `/parliament` (now redundant with `href`).
- `src/app/government/page.tsx` — the bare `/government` route's redirect target: `redirect('/decisions')` → `redirect('/parliament')`.
- `src/app/page.tsx` (homepage) — both hardcoded Government links (`PRIMARY_DESTINATIONS` card, "Government activity" section action) now point at `/parliament`; the action label changed from "All decisions" to "See Parliament" to match the real destination.

Desktop nav (`Navbar.tsx`), mobile nav (`BottomNav.tsx`), and the command palette (`CommandPalette.tsx`) all read from `PRIMARY_NAV` (established in the already-implemented Batch 2), so updating the one shared config fixed all three automatically — verified via HTTP smoke test (see §7): on `/parliament`, both the desktop and mobile nav render `aria-current="page"` on the Government item.

## 2. What direct visitors to `/decisions` see

**Before:** the full fictional decision feed — search, level/impact/trending/controversial filter chips, and a list of `DecisionCard`s sourced from `mock-government-data.ts`.

**After:** `src/app/decisions/page.tsx` was rewritten as a truthful transitional state, composed only from the already-implemented Civic Design System primitives (`PageShell`, `PageHeader`, `EmptyState`, `LinkButton`) — no new visual pattern introduced:

- Heading: "Verified executive-decision records are being prepared."
- An `EmptyState` (`variant="unavailable"`) explaining the page previously showed fictional records and that Stickee doesn't yet have a verified source for government decisions.
- One prominent link to `/parliament`.
- No search box, no filter chips, no decision cards, no agreement percentages, no Trending/Controversial labels.

`src/app/decisions/layout.tsx`'s metadata (title/description/OG tags) was updated to match — it no longer claims to track "federal, state and local government decisions."

`/decisions` was **not deleted** and **no redirect was added**, per the owner's explicit instruction (a redirect would foreclose a future canonical destination decision that hasn't been made). `mock-government-data.ts` was **not deleted** — it's kept as a non-public fixture; after this batch its only importers are `src/components/DecisionCard.tsx` and `src/components/LeaderProfileDetail.tsx`, both already dead code with no live route importing them (confirmed by repo-wide import trace), and test files.

## 3. Fabricated scoring systems found and removed from public surfaces

Traced every public import of `mock-government-data`, `POLITICIAN_SCORECARDS`, `PARTY_VOTE_MAP`, and `generateScores()` before making changes. Four independent live instances of the same defect class were found; all four are now fixed.

| # | System | Where it was live | What it fabricated | Fix |
|---|---|---|---|---|
| 1 | `HouseChamber.tsx`'s `generateScores()` | `/leaders` (chamber), `/parliament` (via `ParliamentExperienceClient`) | Approval, Trust, and "Public Pressure" scores, all deterministically hashed from the MP's own `id` string — not from any real data | `generateScores()`, the `MPScores` interface, and the `ScoreBar`/`PressureBar` rendering (the entire "Scores" block in the MP info panel) deleted outright. The real bill-vote status, swing-MP indicator, and recent-votes list in the same panel are untouched. |
| 2 | `DecisionMaker.approvalRating` / `.trustScore` / `.totalRatings` | Fields existed on every entry in `mock-government-data.ts`'s `DECISION_MAKERS`, typed in `src/types/government.ts` | Fabricated approval/trust numbers on real, named ministers (Albanese 42/44, Chalmers 47/49, etc.) | Confirmed via repo-wide grep that no live component actually rendered `decisionMaker.approvalRating`/`.trustScore` (`DecisionCard.tsx` never read them) — but per the instruction's "any labels... based on these values" and to prevent silent reintroduction, the three fields were removed from the `DecisionMaker` type and from all ten `DECISION_MAKERS` entries. |
| 3 | `POLITICIAN_SCORECARDS` via `CivicScorecard.tsx` | `/impact` | A per-MP "Civic Score" (/100) and five pillar ratings, computed from `mock-civic-data.ts`'s synthetic dataset ("simulates ABS + external data feeds... all values reflect plausible 2024–2025 conditions" per that file's own header) | `<CivicScorecard />` removed from `/impact/page.tsx`, replaced with a truthful `EmptyState` ("Individual politician scoring is being verified"). The pillar-level national indicator scoreboard (`PillarScoreboard`, a *civic-indicator* score, not a per-politician score — a distinct, already-flagged debt item under `AGENTS.md`'s Known Product Debt) was left untouched — it's out of scope for a politician-scoring fix and touching it would be Political Pulse/civic-indicator redesign work, not Batch 8. |
| 4 | `PARTY_VOTE_MAP` via `MPVoteGrid.tsx` | `/issue/[id]` | Every MP of a party assigned the identical yes/no/abstain vote on a handful of illustrative mock issues, rendered as a "MP Vote" badge per named, real MP — the same defect class as the `PARTY_VOTE_MAP` usage already removed from `/mp/[id]` in `PEOPLE_TRUTHFULNESS_BATCH_REPORT.md`, but not caught by that batch because `MPVoteGrid` lives on the Issue page, not the People pages that batch scoped. | The "MP Vote" column and its `VoteBadge` component removed; replaced with a one-line truthful notice ("Individual voting analysis is being verified..."). Sort-by-vote option removed (`SortKey` no longer includes `'vote'`; default sort changed to name). The "Predict" column and "Your implied probability" readout were **kept** — verified these are computed purely from other users' own submitted picks (`userPicks`), never from `PARTY_VOTE_MAP`, so they carry no fabricated-ground-truth defect. |

### Found but explicitly out of scope for this batch

Two related, real findings were surfaced during the import trace but **not fixed**, because fixing them would mean starting the Government/Parliament/People redesign the owner's instructions explicitly said not to begin yet:

- **`mock-parliament-data.ts`'s `getMPVoteForBill()`** (used by `HouseChamber`'s "How They Voted" real-vote mode, `MPActionStrip`'s alignment %, `ChamberSummaryCard`, `PriorityBillFocus`) falls back to a party-line inference (`bill.parties[mp.party].direction`) when no per-MP override exists in `MP_VOTE_DIRECTIONS`, and is currently presented to the reader as "real votes on laws." This is the same defect class as the four fixed above, but wiring it to real `member_votes`/`divisions` data requires the MP canonical-ID reconciliation the roadmap scopes as its own, larger, owner-gated Batch 4/13 (`PAGE_REFACTOR_ROADMAP.md`, `IMPLEMENTATION_BATCHES.md`) — not a same-shape deletion like the four above. Flagged for that batch, not fixed here.
- **`issues-db.ts`'s mock-data fallback path** (`getVoteSummary()`, also `PARTY_VOTE_MAP`-derived) only activates when the real Supabase `issues` table is empty or unreachable — the primary path uses real `mp_yes_count`/`mp_no_count`/`mp_abstain_count` columns. This is the same demo-mode-fallback pattern used elsewhere in the app when the database is unavailable; changing it is a broader architectural question, not a politician-scoring fix, and out of scope here.

`IssueAccordion.tsx` (imports both `mock-government-data` and `POLITICIAN_SCORECARDS`) and `LeaderProfileDetail.tsx` (imports `mock-government-data`) were also found — both are already dead code with zero live route importers (confirmed by repo-wide import trace), so no public surface renders them. Left as-is, matching this codebase's established pattern of keeping unused components rather than deleting (e.g. `LeaderProfileDetail`/`NominationModal` per `PEOPLE_TRUTHFULNESS_BATCH_REPORT.md`).

## 4. Real People/Parliament information preserved

- `HouseChamber.tsx`: real party-coloured chamber composition (`PARTY_COLORS`), the "How They Voted"/swing/campaign view modes, the real bill vote totals (`totalFor`/`totalAgainst`/`totalAbstain`, majority-needed indicator), the swing-MP indicator, and the recent-votes list are all untouched.
- `DecisionMaker` retains real identity fields: `name`, `role`, `party`, `partyShort`, `electorate`, `level`, `keyResponsibilities`, `decisions`.
- `MPVoteGrid.tsx` still links every row to the real MP profile (`/mp/[id]`), still supports name/electorate search and party filtering.
- `/mp/[id]` was not touched by this batch — it already shows the correct truthful placeholder ("Individual voting analysis is being verified.") from `PEOPLE_TRUTHFULNESS_BATCH_REPORT.md`; a regression test confirms it's unchanged.
- `/impact`'s pillar-level national indicator scoreboard (`PillarScoreboard`) is unchanged — a separate, already-documented debt item, not part of this fix.
- `mock-government-data.ts`, `CivicScorecard.tsx`, and `mock-civic-data.ts` are kept in the repo (not deleted) as non-public fixtures.

## 5. Files changed

**Fix 1 — navigation:**
- `src/lib/navigation.ts`
- `src/app/government/page.tsx`
- `src/app/page.tsx`
- `src/app/decisions/page.tsx`
- `src/app/decisions/layout.tsx`

**Fix 2 — fabricated scoring:**
- `src/components/HouseChamber.tsx`
- `src/types/government.ts`
- `src/lib/mock-government-data.ts`
- `src/app/impact/page.tsx`
- `src/components/MPVoteGrid.tsx`

**Tests (new/updated):**
- `src/lib/__tests__/batch-8-truthfulness.test.ts` (new — 17 tests, this batch's dedicated regression suite)
- `src/lib/__tests__/navigation.test.ts` (updated — two assertions that pinned the old `/decisions` href/copy now pin `/parliament`)
- `src/lib/__tests__/phase-3a-home.test.ts` (updated — one assertion that pinned the homepage's old `href="/decisions"` link now pins `href="/parliament"`)

**Not touched, left as-is (pre-existing uncommitted work from before this session — confirmed via `git status` at task start and preserved throughout):** `src/app/campaigns/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/leaderboard/page.tsx`, `src/app/leaders/**`, `src/app/mp/[id]/page.tsx`, `src/app/notifications/page.tsx`, `src/app/parliament/page.tsx`, `src/app/predictions/layout.tsx`, `src/app/profile/page.tsx`, `src/components/BillSmartRow.tsx`, `src/components/BottomNav.tsx`, `src/components/CommandPalette.tsx`, `src/components/DailyBonusBanner.tsx`, `src/components/DecisionCard.tsx`, `src/components/FeaturedMarketCard.tsx`, `src/components/LeaderProfileDetail.tsx`, `src/components/LeaderboardGrid.tsx`, `src/components/Navbar.tsx`, `src/components/PillarCard.tsx`, `src/components/PredictionMarketGrid.tsx`, `src/components/PredictionsPageClient.tsx`, `src/components/ThemeProvider.tsx`, `src/components/simulator/SimulateThisButton.tsx`, `src/components/ui/dialog.tsx`, `src/components/ui/empty-state.tsx`, `src/hooks/useNotifications.ts`, and the ~30 untracked design-system/roadmap documents and `agents/`/`docs/` directories present at session start.

## 6. Migrations created

None. No database or schema change of any kind.

## 7. Tests and results

All commands run locally against the working tree; nothing staged, committed, or deployed.

```
npx tsc --noEmit          → clean, no errors
npx vitest run             → 214/214 passed (9 test files), including the new
                              batch-8-truthfulness.test.ts (17/17)
npm run build               → succeeded (Next.js 16.2.1 / Turbopack), all 46
                              routes compiled, including /decisions and /government
node scripts/secret-scan.mjs → "no suspicious patterns found in tracked files"
```

One pre-existing test (`phase-3a-home.test.ts`, "still links out to the Government section from that empty state") asserted the old `href="/decisions"` string — updated in place to assert `href="/parliament"`, consistent with how `navigation.test.ts` was updated. No other pre-existing test needed a change.

## 8. Browser verification

No headless-browser or screenshot tooling was available in this environment (`chromium-cli` not found; `playwright` not installed and declined to auto-install). **This is HTTP-level verification, not visual browser verification** — I did not view rendered screenshots and am not claiming to.

A Next.js dev server for this exact working directory was already running (started before this session, PID 69265, port 3001) and picked up all file changes via hot reload. Used `curl` against it to confirm each route responds and contains the expected content:

| Route | Status | Confirmed |
|---|---|---|
| `/` | 200 | No `href="/decisions"` remains; 3× `href="/parliament"` present |
| `/decisions` | 200 | Contains "Verified executive-decision records are being prepared" and "This page previously showed fictional decision records" |
| `/parliament` | 200 | Both desktop nav and bottom nav render `aria-current="page"` on the `href="/parliament"` Government item |
| `/leaders` | 200 | MP rows link to real `/mp/[id]` profiles (e.g. `/mp/mp-ca-1`) |
| `/mp/mp-ca-1` | 200 | Shows "Individual voting analysis is being verified." |
| `/impact` | 200 | Shows "Individual politician scoring is being verified"; no scorecard content |
| `/issue/housing-affordability` | 200 | `MPVoteGrid` renders "MP Predictions" and the truthful voting-analysis notice, no per-MP vote badges |
| `/government` | 200 | Response received; could not confirm the resolved destination via `curl` — this route's `redirect()` is served as a streaming RSC payload in Next 16 dev mode that `curl` cannot execute/follow (confirmed: response body is an empty Suspense shell, not the resolved page). The source change itself (`redirect('/parliament')`) is a one-line, low-risk edit to an already-working, pre-existing redirect call — only the target string changed — and is covered by a source-level regression test in `batch-8-truthfulness.test.ts`. Recommend a real click-through if the owner wants direct visual confirmation. |

No console or build errors were observed in any of the above.

## 9. Remaining government data-model work

Unchanged from `IMPLEMENTATION_BATCHES.md` — this batch does not touch:
- The Issue/Bill/Decision schema merge (Batch 9 — requires an owner-approved merge strategy).
- Real executive-decision ingestion or ministerial/department attribution.
- The `evidence`/`citations` table.
- The MP canonical-ID reconciliation needed to wire real `member_votes`/`divisions` into `HouseChamber`'s "real vote" mode, `MPActionStrip`'s alignment %, and `MPVoteGrid` (Batch 4/13 — flagged in §3 above as a related, larger, not-yet-scoped-here defect).

## 10. Remaining evidence gaps

- `mock-parliament-data.ts`'s party-line vote inference (§3, "found but out of scope") is presented to readers as real parliamentary votes in several places beyond what this batch touched. This is the next-most-consequential truthfulness gap in the People/Parliament surface area and should be prioritized in Batch 4/13.
- `/impact`'s pillar-level "National Civic Score" (`CIVIC_PILLARS`, via `PillarScoreboard`) remains synthetic data presented as a live indicator — an existing, separately-tracked item under `AGENTS.md`'s Known Product Debt, not a politician-scoring defect, left untouched by design.

## 11. Confirmation

- Production was not accessed, modified, or deployed to.
- Nothing was staged, committed, or pushed.
- No migration was created or applied.
- No secret values were printed; `scripts/secret-scan.mjs` found nothing suspicious.
- No unrelated pre-existing uncommitted work (design-system migration files, roadmap documents, `agents/`/`docs/`) was modified or overwritten.
