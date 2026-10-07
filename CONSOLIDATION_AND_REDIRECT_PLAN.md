# Stickee — Consolidation & Redirect Plan

Read-only planning document. **No routes were deleted, renamed, merged, hidden, or redirected by this audit — no code, files, or navigation were changed.** This plan describes what a future implementation batch should do and in what order; it is not itself an implementation.

Companion to `PAGE_AND_ROUTE_INVENTORY.md` (facts) and `INFORMATION_ARCHITECTURE_AUDIT.md` (analysis/rationale). See `PAGE_REFACTOR_ROADMAP.md` for how this plan maps to actual implementation batches.

## Routes to keep (as-is or near-as-is)

| Route | Why |
|---|---|
| `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/callback` | Real, working, structurally sound. No IA issue. |
| `/donate`, `/donate/success`, `/donate/cancel` | Real Stripe+Supabase flow, no overlap, no confusion risk found. |
| `/admin`, `/admin/users`, `/admin/activity`, `/admin/agents`, `/admin/agents/[id]`, `/admin/markets`, `/admin/analytics` | Internal, gated, functioning as designed. |
| `/issue/[id]` (content, not structure) | The underlying editorial content (context, evidence, real poll) is worth keeping — see "Simplify" below for what changes about its *shape*. |
| `/parliament` (content, not structure) | Real chamber/vote/campaign-action data is Stickee's strongest evidence layer — kept, restructured (bill list moves out). |
| `/mp/[id]`, `/leaders/[id]` (content, not structure) | Both have real, worthwhile content/write-paths — kept, given a shared parent and fixed cross-linking. |
| `/predictions` (content, not structure) | The market/staking core is real and valuable — kept, slimmed. |
| `/impact` (content, not structure) | Legitimate deep-dive pairing with the home page — kept, copy fixed. |

## Routes to rename

| Current | Proposed | Why |
|---|---|---|
| `/predictions` | `/forecasts` | Avoids betting-adjacent terminology ("markets," "predictions" read as wagers) per the constitution's explicit anti-betting-site stance, while staying concrete about the crowd-probability mechanic. |
| `/leaders` | `/people` (MP-focused view) | Corrects a page whose name promises "leaders" but whose dominant content (an MP table) isn't that; see merge below for what actually happens to its sections. |
| `/issue/[id]` | `/issues/[slug]` | Nested under the list it belongs to, consistent with the merged Issues+Decisions content model. |
| `/donate*` | `/support*` | Matches the "civic intelligence platform" framing better than a bare transactional label; optional, lower priority than the others. |

## Routes to merge

| Sources | Destination | What happens |
|---|---|---|
| `/decisions` + `/government` (redirect) | `/issues` | Decisions become a content type/status filter inside the unified Issues list; each decision gains a real detail page for the first time (currently none exists) under `/issues/[slug]`. `/government`'s redirect target changes accordingly (see redirects below). |
| `/parliament`'s bill *list* section | `/issues` | The bill feed currently duplicated on `/parliament` (different components, same underlying bill concept) is removed from Parliament and replaced with links into the unified Issues list; Parliament keeps chamber/vote/campaign-action content, which Issues does not have. |
| `/leaders`' MP table + `/mp/[id]` | `/people` + `/people/[id]` | The MP roster currently shown (but not linked anywhere) on `/leaders` becomes the primary content of `/people`, with rows finally linking to real MP detail pages; `/leaders`' disconnected "featured politicians" mock block is retired in favor of this one real list. |
| `/leaders`' "Rising Leaders" section + `/leaders/[id]` | `/people` (community tab/section) + `/people/community/[id]` | Community-nominated leaders keep their own clearly-labeled section within People rather than a separate top-level route. |
| `/predictions`' embedded top-6 leaderboard section | `/leaderboard` (or removed, see Hide below) | Stop duplicating the same hardcoded array in two places; one canonical leaderboard surface, not two. |
| `/campaigns` (fake mechanic) | Real bill-pressure `CampaignModal` system (currently `/parliament`-only) | The standalone page's join/propose/share mechanics are decorative; the real, API-connected version already exists and should absorb this concept rather than the two coexisting. |

