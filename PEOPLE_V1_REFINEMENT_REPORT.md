# People V1 — Refinement Report

Governed by [`AGENTS.md`](AGENTS.md) and [`docs/philosophy/STICKEE_CHARTER.md`](docs/philosophy/STICKEE_CHARTER.md). A focused refinement batch on top of two already-shipped, Charter-governed People batches — `PEOPLE_TRUTHFULNESS_BATCH_REPORT.md` (fabrication removal) and `PEOPLE_V1_SIMPLIFICATION_REPORT.md` (directory-first restructure, the electorate finder, the canonical-ID guard). This batch does not redo that work; it audits it against a fresh, more detailed brief and closes the specific gaps that brief identified. Scope: `/leaders` (nav label "People") and `/mp/[id]` only. No other core page (Issues, Government, Forecasts, Today, Political Pulse, account pages) was touched. Nothing was staged, committed, pushed, or deployed. Production was not accessed.

---

## 0. Starting state (read before writing any code)

`AGENTS.md`, `docs/philosophy/HOW_STICKEE_THINKS.md`, and `docs/philosophy/STICKEE_CHARTER.md` were read in full, followed by `STICKEE_V1_PRODUCT_BLUEPRINT.md`, `docs/page-audits/PEOPLE_PAGE_AUDIT.md`, `docs/page-audits/CROSS_PAGE_CONSISTENCY_AUDIT.md`, `docs/page-audits/RESPONSIBILITY_MAP_SPEC.md`, `PEOPLE_TRUTHFULNESS_BATCH_REPORT.md`, `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`, `GOVERNMENT_V1_MAP_REPORT.md`, `CIVIC_DESIGN_SYSTEM.md`, and `DESIGN_SYSTEM_MIGRATION_ROADMAP.md`, per this batch's own instructions.

`git status` at session start showed a large, pre-existing set of uncommitted working-tree changes spanning most of the app (Issues, Government/Parliament, Home, navigation, design-system primitives, and People itself), plus a long list of untracked audit/report/roadmap documents and new UI primitives (`page-shell.tsx`, `record-row.tsx`, `status-label.tsx`, etc.). Direct code reading confirmed `/leaders` and `/mp/[id]` were **already** rebuilt onto `PageShell`/`PageHeader`/`SectionHeader`/`RecordRow`/`StatusLabel`/`MetadataLine`/`EmptyState`/`UnderlineTabs`, already directory-first with no embedded chamber map, and already carrying a working `FindYourRepresentative` component and the `isResolvableProfileId` canonical-ID guard — i.e., this session's brief describes the same destination `PEOPLE_V1_SIMPLIFICATION_REPORT.md` already reached. None of that pre-existing, unrelated work was overwritten or reverted; this report only covers the delta described in §1–§7 below.

## 1. What People now exists to do

Unchanged from the prior batch's framing, reaffirmed after this session's own re-audit: `/leaders` answers **"Who represents Australians, what role do they hold, and what verified record do we have about them?"** — a representative finder plus a searchable, filterable MP directory, not a second Parliament page, chamber visualisation, or popularity leaderboard.

## 2. Gaps found by this batch's audit, and what was fixed

Direct code reading (not just the historical reports) turned up five real gaps against this session's brief. Each is a refinement, not a rebuild:

