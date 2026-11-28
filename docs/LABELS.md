# Issue labels

Every issue should have: **one type label**, **one difficulty label**, and **one role label**.
`good first issue` and `data-verify` issues must also name a helper and include a done check.

The machine-readable list is in [`.github/labels.yml`](../.github/labels.yml). Labels are **not** created automatically; a maintainer creates them.

## Entry points

| Label | Means | Rules |
|---|---|---|
| `good first issue` | Under 30 min, about one file | Steps written out, done check, named helper. GitHub shows these on the repo's `/contribute` page. |
| `data-verify` | No code: check one number against its primary source | Link the figure and the expected source |
| `help wanted` | Half a day or more, some context needed | Link the relevant docs |

`good first issue` and `help wanted` keep GitHub's default names (with spaces) so GitHub's own contributor tools pick them up.

## Difficulty

| Label | Rough size |
|---|---|
| `difficulty:easy` | Under 1 hour |
| `difficulty:medium` | Half a day |
| `difficulty:hard` | More than a day, or touches security, payments or the database |

## Role

| Label | Who it suits |
|---|---|
| `role:coder` | Writes code or tests |
| `role:data` | Data verifiers (no code) |
| `role:design` | Designers, accessibility |
| `role:research` | Researchers, method notes (no code) |

## Type and status

| Label | Means |
|---|---|
| `bug` | Something is broken (GitHub default) |
| `enhancement` | New feature (GitHub default) |
| `documentation` | Docs only (GitHub default) |
| `data-gap` | A figure is missing, wrong, stale, or has no source |
| `needs-methodology` | Blocked until the method is written and reviewed |
| `accessibility` | A barrier for disabled users (already exists) |
| `security` | Hardening work. Never use for unreported vulnerabilities; see SECURITY.md |

## Not counted as contributions

Opening an issue with no detail, stars, and sign-ups. Accepted work counts: merged PRs, accepted source checks, accepted data-gap flags, and reviews.
