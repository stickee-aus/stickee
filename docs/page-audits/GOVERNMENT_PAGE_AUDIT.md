# Government (`/parliament`, nav label "Government") — Page Audit

Governed by [`AGENTS.md`](../../AGENTS.md). This is Stickee's most-corroborated single defect across every prior audit generation — see Consensus C1 in `STICKEE_V1_EXECUTIVE_SUMMARY.md`, independently raised by six of twelve Council agents. Verified against `parliament/page.tsx`, `ParliamentExperienceClient.tsx`, `HouseChamber.tsx`, `src/lib/navigation.ts` as of 2026-08-07.

## What "Government" currently means, and the fix already shipped

As of `STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md` (confirmed live in `src/lib/navigation.ts`), the primary-nav item labeled "Government" points at `/parliament` — the real, Supabase-backed parliamentary record — not `/decisions` (100% mock). This was the single highest-priority fix identified across every Council review to date, and it is done. What remains is everything Generation 1/2 already found about `/parliament` itself: real chamber/vote data undermined by fabricated header stats and a duplicated bill list.

**Does the page correctly explain executive government vs. Parliament?** No — not yet. `/parliament` today is entirely a legislative/chamber page; it has no executive-action section at all (no ministerial decisions, announcements, or department attribution rendered anywhere). Per the Public Policy Advisor's Council finding (`STICKEE_V1_PRODUCT_BLUEPRINT.md` §7), "Government" nesting Parliament under one banner is only institutionally sound *if* the page carries an explicit internal split between executive action and legislative record — today it doesn't have executive content to split from, which is a content gap (Batch 9/11), not a mislabeling.

## Truthfulness classification of key elements

| Element | Classification | Basis |
|---|---|---|
| Chamber composition (House/Senate seat map) | **Verified fact** | Real TheyVoteForYou sync, `members` table |
| Real MP vote totals, bill status | **Verified fact** | `divisions`/`member_votes`, real sync |
| Four header stat tiles (incl. "74% Predict Acc.") | **Hardcoded** | Literal strings, not computed from the data rendered below them (`parliament/page.tsx:38-53`) — "74% Predict Acc." directly contradicts Forecasts' own honest "not available yet" disclosure three clicks away (`STICKEE_V1_EXECUTIVE_SUMMARY.md` C8) |
| `PriorityBillFocus` module | **Verified fact** | Independently rated the strongest single-task pattern in the whole review — real data, real framing |
| Bill feed / active-bills list | **Verified fact** with mock fallback | Real Supabase-first, same underlying concept as Issues' list — duplicated, not fake |
| `generateScores()` Approval/Trust bars | **Removed as of Batch 8** | Was a hash of the MP's own id string, presented as "Approval"/"Trust" — confirmed deleted, not reachable on this page any longer |
| `mock-parliament-data.ts`'s `getMPVoteForBill()` party-line inference (via `HouseChamber`'s "How They Voted" mode, `MPActionStrip`'s alignment %) | **Inferred fallback, presented as fact** | Falls back to `bill.parties[mp.party].direction` when no per-MP override exists, shown to the reader as "real votes on laws" with no disclosure of the inference (`STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md` §3, "found but out of scope" — still live, not yet fixed) |
| "How Parliament works" explainer | **Sourced analysis** (civics content, uncontested) | Correctly collapsed by default |

## OUTPUT PER PAGE

