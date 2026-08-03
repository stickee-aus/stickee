# Stickee — Audit Executive Summary

Audit date: 2026-08-03. Read-only audit; no application code, database data, or deployments were modified. Full detail in the 10 companion documents listed at the end.

## Ratings

| Dimension | Score (0–100) | Basis |
|---|---|---|
| **Production readiness** | **28 / 100** | Core prediction-market feature cannot pay out at all; expired markets are stakeable with no server check; a live financial RLS hole lets users set their own balance; real MPs carry a fabricated "score" the UI claims is real. TypeScript/build are clean and auth *mutations* are well-gated, which keeps this from being lower, but the product's central promise doesn't work yet. |
| **Outsourcing readiness** | **45 / 100** | Bounded, low-risk work (tests, a11y, loading states, docs, CI) can be handed out today with a seeded dev Supabase project. The wallet/market/scoring core cannot be safely handed to a contractor until the owner has decided the target lifecycle and fixed the false MP-score claim — those are product decisions, not coding tasks. |
| **Open-source readiness** | **15 / 100** | No governance files exist at all (no LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY.md). More importantly, publishing the current MP-scoring code would expose the exact mechanism by which real politicians get an inaccurate public score — this needs to be fixed before the code is public, not disclosed via being public. |

## Top 10 risks

1. **The real points-staking market system has no resolution/payout code path anywhere.** Points leave wallets via staking; nothing ever credits them back. (`MARKET_ENGINE_AUDIT.md`)
2. **Seeded election markets with resolution dates over a year in the past are still stakeable today** — no server-side check of market status or closing time exists in the staking RPC. (`MARKET_ENGINE_AUDIT.md`)
3. **A "Stickee Score" attached to real, named Australian MPs is fabricated** (party-line assumption over fictional mock issues) while the UI explicitly claims it reflects individual voting record — the highest reputational/trust risk in the audit. (`DATA_AND_CONTENT_AUDIT.md`)
4. **`user_wallets` can be updated directly by its owner via PostgREST**, bypassing the app's atomic staking logic entirely — a live path to unlimited virtual points. (`SECURITY_AND_PERMISSIONS_AUDIT.md`)
5. **Hardcoded political claims attributed to real parties with no citation trail**, despite the schema having an unused `source_url` field for exactly this purpose. (`DATA_AND_CONTENT_AUDIT.md`)
6. **A file containing plaintext live secrets (`MVP_LAUNCH.md`) sits in the working directory**, untracked but not gitignored — one `git add -A` from permanent git-history exposure. (`SECURITY_AND_PERMISSIONS_AUDIT.md`)
7. **Widespread mock/demo data reaches real users with no labeling**, across the homepage, leaders, MP profiles, leaderboard, impact, decisions, notifications, and profile pages. (`DATA_AND_CONTENT_AUDIT.md`)
8. **Bot-authored feed content is unlabeled** — the database tracks which agent generated a post, and that field is deliberately dropped before reaching the UI. (`DATA_AND_CONTENT_AUDIT.md`)
9. **No test suite, no CI, and no ESLint configuration exist at all.** Everything verified in this audit was checked manually; nothing prevents regression on the next change. (`TEST_AND_VERIFICATION_REPORT.md`)
10. **No transaction ledger for wallet points** — balance is a bare mutable column touched from multiple code paths, making any future dispute unauditable, and a real lost-update race exists in the daily-bonus job. (`MARKET_ENGINE_AUDIT.md`)

## Top 10 strengths

1. **The core stake-debit RPC (`place_wallet_stake`) is genuinely well-built** — a single atomic conditional UPDATE that correctly prevents overspend under concurrency.
2. **Admin mutations are consistently, independently server-gated** — every ban/promote/demote/delete action calls a real authorization check, with self-demotion/self-deletion explicitly blocked.
3. **Cron/agent endpoints are properly secret-gated** — no unauthenticated path triggers privileged logic.
4. **RLS is enabled on essentially every user-data table**, with one significant, fixable exception.
5. **No service-role credential leakage into client-bundled code anywhere** — confirmed by direct grep, not assumption.
6. **Real, working third-party integrations** — TheyVoteForYou vote-sync and a live AEC election-tally scrape are both genuinely functional, not stubbed.
7. **Donations/Stripe integration is correctly built** — signature-verified webhooks with `timingSafeEqual`, server-clamped amounts.
8. **No secret has ever entered git history**, and the codebase's actual secret exposure (`MVP_LAUNCH.md`) is still fixable before it does.
9. **TypeScript compiles cleanly and `next build` succeeds with zero errors** across all 53 routes.
10. **The seven background "agents" are honestly deterministic**, not disguised LLM calls — the trust problem here is unlabeled automation and fictional seed data, not AI hallucination, which is a more tractable problem to fix.

