# Political Pulse (redesign of `/feed`) — Page Audit

Governed by [`AGENTS.md`](../../AGENTS.md). Verified against `src/app/feed/page.tsx`, `src/lib/feed/ranker.ts` as cited in `docs/audits/DATA_AND_CONTENT_AUDIT.md` §4 and `SIMPLIFICATION_RECOMMENDATIONS.md`. This is the one core page not currently in primary navigation, and the one whose proposed content scope (per the audit brief) most exceeds its current evidence infrastructure — see `CONTENT_HIERARCHY.md` §3, restated here as this page's binding content policy.

## Should the current Feed become Political Pulse?

Yes, in concept — the underlying real ranking engine and real `feed_posts` table are legitimate and worth keeping. But the redesign is a **re-scope, not a re-skin**: today's page is an engagement-styled social feed (reactions, comments, share-for-points, "↑ BOOSTED" badges, letter-grade scores) built on content that is mostly automated civic alerts, not human commentary. The target is a chronological, sourced civic-alert stream with the social layer removed until genuine human participation and a moderation queue exist.

## Truthfulness classification of key elements

| Element | Classification | Basis |
|---|---|---|
| Ranked civic-alert posts (parliament-watcher, bill-stage-tracker, prediction-resolver, electorate-pulse) | **Verified fact** (deterministic, template-interpolated over real DB rows) | Confirmed by direct code read of every agent handler — none call an LLM (`docs/architecture/STICKEE_SYSTEM_ARCHITECTURE.md` System 9) |
| `electorate-pulse` digest specifically | **Sourced analysis** (genuine real aggregation) | Real counts of `bill_pressures`/`predictions`/`comments` per electorate over 7 days — correctly excluded from criticism in prior audits |
| Post authorship (byline) | **Unsupported — authorship actively concealed** | `feed_posts.source_agent_id` exists specifically to disclose automated authorship and is dropped by `rowToFeedPost` before reaching the client (`docs/audits/DATA_AND_CONTENT_AUDIT.md` §4, P1); every post appears under "Stickee" indistinguishable from human-curated content |
| "↑ BOOSTED" badge | **Hardcoded, implies a significance signal it isn't** | An engagement-heuristic label, not a real editorial-significance judgement (`src/app/feed/page.tsx:225-227,607-609`) |
| `scoreToGrade` letter-grade badges | **Hardcoded, no real methodology** | Reintroduces the same unscoped-scoring pattern already removed elsewhere (`src/app/feed/page.tsx:10,196`) |
| Reaction counts on initial load | **Inferred fallback presented as live** | Seeded from a mock array before the real ranked fetch resolves (`src/app/feed/page.tsx`, `FEED_POSTS` fallback, confirmed live) |
| Share-for-points bonus (`bonusPoints=50`) | **Unsupported** | An engagement-loop mechanic bolted onto civic-alert content, independent of the alert's actual value (`src/app/feed/page.tsx:265-270`) |
| Mock seed content when the real table is empty | **Demo, correctly labeled** | The one fallback in the app honestly surfaced in-UI via a "· seed data" badge — `docs/architecture/STICKEE_SYSTEM_ARCHITECTURE.md` calls this "a pattern worth reusing elsewhere, not removing" |

## Content-type scope gate (binding, not a design choice — restated from `CONTENT_HIERARCHY.md` §3)

| Proposed content type | Evidence status | V1 policy |
|---|---|---|
| Parliament | Real, traceable | **Included** |
| Bills (status/source only) | Real | **Included** |
| Forecast openings/resolutions | Real (once `resolution_source` is public) | **Included** |
| Decisions, Committees, Elections (chronological), ABS, RBA, Treasury, Speeches, Source corrections | No real pipeline / no persisted history / structurally absent | **Excluded** — six independent P0s from the Data & Evidence Steward; none may be waived for design or launch-date reasons |

## OUTPUT PER PAGE

