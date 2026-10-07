# Forecasts (`/predictions`, nav label "Forecasts") — Page Audit

Governed by [`AGENTS.md`](../../AGENTS.md). Verified against `PredictionsPageClient.tsx`, `MarketCard.tsx`, `FeaturedMarketCard.tsx`, `ProposeMarketModal.tsx`, `useWallet.ts`/`usePredictionWallet.ts` as cited in `SIMPLIFICATION_RECOMMENDATIONS.md` (files unchanged since that verification, per current `git status` showing `PredictionsPageClient.tsx`/`FeaturedMarketCard.tsx` still only carrying pre-existing uncommitted edits, not touched by any batch since). Preserve forecasting — the brief and `AGENTS.md` are explicit that this is not being removed, only de-costumed.

## What must be preserved vs. what must go

**Kept, per `STICKEE_V1_PRODUCT_BLUEPRINT.md` §6 (explicit, do not treat as ambiguous):** probability, history, virtual points, forecasting, portfolio, resolution, evidence, arguments — this is a defining, legitimate Stickee feature.

**Removed:** fake urgency, fake volume, fake traders, fake leaderboards, casino styling, fabricated engagement. The mechanism (staking, settlement, eligibility) is real, verified infrastructure per `AGENTS.md`'s trusted-infrastructure list — none of the findings below touch that verified core; all of them concern what surrounds it.

## Truthfulness classification of key elements

| Element | Classification | Basis |
|---|---|---|
| Bill-market probability (real markets) | **Forecast** | `issue_markets`, verified infrastructure |
| Wallet balance (`usePredictionWallet`) | **Verified fact** | Real Supabase, staked/settled correctly per `docs/audits/DATABASE_VERIFICATION_REPORT.md` |
| Wallet balance shown elsewhere (`useWallet`) | **Hardcoded / inferred fallback presented as the same fact** | `localStorage`-only, a second, unsynced balance for the same user — see `CIVIC_ACTION_MODEL.md`/architecture doc System 5 |
| Civic/election/MP-vote-category "markets" | **Demo, correctly labeled `status: 'demo'`** | Permanently non-tradeable by `market-eligibility.ts` design — correct behaviour, not a bug, but must stay visually distinct from real markets |
| AI bull/bear case (populated) | **AI-generated interpretation**, needs an explicit label | Currently no visible "AI-generated" tag distinguishing it from editorial content |
| AI bull/bear case (fallback) | **Hardcoded, presented as market-specific** | Falls back to generic template text with no visual distinction from populated cards (`MarketCard.tsx:191-212`) — Legal Advisor rates this "High" risk under Australian Consumer Law's misleading-conduct standard |
| 24h-move / volume figures | **Hardcoded / unsupported** | Fake figures shown with equal visual authority to the real probability (`FeaturedMarketCard.tsx:110-127`) |
| Leaderboard (both `/leaderboard` and the embedded slot) | **Removed as of Batch 1** | Both surfaces now show an honest "not available yet" message — confirmed still in place |
| "+Propose" market-submission modal | **Demo content, but not labeled as such** | Never persists past `localStorage`; carries a "Pending Review" badge implying real moderation that does not exist (`ProposeMarketModal.tsx` — no `fetch` call anywhere in the file) |
| Live Election Pulse | **Verified fact** (real AEC scrape) but **mis-scoped** | Correctly sourced, permanently mounted regardless of relevance — a placement defect, not a truthfulness one |
| `resolution_source` on a resolved market | **No verified data available (to the reader)** | Exists at the database layer, admin-entered, never surfaced on the public resolved-market view (Data & Evidence Steward P1 — a presentation gap, not a data gap) |

## OUTPUT PER PAGE

