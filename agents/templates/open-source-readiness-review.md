# Template — Open-Source Readiness Review

Use when deciding whether the repo (or part of it) is ready for outside contributors. See [agents/README.md](../README.md) for how to invoke agents.

Agents typically involved: **Open-Source Maintainer** (lead), **Software Architect**, **Legal Advisor** (licensing, redistribution rights), **Product Strategist** (is this the right time), **Council Chair**.

---

## Input

```
Repository state: <branch/commit reviewed>
Docs present: <list what exists — README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, licence, etc.>
CI: <what runs, cite the workflow file, or "none configured">
Licence: <current licence, or "none">
Issue backlog: <sample of real open issues, or "not available">
Setup process attempted: <yes, with outcome / no, not attempted>
```

## Output

### Readiness score

Open-Source Maintainer's 1–5 score with justification.

### Blockers

P0/P1 findings — anything that would expose credentials, break setup entirely, or leave the project without a security-disclosure path.

### Private-collaboration readiness

Is this workable today for a small group of trusted, directly-briefed collaborators?

### Public-open-source readiness

Is this workable today for an anonymous stranger with no prior context? If not, what's the gap between private-ready and public-ready?

### Recommended contributor tasks

Specific, scoped tasks a new contributor could pick up safely, with acceptance criteria — not "improve the leaderboard."

### Chair verdict

Contributor-ready / Private-only / Not ready, reconciling the Maintainer's readiness score with any Legal or Product blocking concerns (e.g. licensing not yet decided, or going public isn't the right sequencing move regardless of technical readiness).
