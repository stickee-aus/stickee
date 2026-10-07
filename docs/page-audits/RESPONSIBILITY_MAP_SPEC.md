# Responsibility Map — Specification

Governed by [`AGENTS.md`](../../AGENTS.md). New in this audit generation — no prior document specifies this. Not a new top-level page: a cross-cutting content block ("Who can change this?") that appears on every object page named below, in plain language, never as a simplistic influence score.

## Purpose

Every civic object on Stickee should let a user answer, in under 30 seconds: Who is responsible? Who proposed this? Who decides? Who votes? Who administers it? Who can block or amend it? Who is affected? What level of government controls it? What can I realistically do right now? What happens next?

## Design rules

1. **Plain-language role statements, not scores.** "The Senate reviews, amends, approves or rejects" — never "Senate influence: 62%." No numeric influence/power score exists anywhere in this spec, and none should be built without an approved methodology (the same standard already binding on MP scoring, per `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md`).
2. **Every role statement traces to a real institutional fact**, not an editorial guess. Where Stickee's schema does not yet model the responsible entity (Minister, Department, Committee — see below), the Map says so explicitly rather than inventing a plausible-sounding name.
3. **The Map states what stage the object is at**, since who's responsible for a bill changes as it moves (a bill in committee has different active decision-makers than one on the floor for a vote).
4. **The Map never claims more certainty than the underlying data.** Where an MP's vote is inferred (party-line fallback) rather than recorded, the Map must not present it as equivalent to a real division result — this directly extends the disclosure fix already required in `GOVERNMENT_PAGE_AUDIT.md` and `TAB_AND_MODE_AUDIT.md`.

## Data readiness, by role (checked against `docs/architecture/DOMAIN_MODEL.md`)

| Role | Real, queryable today? | Source |
|---|---|---|
| Federal Government (as a level) | Yes | Implicit in `issues.level`/electorate scoping |
| House of Representatives | Yes | `members`, `divisions` |
| Senate | Yes | `members`, `divisions` |
| Your local MP | Yes | `members.electorate`, keyed to real electorate (subject to the electorate-lookup caveat below) |
| Responsible Minister | **Not currently modeled** | No table/type distinguishes a Minister from any other MP — `docs/architecture/DOMAIN_MODEL.md`'s "Minister / Department" entry |
| Department | **Not currently modeled** | Free-text label inside mock decision data only |
| Committee | **Not currently modeled at all** | No table, type, or component references parliamentary committees anywhere in the codebase |
| State Government | **Not currently modeled** | No first-class object; would need explicit scoping if state-level content is ever added |
| Local Council | **Not currently modeled** | Same as State Government |
| Your electorate → your MP mapping | **Real MP side; fake mapping side** | `/api/electorate-lookup` is confirmed hash-based, not geographic, by its own code comment — every Responsibility Map that names "your local MP" inherits this caveat until a real geo lookup exists |

**This table is the single most important constraint on this spec.** A Responsibility Map that names a "Responsible Minister" or "Committee" today would be inventing a plausible-sounding but unverifiable claim — exactly what `AGENTS.md`'s truthfulness section forbids. Every object's Map below marks these roles **"Not yet available — [reason]"** rather than a placeholder name, until the underlying object is built.

---

## Issue / Bill {#issue-bill}

**Who can change this?**

| Role | Responsibility | Data readiness |
|---|---|---|
| Federal Government | Sets national policy and funding | Real (level) |
| Responsible Minister | Leads the policy and introduces legislation | **Not yet available** — Minister is not a modeled object |
| House of Representatives | Debates and votes | Real (`divisions`) |
| Senate | Reviews, amends, approves or rejects | Real (`divisions`) |
| Your local MP | Represents your electorate and votes in the House | Real MP identity; mapping accuracy caveated (electorate lookup) |
| Committee | Investigates and receives submissions | **Not yet available** — Committee is not a modeled object |
| Department | Administers the policy | **Not yet available** — Department is not a modeled object |
| State Government / Local Council | Controls planning, service delivery, or implementation where relevant | **Not yet available** — not modeled; only render if genuinely applicable, never as a default filler row |

**Stage indicator (required):** Introduced → In debate (House/Senate/Committee) → Passed/Rejected/Withdrawn — sourced from `issues.status`, real. **What happens next** should read directly from this stage, e.g. "Next: the Senate votes on [date]," never a generic "in progress."

**Placement:** Issue detail page (`ISSUES_PAGE_AUDIT.md`), replacing the currently-absent "who's responsible" framing entirely missing from `/issue/[id]` today.

---

## Government Decision {#government-decision}

Same structure as Issue/Bill, with "Minister" and "Department" as the *lead* roles (an executive decision is announced/administered, not voted on the floor in the same way a Bill is). **This is the object type with the largest data-readiness gap** — see `DETAIL_PAGE_AUDIT.md`#government-decision. Until Minister/Department are real, first-class objects, a Government Decision's Responsibility Map can only truthfully state the level of government (federal/state/local) and, where known, the portfolio area in plain text — not a normalized, linkable Minister/Department entity.

