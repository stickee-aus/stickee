Governed by [`AGENTS.md`](../../AGENTS.md). Documentation only, no code changed.

# Stickee — System Glossary

Terms as used specifically within Stickee's architecture. Where a term maps to a real table or file, that's given; where it names something that doesn't exist yet, that's stated explicitly.

## Systems

- **Identity & Access System** — auth, session, admin-role gating. Owns Supabase Auth + `app_admins`.
- **Government Record System** — the real parliamentary evidence base: MPs, divisions, votes, issues/bills. Owns `members`, `divisions`, `member_votes`, `issues`.
- **Civic Indicator System** — national pillar scorecards (housing, cost of living, etc.). Should own `pillar_metrics` et al.; currently backed by mock data instead.
- **People System** — MPs (real) and Community Leaders (Stickee-native concept), kept as two labeled kinds of person under one system.
- **Forecast System** — crowd probability markets + the one real points ledger (wallet). Owns `issue_markets`, `user_wallets`, `wallet_positions`.
- **Scenario Simulation System** — the deterministic, self-contained "what if" sandbox. Owns nothing outside its own synthetic dataset.
- **Civic Action System** — real, counted participation (bill pressure, email-MP). Owns `bill_pressures`.
- **Feed & Activity System** — the ranked civic-alert + commentary stream. Owns `feed_posts`, `feed_reaction_counts`.
- **Agent Automation System** — the seven deterministic background jobs. Owns `agents`, `agent_runs`.
- **Notification System** — personal alerts. Owns `notifications`, `push_subscriptions`.
- **Personalisation System** — electorate/preference tailoring. Owns `onboarding_events`; electorate detection is not yet real.
- **Moderation & Trust System** — content safety triage. Owns `content_reports`, `moderation_actions`.
- **Donation & Support System** — real financial contributions. Owns `donation_records`.
- **Live Election System** — real-time AEC results pass-through. Owns no table (stateless by design).

## Cross-cutting layers (not systems)

- **Engagement/Gamification layer** — streaks, badges, daily bonus. A decoration on top of real systems, not a system with independent purpose; the constitution treats expansion of this layer as a design-philosophy question requiring explicit approval.
- **Navigation & IA** — the single primary-nav registry (`src/lib/navigation.ts`) shared by Navbar, BottomNav, and Command Palette.
- **Visual Design System** — the token/type/spacing specification in `CIVIC_DESIGN_SYSTEM.md`, not yet fully implemented in code.

## Domain objects

- **Issue / Bill / Decision** — the unit of "something government is considering or has decided." Currently two incompatible data models (real `issues` table vs. mock `Decision` type) that should merge — see `DOMAIN_MODEL.md`.
- **Division** — a real parliamentary vote event, synced from TheyVoteForYou (`divisions` table).
- **Member Vote** — one MP's recorded vote on one Division (`member_votes` table).
- **Forecast Market** — a tradeable probability estimate tied to a real Issue (`issue_markets` table).
- **Wallet / Position** — the real points ledger and a user's stake in a specific market (`user_wallets`, `wallet_positions`).
- **Bill Pressure** — a recorded citizen support/oppose stance on a bill (`bill_pressures` table) — the real object behind the Civic Action System; not the same as the fake `/campaigns` page concept.
- **Feed Post** — one item in the activity stream, human- or agent-authored (`feed_posts` table).
- **Community Leader** — a community-nominated aspiring politician; distinct from a sitting MP, currently under one route (`/leaders`) with MPs, which the roadmap splits apart.
- **Pillar / Civic Indicator** — a national scorecard category and its underlying measured metrics; schema (`pillar_metrics` et al.) exists and is unused.
- **Electorate** — the geographic unit linking a citizen to their local MP; the MP side is real, the user-lookup side (`/api/electorate-lookup`) is currently fake (hash-based, not geographic).
- **Agent / Agent Run** — a registered deterministic background job and its logged execution (`agents`, `agent_runs`).
- **Scenario / Simulation Result** — a modeled "what if" input/output pair, entirely synthetic by design.

## Terms that describe a defect pattern, used throughout this folder

- **Mock fallback** — a code path that silently substitutes fixture data when a real query returns empty, with no UI signal that this happened. Distinguished from an **honest fallback** (e.g. Feed's "· seed data" badge), which is the pattern to imitate instead.
- **Shadow implementation** — a second, disconnected implementation of something that should be singular (e.g. `useWallet.ts` alongside the real Supabase wallet).
- **Canonical source** — the one table/file/function that should be treated as ground truth for a given object, as named per-object in `DOMAIN_MODEL.md` and per-system in `STICKEE_SYSTEM_ARCHITECTURE.md`.
- **Illustrative/demo content** — data explicitly and visibly labeled as non-real, which is acceptable; the defect is never "having mock data," it's mock data presented without that label.

## Existing project vocabulary (pre-existing, referenced by this folder)

- **The Governance Council** — Stickee's multi-perspective review framework (`agents/*.md`, `docs/STICKEE_COUNCIL.md`); not the same thing as the "Agent Automation System" documented here — one is a human/AI review process for pull requests, the other is a runtime background-compute system. Do not conflate them.
- **Stickee Score** — the retired per-MP score; the term is preserved here only to flag that any future score under this or a similar name must satisfy `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` before shipping.
- **System A/B/C/D** — `CIVIC_DESIGN_SYSTEM.md`'s naming for the four coexisting visual styling dialects currently in the codebase; unrelated to the numbered systems list in this document (a naming collision worth being aware of when reading both documents together).
