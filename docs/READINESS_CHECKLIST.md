# Readiness checklist: before inviting strangers in

Goal: anyone can find Stickee, set it up without production keys, and make a first contribution safely.
Plan: Phase 0 ("public-ready repo"), December 2026.

Legend: ✅ done · ⬜ to do · 🔒 needs Jacko's yes (settings, money, public posts, merges).

## Done in this PR (`docs/contributor-ready`)

| Item | File |
|---|---|
| ✅ Code licence: AGPL-3.0-only (official GNU text) | `LICENSE`, `package.json` |
| ✅ Data licence: CC BY 4.0, with how to credit | `DATA_LICENSE.md` |
| ✅ README with "Start here", status, stack, local setup | `README.md` |
| ✅ Contributor guide: 4 roles, first task, labels, PR process, evidence and non-partisan rules | `CONTRIBUTING.md` |
| ✅ Code of Conduct (Contributor Covenant 2.1) | `CODE_OF_CONDUCT.md` |
| ✅ Private vulnerability reporting policy | `SECURITY.md` |
| ✅ Every env var the code reads, blank values only | `.env.example` (and `.gitignore` now allows it) |
| ✅ Issue forms: bug, feature, data verification, data gap | `.github/ISSUE_TEMPLATE/` |
| ✅ PR template with evidence checklist | `.github/pull_request_template.md` |
| ✅ Label definitions (not created on GitHub) | `docs/LABELS.md`, `.github/labels.yml` |
| ✅ Conduct and security contact: stickeepolitics@gmail.com | `CODE_OF_CONDUCT.md`, `SECURITY.md` |
| ✅ GitHub Discussions linked in README and issue-form config (will be turned on after merge) | `README.md`, `.github/ISSUE_TEMPLATE/config.yml` |
| ✅ Git history secret scan (gitleaks 8.21.2, all branches, 59 commits): 2 findings, both false positives (a localStorage key name constant). No `.env`, key or credential files ever committed. | report kept off-repo |

## Still needed before inviting strangers

### Security (must do first)

A public repo shows attackers exactly where the weak spots are. Source: `STRIPE_SECURITY_HANDOFF.md` (kept outside the repo).

| | Item | Why |
|---|---|---|
| ⬜🔒 | **P0-1 Webhook replay:** add a 300 s timestamp tolerance to Stripe signature check (`src/app/api/donations/webhook/route.ts`) | A captured webhook can be replayed forever |
| ⬜🔒 | **P0-2 Webhook dedupe:** store `event.id`, make handlers idempotent, return non-200 when the DB update fails | Replays can flip refunded donations back to paid |
| ⬜🔒 | P1 fixes: checkout idempotency key, success page verifies with Stripe, admin needs confirmed email | Lower risk, but visible in public code |
| ⬜🔒 | P1 DB policy fixes (donation_records insert, notifications insert, civic_score) | Each needs a migration, so each needs your approval |

### GitHub settings (each is a settings change)

| | Item |
|---|---|
| ✅🔒 | **Private vulnerability reporting** approved. Docs already link to it. Turn it on in Settings → Code security right after this PR is merged. |
| ✅🔒 | **GitHub Discussions** approved. README and `.github/ISSUE_TEMPLATE/config.yml` already link to it. Turn it on (add a "Say hi" category) right after this PR is merged. |
| ⬜🔒 | Create the labels in `.github/labels.yml` |
| ⬜🔒 | Branch protection on `main`: require CI to pass and 1 review |
| ⬜🔒 | Decide how to handle "workflow awaiting approval" for first-time contributors (GitHub's default for public forks is fine) |

### Contacts and people

| | Item |
|---|---|
| ✅ | **Conduct contact email** is stickeepolitics@gmail.com (`CODE_OF_CONDUCT.md`) |
| ✅ | **Security backup contact** is stickeepolitics@gmail.com (`SECURITY.md`) |
| ⬜ | Line up at least one helper/reviewer besides you, so PRs get a reply within 48 h |

### Content

| | Item |
|---|---|
| ⬜ | Write 10+ labelled starter issues (each with steps, done check, named helper) |
| ⬜ | Define the sources ledger format (where verified figures and their sources live) |
| ⬜ | Move the 43 report and planning `.md` files out of the repo root into `docs/reports/` so newcomers see the README first |
| ⬜ | Test: one outside person sets up locally from the README in 15 min, timed |

### Public posts and spend

| | Item |
|---|---|
| ⬜🔒 | Any Reddit, Mastodon or Discord post (after the fuel excise tracer exists) |
| ⬜🔒 | Any deploy, and any spend (none needed for Phase 0) |
| ⬜🔒 | Merge this PR |