---

## Policy {#policy}

**Not currently modeled as a distinct object** (per `docs/architecture/DOMAIN_MODEL.md` — "Policy" resolves to either a Market Proposal, an Issue, or a Government Decision depending on context, not one real thing). **Recommendation:** do not build a separate Responsibility Map template for "Policy" until Policy itself is a real object — apply the Issue/Bill or Government Decision template instead, whichever it structurally resembles once it exists.

---

## Forecast {#forecast}

**Who can change this?** A forecast doesn't have a decision-maker of its own — it has a *subject* (the Issue/Bill/Decision it tracks) and a *resolver* (Stickee's admin-only settlement process, once the real-world outcome is known).

| Role | Responsibility |
|---|---|
| The subject Issue/Bill/Decision | Determines the real-world outcome this forecast tracks — link, don't duplicate |
| Stickee (admin, resolution) | Resolves the market against the real outcome, with a public `resolution_source` (currently DB-only, not surfaced — see `FORECASTS_PAGE_AUDIT.md`) |
| The crowd (stakers) | Expresses a probability estimate — this is community opinion in aggregate, not a decision-making role |

**Placement:** Forecast detail (`DETAIL_PAGE_AUDIT.md`#forecast-detail) — a "See the issue behind this forecast" link, not a full Responsibility Map block (the subject's own Map already has one).

---

## MP {#mp}

**What this MP can and cannot do** (a role clarification, not a "who decides" map, since the MP *is* one of the roles named on other objects):

- **Can:** vote in the House (or Senate, if a Senator) on bills; represent constituents' views; sit on a committee (once modeled); ask questions in Parliament; introduce a private member's bill.
- **Cannot (on their own):** unilaterally pass or block legislation; direct a department; personally decide executive policy (that's the Minister/Cabinet's role, distinct from an ordinary MP's).

**Placement:** MP profile (`DETAIL_PAGE_AUDIT.md`#mp-profile) — one short, plain-language block preventing the common civic misconception (independently flagged by the Public Policy Advisor, `STICKEE_V1_EXECUTIVE_SUMMARY.md` Consensus C9) that a backbench MP and a Minister have the same institutional power.

---

## Minister {#minister}

**Not currently modeled** as distinct from any other MP. Until built: any page needing to reference "the Minister for X" should render this as attributed, sourced free text (e.g. quoting a real, cited announcement) rather than a linkable profile object — do not fabricate a Minister entity by lightly relabeling an MP record, since a Minister's portfolio, appointment date, and Cabinet status are facts a real `members` row does not currently carry.

---

## Department {#department}

**Not currently modeled.** Same treatment as Minister — attributed free text only, until a real, normalized object exists. **Future scalability note:** if Government Decision becomes a real object (Batch 9), Department should become a normalized lookup at the same time, so "everything from this department" is a real, queryable question — not a repeated free-text label per decision (`docs/architecture/DOMAIN_MODEL.md`'s explicit recommendation).

---

## Committee {#committee}

**Not currently modeled at all** — no table, type, or component references committees anywhere in the codebase. This is a genuinely missing object, not a duplicate of anything existing, and — per the Data & Evidence Steward's Council finding on Political Pulse — committee reports are "a rich, underused evidence source for exactly the kind of claims Stickee wants to make." **Recommendation:** name this as a real future-build candidate (not scheduled), rather than working around its absence with placeholder committee names on any Responsibility Map.

---

## Election {#election}

An election doesn't have a "who decides" responsibility chain in the same sense as a Bill — voters collectively decide. The Responsibility Map equivalent here is **process transparency**: who counts the votes (AEC), what "projected" means before a formal declaration (Stickee's own disclosure, already correctly worded — see `DETAIL_PAGE_AUDIT.md`#election), and that Stickee's summary is not an official declaration. No new content needed — the existing AEC-attribution copy already satisfies this object's Responsibility Map requirement.

---

## Civic Proposal {#civic-proposal}

**Who reviews a submitted proposal, and on what authority, is currently undefined** — this is itself a blocking gap named in `DETAIL_PAGE_AUDIT.md`#civic-proposal. A Civic Proposal feature must not ship without a real, disclosed answer to "who decides whether this is accepted" — an unstated review authority is exactly the kind of implied-but-unreal process that made `ProposeMarketModal`'s "Pending Review" badge a live truthfulness defect.

---

## Cross-object rules

- **A Responsibility Map block never appears without a stage/status indicator** — "who's responsible" changes depending on where an object is in its lifecycle, and presenting a static role list without that context risks implying every listed role is currently, simultaneously active.
- **A role marked "Not yet available" must say why**, not just omit the row silently — silent omission looks like "this role doesn't apply here" rather than "Stickee doesn't have this data yet," which is a different and more honest claim.
- **No Responsibility Map role carries a numeric weight, percentage, or ranking** under any circumstance, per Design rule 1 — this is a hard constraint, not a default that can be overridden by a future feature request without the same methodology review `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` already requires for MP scoring specifically.