## Routes to turn into sections (not separate pages)

| Current standalone route | Becomes a section within | Why |
|---|---|---|
| `/simulator` | Contextual "Explore scenarios" block on Issues/Parliament/People/Forecasts detail pages | No independent object of its own — every real entry point is already "simulate *this specific thing*" via the existing `SimulateThisButton`/query-param bridge; only the standalone landing page and top-level nav slot are removed, the engine and its many entry points stay exactly as built. |
| `/issue/[id]`'s embedded prediction-market order-book widget | A linked forecast summary chip ("62% likely — see the forecast →") pointing to `/forecasts` | Removes a broken (non-functional Buy buttons), duplicated sub-system from the issue page without losing the information — it becomes a link, not a re-implementation. |
| `/issue/[id]`'s embedded 150-row MP vote grid | A linked "How MPs voted" summary, full grid lives under Government/Parliament | Same rationale — one canonical place for the full MP-vote table, linked from wherever it's relevant. |
| Election live-tracking (`LiveElectionPulse`, currently permanently embedded in `/predictions`) | A contextual banner that only appears when `useLiveElection().active` is true, on the home page or a dedicated seasonal surface | Removes permanent, often-irrelevant real estate from the Forecasts page; the widget/API/hook are unchanged, only where and when they render. |

## Routes to hide until ready

| Route | Condition to un-hide |
|---|---|
| `/u/[handle]` | Until real user-generated civic-voice profiles exist (currently 4 hardcoded fictional people, `localStorage`-only follows) — matches the constitution's "hide until ready" rule directly. |
| `/leaderboard` | Until it reflects a real ranking computed from real wallet/prediction data, not the same static mock array shared with `/predictions`. |
| `/leaders`' "featured politicians" mock scorecard block | Until it's wired to the same real MP id scheme as the rest of the app (or removed outright — see below). |

## Routes to remove

| Route | Why |
|---|---|
| `/government` | Zero unique content — a bare redirect to `/decisions`. Once Decisions merges into Issues, this becomes a redirect to a redirect; remove the intermediate hop (see required redirects — `/government` should point straight to the merged destination, not be deleted with a dead link left behind). |
| `/decisions` (as a distinct route, post-merge) | Superseded by `/issues` with a type filter; kept only as a redirect target (see below), not as live code. |
| `/leaders`' disconnected "featured politicians" mock block (component-level, not a route) | A third, incompatible id scheme representing 5 real politicians who are already represented properly elsewhere once `/people` is built — not a route removal, but flagged here since it's dead-weight content directly relevant to this consolidation. |

