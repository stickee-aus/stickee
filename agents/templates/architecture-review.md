# Template — Architecture Review

Use when reviewing a schema, route tree, or proposed refactor. See [agents/README.md](../README.md) for how to invoke agents.

Agents typically involved: **Software Architect** (lead), **Product Strategist** (is the reason for this refactor actually a product decision), **Open-Source Maintainer** (contributor-comprehensibility impact), **Council Chair**.

---

## Input

```
Route tree: <relevant subset, or full tree if the review is broad>
Schema: <relevant tables/migrations>
Components: <relevant files>
Data flow: <how data currently moves — describe or diagram>
Proposed refactor: <what would change, or "none — this is an audit of current state">
```

## Output

### Domain model

What the canonical domain model actually is today (cite types/tables), and whether it's singular or fragmented across parallel implementations.

### Duplication

Specific instances of parallel systems, duplicate tables, duplicate APIs, or duplicate business logic, each cited by file/table name — not a general "there's probably some duplication."

### Risks

Architectural risk of the current state and of the proposed change, including reversibility and required-test-coverage risk for anything touching sensitive systems (auth/wallets/points/staking/settlement/RLS).

### Recommended architecture

The Software Architect's recommended target state — extend existing systems in preference to new parallel ones, per AGENTS.md.

### Staged implementation plan

A sequenced plan (smallest/safest steps first) that a human would execute after owner approval — not something this review executes itself. Flag every step that would need real-database verification before being considered proven.
