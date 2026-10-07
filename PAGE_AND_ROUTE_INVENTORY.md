# Stickee — Page & Route Inventory

Read-only audit. No code modified. Every route below was traced by reading its `page.tsx`/`route.ts` and every component/hook/lib it imports (at least one level deep, more where needed) — not inferred from route names. "Data quality" reflects what the code actually reads, not what the UI copy claims.

Scope: full `src/app` tree as of this audit. **32 `page.tsx` routes** (25 user-facing + 7 admin) and **18 `route.ts` handlers**.

---

## Master inventory table (user-facing pages)

| Route | Current purpose | User question answered | Data quality | Overlap | Recommendation | Future location |
|---|---|---|---|---|---|---|
| `/` | National civic-score summary + 3 quick-action cards + top pillar/decision previews | "What's happening in Australian politics right now?" | Mixed — pillar scores are explicitly-simulated mock data (`mock-civic-data.ts`); decisions are hardcoded | Duplicates `/impact`'s pillar data (deliberately, as summary→deep-dive); "recent decisions" all link to the same generic `/decisions` (no per-decision page exists) | Simplify | `/` (Today briefing) |
| `/issues` | Filterable list of bills/issues with status, MP-vote %, market %, email-MP action | "What bills/issues are being decided?" | Mixed — Supabase-first (`issues`, `issue_markets`), silent fallback to 5-item mock | Same list/filter/expand/email pattern as `/decisions`, disjoint data model | Keep (as canonical Issues list) | `/issues` |
| `/issue/[id]` | Issue detail: context text, pass/fail poll, prediction-market order book, 150-row MP vote grid w/ its own unpersisted "predict how each MP votes" game, simulator link-outs, email-MP | "What is this issue, and what's likely to happen?" | Mixed — Supabase-first issue text, live `predictions` poll, live-or-mock market widget, hardcoded MP votes | Reimplements a market widget and an MP-vote table that both duplicate dedicated systems (`/predictions`, `/parliament`'s MP data) | Simplify (split into one editorial page + links) | `/issues/[slug]` |
| `/decisions` | Filterable list of federal/state/local "decisions" with status timeline, sentiment bar, inline unpersisted Yes/No poll | "What has government decided or proposed?" | Mock — 100% hardcoded 19-item array, no Supabase | Same UX pattern as `/issues`; CTA button ("Predict Outcome"/"Agree-Disagree") is non-functional (`stopPropagation`, no `onClick`) | Merge into Issues | `/issues` (as a content type/filter) |
| `/government` | Zero content — hard `redirect('/decisions')` | (none — pure alias) | N/A | 100% of `/decisions` | Remove (delete the redirect route once nothing links to it, or keep as a 1-line legacy redirect) | Redirect to `/issues` (or wherever decisions land) |
| `/parliament` | Priority-bill spotlight, filterable bill feed with pressure/campaign actions, "your rep" strip, chamber visualisation (House/Senate/live-election toggle), civics explainer | "What is Parliament doing, and what's my MP's role?" | Mixed — real Supabase (`members`/`divisions`/`member_votes`) with mock fallback; header stat tiles are hardcoded literals, not computed from the data below them | Duplicates `/issues`' bill list under different filters/components; is the only place `CampaignModal` can be opened | Simplify (keep chamber + MP votes; move bill list into Issues) | `/government/parliament` |
| `/leaders` | Despite its name, mostly an all-MP "marketplace" table (that doesn't link to `/mp/[id]`) + a disconnected 5-politician mock scorecard block + a bottom "Rising Leaders" (community-nominated) section | "Who are Australia's politicians/leaders?" | Mixed — live-or-mock MP roster; a hardcoded, stale 5-politician block with a third incompatible id scheme; fully mock community-leader section | Re-implements an MP list already covered by `/parliament`'s chamber and `/mp/[id]`; "featured politicians" duplicate real MPs under different ids with zero cross-linking | Simplify + rename (split concepts) | `/people` (MPs) + `/people?type=community` (nominated leaders) |
| `/leaders/[id]` | Community-nominated (fictional) leader profile: credibility score, support pledge (real, auth-gated Supabase write), pathway-to-politics narrative | "Who is this community-nominated civic leader?" | Mock narrative content; the one genuinely real, persisted, auth-checked write path found in this whole cluster (`leader_supports` table) | None structural — but sits under a `/leaders` route that's 90% about MPs, not these people | Keep, rename | `/people/community/[id]` (or similar, clearly separated from MPs) |
| `/mp/[id]` | Real, currently-sitting MP profile: party/electorate, disabled "voting analysis is being verified" placeholder, mock voting history list | "What has this real MP done?" | Mixed — real identity/electorate data, but "votes" are a fixed per-party assumption, not each MP's actual recorded vote (real vote data exists in `member_votes` but isn't used here — same fixed gap `/leaders`' scorecards have) | Never linked from `/leaders` (the page most likely to be searched for "MPs"); disconnected from the real per-MP vote data that already exists elsewhere in the app | Keep, fix data wiring | `/people/[id]` (MPs) |
| `/u/[handle]` | Ordinary-citizen "civic voice" social profile: civic score, posts, follow | "Who is this Stickee community member?" | Mock — 4 hardcoded fictional profiles, follow is `localStorage`-only | A third, unrelated "person" system alongside MPs and community leaders | Hide until real users exist (or merge into Feed as author profiles) | `/feed/u/[handle]` (or hidden) |
| `/predictions` | Market board + featured market + wallet/portfolio panel + propose-market modal + top-6 leaderboard + Live Election Pulse + recent-simulator-runs strip, all on one page | "What does the crowd think will happen, and can I bet on it?" | Mixed — bill markets partially Supabase-backed; civic/election/mp-vote-category markets always mock (`status: 'demo'`, permanently non-tradeable); wallet is real (Supabase) but portfolio/leaderboard duplicate other surfaces | Leaderboard section duplicates `/leaderboard`'s exact same array; election widget duplicates a feature with no home of its own; wallet here is a *different* wallet system than the one `/leaderboard`/`/profile` use | Simplify (split into Forecasts list + Wallet/Portfolio as account section) | `/forecasts` (+ `/account/wallet`) |
| `/simulator` | Deterministic, client-side "what-if" policy scenario tool (not AI) with recent-run history | "What might happen if a different choice were made?" | Fully mock/generated by design (explicit in-code disclaimer); not a data-quality problem, a labeled sandbox | Reachable from ~8 different entry points across the app via `SimulateThisButton`; also a full top-level nav item | Convert to section (keep the engine, drop the standalone top-level nav slot) | `/issues/[slug]#simulate` or `/forecasts/[id]#simulate` (contextual), engine reused everywhere |
| `/leaderboard` | Sortable ranking table + hardcoded "your rank #14" | "Who's the best predictor?" | Mock — same hardcoded array as `/predictions`' embedded leaderboard; header stats from a *different*, `localStorage`-only wallet system (`useWallet`, not `usePredictionWallet`) | Duplicates `/predictions`' embedded leaderboard section exactly; "your rank" not actually computed from the shown data | Hide until real (or merge as an Account/Forecasts tab) | `/forecasts` (as a ranking tab, real data only) |
| `/impact` | 5-pillar civic scoreboard + per-politician scorecards | "How is Australia doing, pillar by pillar?" | Mock — same `mock-civic-data.ts` the home page already summarizes, presented with "live report card… real metrics" copy despite being explicitly-simulated data | Directly duplicates the home page's pillar section (by design — summary vs. deep-dive) | Keep, fix truthfulness copy | `/` (as the "today" deep-dive) or its own `/civic-score` |
| `/campaigns` | Standalone list of 4 hardcoded advocacy campaigns with a fake (local-state-only) "join" mechanic | "How can I add my voice to a cause?" | Mock — hardcoded array in the page file itself, "join"/"propose"/"share +50pts" are all decorative, no backend | A second, entirely disconnected "campaign" concept from `CampaignModal` (the real, API-connected one embedded only in `/parliament`) | Merge (into the real bill-pressure campaign system) | `/action` (or embedded under Issues/Parliament as bill-pressure campaigns) |
| `/feed` | Ranked activity stream: real Supabase-backed ranking algorithm, but content is dominated by 5 background agents' auto-generated posts, plus a thin genuine user-post layer | "What's the latest civic activity/commentary?" | Mixed — real ranking + real DB table, but "Community" content is mostly machine-authored; falls back to mock seed data when the table is empty (surfaced honestly via a "· seed data" badge) | None structural, but heavy social-network framing (reactions/comments/share/"Community") for what's mostly automated civic alerts | Simplify / re-scope | `/today` (recast as an alert stream) or `/feed` kept but re-labeled |
| `/notifications` | Personal notification inbox | "What do I need to know / act on?" | Mixed — real Supabase when configured+authenticated, else `localStorage`, else a hardcoded 6-item demo array that in practice always masks the true "no notifications" empty state | None structural | Simplify (fix the demo-masking bug) | `/account/notifications` |
| `/profile` | Personal dashboard: streak, badges, wallet points, 5 content tabs (activity/predictions/positions/score/badges) | "What's my civic activity and standing?" | Mock — entirely `localStorage`/hardcoded, including a **hardcoded `isLoggedIn: true`** that bypasses any real auth check | Two more `localStorage`-only mock systems (streak, wallet) layered on top of the ones `/leaderboard` already has | Simplify (make genuinely auth-gated, reduce tabs) | `/account` |
| `/onboarding` | Static "how to use Stickee" 3-card guide page | "How do I get started?" | Static content, no data fetch | A second, unrelated onboarding experience alongside the global first-visit modal (only connected by one outbound link) | Merge (fold into the modal flow or `/account/brief`) | `/account/brief` (or folded into the modal) |
| `/donate` | Real Stripe checkout + hardcoded impact-tier copy | "How do I financially support Stickee?" | Real (Stripe + Supabase `donation_records`) for the transaction; surrounding copy is static | None | Keep | `/support` |
| `/donate/success` | Static thank-you page | "Did my donation go through?" | Static (no live verification shown on this page) | None | Keep | `/support/success` |
| `/donate/cancel` | Static cancellation page | "What happened to my donation?" | Static | None | Keep | `/support/cancel` |
| `/auth/sign-in` | Magic link / password / Google sign-in | "How do I log in?" | Real (Supabase Auth) | None | Keep | `/auth/sign-in` |
| `/auth/sign-up` | 4-step signup wizard | "How do I create an account?" | Real (Supabase Auth) | None | Keep | `/auth/sign-up` |
| `/auth/forgot-password` | Password reset request | "I forgot my password" | Real (Supabase Auth) | None | Keep | `/auth/forgot-password` |
| `/auth/reset-password` | Set new password | "How do I set a new password?" | Real (Supabase Auth) | None | Keep | `/auth/reset-password` |

**Not in the table above (no page, listed for completeness):** no `/privacy`, `/terms`, `/about`, or any legal/informational page exists anywhere in the codebase — confirmed by directory search and a repo-wide grep for "privacy"/"terms"/"cookie policy" returning zero matches, despite a fully-built `CookieBanner` (mounted globally) that contains no link to any policy document at all. This is a gap, not a page to inventory.

---

## Admin pages (internal, auth+role-gated — listed separately per task instructions)

| Route | Purpose | Data | Auth |
|---|---|---|---|
| `/admin` | Overview dashboard: signups/DAU/engagement/donations KPIs, moderation queue, recent signups | Real Supabase (service-role) | Sign-in + `isAppAdmin()`, re-checked per action |
| `/admin/users` | User search/ban/promote/demote/delete | Real Supabase Auth + `user_profiles` | Same |
| `/admin/activity` | Cross-entity audit/activity log | Real Supabase | Same |
| `/admin/agents` | List/enable/disable/manually-run background agents | Real Supabase (`agents`, `agent_runs`) | Same |
| `/admin/agents/[id]` | Single agent detail + run history + manual trigger | Real Supabase | Same |
| `/admin/markets` | Resolve/void prediction markets (real payout/refund) | Real Supabase (`issue_markets`, `resolve_market()`) | Same, triple-checked (page + action + SQL function) |
| `/admin/analytics` | 30-day windowed engagement charts | Real Supabase | Same |

All 7 are internal tooling, functioning as designed on real data. No IA changes recommended beyond what's already noted in prior security audits (`docs/audits/SECURITY_AND_PERMISSIONS_AUDIT.md`).

---

## API routes (internal, not user-facing — listed separately per task instructions)

| Route | Purpose | Auth |
|---|---|---|
| `POST /api/agents/[id]` | Trigger a background agent run | `x-sync-secret`/`Bearer CRON_SECRET` |
| `POST /api/auth/sign-in-otp` | Magic-link sign-in request | Public |
| `GET /api/auth/status` | Current session status | Public (returns anon state if signed out) |
| `POST /api/bills/[billId]/pressure` | Record a bill-pressure campaign action (from `CampaignModal`) | Public/optionally authenticated |
| `GET /api/bills/pressure-summary` | Aggregate pressure counts for the Parliament bill feed | Public |
| `POST /api/donations/checkout` | Create a real Stripe Checkout session | Public |
| `POST /api/donations/webhook` | Stripe webhook (payment confirmation) | Stripe signature |
| `GET /api/election/live` | Live AEC election snapshot | Public, cached |
| `GET /api/electorate-lookup` | Hash-based electorate approximation | Public |
| `POST /api/feed/post` | Create a user feed post | Authenticated (401 otherwise) |
| `GET /api/feed/ranked` | Ranked feed (real algorithm over `feed_posts`, mock fallback) | Public (ranks differently if signed in) |
| `POST/GET /api/feed/react` | Toggle a reaction on a post | Authenticated (401 otherwise) |
| `POST /api/leaders/[id]/support` | Pledge support for a community leader | Authenticated (401 otherwise) — real DB write |
| `POST /api/onboarding` | Persist onboarding modal answers | Authenticated (no-ops for anon) |
| `GET /api/parliament/members` | Live-or-mock parliament member roster | Public |
| `POST /api/sync/divisions` | TheyVoteForYou divisions sync (cron) | Sync secret |
| `POST /api/sync/members` | TheyVoteForYou members sync (cron) | Sync secret |
| `GET /auth/callback` | OAuth/magic-link session exchange | N/A (completes auth) |

---

## Per-page dossiers

Grouped by domain. Each entry covers: purpose · audience · primary question · key sections · data source · quality · primary actions · links in/out · auth · overlap · usefulness · confusion risk · recommendation · destination.

### Home / Today

**`/` (Home)**
- Purpose: national civic-score snapshot + entry points into the rest of the app.
- Audience: first-time and returning visitors alike; the front door.
- Primary question: "What's changing in Australian politics, and where do I go next?"
- Sections: hero + 2 CTAs (`/issues`, `/onboarding`) → national score card (links `/impact`) → 3 quick-action cards (`/decisions`, `/simulator`, `/campaigns`) → 4-of-5 pillar grid (links `/issue/{pillarId}`) → top-3 recent decisions (all link to generic `/decisions`) → bottom CTA (`/onboarding`).
- Data source: `mock-civic-data.ts` (pillars, explicitly labeled simulated in its own header comment) + `mock-government-data.ts` (decisions).
- Data quality: Mock, presented without a "mock/illustrative" label to the visitor.
- Primary actions: navigate only — no forms, no state on this page.
- Auth: none.
- Overlap: pillar section duplicates `/impact` (deliberate summary→deep-dive pairing, acceptable); "recent decisions" links are all identical and go nowhere specific, since decisions have no detail page.
- **Confirmed bug:** the pillar-grid links use `/issue/{pillarId}` (ids like `housing`, `cost-of-living`) but `/issue/[id]` resolves against the *issues* id namespace (`housing-affordability`, `tax-cuts`, etc.) — in the mock-data-fallback state these links do not resolve to the intended content.
- Usefulness: high as a concept (this is the right kind of front door), low as currently built (broken links, unlabeled mock data, decisions link to nowhere specific).
- Confusion risk: Medium — a first-time user's very first click into "an issue" or "a decision" can dead-end or go somewhere generic.
- Recommendation: **Simplify.** Fix the id-namespace bug, label mock data, give decisions somewhere real to link to (see Issues/Decisions merge below).
- Future location: `/` — remains the single entry point, recast explicitly as a "Today" briefing.

### Issues

**`/issues`** — see master table. Recommendation: **Keep** as the canonical list, once merged with Decisions content (see Decisions below) and given one, non-competing detail-page pattern.

**`/issue/[id]`**
- Purpose, audience, question: as in master table.
- Key sections (exhaustive, confirmed by code read): back-link · status/market header · Simulate-this link chip · recent-rehearsals strip · vote-summary tiles · "what's happening"/"who supports"/"who opposes" text · Yes/No pass-prediction poll (real, Supabase `predictions`) · Email-MP flow · prediction-market order-book table with **non-functional Buy Yes/Buy No buttons** (no `onClick`) · 150-row MP vote grid with its own separate, unpersisted "predict how each MP will vote" mini-game bolted onto the same table.
- Data source: Supabase-first with mock fallback (issue text, poll), live-or-mock market widget, hardcoded MP roster/votes.
- Primary actions: vote in the pass/fail poll, open Email-MP modal, guess individual MP votes (goes nowhere), click Buy (does nothing), link out to Simulator.
- Auth: none anywhere on this page.
- Overlap: the market widget duplicates `/predictions`' domain; the MP vote grid duplicates `/parliament`/`/mp/[id]`'s domain. Both are reimplemented here rather than linked.
- Usefulness: high raw content, undermined by an inert (non-clickable) core interactive element and duplicated sub-systems.
- Confusion risk: **High** — a single page trying to be an editorial brief, a live poll, a trading terminal, and an MP scoreboard simultaneously, with one of those four visibly broken.
- Recommendation: **Simplify** into one editorial page (context + real poll + email-MP) with clearly-labeled *links* to a real market ("See the live forecast →") and to the MP's actual voting record (`/people/[id]`), rather than embedding both sub-systems.
- Future location: `/issues/[slug]`.

### Decisions

**`/decisions`** and **`/government`** — see master table for both.
- `/decisions` key sections: search box · level/impact/tag filter chips · `DecisionCard` feed. Each card: badges, sentiment bar (hardcoded like/dislike counts), a **non-functional CTA button**, and — when expanded — a status timeline stepper, effect blurbs, an inline Yes/No mini-poll that can never actually reveal results (its `market` prop is never passed by this route), a dead "Email MP" code path (`showEmailMP` never set true here), and a Simulate-this link.
- Data source: 100% hardcoded, 19 items, zero Supabase.
- Primary actions: search/filter/expand only — every other affordance on the card (CTA button, inline poll reveal, Email MP) is either non-functional or dead code on this specific route.
- Overlap: near-identical page shape to `/issues` (list → filter → expand → status → prediction affordance → email MP) but a completely separate, non-integrated data model and id namespace, and — unlike Issues — **no detail page at all**.
- Usefulness: Medium as content (real, well-written decision summaries), low as a working page (most interactive affordances are decorative).
- Confusion risk: **High** — a user who has just used `/issues` and lands on `/decisions` is looking at what feels like the same product with different (unlinked, sometimes-broken) buttons and no way to explain why two separate systems exist.
- Recommendation: **Merge into Issues** as a content type/filter, not a separate page.
- `/government`: **Remove** (it is a redirect with zero unique content); if kept for backward-compat, it's a one-line legacy alias, not a page.

### Parliament

**`/parliament`**
- Purpose, audience, question: as in master table.
- Key sections: priority-bill spotlight · filterable active-bills feed (bill-pressure campaigns openable here via `CampaignModal`) · "your rep" strip with Email-MP · chamber visualisation (House/Senate/live-election toggle, MP drilldown table, an embedded `ImpactSimulator`, a clickable seat map that is the *only* place on this whole route that links to `/mp/[id]`) · a collapsed "how parliament works" explainer.
- Data source: real Supabase (`members`/`divisions`/`member_votes`) with mock fallback; header KPI tiles are hardcoded literals unrelated to the data below them.
- Overlap: its bill feed duplicates `/issues`'/`/issue/[id]`'s bill concept using different components and a different filtering model; it is the sole home of the real `CampaignModal` (the standalone `/campaigns` page never opens it).
- Usefulness: high — this is the most functionally complete "evidence" surface in the app (real chamber data, real MP data, a real campaign-action API).
- Confusion risk: Medium — "Parliament" and "Issues" both show bill lists with campaign-style actions, using different UI, and a user has no way to know which one is canonical.
- Recommendation: **Simplify** — keep chamber/MP-vote/real-campaign machinery here as the evidence layer; fold its bill *list* into the unified Issues list (Parliament links to specific issues rather than re-listing them).
- Future location: `/government/parliament`.

### People

**`/leaders`** — see master table; the single most misnamed route in the app (it's overwhelmingly an MP table plus a disconnected 5-politician mock block, with the actual "community leaders" concept relegated to one section at the bottom that doesn't even share a name with the page).
- Confirmed: MP rows on this page do not link to `/mp/[id]` at all (clicking only highlights a chamber seat above); only the "Rising Leaders" section links anywhere (`/leaders/[id]`).
- Confusion risk: **High** — the page's own metadata/marketing copy ("Track sitting MPs… discover Australia's rising civic leaders") promises two things and delivers a confusing hybrid of three (MP table, stale mock scorecards, real community leaders).
- Recommendation: **Simplify + rename**, splitting the MP-roster concept from the community-leader concept explicitly.

**`/leaders/[id]`, `/mp/[id]`, `/u/[handle]`** — see master table for each; confirmed as three fully separate data models/id-namespaces with zero code paths that resolve one into another, plus a fourth disconnected duplicate (the `/leaders` page's own "featured politicians" block, which represents 5 real MPs under a third incompatible id scheme with no links at all).
- Recommendation: keep the MP and community-leader detail pages (both have real content/write-paths worth keeping), but give them one consistent, cross-linked "People" home; **hide `/u/[handle]`** until real users exist, since 4 hardcoded fictional citizen profiles with `localStorage`-only follows isn't a real feature yet.

### Markets / Predictions

**`/predictions`** — see master table; confirmed feature list: market board/filters, featured market, stake modal (core), wallet+portfolio panel, propose-market modal (`localStorage`-only, fake review pipeline), top-6 leaderboard (exact duplicate of `/leaderboard`'s array), Live Election Pulse (no dedicated home elsewhere), Recent-Rehearsals strip (Simulator feature).
- **Confirmed: no per-market detail page exists anywhere** (`/predictions/[id]` or similar) — every market's entire on-platform presence is a card on this one list plus whatever fits in a modal.
- **Confirmed: two entirely separate wallet systems** — `usePredictionWallet` (real Supabase, used only here) vs `useWallet` (`localStorage`-only, used by `/leaderboard`/`/profile`/`DailyBonusBanner`) — same "points balance" concept, no shared source of truth, can show different numbers for the same user simultaneously.
- Confusion risk: **High** — a single "Markets" page is simultaneously a trading terminal, a personal finance dashboard, a social ranking board, an election-night tracker, and a UGC submission form.
- Recommendation: **Simplify** — split into a Forecasts list (board + featured + stake, real data only) with wallet/portfolio moved to an Account section, leaderboard either removed or made genuinely account-integrated, election pulse either promoted to its own moment-in-time surface or dropped when no election is live, and propose-market either wired to a real pipeline or removed.
- Future location: `/forecasts` (+ `/account/wallet`).

**`/simulator`** — see master table. Confirmed: fully deterministic client-side engine (documented in-code as not AI/ML), reachable from ~8 different entry points across the app (issues, decisions, leaders, MPs, markets, campaigns) via a shared `SimulateThisButton`/query-param bridge, *and* has its own top-level nav slot.
- Recommendation: **Convert to section** — the engine and its "what-if" value are real and worth keeping everywhere it's linked from; a dedicated top-level nav item for it is disproportionate given it has no independent identity of its own (every entry point is "simulate *this specific thing*").

**`/leaderboard`** — see master table. Confirmed exact-duplicate data source of `/predictions`' embedded leaderboard, plus a header stat block computed from a third, `localStorage`-only wallet/streak system.
- Recommendation: **Hide until ready** (no real ranking data exists yet) or fold into an Account/Forecasts tab once it does.

**`/impact`** — see master table. Deliberate deep-dive of the home page's pillar summary (same data, same computation) — not a bad duplication, but its "live report card… real metrics" framing needs the same truthfulness fix the home page needs.
- Recommendation: **Keep**, fix copy.

### Simulator
Covered above under Markets/Predictions (its natural neighbor by user intent, "what's likely to happen").

### Campaigns / Civic action

**`/campaigns`** — see master table. Confirmed as a second, entirely disconnected "campaign" concept from the real, API-connected `CampaignModal` embedded only in `/parliament`. Every interactive affordance on `/campaigns` itself (join, propose, share-for-points) is decorative/local-state-only.
- Recommendation: **Merge** into the real bill-pressure campaign system (the one that actually calls an API), or clearly relabel as "example campaigns" until wired to the same backend.
- Future location: `/action` (or embedded as a campaigns view under Issues/Parliament).

### Feed / Community

**`/feed`** — see master table. Confirmed: real Supabase-backed ranking algorithm over a `feed_posts` table populated mostly by 5 background agents (parliament-watcher, electorate-pulse, mp-scorecard, bill-stage-tracker, prediction-resolver), with a thin genuine human `user_post` layer; falls back to mock seed data transparently (visible "· seed data" badge) when the table is empty.
- Recommendation: **Simplify / re-scope** — the underlying ranked-alert-stream engine is legitimate and worth keeping, but the social-network framing ("Community," reactions, comments, share, follow) is disproportionate to how little of the content is actually human-generated today. Recast as a civic alert stream first, community layer second.
- Future location: kept as `/feed`, or folded into `/` as "Today's alerts."

### Personalisation / Profile

**`/profile`** — see master table. Confirmed: a hardcoded `DEMO_USER.isLoggedIn = true` means this page renders as "logged in" for every visitor including fully signed-out ones — the single most concerning auth-correctness finding in this audit (not a security hole against real data, since nothing here is real, but a genuine UX/trust bug: a signed-out visitor sees a fake "you" with fake stats and no way to tell it isn't real).
- Recommendation: **Simplify** — wire to real auth (redirect signed-out visitors to sign-in), and consolidate the 5 tabs down to what's backed by real data today.
- Future location: `/account`.

**`/onboarding`** — see master table. Confirmed unrelated to the global `OnboardingModal` beyond one outbound link.
- Recommendation: **Merge** — fold its "how it works" content into the modal's own flow or into an Account "brief" page; a standalone route for static informational content that's otherwise only reachable by direct link is easy to lose.

### Notifications

**`/notifications`** — see master table. Confirmed bug: `displayList = notifications.length > 0 ? notifications : DEMO_NOTIFICATIONS` means the real empty state ("No notifications yet") can never be reached in practice while `DEMO_NOTIFICATIONS` (6 hardcoded items) is non-empty — every new/notification-less user sees fake notifications indistinguishable from real ones, and clicking one calls the real `markRead()` against a nonexistent ID.
- Recommendation: **Simplify** — fix the demo-masking bug (label demo content explicitly, or show the true empty state), keep the page.
- Future location: `/account/notifications`.

### Support / Donations

**`/donate`, `/donate/success`, `/donate/cancel`** — see master table for each. The most functionally "real" cluster in the audit besides admin/auth (genuine Stripe + Supabase). No IA issues found beyond routing depth.
- Recommendation: **Keep** all three, optionally renamed under `/support` for consistency with the rest of the proposed tree.

### Administration
See the admin table above. No changes recommended to this audit's scope beyond what prior security audits already flagged.

### Authentication and legal pages

**`/auth/*`** — all four pages plus `/auth/callback` are real, working, Supabase-backed, and structurally sound. **Keep** all as-is.

**Legal pages** — **do not exist.** No `/privacy`, `/terms`, `/about`, or cookie-policy page anywhere in the codebase, despite a fully-built, globally-mounted `CookieBanner` with zero links to any policy document. This is a gap requiring an owner decision (write real policies, or reduce the cookie banner's implied scope until they exist) rather than a page to rename/merge — flagged here as **requiring owner review**, not a recommendation this audit can make on its own (legal content, not IA).
