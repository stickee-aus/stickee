# Stickee — People Truthfulness Batch Report

A tightly scoped truthfulness pass on `/leaders`, `/mp/[id]`, and `/leaders/[id]`, landing before the larger Issues/Decisions consolidation. No routes were renamed, no database migrations changed, no new approval/polling/scoring system was built. This report's evidence table (§1) is based on reading the current code directly, not the historical audit docs alone — several findings in `docs/audits/DATA_AND_CONTENT_AUDIT.md` and `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` had already been partially fixed by an earlier, separate remediation pass (`docs/audits/IMPLEMENTATION_BATCH_1_REPORT.md`, not to be confused with this project's `PAGE_REFACTOR_BATCH_1_REPORT.md`); this batch fixes what was still actually live.

---

## 1. Evidence table — every visible field, classified

### `/leaders`

| Field | Classification | Action |
|---|---|---|
| House/Senate member names, party, electorate (chamber view + directory) | **Verified** — `useLiveParliamentMembers()`, TheyVoteForYou live feed or synced `members` table | **Kept**, with source + sync-date line already shown |
| "Source: TheyVoteForYou live feed · [date]" | **Verified** — real attribution | **Kept** |
| Live Election Results toggle + "Official source: AEC · Updated [time]" | **Verified** — real AEC integration | **Kept** |
| "How Parliament works" explainer | **Generic civic-education copy**, not a claim about any person/data | **Kept** |
| Civic Analysis block: civic score number + A–F grade + pillar dots + quoted "rationale" for 5 named real MPs (`POLITICIAN_SCORECARDS`) | **Unsupported/mock** — no source, no methodology, free-text rationale with no citation column even in the schema; used an id scheme (`mp-albanese`, `mp-dutton`, …) incompatible with the real MP directory | **Removed** |
| Community approval % (`FeaturedMPCard` and every `MPRow`, all ~150 real MPs) | **Generated, disguised as real** — `communityApprovalPct()` is a deterministic hash of the MP's id string, code-commented *"seeded... so the community approval feels real"*. Zero stored user interactions anywhere; no `approval`/`rating` table exists in any migration | **Removed** |
| Approve/disapprove thumbs buttons | **Unsupported** — writes to `localStorage` only, not authenticated, not tied to any real account | **Removed** |
| "Your approvals" header stat | **Local, unauthenticated** — rendered unconditionally regardless of sign-in state | **Removed** |
| Sort-by-"Approval" | Sorted by the removed fake metric | **Removed** (Party/Name sort kept) |
| "Consistency" column header | **Not even wired to a value** — header existed with no corresponding data cell, and the footer defined it as "voting with majority" with no real computation anywhere on this page | **Removed** |
| Footer line "Consistency = voting with majority · Approval = community rating" | Restated both removed/never-real claims as if definitional | **Removed** |
| "Rising Leaders · Community Nominated" section (10 profiles: Sara Patel, Marcus Webb, etc.) | **Fully fictional** — `mock-leaders-data.ts` contains fabricated names, fabricated social-handle "endorsement" quotes, fabricated supporter counts, and a `computeCredibility()` score derived entirely from the same fabricated data | **Hidden from `/leaders`** |
| "+ Nominate" button | **Not implemented end-to-end** — `NominationModal.handleSubmit()` shows a toast and closes; no API call, no persistence anywhere | **Removed** |
| MP directory row click | Previously highlighted a chamber seat only (House tab); did nothing on Senate tab; **no link to the MP's own profile existed anywhere on this page** | **Fixed** — each row now links to `/mp/{id}` |

### `/mp/[id]`

