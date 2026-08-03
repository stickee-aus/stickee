# Stickee — Data & Content Trust Audit

Read-only. Focus: demo/mock/fake content inventory, and whether political/factual claims carry a trustworthy source trail.

## 1. Mock data files — all are live, none are dead code

| File | Contents | Confirmed live imports (reaches real users) |
|---|---|---|
| `src/lib/mock-data.ts` | MPs, parties, issues, votes, Stickee Score calculation | `/mp/[id]`, `/leaders`, `/issue/[id]` (via `issues-db.ts`), `CivicScorecard`, `MPVoteGrid`, `EmailMPModal` |
| `src/lib/mock-market-data.ts` | Prediction market fixtures, probabilities, bull/bear case text, leaderboard array | `/leaders`, `/issues`, `PredictionMarketGrid`, `MarketCard`, `LeaderboardGrid`, `DecisionCard` |
| `src/lib/mock-senate-data.ts` | Senate composition, bill progress | `SenateView`, `BillStageTimeline`, `live-parliament.ts` |
| `src/lib/mock-simulator-data.ts` | Seed simulator scenarios | `SimulatorClient`, `ScenarioSelector`, `simulator-engine.ts` |
| `src/lib/issues-data.ts` | Issue/vote-summary/market types + helpers | `IssuesPageClient`, `PredictionsPageClient`, `issues-db.ts`, `predictions-db.ts` |
| `mock-government-data.ts`, `mock-civic-data.ts`, `mock-feed-data.ts`, `mock-leaders-data.ts` | Government decisions, national civic indicators, feed seed posts, leader nominations | Home, `/decisions`, `/impact`, `/feed`, `/leaders/[id]`, `/u/[handle]` |

**None of these files are dead code.** All are actively wired into production pages, several with no gate distinguishing "demo mode" from live data. This is the single largest category of finding in this audit: a public visitor cannot tell, from the UI, which numbers on `/`, `/leaders`, `/mp/[id]`, `/leaderboard`, `/impact`, `/decisions`, `/notifications`, `/profile`, or `/u/[handle]` are real and which are fabricated.

## 2. The highest-risk single finding: the "Stickee Score" on real, named MPs

**Severity: P0.**

`src/components/LeaderProfileDetail.tsx` displays a "Stickee Score" for real Australian MPs (real names, real electorates, real party affiliation) with explicit methodology text stating the score *"reflects how consistently this MP votes with the majority position on recorded issues."*

The actual computation, `calculateStickeeScore()` in `src/lib/mock-data.ts`, does not use any individual MP's voting record. Votes are generated from a static `PARTY_VOTE_MAP` that assigns the **same vote to every MP of a given party** across roughly six hardcoded mock issues. Two MPs from the same party always get the same score, regardless of how they actually voted — because their actual votes are never read, despite real vote data existing in the database (synced from TheyVoteForYou via `/api/sync/divisions` into the `member_votes` table).

Separately, a real, source-attributed scoring model (`pillar_metrics`, `pillar_scores`, `politician_pillar_ratings` — migration `003_civic_metrics.sql`) exists in the schema and is **never referenced by any application code**. A `mp-scorecard` agent also exists and does compute from real vote data, but its output writes to `user_profiles` matched by `display_name === MP name` — a fragile join unlikely to succeed since MPs aren't typically platform users, making that pipeline effectively inert in practice.

**Consequence:** A specific, named, real Australian Member of Parliament can have a public "score" attached to their profile that has zero relationship to their actual parliamentary voting record, while the product's own UI copy asserts that it does. This is a factual misrepresentation about a real person's public conduct, published under the product's brand. At any public-launch scale this is a reputational and potential legal exposure (defamation-adjacent risk, at minimum a serious trust/accuracy failure), independent of any security concern.

**Recommendation:** Before public launch, either (a) wire the score to the real `member_votes` data that already exists and is already synced, or (b) remove the methodology claim and clearly label the score as illustrative/placeholder, or (c) remove the per-MP score entirely until it's real. Do not ship the current mismatch between claimed and actual methodology.

## 3. Hardcoded political claims with no citation

**Severity: P0.**

`src/lib/mock-data.ts` contains `whoSupports`/`whoOpposes` text fields with specific, real-party-attributed claims (e.g., paraphrased: "Labor and the Greens support the scheme... the Coalition argues it will push prices up..."), rendered directly on `/issue/[id]` with:
- No citation or link, despite the `issues` table having a `source_url` column that goes unused for this content.
- No "illustrative" or "editorial" framing distinguishing it from reported fact.

These read as factual reporting of real parties' positions on live-sounding legislation, with no way for a user to verify or trace the claim to an actual statement, vote, or press release.

**Recommendation:** Either source every claim (populate `source_url` and cite a specific vote/statement/press release) or clearly mark this content as illustrative/example data until real sourcing is added.

## 4. Bot-authored content is unlabeled — and the field that would disclose it is deliberately dropped

**Severity: P1.**

