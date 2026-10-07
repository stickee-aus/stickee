Governed by [`AGENTS.md`](../../AGENTS.md). Documentation only — this is a roadmap for owner review, nothing here has been implemented or scheduled.

# Stickee — Future Systems Roadmap

## Systems that already exist and are healthy

- **Identity & Access** — real, working, needs only a fail-closed convention improvement.
- **Donation & Support** — real, isolated, no action needed.
- **Agent Automation** — real, deterministic, well-instrumented (`/admin/agents`), no action needed beyond the `mp-scorecard` join fix.
- **Live Election** — real, correctly stateless; needs only contextual placement and scrape-failure alerting.
- **Scenario Simulation** — real, correctly isolated; needs only a navigation demotion.

## Systems that partially exist (real core, real gap)

- **Government Record** — real sync, real core tables; undermined by silent mock fallbacks and unused `source_url`.
- **Forecast** — real, verified staking/settlement core; undermined by a duplicate wallet (`useWallet.ts`), a duplicate market path (`FeaturedMarketCard`), and a missing resolve/close admin flow for `issue_markets`.
- **People** — real MP data; undermined by a mixed-identity route (`/leaders`) and a disabled-but-not-removed scoring path.
- **Feed & Activity** — real ranking and storage; undermined by dropped authorship disclosure.
- **Civic Action** — real bill-pressure core; undermined by a parallel fake "campaigns" page.
- **Notification** — real storage; undermined by a demo-array fallback that masks the true empty state.
- **Personalisation** — real onboarding-event storage; undermined by a fake electorate lookup that other systems (Civic Action, Agent Automation's `electorate-pulse`) silently depend on.

## Systems that are effectively duplicated today

| Duplicated concept | Real implementation | Shadow/duplicate implementation | Recommended action |
|---|---|---|---|
| Wallet | `user_wallets`/`wallet_positions` + verified RPCs | `useWallet.ts` (`localStorage`) | Retire the shadow; migrate any UI still reading it to `usePredictionWallet.ts` |
| Leaderboard | (should be one view over Forecast data) | Hardcoded array duplicated on `/leaderboard` and embedded in `/predictions` | Collapse to one component, one data source |
| Campaign | `bill_pressures` + `CampaignModal` | `/campaigns` standalone page, local-state-only | Retire the standalone page's mechanic; promote the real one |
| Issue/Decision | `issues` table | `Decision` type over `mock-government-data.ts` | Merge data models (see below) |
| Timeline | (should be one `issue_timeline_events` table) | `Decision.timeline` (mock) and `BillStageTimeline`'s own bill-stage source (`mock-senate-data.ts`) | Build the real table once, retire both mock representations |
| Grade→colour logic | (should be one function) | `PillarCard.tsx` and `PillarGradeChip.tsx` independently | Extract to one shared util |
| "Onboarding" | Real first-visit modal + `onboarding_events` | Static `/onboarding` page | Fold into the real flow |

## Systems that are missing

- **Evidence/Citations.** No general-purpose source-attribution join table exists. This is the single most consequential missing system relative to the stated mission — every other truthfulness fix (Government Record's `whoSupports` claims, Civic Indicator's sourcing, People's score methodology) is downstream of this one being built.
- **Moderation queue (UI).** `content_reports`/`moderation_actions` exist and are triaged by an agent; there is no admin surface to act on them.
- **Real electorate/geo lookup.** Currently a hash-based placeholder; needed before Personalisation's downstream consumers (Civic Action targeting, `electorate-pulse`) can be trusted.
- **Market resolution/close admin flow** for `issue_markets` (System B) — staking exists with no confirmed way to close a market other than by RPC call outside any UI.
- **Committee** as a domain object — a real gap if committee reports become a sourcing priority, not currently duplicating anything.
- **Saved Topic / Watchlist** — no way for a user to follow a specific Issue/Pillar/MP; `user_follows` only covers following other *users*.

## Systems that should never exist

- **A second wallet, market source, campaign mechanic, or navigation registry** of any kind, under any name — these are the exact mistakes already made once each; the fix is consolidation, and any future proposal that recreates this shape should be rejected at review, not built and reconciled later.
- **A "gamification" system with independent product legitimacy.** Streaks/badges/points should stay a thin decorative layer on top of real systems (per `SYSTEM_BOUNDARIES.md`), never a growth objective in their own right — the constitution's "not another gaming platform" line is a permanent constraint, not a current-state observation.
- **A generic "AI content" system** built ahead of an actual need. Nothing currently requires an LLM; introducing one speculatively would create labeling and trust obligations (per `AGENTS.md`'s truthfulness section) before there's a product reason to accept that cost.
- **A parallel civic-scoring pipeline** for anything (MPs, pillars, leaders) that doesn't compute from real underlying data with a documented, reproducible methodology — the `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` bar should be treated as the standard for any future score, not a one-off remediation for the score that was removed.

## Recommended implementation order

Sequenced by (a) how much other work depends on it, and (b) risk of the current gap causing public harm if left as-is — not by ease of implementation:

1. **Evidence/Citations schema + wiring into Government Record's `source_url` usage.** Foundational; almost everything else in the truthfulness story depends on this existing.
2. **Civic Indicator: wire `pillar_metrics` to a real source, or relabel as illustrative.** Highest-visibility page (home) currently misrepresenting mock data as live.
3. **Merge Issue/Decision data models.** Removes the costliest duplicate-architecture problem and unblocks a single Issues list, a single detail-page template, and a real Timeline Event table.
4. **Retire the duplicate wallet, duplicate market path, and duplicate leaderboard.** Concentrated in the Forecast System; each is a deletion once the canonical path is confirmed sufcient, not a build.
5. **Retire `/campaigns`' fake mechanic in favour of the real Civic Action system**, promoted to a first-class page.
6. **Fix Feed's dropped authorship disclosure and Notification's demo-array fallback.** Small, contained, high-trust-value fixes.
7. **Real electorate/geo lookup.** Unblocks trustworthy Personalisation-dependent features.
8. **People system split (`/people` with two labeled sections) + wire real `member_votes` history into MP profiles.**
9. **Build the missing moderation queue UI and market-resolution admin flow.** Operational gaps, not public-facing truthfulness risks — lower urgency than 1–8, but should land before either underlying surface (user-generated content, market volume) scales meaningfully.
10. **Implement `CIVIC_DESIGN_SYSTEM.md`'s token system in code**, converging all pages (including the home page redesign itself) on one visual language. Can proceed in parallel with the above; it's orthogonal to data-truthfulness work.

Each of these is a candidate for its own implementation plan and owner approval per `AGENTS.md`'s workflow section — this roadmap sequences them, it does not authorise building any of them yet.
