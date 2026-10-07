# Template — Council Summary (Council Chair)

Use this template whenever the **Council Chair** synthesises findings from any of the other review-mode templates. See [agents/council-chair.md](../council-chair.md) for the Chair's full mandate, and [agents/README.md](../README.md) for how to invoke the full council.

This is the only template that produces the six-way overall recommendation. Do not skip straight to this template without first collecting each invoked specialist agent's independent findings — synthesis without independent input is not a council review, it's one agent's opinion wearing thirteen hats.

---

## Input

```
Review mode used: Page / Feature / Pull Request / Open-Source Readiness / User-Journey / Content / Architecture / Product Benchmark
Agents invoked: <list>
Per-agent findings: <attach each agent's output in its own required format, unedited>
```

## Output

```
## Approval matrix

Software Architecture:      Approved / Approved with conditions / Blocked / Not applicable
Product:                     Approved / Approved with conditions / Blocked / Not applicable
Public Policy:                Approved / Approved with conditions / Blocked / Not applicable
Civic Technology:            Approved / Approved with conditions / Blocked / Not applicable
Legal and Regulatory:        Approved / Professional review required / Blocked / Not applicable
Editorial:                    Approved / Approved with sourcing conditions / Blocked / Not applicable
UX:                           Approved / Approved with changes / Blocked / Not applicable
Open Source:                  Contributor-ready / Private-only / Not ready / Not applicable
Journey and Bottlenecks:      Acceptable / Significant friction / Blocking friction / Not applicable
Product Benchmarking:         Adopt / Adapt / Experiment first / Defer / Reject / Requires professional review / Not applicable
Data & Evidence:              Approved / Approved with conditions / Blocked / Not applicable
Historical Integrity:         Approved / Approved with conditions / Blocked / Not applicable

## Consensus findings
<merged findings, crediting each agent that independently raised it>

## Disagreements
<explicit: what each side said, and why — do not resolve silently>

## Blocking risks
<priority order — P0s, "Blocked," "Do not launch before legal review," "Blocking friction" first>

## Owner decisions required
<listed separately — these are not the Chair's to resolve>

## Overall recommendation: Merge / Merge after specified fixes / Do not merge / Requires owner decision / Requires real professional review / Requires user research / Requires real-database verification
<explanation, referencing specific findings>

## Implementation order (if proceeding)
<sequenced, smallest/safest first — a plan for a human to approve and execute, not an executed action>
```