| Field | Classification | Action |
|---|---|---|
| MP name, electorate, party (`MPIndex`) | **Hardcoded reference data, factually accurate at time of writing** — a static 150-MP snapshot, not live-synced, but not fabricated either | **Kept** (data-freshness is a separate concern from truthfulness; live-syncing this identity data is Batch 4 work) |
| "Individual voting analysis is being verified." | **Honest placeholder**, already fixed in a prior remediation pass | **Kept** |
| "Voting History ({n} recorded votes)" list, yes/no/abstain per issue | **Fabricated, presented as real** — `getVotesForMP()` reads `PARTY_VOTE_MAP`, which assigns **every MP of a given party the identical vote** on ~5 illustrative mock issues. Two MPs from the same party always show identical "recorded votes" regardless of how they actually voted. The prior remediation pass removed the *score* built from this data but left the underlying fabricated vote list rendering as if it were this specific MP's real record | **Removed**, replaced with an honest "being verified against the real parliamentary record" placeholder |
| "Rehearse [MP]'s voting stance" (Simulator) | **Real, clearly-labeled interactive tool**, not a factual data claim | **Kept**, out of scope |

### `/leaders/[id]`

| Field | Classification | Action |
|---|---|---|
| Entire page (name, bio, "Credibility Score", endorsements, concerns, supporter counts, readiness/pathway labels) | **Fully fictional** — same `mock-leaders-data.ts` entries as the Rising Leaders section, presented with an elaborate, plausible-sounding bio, fake source handles (`@planning_prof_UTS`, `@civic_user_81`, etc.) and fake quotes that could easily be mistaken for a real person | **Route neutralized** — see §3 |
| "Support This Leader" (`POST /api/leaders/[id]/support`) | **Genuinely real** — authenticated, writes to a real `leader_supports` Supabase table with a unique constraint | **Made unreachable from the UI** (route/API left in place — see §8) |

---

## 2. Verified data retained

Nothing genuine was removed. Specifically kept, unchanged in substance:

- Real House/Senate membership, party, electorate, chamber placement (`/leaders`, sourced from `useLiveParliamentMembers`).
- Source attribution and sync date ("TheyVoteForYou live feed · [date]").
- Live AEC election results toggle and its own disclosure text.
- Real MP identity fields on `/mp/[id]` (name, electorate, party).
- The honest "Individual voting analysis is being verified" placeholder (a prior, separate fix — confirmed still present, not reintroduced).
- `TheyVoteForYou` sync routes (`/api/sync/members`, `/api/sync/divisions`) — untouched, still real.
- The Simulator's "rehearse this MP's stance" tool — real, correctly labeled as a scenario tool, not a data claim.

## 3. Mock and unsupported content removed

- `/leaders`: the entire "Civic Analysis · Key Politicians" scorecard block (civic score, letter grade, pillar dots, unsourced quote) for 5 named real MPs.
- `/leaders`: the entire fake community-approval system — percentages, thumbs up/down controls, "Your approvals," sort-by-approval, and the "Consistency"/"community rating" claims in the column headers and footer.
- `/leaders`: the "Rising Leaders" section (10 fictional community-nominee profiles) and the "+ Nominate" button.
- `/mp/[id]`: the fabricated per-party "Voting History" list, which assigned every MP of a party the same vote on a handful of mock issues and presented it as that MP's real recorded votes.
- `/leaders/[id]`: the entire fictional-profile page (bio, credibility score, endorsements, supporter counts) — no longer rendered for any id.

Nothing was replaced with a different invented number — every removal became either a neutral message, a real link, or simply absent, per the task's explicit instruction not to invent a replacement metric.

## 4. Approval-system findings

`useApproval()` (`src/hooks/useApproval.ts`) has no backing authentication, no database table, and its "community" percentage (`communityApprovalPct`) is a **deterministic hash of the MP's id string** — not sampled, not aggregated, not real in any sense, and explicitly code-commented as designed to *"feel real"*. No `approval`/`rating` table exists in any Supabase migration. This does not meet the bar the task set ("prove its source and authenticated-user behaviour before preserving it") by a wide margin, so it was removed in full rather than partially kept. The hook file itself is left in place, unused, rather than deleted — consistent with `PAGE_REFACTOR_BATCH_1_REPORT.md`'s precedent of leaving orphaned components for a later cleanup batch.

