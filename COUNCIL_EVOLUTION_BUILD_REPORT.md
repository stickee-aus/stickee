# Stickee Governance Council — Evolution Build Report

Task: evolve the Stickee Council into a formal governance framework — two new permanent agents, three review levels, a release-gates matrix, an explicit scalability model, and a rename to "Stickee Governance Council." Governed throughout by [AGENTS.md](AGENTS.md). No application code, database, or production was touched.

## 1. New agents created

- **`agents/data-evidence-steward.md`** (Agent 11) — mission: "can this claim be proven?" Covers provenance, citations, evidence chains, freshness, sync health, confidence levels, retrieval metadata, update schedules, source reliability, missing evidence, reproducibility. Defines the `Source / Published / Retrieved / Verified / Confidence / Methodology / Last successful sync` metadata standard. Declared the **canonical reviewer** for issue pages, government decisions, forecasts, parliamentary records, MP profiles, evidence summaries, and AI-generated explanations — meaning content of these types isn't considered evidence-complete without its review, the same way sensitive database changes aren't considered proven without real-database verification.
- **`agents/historian-knowledge-preservation-advisor.md`** (Agent 12) — mission: protect Stickee's long-term historical integrity so it doesn't become "a news feed that forgets the past." Covers permanent URLs, archival quality, redirects, canonical identifiers, chronology, election/legislative history, historical versions, and revision history. Explicitly cross-references the repository's own in-progress route work (`PROPOSED_ROUTE_TREE.md`, `CONSOLIDATION_AND_REDIRECT_PLAN.md`) as exactly the kind of change this agent's redirect/canonical-ID review applies to.

Both follow the established file structure (mandate, areas reviewed, standard questions, evidence standards, boundaries, required output format, severity model, approval criteria, escalation rules, interaction rules) and use the shared P0–P3 severity model rather than a bespoke label set, since both are fundamentally grading defect severity, not choosing among qualitatively different outcomes the way the Legal and Benchmarking Advisors do.

**Numbering fix along the way:** while renumbering to fit these two in, a pre-existing inconsistency was found and corrected — `product-intelligence-benchmarking-advisor.md`'s own header said "Agent 11" while `agents/README.md`'s table had always listed it as #10. Fixed to Agent 10, freeing 11–13 for the two new agents and the Chair. Full numbering now runs 1–13 with no gaps or collisions (verified by grep across all agent headers).

## 2. Council governance updated

