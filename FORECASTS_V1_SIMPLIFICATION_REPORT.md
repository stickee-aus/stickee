# Forecasts V1 — Simplification and Truthfulness Report

Governed by [`AGENTS.md`](AGENTS.md) and [`docs/philosophy/STICKEE_CHARTER.md`](docs/philosophy/STICKEE_CHARTER.md) — the same Charter-governed batch discipline as `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md` and `PEOPLE_V1_REFINEMENT_REPORT.md`. Scope: `/predictions` (nav label "Forecasts"), the components it renders, and the minimum data-layer fixes required to stop showing unmaintained figures as if they were live. No other core page was touched. Nothing was staged, committed, pushed, or deployed. Production was not accessed.

Read before starting: `AGENTS.md`, `docs/philosophy/HOW_STICKEE_THINKS.md`, `docs/philosophy/STICKEE_CHARTER.md`, `STICKEE_V1_PRODUCT_BLUEPRINT.md`, `docs/page-audits/FORECASTS_PAGE_AUDIT.md`, `docs/page-audits/CROSS_PAGE_CONSISTENCY_AUDIT.md`, `CIVIC_DESIGN_SYSTEM.md`, `DESIGN_SYSTEM_MIGRATION_ROADMAP.md`, `docs/audits/FEATURED_MARKET_DUPLICATION_AUDIT.md`, `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`, `PEOPLE_V1_REFINEMENT_REPORT.md`, `HOMEPAGE_FORECASTS_BATCH_REPORT.md` — plus every `supabase/migrations/*.sql` file touching `issue_markets`/`wallet_positions`/`place_wallet_stake`/`resolve_market`, to verify which fields are genuinely live versus static. The approach was reviewed and approved by the owner (with four specific amendments, see §9) before any code was written.

---

## 1. What Forecasts now exists to do

`/predictions` answers **"What is likely to happen next, and how confident are participants?"** — a flat, readable list of real and clearly-labelled-demo forecasts, staking only where genuinely eligible, with no wallet dashboard, proposal workflow, leaderboard, permanent election widget, or fabricated activity metric competing for attention above it.

## 2. Structure before and after

**Before:** hero count sharing a row with wallet balance/open-position count/sign-in link/"+Propose"/"Show wallet" toggle (5 header controls) → permanently-mounted Live Election Pulse (rendering "No live federal count right now" even when nothing was happening) → a simulator-rehearsal strip → a featured market card selected from the same array with no distinct editorial signal → category/status filter row → a grid of dashboard-tile `MarketCard`s (thumbnail image, 24h-move tile, volume tile, AI bull/bear case, news timeline, probability-history chart) → a permanently-visible "Leaderboard" placeholder box.

**After:**
1. `PageHeader` — "Forecasts", one-sentence purpose, one real metric (open forecasts, computed from the same array rendered below), source/update metadata.
2. A two-line participation summary — signed-out: "Sign in to participate"; signed-in: "Balance: N pts · N open positions". No toggle, no panel.
3. Live Election Pulse, rendered only when `useLiveElection().active === true`.
4. Category and status filters (`UnderlineTabs`).
5. "Current forecasts" — one flat list of `RecordRow`-based forecast rows (no grid, no featured slot).
6. "How forecasting works" — a new, collapsed-by-default, plain-language explainer (what a probability means, that points are virtual, how resolution works generally).

## 3. Visible-claim classification (this session's audit)