**PAGE:** Government
**ROUTE:** `/parliament` (target `/government/parliament`)
**CURRENT PURPOSE:** Priority-bill spotlight + independently-filterable bill feed + "your rep" strip + chamber visualisation + civics explainer, with four hardcoded header stats.
**PROPOSED PURPOSE:** The evidence layer behind Issues — real chamber composition, real votes, real campaign actions, one real hero stat.
**SINGLE QUESTION:** What has government actually done?
**PRIMARY USER:** Someone verifying a specific claim about what government/Parliament did, or checking current parliamentary activity.
**FIRST 30 SECONDS:** Sees four stat tiles (one internally contradicts another real page), then the priority-bill module (the actual strongest content on the page).
**WHAT IS ESSENTIAL:** One real hero stat; today's priority item; chamber/vote evidence; your MP's role.
**WHAT IS OPTIONAL:** The civics explainer (correctly already collapsed).
**WHAT IS DUPLICATED ELSEWHERE:** The entire bill feed (duplicates Issues, different components, same concept — `ParliamentExperienceClient.tsx:202-256`).
**WHAT BELONGS ON A DETAIL PAGE INSTEAD:** Nothing — Parliament's real content (chamber, votes) is correctly page-level, not detail-level; it's Issues' embedded widgets that belong here as links, not the reverse.
**WHAT SHOULD BECOME CONTEXTUAL:** Nothing currently misplaced in this direction.
**WHAT SHOULD BE REMOVED:** The four hardcoded header stats (`parliament/page.tsx:38-53`), especially "74% Predict Acc."; the independently-filterable bill list (link to Issues instead).
**WHAT SHOULD NEVER APPEAR:** A hardcoded, non-computed stat of any kind; a full bill list competing with Issues' canonical one; a Bill-typed item filed as a "government decision" without noting it's still in the legislature (Public Policy Advisor's Bill-vs-executive-action distinction).
**FAKE/UNSUPPORTED:** The four header stats; the party-line vote inference presented without disclosure (see table) — the next-most-consequential truthfulness gap in this surface area, not yet fixed.
**WHAT IS GENUINELY REAL AND WORTH PRESERVING:** Chamber composition, real vote totals, `PriorityBillFocus` (verbatim — "the strongest single-task pattern found across this whole review," `CORE_PAGE_REDESIGN.md`), the real `CampaignModal` bill-pressure action (the only page that can currently open it).
**DEAD/DECORATIVE CONTROLS:** `MPActionStrip`'s electorate-lookup result renders **zero link** to the MP's own profile (`docs/architecture/STICKEE_SYSTEM_ARCHITECTURE.md` System 11; confirmed no `Link`/`href` to `/mp/[id]` in the file) — a genuine dead end on the page's own "find your rep" feature.
**PRIMARY ACTION:** Understand today's most important government/parliamentary activity (read the priority module).
**SECONDARY ACTIONS:** Find your rep (and now actually reach their profile — currently broken); explore the chamber; take real bill-pressure action.
**EMPTY STATE:** If no real executive-decision content exists for a level (federal/state/local), say so — never substitute `mock-government-data.ts`.
**MOBILE PRIORITIES:** Once the bill feed is removed, the remaining four blocks (priority, your rep, chamber, education) should become anchor-linked jump navigation rather than one long scroll.
**CANONICAL DATA SOURCE:** `members`, `divisions`, `member_votes` (Government Record System) — never `mock-parliament-data.ts`'s inference path presented as fact.
**REQUIRED SHARED COMPONENTS:** `StatHeader` (one computed number, not four literals), `UnderlineFilter` (House/Senate/Current-Live toggle — already correct).
**RESPONSIBILITY MAP NEEDS:** This page *is* the natural home of the Responsibility Map's institutional-register content (Executive/Legislature/Committee/Department roles) — see `RESPONSIBILITY_MAP_SPEC.md`.
**CIVIC ACTION NEEDS:** "Contact your MP" and "add pressure to this bill" should route through the single real `bill_pressures`/`CampaignModal` mechanism — already true here, uniquely on this page; this should become the template other pages link to, not a Parliament-exclusive feature.
**LEGAL / EDITORIAL / POLICY RISKS:** The party-line vote inference presented as real recorded votes is an institutional-accuracy risk (Public Policy Advisor) independent of the hardcoded-stats fix — a reader could reasonably believe every "how they voted" cell is a recorded division when some are inferred.
**SMALLEST SAFE FIX:** Remove or compute the four header stats; add the missing MP-profile link to `MPActionStrip`'s result. Both are presentation-only, zero schema change, same risk class as Batch 1/8.
**IDEAL V1 STRUCTURE:** Per `CORE_PAGE_REDESIGN.md`#Government — hero (one real number) → explicit executive/legislature split → priority item → your rep → chamber → collapsed education.
**IMPLEMENTATION PRIORITY:** P0 — tied with Issues for highest priority; the hardcoded-stats fix specifically is one of the smallest, highest-corroboration fixes in the whole audit (six independent agents flagged it) and has zero dependency on any other decision.
**OWNER DECISIONS:** Whether real executive-decision/minister-attribution content is built at all for V1 (a genuine, not-yet-scoped content-modeling gap, distinct from the bill-list/stats fixes); confirm the MP canonical-ID mapping plan before wiring `getMPVoteForBill()`'s real-vote mode fully (Batch 4/13).

## Council review (Level 3 — reuses `STICKEE_V1_EXECUTIVE_SUMMARY.md`'s Consensus C1, C8, C4)

```
Public Policy:        Approved with conditions — institutional split (executive vs. legislature) required before "Government" as a nav umbrella is fully accurate; currently accurate by omission (no executive content to mislabel), not by design
Editorial:            Blocked (as currently unsourced/hardcoded) — the four header stats, independent of the (already-fixed) nav-destination issue
Data & Evidence:      Blocked — party-line vote inference presented without disclosure
UX Journey/Bottleneck: Blocking friction (pre-Batch-8: nav destination) → now Significant friction (header stats, dead MP-profile link)
Historian:            Approved with conditions — no historical-record risk found on this page specifically

Overall recommendation: Merge the header-stat and MP-link fixes now (no dependency); the executive/legislature content split is a real build item requiring owner scoping, not a blocker to the immediate fix.
```
