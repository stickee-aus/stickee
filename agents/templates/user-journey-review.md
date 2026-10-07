# Template — User-Journey Review

Use when mapping a specific end-to-end task a user is trying to complete. See [agents/README.md](../README.md) for how to invoke agents.

Agents typically involved: **UX Journey and Bottleneck Analyst** (lead), **UX Researcher** (per-screen detail), **Civic Technology Advisor** (is the outcome genuine), **Public Policy Advisor** (if the journey involves political classification), **Council Chair**.

---

## Input

```
User goal: <one of the twelve standard journeys, or a custom one — state which>
Entry point: <where the user starts, e.g. home page, a shared link, search>
Route path: <the actual sequence of routes/components traced, not assumed>
Screenshots: <attach or describe, or "not available">
Analytics: <real data if available, or "not available — findings below are code-traced/hypothesis only">
```

## Output

### Journey map

Full format from `agents/ux-journey-bottleneck-analyst.md`: user, goal, entry point, current route(s)/steps, expected vs. actual outcome, bottlenecks by category, trust risks, dead ends, unnecessary steps, missing information, proposed route, recommended fix, priority, confidence (Observed/Hypothesis).

### Bottlenecks

Ranked list, each tagged with its category (Navigation, Terminology, Information architecture, Trust, Data quality, Authentication, Accessibility, Mobile usability, Performance, Broken interaction, Missing state, Duplicate system, Content overload, Missing next step).

### Trust risks

Called out separately from general friction — anything that could make a user doubt Stickee's honesty or competence, not just anything mildly confusing.

### Fixes

Smallest safe fix per bottleneck, sequenced by priority.

### Test plan

What a real usability test or real analytics instrumentation would need to check to confirm or refute each Hypothesis-confidence finding.
