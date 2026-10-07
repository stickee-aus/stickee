# Template — Pull Request Review

Use when reviewing a diff before merge. See [agents/README.md](../README.md) for how to invoke agents.

Agents typically involved: **Software Architect** (lead on correctness/regression), **Product Strategist**, **Public Policy Advisor** and **Editorial Advisor** (if content/copy changed), **Legal Advisor** (if data/consent/value mechanics changed), **UX Researcher** (if UI changed), **Council Chair**.

This template does not grant permission to stage, commit, push, or merge. It produces a recommendation for a human to act on.

---

## Input

```
Diff: <paste or describe the actual changed lines>
Changed files: <list>
Tests: <which tests were added/changed, and whether they were actually run — cite the command and result, or state "not run">
Migrations: <list, or "none">
Screenshots: <if UI changed, attach or describe; otherwise "not applicable">
```

## Output

### Correctness

Software Architect's assessment: does the diff do what it claims, are there regression risks, are tests adequate for the change (especially for anything touching wallets/staking/settlement/RLS — static review alone is insufficient per AGENTS.md).

### Regression risks

Specific existing behaviour that could break, cited by file/function, not a generic "could have side effects."

### Policy/content concerns

Public Policy Advisor and Editorial Advisor findings if the diff changes any user-facing political content or copy; "Not applicable" if it doesn't.

### UX impact

UX Researcher findings if the diff changes any UI; "Not applicable" if it doesn't.

### Legal concerns

Legal Advisor findings if the diff changes data collection, consent, moderation, or anything value/points/staking-adjacent; "Not applicable" if it doesn't.

### Merge recommendation

The Council Chair's overall recommendation label, plus the specific implementation order if "Merge after specified fixes" applies.