## Immediate recommendation

Do not treat this as a "polish and launch" codebase. Treat it as "working scaffold with a fake core feature and one live financial hole." Fix Phase 0 (secret containment) this week, then Phase 1 (the RLS hole, the MP-score claim, the unsourced political content) before doing anything else — these are each small to medium in isolation. Phase 2 (actually building market settlement) is the large piece of work and should be scoped deliberately, ideally with the owner deciding the target lifecycle before any code is written, contractor or otherwise.

## Is it safe for public signups right now?

**No.** Beyond the wallet RLS hole (P0-3), the product's central feature doesn't work end-to-end (no settlement), and it currently shows fabricated data about real people as if factual. Any of these three alone would justify holding off; together they're a clear no.

## Is it safe to give the repository to contractors right now?

**Partially, with restrictions.** Bounded work (tests, CI, accessibility, loading states, docs, dependency bumps — see `OUTSOURCING_PLAN.md`) can go out today, using a seeded dev Supabase project and never the real service-role/sync/Stripe credentials. The wallet, market-lifecycle, and MP-scoring areas should stay with you until the underlying product decisions are made — a contractor could otherwise "fix" the scoring bug by making the code match the (false) marketing copy instead of the other way around.

## Is it safe to open-source now?

**No.** No governance files exist, and more importantly, publishing the current MP-scoring implementation would document, for anyone to read, exactly how a real politician's displayed score has nothing to do with their real votes. Fix the content-trust and market-integrity issues first; open-source readiness is a Phase 7 concern, not a Phase 0 one, per `IMPLEMENTATION_ROADMAP.md`.

## Audit documents produced

1. `SYSTEM_ARCHITECTURE.md`
2. `FEATURE_AND_ROUTE_INVENTORY.md`
3. `SECURITY_AND_PERMISSIONS_AUDIT.md`
4. `MARKET_ENGINE_AUDIT.md`
5. `DATA_AND_CONTENT_AUDIT.md`
6. `PRODUCTION_BLOCKERS.md`
7. `OUTSOURCING_PLAN.md`
8. `OPEN_SOURCE_READINESS.md`
9. `TEST_AND_VERIFICATION_REPORT.md`
10. `IMPLEMENTATION_ROADMAP.md`
11. `AUDIT_EXECUTIVE_SUMMARY.md` (this document)

## Areas not fully verified in this pass

- **Privacy policy, terms of service, consent/notification-consent language** — not conclusively confirmed present or absent across the whole app; flagged in `IMPLEMENTATION_ROADMAP.md` Phase 5 for direct, dedicated verification before public launch.
- **Full `node_modules` license audit** — deliberately skipped a slow full scan per the audit's own guidance to avoid excessive scope; a spot-check of direct dependencies found no red flags, but this is not a substitute for a real legal/licensing review.
- **Copied UI assets, icons, and fonts** — ownership/licensing not verified; flagged for manual review before open-sourcing.
- **Exact Next.js 16 Server Component rendering behavior** referenced in the admin defense-in-depth finding (`SECURITY_AND_PERMISSIONS_AUDIT.md` P1) — the specific claim about whether a child Server Component's data-fetching can execute independent of a parent layout's returned JSX should be verified against the exact installed Next.js version's behavior rather than taken as certain; the recommended fix (add explicit checks to each page) is safe regardless of the answer.
- **Whether `/api/endorsements` and `/api/nominations` are genuinely unbuilt or call something not found by grep** — flagged in `PRODUCTION_BLOCKERS.md`/`OUTSOURCING_PLAN.md` as needing direct investigation rather than being conclusively resolved here.
- **Live database state** — this audit read migration files and application code only; it did not (and was instructed not to) connect to or query the actual live Supabase database, so findings about seeded/demo data reflect what the code would insert or render, not a confirmed snapshot of current production rows.