| Gap | Before | After | Why |
|---|---|---|---|
| Header metric wording | `metric={{ value: totalMPs, label: 'MPs tracked' }}`, where `totalMPs` is always `houseMembers.length` | `label: 'House members tracked'` | The brief specifically asks whether "MPs tracked" is still correct now that the Senate is selectable via the chamber tabs. It wasn't: the number never included senators, so the old label implied broader coverage than the figure actually has. No combined total was invented — `houseMembers.length + senateMembers.length` would misreport in the (documented, pre-existing) mock-fallback environment where `senate.members` is `[]`. |
| Representation summary — no progressive disclosure | Full party-by-party breakdown for both chambers, always visible | Collapsed to the top 4 parties per chamber by count, with an explicit "View full composition" / "Show fewer parties" toggle (`aria-expanded`) | The brief requires this block collapsed by default so it doesn't compete with the directory for scroll priority, especially on mobile. Every real party still gets its own row once expanded — the collapsed view adds a plain `+N more party groups` line, never a computed "Other" bucket. |
| No generic role/responsibility explainer on the directory itself | Only `/mp/[id]` had a "what a Federal MP can and cannot do" block | A new, collapsed-by-default "What can these roles actually do?" section on `/leaders`, covering Federal MP, Senator, and Minister in the brief's exact plain-language bullets | The brief's "ROLE AND RESPONSIBILITY LANGUAGE" section is distinct from the "How Parliament works" bicameral-structure explainer already removed from People as a duplicate (`PEOPLE_V1_SIMPLIFICATION_REPORT.md` §2) — it's role clarification, not civics, and it wasn't rendered anywhere on People before this batch. |
| Unresolved-profile copy didn't match the brief's specified phrase | `StatusLabel` read "Profile unavailable" | `StatusLabel` reads **"Profile not yet available"** | The brief's "PROFILE LINK SAFETY" section names this exact phrase. Functionally identical (still a plain, non-clickable status, never a link) — a wording-only change. |
| MP profile didn't state chamber | Showed name, electorate, party — no explicit chamber label | Added "· House of Representatives" next to the electorate | The brief's "MP PROFILE" section asks the profile to keep "electorate or state/territory, **chamber**." Verified safe to hardcode: `MPIndex` (`src/lib/mock-data.ts:203`) is built entirely from `MPs`, which has no Senate entries (confirmed again this session, corroborating `PEOPLE_V1_SIMPLIFICATION_REPORT.md` §6) — every id that resolves on `/mp/[id]` today is, without exception, a House member. A new regression test (`people-v1-refinement.test.ts`) pins this premise so the hardcoded label is caught if `MPIndex` is ever widened to include senators. |

Nothing else on either page was changed. No new fabricated content was added — the role explainer and composition summary both draw only from real data (party composition counts) or generic, unattributed civics language, never a per-person claim.

## 3. Row structure (confirmed against the brief, unchanged from the prior batch)

