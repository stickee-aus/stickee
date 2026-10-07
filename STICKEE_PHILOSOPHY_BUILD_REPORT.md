# Stickee Philosophy Build Report

Governed by `AGENTS.md`. Documentation and governance task only. Produced `docs/philosophy/STICKEE_CHARTER.md`, the canonical philosophy document, with `docs/philosophy/HOW_STICKEE_THINKS.md` as its short plain-language introduction, and made minimal, non-duplicating cross-references from four existing documents. **No application code, CSS, route, or database was touched to produce this.**

## Addendum — naming (post-initial-delivery)

The document was originally drafted at `docs/philosophy/HOW_STICKEE_THINKS.md` as the substantive governing document, per the task brief's literal filename. The owner then proposed renaming it to `STICKEE_CONSTITUTION.md` to signal binding weight, with `HOW_STICKEE_THINKS.md` kept as a short friendly introduction pointing to it.

That exact name was not used: `AGENTS.md` already opens with `# STICKEE PROJECT CONSTITUTION` (line 7), and that identity is load-bearing throughout the repository — `docs/STICKEE_COUNCIL.md` refers to it as "the Stickee project constitution" repeatedly, and all thirteen `agents/*.md` persona files open with "Governed by `AGENTS.md`" on that basis. A second file also titled "Constitution" would have put two documents in the repo both plausibly claiming that title, directly against `AGENTS.md`'s own single-source-of-truth principle. This was flagged to the owner with three options (new distinct name / promote the new doc and relabel `AGENTS.md` / accept the ambiguity); the owner chose the first.

Resulting structure:

- **`docs/philosophy/STICKEE_CHARTER.md`** — the substantive governing document (the content originally drafted, retitled from "constitution" language to "Charter" throughout, otherwise unchanged in substance). `AGENTS.md` keeps its existing constitution identity, unchanged; precedence is unchanged (`AGENTS.md` wins on conflict).
- **`docs/philosophy/HOW_STICKEE_THINKS.md`** — rewritten as a short (one-page) plain-language introduction that summarises the load-bearing principles in a few paragraphs and points to the Charter for the operational version.
- The four cross-references added in the initial pass (`AGENTS.md`, `docs/STICKEE_COUNCIL.md`, `docs/architecture/CONTRIBUTOR_ARCHITECTURE_GUIDE.md`, `STICKEE_V1_PRODUCT_BLUEPRINT.md`) were updated to point contributors to the Charter as the operative "read before work" document, while also naming the introduction as an optional first stop.

No content, principle, or non-negotiable changed — this was a naming and structural-indirection fix only, resolved before any further build-out.

---

## Documents read before drafting

- `AGENTS.md` (project constitution)
- `CLAUDE.md` (points to `AGENTS.md`)
- `STICKEE_V1_PRODUCT_BLUEPRINT.md`
- `STICKEE_V1_EXECUTIVE_SUMMARY.md`
- `docs/STICKEE_COUNCIL.md`
- `agents/README.md` and all thirteen `agents/*.md` persona files (Software Architect, Product Strategist, Public Policy Advisor, Civic Technology Advisor, Legal Advisor, Editorial Advisor, UX Researcher, Open-Source Maintainer, UX Journey and Bottleneck Analyst, Product Intelligence & Benchmarking Advisor, Data & Evidence Steward, Historian & Knowledge Preservation Advisor, Council Chair)
- `docs/PRODUCT_BENCHMARKING_METHOD.md`
- `docs/PRODUCT_PATTERN_LIBRARY.md` (targeted sections: corrections, AI-generated content, revision history, contribution workflow)
- `docs/page-audits/CIVIC_ACTION_MODEL.md`
- `docs/page-audits/RESPONSIBILITY_MAP_SPEC.md`
- `CIVIC_DESIGN_SYSTEM.md`
- `docs/architecture/CONTRIBUTOR_ARCHITECTURE_GUIDE.md`
- `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md`
- Full repository markdown inventory (`find . -iname "*.md"`) and a targeted content search for "truthful/mission/neutral/editorial/correction/AI-governance/impartial" across all markdown files, to confirm no existing document already serves as this canonical philosophy.