## 5. Rising Leaders findings

**No longer publicly visible.** The section is removed from `/leaders`, and `/leaders/[id]` now shows a truthful "not available yet" notice for every id instead of rendering fictional profiles (see §3 of `PAGE_AND_ROUTE_INVENTORY.md`'s original finding that these were already known-fictional). `generateStaticParams()` now returns `[]`, so the build no longer prerenders any fictional leader page — confirmed by the build output before/after (8 static `/leaders/[id]` paths generated before this batch, `0` after).

The underlying feature (`LeaderProfileDetail.tsx`, `NominationModal.tsx`, `mock-leaders-data.ts`, the real `leader_supports` write path) is **not deleted** — per the task's instruction not to remove the feature if future use is intended.

**Recommendation for a future product decision:** if this becomes real, it should launch as a clearly separate product from elected MPs — something like **"Community voices"** or **"Emerging leaders"** — with:
1. Real nominees who have given real, verifiable consent (the current `consentGiven`/`moderationStatus` fields are the right shape, just never backed by a real moderation queue or real people).
2. A real moderation pipeline behind the "+ Nominate" flow (currently a client-side form with no submission endpoint at all).
3. Visual and navigational separation from `/leaders`' MP directory strong enough that no reasonable user could mistake a nominee for a sitting MP — the current shared route namespace (`/leaders/[id]` for both real-MP-adjacent content and fictional nominees) is part of what made this confusing in the first place.
4. A real credibility/endorsement methodology if any score is kept, with the same rigor `MP_SCORE_METHODOLOGY_REQUIREMENTS.md` demands for MPs — not a formula computed from the nomination form's own unverified free text.

## 6. Canonical representative-route findings

**`/mp/[id]` is the canonical, working real-MP detail route.** `/people/[id]` does not exist anywhere in the codebase (confirmed by search — it's only a *proposed* future path in `PROPOSED_ROUTE_TREE.md`, not implemented). Per the audit docs, `/leaders`' MP directory previously had **no links at all** to `/mp/[id]` — clicking a row only highlighted a chamber seat (House tab) or did nothing (Senate tab). This batch fixes that: every row in the representative directory now links to `/mp/{id}`, both via the MP's name and a small "Profile →" affordance, while preserving the existing (real) chamber-highlight interaction on the House tab. No route was renamed.

## 7. Files changed

```
src/app/leaders/page.tsx          major rewrite — removed scorecards, fake approval, Rising Leaders;
                                   added canonical /mp/[id] links to every row
src/app/leaders/[id]/page.tsx     replaced fictional-profile rendering with a truthful "not available" notice;
                                   generateStaticParams() now returns []
src/app/leaders/loading.tsx       skeleton simplified to match the new, simpler header (no 3-stat row)
src/app/mp/[id]/page.tsx          removed the fabricated per-party "Voting History" list;
                                   replaced with an honest placeholder
src/lib/__tests__/people-truthfulness.test.ts   new — 23 regression tests (see §9)
```

Not modified: `src/hooks/useApproval.ts`, `src/lib/mock-leaders-data.ts`, `src/components/LeaderProfileDetail.tsx`, `src/components/NominationModal.tsx`, `src/lib/mock-civic-data.ts` (`POLITICIAN_SCORECARDS` — still used by `/impact`'s `CivicScorecard` and `IssueAccordion`, both out of this batch's scope; only `/leaders`' *use* of it was removed, not the underlying data or the components that render it elsewhere), `src/lib/mock-data.ts` (`calculateStickeeScore`, `getVotesForMP`, `PARTY_VOTE_MAP` — preserved per `MP_SCORE_METHODOLOGY_REQUIREMENTS.md`'s instruction not to delete the code path, only gate its display), `src/app/api/leaders/[id]/support/route.ts` (real write path, left intact — see §8).

## 8. Tests

**Authored and executed** — `src/lib/__tests__/people-truthfulness.test.ts`, 23 tests, following the repo's established source-string regression pattern:
- Unsupported score/grade labels (`POLITICIAN_SCORECARDS`, `civicScore`, `scoreToGrade`, "Consistency") are absent from `/leaders`.
- Fake community-approval percentages, approve/disapprove controls, and "Your approvals" are absent — including a check that no per-user state (`ratings[...]`) remains at all, so there's nothing to leak for signed-out visitors.
- Rising Leaders / nomination UI is absent from `/leaders`.
- `/leaders/[id]` no longer imports fictional nominee data or `LeaderProfileDetail`, shows "Not available yet", and `generateStaticParams()` returns `[]`.
- `/mp/[id]` still renders `mp.name`/`mp.electorate`/`mp.party` and the honest score placeholder; no longer imports `getVotesForMP`/the fabricated vote list.
- `/leaders` MP rows link to `/mp/{id}` (canonical route).
- Genuinely verified data (TVFY source line, AEC disclosure text, sync routes) is confirmed still present, and the underlying scoring/leader code is confirmed preserved (not deleted) for future use.

**Commands run:**
- `npx tsc --noEmit` — clean.
- `npx vitest run` — **103/103 tests pass** (7 pre-existing `mp-score-copy`, 14 pre-existing `market-eligibility`, 23 Batch-1 page-refactor, 36 Batch-2 navigation, 23 new this batch).
- `npm run build` — production build succeeds, 46 routes generate (down from 54 — the 8 statically-prerendered fictional `/leaders/[id]` paths are gone, confirming the fix took effect structurally, not just in source).
- `node scripts/secret-scan.mjs` — no suspicious patterns found.

No manual browser testing was performed — recommend a manual pass on `/leaders` (both chamber tabs, party filter, sort, row → profile navigation), `/mp/[id]` for a few different MPs, and `/leaders/[id]` with both a real-looking and an arbitrary id (both should show the same honest notice).

## 9. Unresolved People-domain decisions

- **Rising Leaders / community nominees**: needs an explicit product decision (build it for real, or retire it) — see §5's recommendation. Not resolved in this batch.
- **`leader_supports` real data now orphaned from any UI entry point.** The API route and table are real and untouched, but with `/leaders/[id]` neutralized there's no way to reach them from the product. Left as-is (route removal/migration changes are both out of this batch's rules) — flagged for whoever picks up the Rising Leaders decision.
- **`getVotesForMP`/`PARTY_VOTE_MAP` and `calculateStickeeScore` remain in `mock-data.ts`, unused by any page now** (the `/issue/[id]` page's `MPVoteGrid` component still uses the same underlying `votes`/`PARTY_VOTE_MAP` data independently — that page was out of this batch's explicit scope and was not touched, but it has the same underlying fabrication problem this batch just fixed on `/mp/[id]`). **Flagged, not fixed**: `/issue/[id]`'s MP vote grid should get the same treatment in a future batch.
- **Wiring `/mp/[id]`'s Voting History to real `member_votes`/`divisions` data** is real, valuable follow-up work — the data exists and is already synced — but requires the MP id-scheme reconciliation `PAGE_REFACTOR_ROADMAP.md` already scopes to Batch 4, plus real-database verification per `AGENTS.md`. Not attempted here.
- **`POLITICIAN_SCORECARDS`/`CivicScorecard` on `/impact`** has the same "unsourced score for named real politicians" shape as the block just removed from `/leaders`, but `/impact` was out of this batch's explicit page list. Flagged for a follow-up truthfulness pass on `/impact`.

## 10. Production safety

No database, migration, or deployment operations were performed. No files were staged, committed, pushed, or deployed. All changes are local, uncommitted working-tree edits.
