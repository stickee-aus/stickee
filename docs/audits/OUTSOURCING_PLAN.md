# Stickee — Outsourcing Plan

## What to outsource first

Bounded, low-blast-radius work that doesn't require understanding the wallet/market data model or the trust/sourcing gaps:

- Responsive/accessibility fixes across existing pages
- Loading and error states (many pages currently have neither, per the route inventory)
- Component cleanup (e.g., resolving the `feed/page.tsx.bak` leftover, deduplicating mock data helpers)
- Test coverage for already-correct code (the `place_wallet_stake` RPC, auth flows, admin actions)
- Documentation (README is currently just `create-next-app` boilerplate)
- Dependency bumps (`lucide-react`, `shadcn` CLI are behind upstream)
- Monitoring/logging integration (Sentry or equivalent)
- Performance passes (image handling, bundle size)

## What to retain owner control of

- The prediction-market lifecycle redesign (P0-1, P0-2 in `PRODUCTION_BLOCKERS.md`) — this requires a product decision about the target lifecycle before any contractor can safely build against it.
- The MP/leader scoring methodology (P0-4) — fixing this either means wiring in real data or rewriting the marketing claim; both are product decisions, not just bug fixes.
- Political content sourcing (P0-5) — deciding what claims ship, with what citations, is an editorial/legal decision.
- RLS policy changes on financial tables (P0-3) — small in code size, but touches the wallet's core trust boundary; review personally even if a contractor writes the migration.
- Secret rotation and `.gitignore` hygiene (P0-6) — do this yourself before any contractor gets repository access.

## Recommended contractor access model

- **Local development only**, against a **separate Supabase project** seeded from the (now-fixed, see Test report) migration files — never the real project's credentials.
- Contractors should never receive `SUPABASE_SERVICE_ROLE_KEY`, `SYNC_SECRET`, `CRON_SECRET`, or Stripe live keys for the real project. Provide a seeded dev Supabase project with its own throwaway service-role key.
- All work happens on feature branches with pull requests — no direct push to `main`.
- Vercel preview deployments (auto-created per-PR) for review; production deploys remain owner-triggered only.
- Automated checks (once added per `TEST_AND_VERIFICATION_REPORT.md`) must pass before merge — this is currently not enforceable since there is no CI yet; **standing up CI is itself the first recommended ticket**, before any other outsourced work, so that a contractor's changes are automatically checked rather than manually reviewed line-by-line.

## Recommended pull-request workflow

1. Ticket scoped with acceptance criteria (templates below) assigned to contractor.
2. Contractor works on a feature branch against the seeded dev Supabase project.
3. PR opened against `main`, CI runs (`tsc`, lint, build, and eventually tests).
4. Owner reviews — for anything touching auth, wallet, or scoring/content, owner review is mandatory regardless of CI status.
5. Merge only after green CI + owner approval for sensitive areas (see access model above).

## First 10 scoped outsourcing tickets

### 1. Stand up CI pipeline
- **Scope:** GitHub Actions workflow running `tsc --noEmit`, ESLint (once configured), and `next build` on every PR.
- **Files:** `.github/workflows/ci.yml`
- **Acceptance criteria:** PR fails if any check fails; passes on current `main` state.
- **Tests required:** N/A (this *is* the test infra).
- **Dependencies:** None.
- **Risks:** Low.
- **Complexity:** Small.
- **Independent:** Yes.

### 2. Add ESLint configuration
- **Scope:** Add `eslint.config.js` with Next.js recommended rules; fix any resulting violations.
- **Files:** repo root, likely minor touch-ups across `src/`
- **Acceptance criteria:** `npx eslint .` passes with zero errors.
- **Dependencies:** None.
- **Risks:** Low.
- **Complexity:** Small.
- **Independent:** Yes.

### 3. Add loading/error states to pages missing them
- **Scope:** Audit each page against `FEATURE_AND_ROUTE_INVENTORY.md`, add `loading.tsx`/`error.tsx` where absent, consistent with existing patterns (`feed/loading.tsx`, `leaderboard/loading.tsx` already exist as references).
- **Files:** `src/app/**`
- **Acceptance criteria:** Every route has a loading skeleton and an error boundary; manual click-through confirms no blank/broken states.
- **Dependencies:** None.
- **Risks:** Low.
- **Complexity:** Medium.
- **Independent:** Yes.

### 4. Accessibility pass on core navigation and forms
- **Scope:** Keyboard navigation, ARIA labels, color contrast on `Navbar`, `BottomNav`, sign-in/sign-up forms, `StakeModal`.
- **Files:** `src/components/Navbar.tsx`, `BottomNav.tsx`, `src/app/auth/**`, `StakeModal.tsx`
- **Acceptance criteria:** Passes automated axe-core scan with zero critical/serious violations; manual keyboard-only click-through works.
- **Tests required:** Add an accessibility test to CI (e.g. `@axe-core/playwright`).
- **Dependencies:** Ticket 1 (CI) helps enforce this going forward.
- **Risks:** Low.
- **Complexity:** Medium.
- **Independent:** Yes.

