# Tab, Toggle, Filter, and Mode Audit

Governed by [`AGENTS.md`](../../AGENTS.md). Covers every in-page tab, toggle, filter, and mode named in the audit brief, plus any additional one found during this audit. Each entry: what it does, whether it's real, whether it's redundant with another tab elsewhere, and a verdict.

---

## Issues

| Tab/mode | Real? | Verdict |
|---|---|---|
| All / Active / Passed / Rejected (status filter) | Yes — filters real `issues.status` | **Keep** — correct pattern, matches `CIVIC_DESIGN_SYSTEM.md`'s underline-tab convention |
| Expanded issue row | Yes, but over-dense (7 data points) | **Simplify** — collapse to 2 before expansion; see `ISSUES_PAGE_AUDIT.md` |
| Predict outcome (inline poll) | Yes — real Supabase `predictions` | **Keep**, but should be the *only* prediction affordance on the expanded/detail view — currently coexists with the embedded market widget |
| Email your MP / civic action | Partially real — `EmailMPModal`'s mailto is real; not connected to the `bill_pressures` counting mechanism used elsewhere | **Replace** with the full "How can I influence this?" model — see `CIVIC_ACTION_MODEL.md` |

## Government / Parliament

| Tab/mode | Real? | Verdict |
|---|---|---|
| Priority Bill | Yes — `PriorityBillFocus`, real data | **Keep unchanged** — independently rated the strongest single-task pattern in the whole review |
| Active Bills (filterable feed) | Yes, real, but duplicates Issues | **Remove as a second filterable list** — link to Issues instead |
| Your Rep | Yes — real electorate lookup (hash-based, not truly geographic — see Personalisation System caveat) resolves a real MP | **Fix** — add the missing link from the resolved MP to their own profile (currently a dead end) |
| Chamber (House/Senate/Current Chamber toggle) | Yes — real `members`/party composition | **Keep** — the page's one correct filter-grammar control |
| Live Election Results (chamber toggle) | Yes — real AEC scrape when active | **Gate on `useLiveElection().active`** — currently always offered as a toggle option regardless of whether an election is live |
| How They Voted | Partially real — real `divisions` where available, **falls back to party-line inference presented as fact** (`mock-parliament-data.ts`'s `getMPVoteForBill()`) | **Fix disclosure** — label inferred votes distinctly from recorded divisions; do not present both identically |
| My Campaign (`CampaignModal`) | Yes, real — the only page that can currently open it | **Promote**, don't remove — this is the real mechanism the standalone `/campaigns` page should point to, not compete with |
| How Parliament Works (education accordion) | N/A — static civics content, correctly collapsed by default | **Keep**, but de-duplicate — the same content is independently rebuilt on People |

## Forecasts

| Tab/mode | Real? | Verdict |
|---|---|---|
| All Forecasts / Bills / Elections / MP Votes / Civic (category filters) | Bills real; Elections/MP Votes/Civic permanently `status: 'demo'` by design | **Keep the filter mechanism**; ensure demo categories are visually and textually distinct from real ones at all times, not just on hover/detail |
| Proposed / Active / Resolved / All (status filters) | Real, where the underlying market is real | **Keep** |
| Featured forecast | Real (once sourced from the same path as the board — currently `FeaturedMarketCard` has an *independent* demo-market path, a genuine duplication defect) | **Fix the data source**, not the pattern — unify on `market-eligibility.ts` |
| Wallet controls (balance, positions, toggle) | Real (`usePredictionWallet`) on this page specifically, but a second, unsynced `useWallet` (localStorage) feeds the same concept elsewhere | **Move to Account**; retire the duplicate wallet system in the same batch, not after |
| Proposal flow (`ProposeMarketModal`, "+Propose") | Not real — never persists past `localStorage` despite a "Pending Review" badge | **Remove** until a real backend exists |
| Leaderboard (embedded slot) | Not real — same hardcoded array duplicated at `/leaderboard` (both now show an honest empty state post-Batch-1) | **Do not reinstate** without one real, single-sourced ranking query |
| Election pulse (embedded widget) | Real, but permanently mounted regardless of relevance | **Gate on `useLiveElection().active`**, same fix as Government's toggle |

## People

| Tab/mode | Real? | Verdict |
|---|---|---|
| House / Senate / Current Chamber (chamber view) | Real, but duplicates Government's own chamber view | **Replace with a static composition strip** on People; keep the full interactive version on Government only |
| Live Election Results | Real, same over-exposure issue as Government/Forecasts | **Gate on activity**, same fix pattern |
| How They Voted | Same party-line-inference disclosure gap as Government's version | **Fix disclosure**, shared finding — fix once, applies everywhere `getMPVoteForBill()` renders |
| My Campaign | Not present on People today — the real mechanism only opens from Parliament | **Add a link**, don't rebuild — People should link to the one real `CampaignModal`, not get a second implementation |
| Party filters | Real — filters the real MP directory | **Keep** |
| Sort by party/name | Real | **Keep** |
| MP detail side panel (on the chamber map) | Real MP identity; previously showed `generateScores()` Approval/Trust bars (removed, Batch 8) | **Keep**, now truthful; confirm no regression reintroduces the removed score block |
| MP directory | Real, correctly linked to `/mp/[id]` since Batch 2.5 | **Keep as the page's primary content**, promoted above the chamber/education blocks |
| Profile link | Real, working | **Keep** |

## Cross-cutting tab/mode findings

1. **The same real mechanism (chamber House/Senate/Current/Live toggle, "How They Voted," Live Election) is implemented independently on two pages (Government and People)** rather than built once and referenced twice. This is a maintenance and consistency risk beyond the specific truthfulness findings above — a fix to one copy (e.g. the party-line-inference disclosure) does not automatically reach the other, as already demonstrated by Batch 8's `HouseChamber.tsx` fix reaching both pages only because they share the same component, while a future divergent fix would not.
2. **No page currently gates the Live Election toggle/widget on whether an election is actually live** — it is offered as a permanent option on Government, Forecasts, and People alike, three separate maintenance surfaces for what should be one contextual banner with one on/off signal (`useLiveElection().active`, already computed, simply unused for this purpose).
3. **"My Campaign" exists as a real, working mode on exactly one page (Parliament)** despite being conceptually relevant on Issues and People too — see `CIVIC_ACTION_MODEL.md` for the fix (promote the mechanism, don't duplicate the modal).
4. **Two structurally identical "predict how each MP voted" affordances existed** (Issues' `MPVoteGrid` mini-game, now-removed fabricated badges) — the real "Predict" column (user picks, not ground truth) remains correctly on Issues' vote grid only; no duplicate exists elsewhere. No further action needed here beyond what Batch 8 already did.