Each directory row renders exactly: **Name** · `RecordRow.label`; **Party · Electorate · Chamber** · `RecordRow.meta` (e.g. "ALP · Grayndler · House of Reps"); and either **"View profile →"** (resolvable ids) or **"Profile not yet available"** (unresolvable ids) as `RecordRow.status`/`value`. No per-row score, grade, popularity metric, or "current verified role" field is rendered — the latter was deliberately not added, because no verified per-MP role/portfolio source exists anywhere in the codebase (`RESPONSIBILITY_MAP_SPEC.md`'s data-readiness table, re-confirmed this session: Minister/Department remain **not currently modeled**). Per the brief's own instruction ("Only show 'Prime Minister' if that role comes from a verified current source... Do not infer roles from name, party, or position in a static array"), omitting the field entirely is the correct behaviour, not a gap.

## 4. House vs. Senate differences

- **House rows** use electorate (real, from `MPIndex`/`MPs` or the live TheyVoteForYou feed) and are linkable to `/mp/[id]` when `isResolvableProfileId(mp.id)` — i.e. when the id round-trips through the static `mp-*` scheme.
- **Senate rows** have no state/territory attribution anywhere in the codebase today (`GOVERNMENT_V1_MAP_REPORT.md` §2, re-confirmed: the `members` table has no `state` column, and no sync path populates one). No state was invented for any senator. Every senator id is synthesised as `senate-${party}-${index}` by `live-parliament.ts`'s `buildSenateMembers()`, which never matches `isResolvableProfileId`'s `mp-*` check — so every senator row correctly falls back to the plain, non-clickable **"Profile not yet available"** status, never a dead link.
- In this environment's mock/demo data fallback, `senate.members` is `[]` (documented in `PEOPLE_V1_SIMPLIFICATION_REPORT.md` §11 as a known, pre-existing limitation, re-confirmed this session by curl) — so the Senate tab's empty-state and the "Profile not yet available" row-level guard could not both be observed together via a live curl request. The guard's logic was instead verified at the source level (new regression test, §8) and by direct reading of `live-parliament.ts`'s id-generation code, exactly as the prior batch's own verification method.

## 5. Profile-link safety

Confirmed unchanged and correct: a directory row only renders as a link when `isResolvableProfileId` returns true; `RecordRow`'s `href` prop is `undefined` otherwise, so the row renders as a plain `<div>` (not wrapped in `<Link>`), and the status column renders `StatusLabel` — a `<span>`, never a button or anchor. This was verified both at the source level and by rendering `/leaders` against the live local dev server (§9) — no unresolvable row in this app can ever produce a clickable "Profile not yet available."

## 6. Representative-lookup limitations

Unchanged from `PEOPLE_V1_SIMPLIFICATION_REPORT.md` §4, re-verified this session by reading `useElectorate.ts` and `FindYourRepresentative.tsx` directly: automatic detection (`detectByLocation`) only ever produces a `suggestedElectorate`, never an auto-committed one; `/api/electorate-lookup` is a coarse state-bounding-box match, not a real geographic boundary lookup, and the component's own copy says so ("This is an approximate match, not a verified address or electoral-roll lookup"). A person is shown as "your representative" only after `confirmSuggestedElectorate()` (explicit confirmation) or direct manual entry. No address verification, electoral-roll check, or Digital ID system exists or is implied — none was built in this batch, per instructions.

## 7. Verified-role findings

No individual MP's ministerial, shadow, or committee role is displayed anywhere on either page — confirmed by grep (no `portfolio`, `Minister`, or `Cabinet` string is attached to any specific MP record in either file). The only role content on either page is the two generic, unattributed explainer blocks: `/mp/[id]`'s pre-existing "What a Federal MP can and cannot do" (unchanged), and the new `/leaders`-level "What can these roles actually do?" block covering Federal MP, Senator, and Minister in the brief's exact language. Both explicitly state that Stickee does not yet verify or display which individual MPs hold a ministerial or shadow portfolio, and neither implies unilateral legislative or executive power for any role — matching `RESPONSIBILITY_MAP_SPEC.md`'s MP-role clarification and Design rule 1 (no numeric influence/power score under any circumstance; confirmed by test that the role-explainer block contains no percentage or score).

## 8. Qualifications findings

No qualifications (education, professional background, elected/ministerial history) are shown anywhere on either page. None were added in this batch, per instructions — no reliable, current, per-MP qualifications source exists in the codebase today.

## 9. Accountability — future model (documented, not built)

Per instructions, no Cabinet card, failure score, performance score, promise-success percentage, or controversy count was built or considered. The future structure this batch documents, rather than implements, is the same one named in `RESPONSIBILITY_MAP_SPEC.md` and the brief:

```
MP/Senator profile
 → current role (verified only)
 → portfolio (once Minister/Department are real, modeled objects)
 → responsibilities (generic, role-based — already shipped)
 → related issues (link out to Issues, not duplicated)
 → verified decisions (once Government Decision is a real object — GOVERNMENT_V1_SIMPLIFICATION_REPORT.md §"Government Decision")
 → recorded votes (real member_votes/divisions data exists and is synced, but is not yet wired to any per-MP id scheme that survives the canonical-ID gap — see §10)
 → public commitments (no data model exists yet)
 → outcomes (depends on the above)
 → inquiries / reviews (Committee is not currently modeled at all — RESPONSIBILITY_MAP_SPEC.md#committee)
 → corrections (depends on the site-wide revision-history mechanism named in STICKEE_CHARTER.md §9, not yet built for any content type)
 → sources (MetadataLine already shipped, real, on both pages)
```

Nothing above this line was implemented; it exists here only so a future contributor doesn't have to re-derive it.

## 10. Composition-summary simplification

Implemented exactly as specified in §2 above: top-4-by-count parties visible by default per chamber, full breakdown behind an explicit, `aria-expanded`-carrying "View full composition" toggle, defaulting closed. No party was merged into an invented "Other" row — every real party keeps its own line item once expanded; the collapsed state only ever adds a plain count of how many additional groups are hidden (`+N more party groups`), which is computed from the same real `countsByParty` data, not a separate claim.

## 11. Canonical-ID and senator-state gap (documented, not resolved — unchanged)

Both gaps are structural, pre-existing, and explicitly out of this batch's scope to fix:

1. **MP canonical-ID reconciliation** — three disjoint id schemes remain in play (`MPIndex`'s `mp-*`, live `house-live-*`/`senate-*`, and the real per-vote `tvfy-*` scheme used by `parliament-db.ts`), named across `GOVERNMENT_V1_SIMPLIFICATION_REPORT.md` §6, `PEOPLE_V1_SIMPLIFICATION_REPORT.md` §6, and `STICKEE_V1_EXECUTIVE_SUMMARY.md` Owner Decision 10. `isResolvableProfileId`'s guard is a safe mitigation (never a dead link), not a fix.
2. **Verified senator → state/territory mapping** — the `members` table has no `state` column, and no sync path populates one (`GOVERNMENT_V1_MAP_REPORT.md` §2/§4). Until this exists, no Senate row or profile can truthfully show a state, and none does.

## 12. Files changed

- `src/app/leaders/page.tsx` — header metric label corrected; "Profile unavailable" → "Profile not yet available"; `CompositionList` now sorts by count and supports a collapsed/expanded view (`COMPOSITION_COLLAPSED_COUNT = 4`); added the collapsed-by-default composition-summary toggle and the new "What can these roles actually do?" role-explainer section. No other structural change — directory, search, filters, sort, `FindYourRepresentative`, and the canonical-ID guard are untouched.
- `src/app/mp/[id]/page.tsx` — added "· House of Representatives" next to the electorate in the profile header. No other change.
- `src/lib/__tests__/people-v1-simplification.test.ts` — one pre-existing assertion updated in place (the exact string this batch's instructed copy change required, `'Profile unavailable'` → `'Profile not yet available'`), consistent with this codebase's established convention of updating pinned-copy assertions when a batch's own brief specifies the new copy.
- `src/lib/__tests__/people-v1-refinement.test.ts` — new, 14 tests (see §13).

No other file was read for anything beyond audit purposes. `HouseChamber.tsx`, `SenateView.tsx`, `MPActionStrip.tsx`, `ParliamentExperienceClient.tsx`, `useApproval.ts`, `mock-leaders-data.ts`, `LeaderProfileDetail.tsx`, `NominationModal.tsx`, `src/app/leaders/[id]/page.tsx`, `src/app/leaders/layout.tsx`, `src/app/leaders/loading.tsx`, and `FindYourRepresentative.tsx`/`useElectorate.ts` were confirmed unchanged and correct by direct reading, not modified.

## 13. Tests

```
npx tsc --noEmit               → clean, 0 errors
npx vitest run                 → 353/353 passed (14 files), including the new
                                  people-v1-refinement.test.ts (14/14)
npm run build                  → succeeded (Next.js 16.2.1 / Turbopack), all 46
                                  routes compiled, including /leaders and /mp/[id]
node scripts/secret-scan.mjs   → "no suspicious patterns found in tracked files"
```

The 14 new tests cover: the header metric no longer reads `'MPs tracked'` and now reads `'House members tracked'`; the representation summary is collapsed by default with an `aria-expanded` toggle and never fabricates an "Other" party bucket; the role explainer is collapsed by default, names Federal MP/Senator/Minister generically (never a named individual), carries no numeric score/percentage, and states plainly that no role can act alone; the page contains neither the word "trust" nor "approval" anywhere; unresolvable rows show the exact "Profile not yet available" phrase without an accompanying `href`; and the MP profile renders "House of Representatives," with a companion test pinning the `MPIndex`-is-House-only premise that label depends on.

All 339 pre-existing tests (12 pre-existing files spanning People, Government, Issues, Home, navigation, market eligibility, and the design system) continue to pass unmodified except the one pinned-copy assertion named above.

## 14. Visual/browser verification

**No headless-browser screenshot tooling was usable in this environment** — Playwright's CLI is present (`v1.62.1`) but the matching browser binary is not installed (`chromium-1234` required, only an older `chromium-1208` cached), and the `playwright` npm package is not installed in this project's `node_modules`, so no in-process launch was possible either. No pixel-level screenshots were taken — stated plainly, not claimed otherwise.

**Real HTTP + rendered-HTML verification was performed instead**, against the already-running local `next dev` server for this exact project (confirmed via `lsof`'s `cwd`, PID 91137, port 3001 — not started by this session):

- `/`, `/leaders`, `/mp/mp-labor-1` all returned HTTP 200.
- The rendered `/leaders` HTML was inspected directly (not just grepped for a boolean match) and confirmed: "House members tracked" is present, "MPs tracked" is absent; the composition-summary toggle renders as `<button aria-expanded="false">…View full composition</button>`, correctly collapsed; the role-explainer section renders as a collapsed `<button aria-expanded="false">` with the heading text and no expanded bullet content in the initial HTML; "Profile not yet available" logic is present in source but not observable in this render (see §4 — the mock-fallback environment's Senate tab is empty and every House row here resolves, the same documented limitation as the prior two People batches).
- The rendered `/mp/mp-labor-1` HTML was confirmed to contain "House of Representatives," "Back to People," and the existing honest "Individual voting analysis is not yet available for this representative." placeholder.
- Neither "trust" nor "approval" (case-insensitive) appears anywhere in the rendered `/leaders` HTML.

This confirms genuine server-rendered output for every change in this batch, not only source-level string assertions — a step beyond what the two prior People batches' verification sections could do in this same environment. It does not confirm pixel-level spacing, contrast, or true responsive layout at a real mobile viewport; a manual click-through (expand both new toggles, switch to the Senate tab once populated, resize to a mobile width) remains the recommended follow-up once real browser tooling is available.

## 15. Owner decisions still required

Unresolved by this batch, by design — restated from the brief, corroborated (not re-litigated) by this session's re-reading of the code:

1. **MP canonical-ID migration** — unify `MPIndex`'s `mp-*`, the live `house-live-*`/`senate-*` scheme, and the real `tvfy-*` vote-data scheme (`STICKEE_V1_EXECUTIVE_SUMMARY.md` Owner Decision 10).
2. **Verified senator → state/territory mapping** — requires a `state` column on `members` and a real sync path; no Senate row or profile can be state-attributed until this exists.
3. **Verified current role/ministerial data source** — Minister and Department remain unmodeled objects anywhere in the schema; no per-MP portfolio can be shown until one exists.
4. **Cabinet/portfolio responsibility model** — the future accountability structure in §9 is documented, not built.
5. **Whether qualifications belong on profiles at all**, and if so, from what source.
6. **Public commitment/promise data model** — does not exist today.
7. **Long-term accountability record schema** — the §9 structure is a sketch, not a spec ready to build from.
8. **Whether People eventually gets `/people/[id]` canonical routes** instead of `/mp/[id]` — `/people/[id]` does not exist anywhere in the codebase today (confirmed again this session); `/mp/[id]` remains the only working canonical representative route.

## 16. Confirmation

- Production was not accessed, modified, or deployed to.
- Nothing was staged, committed, or pushed.
- No migration was created or applied; no database was written to.
- No secret values were printed; `scripts/secret-scan.mjs` found nothing suspicious.
- Only `src/app/leaders/page.tsx`, `src/app/mp/[id]/page.tsx`, one pre-existing test assertion, and one new test file were changed. Issues, Government/Parliament, Forecasts, Today, Political Pulse, and every account page were not touched, and none of the large pre-existing set of unrelated uncommitted working-tree changes present at session start was modified, reverted, or overwritten.
- No Cabinet page, Department page, public scoring system, Digital ID flow, or address-verification system was built.
- No political role, vote, or qualification was inferred for any individual MP or Senator.