`docs/architecture/*` (Domain Model, Engineering Principles, Future Systems, Page Composition Guide, Relationship Graph, System Architecture, System Boundaries, System Glossary) and `docs/page-audits/*` beyond the two named above were confirmed present and consulted for architectural/product-debt context already cited throughout the new document (e.g. `MP_SCORE_METHODOLOGY_REQUIREMENTS.md`, `PRODUCT_PATTERN_LIBRARY.md`'s correction/revision-history entries), but were not re-summarised — this task does not repeat existing audits, per the brief.

## Existing overlaps found

No existing document already serves as a durable, mission-level "how Stickee thinks" philosophy. What exists instead:

- **`AGENTS.md`** is the operating constitution — vision, design rules, engineering discipline, truthfulness classification, production/security safety. It states *what* is required. It does not, in prose, explain the underlying beliefs (why neutrality means impartial-in-process-not-indifferent-to-evidence, why accountability follows the decision, why AI's role has the specific shape it has).
- **`docs/STICKEE_COUNCIL.md`** and `agents/*.md` are governance mechanics — *who* decides and *how* a review runs. They presuppose the philosophy; they don't state it.
- **`docs/page-audits/CIVIC_ACTION_MODEL.md`** and **`RESPONSIBILITY_MAP_SPEC.md`** are the most philosophically adjacent existing documents — both already encode founder-intent principles operationally (civic action honesty, accountability-follows-the-decision) but scoped to specific features, not stated as general platform philosophy.
- **`docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md`** encodes the evidence/correction/reproducibility standard for one specific case (MP scoring) that the new document generalises in Sections 5, 7, and 9.
- **`docs/PRODUCT_BENCHMARKING_METHOD.md`** encodes an AI-governance-adjacent discipline (evidence classification, cargo-cult avoidance) for one specific process (benchmarking), referenced but not duplicated.
- No document previously addressed: founder-intent-vs-platform-policy separation, the AI publication-risk tiers, the Australian-civic-not-ethnic boundary, or a single contributor decision test spanning product, editorial, AI, and civic-data work at once.

**Conclusion:** `docs/philosophy/HOW_STICKEE_THINKS.md` fills a real, previously-unfilled gap rather than duplicating an existing document. It is now the canonical source for platform philosophy; `AGENTS.md` remains canonical for operating rules, with a stated precedence (`AGENTS.md` wins on conflict).

## Final structure

21 sections as specified in the brief: Preamble; Why Stickee exists; Who Stickee serves; What role Stickee chooses to play; How Stickee approaches truth; How Stickee handles disagreement; How Stickee communicates uncertainty; How Stickee uses AI; How Stickee corrects mistakes; How Stickee thinks about accountability; How Stickee teaches politics; How Stickee supports civic action; How Stickee protects Australian civic participation; How Stickee treats culture, belonging and national focus; How Stickee approaches forecasts; How Stickee approaches community discussion; How Stickee designs experiences; How Stickee measures success; Non-negotiables; Contributor decision test; Closing declaration.

## Major principles included

- Impartial in process, not indifferent to evidence — neutrality as a process discipline, not equal-weighting of unequal evidence.
- Understanding before judgement; context before conclusion — steelmanning every side without manufacturing false balance.
- Uncertainty is information — every substantive claim states what's known, disputed, and uncertain.
- AI may assist; a human remains accountable — a concrete, six-condition test for when AI may publish unsupervised, and a named list of always-human-reviewed content categories.
- Mistakes are inevitable; concealment is not — corrections are public, dated, explained, never silently applied.
- Accountability follows the decision, not the most visible name — distributed institutional responsibility, never flattened to "everything this person did wrong."
- Start with the citizen's question, not the institution — the housing-cost example generalised into a standing design instruction.
- Civic action is never presented as guaranteed influence — every action states who receives it, realistic outcome, and what Stickee can and cannot confirm.
- Australian focus is civic, never ethnic, ancestral, religious, or surname-based — stated as a hard non-negotiable, with foreign-influence risk reframed as an authenticity/coordination problem rather than a background test.
- Forecasting is kept, reframed as evidence-extended-into-uncertainty, with a standing legal-review gate on anything approaching redeemable value.
- Success is measured by reader capability (can they explain what changed, find the evidence, act, and later check the outcome) — not attention metrics.

## Founder statements translated into operational rules

Representative examples (full mapping is in the document itself, not restated here):

- "Ordinary Australians often don't understand how politics works" → Section 3's "same evidence, progressively deeper levels" design constraint, and Section 11's "start with the citizen's question."
- "Impartial but not indifferent to evidence" → Section 5's explicit rejection of false balance, paired with the classification taxonomy already in `AGENTS.md`.
- "Labels should never replace arguments" → Section 5, stated as a standing rule against both external labelling and Stickee's own.
- "Mistakes are inevitable; concealing them is unacceptable" → Section 9, operationalised as public/dated/explained/never-silent, cross-referenced to the actual (partially unbuilt) revision-history mechanism so the standard isn't mistaken for a shipped feature.
- "AI may publish automatically only where..." (point 26) → Section 8's six-condition test, verbatim in substance, restated in prose.
- "Australian focus must not become an ethnicity/ancestry/religion/surname test" → Section 13, stated as a non-negotiable in Section 19 as well, doubled up deliberately given its sensitivity.
- "Progress should not be measured by features shipped..." → Section 18, directly.

## Tensions or contradictions resolved

Two were found and fixed during self-review (see Council review below), both before finalising the document — not left as open findings:

1. **Descriptive vs. normative tense.** Section 9's original draft described corrections and revision history in a way that could be read as claiming those mechanisms already exist end-to-end, when the real revision-history/correction-log mechanism is a documented, partially-unbuilt gap (`docs/PRODUCT_PATTERN_LIBRARY.md`'s "Canonical page revision history" and "Evidence-based public corrections" entries, both marked with open owner decisions). Fixed by adding a "note on tense" to the Preamble and a direct cross-reference in Section 9 itself, so the document states the standard without misrepresenting current build status — this is a direct application of the document's own Global Council Principle #1 (truth before completeness) to itself.
2. **Self-referential permanence gap.** The document initially had no stated convention for how its own future edits should be recorded, which would have made it exempt from the same "no silent rewrite" standard it sets for the rest of the platform in Section 9. Fixed by adding a "note on revision" to the Preamble.

No contradiction was found between this document and `AGENTS.md`, `docs/STICKEE_COUNCIL.md`, or any agent persona file — the philosophy was checked against all of them and found consistent, including the more subtle points (Section 4/5's neutrality framing against the Public Policy Advisor's "no personal political opinion" boundary; Section 10's MP-vs-Minister distinction against the already-ratified Consensus C9 finding in `STICKEE_V1_EXECUTIVE_SUMMARY.md`).

## Council review

Per `agents/README.md`'s own definition ("a human — you, or Claude Code acting on your instruction — plays the role each time"), this review was conducted by independently applying each relevant agent's mandate, standard questions, evidence standards, and approval criteria from its own `agents/*.md` file directly against the drafted document, before any cross-referencing between agents' findings.

Review level: treated as Level 3 (a canonical, project-wide governance document, per `docs/STICKEE_COUNCIL.md`'s Level 3 criteria — "political methodology" and comparable major decisions) — full council.

```
Software Architecture:      Not applicable — documentation only, no code/schema/architecture surface
Product:                     Approved — no scope proposed, no priority-order jump, reduces future ambiguity
Public Policy:                Approved — neutrality framing consistent with existing "no personal opinion" boundary and ratified Consensus C9 (MP vs Minister)
Civic Technology:            Approved — with a non-blocking P3 note (see Owner Decisions)
Legal and Regulatory:        Approved (Informational) — does not resolve, and is not a substitute for, the still-open Privacy Policy/ToS gap
Editorial:                    Approved — journalistic register maintained; no partisan framing; slogans used with operational explanation, not as filler
UX:                           Approved — with a non-blocking P3 note (see Owner Decisions)
Open Source:                  Contributor-ready — no credentials, no production references, safe to be public
Journey and Bottlenecks:      Not applicable — no multi-step user journey in scope
Product Benchmarking:         Not applicable — no benchmarked pattern proposed or adapted
Data & Evidence:              Approved with conditions → resolved in this pass (see Tensions Resolved #1)
Historical Integrity:         Approved with conditions → resolved in this pass (see Tensions Resolved #2)

Overall recommendation: Merge (adopt as canonical)
```

The Council Chair's synthesis: no blocking (P0-equivalent) finding from any reviewer. The two "Approved with conditions" findings (Data & Evidence Steward, Historian) were genuine, independently-reasoned findings — not echoes of each other, since they concern different failure modes (evidence-status accuracy vs. self-referential revision permanence) — and both were small, scoped documentation fixes, resolved inline rather than left open, consistent with the Chair's "merge after specified fixes" pattern collapsing into a clean merge once the fixes are actually applied within the same review.

## Unresolved owner decisions

1. **Precedence ratification.** The document states `AGENTS.md` wins on any conflict with itself. This is the natural reading of "constitution vs. philosophy," but it's a new, load-bearing governance relationship and should be explicitly confirmed by the owner rather than assumed permanent by implication.
2. **Public-facing distillation (Civic Technology Advisor, P3, non-blocking).** This document is written for contributors, not end users. Whether to eventually derive a short, plain-language "About/Trust" page for readers from it is a real, separate product decision — not scoped or built here.
3. **Readability aid (UX Researcher, P3, non-blocking).** Whether to add a table of contents or one-paragraph summary card to the document for a first-time contributor — cosmetic, not required for the document to function.
4. **Pre-existing Privacy Policy/Terms of Service gap.** Unchanged by this task. Already named in `STICKEE_V1_EXECUTIVE_SUMMARY.md` Owner Decision 7 and the Legal Advisor's standing mandate. This document does not resolve it and should not be read as doing so.
5. **Further integration.** `README.md`, a future `CONTRIBUTING.md` (does not yet exist), and any future onboarding material were deliberately *not* edited this pass — the brief specified minimal integration into four named documents only. Whether to extend the pointer further is a follow-up owner call.

## Professional-review requirements

None newly triggered by this task. The document references, but does not resolve or weaken, the professional-review gates already established elsewhere: real legal review for any forecast mechanic approaching redeemable value (Section 15, consistent with `STICKEE_V1_EXECUTIVE_SUMMARY.md` Disagreement D1), real legal review for the deferred Community/real-person-nomination feature (referenced implicitly via Section 10's accountability standard, not reopened here), and the standing requirement that genuinely uncertain political or legal claims be escalated rather than resolved by any single AI agent (Sections 6, 8, 15).

## Files changed

- **Created:** `docs/philosophy/HOW_STICKEE_THINKS.md`
- **Created:** `STICKEE_PHILOSOPHY_BUILD_REPORT.md` (this file)
- **Edited (minimal, non-duplicating pointer only):**
  - `AGENTS.md` — one paragraph added directing readers to the new document before product/editorial/AI/moderation/civic-data work
  - `docs/STICKEE_COUNCIL.md` — one sentence added to the intro paragraph
  - `docs/architecture/CONTRIBUTOR_ARCHITECTURE_GUIDE.md` — one sentence added after the "what Stickee is" paragraph
  - `STICKEE_V1_PRODUCT_BLUEPRINT.md` — one sentence added to the header block

No other file was modified. No historical audit finding was rewritten. No existing document was renamed or deleted.

## Confirmations

- **No application code, CSS, route, or database was touched.** Only Markdown documentation files were created or edited.
- **Nothing was staged, committed, pushed, or deployed.** All changes remain as working-tree edits for the owner's review.
- **Production was not accessed, modified, or touched in any way.**
- All unrelated pre-existing working-tree changes (the modified `src/app/*`, `src/components/*`, `src/hooks/*`, `src/lib/*`, `src/types/*` files, and the many untracked report/audit `.md` files present at session start) were left exactly as found.
