# Stickee — Implementation Roadmap

This is a sequencing plan only. Detailed findings backing each task are in the other audit documents; file references are kept brief here.

> **Update:** Implementation Batch 1 is complete — see `IMPLEMENTATION_BATCH_1_REPORT.md`. It closed the `user_wallets` RLS hole (Phase 1), the market-eligibility and settlement gaps (Phase 2, partially — see note below), and the Stickee Score fix (Phase 1). Checkboxes below reflect that; unchecked items are still open.

## Phase 0 — Immediate containment (hours, not days) — partially done

**Goals:** Stop the bleeding on the two issues that carry risk simply by existing, before any other work starts.

**Tasks:**
- [x] Add `MVP_LAUNCH.md` to `.gitignore` (P0-6) — done in Batch 1.
- [ ] Rotate `SYNC_SECRET` and `THEYVOTEFORYOU_API_KEY` — **still outstanding**, requires you to generate and supply new values; not something Batch 1 could do safely without displaying/handling secret values.
- [ ] Commit the `middleware.ts` → `proxy.ts` migration deliberately (currently an uncommitted working-tree diff) once you've confirmed it behaves as intended — untouched by Batch 1.
- [ ] Decide whether to keep collecting real user data at all while P0 items are open.

**Dependencies:** None.
**Validation:** `git status` shows `MVP_LAUNCH.md` untracked and ignored (confirmed — `git check-ignore MVP_LAUNCH.md` passes); new secret values are live in Vercel env config only (not yet done).
**Completion criteria:** Not yet met — secret rotation is the remaining blocker.

## Phase 1 — Production blockers — mostly done

**Goals:** Close every P0 in `PRODUCTION_BLOCKERS.md` except the ones that depend on Phase 2's market-engine redesign.

**Tasks:**
- [x] Fix the `user_wallets` RLS UPDATE policy (P0-3) — done in Batch 1 (migration `016`).
- [x] Fix or relabel the Stickee Score methodology (P0-4) — done in Batch 1 (relabeled, not re-sourced; see `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` for what real sourcing would require).
- [ ] Source or relabel `whoSupports`/`whoOpposes` claims (P0-5) — **not done**, explicitly out of Batch 1's scope.
- [ ] Decide, page by page, which mock-data-driven features get a hard cutover vs. an "illustrative data" label (P0-7) — **partially addressed** for markets specifically (now labeled "Demo — not tradeable"), not for the other pages this item covers (home, decisions, impact, leaderboard, etc.).
- [x] Stand up CI (`tsc`, lint, test, build, secret-scan) — done in Batch 1, with lint currently `continue-on-error: true` pending a dedicated cleanup batch (see Batch 1 report §9).

**Dependencies:** Phase 0 secret rotation should be done first (contractors/reviewers may need repo access during this phase) — **still pending**.
**Validation:** RLS check re-run manually is not yet possible (no local Postgres available in this environment — see Batch 1 report §9/§13); `supabase/tests/002_wallet_lockdown.test.sql` is authored and ready to run once a dev database exists.
**Completion criteria:** Not yet fully met — P0-5, most of P0-7, and secret rotation remain open.

## Phase 2 — Market and wallet integrity — mostly done, pending real DB verification

**Goals:** Give the points-staking system (System B) an actual resolution/payout path, and stop expired markets from accepting stakes.

**Tasks:**
- [x] Decide the target lifecycle — resolved in Batch 1 as a deliberately minimal one: `active` (open, derived-closed via `closes_at`), `resolved-yes`, `resolved-no`, `voided`, `cancelled`. No separate stored `awaiting_resolution`/`disputed`/`archived` states — a smaller lifecycle than originally sketched here, chosen after a duplicate-detection pass found the fuller state machine wasn't needed for what the data actually requires. See `IMPLEMENTATION_BATCH_1_REPORT.md` §3.
- [x] Add real open/close timestamps — done (`opens_at`/`closes_at` added to `issue_markets`; `resolves_by` kept as-is for display).
- [x] Add server-side status/time enforcement to `place_wallet_stake` — done (`is_market_open()`).
- [x] Build the settlement function — done (`resolve_market()`), but note: **it extends `issue_markets`/`wallet_positions` directly rather than a separate ledger table** — see below.
- [ ] ~~Add an immutable `wallet_ledger` table~~ — **deliberately not built.** The duplicate-detection pass found `wallet_positions` already records the debit side of every stake; extending it with `settled_at` and a `'void'` status covers the settlement audit trail without a parallel table. If a full cross-event transaction ledger (bonuses + stakes + settlements in one queryable timeline) is wanted later, that's still open.
- [x] Fix the daily-bonus lost-update race — done (`apply_daily_bonus()`, atomic increment in SQL).
- [x] Add voided/cancelled states with a refund path — done.
- [ ] Fix the leaderboard to compute from real data (or remove it until it does) — **not done**, out of Batch 1's scope.

**Dependencies:** Phase 1's CI and P0-3 fix should already be in place; this is the largest single phase.
**Validation:** ~~not yet executed~~ — **done.** A follow-up Database Verification Batch got Docker/Supabase CLI running locally, applied 016/017 from clean and on top of the existing schema (idempotency verified by re-applying 3x), ran all 26 assertions across the three test files (all passing, after fixing two test-harness bugs and one critical schema-security bug found in the process — see `DATABASE_VERIFICATION_REPORT.md`), proved all 4 required concurrency scenarios safe using genuinely overlapping database connections, and walked the complete stake-to-settlement flow (signup → wallet init → stake → reject-expired → admin resolve → verify → duplicate-resolve no-op → VOID refund) through the real Auth+PostgREST API.
**Completion criteria:** Met, with two caveats: (1) no market currently has real backing data (see the `MARKET_ENGINE_AUDIT.md` update note), so "a market taken through its full real lifecycle" was demonstrated using `supabase/seed.sql` test fixtures, not a real bill/civic/election market — that remains a separate, deliberate product decision (see Phase 4 below); (2) this was verified against local Postgres, not the actual production Supabase project (out of scope — no production access permitted). `DATABASE_VERIFICATION_REPORT.md` §5 flags a local-CLI default-privileges quirk that may or may not also apply to production and needs manual checking.