None of the seven background agents (`parliament-watcher`, `bill-stage-tracker`, `mp-scorecard`, `electorate-pulse`, `prediction-resolver`, `moderation-triage`, `daily-bonus`) call an LLM — all content is deterministic template-string interpolation over real DB rows (confirmed by direct code read of every agent file, not inferred from naming). This somewhat lowers the "AI hallucination" risk the audit brief anticipated, but raises a different one: **unlabeled automated authorship of factual-sounding claims.**

`feed_posts.source_agent_id` exists in the schema and is populated by every agent post. But `src/lib/feed/ranker.ts` (`rowToFeedPost`) explicitly maps the DB row to the client-facing shape and **omits `source_agent_id` from the projection** — it's fetched via `select('*')` and then discarded before reaching `FeedPost.tsx`. The UI shows only an author name ("Stickee") and, for alert-type posts, a shield icon — no bot/automated badge anywhere.

**Consequence:** Bot-generated civic claims (vote-outcome summaries, cross-party "rebellion" call-outs, score-change announcements) appear under the branded handle indistinguishably from what a reader could mistake for edited/curated journalism. The one column that could fix this (`source_agent_id`) is captured in the database specifically for this purpose and then thrown away in the application layer.

**Recommendation:** Restore `source_agent_id` (or a derived `is_automated: boolean` + agent display name) to the client-facing feed post shape, and add a visible "automated" label in `FeedPost.tsx` for agent-sourced posts.

## 5. Source-trail schema audit (per audit brief's required fields)

| Field required by brief | Present anywhere in schema? | Table(s) |
|---|---|---|
| Source name | Partial | `pillar_metrics.source` (name only) |
| Source URL | Rare | `issues.source_url` (exists, underused per §3); absent from `pillar_metrics`, `politician_pillar_ratings`, `divisions` (has `source_url` — good) |
| Publication date | Partial | `divisions.date`, `pillar_metrics.period` |
| Data period | Partial | `pillar_metrics.period` |
| Retrieval/last-synced date | Partial | `divisions.synced_at`, `pillar_metrics.synced_at` |
| Last-reviewed date | **Absent everywhere** | — |
| Author/generator identity | Rare | `feed_posts.source_agent_id` (exists but dropped from UI, §4) |
| Confidence/verification status | **Absent everywhere** | — |

**Structurally absent across the entire schema:** a confidence/verification-status column and a last-human-reviewed date. Even where sourcing fields exist, they are inconsistently populated or (in the feed's case) actively discarded before reaching users. `politician_pillar_ratings.rationale` is a free-text narrative field with **no citation column at all**, structurally — there's nowhere to even put a source if one were added later without a migration.

## 6. Other demo/fake content inventory

- **Leaderboard** — entirely fake (see Market Engine Audit): static array, hardcoded "your rank," disconnected from the real wallet.
- **`stickeeScore` on the live chamber view** (`HouseChamber`/`SenateView`) — real MP names/parties/electorates from TVFY sync, decorated with a mock `stickeeScore` seat-index field that is hardcoded to `0` for every seat (`mock-data.ts`). Reads as a live data point; is always zero.
- **`/electorate-lookup` API** — a hash-based approximation over hardcoded state bounding boxes, explicitly not a real geographic lookup per its own code. Anything downstream that personalizes content by electorate (onboarding, notifications) inherits this inaccuracy.
- **`bullCase`/`bearCase` market narrative strings** (`mock-market-data.ts`) — templated commentary presented with no "for illustration only" disclaimer in `PredictionWidget.tsx`/`PredictionMarketGrid.tsx`.
- **`electorate-pulse` agent** — by contrast, this one is **genuinely real aggregation** (real counts of `bill_pressures`/`predictions`/`comments` per electorate over the last 7 days), not fabricated. Correctly excluded from criticism here.
- **AEC live election integration** — the one place in the codebase that models source trust correctly: it includes an explicit disclosure that "projected government status is Stickee's summary from official AEC counts. It is not an AEC declaration." This is the pattern the rest of the product should follow.
- **`src/app/feed/page.tsx.bak`** — a stale leftover snapshot of the feed page (519 vs. 612 lines live), not routable (wrong extension), no functional risk — just working-tree clutter that should be deleted before any contractor handoff or open-sourcing.
- **`pillar_metrics`/`pillar_scores`/`politician_pillar_ratings`** — a fully-built, unused schema for exactly the kind of source-attributed scoring this product needs (see §5), sitting dormant while a worse, mock-driven scoring system is what's actually live. This is worth reviving rather than rebuilding from scratch.

## 7. Production/demo separation — recommendation

There is currently no environment flag, build-time constant, or visual treatment distinguishing demo/mock content from real content anywhere in the UI. Before any public launch, recommend one of:
1. A hard cutover — remove mock fallbacks from every page listed as "Demo" in `FEATURE_AND_ROUTE_INVENTORY.md` and either wire real data or hide the feature until it's ready; or
2. If demo content must ship at launch (e.g., to make the app feel populated), a consistent, visible "Illustrative data" badge on every page/component that can render mock content, driven by a single shared `isMockData` flag per data object rather than per-page ad hoc styling.

Given the project's stated goal of trustworthiness for a politics platform, option 1 is strongly preferred wherever feasible before public signups open.