**`docs/STICKEE_COUNCIL.md`** — the most substantially changed file:
- Renamed to **"The Stickee Governance Council"**, with a note explaining the rename and pointing out that the two historical build reports keep the old name unedited (a deliberate nod to the new Historian agent's own "don't quietly rewrite the past" principle).
- Council purpose rewritten to state the core governance claim directly: no single perspective determines readiness; the Council exists to improve decision quality, not increase bureaucracy.
- New **"Independent review principle"** section: independent review before synthesis, agreement between independently-reasoning agents as real signal vs. one agent echoing another as false signal.
- Roles table, decision-rights table, escalation rules (two new numbered rules), approval matrix, and severity matrix all extended for the two new agents.
- Two new professional-boundary disclaimers (Data Steward ≠ fact-checker/archivist/data engineer; Historian ≠ professional archivist/records manager).
- New **"Review levels"** section: Level 1 (small changes, 1–2 agents, no Chair needed), Level 2 (feature work, 3–5 agents + Chair), Level 3 (major/architectural decisions, full Council) — with the brief's own examples reproduced faithfully.
- **"Release gates"** section replacing the narrower prior "Release-gate recommendations": the full reviewer-mapping table from the brief (UI tweak, Navigation, Homepage, Forecast engine, MP profile, Government page, Database schema, Open-source readiness, Major release), with the previous Product-Benchmarking-specific gate list kept as a clearly-labelled additional subsection rather than being lost.
- New **"Scalability — adding future specialist agents"** section: the four-step extension mechanic, plus the seven future candidates named in the brief (Accessibility Specialist, Search & Information Retrieval Advisor, Performance Engineer, Visual Design Advisor, Data Science Advisor, Community & Moderation Advisor, Security Operations Advisor) recorded so they aren't re-litigated from scratch later — explicitly not authorisation to build any of them.
- New **"Measuring Council success"** section, stating success is decisions/trust/regressions/architecture/contributor-experience/editorial-quality/accuracy/maintainability — not review count, agent count, or documentation volume.
- A fifth worked sample review added ("Level 1 — small change, minimal review"), demonstrating the review-levels concept concretely against a real, already-documented finding (the "Government" nav-label issue from the earlier dry review) rather than a hypothetical.

**`agents/README.md`** — retitled to match; agent count and roster table updated to thirteen; two new professional-boundary bullets; new "Review levels" and expanded "Adding a future agent" sections (pointing to the fuller detail in `docs/STICKEE_COUNCIL.md` rather than duplicating it, keeping one source of truth); new example invocation prompts for both new agents; evidence-to-provide list extended.

**`agents/council-chair.md`** — header fixed to Agent 13; specialist count corrected to twelve throughout; new "Reviewing Data & Evidence Steward and Historian findings" section establishing both agents' "Blocked" verdicts as blocking-equivalent to a P0, on the same footing as the Legal Advisor's "Do not launch before legal review"; approval matrix extended; escalation rules extended to include a check that the reviewer set actually matches the task's review level.

**`agents/templates/council-summary.md`** — approval matrix extended with the two new rows; "eleven hats" corrected to "thirteen hats."

**`docs/AGENT_AUTOMATION_ROADMAP.md`** — renamed reference; the PR-automation agent-selection table extended with a content/copy row now including the Data & Evidence Steward, a new route-change row for the Historian, and the stale "all nine specialists" reference corrected to twelve.

**`agents/templates/content-review.md`** and **`agents/templates/page-review.md`** — light-touch updates adding the Data & Evidence Steward (as canonical evidence-layer reviewer) and Historian (where a canonical identity or route change is involved) to the "Agents typically involved" lines, plus a new "Evidence chain" output section in the Content Review template using the Steward's metadata standard.

## 3. What was deliberately left unchanged

Every other agent file's own mandate, boundaries, and interaction rules are untouched — per the Scalability section's own principle, adding a new agent shouldn't require rewriting the ones that already exist. The three benchmark reviews, the pattern library, the benchmarking methodology doc, and the government-page dry review are all untouched; they remain accurate historical records of work already done under the prior structure. The two historical build reports (`AGENT_COUNCIL_BUILD_REPORT.md`, `PRODUCT_INTELLIGENCE_AGENT_BUILD_REPORT.md`) keep the old "Stickee Council" name intentionally, not by oversight.

## 4. Files changed

**Created:**
- `agents/data-evidence-steward.md`
- `agents/historian-knowledge-preservation-advisor.md`
- `COUNCIL_EVOLUTION_BUILD_REPORT.md` (this file)

**Updated:**
- `docs/STICKEE_COUNCIL.md`
- `agents/README.md`
- `agents/council-chair.md`
- `agents/templates/council-summary.md`
- `agents/templates/content-review.md`
- `agents/templates/page-review.md`
- `docs/AGENT_AUTOMATION_ROADMAP.md`
- `agents/product-intelligence-benchmarking-advisor.md` (numbering fix only: header "Agent 11" → "Agent 10")

**Not touched:** every other file in the repository, including all files already modified or untracked before this task began — verified via `git status` before and after this task.

## 5. Confirmations

- **No application code was changed.** Zero files under `src/` were touched.
- **No database migration, schema, or Supabase behaviour was touched.**
- **Production was not accessed, deployed to, migrated, or seeded.**
- **Nothing was staged, committed, or pushed.**
- **No external service was connected.**
- **Pre-existing uncommitted work was preserved** — the page-refactor work, batch reports, `src/lib/navigation.ts`, and every file from the two prior Council-building tasks remain exactly as they were.

## 6. Note on the rename

The rename to "Stickee Governance Council" was carried out based on the clearly stated preference in the request ("my favourite"). Live governance documents (`agents/README.md`, `docs/STICKEE_COUNCIL.md`, `docs/AGENT_AUTOMATION_ROADMAP.md`) now use the new name; `docs/STICKEE_COUNCIL.md` itself keeps its filename to avoid breaking the ~13 agent files that link to it by path. The two historical build reports were left with the old name deliberately, not renamed retroactively — this is a reversible, documentation-only change with no code or filename impact, so it was carried out directly rather than held for separate confirmation.
