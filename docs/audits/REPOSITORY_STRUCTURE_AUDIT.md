# Repository Structure Audit — Stickee vs. Buds at Work

Read-only. No files modified. Scope: is Stickee a clean, standalone repository, or is there any entanglement (code, data, config, or deployment) with the unrelated "Buds at Work" project.

## Executive summary

Stickee and Buds at Work are **fully separate repositories on disk, with zero code, data, or configuration overlap found**. Stickee is a single-app Next.js repository at `/Users/jacksontaylor/stickee` with **no configured git remote** (it has never been pushed anywhere — `.git/config` has no `[remote "origin"]` block, and `git remote -v` returns nothing). Buds at Work lives entirely separately at `/Users/jacksontaylor/budsatwork`, is its own git repository, and pushes to `github.com/budsatwork0-ai/budsatworkaus.git`. No monorepo tooling, shared packages, symlinks, or cross-references were found in either direction. This is already the correct structure — there is nothing to "split," because nothing is currently merged.

## 1. Is Stickee in its own Git repository?

Yes. `git rev-parse --show-toplevel` resolves to `/Users/jacksontaylor/stickee`, and its `.git/config` shows a plain, standalone repo (`bare = false`, no remotes configured). It is currently **local-only** — no `origin` has ever been set, so it has never been pushed to GitHub or anywhere else. (This is itself worth flagging separately: there is no off-machine backup of this history yet.)

## 2. Is Buds at Work in the same repository?

No. It does not exist anywhere under `/Users/jacksontaylor/stickee`. It lives at `/Users/jacksontaylor/budsatwork`, a completely separate git repository with its own `.git`, `.env.local`, `.clerk` (Clerk auth) config, `AGENTS_ACTIVATION.md`/`AGENTS_README.md`/`CLAUDE.md`, and a remote at `https://github.com/budsatwork0-ai/budsatworkaus.git`. (Two other paths — `/Users/jacksontaylor/buds-at-work`, an empty directory, and `/Users/jacksontaylor/Documents/BudsWrapper` — appear to be stale/unrelated leftovers, not git repositories, and not part of Stickee either.)

## 3. Is this a monorepo?

