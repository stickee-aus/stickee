# Template — Content Review

Use when reviewing an issue page, decision, MP profile, forecast, or article copy. See [agents/README.md](../README.md) for how to invoke agents.

Agents typically involved: **Data & Evidence Steward** (canonical reviewer for the evidence layer — see `agents/data-evidence-steward.md`), **Editorial Advisor** (lead on framing/tone), **Public Policy Advisor**, **Civic Technology Advisor** (source visibility), **Historian** (if the content type has a canonical/permanent identity — decisions, bills, MP profiles), **Legal Advisor** (if a real, identifiable person is characterised), **Council Chair**.

---

## Input

```
Content type: Issue page / Decision / MP profile / Forecast / Article copy / Source list
Copy under review: <paste exact text>
Data backing the copy: <real Supabase data — name the table/field — OR mock/fixture data — name it explicitly>
Source list provided: <citations present in the product, or "none visible">
```

## Output

### Factual classification

Every substantive claim classified as one of: Verified fact / Sourced analysis / Forecast / Community opinion / AI-generated interpretation / Demo content / Unverified / No verified data available (per AGENTS.md). This is mandatory for every claim reviewed, not just the headline claim.

### Evidence chain (Data & Evidence Steward)

Per-claim provenance using the metadata standard in `agents/data-evidence-steward.md` (Source / Published / Retrieved / Verified / Confidence / Methodology / Last successful sync), and a Verified: Yes/No/Unknown call for each. This is the structural check; it does not evaluate whether the framing built on top of it is fair (that's Editorial) or institutionally accurate (that's Public Policy).

### Source gaps

Claims with no citable source at all, and claims whose source exists but isn't visible on the page.

### Neutrality concerns

Public Policy Advisor's findings on institutional accuracy and framing.

### Editorial revision

Editorial Advisor's suggested reframing where copy overstates certainty or reads as marketing rather than reporting — placeholder `[SOURCE NEEDED]` markers where a fabricated citation would otherwise be needed.

### Publication recommendation

Ready / Ready with edits / Not ready, plus — if a real, identifiable person is characterised in a way that could be reputationally damaging — an explicit note that Legal Advisor sign-off is required before publication regardless of editorial readiness.
