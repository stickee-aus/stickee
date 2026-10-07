# Political Pulse V1 — The Chronological Civic Change Stream

Governed by [`AGENTS.md`](AGENTS.md) and [`docs/philosophy/STICKEE_CHARTER.md`](docs/philosophy/STICKEE_CHARTER.md). Scope: `/feed` only, re-scoped to Political Pulse per `docs/page-audits/POLITICAL_PULSE_PAGE_AUDIT.md`'s converged Council recommendation ("Build Political Pulse V1 scoped to Parliament/Bills/Forecast-events only"). No other core page was touched. Nothing was staged, committed, pushed, or deployed. Production was not accessed.

---

## 1. What Political Pulse now exists to do

`/feed` answers exactly one question: **"What changed?"** It is a dated, sourced, chronological stream of real, agent-authored civic events — Parliament divisions, bill-stage transitions, prediction resolutions, and electorate activity digests. It no longer behaves as a social feed: there is no reactions, comments, compose bar, share-for-points, algorithmic boost badge, or letter-grade scoring anywhere on the page. Every row states, in plain text, which automated agent produced it and links to the real civic object it describes, where one exists.

**Route unchanged:** `/feed` (kept, re-scoped — not a route rename, per the audit's explicit instruction).

## 2. What was removed

| Element | Was | Removed because |
|---|---|---|
| Reactions (heart/fire/flag) | `handleReact`, optimistic counters, `/api/feed/react` calls | Engagement mechanic; task requires zero engagement UI on Political Pulse V1 |
| Comments | `CommentPanel`, `useComments` hook | Same — human-participation feature with no moderation queue built yet |
| Share-for-points | `ShareButton` with `bonusPoints={50}` | Points-for-sharing bolted onto civic-alert content, independent of the alert's actual value |
| Compose bar / user posts | `ComposeBar`, `handleNewPost`, `/api/feed/post` | Political Pulse V1 is agent-authored civic alerts only — human posting is a Community feature this batch is explicitly told not to build |
| "↑ BOOSTED" badge | `post.isAlgorithmicBoost` rendered as a badge | Engagement-heuristic label implying a significance judgement that isn't real editorial significance |
| `scoreToGrade` letter grades | `gradeStyle()`, A/B/C grade chips next to author name | Reintroduced the same unscoped-scoring pattern already removed elsewhere (see `mp-score-copy.test.ts`, commit `e8aab4d`) |
| `civicScore` display | Shown inline per post/author | Same civic-alignment score family as the removed MP voting-consistency score |
| Engagement-weighted ranking (`ranker.ts` / `/api/feed/ranked`) | Primary ordering path for the old page | Replaced by a new chronological query (`getChronologicalPulse`), per the audit's explicit architecture finding that the ranker is "architecturally the wrong model for a chronological page" |
| Filter model (All/Community/Leaders/My Electorate) | Community-post-oriented filters | Replaced by the minimal All/Parliament/Forecasts/Issues model the task specifies |
| Concealed authorship ("Stickee" for every post) | `author_name`/`author_handle` shown, `source_agent_id` dropped before reaching the client | Restored — every row now shows "Automated update · {Agent name}" |
| Emoji-led sentence openers (🗳 📋 ✅ 📍) | Raw agent `content` rendered verbatim | Stripped for display via `stripLeadingGlyph()` — the underlying fact is untouched, only the leading glyph is removed |

## 3. What real content remains, and what's new

- **`feed_posts`, the real table, is unchanged.** No migration was written or needed — `source_agent_id` already existed on the table (migration `013_agents_and_feed_posts.sql`) but was dropped by the old ranker's `rowToFeedPost` before reaching the client. This batch's data layer reads it directly.
- **A new chronological query path**, `getChronologicalPulse()` (`src/lib/feed/pulse-data.ts`), reads `feed_posts` ordered by `posted_at desc`, filtered to exactly four agent source ids, using the anon/session-scoped client (`createServerSupabaseClient`, same pattern as `src/lib/issues-db.ts`) — not the admin client, since `feed_posts` and `issues` both carry public-read RLS policies and no elevated access is needed for a public chronological read.
- **A batched, real lookup of related issue titles.** For bill-stage-tracker and prediction-resolver posts (which set `linked_bill_id` to a real `issues.id`), the query does one additional `issues` select to surface the issue's real title as the row's headline — e.g. "Housing Affordability Crisis" / "Passed parliament: ..." rather than only the agent's raw sentence. Parliament-watcher posts (linked to a division id, not an issue id) and electorate-pulse digests (linked to an electorate name, not an id) don't get this treatment — nothing was invented to fill that gap.
- **`ranker.ts`, `/api/feed/ranked`, `/api/feed/post`, `/api/feed/react`, `useComments.ts`, `ShareButton.tsx`, `mock-feed-data.ts` are all left in place, untouched, per the task's explicit instruction** ("If the existing ranker is still needed elsewhere, leave it in place"). None of them are called from the new Political Pulse page. `src/app/feed/page.tsx.bak` (pre-existing dead code, already flagged in `CIVIC_DESIGN_SYSTEM.md` as orphaned) was left exactly as found.

## 4. Authorship findings

Confirmed by direct code read of all seven registered agents (`src/lib/agents/registry.ts`):

| Agent | Writes `feed_posts`? | Included in Political Pulse V1? | Why |
|---|---|---|---|
| `parliament-watcher` | Yes (`civic_alert`) | **Yes** | Real division results + rebellion detection, deterministic, no LLM |
| `bill-stage-tracker` | Yes (`decision_update`) | **Yes** | Real `issues.status` transitions, deterministic |
| `prediction-resolver` | Yes (`decision_update`) | **Yes** | Real, computed from actual `predictions` rows against a resolved issue; not fabricated |
| `electorate-pulse` | Yes (`civic_alert`) | **Yes** | Real aggregation of `bill_pressures`/`predictions`/`comments` per electorate — matches the task's explicit "electorate-pulse summaries where genuinely sourced" inclusion |
| `mp-scorecard` | Yes (`leader_update`) | **No — deliberately excluded** | Its own source comment admits the score is "the cheapest plausible proxy for public opinion" chosen "to produce a *changing* number that drives interesting feed posts." This is the same unscoped civic-alignment heuristic already removed from `/mp/[id]` in commit `e8aab4d` ("fix: remove misleading MP voting-consistency score"). Reintroducing it into Political Pulse would contradict that fix. |
| `moderation-triage` | No | N/A | Admin-only, doesn't write `feed_posts` |
| `daily-bonus` | No | N/A | Wallet/points system, doesn't write `feed_posts` |

Every rendered row now shows **"Automated update · {Agent name}"** as plain text (`agentLabel()`, `src/lib/feed/pulse-format.ts`) — never colour-only, never defaulting to "Stickee." A row whose `source_agent_id` doesn't match one of the four verified agents is excluded at the query level (not shown mislabelled); the "Source unavailable" fallback in `agentLabel()` is a defensive guard for a genuinely indeterminate case, not a path any current row can reach.

## 5. Chronology / ranking findings

- **Primary ordering is strictly chronological**, newest first, grouped into **Today / Yesterday / Earlier** by local calendar day (`groupEventsByDate()`), matching the task's exact grouping spec. An empty group (e.g. no "Yesterday" activity) is omitted rather than rendered empty.
- **No engagement signal reaches the ordering or grouping logic at all.** `PulseEvent` (the type every row is built from) carries no `isAlgorithmicBoost`, `hearts`/`fires`/`flags`, `commentCount`, or score field — structurally, not just by omission from the UI (verified by a direct type-shape test).
- The old page's `ranker.ts` (`X-algorithm-inspired feed ranker`, weighted linear model over fire/heart/comment/share/recency/pillar-match/follows) is not imported anywhere in the new page or its data layer.

## 6. Seed/demo findings

**Political Pulse V1 ships with no seed/demo fallback, by deliberate decision — not an oversight.** The old page's mock content (`FEED_POSTS` in `src/lib/mock-feed-data.ts`) is hand-authored social-feed copy (community posts, leader updates, hardcoded April 2026 dates) with no `source_agent_id` field at all — it cannot honestly satisfy this batch's mandatory authorship requirement, and reusing it would reintroduce exactly the "seed content presented as if live" problem this task exists to prevent. Unlike Issues/Forecasts (which have a real, structurally-equivalent mock dataset), Political Pulse has no honest demo dataset to fall back to.

Per the task's own instruction ("If a real empty state is sufficient, prefer that over seed filler"), when the real query returns zero eligible rows, the page shows the truthful empty state: **"No verified civic updates are available for this period."** This was confirmed live against the local dev server (§10) — the local `feed_posts` table currently has no rows from these four agents, and the page correctly renders the empty state rather than fabricating content.

If a seed/demo fallback for Political Pulse is wanted in a future batch, it would need new, clearly-labelled fixture data built for this purpose — not a reuse of the old social-feed mock array. This is named as an open item, not resolved here.

## 7. Object-link and issue-relationship findings

| Source agent | Real linked id available | Href | Label |
|---|---|---|---|
| `bill-stage-tracker` / `prediction-resolver` | `linked_bill_id` → real `issues.id` | `/issue/[id]` | "View issue →" |
| `parliament-watcher` | `linked_decision_id` → division id (no per-division route exists) | `/parliament` | "View Parliament →" |
| `electorate-pulse` | `linked_electorate` → a name, not a routable id | *(no link)* | *(none)* |

No standalone article route was created to give electorate-pulse digests something to link to — per the task's explicit instruction not to fabricate a route just to make the feed look complete.

Where a real issue title was resolved, the row surfaces it as the bold headline with the agent's own sentence underneath as the description — matching the task's worked example ("Housing affordability / Bill moved to committee review / View issue →").

## 8. Files changed

- `src/lib/feed/pulse-format.ts` — new. Pure, framework-agnostic formatting/mapping helpers (agent scope, labels, category mapping, glyph stripping, href/link-label rules, date grouping). No Supabase import, so it's directly unit-testable and shared between the server data layer and the client component.
- `src/lib/feed/pulse-data.ts` — new. `getChronologicalPulse()`, the new chronological query path described in §3.
- `src/components/PoliticalPulseClient.tsx` — new. Renders `PageShell` / `PageHeader` / `UnderlineTabs` / `SectionHeader` (per date group) / `RecordRow` / `EmptyState` — no bespoke visual dialect, no new CSS.
- `src/app/feed/page.tsx` — rewritten. Was a 612-line client component (`FeedPage`) with reactions/comments/compose/ranking; now a ~7-line async server component that calls `getChronologicalPulse()` and renders `PoliticalPulseClient`.
- `src/app/feed/layout.tsx` — metadata updated (title/description/OG copy) to describe Political Pulse's actual purpose instead of the old "high-impact voices boosted automatically" framing.
- `src/app/feed/loading.tsx` — rewritten skeleton to match the new header/tabs/row-list shape (no reaction-row or compose-bar skeleton left over from the old design).
- `src/lib/__tests__/political-pulse-v1.test.ts` — new, 37 tests.
- `src/app/feed/error.tsx` — **not modified** (already a thin re-export of the root error boundary; nothing page-specific to change).

**Not modified, left exactly as found:** `src/lib/feed/ranker.ts`, `src/app/api/feed/ranked/route.ts`, `src/app/api/feed/post/route.ts`, `src/app/api/feed/react/route.ts`, `src/hooks/useComments.ts`, `src/components/ShareButton.tsx`, `src/lib/mock-feed-data.ts`, `src/app/feed/page.tsx.bak`. Today, Issues, Government, People, Forecasts, Issue Detail, account, and admin pages were not touched.

## 9. Tests

```
npx tsc --noEmit               → pass, 0 errors
npx vitest run                 → pass, 17 files, 442 tests (37 new, 0 regressions)
npm run build                  → pass, /feed compiled (ƒ dynamic, as expected)
node scripts/secret-scan.mjs   → pass, no suspicious patterns in tracked files
```

The 37 new tests in `src/lib/__tests__/political-pulse-v1.test.ts` cover, directly per the task's test list: chronological ordering as the primary mechanism (calendar-day grouping, newest-first, empty groups omitted); `source_agent_id`/automated authorship surfaced as visible text; absence of reactions, comments, share-for-points, boosted badges, `scoreToGrade`/letter grades, and compose/user-post UI; the engagement ranker not used as the primary path; real object links (`/issue/[id]`, `/parliament`) and the deliberate absence of a fabricated electorate-pulse route; the truthful empty-state copy; that no seed content is fabricated when the query is empty; the minimal filter model with no decorative "Elections" tab; shared Civic Design System primitives; no bespoke hex/shadow/pill-radius; and accessibility (list/listitem semantics, real heading component for date groups, no `hidden sm:*` wrapper hiding a control).

No pre-existing test was modified or weakened; the full suite (442 tests) passes with no regressions.

## 10. Visual verification

**No headless-browser/screenshot tooling (Playwright, Puppeteer) is installed in this project or reachable without a network install**, matching the same limitation noted in prior V1 batch reports — stated plainly, not claimed otherwise.

Verification performed instead: an existing local `next dev` server (already running before this session, on port 3001 — reused, not duplicated) was queried via `curl` for `/feed`, `/`, `/parliament`, `/issues`, `/predictions` (all HTTP 200). The rendered output was grepped to confirm:

- Title/meta: "Political Pulse — Stickee", the one-sentence purpose "What changed across Australian civic life?"
- Exactly one headline metric label ("verified civic events")
- Four `role="tab"` filter controls under one `role="tablist"` with labels All / Parliament / Forecasts / Issues — no fifth "Elections" tab
- The truthful empty state, "No verified civic updates are available for this period" — the local dev environment's `feed_posts` table currently has no rows from the four verified agents, so this is the correct, honest render, not a bug
- Zero occurrences of every banned string checked: `BOOSTED`, `scoreToGrade`, `ComposeBar`, `CommentPanel`, `ShareButton`, `bonusPoints`, "Sign in to react", "Sign in to comment"

This confirms correct server-rendered output for the current (empty) local dataset. **Not verified:** a populated stream (mobile layout, an issue-linked row, a Parliament-linked row, a resolved-forecast row) — the local environment has no real `feed_posts` rows from these agents to render, and none were fabricated to force a populated screenshot, per this task's own truthfulness rules. If manual verification against a populated environment is wanted, either point this environment at a Supabase project with real agent-run data, or run `parliament-watcher`/`bill-stage-tracker`/`electorate-pulse`/`prediction-resolver` locally against synced `divisions`/`issues` data (out of scope for this batch — no agent run or data sync was performed).

## 11. Today integration (documented, not built)

Per the task's explicit instruction, this was **not implemented** — Today was not touched. For a future batch: Today could show a compact "What changed" strip using the same `getChronologicalPulse({ limit: 3 })` call and `PulseEvent`/`agentLabel`/`eventHref` helpers already built here, rendered as 2–3 `RecordRow`s with a "View Political Pulse →" `LinkButton`, without needing a second, independent implementation of the chronological query or authorship logic. No safe existing hook for this was found in the current Today page, so nothing was wired.

## 12. Owner decisions to flag

1. **Secondary vs. primary navigation.** Not resolved here — Political Pulse remains at `/feed`, reachable however it currently is; this batch made no navigation/route changes.
2. **Today compact Pulse strip** (§11) — real, low-cost to build on top of this batch's data layer, but explicitly out of scope until requested.
3. **Moderation model for future human/community posts** — moot for V1 (no human posts render), but relevant if Community is ever built.
4. **Whether comments/reactions ever return** — not decided here; this batch removes them from Political Pulse specifically, not from the product's future roadmap.
5. **Source corrections as an event type** — still excluded per the audit's content-scope gate; not touched.
6. **ABS/RBA/Treasury/executive-announcement ingestion** — no real pipeline exists; correctly absent from V1, no placeholder added.
7. **Event retention/history policy** — not addressed; `getChronologicalPulse` currently reads the most recent 150 rows across all four agents with no explicit retention window beyond what's in `feed_posts`.
8. **Notification linkage** — not addressed; out of scope.
9. **Whether Pulse becomes Issue timelines' canonical event-history source later** — not resolved; this batch's `PulseEvent`/`getChronologicalPulse` are intentionally decoupled from `issue/[id]`'s own rendering, so this remains a clean option for later, not a foreclosed one.
10. **Whether `prediction-resolver` events should eventually link to a specific forecast/market page instead of `/issue/[id]`.** The real wallet-based forecast/market system (`issue_markets`, `resolution_source`, migration `017_market_lifecycle_and_settlement.sql`) has **no agent writing to `feed_posts` at all today** — `prediction-resolver` operates on a separate, simpler yes/no `predictions` table tied to `civic_score`, not the market system. This is a genuine missing data pipeline (the actual "Forecast openings/resolutions from the real market system" the page audit anticipated), not something this batch built or faked. Flagged here rather than resolved silently.
11. **Dead-code cleanup** — `ranker.ts`, `/api/feed/ranked`, `/api/feed/post`, `/api/feed/react`, `useComments.ts`, `ShareButton.tsx`, and `src/app/feed/page.tsx.bak` are now unused by Political Pulse. Left in place per this batch's "no unrelated cleanup" instruction; a future batch should decide whether to delete them or repurpose them elsewhere.

## 13. Confirmation

- **Only** `/feed`'s route files, two new `src/lib/feed/*` modules, one new client component, and one new test file were changed. Today, Issues, Government, People, Forecasts, Issue Detail, account, and admin pages were not touched.
- No database migration was written or applied. No database was modified, migrated, or seeded. No production environment was accessed, modified, or deployed to.
- No agent was run, and no `feed_posts`/`issues`/`divisions` data was synced or written by this session.
- Nothing was staged, committed, pushed, or deployed — all changes remain as working-tree edits for review.
- All unrelated pre-existing working-tree changes present at session start (the large existing diff and untracked report files) were left exactly as found — verified directly: `git status --short`, filtered to exclude this batch's own 7 changed files plus this report, leaves 142 entries untouched, matching the pre-existing working tree exactly.