### 5. Write unit tests for `place_wallet_stake` and daily-bonus logic
- **Scope:** Cover the one part of the wallet system already confirmed correct (atomic debit) plus regression-test the lost-update race found in `daily-bonus.ts` (fix the race first, or write a test that currently fails and is expected to, clearly labeled).
- **Files:** `supabase/migrations/008_wallet_staking.sql`, `src/lib/agents/daily-bonus.ts`
- **Acceptance criteria:** Concurrent-stake test proves no overspend possible; daily-bonus test proves no double-credit and (after fix) no lost-update.
- **Dependencies:** Ticket 1 (CI), and ideally the lost-update fix (owner or contractor with review).
- **Risks:** Medium — touches real financial logic, needs careful review even though scope is "just tests."
- **Complexity:** Medium.
- **Independent:** No — coordinate with owner on whether to fix-then-test or test-then-fix.

### 6. Restore `source_agent_id` to the feed UI with an "automated" badge
- **Scope:** Fix `src/lib/feed/ranker.ts`'s `rowToFeedPost` to include agent identity; add a visible label in `FeedPost.tsx`.
- **Files:** `src/lib/feed/ranker.ts`, `src/components/FeedPost.tsx`
- **Acceptance criteria:** Every agent-authored post visibly shows an "automated" indicator; human posts don't.
- **Dependencies:** None.
- **Risks:** Low.
- **Complexity:** Small.
- **Independent:** Yes.

### 7. Add database indexes and fix `migrations_bundle.sql`
- **Scope:** Add missing indexes (`wallet_positions.user_id`/`market_id`, `donation_records.stripe_payment_intent_id`); regenerate `migrations_bundle.sql` to include migration 013's tables, or remove the bundle file and document that numbered migrations are authoritative.
- **Files:** new migration file, `supabase/migrations_bundle.sql`
- **Acceptance criteria:** Bundle runs clean against a fresh DB; explain-plan shows index usage on the targeted queries.
- **Dependencies:** None.
- **Risks:** Low (additive migration only).
- **Complexity:** Small.
- **Independent:** Yes.

### 8. Generate and wire up Supabase TypeScript types
- **Scope:** Run `supabase gen types typescript`, replace ad hoc inline types (e.g. `DBWalletRow` in `usePredictionWallet.ts`) with the generated types.
- **Files:** new `database.types.ts`, `src/types/index.ts`, various hooks
- **Acceptance criteria:** `tsc --noEmit` still passes; no more hand-maintained duplicate type definitions for DB rows.
- **Dependencies:** None.
- **Risks:** Low.
- **Complexity:** Medium.
- **Independent:** Yes.

### 9. Add monitoring/error tracking
- **Scope:** Integrate Sentry (or Vercel-native error tracking) for both client and server, especially the seven cron agents.
- **Files:** `next.config.ts`, agent files, a new instrumentation file
- **Acceptance criteria:** A deliberately-thrown test error in an agent shows up in the monitoring dashboard.
- **Dependencies:** None.
- **Risks:** Low.
- **Complexity:** Small–Medium.
- **Independent:** Yes.

### 10. Investigate and resolve `/api/endorsements` and `/api/nominations` references
- **Scope:** `EndorsementPanel.tsx` and `NominationModal.tsx` reference these endpoints in TODO comments, but neither exists in the codebase. Determine what these components actually currently do (call nothing? call a different route?) and either build the missing endpoint with rate limiting, or remove the dead reference.
- **Files:** `src/components/EndorsementPanel.tsx`, `src/components/NominationModal.tsx`, possibly new `api/endorsements`, `api/nominations` routes
- **Acceptance criteria:** Clicking endorse/nominate in the UI either works end-to-end with rate limiting, or the UI is corrected to not imply a working feature.
- **Dependencies:** None, but requires investigation before scoping — complexity is unknown until the current behavior is understood.
- **Risks:** Medium (unclear current behavior).
- **Complexity:** Unknown until investigated — start as "small: investigate," escalate if a new endpoint is needed.
- **Independent:** Yes.

## Contractor ticket template

```
Title:
Scope: (what changes, what doesn't)
Files/directories likely involved:
Acceptance criteria: (bullet list, testable)
Required tests:
Dependencies: (other tickets, owner decisions)
Risks:
Complexity: small | medium | large
Can be completed independently: yes/no (if no, what coordination is needed)
```
