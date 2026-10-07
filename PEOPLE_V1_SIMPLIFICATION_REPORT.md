# People V1 — Directory, Representation, and Accountability Simplification Report

Governed by [`AGENTS.md`](AGENTS.md) and [`docs/philosophy/STICKEE_CHARTER.md`](docs/philosophy/STICKEE_CHARTER.md) — the third Charter-governed implementation batch, following `ISSUES_V1_SIMPLIFICATION_REPORT.md` and `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`. Scope: `/leaders` (nav label "People"), `/mp/[id]`, and the minimum fixes required to stop the directory from linking to representative profiles that don't exist. No other core page was touched. Nothing was staged, committed, pushed, or deployed. Production was not accessed.

---

## 1. What People now exists to do

`/leaders` answers: **"Who represents Australians, what are they responsible for, and what have they actually done?"** It is directory-first: a representative finder, a searchable/filterable MP directory, and a lightweight, real composition summary — not a second Parliament page. The full interactive chamber visualisation and live-election toggle (Government/Parliament's own job) were removed from People entirely, replaced with a link to Government for that experience.

## 2. What was removed

| Element | Was | Why |
|---|---|---|
| Embedded `HouseChamber`/`SenateView` interactive chamber map | Full seat-by-seat visualisation before the directory | Duplicated Government/Parliament's own `ChamberSummaryCard`; per `PEOPLE_PAGE_AUDIT.md`, People's job is the directory, not a second chamber tool |
| "Live Election Results" toggle + `LiveResultsExplainer` | Real AEC-sourced toggle, but embedded here as well as (implicitly) belonging to the chamber experience | Same duplication — chamber-mode content belongs to Government, not People |
| Independently-duplicated "How Parliament works" mini-explainer | A second, separately-authored copy of the same civic-education content already on `/parliament` | Duplicated content, not a truthfulness defect — consolidated to a single link to Government's copy |
| No search | — | N/A — this is an addition, not a removal (see §9) |

**Nothing fabricated was found still live** on `/leaders`, `/leaders/[id]`, or `/mp/[id]` — `PEOPLE_TRUTHFULNESS_BATCH_REPORT.md`'s earlier pass (Rising Leaders, fake community approval, `POLITICIAN_SCORECARDS`, the fabricated per-party Voting History list) was confirmed still correctly removed by direct code reading before this batch touched anything.

## 3. Verified information preserved

- Real House/Senate membership, party, electorate (`useLiveParliamentMembers()` — TheyVoteForYou live feed or synced `members` table, falling back to a labeled mock dataset only when neither is available).
- Source attribution and sync date, now rendered via the shared `MetadataLine` primitive instead of a bespoke line.
- Real party composition counts (`countsByParty`, computed server-side in `live-parliament.ts` — genuinely real, not re-derived or approximated by this batch).
- `/mp/[id]`'s real identity fields (name, party, electorate) and its existing honest "being verified" placeholders for voting analysis/history.
- The real `SimulateThisButton` scenario tool on `/mp/[id]` — untouched, out of scope (a labeled interactive tool, not a factual claim).
- The real `leader_supports` write path and `/leaders/[id]`'s existing truthful "Not available yet" notice — confirmed unchanged.

## 4. Representative-lookup findings

`/leaders` previously had **no** "find my representative" tool at all — per `PEOPLE_PAGE_AUDIT.md`, it lived only on Parliament (`MPActionStrip`), with no link back to the profile it resolved. A new `FindYourRepresentative` component (`src/components/FindYourRepresentative.tsx`) now provides this on People, reusing the same `useElectorate` hook already fixed in the Government/Parliament batch — no changes to that hook or to Parliament's own `MPActionStrip` were needed or made.

Per the clarified instructions for this batch: automatic detection is explicitly labeled **approximate** ("Detect (approximate)"), and its result is never auto-applied — it surfaces as a suggestion requiring explicit confirmation ("Yes, that's correct" / "Enter manually") before anyone is shown as "your representative." Manual electorate entry commits immediately, since an exact, user-typed electorate name is unambiguous — the uncertainty was only ever in the geolocation step. No address verification, electoral-roll check, or Digital ID system exists or is implied anywhere in this flow; the component's own comments and copy state this plainly. Building a real verification system is explicitly out of scope for this batch, per instructions.

This does mean People and Parliament now each have their own, independently-rendered representative-lookup UI, sharing only the underlying hook. This was a deliberate choice to avoid touching Parliament's file at all (`MPActionStrip.tsx`) — extracting a fully shared component would have required editing Parliament, which this batch's rules forbid. Flagged in §11 as a future consolidation candidate, not a defect.

## 5. MP-profile findings

`/mp/[id]` was made safe and aligned with People without a full rebuild, per instructions:

- Wrapped in `PageShell`; added a `MetadataLine` disclosing that MP identity data is a static reference snapshot, not yet live-synced to this specific page (matching `PEOPLE_TRUTHFULNESS_BATCH_REPORT.md`'s existing, still-accurate finding).
- Added a generic, role-based "What a Federal MP can and cannot do" block (represents an electorate, votes on legislation, may sit on committees, may ask questions, may introduce a private member's bill; cannot alone pass/block legislation, direct a department, or decide executive policy) — reusing `RESPONSIBILITY_MAP_SPEC.md`'s existing MP-role language, adapted to the exact wording specified for this batch. This is never a per-MP claim, and explicitly states Stickee does not yet verify or display any individual MP's ministerial/shadow portfolio.
- Changed "Individual voting analysis is being verified." → **"Individual voting analysis is not yet available for this representative."**, the exact copy this batch's brief specifies for the canonical-ID gap. No party-level inference was substituted — confirmed `getVotesForMP`/`PARTY_VOTE_MAP` remain unimported here, same as before.
- "Back to Parliament" → "Back to People" (`/leaders`), since People is now the canonical representative surface this profile belongs to.
- No fabricated score, grade, approval, or trust value exists or was added.

## 6. Canonical-ID findings

**A new, previously undocumented defect was found by direct code reading this session: every Senate directory row's "Profile →" link 404s.**

Three id schemes are in play, not two:

1. **`MPIndex`** (`src/lib/mock-data.ts`) — a static, 150-entry **House-only** reference snapshot, ids like `mp-labor-1`. This is what `/mp/[id]/page.tsx` actually looks up.
2. **Live parliament ids** (`src/lib/live-parliament.ts`) — `buildHouseMembers()` reuses a real `MPIndex` id (`mockSeat.id`) *only* when a live row's electorate name string-matches a mock seat; otherwise it synthesises `house-live-${index}`. `buildSenateMembers()` **always** synthesises `senate-${party}-${index}` — there is no mock Senate MP dataset to match against, so a resolvable id is never produced for any senator.
3. **`tvfy-*` ids** (`src/lib/parliament-db.ts`, found in the Government batch) — the real per-member vote data (`member_votes`/`divisions`), disjoint from both of the above.

Net effect confirmed by reading the code (not assumed): every senator's profile link was dead before this batch, and any House member whose live-synced electorate name doesn't exactly match the mock dataset's would be too. This would be live and guaranteed-reproducible in production once Supabase is populated, not just a quirk of this sandboxed mock-fallback environment.

**Fix applied — a guard, not a migration**, per this batch's explicit instruction not to attempt a partial ID migration that can silently mismatch: `isResolvableProfileId(id)` checks `id.startsWith('mp-')`. Directory rows only render as a link (`RecordRow`'s `href`) when resolvable; otherwise the row renders plainly with a `StatusLabel` reading "Profile unavailable" — real identity fields (name, party, electorate) are still shown, just without a link that would fail. This is deterministic, requires no new data plumbing, and cannot silently mismatch (it either resolves via the real `MPIndex` scheme or it doesn't).

**Owner decision required — the real fix:** a genuine MP canonical-ID reconciliation, unifying `MPIndex`'s `mp-*` scheme, the live `house-live-*`/`senate-*` scheme, and the real `tvfy-*` scheme, is required before Senate profiles or individually-matched voting history can ship. This is the same migration already named in `STICKEE_V1_EXECUTIVE_SUMMARY.md` Owner Decision 10 (corroborated there, and in the sequencing list's item 5, with this batch's specific findings) — not a new, separately-scoped project. This batch does not attempt it.

## 7. Responsibility findings

Only the small, generic Federal MP role block described in §5 was added, using the exact bullet content specified for this batch. No portfolio, ministerial, or department responsibility is assigned to any individual MP — none is verified anywhere in the codebase today. The full Responsibility Map (Minister/Department/Committee as real objects) was not built, per instructions; `RESPONSIBILITY_MAP_SPEC.md`'s data-readiness table is unchanged by this batch.

## 8. Community findings

Confirmed, by direct code reading, that the community-nominated leader section is **already fully hidden** from the primary People experience and was not touched:

- `/leaders` (this batch's rewrite) has zero reference to Rising Leaders, nomination, or `mock-leaders-data`.
- `/leaders/[id]` still shows the pre-existing, truthful "Not available yet" notice for every id, with `generateStaticParams()` returning `[]`.
- `LeaderProfileDetail.tsx`, `NominationModal.tsx`, `useApproval.ts`, and `mock-leaders-data.ts`'s `LEADER_INDEX` consumer (`src/app/api/leaders/[id]/support/route.ts`, real but has no UI entry point) are confirmed unchanged, exactly as `PEOPLE_TRUTHFULNESS_BATCH_REPORT.md` left them.

No new real-person nomination or scoring feature was implemented, per instructions. `leaders/layout.tsx`'s metadata copy, which previously promised "community-nominated civic leaders" alongside MPs, was corrected to match what's actually live.

## 9. Files changed

- `src/app/leaders/page.tsx` — full rewrite onto `PageShell`/`PageHeader`/`SectionHeader`/`RecordRow`/`StatusLabel`/`MetadataLine`/`EmptyState`/`UnderlineTabs`/`LinkButton`; removed the embedded chamber + live-election toggle; added search, `FindYourRepresentative`, the resolvable-id guard, and the composition summary.
- `src/app/leaders/loading.tsx` — skeleton simplified to match the new, shorter structure.
- `src/app/leaders/layout.tsx` — metadata description corrected (no longer promises community-nominated leaders).
- `src/app/mp/[id]/page.tsx` — `PageShell`/`MetadataLine`, the generic Responsibility block, the updated canonical-ID-gap copy, and the People back-link. Not a rebuild — avatar, badge, `SimulateThisButton`, and the honest placeholders are otherwise unchanged.
- `src/components/FindYourRepresentative.tsx` — new. People's own representative-lookup UI, reusing `useElectorate` (unchanged).
- `src/lib/__tests__/people-v1-simplification.test.ts` — new, 29 tests.
- `src/lib/__tests__/batch-8-truthfulness.test.ts`, `src/lib/__tests__/mp-score-copy.test.ts`, `src/lib/__tests__/people-truthfulness.test.ts` — 4 pre-existing assertions updated in place: three pinned the exact old placeholder string ("Individual voting analysis is being verified.") this batch was instructed to change; one pinned the unguarded `href={\`/mp/${mp.id}\`}` pattern this batch replaced with the resolvable-id guard. No other pre-existing test needed a change.
- `DESIGN_SYSTEM_MIGRATION_ROADMAP.md`, `STICKEE_V1_EXECUTIVE_SUMMARY.md` — status annotations updated (see §12); both already tracked People/`/leaders`/`/mp/[id]`, so no roadmap entry was fabricated.

No other file was modified. `HouseChamber.tsx`, `SenateView.tsx`, `useLiveElection.ts`, `LiveResultsExplainer.tsx`, `useApproval.ts`, `mock-leaders-data.ts`, `LeaderProfileDetail.tsx`, `NominationModal.tsx`, `EndorsementPanel.tsx`, `src/app/leaders/[id]/page.tsx`, `src/app/api/leaders/[id]/support/route.ts`, and Parliament's `MPActionStrip.tsx`/`ParliamentExperienceClient.tsx` were read for audit purposes only, not changed. None of `HouseChamber`, `SenateView`, `useLiveElection`, or `LiveResultsExplainer` were orphaned by removing them from People — all remain live via `ChamberSummaryCard` (Parliament) or `PredictionsPageClient` (Predictions), confirmed by repo-wide grep before editing.

## 10. Tests and results

```
npx tsc --noEmit               → clean, 0 errors
npx vitest run                 → 313/313 passed (12 files), including the new
                                  people-v1-simplification.test.ts (29/29)
npm run build                  → succeeded (Next.js 16.2.1 / Turbopack), all 46
                                  routes compiled, including /leaders and /mp/[id]
node scripts/secret-scan.mjs   → "no suspicious patterns found in tracked files"
```

The 29 new tests cover: the directory is not chamber-first (no `HouseChamber`/`SenateView`/live-election imports); shared primitives are used; real names/parties/electorates render; a search control exists; Government is linked for full chamber exploration; no fabricated score/grade/approval/trust or Rising Leaders content renders; `FindYourRepresentative` labels detection as approximate and requires confirmation before resolving a representative, with no address/Digital-ID/electoral-roll verification implemented; the resolvable-id guard exists and unresolvable rows show "Profile unavailable" instead of a dead link; `/mp/[id]` preserves real identity, shows the updated canonical-ID-gap copy, doesn't substitute party-level inference, renders the generic Responsibility block without implying departmental/ministerial control, and links back to People; the community section is confirmed hidden and undisturbed; source/sync `MetadataLine` remains visible.

## 11. Visual verification method

**No headless-browser/screenshot tooling is installed in this environment**, consistent with the prior two batch reports — no pixel-level screenshots were taken.

Verification performed instead: the already-running local `next dev` server for this project (confirmed via `lsof`'s `cwd`, port 3001, not started by this session) was queried via `curl` for `/`, `/leaders`, `/parliament`, `/issues` (all 200) and two real `/mp/[id]` profiles from different parties (`/mp/mp-labor-1`, `/mp/mp-ind-9`, both 200, both showing the new Responsibility block, the updated placeholder copy, and the "Back to People" link). The rendered `/leaders` HTML was grepped to confirm required content (Find your representative, Representative directory, Representation summary, Explore Parliament) is present and banned content (Rising Leaders, Nominate, approval, `generateScores`, `POLITICIAN_SCORECARDS`, Live Election Results) is absent.

**One real limitation, stated plainly:** this environment's data resolves to the mock/demo fallback (as in both prior batches), where all 150 House rows use resolvable `mp-*` ids and the Senate tab has zero members (`buildMockParliamentPayload()` returns `senate.members: []`). The "Profile unavailable" guard and the Senate-tab empty state are therefore **not observable via `curl` in this environment** — `curl` cannot execute the client-side tab switch, and there are no unresolvable-id rows to render in the default (House) view here. This was verified instead at the source level (29 passing tests assert the guard's exact logic and wiring) and by direct reading of `live-parliament.ts`'s id-generation code (§6) — a real, code-level confirmation of the bug and its fix, not a rendered one. A manual click-through once Supabase is populated (switch to the Senate tab, confirm rows show "Profile unavailable" rather than a link) is recommended as a follow-up, real-data check.

## 12. Roadmap status updates

- `DESIGN_SYSTEM_MIGRATION_ROADMAP.md` — Phase 5's entry for `/leaders`/`/mp/[id]` marked implemented ahead of that phase's original bulk-migration sequencing, with an explicit note that the removed chamber/live-election embed was a duplication fix, not a token re-skin. `/leaders/[id]` and the rest of Phase 5's page list remain not started.
- `STICKEE_V1_EXECUTIVE_SUMMARY.md` — the implementation-order list's People item (5) given a dated addendum recording that truthfulness/simplification shipped without the canonical-ID migration, via the guard-not-migrate approach, and naming the new Senate-link defect found this session. Owner Decision 10 given a further dated addendum adding the third id scheme (`MPIndex`'s `mp-*`) to the two already recorded from the Government batch.
- No historical audit finding was rewritten in place.

## 13. Owner decisions still required

1. **MP canonical-identifier reconciliation** (`STICKEE_V1_EXECUTIVE_SUMMARY.md` Owner Decision 10, now covering three id schemes) — required before Senate profiles or individually-matched voting history can ship. Not attempted in this batch, per instructions.
2. **`FindYourRepresentative` vs. `MPActionStrip` consolidation** — People and Parliament now each render their own representative-lookup UI, sharing only `useElectorate`. Worth a future, low-risk extraction into one shared component once both pages are stable — not done here to avoid touching Parliament's file in this batch.
3. **Real address/electorate verification** — explicitly out of scope, per instructions; documented here as a distinct, future, and materially harder product decision (would likely require real address or Digital ID infrastructure Stickee does not have).
4. **Rising Leaders / community nominees** — unresolved, unchanged from `PEOPLE_TRUTHFULNESS_BATCH_REPORT.md` §9's original recommendation (build it for real, clearly separated from elected MPs, with a real moderation pipeline; or retire it).

## 14. Remaining Cabinet/accountability work

None was begun, per instructions: no Cabinet pages, no department pages, no ministerial/portfolio attribution for any individual MP, no full Responsibility Map, no address/Digital-ID verification, no community nomination/scoring feature.

## 15. Confirmation

- Production was not accessed, modified, or deployed to.
- Nothing was staged, committed, or pushed.
- No migration was created or applied; no database was written to.
- No secret values were printed; `scripts/secret-scan.mjs` found nothing suspicious.
- Only `/leaders`, `/mp/[id]`, and the new `FindYourRepresentative` component were changed, plus the 4 pre-existing test assertions this batch's own instructed copy change required updating. Forecasts, Today, Political Pulse, Issues, and account pages were not touched. Parliament (`/parliament`, `MPActionStrip.tsx`, `ParliamentExperienceClient.tsx`) was read for audit purposes only, not modified.
- No unrelated pre-existing working-tree changes present at session start (the design-system migration files, roadmap documents, `agents/`/`docs/` directories, and the other already-modified pages listed in `git status`) were modified or overwritten.
