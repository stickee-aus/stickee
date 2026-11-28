# Stickee

**Follow Australian public money and politics, with a source for every number.**

Stickee is an open-source, non-partisan civic data project for Australia. We are building:

- **A public budget tracer**, starting with fuel excise: what the rate is, how much it raises, and what it funds.
- **Civic data** on parliament, MPs, votes, bills and issues, linked to primary sources.
- **Voter education**: how ballots and preference flows work, with a simulator.

Every figure must link to a primary source (ATO, Budget papers, AEC, APH, legislation). No source, no claim.

## Start here

Pick a role. You don't need to code to help.

| Role | You'd do | First task (under 30 min) |
|---|---|---|
| **Data verifier** | Check figures against government sources | An issue labelled [`data-verify`](https://github.com/stickee-aus/stickee/labels/data-verify) |
| **Coder** | Fix bugs, build features, write tests | An issue labelled [`good first issue`](https://github.com/stickee-aus/stickee/labels/good%20first%20issue) |
| **Designer** | Accessibility, layout, charts | An issue labelled [`accessibility`](https://github.com/stickee-aus/stickee/labels/accessibility) |
| **Researcher** | Find primary sources, write method notes | An issue labelled [`role:research`](https://github.com/stickee-aus/stickee/labels/role%3Aresearch) |

Then read [CONTRIBUTING.md](CONTRIBUTING.md). It takes about 5 minutes.

## Status

Early and pre-launch. Target: ready for public use by **30 June 2027**.

- Runs locally on mock data with no env vars: home, issues, leaders, government, parliament, simulator and predictions pages.
- Real data wiring exists for AEC election helpers, They Vote For You and parliament sync.
- Not started: fuel excise tracer (first launch feature).
- Known security work before launch: see [docs/READINESS_CHECKLIST.md](docs/READINESS_CHECKLIST.md).

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, `src/app`), React 19, TypeScript
- Tailwind CSS 4, shadcn/ui, Base UI
- [Supabase](https://supabase.com) (Postgres, Auth, row-level security; migrations in `supabase/migrations`)
- Stripe Checkout and webhooks for donations (called via `fetch`, no SDK)
- Vitest for unit tests, ESLint, GitHub Actions CI
- Hosted on Vercel (scheduled jobs in `vercel.json`)

## Run it locally (no production credentials)

Needs Node.js 24 (what CI uses) and npm.

```bash
git clone https://github.com/stickee-aus/stickee.git
cd stickee
npm ci
cp .env.example .env.local   # optional; leave values blank
npm run dev
```

Open <http://localhost:3000>. With blank env vars, public pages use built-in mock data. Sign-in, donations, sync jobs and admin pages need a backend.

**Optional: local Supabase** (needs Docker). Run `npx supabase start`, then copy the printed URL and anon key into `.env.local`. Never point local dev at the production project.

Before you open a PR, run what CI runs:

```bash
npm run secret-scan
npx tsc --noEmit
npm run lint
npm test
npm run build
```

## Learn the codebase

- [CONTRIBUTING.md](CONTRIBUTING.md): roles, labels, PR process, evidence rules
- [docs/architecture/CONTRIBUTOR_ARCHITECTURE_GUIDE.md](docs/architecture/CONTRIBUTOR_ARCHITECTURE_GUIDE.md): how the systems fit together
- [docs/philosophy/HOW_STICKEE_THINKS.md](docs/philosophy/HOW_STICKEE_THINKS.md): the short version of our principles
- [CIVIC_DESIGN_SYSTEM.md](CIVIC_DESIGN_SYSTEM.md): design rules
- [docs/LABELS.md](docs/LABELS.md): what each issue label means

## Community

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md): report vulnerabilities privately, never in a public issue
- Questions and introductions: [GitHub Discussions](https://github.com/stickee-aus/stickee/discussions)

## Licence

- Code: [GNU AGPL-3.0-only](LICENSE)
- Data and written content: [CC BY 4.0](DATA_LICENSE.md)

If you run a modified version of Stickee as a public website, AGPL requires you to share your source code with its users.
