# Stickee — Test & Verification Report

All commands below were run locally, read-only with respect to the database (no migrations run, no data touched), and did not deploy anything.

> **Update:** this document reflects the state at the time of the original audit (no tests, no CI, no database verification of any kind). That has changed substantially since:
> - **Implementation Batch 1** added a Vitest suite (content-assertion tests for the MP-score removal), ESLint, and a CI workflow — see `IMPLEMENTATION_BATCH_1_REPORT.md` §9.
> - **The Database Verification Batch** went further and actually stood up a local Postgres/Supabase instance and executed everything that Batch 1 could only author: 26 SQL test assertions (all passing), 4 concurrency scenarios proven safe under genuine overlapping connections, and the complete stake-to-settlement flow verified through the real Auth+PostgREST API. It also found and fixed a critical vulnerability (`apply_daily_bonus` callable by an unauthenticated request) that no amount of static review had caught. Full detail: `DATABASE_VERIFICATION_REPORT.md`.
>
> The findings below (zero tests, no CI) are historical baseline, not current state.

## Commands run

| # | Command | Result | Notes |
|---|---|---|---|
| 1 | `find . -iname "*.test.*" -o -iname "*.spec.*" -o -iname "jest.config*" -o -iname "vitest.config*" -o -iname "playwright.config*"` (excluding `node_modules`) | **Zero results** | No test files or test runner configuration exist anywhere in the repository |
| 2 | `package.json` scripts check | **No `test` script defined** | Only `dev`, `build`, `start` exist |
| 3 | `npx tsc --noEmit` | **PASS — zero errors** | Full project type-checks cleanly |
| 4 | ESLint config check (`.eslintrc*`, `eslint.config*`) | **Not configured, not installed** | `eslint` isn't even in `package.json`; unusual for a Next.js app since `create-next-app` normally scaffolds it — likely stripped deliberately or never added |
| 5 | `npm run build` (`next build`, Turbopack) | **PASS** | Compiled in 7.7s, type check in build finished in 9.9s, 53/53 pages generated successfully, zero errors/warnings. Route manifest shows a healthy mix of static/dynamic/SSG routes including `/admin/*`, `/api/agents/*`, `/api/donations/*`, `/api/sync/*` |
| 6 | `npm audit --production` | **15 vulnerabilities: 9 high, 4 moderate, 2 low** | Mostly transitive/tooling dependencies (`hono`, `brace-expansion`, `fast-uri`, `js-yaml`, `ws`, `sharp`, `body-parser`, `qs`, `ip-address`) plus `next` itself, which has advisories spanning a version range that includes the installed 16.2.1. `npm audit fix` (non-forcing) would resolve most; `sharp`'s fix requires `--force` and bumps `next` outside the currently pinned version — flag for manual review, do not run `--force` without deliberate version testing |
| 7 | `git ls-files \| grep -iE '\.env'` | **No matches** | No env file is tracked by git |
| 8 | `git log --all --oneline -- .env.local .env .env.production .env.development` | **Empty** | No env file has ever been committed in this repo's history — secrets are not in git history |
| 9 | `git ls-files \| grep -i MVP_LAUNCH` | **No matches** | `MVP_LAUNCH.md` (known to contain plaintext secrets) is confirmed untracked — but see `PRODUCTION_BLOCKERS.md` P0-6, it is not `.gitignore`-protected either |

## Dependency version sanity check

Installed versions were checked directly against `node_modules/*/package.json` (not just the `package.json` semver ranges), to rule out the unusual-looking version numbers being typos:

| Package | Installed | Assessment |
|---|---|---|
| next | 16.2.1 | Real published version (postdates assistant training data — treat version-specific behavior claims as needing manual verification against current docs) |
| react / react-dom | 19.2.4 | Real published version, same caveat |
| lucide-react | 1.7.0 | Real, but registry shows releases up to ~1.28.0 — meaningfully outdated |
| shadcn (CLI) | 4.1.0 | Real, registry shows up to ~4.16.1 — outdated |
| @base-ui/react | 1.3.0 | Needs manual check (young package, limited version history to compare against) |
| @supabase/ssr, @supabase/supabase-js | pre-1.0 / 2.100.0 | Pre-1.0 (`ssr`) — API can still shift; needs manual check |
| tailwindcss | 4.2.2 | Current v4 line, fine |
| typescript | 5.9.3 | Fine |

No dependency appeared abandoned. No GPL/AGPL-licensed direct dependency was found in a spot check of `package.json` — this was **not** a full `node_modules` license scan (explicitly out of scope per audit instructions to avoid a slow full scan); mark as **requires legal/licensing review** before any formal open-source release, not a cleared item.

## What passed

- TypeScript compiles with zero errors across the entire codebase.
- Production build (`next build`) completes successfully, generating all 53 routes with no errors or warnings.
- No secrets have ever entered git history.

## What's missing (this is the dominant finding of this report)

- **Zero test coverage of any kind** — no unit tests, no integration tests, no end-to-end tests, no database tests, no permission tests, no market-lifecycle tests, no wallet/settlement tests, no accessibility tests. Every "Tests" cell in `FEATURE_AND_ROUTE_INVENTORY.md` is empty because there is genuinely nothing to cite.
- **No linting** — no style/quality gate exists for any future or outsourced contribution.
- **No CI pipeline** (`.github/workflows` doesn't exist) — nothing runs `tsc`, `next build`, or any check automatically on push/PR today; the clean results above were only obtained by running commands manually during this audit.

## Minimum critical test suite recommended before public launch

In priority order:

1. **Wallet/staking integrity tests** — concurrent-stake race conditions, insufficient-balance rejection, daily-bonus idempotency under concurrency (this directly targets the lost-update race found in `daily-bonus.ts`).
2. **Market lifecycle tests** — once a resolution path is built (P0-1 in `PRODUCTION_BLOCKERS.md`), test every state transition and that expired/closed markets reject new stakes server-side (targets P0-2).
3. **Permission/RLS tests** — a normal user cannot update another user's data, cannot write to `user_wallets` directly (regression test for P0-3), cannot reach admin server actions.
4. **Auth flow tests** — sign-in/sign-up/reset-password happy paths and session-expiry handling.
5. **Admin action tests** — ban/unban/promote/demote/delete, including the self-demotion/self-deletion blocks already in code.
6. **API route auth tests** — every route in `FEATURE_AND_ROUTE_INVENTORY.md` marked "Auth: Yes" actually rejects unauthenticated requests; every cron/agent route rejects requests without the correct secret.
7. **Donations webhook tests** — signature verification rejects tampered payloads; amount clamping holds.
8. **Build/typecheck/lint in CI** — wire the three clean-today checks above into GitHub Actions so they run on every PR, before adding any of the above test suites.

## Recommended CI checks (minimum viable)

```yaml
on: [pull_request]
jobs:
  verify:
    steps:
      - npm ci
      - npx tsc --noEmit
      - npx eslint .        # after ESLint is configured
      - npm run build
      - npm test             # after a test runner is added
```