| Element | Before | Classification | After |
|---|---|---|---|
| Bill-market probability (real markets) | `issue_markets.probability` | Forecast, verified infrastructure | Unchanged |
| **`total_participants`/`yes_volume`/`no_volume`/`yes_change` on real DB-backed markets** | Shown as "Volume"/"24h move" stat tiles | **Found this session, not in prior audits: static/seeded DB columns.** `place_wallet_stake` (migrations 008, 017) only ever mutates `user_wallets.balance` and `wallet_positions` — it never updates these `issue_markets` columns. So even a genuinely real, non-demo bill market's "participants"/"24h move" were never live figures, just numbers with no update mechanism | Removed from every card, real or demo — no code path in this app keeps them truthful |
| **DB `status = 'voided'`/`'cancelled'`** | `toMarketStatus()` (`issues-data.ts`) defaulted anything except `resolved-yes`/`resolved-no` to `'active'` | **Found this session: a real voided/cancelled market would show live Yes/No stake buttons.** Server-side `is_market_open()` still blocked the actual stake (no financial exposure), but the client claim was false | Fixed: `'voided'`/`'cancelled'` now map to the client's `'voided'` status, matching the DB's own check constraint (migration 017: `status in ('active','resolved-yes','resolved-no','voided','cancelled')`) |
| `resolution_source` (admin-entered on settlement, migration 017) | Column existed, never queried by `getLiveBillMarkets()`, never mapped onto `PredictionMarket` | No verified data available (to the reader), despite existing at the DB layer | Now selected, mapped (`resolutionSource`), and shown on the card meta line once a market is resolved |
| Civic/election/mp-vote/urgent "markets" | Always `status: 'demo'` | Demo, correctly labelled, permanently non-tradeable by `market-eligibility.ts` | Unchanged behaviour — still visible, still labelled "Demo", still `canStake: false` |
| AI bull/bear case, news timeline, probability-history chart | Rendered on every card (real and demo alike), template-generated even for DB-backed rows (`marketStoryFor()`) | Fabricated/AI-generated content shown with no distinguishing label | Removed from the list page entirely — not labelled-and-kept, removed, since no sourced-analysis version of this content exists anywhere in the codebase (see §7, Owner Decisions) |
| Featured market (`urgent-rba-rate` hardcoded id, then `selectFeaturedMarket`) | Batch A/C of the duplication audit had already fixed the selection rule to be `canStake`-gated with no hardcoded id | Already correct, but still a separate, arbitrarily-elevated slot with no real editorial/ranking methodology behind it | Removed entirely — one flat list, no featured significance invented (owner decision, §9) |
| "+Propose" / `ProposeMarketModal` | `localStorage`-only, confirmed zero `fetch` calls anywhere in the file, "Pending Review" badge implying a real moderation queue that doesn't exist | Demo content, not labelled as such | Removed from the primary page |
| Leaderboard slot | Already an honest "not available yet" placeholder (fixed by an earlier batch) | Honest but still a permanently-visible, always-empty decorative block | Suppressed entirely — not rendered, not shown as an empty box |
| "Why this matters" (new field) | Did not exist | N/A | Added, but **only** for `category === 'bill'` markets whose linked `Issue.summary` (real, already-fetched editorial content, `getIssuesPageData()`) is non-empty — one sentence, truncated, never generated. Omitted cleanly everywhere else |
| Live Election Pulse | Real AEC data, correctly disclosed as Stickee's summary not an AEC declaration | Verified fact, but permanently mounted regardless of relevance | Now gated on `liveElection.active === true` |

## 4. Featured forecast findings

Per the owner's explicit decision (§9, item 1): removed entirely, not rebuilt. `selectFeaturedMarket` (`market-eligibility.ts`) was already `canStake`-gated with no hardcoded id after an earlier batch (Batch A/C of `FEATURED_MARKET_DUPLICATION_AUDIT.md`) — so this wasn't a truthfulness fix, it was a product decision: with no real editorial, personalisation, or ranking methodology behind it, arbitrarily elevating one forecast above the rest isn't warranted. `PredictionsPageClient` no longer imports `FeaturedMarketCard` or calls `selectFeaturedMarket`. `market-eligibility.ts`'s `selectFeaturedMarket` function is left in place, unused — it may serve a genuine future editorial-pinning feature and costs nothing to keep.

## 5. Wallet findings

`PredictionsPageClient` previously rendered a "Show wallet"/"Hide wallet" toggle that revealed a full `PortfolioPanel` (balance, open/closed positions, totals) inline. Per the owner's explicit decision (§9, item 2): reduced to two lines of plain text — no toggle, no panel, no transaction detail. `usePredictionWallet` (the real, Supabase-backed wallet) is read but never mutated differently than before; no behavioural or settlement change. The real portfolio/account experience is explicitly deferred to a future wallet/Account-reconciliation batch — Profile currently renders the *other*, `localStorage`-only `useWallet`, and this batch was not authorised to touch Profile, so no link was added there (would show a second, different balance on a page a reader might reasonably expect to be "their account").