**PAGE:** Political Pulse
**ROUTE:** `/feed` (kept, re-scoped — not a route rename)
**CURRENT PURPOSE:** A ranked, engagement-styled activity stream mixing real civic alerts with social mechanics.
**PROPOSED PURPOSE:** A dated, sourced, chronological stream of real civic events.
**SINGLE QUESTION:** What changed?
**PRIMARY USER:** Someone scanning recent civic activity to jump to what matters to them — not composing or reacting (V1).
**FIRST 30 SECONDS:** Currently: a ranked (not chronological) list with reaction counts, boosted badges, and letter grades competing with the actual content for attention.
**WHAT IS ESSENTIAL:** Timestamp, actor-type tag (mandatory, not optional — see below), one-line description, a working link to the primary record.
**WHAT IS OPTIONAL:** Filter by content type.
**WHAT IS DUPLICATED ELSEWHERE:** None structurally — but Today's homepage and `/notifications` are separate, non-cross-linked activity streams covering overlapping ground (`INFORMATION_ARCHITECTURE_AUDIT.md` domain-by-domain findings).
**WHAT BELONGS ON A DETAIL PAGE INSTEAD:** N/A — each entry links out to its own object's real page (issue, forecast, MP); Pulse itself carries no detail view.
**WHAT SHOULD BECOME CONTEXTUAL RATHER THAN ALWAYS VISIBLE:** N/A at V1 — no engagement actions of any kind belong on this page until human participation volume and moderation capacity exist.
**WHAT SHOULD BE REMOVED:** Reactions, comments, share-for-points, "↑ BOOSTED" badges, `scoreToGrade` letter grades — all engagement mechanics, in full, for V1.
**WHAT SHOULD NEVER APPEAR:** Any of the six excluded content types (see gate table) under any framing, including a "coming soon" placeholder entry; automated content presented without an actor-type tag.
**FAKE/UNSUPPORTED:** See classification table — concealed authorship is the single highest-severity finding on this page (a mechanical fix: restore one dropped field).
**WHAT IS GENUINELY REAL AND WORTH PRESERVING:** The ranking/query engine over real `feed_posts`; the "· seed data" honest-fallback badge pattern; `electorate-pulse`'s genuine aggregation.
**DEAD/DECORATIVE CONTROLS:** None found beyond the engagement mechanics themselves, which are functional but shouldn't exist at this content-maturity stage.
**PRIMARY ACTION:** Open the linked primary record (an issue, a forecast, an MP).
**SECONDARY ACTIONS:** Filter by content type.
**EMPTY STATE:** "No new civic events in this period" — never mock/seed content presented without a visible label.
**MOBILE PRIORITIES:** Standard responsive list behaviour — no dedicated design work required beyond that.
**CANONICAL DATA SOURCE:** `feed_posts`, via a **new chronological query path**, not the existing engagement-weighted `feed/ranker.ts` (architecturally the wrong model for a "what changed" page, per the Software Architect's Council finding).
**REQUIRED SHARED COMPONENTS:** A dated list-entry pattern shared with Today's compact strip (same data, different length — not two independent implementations).
**RESPONSIBILITY MAP NEEDS:** Each entry's actor-type tag *is* a compressed Responsibility Map signal (Executive / Legislature / Independent statutory body / Statistical agency / Stickee-forecast) — see `RESPONSIBILITY_MAP_SPEC.md`.
**CIVIC ACTION NEEDS:** None on this page directly — Pulse is read-only at V1; actions live on the linked object pages.
**LEGAL / EDITORIAL / POLICY RISKS:** Concealed bot authorship is a live P1 trust risk independent of the redesign; the excluded content types' "source corrections" concept carries defamation-adjacent exposure and requires professional legal review before it is ever built (`IMPLEMENTATION_BATCHES.md` Batch 14, item 4) — not blocking V1 since it's already excluded.
**SMALLEST SAFE FIX:** Restore `source_agent_id` (or a derived `is_automated` + agent name) to the client-facing shape and add a visible "automated" label — a schema-adjacent but code-only fix, no migration, explicitly named as a hard prerequisite for Batch 10 in `IMPLEMENTATION_BATCHES.md`.
**IDEAL V1 STRUCTURE:** Per `CORE_PAGE_REDESIGN.md`#Political-Pulse — chronological list, grouped by day, actor-tagged, no engagement actions.
**IMPLEMENTATION PRIORITY:** P1 — the authorship-disclosure fix is small and independent; the fuller re-scope (removing engagement mechanics, building the chronological query) depends on it and is scoped as Batch 10.
**OWNER DECISIONS:** Confirm Political Pulse ships as a secondary page reachable from Today and the header, never a sixth primary-nav item (already recommended, not yet formally ratified); confirm the six excluded content types stay excluded until each independently gets real infrastructure, rather than shipping with placeholder entries to "look complete."

## Council review (Level 3 — reuses `STICKEE_V1_EXECUTIVE_SUMMARY.md` Consensus C2)

```
Data & Evidence:       Blocked — six proposed content types have no evidence chain, "regardless of how good the UX design would be"
Editorial:             Blocked (four P1s, same six content types, independently derived)
Software Architecture: Approved with conditions — ranker.ts is architecturally an engagement-weighted algorithm, the wrong model for a chronological page; a new query path is required, not a re-styling of the existing one
Civic Technology:      Approved with conditions — current "algorithmically boosted" badge and share-for-points directly contradict "reject algorithmic outrage"
Legal and Regulatory:  Informational now (V1 scope excludes the risky content types); Requires professional legal review before "source corrections" is ever built
Product:                Approved with conditions — recommends "build smaller": agent-authored civic alerts only for V1

Overall recommendation: Merge the authorship-disclosure fix now (no dependency). Build Political Pulse V1 scoped to Parliament/Bills/Forecast-events only — this is the whole Council's converged recommendation, not one dissenting view among several.
```
