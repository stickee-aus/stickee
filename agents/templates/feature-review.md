# Template — Feature Review

Use when deciding whether/how to build a proposed feature, before code exists. See [agents/README.md](../README.md) for how to invoke agents.

Agents typically involved: **Product Strategist** (lead), **Software Architect**, **Public Policy Advisor** and **Legal Advisor** (if the feature touches political content, data, or value), **UX Researcher**, **Council Chair**.

---

## Input

```
Feature proposal: <what it does, in plain language>
Product goal: <what user problem it's meant to solve>
Architecture plan: <proposed data model, components, routes — or "not yet designed">
Data requirements: <what data it needs, where from>
UI concept: <description, sketch, or "not yet designed">
```

## Output

### Whether to build

The Product Strategist's recommendation (Build now / Build smaller / Defer / Reject / Remove or consolidate instead), reconciled with any Architect or Legal blocking findings by the Council Chair.

### Risks

Per-agent risks in each agent's own format — architectural, product-identity, political-accuracy, legal, and usability risks kept distinct, not merged into one generic risk list.

### Missing decisions

Explicit list of decisions that belong to the owner: scope size, timing, whether it fits current priority tier, any legal-review gate.

### Smallest viable implementation

A concrete, scoped description of the smallest version worth building — not the full-featured version, unless the smallest version *is* the full version.

### Agent approvals

Use the relevant rows of the Council Chair's approval matrix (skip rows for agents not invoked; mark "Not applicable").