No. Checked for and found none of: a `workspaces` field in `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, `lerna.json`, or `apps/`/`packages/` directories. `package.json`'s `"name"` is `"stickee"` — a single, standalone application package.

## 4. Are there shared packages?

None found. No `file:`/`link:` local package references in either `stickee/package.json` or `budsatwork/package.json`, no shared `packages/` directory, no common internal npm scope, and the two apps have different `package.json` `"name"` values (`stickee` vs `budsatwork`). Each has its own independent `node_modules`.

## 5. Any Buds at Work content still inside the Stickee repository?

None found, across every category checked:

| Category | Checked | Result |
|---|---|---|
| Files/filenames | `find . -iname "*bud*"` (excluding `node_modules`/`.git`/`.next`) | No matches |
| Source code | `grep -rli` for `buds.?at.?work`, `budsatwork`, `malucare` across `.ts`/`.tsx`/`.sql`/`.md`/`.json`/`.env*` | No matches |
| Routes | Full `find src/app` route listing (see Batch A / prior audits for the full route tree) | No Buds at Work-related routes; all routes are civic/political (predictions, decisions, parliament, leaders, feed, etc.) |
| Database tables | `supabase/migrations/*.sql` (17 migrations, all civic-platform schema: `issues`, `issue_markets`, `user_wallets`, `wallet_positions`, `member_votes`, `feed_posts`, `pillar_metrics`, etc.) | No Buds at Work-related tables |
| Branding/assets | `public/` contents | Only default `create-next-app` boilerplate SVGs (`vercel.svg`, `next.svg`, etc.) and a `sw.js` — no Buds at Work branding |
| Environment variables | `.env.local` variable names (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `THEYVOTEFORYOU_API_KEY`, `SYNC_SECRET`) | All Stickee-specific (Supabase + TheyVoteForYou sync); Supabase project itself is dedicated (`supabase/config.toml` → `project_id = "stickee"`, distinct project URL) |
| Components | Full `src/components/` listing (from prior audits in this session) | All civic-platform components (MarketCard, DecisionCard, MPVoteGrid, SenateView, etc.) — nothing Buds at Work-related |

## 6. Any Stickee files inside the Buds at Work application?

None found. `grep -rli "stickee"` across `.ts`/`.tsx`/`.json`/`.md`/`.env*` in `/Users/jacksontaylor/budsatwork` (excluding `node_modules`/`.next`/`.git`) returned no matches. (Scope note: this was a targeted grep for cross-references only — a full structural audit of the Buds at Work repository itself was not performed, as it's out of scope for a Stickee repository audit.)

## Current repository structure (Stickee)

```
/Users/jacksontaylor/stickee/          (git root, no remote configured)
├── src/
│   ├── app/            Next.js App Router routes (single app)
│   ├── components/     Shared React components
│   ├── hooks/
│   ├── lib/
│   └── types/
├── supabase/
│   ├── migrations/      17 migrations — all Stickee civic-platform schema
│   ├── tests/            pgTAP tests (wallet lockdown, market eligibility, settlement)
│   ├── seed.sql
│   └── config.toml       project_id = "stickee"
├── scripts/              secret-scan.mjs, etc.
├── public/                default Next.js boilerplate assets only
├── package.json           single-app manifest, name: "stickee", no workspaces
├── vercel.json             cron job config (agent schedulers) — Stickee-only
├── vitest.config.ts
└── (~15 audit/report .md files at root — working documents from recent sessions)
```

Single application, single `package.json`, single deployable unit. No nested repositories, no submodules (`.gitmodules` not present).

## Git remotes

| Repo | Remote | URL |
|---|---|---|
| Stickee (`/Users/jacksontaylor/stickee`) | **none configured** | — |
| Buds at Work (`/Users/jacksontaylor/budsatwork`) | `origin` | `https://github.com/budsatwork0-ai/budsatworkaus.git` |

## Detected applications

Exactly one application in this repository: **Stickee**, a Next.js 16 / React 19 civic-intelligence platform (prediction markets, parliament tracking, MP scorecards, feed, decisions, election data). No second app, admin panel, or marketing site lives in a subdirectory here — `/admin` is a route within the same Next.js app, not a separate deployable.

## Shared code

None to report — there is only one application in this repository, so "shared" doesn't apply. Confirmed no shared code with Buds at Work either (§4, §6).

## Deployment configuration

- `vercel.json` defines 9 cron-triggered routes (`/api/agents/*`, `/api/sync/*`) — all Stickee agent/sync jobs, nothing Buds at Work-related.
- No `.vercel/` project-link directory present locally, so this working copy isn't currently linked to a specific Vercel project via the CLI (deployment may be configured via the Vercel dashboard/Git integration instead — not verifiable from the filesystem alone).
- Supabase: dedicated project (`project_id = "stickee"`, own project URL), not shared with Buds at Work.
- No CI/CD config found wiring Stickee and Buds at Work together (`.github/` contains only Stickee-scoped content).

## Risks

1. **No git remote.** The single largest structural risk found in this audit: Stickee's entire commit history exists only on this machine. There is no off-machine backup, no PR/review workflow possible, and a local disk failure would lose all history. This is unrelated to Buds at Work but is the most consequential finding of a "repository structure" audit.
2. **Large number of uncommitted working-tree changes** (per `git status` throughout this session — dozens of modified/untracked files) sitting on top of a repo with no remote — compounds risk #1.
3. **No monorepo tooling risk** — since there's no monorepo, there's no risk of accidental cross-package leakage via workspace hoisting, shared `node_modules`, or build-tool misconfiguration. This is a non-issue precisely because the structure is already separated.
4. Two stray, empty/unclear directories (`/Users/jacksontaylor/buds-at-work`, `/Users/jacksontaylor/Documents/BudsWrapper`) exist outside both real repos — not a Stickee risk, just noted for completeness since they matched the search terms.

## Recommendation

**No separation work is needed — the projects are already fully separate.** The repository-entanglement risk this audit was framed to check for does not exist: zero shared files, tables, routes, branding, env vars, components, or packages were found in either direction.

The one real action item this audit surfaces is unrelated to Buds at Work: **Stickee has no git remote.** Recommend adding one (e.g., a private GitHub repo) and pushing the current history, so the project has off-machine backup and a real PR-review workflow becomes possible — consistent with the constitution's engineering-principles emphasis on maintainability and long-term architecture. This is a decision for you to make explicitly (creating/pushing to a remote is exactly the kind of action this environment treats as needing confirmation before proceeding), not something to do unprompted.

## Migration plan if separation is recommended

Not applicable — there is nothing to migrate or separate. If in the future the two projects need to *share* something deliberately (e.g., a common design-system package, or a shared auth provider), the correct approach at that point would be a small, explicit shared package (npm workspace or private package registry) rather than merging the repositories — but that is a hypothetical for a future need, not a current gap.
