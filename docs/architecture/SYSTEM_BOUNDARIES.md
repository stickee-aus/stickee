Governed by [`AGENTS.md`](../../AGENTS.md). Companion to [`STICKEE_SYSTEM_ARCHITECTURE.md`](STICKEE_SYSTEM_ARCHITECTURE.md). Documentation only, no code changed.

# Stickee — System Boundaries

For every system: what problem it solves, what should never be added to it, which other systems may legitimately interact with it, who owns the truth of its data, and what a future contributor should specifically avoid doing to it. This is the document to read before adding a field, a table, or a feature to an existing system — most new-feature mistakes are boundary violations, not bad ideas in isolation.

---

### Identity & Access
- **Problem solved:** Who is asking, and are they an admin.
- **Never belongs here:** Any product/content logic. No system-specific role beyond "admin" — a Forecast-specific permission or a Feed-specific role is that system's own concern, layered on top of, not inside, this one.
- **May interact with:** Everything, one-directionally (everything depends on it; it depends on nothing).
- **Owns the truth:** Supabase Auth for identity; `app_admins` for admin status.
- **Avoid:** Adding a second admin-check convention. Adding a new mutating route/action without an explicit auth check — there is no fail-closed backstop, so this is the one system where silence is dangerous.

### Government Record
- **Problem solved:** What Parliament actually did — the platform's evidentiary spine.
- **Never belongs here:** Editorializing beyond what's sourced. Opinion, forecast probability, or simulated outcomes — those belong to Forecast and Scenario Simulation respectively, linked from here, not folded in.
- **May interact with:** People (MP identity), Forecast (a market about a bill), Civic Action (pressure on a bill), Feed (alerts about it), Agent Automation (the sync jobs that populate it).
- **Owns the truth:** TheyVoteForYou sync for MPs/divisions/votes; editorial authorship for issue summaries — but never a mock fixture standing in silently for either.
- **Avoid:** Adding a new mock-fallback path. Every existing one is already a truthfulness risk (per `docs/audits/DATA_AND_CONTENT_AUDIT.md`); don't add a ninth.

### Civic Indicator
- **Problem solved:** A small number of trustworthy national scorecards.
- **Never belongs here:** A per-page bespoke "score" — `PillarCard.tsx` and `PillarGradeChip.tsx` already independently duplicated grade→colour logic once; a third implementation should never happen. Any indicator without a documented source and methodology.
- **May interact with:** People (per-politician pillar ratings), Government Record (indicators plausibly should be influenced by tracked issues, not yet wired).
- **Owns the truth:** Should be `pillar_metrics` et al.; is currently `mock-civic-data.ts` — until this is fixed, **no new feature should be built on top of the mock file**, since it would inherit the defect rather than help fix it.
- **Avoid:** Adding new mock pillars. Adding a UI claim of "live"/"real" without the underlying data being real.

### People
- **Problem solved:** Who represents a citizen (MP), and who's trying to (community leader) — kept as two clearly labeled kinds of person, not one.
- **Never belongs here:** A third person-type. Any score that describes an MP's *individual* record without being computed from `member_votes` — this is the exact defect already fixed once (`e8aab4d`); reintroducing it in a new form is the single most likely regression in this system.
- **May interact with:** Government Record (MP identity/votes), Identity & Access (endorsement writes), Personalisation (local-MP lookup).
- **Owns the truth:** `members`/`member_votes` for MPs; `leader_supports` for real support pledges (leader *profile content* remains illustrative by design).
- **Avoid:** Building a feature against the mock 5-politician "featured" block instead of the real MP list — it has a third, incompatible ID scheme and should not gain new dependents.

### Forecast
- **Problem solved:** Crowd probability estimates on real outcomes, staked against one real points ledger.
- **Never belongs here:** A second wallet. A second market source. Any "demo" market presented without an explicit non-tradeable state — `market-eligibility.ts` exists specifically to make this an enforced rule, not a convention; route new market types through it, don't bypass it.
- **May interact with:** Government Record (a market references a real issue), Identity & Access (staking requires a user), Agent Automation (resolution).
- **Owns the truth:** `issue_markets`, `user_wallets`, `wallet_positions`, and only the RPCs (`place_wallet_stake`, `resolve_market`) — never a direct table write from application code, and never `useWallet.ts`.
- **Avoid:** Reading or writing wallet balance/positions anywhere except through the verified RPC path. Building a new "featured" or "leaderboard" surface that reads its own fixture instead of `predictions-db.ts`/`market-eligibility.ts`.