## Phase 3 — Authentication and permissions

**Goals:** Close the defense-in-depth gaps found in the security audit; this phase is smaller than 1–2 because most of the auth system already checked out well.

**Tasks:**
- Add independent admin-status checks to the admin read-only pages currently relying solely on the parent layout.
- Add `import 'server-only'` to `supabase-admin.ts`.
- Server-generate/verify the anonymous bill-pressure session identifier instead of trusting client input.
- Decide whether `proxy.ts` should gain a centralized protected-route matcher as a second layer, or whether the per-route model is accepted permanently (document the decision either way so future contributors know the intended pattern).

**Dependencies:** None blocking; can run in parallel with Phase 2.
**Validation:** Attempt each of the "can a normal user reach X" questions from `SECURITY_AND_PERMISSIONS_AUDIT.md` manually against a staging environment.
**Completion criteria:** Every finding in the security audit is either fixed or explicitly accepted-as-risk with a documented reason.

## Phase 4 — Data credibility

**Goals:** Bring the political/civic content up to the sourcing standard the audit brief requires, and label automated content.

**Tasks:**
- Restore `source_agent_id` to the feed UI with a visible "automated" badge.
- Add confidence/verification-status and last-reviewed-date columns to the relevant tables (`issues`, `pillar_metrics`, `politician_pillar_ratings`) — currently absent everywhere.
- Either revive the dormant `pillar_metrics`/`pillar_scores`/`politician_pillar_ratings` schema for real, source-attributed scoring, or formally deprecate/remove it so it stops being a confusing duplicate of the live (currently fake) scoring path.
- Fix the always-zero mock `stickeeScore` field on the live chamber view.
- Replace the hash-based `/electorate-lookup` with a real geographic lookup.

**Dependencies:** Builds directly on Phase 1's P0-4/P0-5 fixes — this phase generalizes those fixes into a durable sourcing standard rather than one-off patches.
**Validation:** Spot-check a sample of claims across `/issue/[id]`, `/mp/[id]`, `/parliament` for a working citation trail.
**Completion criteria:** Every factual claim type identified in `DATA_AND_CONTENT_AUDIT.md` §5 has a populated source field, or is clearly labeled illustrative.

## Phase 5 — Public-user readiness

**Goals:** Handle the privacy/legal surface needed before real public signups (this audit did not find a privacy policy, terms of service, or consent language anywhere in the repo — confirm this directly before this phase, as it wasn't the primary focus of the six research passes and should be double-checked).

**Tasks:**
- Draft/publish a privacy policy and terms of service (Australian legal review recommended — not something this audit can certify).
- Add account deletion, data export, and notification-consent flows if not already present (verify current state directly — not conclusively checked in this pass).
- Add a retention policy and confirm cascade-delete behavior matches it (ties to the P2 cascade-inconsistency finding in `PRODUCTION_BLOCKERS.md`).
- Add rate limiting to any endpoint accepting anonymous input (ties to the `/api/bills/.../pressure` finding and the endorsement/nomination TODOs).

**Dependencies:** Should follow Phase 1–4 so the product being reviewed for privacy/legal purposes is the corrected one, not the current one.
**Validation:** Legal review sign-off (external to this audit).
**Completion criteria:** Privacy policy, terms, consent flows, deletion/export are all live and linked from the app.

## Phase 6 — Outsourcing

**Goals:** Execute the plan in `OUTSOURCING_PLAN.md`.

**Tasks:**
- Stand up the seeded dev Supabase project and restricted-credential contractor access model.
- Open the first 10 scoped tickets from `OUTSOURCING_PLAN.md`, starting with CI/lint/tests (tickets 1–2) since everything else benefits from that safety net existing first.

**Dependencies:** Phases 1–3 should be done or well underway — outsourcing work into an area with unresolved P0s (wallet, scoring) risks a contractor building on top of a foundation that's about to change.
**Validation:** First PR from an external contractor merges cleanly through the defined workflow.
**Completion criteria:** At least 3 of the first 10 tickets shipped through the full PR/CI/review workflow without incident.

## Phase 7 — Open-source preparation

**Goals:** Execute the staged plan in `OPEN_SOURCE_READINESS.md`.

**Tasks:**
- Add governance files (LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY.md, issue/PR templates).
- Complete the dependency/asset licensing review (legal, not just technical).
- Re-confirm no secret has entered git history at the actual time of release (re-check, don't rely solely on this audit's snapshot).
- Publish the lowest-risk directories first (UI primitives, staking RPC pattern, sync integration pattern), holding back scoring/content pipelines until they're demonstrably real.

**Dependencies:** Phases 1, 3, 4 in particular — you cannot responsibly publish the MP scoring code while it's still fabricated.
**Validation:** A final read-through of the public repo by someone other than the author, specifically checking for anything that reads as "real" but isn't.
**Completion criteria:** Repository is public (or open-core split is live) with no unresolved P0/P1 finding from this audit still present in the published portion.
