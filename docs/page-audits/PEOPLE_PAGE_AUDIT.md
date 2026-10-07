# People (`/leaders`, nav label "People") — Page Audit

Governed by [`AGENTS.md`](../../AGENTS.md). Verified against `src/app/leaders/page.tsx`, `mp/[id]/page.tsx`, `HouseChamber.tsx`, `MPActionStrip.tsx` as cited in `PEOPLE_TRUTHFULNESS_BATCH_REPORT.md` (implemented, Batch 2.5) and `STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md` (implemented). This is the page with the most truthfulness work already landed of any core page — audited here for what's genuinely left.

## Is this a chamber visualisation, an MP directory, a civics explainer, a voting-record tool, a local-rep finder, or too many things at once?

**Still too many things, but no longer fake ones.** Post-Batch-2.5, `/leaders` is: a chamber visualisation block, a civics-education accordion, an MP directory (real, correctly linked to `/mp/[id]` as of that batch), and a community-nominated-leaders section — four blocks, two of which (chamber, education) duplicate Government/Parliament's own content rather than People's actual job. The voting-record tool and local-rep finder are **not** on this page at all — the "find my MP" electorate tool lives on Parliament (`MPActionStrip`), and it does not link back here.

## Truthfulness classification of key elements

| Element | Classification | Basis |
|---|---|---|
| MP directory rows (name, party, electorate) | **Verified fact** | Real `members` sync, correctly linked to `/mp/[id]` since Batch 2.5 |
| MP directory hero count + source line | **Verified fact** | Already the best-executed header pattern in the app — `CORE_PAGE_REDESIGN.md` names it the template every other page's header should copy |
| `HouseChamber.tsx`'s `generateScores()` Approval/Trust bars | **Removed as of Batch 8** | Confirmed deleted — was a hash of the MP's own id string |
| `POLITICIAN_SCORECARDS` (formerly on `/leaders`, now `/impact`) | **Removed from People as of Batch 2.5**; still live on `/impact` | See `SECONDARY_PAGES_AUDIT.md`#impact |
| "Rising Leaders" fictional politician block | **Removed as of Batch 2.5** | Neutralized to a truthful notice |
| Community-nominated leader profiles (`/leaders/[id]`) | **Demo content, labeled** | Batch 2.5 converted fictional nominee profiles to a truthful notice; support-pledge writes (`leader_supports`) are real |
| MP profile "voting analysis" | **No verified data available, correctly stated** | "Being verified against the real parliamentary record" — honest placeholder, real `member_votes` data exists and is unused here |
| "How Parliament works" explainer (appears on both People and Government) | **Sourced analysis**, duplicated | Same civics content, built independently twice (`leaders/page.tsx:216-241` vs. Parliament's `EducationAccordion`) |

## OUTPUT PER PAGE

**PAGE:** People
**ROUTE:** `/leaders` (target `/people`)
**CURRENT PURPOSE:** MP directory + chamber visualisation + civics explainer + community-nominated leaders, in that scroll order.
**PROPOSED PURPOSE:** Who represents Australians, and what have they done — directory first.
**SINGLE QUESTION:** Who represents Australians, and what have they done?
**PRIMARY USER:** Someone finding their own MP, or checking a specific MP's record.
**FIRST 30 SECONDS:** Currently scrolls past a chamber map and an education card before reaching the directory — the page's actual job is two blocks down.
**WHAT IS ESSENTIAL:** Total MP count + source/sync-date; sort/filter/search directory; each row linked to a real profile (all three already correct).
**WHAT IS OPTIONAL:** Party-composition summary (a static strip is enough; the interactive chamber map is not needed twice in the app).
**WHAT IS DUPLICATED ELSEWHERE:** Full interactive chamber visualisation (duplicates Government/Parliament, `leaders/page.tsx:308-321` reuses `HouseChamber`/`SenateView`); civics-education content (duplicated independently, not shared).
**WHAT BELONGS ON A DETAIL PAGE INSTEAD:** Nothing currently misplaced in this direction — MP profile content is correctly on `/mp/[id]`.
**WHAT SHOULD BECOME CONTEXTUAL:** The electorate "find my MP" tool — currently lives on the wrong page (Parliament) with no link back to the profile it resolves; belongs on People.
**WHAT SHOULD BE REMOVED:** The full interactive chamber map (→ static composition strip); the independently-duplicated education accordion (→ one shared component, or a link to Government's copy).
**WHAT SHOULD NEVER APPEAR:** Any computed per-MP score/grade without satisfying `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` in full (the retired `generateScores()`/`POLITICIAN_SCORECARDS` pattern, under any name); a community-nominated leader shown without a persistent "community-submitted, unverified" label.
**FAKE/UNSUPPORTED:** None currently live on this page — the two live fabricated-score systems that touched People (`generateScores()`, and `POLITICIAN_SCORECARDS` via `/leaders`) are both removed. **[fresh finding]** `MPVoteGrid`'s and `HouseChamber`'s underlying party-line vote *inference* (`mock-parliament-data.ts`'s `getMPVoteForBill()`) still feeds this page's chamber view without disclosure — same defect class as the fixed items, not yet addressed (see `GOVERNMENT_PAGE_AUDIT.md`).
**WHAT IS GENUINELY REAL AND WORTH PRESERVING:** The directory itself (sort/filter/search/pagination, already well-built); the hero header pattern; the real community-leader support-pledge write path (`leader_supports`).
**DEAD/DECORATIVE CONTROLS:** None found on the directory itself (the MP-row dead-click bug from before Batch 2.5 is confirmed fixed).
**PRIMARY ACTION:** Find and open your MP's (or another MP's) profile.
**SECONDARY ACTIONS:** Filter by party; browse community-nominated leaders (pending an owner decision on whether that section stays visible — see below).
**EMPTY STATE:** Already correct — "being verified" pattern used consistently.
**MOBILE PRIORITIES:** Removing the chamber-map block substantially reduces mobile scroll length; directory itself is already responsive.
**CANONICAL DATA SOURCE:** `members`/`member_votes` (MPs); `leader_supports` + `mock-leaders-data.ts` (community leaders, by design, clearly labeled).
**REQUIRED SHARED COMPONENTS:** `StatHeader` (already correct here); directory sort/filter chips (already correct); a static party-composition strip (new, small — replaces the full chamber embed).
**RESPONSIBILITY MAP NEEDS:** Each MP row/profile should carry a one-line "what an MP can/can't do" role note distinguishing them from a Minister — see `RESPONSIBILITY_MAP_SPEC.md`#mp.
**CIVIC ACTION NEEDS:** "Contact this MP" via the real mechanism, and the electorate tool relocated here with a working link to the resolved MP's profile.
**LEGAL / EDITORIAL / POLICY RISKS:** Low, post-Batch-2.5 — the remaining risk is the undisclosed party-line vote inference feeding the chamber view (shared with Government, see that audit).
**SMALLEST SAFE FIX:** Move the electorate tool here with a working profile link; replace the full chamber embed with a static composition strip; de-duplicate the civics accordion to one shared instance.
**IDEAL V1 STRUCTURE:** Per `CORE_PAGE_REDESIGN.md`#People — hero → electorate tool → directory → static composition strip → community leaders (clearly, permanently distinguished).
**IMPLEMENTATION PRIORITY:** P1 — no live fabrication, but real duplication and a broken cross-page link (electorate tool → no profile link) remain.
**OWNER DECISIONS:** Whether community-nominated leaders remain visible on this page at all pending the broader Community-feature legal review (`STICKEE_V1_EXECUTIVE_SUMMARY.md` Disagreement D2/C5 — reactivating real-person nomination/scoring infrastructure is a *different*, not lesser, legal question than the fictional-profile version already once disabled); note this is about the *existing, already-shipped* section, not new Community scope — those are related but separate decisions.

## Council review (Level 2 — People; reuses Council findings, no new agent run needed given full Level 3 coverage already exists)

```
Public Policy:         Approved — MPs correctly kept separate from "Government" as an institutional-accuracy matter (Consensus C9, already ratified)
Data & Evidence:       Approved with conditions — real member_votes should be wired into the profile now that the fabricated placeholder is gone (a real-data opportunity, not a defect)
UX:                    Approved with changes — chamber/education duplication confirmed, directory-first restructure recommended
Legal and Regulatory:  Requires professional legal review — specifically and only for the community-leader section's future scope (D2/C5), not for the MP-directory content, which carries no such risk

Overall recommendation: Merge the directory-first restructure and electorate-tool relocation now; leave the community-leader section exactly as currently shipped (already labeled, already legally reviewed as low-risk in its current fictional/labeled form) pending the separate Community-feature decision.
```