### Scenario Simulation
- **Problem solved:** A labeled, deterministic "what if" sandbox.
- **Never belongs here:** A write path back into any real system. A claim of predictive certainty about the real world — every output must stay legible as modeled, not measured.
- **May interact with:** Anything, but only as read-only input framing at scenario-construction time — never as an ongoing dependency.
- **Owns the truth:** Its own synthetic cohort population; nothing else.
- **Avoid:** Wiring the simulator's output into a Forecast market, a Civic Indicator score, or any other "real" surface — that would collapse the isolation that makes this system safe to be fully synthetic.

### Civic Action
- **Problem solved:** A real, counted civic action a citizen can take (support/oppose a bill, email an MP).
- **Never belongs here:** A second, decorative "campaign" mechanic — this already exists once as a mistake (`/campaigns`) and must not be reintroduced under a different name (e.g. a "petitions" feature with its own local-state-only join button).
- **May interact with:** Government Record (the bill being pressured), Personalisation (electorate → MP targeting).
- **Owns the truth:** `bill_pressures`.
- **Avoid:** Building any new "take action" feature outside this system's schema. Trusting a client-supplied identifier for anything beyond the current low-stakes anonymous-pressure case.

### Feed & Activity
- **Problem solved:** A dated stream of civic alerts and human commentary.
- **Never belongs here:** Unlabeled automated content. Any agent-authored post shape that doesn't carry `source_agent_id` (or its client-facing equivalent) all the way to render.
- **May interact with:** Agent Automation (majority content source), Identity & Access, Government Record/People (referenced entities).
- **Owns the truth:** `feed_posts` + `feed_reaction_counts`.
- **Avoid:** Resurrecting `FeedPost.tsx` or `page.tsx.bak` — they are dead code with their own divergent styling; delete rather than reuse.

### Agent Automation
- **Problem solved:** Deterministic background compute over real data.
- **Never belongs here:** An LLM call without explicit AI-generated-content labeling shipped in the same change. A new agent that writes to a table it doesn't have a clear, tested contract for (per `mp-scorecard`'s fragile `display_name` join — don't repeat that pattern).
- **May interact with:** Every system it reads from or writes into (see dependency graph in `RELATIONSHIP_GRAPH.md`) — by design, this is the most interconnected system, which raises the bar for changes here, not lowers it.
- **Owns the truth:** `agents`, `agent_runs`; each handler is the source of truth for its own output table's *writes*, never a second write path into the same table from elsewhere.
- **Avoid:** Adding a new agent outside `runner.ts`'s tracked-execution pattern. Silently changing what "agent" implies (currently: deterministic, no LLM) without updating the trust story that depends on that fact being true.

### Notification
- **Problem solved:** Personal, actionable alerts.
- **Never belongs here:** A hardcoded fallback that could ever be mistaken for real content — the existing demo array's masking of the empty state is exactly this mistake; don't add a second one anywhere in this system's fallback chain.
- **May interact with:** Identity & Access, Agent Automation (trigger source), Personalisation (relevance).
- **Owns the truth:** `notifications`, `push_subscriptions`.
- **Avoid:** Layering more fallback tiers instead of fixing the existing ones.

### Personalisation
- **Problem solved:** Tailoring the experience to a specific user's electorate/preferences.
- **Never belongs here:** Any consequential feature relying on the current electorate lookup without first checking it's the (currently fake) hash-based implementation — treat its output as unverified until replaced.
- **May interact with:** People (MP lookup), Government Record, Civic Action, Notification.
- **Owns the truth:** `onboarding_events`; electorate detection has no trustworthy source yet.
- **Avoid:** Building a second "onboarding" experience — fold new first-visit content into the existing real modal flow, not a new static page.

