Governed by [`AGENTS.md`](../../AGENTS.md). Companion to [`STICKEE_SYSTEM_ARCHITECTURE.md`](STICKEE_SYSTEM_ARCHITECTURE.md). Documentation only, no code changed.

# Stickee — Page Composition Guide

Every user-facing route, described as a composition of systems rather than as a standalone feature. Two states are given per page: **Composes today** (what the code actually calls, verified by file read) and **Should compose** (the target, once each system's canonical-source problems in `STICKEE_SYSTEM_ARCHITECTURE.md` are fixed). Where they differ, that gap is the page's real architectural debt — not new information, but the systems-level restatement of what the existing per-page audits found.

A future contributor's rule of thumb: **before adding logic to a page, check whether the system it belongs to already has that logic.** If a page needs to render "what MPs think," that is the Government Record System's job, not a per-page reimplementation.

---

## Today (`/`)

- **Composes today:** Civic Indicator (mock), Government Record (mock decisions), Forecast (real, as of the current uncommitted redesign — `getLiveBillMarkets()` + `getMarketEligibility()`).
- **Should compose:** Civic Indicator (real), Government Record (real, top issues), Forecast (real featured market — already correct), Personalisation (a real "your electorate" strip, once Personalisation's geo lookup is real).
- **Note:** This page is the platform's front door and currently the single largest concentration of the Civic Indicator System's core defect (real schema unused, mock rendered as "live"). Fixing Civic Indicator fixes this page's biggest truthfulness problem for free.

## Issues (`/issues`, `/issue/[id]`)

- **Composes today:** Government Record (Supabase-first, mock-fallback), Forecast (embedded market widget on detail page), People (embedded MP vote grid on detail page).
- **Should compose:** Government Record (sole source for issue content, evidence, timeline), Forecast (a linked forecast summary chip, not a re-implemented order book), People (a linked "how MPs voted" summary, not a re-implemented 150-row grid), Civic Action (an email-MP/pressure entry point), Scenario Simulation (a contextual "explore scenarios" link).
- **Note:** Per `CONSOLIDATION_AND_REDIRECT_PLAN.md`, the detail page currently *reimplements* pieces of the Forecast and People systems inline instead of linking to their canonical surfaces — the composition-guide fix here is mechanical (replace embedded widgets with links) once the canonical surfaces exist.

## Decisions (`/decisions`) and Government (`/government`)

- **Composes today:** Government Record (100% mock — no Supabase read at all); `/government` composes nothing, it is a bare redirect to `/decisions`.
- **Should compose:** Government Record only — as a status/type filter *within* Issues, not a separate page with a separate mock dataset. This is a merge, not a new composition.

## Parliament (`/parliament`)

- **Composes today:** Government Record (real chamber/vote data, mock fallback), Civic Action (the only page that can currently open `CampaignModal`), Live Election (chamber toggle to live results).
- **Should compose:** Government Record, Civic Action, Live Election (contextual, not permanent), People (link out to MP profiles from every MP shown in-chamber). Should **stop** composing a duplicate bill list — that belongs to Issues.

## People (`/leaders`, `/mp/[id]`, `/leaders/[id]`)

- **Composes today:** People (MPs: real+mock hybrid; community leaders: real support-write + mock profile), Forecast (a disconnected mock scorecard block), Agent Automation (indirectly, via the now-flagged-off `mp-scorecard` feed).
- **Should compose:** People (both MP and community-leader sections, clearly labeled, cross-linked to each other and to `/mp/[id]`), Government Record (real vote history surfaced on the MP profile, which exists in the database today and is simply not read here).

## Forecasts (`/predictions`, `/leaderboard`)

- **Composes today:** Forecast (real bill markets + real wallet; also a second, disconnected mock civic/election/vote-category market set), Live Election (permanently embedded), People (top-6 leaderboard, duplicated verbatim between the two pages).
- **Should compose:** Forecast only, as the sole ranking/wallet/portfolio surface; Live Election contextually, not permanently; the leaderboard should be one view, reused, not duplicated across two routes.

## Simulator (`/simulator`)

- **Composes today:** Scenario Simulation only — the cleanest, most correctly-isolated composition in the app. No dependency leakage into Forecast, Government Record, or anything else.
- **Should compose:** Unchanged, but reached only via contextual entry points rather than also holding a standalone primary-nav slot (per `CONSOLIDATION_AND_REDIRECT_PLAN.md`).

## Impact (`/impact`)

- **Composes today:** Civic Indicator (same mock source the home page uses).
- **Should compose:** Civic Indicator (real), People (real per-politician pillar ratings, from the currently-unused `politician_pillar_ratings` table). This page is Civic Indicator's natural "deep dive" companion to Today's summary — the duplication between them is by design and should stay, once both read real data.

## Campaigns (`/campaigns`)

- **Composes today:** Nothing real — a hardcoded array with no system behind it at all, a "fake system" masquerading as a composition.
- **Should compose:** Civic Action (the real `bill_pressures`/`CampaignModal` system), promoted to a first-class page instead of `/parliament`-only.

## Feed (`/feed`)

- **Composes today:** Feed & Activity (real ranking), Agent Automation (majority of content), Identity & Access (posting/reacting gate).
- **Should compose:** Unchanged, plus visible authorship disclosure (Agent Automation posts should be labeled as such — see Feed & Activity System problems).

## Notifications (`/notifications`)

- **Composes today:** Notification (real, when configured+authenticated), falling back to `localStorage`, falling back to a hardcoded demo array that masks the real empty state.
- **Should compose:** Notification only, with a genuine empty state as the final fallback, never fabricated content.

## Profile (`/profile`)

- **Composes today:** Identity & Access (bypassed — hardcoded `DEMO_USER.isLoggedIn = true`), Forecast (a third wallet reference), Engagement layer (streaks/badges, `localStorage`).
- **Should compose:** Identity & Access (real gate), Forecast (the one real wallet), Personalisation (real preferences), Notification (a summary), with the Engagement layer reduced per `SYSTEM_BOUNDARIES.md`, not expanded.

## Onboarding (`/onboarding`)

- **Composes today:** Nothing — static content, disconnected from Personalisation's real first-visit modal.
- **Should compose:** Personalisation — folded into the real onboarding flow rather than existing as a second, static "how to use Stickee" page.

## Civic-voice profile (`/u/[handle]`)

- **Composes today:** Nothing real — 100% mock profiles, `localStorage`-only follow.
- **Should compose:** Feed & Activity (as the authorship/profile view for real posters), Identity & Access. Not a fourth person-type alongside MP and Community Leader (see People System) — this is Feed's author-identity concept, scoped separately from People.

## Donate (`/donate`, `/donate/success`, `/donate/cancel`)

- **Composes today and should compose, unchanged:** Donation & Support, Identity & Access (optional attribution). The one page cluster with no gap between current and target composition.

## Auth (`/auth/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`)

- **Composes today and should compose, unchanged:** Identity & Access only.

## Admin (`/admin`, `/admin/users`, `/admin/activity`, `/admin/agents(/[id])`, `/admin/markets`, `/admin/analytics`)

- **Composes today:** Identity & Access (admin gate on every page + every mutating action), and per-page: Identity & Access (Users), Agent Automation (Agents), Forecast (Markets — resolve/void), Feed/Notification/Donation/Forecast (Activity, Analytics — cross-system read-only dashboards).
- **Should compose:** Same, plus Moderation & Trust (the missing moderation queue belongs here once built).

---

## Composition anti-patterns already found (do not repeat these)

1. **Reimplementing instead of linking** (`/issue/[id]`'s embedded market widget and MP-vote grid) — a page that needs another system's data should link to that system's canonical surface, not rebuild a smaller version of it inline.
2. **A second data source for the same object** (`FeaturedMarketCard`'s independent demo-market path; `/leaders`' disconnected mock scorecard block) — every composition should resolve to the one canonical source named in `STICKEE_SYSTEM_ARCHITECTURE.md`, never a parallel fixture chosen for convenience.
3. **A page that is its own system** (`/campaigns`, `/u/[handle]`, the old `/leaderboard` array) — if a page's data has no home in any system's canonical source, that is a signal the page is fake, not that it's an independent system worth documenting.