## 6. Proposal findings

Confirmed (again) that `ProposeMarketModal.tsx` never calls `fetch` anywhere in the file — `saveProposal()` writes only to `localStorage`, and the "Pending Review" badge implied a moderation queue that does not exist. Removed the "+Propose" button, the modal mount, `loadProposals()`, and the "Proposed (N)" category-filter tab from `PredictionsPageClient`. `ProposeMarketModal.tsx` itself is left in the repo, unused — matches this codebase's established convention (`GOVERNMENT_V1_SIMPLIFICATION_REPORT.md` §11) of not deleting orphaned components mid-batch. A future real proposal pipeline (visible-status lifecycle: submitted → under review → accepted/declined) remains undesigned, per `STICKEE_V1_PRODUCT_BLUEPRINT.md` §8's existing framing of Community/proposal features as deferred, not in scope here.

## 7. Leaderboard findings

The inline leaderboard block on `/predictions` was already an honest, undramatic "not available yet" placeholder (fixed by an earlier batch, `PAGE_REFACTOR_BATCH_1_REPORT.md`). This batch goes one step further and suppresses the section entirely — an always-empty box is still a decorative block competing for space on a page this brief explicitly asked to de-clutter. `/leaderboard` itself (a separate route, `LeaderboardGrid.tsx`) was not touched.

## 8. Election-widget findings

`LiveElectionPulse` was previously mounted unconditionally in `PredictionsPageClient`, and its own inactive-state branch rendered a permanent "No live federal count right now" card. It is now wrapped in `{liveElection.active && (...)}` — confirmed via grep that `PredictionsPageClient.tsx` is `LiveElectionPulse`'s sole importer, so this is a safe, page-local change. The component itself, and its real AEC data source, are unchanged.

## 9. Eligibility/settlement findings

