# Template — Page Review

Use when reviewing a single route end-to-end. See [agents/README.md](../README.md) for how to invoke agents.

Agents typically involved: **Software Architect**, **Product Strategist**, **Public Policy Advisor** (if political content), **Civic Technology Advisor**, **Editorial Advisor** (if published copy), **Data & Evidence Steward** (if the page states factual claims — canonical reviewer for decisions, forecasts, parliamentary records, MP profiles, per `agents/data-evidence-steward.md`), **UX Researcher**, **Council Chair**. Add **Legal Advisor** if the page touches data collection or virtual value, and **Historian** if the page has a canonical/permanent identity or the review involves a route change (see the Release Gates table in `docs/STICKEE_COUNCIL.md`, e.g. a "Government page" review names Editorial + Public Policy + Historian).

---

## Input

```
Route:
Screenshots: <attach or describe, or state "not available">
Page text: <paste actual copy, not a paraphrase>
Relevant components: <file paths>
Data source: <real Supabase query — name the table/RPC — OR mock/fixture file — name it explicitly>
Related existing docs: <e.g. docs/audits/*, PAGE_AND_ROUTE_INVENTORY.md>
```

If any field is unavailable, write "not provided" rather than leaving it blank or guessing.

## Output

### Per-agent findings

Each invoked agent produces its own findings in its own required format (see the agent's file in `agents/`). Do not compress them into prose before the Chair has seen them.

### Combined findings

The Council Chair merges duplicate findings across agents and lists any disagreements explicitly, using the format in `agents/council-chair.md`.

### Top fixes

The 3–5 highest-priority fixes across all agents, ranked P0 first, each with the smallest safe implementation described.

### Implementation recommendation

One of the Chair's six overall recommendation labels (Merge / Merge after specified fixes / Do not merge / Requires owner decision / Requires real professional review / Requires user research / Requires real-database verification), applied to "is this page fit to keep live / promote / link from elsewhere" rather than to a specific diff.