**Nothing else is recommended for outright removal.** Every other underused or partially-mock route (Feed, Campaigns, Onboarding, Notifications' demo fallback) has a real, worthwhile mechanism underneath and is recommended for simplification or re-scoping, not deletion — consistent with "prefer fewer, clearer pages over preserving every existing feature," but only where a feature is genuinely redundant, not merely imperfect.

## Required redirects (once implemented — not created by this audit)

| From | To | Type |
|---|---|---|
| `/government` | `/issues` (or `/government/parliament` if "Government" becomes the Parliament+People umbrella per the Hybrid nav option) | 308 permanent — needs an explicit decision: does "Government" become the new umbrella label (Option C), in which case `/government` should probably *become* a real page rather than redirect at all? Flagged as an owner decision, see below. |
| `/decisions` | `/issues?type=decision` (or `/issues` plain, if type-filtering isn't surfaced in the URL) | 308 permanent |
| `/predictions` | `/forecasts` | 308 permanent |
| `/leaders` | `/people` | 308 permanent |
| `/issue/[id]` | `/issues/[id]` (same id, new path segment) | 308 permanent, id-preserving |
| `/donate`, `/donate/success`, `/donate/cancel` | `/support`, `/support/success`, `/support/cancel` | 308 permanent (only if the rename is adopted — lower priority, can be deferred/skipped) |

**No redirects were created by this audit.** This table exists so a future batch can implement them with `next.config.ts` `redirects()` or route-level `redirect()` calls, per the Next.js version in use (see `AGENTS.md`'s instruction to check `node_modules/next/dist/docs` before implementing).

## Dependencies (what must happen before what)

1. **Data model decision precedes the Issues/Decisions merge.** Issues and Decisions currently have different id namespaces and different shapes (one partially Supabase-backed, one 100% mock). Merging the *pages* is straightforward; merging the *data* is a real modeling decision — does the unified list need one Supabase table, or can it continue reading two sources and presenting them as one list client-side? This is an owner/engineering decision, not something this IA audit can resolve.
2. **People merge depends on fixing the MP id-scheme fragmentation** (three incompatible id schemes for the same real MPs across `mock-data.ts`, `mock-civic-data.ts`'s `POLITICIAN_SCORECARDS`, and the underlying Supabase `members` table) before `/leaders`' MP table can safely link to `/mp/[id]` (soon `/people/[id]`) without broken links.
3. **Forecasts slimming depends on deciding where wallet/portfolio live** (a new `/account/wallet`, or staying inline but visually demoted) — this is a product decision about how prominent "my points" should be, not purely mechanical.
4. **Simulator's "convert to section" change depends on nothing else** — its entry-point infrastructure (`SimulateThisButton`, `simulator-bridge.ts`) already works everywhere it needs to; only the standalone page/nav-slot removal is independent, low-risk work.
5. **Redirect implementation depends on the destination pages existing and being stable** — redirects should land in the same batch as (or immediately after) the page they point to, never before.

## Migration risks

- **Broken external links / bookmarks / shared URLs.** Since the app has never been pushed to a public remote (per `docs/audits/FIRST_GITHUB_PUSH_READINESS.md`), there is currently no real external traffic at risk — this significantly lowers the urgency and risk of any redirect work compared to a live product, and is a good reason to do this consolidation *before* the first public launch rather than after.
- **Command Palette and in-app hardcoded links.** Every route rename/merge requires updating the corresponding entries in `CommandPalette.tsx`'s `NAV_ITEMS`, plus every hardcoded `href` found across the codebase during this audit (e.g., `/issue/${id}` appears in `page.tsx`'s pillar grid, `MPVoteGrid`, `mock-market-data.ts`'s `marketStoryFor`, `CommandPalette`'s bill index, and more) — a genuinely wide blast radius that needs a careful find-and-replace pass, not a single-file edit.
- **Two wallet systems reconciling.** If Forecasts' wallet/portfolio moves to Account, a decision is needed about whether `useWallet` (`localStorage`) and `usePredictionWallet` (Supabase) become one system at the same time — doing the page move without reconciling the data risks making the confusion *more* visible (two point balances now sitting side-by-side in the same Account section) rather than less. Recommend reconciling the wallet data model in the same batch as the page move, not before or long after.
- **SEO/discoverability is not a current concern** (no public deployment, no search-engine indexing yet), which removes one of the usual biggest risks of a route-renaming pass — worth doing this work now rather than after launch specifically because of this.
- **Admin console references some of these routes/ids in server actions and SQL comments** (e.g., `resolveMarketAction` operates on `issue_markets.issue_id`, which is shared with the Issues content model) — renaming/merging Issues data must not silently break the admin resolution flow, which is real, financial-equivalent, and already verified against a live database per `docs/audits/DATABASE_VERIFICATION_REPORT.md`. Any Issues/Decisions data-model change should be re-verified against a real database the same way, not just typechecked.
