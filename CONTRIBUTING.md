# Contributing to Stickee

Thanks for helping. This page takes about 5 minutes to read.

**The short version:**

1. Pick a role below.
2. Pick an issue with a `good first issue` or `data-verify` label.
3. Comment "I'll take this" so nobody doubles up.
4. Do it, open a PR (or post your check in the issue).
5. A maintainer replies within 48 hours.

## The four roles

| Role | First task (under 30 min) | Next step up |
|---|---|---|
| **Data verifier** (no code) | Check one figure against its government source. Tick "matches" or flag a gap. | Own a dataset, e.g. fuel excise rates |
| **Coder** | A small UI fix or test with a clear done check | A `help wanted` feature, then reviewing PRs |
| **Designer** | Fix one contrast or spacing issue from the accessibility list | Own a page's design |
| **Researcher** (no code) | Find the primary source for one claim | Write a methodology note |

Ladder: **first task → regular → reviewer → maintainer.** Regulars who review well get asked to become reviewers.

## Your first task, step by step

1. Open [`good first issue`](https://github.com/stickee-aus/stickee/labels/good%20first%20issue) or [`data-verify`](https://github.com/stickee-aus/stickee/labels/data-verify).
2. Each issue has: what to do, where, how to know it's done, and a named helper.
3. Comment on the issue to claim it. If you go quiet for 7 days, it goes back to the pool (no hard feelings).
4. Stuck for more than 15 minutes? Ask in the issue and tag the helper.

**Data verifiers and researchers:** no fork or code needed. Post your result as a comment using the checklist in the issue.

## Labels

Full list: [docs/LABELS.md](docs/LABELS.md).

| Label | Means |
|---|---|
| `good first issue` | Under 30 min, about one file, steps written out |
| `data-verify` | No code: check a number against its source |
| `data-gap` | A figure or source is missing or wrong |
| `help wanted` | Half a day or more, some context needed |
| `difficulty:easy` / `medium` / `hard` | Rough size |
| `role:coder` / `role:data` / `role:design` / `role:research` | Who it suits |
| `needs-methodology` | Blocked until the method is written and reviewed |
| `accessibility` | A barrier for disabled users |

## Pull request process (coders and designers)

1. Fork the repo and create a branch: `fix/short-name`, `feat/short-name`, `docs/short-name` or `data/short-name`.
2. Set up locally (see [README](README.md#run-it-locally-no-production-credentials)). Never use production keys.
3. Keep the PR small: one fix or feature.
4. Run the checks CI runs:
   ```bash
   npm run secret-scan && npx tsc --noEmit && npm run lint && npm test && npm run build
   ```
5. Open the PR and fill in the template. Add screenshots for UI changes (desktop and mobile).
6. A maintainer reviews within 48 hours. Expect small change requests; that's normal.
7. Database migrations (`supabase/migrations`) need maintainer approval before they are written. Open an issue first.

Read [docs/architecture/CONTRIBUTOR_ARCHITECTURE_GUIDE.md](docs/architecture/CONTRIBUTOR_ARCHITECTURE_GUIDE.md) before building a new feature.

## Evidence rules

These are not optional.

1. **Every data claim needs a cited primary source.** Primary means the original publisher: ATO, Treasury Budget papers, AEC, APH/Hansard, legislation.gov.au, NDIA, ABS. News articles and blogs can point you to a source, but are not the source.
2. **Cite precisely.** URL, document title, table or page number, and the date you accessed it.
3. **Record the licence** of any third-party data you add (see [DATA_LICENSE.md](DATA_LICENSE.md)).
4. **Show your working.** If a number is calculated, write the formula and inputs.
5. **Mark uncertainty.** Say "estimate" or "unknown" instead of guessing. A flagged gap is a good contribution.
6. **Two checks before publishing.** A new figure needs a second verifier to confirm it.
7. **Corrections are public.** If we got it wrong, we fix it and note what changed.

## Non-partisan rule

Stickee does not support or oppose any party, candidate or MP.

- Describe what happened, with sources. Don't add adjectives that judge.
- Apply the same method to every party. If a method can't be applied evenly, it doesn't ship.
- No campaigning, vote appeals or party promotion in issues, PRs, code or data.
- Attribution features (who caused what) need a published, reviewed method first (`needs-methodology`).

Breaking this rule is a Code of Conduct issue.

## Getting credit

Merged PRs, accepted source checks, accepted data-gap flags and reviews all count. Sign-ups and stars don't. We'll list contributors in the README (opt-in).

## Licence of your work

By contributing, you agree that:

- code is licensed under [AGPL-3.0-only](LICENSE), and
- data and written content are licensed under [CC BY 4.0](DATA_LICENSE.md).

## Conduct and security

- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- Found a security problem? **Don't open an issue.** Follow [SECURITY.md](SECURITY.md).