**PAGE:** Forecasts
**ROUTE:** `/predictions` (target `/forecasts`)
**CURRENT PURPOSE:** Market board + featured market + wallet/portfolio panel + propose-market modal + top-6 leaderboard slot + Live Election Pulse + recent-simulator-runs strip, all on one page.
**PROPOSED PURPOSE:** The participation layer built on top of understanding — board and staking only.
**SINGLE QUESTION:** What is likely to happen next?
**PRIMARY USER:** Someone who wants to see the crowd's current estimate on a question they care about, optionally stake a view.
**FIRST 30 SECONDS:** Currently scans past five unrelated header controls (wallet, positions, sign-in, +Propose, wallet toggle) before reaching the actual board (`PredictionsPageClient.tsx:219-286`).
**WHAT IS ESSENTIAL:** Hero count, featured forecast, category/status filters, the market grid.
**WHAT IS OPTIONAL:** None of the current header's five extra controls belong at this level at all — see below.
**WHAT IS DUPLICATED ELSEWHERE:** Leaderboard (duplicates `/leaderboard`'s exact data source, when either is live); wallet balance (a second, `localStorage` copy exists via `useWallet`, used by Profile/Daily Bonus).
**WHAT BELONGS ON A DETAIL PAGE INSTEAD:** Evidence/history/AI bull-bear content currently crammed onto list-grid `MarketCard`s — belongs on `/forecasts/[id]`, which does not exist yet (see `DETAIL_PAGE_AUDIT.md`#forecast-detail).
**WHAT SHOULD BECOME CONTEXTUAL:** Live Election Pulse — render only when `useLiveElection().active` is true, not permanently mounted; recent-rehearsals/simulator strip — a single chip, not a strip.
**WHAT SHOULD BE REMOVED:** Wallet balance/portfolio (move to Account); leaderboard slot (one real query, elsewhere, not reinstated here); "+Propose" modal (remove until it has a real backend — do not add a disclaimer to a feature that does nothing).
**WHAT SHOULD NEVER APPEAR:** Fake volume/24h-move figures with the same visual weight as the real probability; AI-generated fallback text presented as market-specific analysis; a "pending review" badge on a submission that is never reviewed.
**FAKE/UNSUPPORTED:** See classification table — AI fallback text, volume/24h-move, `ProposeMarketModal`'s implied review pipeline.
**WHAT IS GENUINELY REAL:** Bill-market staking (verified infrastructure); the wallet's real balance (once the duplicate is retired); Live Election Pulse's underlying data (AEC scrape, correctly disclosed as "Stickee's summary... not an AEC declaration" — the one place in the app that models source trust correctly, `docs/audits/DATA_AND_CONTENT_AUDIT.md` §6).
**DEAD/DECORATIVE CONTROLS:** `ProposeMarketModal`'s submit action (no persistence at all); AI bull/bear fallback (renders as if analysis exists when none does).
**PRIMARY ACTION:** Understand the current estimate for a question you care about.
**SECONDARY ACTIONS:** Stake a view (sign-in gated, correctly so today); see the originating issue (currently a dead end — no market card links back, `USER_JOURNEY_MAPS.md` Journey 6).
**EMPTY STATE:** "No verified forecasts are currently open" — already the correct pattern on Today; extend consistently here.
**MOBILE PRIORITIES:** Wallet/propose/sign-in controls currently vanish entirely on mobile inside a `hidden sm:flex` wrapper instead of reflowing (`CORE_PAGE_REDESIGN.md`) — moot once relocated to Account, but whatever remains must degrade to a menu, not silent removal.
**CANONICAL DATA SOURCE:** `issue_markets`, `usePredictionWallet` (Supabase) — never `useWallet` (localStorage), never `FeaturedMarketCard`'s independent demo-market path.
**REQUIRED SHARED COMPONENTS:** Same featured-item + underline-tab-filtered-grid grammar as Issues — "a reader who has learned one has learned both" (`CORE_PAGE_REDESIGN.md`).
**RESPONSIBILITY MAP NEEDS:** Each forecast should show which Issue/Bill it's attached to and link back — see `RESPONSIBILITY_MAP_SPEC.md`#forecast.
**CIVIC ACTION NEEDS:** "Follow this forecast" / "see the issue behind it" — a forecast is a downstream *consequence* of an issue, the page should make that traceable, not present probability as free-floating.
**LEGAL / EDITORIAL / POLICY RISKS:** **High**, per the Legal Advisor's Council review — fake volume/24h-move under Australian Consumer Law's misleading-conduct standard; the underlying engagement-mechanic question (daily bonus + streak-freeze purchase + probability staking, independent of visual styling) is rated "Requires professional legal review," not resolvable by a re-skin alone (`STICKEE_V1_EXECUTIVE_SUMMARY.md` Disagreement D1 — Legal Advisor's position stands as blocking-equivalent per Council escalation rules).
**SMALLEST SAFE FIX:** Suppress the AI fallback (don't render generic text as if market-specific); remove the "+Propose" entry point; hide fake volume/24h-move. All three are presentation/removal, zero schema change, same risk class as Batch 1 — this is literally the un-started remainder of `IMPLEMENTATION_BATCHES.md` Batch 8.
**IDEAL V1 STRUCTURE:** Per `CORE_PAGE_REDESIGN.md`#Forecasts — hero (one number) → featured forecast → filters → grid → `/forecasts/[id]` (new) carrying the dense content.
**IMPLEMENTATION PRIORITY:** P0 for the truthfulness fixes (AI fallback, fake volume, propose-modal removal — no dependency, ready now); the wallet-reconciliation and Account-relocation work is P1 but **High risk** and requires real-database re-verification per `AGENTS.md`'s mandatory rule for anything wallet-adjacent.
**OWNER DECISIONS:** Commission the D1 legal review (engagement mechanic) before calling any relocation/re-skin "resolved," per Council escalation rules; how to reconcile `useWallet`/`usePredictionWallet` (migrate, unify, or explicitly rename `useWallet` as a distinct, honestly-labeled non-forecasting currency if it survives at all).

## Council review (Level 3 — reuses `STICKEE_V1_EXECUTIVE_SUMMARY.md` Disagreement D1, Consensus C6, C8)

```
Software Architecture:  Approved with conditions — wallet/leaderboard duplication must not be relocated with the duplication intact (C6)
Legal and Regulatory:   Requires professional legal review (D1) — blocking-equivalent per Council escalation rules; not resolved by visual reframing alone
Product:                 Approved with conditions — "engaging but calm" achievable via epistemic (not behavioural) reframing, contingent on Legal's review
UX:                      Approved with changes — 9 header/board elements → 4 confirmed as the right target
Data & Evidence:         Approved with conditions — resolution_source must surface publicly once resolved

Overall recommendation: Truthfulness fixes (AI fallback, fake volume, propose-modal) proceed now, no gate. Wallet consolidation and any engagement-mechanic sign-off wait on real-DB verification and the D1 legal review respectively — these are two independent gates, neither should be treated as satisfied by the other.
```
