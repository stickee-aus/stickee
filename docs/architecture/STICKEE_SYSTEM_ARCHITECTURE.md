Governed by [`AGENTS.md`](../../AGENTS.md) — Stickee's project constitution — and by [`docs/STICKEE_COUNCIL.md`](../STICKEE_COUNCIL.md). Where anything here conflicts with either, they win and this document should be corrected.

# Stickee — System Architecture

Documentation only. No application code, routes, database schema, or production state was changed to produce this document or any other file in `docs/architecture/`.

This is the canonical reference for thinking about Stickee as **systems, not pages**. It supersedes page-by-page thinking for architectural decisions. It does not replace the existing point-in-time audits it draws on — see "Relationship to existing documents" below.

## Why this document exists

Stickee today is legible one page at a time but not as a whole. Two contributors can each build something reasonable and still produce a duplicate wallet, a duplicate leaderboard, or a second "campaign" concept, because nothing names the systems that already exist. This document names them, so that the question "does this already exist?" (`AGENTS.md`'s first engineering principle) has a fixed place to look before every new feature.

A **system** here means: a bounded set of responsibilities with one canonical data source, that multiple pages compose rather than reimplement. A page is not a system. A component is not a system unless it's the shared gateway to one.

## Relationship to existing documents

This document does not re-run the per-page audits already completed in the last two days (dated 2026-08-03 to 2026-08-05, currently uncommitted in the working tree). It builds a systems-level layer on top of them and reconciles it against the current code, which has moved on from some of those audits (notably: the MP Score defect flagged in `docs/audits/DATA_AND_CONTENT_AUDIT.md` is fixed as of commit `e8aab4d`; the 5-item primary navigation described here reflects the new, currently-uncommitted `src/lib/navigation.ts`, not the older `PROPOSED_ROUTE_TREE.md`).

Treat these as still-authoritative for their scope:
- **Page-by-page facts**: `PAGE_AND_ROUTE_INVENTORY.md`, `docs/audits/FEATURE_AND_ROUTE_INVENTORY.md`
- **Content trust findings**: `docs/audits/DATA_AND_CONTENT_AUDIT.md`
- **IA/route consolidation plan**: `INFORMATION_ARCHITECTURE_AUDIT.md`, `PROPOSED_ROUTE_TREE.md`, `CONSOLIDATION_AND_REDIRECT_PLAN.md`
- **Visual design system**: `CIVIC_DESIGN_SYSTEM.md`, `DESIGN_SYSTEM_MIGRATION_ROADMAP.md`
- **Security/permissions**: `docs/audits/SECURITY_AND_PERMISSIONS_AUDIT.md`, `docs/audits/MARKET_ENGINE_AUDIT.md`
- **Governance process**: `docs/STICKEE_COUNCIL.md`, `agents/README.md`

This document is the thing all of those should eventually be *read through*: "which system does this page belong to, and does this finding change that system's health."

---

## The systems

Fourteen systems currently exist in some form. None are invented for this document — each is traced to real files, tables, or routes below. Two "systems" people might expect to see (a Wallet system and a Leaderboard system) are deliberately **not** listed separately: today's wallet code is a component of the Forecast System (it has no purpose independent of staking/settlement), and a leaderboard is a *view* of the Forecast System, currently and wrongly duplicated as if it were its own thing (see System 5 and `FUTURE_SYSTEMS.md`).

### 1. Identity & Access System

| | |
|---|---|
| **Purpose** | Know who a visitor is, whether they're a Stickee account holder, and whether they're an administrator. |
| **Responsibilities** | Sign-up/sign-in/password-reset flows; session/cookie refresh; admin role-gating for every mutating action. |
| **Owner** | Platform/infra — no product-content authority. |
| **Inputs** | Supabase Auth (email/OTP/Google), `app_admins` table, env-listed admin emails. |
| **Outputs** | An authenticated `user`/`session` object available to every server component and route handler; an `isAppAdmin` boolean. |
| **Dependencies** | Supabase Auth only. Has no dependency on any other Stickee system — this is intentional and should stay true. |
| **Shared components** | `src/lib/supabase.ts`, `src/lib/supabase-server.ts`, `src/lib/supabase-admin.ts`, `src/lib/admin-auth.ts`, `AuthButton.tsx`. |
| **Canonical data source** | Supabase Auth (`auth.users`) + `app_admins`. |
| **Current problems** | `proxy.ts` (the Next.js 16 rename of `middleware.ts`) refreshes the session cookie only — it does not gate routes. Every route/layout is individually responsible for its own check, with no fail-closed backstop and no lint rule catching an omitted check on a new mutating route (see `docs/audits/SECURITY_AND_PERMISSIONS_AUDIT.md`). `middleware.ts` is deleted and `proxy.ts` is untracked — an in-progress, uncommitted rename that should be committed deliberately. |
| **Future direction** | Add a lightweight, testable convention (e.g. a `requireUser()`/`requireAdmin()` helper that every mutating route/action must call, checked by a project lint rule or test) rather than trusting per-file discipline indefinitely. |

### 2. Government Record System

| | |
|---|---|
| **Purpose** | Be Stickee's single, verifiable record of what the Australian Parliament actually did: who sits where, what bills exist, how each MP voted. This is the evidentiary backbone the whole "civic intelligence" claim depends on. |
| **Responsibilities** | Sync real MPs/divisions/votes from TheyVoteForYou; store and serve them; support the Issues list, Parliament chamber views, and MP profiles from one underlying dataset. |
| **Owner** | Data & Evidence Steward (see `agents/data-evidence-steward.md`). |
| **Inputs** | TheyVoteForYou API (`/api/sync/members`, `/api/sync/divisions`, cron-triggered), manually-authored issue/decision editorial content. |
| **Outputs** | `members`, `divisions`, `member_votes` rows; `issues` rows; rendered chamber views, bill lists, MP vote records. |
| **Dependencies** | Agent Automation System (sync jobs run through the same cron/secret mechanism as the other agents). |
| **Shared components** | `src/lib/parliament-db.ts`, `src/lib/live-parliament.ts`, `src/lib/issues-db.ts`, `HouseChamber.tsx`, `SenateView.tsx`, `MPVoteGrid.tsx`, `BillTracker.tsx`, `BillStageTimeline.tsx`. |
| **Canonical data source** | Supabase tables `members`, `divisions`, `member_votes`, `issues`, populated by real sync — **not** the `mock-data.ts`/`mock-parliament-data.ts`/`mock-senate-data.ts` fixtures that currently sit alongside it as silent fallbacks. |
| **Current problems** | The "Supabase-first, mock-fallback-on-empty" pattern used by `/issues`, `/issue/[id]`, `/parliament`, and `/mp/[id]` means a user cannot tell from the UI whether they're looking at the real record or a fixture (`docs/audits/DATA_AND_CONTENT_AUDIT.md` §1). `mock-data.ts`'s `whoSupports`/`whoOpposes` party-position claims render with no citation despite `issues.source_url` existing and going unused. The bill list is duplicated between `/issues` and `/parliament` using different components over the same underlying concept. |
| **Future direction** | Per `CONSOLIDATION_AND_REDIRECT_PLAN.md`: one bill/issue list (Issues), Parliament keeps chamber+vote content only. Every fallback-to-mock path should either be removed or render an explicit "no verified data available" state instead of silently substituting fiction, per `AGENTS.md`'s truthfulness section. |

### 3. Civic Indicator System

| | |
|---|---|
| **Purpose** | Answer "how is Australia doing, pillar by pillar" (housing, cost of living, health, etc.) with a small number of trustworthy, sourced national indicators. |
| **Responsibilities** | Store indicator time series and pillar scores; compute grades; attribute per-politician pillar ratings. |
| **Owner** | Data & Evidence Steward. |
| **Inputs** | Intended to be ABS/government statistical releases (not yet wired); currently nothing feeds the real tables at all. |
| **Outputs** | Pillar grades/trends shown on the home page and `/impact`. |
| **Dependencies** | None currently — this is the system's core defect (see below). |
| **Shared components** | `PillarCard.tsx`, `PillarGradeChip.tsx`, `PillarScoreboard.tsx`, `CivicScorecard.tsx`, `src/lib/civic-utils.ts`. |
| **Canonical data source** | **Should be** `pillar_metrics`, `pillar_time_series`, `pillar_scores`, `politician_pillar_ratings`, `scoring_weights` (migration `003_civic_metrics.sql`) — a real, source-attributed schema that **is never referenced by any application code today**. **Is actually** `src/lib/mock-civic-data.ts`, a static fixture, on both the home page and `/impact`. |
| **Current problems** | This is the clearest "two parallel architectures, only one wired up, and it's the wrong one" case in the app. A real schema exists, unused; a mock file stands in for it, unlabeled, on the two most-visited pages (home, `/impact`) with copy that says "live report card… real metrics." `PillarCard.tsx` and `PillarGradeChip.tsx` also duplicate the same grade→colour logic independently. |
| **Future direction** | Either populate `pillar_metrics` from a real source and switch the UI to read it, or remove the "live"/"real metrics" claim and clearly label the pillar section as illustrative until it is. Do not add a second indicator pipeline — extend the existing schema. |

### 4. People System

| | |
|---|---|
| **Purpose** | Answer "who represents me, and who's trying to" — two related but distinct kinds of person: sitting MPs (real, elected, from the Government Record System) and community-nominated aspiring leaders (a Stickee-native concept). |
| **Responsibilities** | MP directory and profile pages; community leader nomination, profile, endorsement, and "readiness"/credibility narrative. |
| **Owner** | Data & Evidence Steward (MPs) + Product Strategist (community leaders — a product concept, not an evidence one). |
| **Inputs** | Government Record System (for MPs); user nominations + endorsements (for community leaders). |
| **Outputs** | `/people`-bound pages (currently at `/leaders`, `/mp/[id]`, `/leaders/[id]`); `leader_supports` rows. |
| **Dependencies** | Government Record System (MP identity/vote data); Identity & Access System (endorsement write-paths are auth-gated). |
| **Shared components** | `LeaderProfileDetail.tsx`, `EndorsementPanel.tsx`, `NominationModal.tsx`, `CredibilityScore.tsx`, `MPAvatar.tsx`, `MPActionStrip.tsx`. |
| **Canonical data source** | MPs: `members`/`member_votes` (real). Community leaders: `leader_supports` (real support-pledge writes) layered over `src/lib/mock-leaders-data.ts` (fictional nomination/profile content — by design, not yet a real nomination pipeline). |
| **Current problems** | One route (`/leaders`) currently mixes three separate person-concepts (an MP table, a disconnected 5-politician "featured" mock block with a third, incompatible ID scheme, and the real community-leader section) with no cross-linking between the MP table and `/mp/[id]`. The "Stickee Score" defect that used to conflate MP identity with fabricated voting data is fixed (commit `e8aab4d`), but the code path is deliberately preserved behind `NEXT_PUBLIC_MP_SCORE_ENABLED`, not deleted — see `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` for what re-enabling it legitimately requires. `/u/[handle]` is a *third*, structurally unrelated "person" concept (ordinary citizens' social profiles) that should not be confused with either MP or community-leader identity. |
| **Future direction** | Split into one People landing with two clearly labeled sections, per `PROPOSED_ROUTE_TREE.md`. Do not build a fourth person-type. `/u/[handle]` belongs conceptually to the Feed & Activity System's authorship model, not to this system — see Domain Model. |

### 5. Forecast System

| | |
|---|---|
| **Purpose** | Let the crowd express and be scored on probability estimates about real civic outcomes (will a bill pass, etc.), and hold the one real points ledger those estimates are staked against. |
| **Responsibilities** | Market listing/eligibility; staking; the points wallet (balance, positions); resolution/settlement; payout. |
| **Owner** | Software Architect (correctness/settlement integrity) + Product Strategist (market design). |
| **Inputs** | `issues`/`issue_markets` (from the Government Record System), user stakes, admin resolution actions. |
| **Outputs** | `wallet_positions`, updated `user_wallets` balances, resolved market outcomes. |
| **Dependencies** | Government Record System (a market only exists in relation to a real bill/issue); Identity & Access System (staking requires a user); Agent Automation System (`prediction-resolver` agent). |
| **Shared components** | `MarketCard.tsx`, `FeaturedMarketCard.tsx`, `PredictionMarketGrid.tsx`, `StakeModal.tsx`, `PortfolioPanel.tsx`, `src/lib/market-eligibility.ts`, `src/lib/predictions-db.ts`. |
| **Canonical data source** | `issue_markets`, `user_wallets`, `wallet_positions`, with `place_wallet_stake()` and `resolve_market()` (migration `017_market_lifecycle_and_settlement.sql`) as the only correct write path — verified against a real Supabase environment per `AGENTS.md`'s "verified infrastructure" list. |
| **Current problems** | `FeaturedMarketCard` has an independent demo-market path that does not read from the same source as the standard market list — the exact "one domain, two sources of truth" anti-pattern the constitution names explicitly. `src/hooks/useWallet.ts` is a second, `localStorage`-only wallet, disconnected from the real Supabase wallet, feeding `/leaderboard` and parts of `/profile` — a genuine duplicate ledger, not just a duplicate UI. `ProposeMarketModal.tsx` has full client state for a market proposal that **never persists** — it is decorative. There is no admin path found for resolving/closing System B (`issue_markets`) markets at all (`docs/audits/FEATURE_AND_ROUTE_INVENTORY.md`). Non-bill "markets" (civic/election/MP-vote-category) are permanently mock (`status: 'demo'`) and non-tradeable by `market-eligibility.ts` design — this is correct behaviour, not a bug, but should stay explicit. |
| **Future direction** | Retire `useWallet.ts` entirely in favour of `usePredictionWallet.ts` (the real one). Give `FeaturedMarketCard` the same `getMarketEligibility()`/`predictions-db.ts` source the rest of the system uses (the home page's newest, currently-uncommitted code already does this correctly for its own featured slot — generalise that pattern). Build the missing resolve/close admin path for `issue_markets`, or explicitly document why staking exists without it. |

### 6. Scenario Simulation System

| | |
|---|---|
| **Purpose** | Let a user ask "what if a different policy choice were made instead" and see a clearly-labeled, deterministic, non-AI modeled consequence — explicitly a sandbox, never a market input. |
| **Responsibilities** | Run the deterministic cohort-based simulation engine; render outcome comparisons; persist recent runs locally. |
| **Owner** | Product Strategist. |
| **Inputs** | A `Scenario`/`Alternative` pair, built from any real object (issue, bill, decision, leader, campaign, market) via the simulator bridge, or a seed scenario. |
| **Outputs** | A `SimulationResult` (pillar/market/leader impact projections) — never written back into any other system's real data. |
| **Dependencies** | None structurally, by design — reads from other systems only as *input framing*, never as a data dependency, and never writes to them. |
| **Shared components** | `src/lib/simulator-engine.ts`, `src/lib/simulator-bridge.ts`, `SimulateThisButton.tsx`, `ScenarioSelector.tsx`, `OutcomeMatrix.tsx`. |
| **Canonical data source** | Entirely self-contained: `src/lib/mock-simulator-data.ts`'s synthetic 12-cohort population. This is a legitimate use of synthetic data because the system's whole purpose is modeling, not reporting fact — the only requirement is that it stay legible as such. |
| **Current problems** | Reachable from ~8 different entry points and also holds its own standalone top-level nav slot — this is the one place in the app where a self-contained, well-isolated system is over-exposed as a *page* rather than a *feature*. `RecommendationCard.tsx`'s "Best decision for the country" badge and glow effect reuse market-resolution visual grammar, which risks implying a simulated outcome carries market-verified certainty — a labeling risk, not a data risk. |
| **Future direction** | Per `CONSOLIDATION_AND_REDIRECT_PLAN.md`: keep the route (deep-linkable) but drop it from primary navigation; keep every contextual entry point. Do not let this system grow a dependency on real data it would need to keep "live" — that would break the isolation that makes it safe. |

### 7. Civic Action System

| | |
|---|---|
| **Purpose** | Convert an opinion into a real, counted action a citizen can take on a specific bill — the platform's actual "participation" mechanic. |
| **Responsibilities** | Record support/oppose pressure on a bill; aggregate and display pressure; let a user email their MP; run time-boxed pressure campaigns. |
| **Owner** | Civic Technology Advisor + Product Strategist. |
| **Inputs** | User stance submissions (optionally anonymous via client-supplied session id), electorate/MP mapping. |
| **Outputs** | `bill_pressures` rows; aggregate pressure summaries; email-MP mailto/action flows. |
| **Dependencies** | Government Record System (a pressure action only exists in relation to a real bill); Personalisation System (electorate → local MP, for targeted email-MP). |
| **Shared components** | `CampaignModal.tsx`, `BillCampaignCard.tsx`, `EmailMPButton.tsx`, `EmailMPModal.tsx`, `SwingVotePanel.tsx`, `GapExplainerPanel.tsx`. |
| **Canonical data source** | `bill_pressures` (real, migration `005_bill_pressures.sql`), via `/api/bills/[billId]/pressure` and `/api/bills/pressure-summary`. |
| **Current problems** | A **second, entirely disconnected "campaign" concept** exists at the standalone `/campaigns` route: a hardcoded 4-item array with a fake, local-state-only "join"/"propose"/"share +50pts" mechanic that persists nothing. This is the constitution's "duplicate business logic" problem in its most literal form — one real system, one theatrical stand-in, both called "campaigns." `BillCampaignCard.tsx`'s 3D coin-flip interaction is a game-app pattern with no civic analogue and is flagged in `CIVIC_DESIGN_SYSTEM.md` as an interaction-model violation independent of data truthfulness. Anonymous pressure submissions trust a client-supplied session id as the upsert key (low-impact griefing vector, not a trust/data-integrity risk). |
| **Future direction** | Retire the standalone `/campaigns` page's fake mechanic; promote the real `CampaignModal` system (currently reachable only from `/parliament`) to a first-class, linked destination, per `CONSOLIDATION_AND_REDIRECT_PLAN.md`'s `/action` proposal. Do not build a second real campaign backend — extend `bill_pressures`. |

### 8. Feed & Activity System

| | |
|---|---|
| **Purpose** | Be a dated, sourced stream of what just happened in Australian civic life and around the platform — civic alerts first, human commentary second. |
| **Responsibilities** | Rank and serve posts; accept human posts, reactions, and comments; ingest agent-authored civic alerts. |
| **Owner** | Civic Technology Advisor (ranking/content) + Software Architect (ranking algorithm correctness). |
| **Inputs** | Agent Automation System (civic-alert/decision-update posts), human user posts/reactions/comments. |
| **Outputs** | `feed_posts`, `feed_reactions`, `comments` rows; the ranked feed payload consumed by `/feed`. |
| **Dependencies** | Agent Automation System (a large share of content); Identity & Access System (posting/reacting requires auth); People/Government Record Systems (posts reference real bills/MPs). |
| **Shared components** | `src/lib/feed/ranker.ts`, `FeedPost.tsx` *(dead — see problems)*, `CommentDrawer.tsx`. |
| **Canonical data source** | `feed_posts` + `feed_reaction_counts` view, served via `/api/feed/ranked`, falling back to `mock-feed-data.ts` seed content only when the table is genuinely empty (the one fallback in the app that is honestly surfaced in-UI via a "· seed data" badge — a pattern worth reusing elsewhere, not removing). |
| **Current problems** | `feed_posts.source_agent_id` is captured specifically to disclose automated authorship and is then **dropped by `rowToFeedPost` before reaching the client** — bot-authored civic-alert posts are visually indistinguishable from human commentary under the same "Stickee" byline (`docs/audits/DATA_AND_CONTENT_AUDIT.md` §4, P1). `src/components/FeedPost.tsx` and `src/app/feed/page.tsx.bak` are dead code with their own divergent styling, not imported anywhere live. |
| **Future direction** | Restore `source_agent_id` (or a derived `is_automated` + agent name) to the client shape and add a visible automated-content label — this is a truthfulness fix, not a redesign. Delete the dead `FeedPost.tsx`/`page.tsx.bak` rather than migrating them. |

### 9. Agent Automation System

| | |
|---|---|
| **Purpose** | Run the deterministic background compute that turns raw synced civic data into feed content, notifications, and derived scores — Stickee's "civic intelligence" engine room. |
| **Responsibilities** | Execute seven scheduled jobs against real data; log every run; expose manual trigger + history to admins. |
| **Owner** | Software Architect. |
| **Inputs** | Vercel Cron (9 schedules), `x-sync-secret`/`Bearer CRON_SECRET`-gated `/api/agents/[id]`. |
| **Outputs** | Writes to `feed_posts`, `notifications`, `pillar_scores`-adjacent tables, `user_wallets` (daily bonus), `agent_runs` (execution log). |
| **Dependencies** | Government Record System (source data for `parliament-watcher`, `bill-stage-tracker`, `mp-scorecard`); everything it writes into (Feed, Notification, Wallet). |
| **Shared components** | `src/lib/agents/runner.ts`, `registry.ts`, and the seven handlers: `parliament-watcher`, `bill-stage-tracker`, `mp-scorecard`, `electorate-pulse`, `prediction-resolver`, `moderation-triage`, `daily-bonus`. |
| **Canonical data source** | `agents` + `agent_runs` tables; every handler is confirmed (by direct code read) to be deterministic template-string interpolation over real DB rows — **none call an LLM**, despite the "agent" name inviting that assumption. |
| **Current problems** | `mp-scorecard`'s output writes to `user_profiles` matched by `display_name === MP name` — a fragile join that's effectively inert in practice, since MPs aren't typically platform users. Naming ("agent") without any UI disclosure of "deterministic, not AI" risks the opposite trust problem to the usual one: understating how mechanical the system is, right where the constitution asks for AI-generated content to be clearly distinguishable from everything else. |
| **Future direction** | If/when any handler becomes LLM-backed, it must gain explicit AI-generated-content labeling per `AGENTS.md`'s truthfulness section before shipping — this system's current "deterministic-only" property is a feature to preserve deliberately, not an accident to silently outgrow. `docs/AGENT_AUTOMATION_ROADMAP.md` (a separate, unimplemented proposal) covers automating the *Governance Council*'s PR review, not this runtime agent system — do not conflate the two "agent" concepts. |

### 10. Notification System

| | |
|---|---|
| **Purpose** | Tell a specific user what they personally need to know or act on. |
| **Responsibilities** | Store, deliver, and mark-read in-app notifications; manage web-push subscription/permission. |
| **Owner** | Civic Technology Advisor. |
| **Inputs** | Agent Automation System (bill-stage/pressure-result notifications), direct system events (e.g. donation receipt). |
| **Outputs** | `notifications` rows, unread-count badge, optional push delivery. |
| **Dependencies** | Identity & Access System; Agent Automation System; Personalisation System (which notifications are relevant to which user's electorate/interests). |
| **Shared components** | `useNotifications.ts`, `usePushNotifications.ts`, `PushPermissionBanner.tsx`. |
| **Canonical data source** | `notifications`, `push_subscriptions`. |
| **Current problems** | `/notifications` falls back through real Supabase → `localStorage` → a hardcoded 6-item demo array, and in practice the demo array **always masks the true "no notifications yet" empty state** for a new/logged-out user (`PAGE_AND_ROUTE_INVENTORY.md`). |
| **Future direction** | Remove the hardcoded demo-array fallback; show a genuine empty state per `AGENTS.md`'s "no verified data available" instruction. |

### 11. Personalisation System

| | |
|---|---|
| **Purpose** | Tailor what a user sees (their MP, their electorate's pulse, their onboarding) without requiring them to look it up manually. |
| **Responsibilities** | Detect/store electorate; run first-visit onboarding; persist stated preferences. |
| **Owner** | Product Strategist. |
| **Inputs** | User-entered postcode/location, onboarding modal choices. |
| **Outputs** | Electorate → local-MP mapping used by the Civic Action System's email-MP flow and the Agent Automation System's `electorate-pulse` digest. |
| **Dependencies** | People System (local MP lookup); Government Record System. |
| **Shared components** | `useElectorate.ts`, `OnboardingModal.tsx`, `/api/electorate-lookup`. |
| **Canonical data source** | `onboarding_events`; electorate detection is **not yet real** — see problems. |
| **Current problems** | `/api/electorate-lookup` is confirmed (by its own code comment) "hash-based, not truly geographic" — it uses hardcoded state bounding boxes and a mock MP map, not a real postcode/geo → electorate service. Anything downstream that personalises by electorate (email-MP targeting, `electorate-pulse` digests) inherits this unreliability silently. A second, static onboarding experience exists at `/onboarding` (informational only, no persistence), disconnected from this system's real, persisting first-visit modal — a naming collision more than an architecture one. |
| **Future direction** | Replace the lookup with a real electorate boundary service (e.g. a proper geocoder against AEC electorate boundaries) before any feature depends on its output for something user-facing and consequential. Fold the static `/onboarding` page into this system's real flow rather than maintaining two "onboarding" experiences. |

### 12. Moderation & Trust System

| | |
|---|---|
| **Purpose** | Keep user-generated content (feed posts, comments) safe and policy-compliant. |
| **Responsibilities** | Accept content reports; classify them; record moderation actions. |
| **Owner** | Legal & Regulatory Advisor (policy) + Software Architect (implementation). |
| **Inputs** | User-submitted reports on feed content. |
| **Outputs** | `content_reports`, `moderation_actions` rows; triage classification. |
| **Dependencies** | Feed & Activity System (the content being moderated); Agent Automation System (`moderation-triage` classifies reports, deterministically — no LLM). |
| **Shared components** | `moderation-triage.ts` agent handler; no dedicated moderation UI component found in the current inventory. |
| **Canonical data source** | `content_reports`, `moderation_actions`. |
| **Current problems** | No admin-facing moderation queue/UI was found beyond the `moderation-triage` agent's classification step — action on a triaged report appears to require direct database access today. This is a real gap, not a duplication problem. |
| **Future direction** | Build the missing admin moderation queue before the Feed system's user-generated surface (comments, posts) scales past a size a human can monitor by other means. |

### 13. Donation & Support System

| | |
|---|---|
| **Purpose** | Let visitors financially support Stickee. |
| **Responsibilities** | Stripe checkout session creation; webhook-verified payment confirmation; donation record-keeping. |
| **Owner** | Software Architect (payment correctness) + Legal & Regulatory Advisor (compliance). |
| **Inputs** | Stripe Checkout, Stripe webhooks (HMAC-verified). |
| **Outputs** | `donation_records` rows. |
| **Dependencies** | Identity & Access System (optional — donation can be attributed to a logged-in user). |
| **Shared components** | `DonateAmountForm.tsx`, `/api/donations/checkout`, `/api/donations/webhook`. |
| **Canonical data source** | `donation_records` (migrations `009`, `010`). |
| **Current problems** | None found structurally — this is the most cleanly isolated real system in the app (`docs/audits/FEATURE_AND_ROUTE_INVENTORY.md` rates every part "Working"). Surrounding impact-tier copy is static marketing text, not itself a data-trust problem. |
| **Future direction** | Keep isolated. Do not let it acquire dependencies on any other system beyond Identity & Access. |

### 14. Live Election System

| | |
|---|---|
| **Purpose** | Surface a real-time view of an in-progress Australian election when one is happening. |
| **Responsibilities** | Scrape/parse the AEC Tally Room; serve a normalized live snapshot. |
| **Owner** | Data & Evidence Steward. |
| **Inputs** | AEC Tally Room (live HTML scrape). |
| **Outputs** | A `LiveElectionSnapshot`, or an explicit inactive/fallback snapshot when no election is live. |
| **Dependencies** | None on other Stickee systems. |
| **Shared components** | `src/lib/aec-election.ts`, `src/lib/aec-election-types.ts`, `useLiveElection.ts`, `LiveElectionPulse.tsx`, `/api/election/live`. |
| **Canonical data source** | The live AEC scrape itself — there is no database table because this system is intentionally stateless/pass-through. |
| **Current problems** | The scrape target's HTML changing would silently break parsing, with no alerting found. The widget is currently permanently embedded on `/predictions` regardless of whether an election is actually live, taking up real estate for an inactive feature most of the time. |
| **Future direction** | Per `CONSOLIDATION_AND_REDIRECT_PLAN.md`: render only when `useLiveElection().active` is true, on a seasonal/contextual surface rather than a permanent slot. Add basic scrape-failure alerting given it has no fallback data source. |

---

## Deliberately not listed as systems

- **Wallet.** Not independent — it is the ledger component of the **Forecast System**. The existence of a *second*, `localStorage`-only wallet (`useWallet.ts`) is a defect to fix, not a second system to document.
- **Leaderboard.** A view over Forecast System data, currently implemented twice with the same hardcoded array (`/leaderboard` standalone, and embedded in `/predictions`) instead of once. Should be one ranking view, not a system.
- **Engagement/Gamification (streaks, badges, daily bonus).** This is a cross-cutting *layer*, not a system with its own purpose distinct from the systems it decorates (Forecast's daily bonus, Feed's/Notification's badges). The constitution explicitly names "another gaming platform" as a direction Stickee must not become — this layer should be evaluated for reduction, not given systemic legitimacy by documenting it as a first-class system. See `SYSTEM_BOUNDARIES.md`.
- **Navigation and Visual Design.** Real and important, but infrastructure that every system's pages sit inside, not a domain system with its own canonical data. Covered by `src/lib/navigation.ts` (nav) and `CIVIC_DESIGN_SYSTEM.md` (visual system) respectively.

---

## Final summary table

| System | Purpose | Primary Objects | Pages Using It | Single Source of Truth | Current Health | Priority | Owner Decision Required |
|---|---|---|---|---|---|---|---|
| Identity & Access | Know who's asking | User, Session, Admin | Every page (implicitly) | Supabase Auth + `app_admins` | Good, but no fail-closed backstop | Medium | Adopt a required `requireUser()`/`requireAdmin()` convention? |
| Government Record | Real parliamentary record | Bill/Issue, Division, MP, Vote | `/issues`, `/parliament`, `/mp/[id]`, `/decisions` | `issues`, `members`, `divisions`, `member_votes` | Mixed — real core, silent mock fallbacks | **High** | Remove or clearly label every mock-fallback path |
| Civic Indicator | National pillar scorecard | Pillar, Indicator, PillarScore | `/`, `/impact` | Should be `pillar_metrics`; is `mock-civic-data.ts` | **Poor — real schema unused, mock in production** | **Critical** | Fund wiring pillar data to real sources, or relabel as illustrative |
| People | MPs + community leaders | MP, Community Leader | `/leaders`, `/mp/[id]`, `/leaders/[id]` | `members` (MP) / `leader_supports`+mock (leader) | Mixed — recently improved (Score fix) | Medium | Approve `/people` split (`PROPOSED_ROUTE_TREE.md`) |
| Forecast | Crowd probability + real ledger | Market, Wallet, Position | `/predictions`, `/leaderboard`, home | `issue_markets`, `user_wallets`, `wallet_positions` | Mixed — verified core, duplicate wallet exists | **High** | Approve retiring `useWallet.ts`; fund market resolution admin UI |
| Scenario Simulation | Modeled "what if" | Scenario, SimulationResult | `/simulator` (+8 contextual entries) | `mock-simulator-data.ts` (by design) | Good — isolated, labeled | Low | Approve demotion from primary nav |
| Civic Action | Real participation | Bill Pressure, Campaign | `/parliament`, `/campaigns` | `bill_pressures` | Mixed — real system + fake duplicate | **High** | Approve retiring `/campaigns`' fake mechanic |
| Feed & Activity | Civic alert + commentary stream | FeedPost, Reaction, Comment | `/feed` | `feed_posts` | Mixed — real ranking, unlabeled bot authorship | Medium | Approve restoring `source_agent_id` to client |
| Agent Automation | Background civic compute | Agent, AgentRun | `/admin/agents` (+ all systems it writes into) | `agents`, `agent_runs` | Good — deterministic, logged, tested pattern | Low | None currently blocking |
| Notification | Personal alerts | Notification, PushSubscription | `/notifications` | `notifications` | Poor — demo array masks real empty state | Medium | None — straightforward fix |
| Personalisation | Tailored experience | Electorate, OnboardingEvent | Embedded across Action/Notification | `onboarding_events`; electorate lookup is fake | **Poor — geolocation is not real** | **High** | Fund a real electorate/geo service |
| Moderation & Trust | Content safety | ContentReport, ModerationAction | (no dedicated UI) | `content_reports`, `moderation_actions` | Gap — no queue UI | Medium | Fund admin moderation queue |
| Donation & Support | Fund the platform | Donation | `/donate` | `donation_records` | **Good** | Low | None |
| Live Election | Real-time election data | ElectionSnapshot | `/predictions` (permanent slot) | Live AEC scrape (stateless) | Good, but overexposed placement | Low | Approve contextual-only rendering |
