# Secondary Pages Audit

Governed by [`AGENTS.md`](../../AGENTS.md). Covers every secondary page named in the audit brief. Findings verified against `PAGE_AND_ROUTE_INVENTORY.md`'s per-page dossiers (Generation 1) and the batch reports that have since shipped fixes to several of these pages (Batch 1, Batch 2.5) — reconciled with current `git status` (none of the files below have changed since those reports, except where noted).

---

## `/decisions` {#decisions}

**Current state (post-Batch-8, confirmed current):** A truthful transitional page — heading "Verified executive-decision records are being prepared," an `EmptyState`, one link to `/parliament`, an honest note that this section "doesn't yet include the full parliamentary record." No search box, no filter chips, no decision cards, no agreement percentages.

**Truthfulness classification:** Page content → **no verified data available, correctly and explicitly stated**. This is now one of the most honest pages in the app.

**OUTPUT PER PAGE:**
**CURRENT PURPOSE:** An honest placeholder for a merged-away concept (Decisions), pointing to the real evidence layer.
**PROPOSED PURPOSE:** Should not exist as a separate route once Batch 9/11 lands — its content type folds into Issues.
**SINGLE QUESTION:** What was decided? (currently unanswerable truthfully; correctly says so)
**PRIMARY USER:** Anyone who followed an old bookmark, nav memory, or external link expecting "Decisions."
**WHAT IS REAL:** The honest framing itself.
**WHAT IS FAKE:** Nothing — this is the one page in the app built specifically to stop being fake.
**WHAT TO KEEP:** The honest transitional pattern, as the template for any future "not yet real" page.
**WHAT TO REMOVE:** The route itself, once Batch 9/11's merged Issues list can serve as the redirect target — not before.
**PRIMARY ACTION:** Go to `/parliament`.
**EMPTY STATE:** Already the page's entire content — correct.
**IMPLEMENTATION PRIORITY:** P2 — not broken, but a stale route that should retire once its destination exists, not be left as a permanent fixture.
**OWNER DECISIONS:** Whether `/decisions` becomes a redirect (to `/issues?type=decision`) once the merge lands, per `CONSOLIDATION_AND_REDIRECT_PLAN.md`'s redirect table — explicitly **not created by this or any prior audit**, still pending.

---

## `/government` (redirect) {#government-redirect}

**Current state:** A bare `redirect('/parliament')` — zero UI of its own, confirmed unchanged since Batch 8.

**OUTPUT PER PAGE (condensed):** No content to audit. **RECOMMENDATION:** Keep as a one-line legacy redirect, or repurpose as a real `/government` hub route once the executive/legislature split (see `GOVERNMENT_PAGE_AUDIT.md`) is built — an explicit, still-open owner decision per `PAGE_REFACTOR_BATCH_2_REPORT.md` §7 ("no identity of its own"). **PRIORITY:** P3.

---

## `/leaderboard` {#leaderboard}

**Current state (post-Batch-1, confirmed current):** `LeaderboardGrid.tsx` shows an honest "predictor rankings aren't available yet" message. The fabricated `#14 "your rank"` and `RankDelta` widget are removed.

**Truthfulness classification:** Empty state → **no verified data available, correctly stated**.

**OUTPUT PER PAGE (condensed):**
**CURRENT PURPOSE:** A standalone ranking page with nothing real to rank yet.
**PROPOSED PURPOSE:** One real ranking view, computed from `wallet_positions`, reused (not duplicated) wherever a leaderboard appears.
**WHAT TO REMOVE:** The route as a *second* leaderboard surface — Forecasts previously embedded the same concept; both are now correctly empty, but should converge on one real query when either becomes real, not two.
**WHAT TO MOVE:** Once real, this becomes an Account/Forecasts tab, not necessarily a standalone top-level route (`CONSOLIDATION_AND_REDIRECT_PLAN.md`).
**PRIMARY ACTION:** N/A — nothing to rank yet; the page's only honest job right now is saying so.
**IMPLEMENTATION PRIORITY:** P2 — hidden-until-real is already effectively true via the honest empty state; building the real ranking query is real, scoped work (`CONTENT_HIERARCHY.md` §4).
**OWNER DECISIONS:** Whether to build the real ranking query now or leave this page dormant until Forecasts' wallet consolidation (Batch 12) makes the underlying data trustworthy enough to rank.