Zero behavioural changes to `usePredictionWallet`, `market-eligibility.ts`'s `getMarketEligibility`/`canStake` logic, `StakeModal`'s eligibility gate, or any Supabase RPC (`place_wallet_stake`, `is_market_open`, `resolve_market`). The two data-layer fixes in this batch (`toMarketStatus`'s voided/cancelled mapping, `resolution_source` now being read) are read-path/display fixes only — no migration was created or applied; `resolution_source` already existed as a column, this batch only started *reading* it.

**Owner decisions, resolved before implementation began (recorded verbatim from the approved plan):**
1. No Featured Forecast — one flat list, no invented editorial significance.
2. Minimal participation summary only — no wallet drawer, no portfolio panel, no toggle.
3. "Why this matters" only when sourced from a real, existing issue summary — never generated; omitted when absent.
4. Section heading "Current forecasts", not "Forecast board".

Plus the page-structure and terminology instructions carried through exactly as approved: probability language over "shares/payout/¢/buy/sell" on the list page; demo markets stay visible and clearly labelled, never silently hidden; `StakeModal`'s own copy ("Shares", "¢", "Potential profit") stays untouched, still behind the `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` Phase 4b Product Strategist + Legal Advisor gate this session isn't authorised to clear; no new `/predictions/[id]` detail route was built.

## 10. Terminology changes

List-page surfaces (`PredictionsPageClient.tsx`, `MarketCard.tsx`) no longer contain "shares", "payout", "¢", "Buy Yes"/"Buy No", "24h", or "volume" anywhwere (verified by regression test and by grepping the rendered HTML). "Forecast board" → "Current forecasts". "Volume" stat removed rather than relabelled, since the underlying figure isn't live (§3). `StakeModal.tsx` is explicitly excluded from this pass — it remains gated behind the same review this repo's own roadmap already named before this batch started.

## 11. Forecast-detail structure (documented, not built)

Per the approved plan, no `/predictions/[id]` or `/forecasts/[id]` route was created this batch. The safe V1 target structure, for when it is built:

```
Forecast question
Current probability + status
Close date
Resolution criteria (no schema field exists today — would show "No verified data available" until one does)
Resolution source (real, once resolution_source is read — done in this batch, just not yet surfaced on a dedicated detail page)
Why this may happen / What could change the forecast (only ever from real sourced analysis — none exists today; omit, do not generate)
Evidence / related issues (link to /issue/[id] for bill markets — done on the list page in this batch)
Forecast history (only the real yes_history column, when present — never a generated chart)
Community participation (no live, truthful figure exists today — see §3's total_participants finding; omit until a real mechanism exists)
Final resolution (resolutionSource + resolved-yes/no status)
Corrections/methodology (depends on the site-wide revision-history mechanism named in STICKEE_CHARTER.md §9 — not yet built for any content type)
```

Staking stays on the list rows for now (two small, correctly-gated buttons — not judged to be "wallet-dashboard clutter" in the sense the brief means).

## 12. Files changed

- `src/lib/issues-data.ts` — `IssueMarketRecord` gains `resolution_source`; `toMarketStatus` maps `'voided'`/`'cancelled'` → `'voided'` instead of defaulting to `'active'`; `mapIssueMarketRecordToPredictionMarket` passes `resolutionSource` through.
- `src/lib/predictions-db.ts` — `resolution_source` added to `getLiveBillMarkets()`'s select list.
- `src/lib/mock-market-data.ts` — `PredictionMarket` gains optional `resolutionSource?: string | null`.
- `src/app/predictions/page.tsx` — also calls `getIssuesPageData()` (unchanged, existing function); builds and passes `issueSummaries` (issueId → real summary, non-empty only).
- `src/components/MarketCard.tsx` — rewritten: `RecordRow`-based forecast row (question, sourced "why this matters" when available, category/resolves/resolution-source meta, probability value, status label, stake buttons when eligible, "See issue →" for bill markets). The pre-existing dashboard-tile subcomponents (`MarketThumbnail`, `BullBearCase`, `MarketNewsTimeline`, `ProbabilityHistoryChart`, `SimulatorComparison`, `probColor`, `changeColor`, `CATEGORY_COLORS`) are kept as an explicitly-commented legacy block, unused by the new `MarketCard`, solely because `FeaturedMarketCard.tsx` (see below) still imports them.
- `src/components/PredictionsPageClient.tsx` — rewritten per the approved structure (§2). Removed: wallet toggle/`PortfolioPanel`, "+Propose"/`ProposeMarketModal`/proposal filter tab, unconditional `LiveElectionPulse`, `RecentRehearsalsStrip`, the inline leaderboard block, the featured-market slot. Added: `PageShell`/`PageHeader`/`SectionHeader`/`EmptyState`/`UnderlineTabs`, the minimal participation line, the collapsed "How forecasting works" section.
- `src/components/FeaturedMarketCard.tsx` — **not modified.** It is a pre-existing tracked file already carrying its own uncommitted changes from before this session; per the owner's explicit instruction ("keep the old component in the repo if deleting it would broaden scope, but stop rendering it"), it was left completely untouched rather than deleted or rewritten. It is no longer imported anywhere (confirmed by grep) and still compiles only because `MarketCard.tsx` kept exporting the specific names it depends on (see above) — this is intentional, documented in-file, and should be deleted along with `FeaturedMarketCard.tsx` together, not separately, if a future batch retires it.
- `src/lib/__tests__/forecasts-v1-simplification.test.ts` — new, 26 tests (see §14).
- `src/lib/__tests__/market-eligibility.test.ts` — one pre-existing assertion updated in place: it previously pinned `PredictionsPageClient` calling `selectFeaturedMarket(markets)`; since this batch removes the featured slot entirely (an explicit, approved decision, not a regression), the assertion now pins the opposite — no featured-slot wiring of any kind.
- `src/lib/__tests__/page-refactor-batch-1.test.ts` — one pre-existing assertion updated in place: it previously pinned the leaderboard's "not available yet" placeholder text being present; since this batch suppresses the section entirely rather than showing an empty box, the assertion now pins full suppression.

No other file was modified. `StakeModal.tsx`, `usePredictionWallet.ts`, `useWallet.ts`, `market-eligibility.ts`, `PredictionMarketGrid.tsx`, `/issue/[id]/page.tsx`, `DailyBonusBanner.tsx` (already correctly hides itself on `/predictions`, confirmed unchanged), `LiveElectionPulse.tsx`, `RecentRehearsalsStrip.tsx`, and `/leaderboard` were read for audit purposes only, not modified.

## 13. Deferred cleanup — orphaned/unused after this batch

- `src/components/FeaturedMarketCard.tsx` — unused, kept per explicit instruction (see §12).
- `src/components/ProposeMarketModal.tsx` — unused, kept per this codebase's established convention for orphaned components.
- `MarketThumbnail`/`BullBearCase`/`MarketNewsTimeline`/`ProbabilityHistoryChart`/`SimulatorComparison`/`probColor`/`changeColor`/`CATEGORY_COLORS` in `src/components/MarketCard.tsx` — unused by `MarketCard` itself, kept only for `FeaturedMarketCard.tsx`'s sake, explicitly commented as such in-file.
- `src/components/PredictionMarketGrid.tsx` — unchanged, still a separate, already-documented duplication (`FEATURED_MARKET_DUPLICATION_AUDIT.md` Batch B/D) on `/issue/[id]`, which this batch was not authorised to touch.

## 14. Tests and results

```
npx tsc --noEmit               → clean, 0 errors
npx vitest run                 → 379/379 passed (15 files), including the new
                                  forecasts-v1-simplification.test.ts (26/26)
npm run build                  → succeeded (Next.js 16.2.1 / Turbopack), all 46
                                  routes compiled, including /predictions
node scripts/secret-scan.mjs   → "no suspicious patterns found in tracked files"
```

Two pre-existing tests were updated in place (see §12) — both were pinning behaviour this batch's own approved brief specifically changed (the featured slot's existence at all, and the leaderboard placeholder's visibility), consistent with this codebase's established convention (`GOVERNMENT_V1_SIMPLIFICATION_REPORT.md` §12, `PEOPLE_V1_REFINEMENT_REPORT.md` §12) of updating a pinned assertion only when the current batch's own brief is the direct cause of the behaviour change, never silently.

The 26 new tests cover: `toMarketStatus`'s voided/cancelled fix (via `mapIssueMarketRecordToPredictionMarket` + `getMarketEligibility`); `resolution_source` being selected and mapped through; no `.participants`/`.priceChange`/24h/volume reads in `PredictionsPageClient`; no fabricated-content subcomponents imported into the live render tree; no featured-slot wiring; no proposal UI; no leaderboard; no wallet toggle/panel, exact minimal participation copy; `LiveElectionPulse` gated on `liveElection.active`; no `RecentRehearsalsStrip`; "Current forecasts" heading present, "Forecast board" absent; no shares/payout/¢/buy-sell language on list-page files; "why this matters" sourced only from real, non-empty `issue.summary`, never a fallback string; "How forecasting works" collapsed by default; demo markets never render stake controls; shared Civic Design System primitives are actually used; `StakeModal`'s copy is confirmed still unchanged (a regression guard on the *absence* of a change, not its presence).

## 15. Visual/HTML verification

**No headless-browser screenshot tooling is available in this environment** (consistent with every prior batch's finding) — no pixel-level screenshots were taken, stated plainly rather than claimed otherwise.

Verified instead against an already-running local `next dev` server for this exact project (confirmed via `lsof`, PID 91137, port 3001 — the same server prior batches used, not started by this session):

- `/`, `/predictions`, `/issue/housing-affordability`, `/leaderboard` all returned HTTP 200.
- The rendered `/predictions` HTML was inspected directly and confirmed: the page header shows "Forecasts", the one-sentence purpose, and a real "0" for "open forecasts" (this exact local/mock environment has zero real DB-backed `active` rows — every fallback market is `status: 'demo'`, so the truthful empty state, "No verified forecasts match this filter yet", correctly renders by default under the "Active" status filter); "Current forecasts" is present, "Forecast board" is absent; "Featured", "+ Propose", "Pending Review", "Leaderboard", "Show wallet", "Shares", and "¢" are all absent; "How forecasting works" is present (collapsed); `LiveElectionPulse`'s permanent "No live federal count right now" text is correctly absent (this environment has no active live election, and the widget is now fully unmounted rather than showing an inactive placeholder) — confirming the `liveElection.active` gate works as intended, not just that the code compiles.
- One residual, harmless finding: the raw `PredictionMarket` objects (still carrying `newsTimeline`/`priceChange`/`participants` on their TypeScript shape, unchanged by this batch — see §12) are serialized into the page's React Server Components hydration payload as inert JSON, since the full object is still passed as `initialBillMarkets`/component props. This is not rendered to the DOM anywhere (confirmed by source-level tests, §14) and is not visible or reachable by a reader — but it is worth naming precisely rather than glossing over: a future batch narrowing the prop shape itself (not just the render logic) would remove this residue entirely.
- No `hidden sm:*`-wrapped interactive control was introduced (the exact bug class `CROSS_PAGE_CONSISTENCY_AUDIT.md` flagged for this page's old header) — confirmed by grep, zero matches in either rewritten file.
- Switching the status filter to "All"/"Resolved" to visually confirm demo-labelled rows, stake buttons, and the "why this matters"/"See issue" links render correctly was **not** verified via a real click-through, since no interactive browser session was available — the source-level tests in §14 assert this logic directly (`MarketCard`'s `StatusLabel`/`canStake`/`whyThisMatters` branches), which is a real but narrower guarantee than a rendered screenshot would be.

## 16. Owner decisions still required

Restated, not re-litigated:

1. **Demo-only categories stay visible.** Confirmed as the status quo this batch preserved (civic/election/mp-vote/urgent remain always-demo, clearly labelled) — whether any of these should eventually get a real, DB-backed path (per `FEATURED_MARKET_DUPLICATION_AUDIT.md` Batch D) is unresolved.
2. **Whether a `/predictions/[id]` detail route gets built**, and when — the target structure is documented (§11), not built.
3. **Wallet/Account reconciliation** — `useWallet` (localStorage) vs `usePredictionWallet` (real) remains two systems; Profile still shows the fake one. Unresolved, unchanged by this batch.
4. **`StakeModal`'s terminology gate** — "Shares"/"¢"/"Potential profit" remain, pending the Product Strategist + Legal Advisor review `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` Phase 4b already named before this batch started.
5. **`PredictionMarketGrid`/`/issue/[id]`'s separate market system** — unchanged, still a real, already-documented duplication, out of this batch's scope.
6. **Final legal review of the underlying engagement mechanic** (daily bonus + probability staking, independent of visual styling) — `FORECASTS_PAGE_AUDIT.md`'s Council review rated this "Requires professional legal review," not resolvable by a re-skin. Not resolved here; this batch made no engagement-mechanic changes, only truthfulness/declutter ones.
7. **Whether a real forecast-proposal pipeline gets built** (visible-status lifecycle) — documented as a future concept in `STICKEE_V1_PRODUCT_BLUEPRINT.md` §8, not designed further here.

## 17. Confirmation

- Production was not accessed, modified, or deployed to.
- Nothing was staged, committed, or pushed.
- No migration was created or applied; no database was written to. `resolution_source` already existed as a real column (migration 017) — this batch only started reading it.
- No secret values were printed; `scripts/secret-scan.mjs` found nothing suspicious.
- Only `/predictions` and the files listed in §12 were changed. Issues, Government/Parliament, People, Today, Political Pulse, and every account/profile/admin page were not touched.
- No wallet, staking, settlement, or Supabase RPC behaviour was changed — every fix in this batch is either read-path (querying `resolution_source`) or presentation-only.
- No large, pre-existing uncommitted working-tree changes present at session start (the design-system files, other pages' in-flight edits, `agents/`/`docs/` directories, `FeaturedMarketCard.tsx`'s own pre-existing modification) were modified, reverted, or overwritten.