### Moderation & Trust
- **Problem solved:** Keeping user-generated content safe.
- **Never belongs here:** Automated *punitive* action without a human review step — `moderation-triage` classifies, it should not be extended to silently ban/remove without an admin-facing queue existing first.
- **May interact with:** Feed & Activity (content), Agent Automation (triage), Identity & Access (admin action).
- **Owns the truth:** `content_reports`, `moderation_actions`.
- **Avoid:** Scaling Feed's user-generated surface (more post types, wider posting access) before this system's missing admin queue exists — that ordering compounds risk, not just debt.

### Donation & Support
- **Problem solved:** Real financial contributions.
- **Never belongs here:** Any dependency on another system beyond Identity & Access. Keep this system boring and isolated — its cleanliness is a feature.
- **May interact with:** Identity & Access only.
- **Owns the truth:** `donation_records`, Stripe.
- **Avoid:** Coupling donation tiers/perks to Engagement-layer gamification (points, badges) — that would import this system's real-money surface into the constitution's explicitly-disfavoured gaming-loop territory.

### Live Election
- **Problem solved:** Real-time election results when one is live.
- **Never belongs here:** Persisted historical state — this system is deliberately stateless; if historical election data is ever needed, that's a new object (see `DOMAIN_MODEL.md`'s Election entry), not an extension of this scrape.
- **May interact with:** People/Government Record (MP outcomes), but read-only and one-directional.
- **Owns the truth:** The live AEC scrape itself.
- **Avoid:** Making any other system depend on this one being available — it has no fallback data source, so a scrape failure should degrade gracefully (inactive snapshot), never cascade.

---

## Cross-cutting layers (not systems — treat differently)

### Engagement / Gamification layer (streaks, badges, daily bonus)
- **Problem it currently solves:** Retention mechanics layered onto Forecast, Feed, and People.
- **What should never belong here:** Independent product legitimacy. The constitution names "another gaming platform" as an explicit non-goal — this layer should not be pointed to as justification for new streak/badge/points surfaces. Any expansion request should be treated as a design-philosophy question requiring owner sign-off, not a routine feature add.
- **May interact with:** Forecast (daily bonus → wallet), Feed/People (badges) — always as a thin decoration on a real system's real data, never with its own independent data model beyond what already exists.
- **Owns the truth:** `user_streaks` (real); most badge logic is client-side/`localStorage` (`useBadges.ts`), which is itself a sign this layer hasn't been treated as core.
- **Avoid:** Growing this layer's footprint. If anything, it is a candidate for reduction per the constitution, not extension — see `FUTURE_SYSTEMS.md`.

### Navigation & Information Architecture
- **Problem it solves:** One consistent primary-nav registry across Navbar, BottomNav, and Command Palette.
- **What should never belong here:** Business logic. `src/lib/navigation.ts` should stay a pure registry (label, href, icon, active-matching) — if it starts branching on user role or feature flags beyond simple auth-gating, that's a sign it's absorbing a responsibility that belongs to Identity & Access or a specific system.
- **May interact with:** Every system, read-only (it links to them; it is never a data dependency of them).
- **Owns the truth:** `src/lib/navigation.ts` — already correctly the single source for all three nav surfaces as of the current uncommitted redesign.
- **Avoid:** Reintroducing a second nav list anywhere (a hardcoded link array inside a specific component) — this was the exact problem the new registry was built to solve.

### Visual Design System
- **Problem it solves:** One consistent visual language.
- **What should never belong here:** A fifth (or sixth) parallel styling dialect — `CIVIC_DESIGN_SYSTEM.md` already documents four coexisting systems in the current codebase; adding a new component with its own ad hoc Tailwind choices instead of the documented tokens perpetuates exactly that problem.
- **May interact with:** Every page/component, one-directionally.
- **Owns the truth:** `CIVIC_DESIGN_SYSTEM.md`'s token/type/spacing specification (not yet implemented in code as of this writing).
- **Avoid:** Treating the home page's current styling as the reference implementation — per that document's own audit, the home page redesign itself violates 5 of 6 constitution design checks and needs correction, not imitation.