---

## `/campaigns` {#campaigns}

**Current state (post-Batch-1, confirmed current):** Fabricated participant counts and milestone claims are now labeled illustrative; the fake join/propose mechanics are disabled; cards link to `/parliament`, where the real `CampaignModal`/`bill_pressures` system lives.

**Truthfulness classification:** Participant counts → **demo, correctly labeled** (not removed, labeled — per the constitution's "prefer labeling over deleting when no real replacement exists yet" instruction, correctly applied here). Cards' outbound links → **navigational, correct**.

**OUTPUT PER PAGE:**
**CURRENT PURPOSE:** A labeled-illustrative advocacy list, pointing to the real action system.
**PROPOSED PURPOSE:** Retired as a standalone route; the real system (`CampaignModal`) is promoted to a first-class, linked destination instead — per `CONSOLIDATION_AND_REDIRECT_PLAN.md`'s `/action` proposal.
**SINGLE QUESTION:** How can I add my voice to a cause? (currently answered by illustrative content pointing to the real answer, not by the real answer directly)
**WHAT IS REAL:** The outbound links to `/parliament`'s real mechanism; the native-share function (the "+50pts" claim attached to it was removed).
**WHAT IS FAKE (labeled, not hidden):** The illustrative participant/milestone counts.
**WHAT TO REMOVE:** The page's independent "campaign" concept, in favour of one real `CampaignModal`/`bill_pressures` system reachable from Issues/Government/Parliament directly.
**WHAT TO MERGE:** Into the real bill-pressure system — see `CIVIC_ACTION_MODEL.md`.
**PRIMARY ACTION:** Currently: click through to a real bill's campaign. Proposed: the campaign action itself lives here, real, not one hop away.
**IMPLEMENTATION PRIORITY:** P1 — two "campaign" concepts (even with one now clearly labeled fake) is still a genuine user-confusion risk per `INFORMATION_ARCHITECTURE_AUDIT.md` finding #1.
**OWNER DECISIONS:** Should `/action` (the eventual real destination) be bill-specific only, matching what `CampaignModal` already does, or does the product want independently-trackable campaigns beyond a single bill (new scope, not consolidation) — per `PAGE_REFACTOR_ROADMAP.md` Batch 6.

---

## `/profile` {#profile}

**Current state (post-Batch-1, confirmed current):** Real `useAuthStatus()` gate (the hardcoded `DEMO_USER.isLoggedIn = true` is removed); genuine signed-out/loading/signed-in states; Score/Activity/Predictions tabs show truthful empty states instead of fabricated percentages, other users' posts, or `Math.random()`-generated "crowd %."

**Truthfulness classification:** Auth state → **verified fact** (real Supabase session). Empty tab states → **no verified data available, correctly stated**. Streak-freeze purchase → **verified fact, but honestly re-labeled** ("stored on this device, not your account," per Batch 1 §7) — still spending `useWallet`'s local balance, a separate, non-canonical currency.

**OUTPUT PER PAGE (condensed):**
**CURRENT PURPOSE:** Real, auth-gated personal dashboard with mostly-empty (correctly so) content tabs.
**PROPOSED PURPOSE:** `/account` — real preferences, real wallet (the one real one), a notification summary.
**WHAT IS REAL:** Auth gate, email display, the (relabeled) local streak-freeze spend.
**WHAT IS FAKE/UNSUPPORTED:** None currently live — `WeeklyReportCard`'s fabricated percentile rank is confirmed removed (unused, not deleted — flagged for Batch 7-style cleanup).
**WHAT TO REMOVE:** The `useWallet` (localStorage) balance as a second "points" concept once Forecasts' wallet consolidation (Batch 12) lands — this page is one of `useWallet`'s two remaining live call sites.
**WHAT TO ADD:** A real notification summary; real preferences (electorate, followed issues) once Personalisation is real.
**PRIMARY ACTION:** View real personal status; sign in if signed out.
**IMPLEMENTATION PRIORITY:** P2 — already truthful; remaining work is consolidation (wallet), not truthfulness.
**OWNER DECISIONS:** How prominently "my points" should live here once wallet consolidation happens (`CONSOLIDATION_AND_REDIRECT_PLAN.md` dependency #3).

---

## `/notifications` {#notifications}

**Current state (post-Batch-1, confirmed current):** `DEMO_NOTIFICATIONS` (the 6-item hardcoded array that previously masked the real empty state) is removed entirely; the real empty state is always reachable; distinct loading/error states added to `useNotifications.ts`.

**Truthfulness classification:** All states → **verified fact** (real Supabase) or **no verified data available, correctly stated** (empty).

**OUTPUT PER PAGE (condensed):**
**CURRENT PURPOSE / PROPOSED PURPOSE:** Unchanged — a real, per-user alert inbox; already matches its proposed purpose.
**WHAT IS FAKE:** Nothing — this page has no open truthfulness finding.
**IMPLEMENTATION PRIORITY:** P3 — no action required beyond the general Account-section relocation (`/account/notifications`) when that IA work happens.

---

## `/impact` {#impact}

**Current state (confirmed current — NOT touched by Batch 8's `/impact` change, which only removed `CivicScorecard`'s per-politician scoring; the page's pillar-level national scoreboard is untouched):** `PillarScoreboard` still renders `mock-civic-data.ts`'s synthetic 5-pillar national score, unlabeled as demo/illustrative, with copy that has historically read "live report card… real metrics" (per `CIVIC_DESIGN_SYSTEM.md`'s ground-truth note — confirm current copy before this specific wording claim is re-cited, but the underlying data source is confirmed still 100% mock).

**Truthfulness classification:** Pillar grades/scores → **hardcoded, presented as if live**. This is the same defect class already fixed on the Home page (Batch 1) and on Government (Batch 8) — **not yet fixed here**, and independently named in `AGENTS.md`'s own "Current Known Product Debt" list.

**OUTPUT PER PAGE:**
**CURRENT PURPOSE:** A 5-pillar civic scoreboard presented as a live indicator.
**PROPOSED PURPOSE:** A real, sourced deep-dive companion to Today's (currently empty, correctly so) national-snapshot section.
**SINGLE QUESTION:** How is Australia doing, pillar by pillar?
**PRIMARY USER:** Someone who clicked through from Today's (future) snapshot wanting the full picture.
**WHAT IS REAL:** Nothing on this page's current core content — a real, unused schema exists (`pillar_metrics`, `pillar_scores`, `politician_pillar_ratings`, migration `003_civic_metrics.sql`) that this page should read from and does not (`docs/architecture/STICKEE_SYSTEM_ARCHITECTURE.md` System 3, rated "Critical" priority).
**WHAT IS FAKE:** The entire pillar-grade/score display, sourced from `mock-civic-data.ts`, a static fixture whose own header comment describes it as simulated.
**WHAT TO REMOVE:** The scoreboard's "live"/authoritative framing, immediately — either replace with real `pillar_metrics` data or an honest empty state matching what Home and Government already correctly do.
**WHAT TO KEEP:** The page's structural pairing with Home (deliberate summary → deep-dive relationship, architecturally sound).
**PRIMARY ACTION:** Understand national civic-indicator trends (currently unfulfillable truthfully).
**EMPTY STATE (target):** "Verified national indicators are being prepared" — identical wording already shipped on Home; this page should match it, not diverge.
**IMPLEMENTATION PRIORITY:** **P0** — this is the single largest unfixed truthfulness gap of any secondary page: real, named, structured infrastructure exists and goes unused while a labeled-as-live mock stands in its place, on a page whose whole purpose is exactly this kind of claim.
**OWNER DECISIONS:** Fund wiring `pillar_metrics` to a real source (ABS or equivalent), or explicitly relabel this page as illustrative until it is — `docs/architecture/STICKEE_SYSTEM_ARCHITECTURE.md`'s own recommendation, still open.

---

## `/simulator` {#simulator}

**Current state:** Fully deterministic, explicitly labeled (not AI/ML) in-code; reachable from ~8 contextual entry points app-wide via `SimulateThisButton`.

**Truthfulness classification:** Simulation outputs → **demo content, explicitly and correctly labeled** as illustrative modeling, not fact or forecast. This is a legitimate, well-executed use of synthetic data.

**OUTPUT PER PAGE (condensed):**
**CURRENT PURPOSE:** Both a standalone top-level-adjacent page and a contextual "what-if" tool.
**PROPOSED PURPOSE:** Contextual only — the engine and every entry point stay; the standalone landing page's prominence is what should reduce.
**WHAT IS FAKE:** Nothing mislabeled — this is a sandbox by design, correctly disclosed.
**WHAT TO REMOVE:** Its outsized promotion (quick-link on Today's hero-adjacent row, per `TODAY_PAGE_AUDIT.md`) relative to having no independent object of its own.
**RISK:** `RecommendationCard.tsx`'s "Best decision for the country" badge/glow reuses market-resolution visual grammar — a labeling risk (implying simulated certainty), not a data risk (`docs/architecture/STICKEE_SYSTEM_ARCHITECTURE.md` System 6).
**IMPLEMENTATION PRIORITY:** P2 — no truthfulness defect, a placement/prominence fix only.
**OWNER DECISIONS:** Approve demotion from primary-nav-adjacent placement, per `CONSOLIDATION_AND_REDIRECT_PLAN.md`.

---

## `/donate`, `/donate/success`, `/donate/cancel` {#donate}

**Current state:** Real Stripe Checkout + Supabase `donation_records`, webhook-verified. Confirmed the cleanest, most structurally sound cluster in the app across every audit generation.

**Truthfulness classification:** Transaction flow → **verified fact**. Surrounding impact-tier copy → **sourced analysis / editorial framing**, static but not itself a truthfulness violation.

**OUTPUT PER PAGE (condensed):** No IA, truthfulness, or structural issue found. **RECOMMENDATION:** Keep unchanged. **PRIORITY:** P3 (cosmetic-only, e.g. optional rename to `/support*` for terminology consistency — low priority, can defer indefinitely).

---

## `/onboarding` {#onboarding}

**Current state:** A static 3-card "how to use Stickee" page with zero data-collection fields, disconnected from the real, persisting `OnboardingModal` (which only appears automatically on first visit, with no button anywhere that reopens it). **This is the destination Today's "Personalise my brief"/"Build my brief" CTAs point to** — see `TODAY_PAGE_AUDIT.md`.

**Truthfulness classification:** Page content → **static/informational, not a factual claim** — not itself fabricated, but functionally **unsupported** in context, since the buttons that lead here promise personalisation this page cannot deliver.

**OUTPUT PER PAGE:**
**CURRENT PURPOSE:** A static informational page about how Stickee works.
**PROPOSED PURPOSE:** Either become the real personalisation flow's destination (collecting electorate/issues), or be retired in favour of always reopening `OnboardingModal`.
**SINGLE QUESTION:** How do I get started? (answered informationally, not functionally)
**PRIMARY USER:** Someone who clicked "Personalise my brief" expecting to configure something.
**WHAT IS REAL:** The informational content itself is accurate about what Stickee does.
**WHAT IS FAKE/UNSUPPORTED:** Its implicit promise (via every link that points here) that clicking through personalises anything.
**WHAT TO MERGE:** Fold this page's "how it works" content into `OnboardingModal`'s own flow, or into a rebuilt `/account/brief`.
**PRIMARY ACTION:** Currently: read three cards. Proposed: actually set electorate/issues.
**IMPLEMENTATION PRIORITY:** P1 — this is a Council-corroborated finding (`STICKEE_V1_EXECUTIVE_SUMMARY.md` Consensus C7, rated "Blocking friction" by the UX Journey Analyst) precisely because both of Today's homepage CTAs lead here and neither can complete its promised job.
**OWNER DECISIONS:** Rebuild `/onboarding` as a real data-collecting page, or always reopen `OnboardingModal` instead — the same decision noted in `TODAY_PAGE_AUDIT.md`, should not be made twice.

---

## Authentication pages (`/auth/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/auth/callback`) {#auth}

**Current state:** Real Supabase Auth (magic link/password/Google sign-in, 4-step signup wizard, password reset, OAuth callback). Confirmed structurally sound and unchanged across every audit generation.

**Truthfulness classification:** N/A — no political or civic claims rendered on these pages.

**OUTPUT PER PAGE (condensed):** No issue found. **RECOMMENDATION:** Keep unchanged. **PRIORITY:** Not applicable — no work items.

---

## `/u/[handle]` {#u-handle}

**Current state:** 4 hardcoded fictional "civic voice" citizen profiles (civic score, posts, follow), `localStorage`-only follow mechanic.

**Truthfulness classification:** Entire page content → **demo content, currently unlabeled as such**. A visitor has no way to tell these are not real Stickee users.

**OUTPUT PER PAGE:**
**CURRENT PURPOSE:** A social profile page for ordinary citizens, entirely fictional.
**PROPOSED PURPOSE:** Either hidden until real user-generated profiles exist, or repurposed as Political Pulse's real author-identity view for genuine human posters (`docs/architecture/PAGE_COMPOSITION_GUIDE.md`).
**SINGLE QUESTION:** Who is this Stickee community member? (currently answered with fiction)
**PRIMARY USER:** Someone who clicked a feed-post byline or found this via the Command Palette.
**WHAT IS REAL:** Nothing — 4 hardcoded profiles, no real user data.
**WHAT IS FAKE:** The entire object, presented indistinguishably from a real user profile.
**WHAT TO REMOVE / HIDE:** This route, until real users exist — matches `AGENTS.md`'s own "hide until ready" instruction directly, and `CONSOLIDATION_AND_REDIRECT_PLAN.md`'s explicit recommendation.
**PRIMARY ACTION:** N/A — should not be reachable at all in its current form.
**IMPLEMENTATION PRIORITY:** P1 — this is a live instance of presenting fictional people as real, the exact pattern `AGENTS.md`'s truthfulness section exists to prevent, structurally identical in kind (though lower in stakes, since these are not real named public figures) to the now-fixed MP-scoring defects.
**OWNER DECISIONS:** Hide the route entirely now, or scope it as Political Pulse's real author-identity feature (a genuinely different, smaller, real-data-only build) — these are two different paths, not two severities of the same fix.

---

## Summary table

| Page | Health | Priority |
|---|---|---|
| `/decisions` | 🟢 Honest | P2 |
| `/government` (redirect) | 🟢 Fine | P3 |
| `/leaderboard` | 🟢 Honest | P2 |
| `/campaigns` | 🟡 Labeled-fake, still duplicative | P1 |
| `/profile` | 🟢 Honest | P2 |
| `/notifications` | 🟢 Good | P3 |
| `/impact` | 🔴 Fabricated, presented as live | **P0** |
| `/simulator` | 🟢 Honest, over-promoted | P2 |
| `/donate*` | 🟢 Good | P3 |
| `/onboarding` | 🟡 Honest content, broken promise | P1 |
| `/auth/*` | 🟢 Good | — |
| `/u/[handle]` | 🔴 Fictional people presented as real | P1 |
