Governed by [`AGENTS.md`](../../AGENTS.md). Companion to [`STICKEE_SYSTEM_ARCHITECTURE.md`](STICKEE_SYSTEM_ARCHITECTURE.md) — systems own objects; this document defines the objects themselves. Documentation only, no code changed.

# Stickee — Domain Model

Every object below is traced to a real table, type file, or component — not invented. Where the task brief's example object list (Issue, Committee, Minister, Department, Saved Topic, etc.) names something that does **not** currently exist in the codebase, it is listed anyway with **"Not currently modeled"** and a note, so the gap is visible rather than silently skipped.

For each object: purpose, relationships, canonical identifier, lifecycle, connected objects, required metadata, evidence requirements, history requirements, future scalability notes.

---

## Issue / Bill / Decision

**Status: three overlapping names for what should converge toward one object.** Today these are genuinely two different data models (`issues` table vs. the `Decision` type in `src/types/government.ts` backed entirely by `mock-government-data.ts`), plus a third informal usage ("bill" in Parliament components refers to the same underlying concept as an Issue).

| | |
|---|---|
| **Purpose** | The unit of "something government is considering or has decided" — a bill, a policy decision, a budget line. The central object the whole platform organizes around. |
| **Relationships** | Belongs to a Government Decision Maker; has zero-or-one Forecast Market; has many Bill Pressure actions; has many Timeline Events; is voted on by many MPs (via Division); may be linked from a Feed Post; may be the subject of a Scenario. |
| **Canonical identifier** | `issues.id` (uuid) for the real object. The mock `Decision` type uses its own string `id` scheme, **incompatible** with `issues.id` — this is the concrete blocker to merging them. |
| **Lifecycle** | Proposed → In debate → Passed / Rejected / Withdrawn (`issues.status`, real enum, migration `017`). The mock `Decision.status` uses a differently-shaped status set — another concrete incompatibility. |
| **Connected objects** | Division (the parliamentary vote event that decides it), Forecast Market, Bill Pressure, Timeline Event, Evidence/Source. |
| **Required metadata** | Title, one-line summary, government level (federal/state/local), decision-maker, status, `source_url`. |
| **Evidence requirements** | `source_url` column exists on `issues` and is **currently unused for the `whoSupports`/`whoOpposes` party-position claims** rendered on `/issue/[id]` — a live truthfulness gap, not a schema gap. |
| **History requirements** | Status transitions should be timestamped and attributable (which sync/agent/admin action caused them) — `bill-stage-tracker` agent already detects transitions; whether it writes an auditable history row (vs. just posting a feed alert) should be confirmed before this is relied on as history. |
| **Future scalability** | Merging the mock `Decision` concept into `issues` (adding a `level`/`decision_type` distinction if needed) removes the need for a second ID scheme and a second status enum — this is the single highest-leverage schema consolidation identified in this audit. |

## Government Decision Maker

| | |
|---|---|
| **Purpose** | The department, minister, or level of government responsible for an Issue/Decision. |
| **Relationships** | Has many Issues/Decisions. |
| **Canonical identifier** | None real — currently a free-text field inside `mock-government-data.ts`'s `Decision` objects, not a normalized table/entity. |
| **Status** | **Not currently modeled as a first-class object.** `DecisionMaker` exists only as a TypeScript type (`src/types/government.ts`) over mock data, with no table. |
| **Future scalability** | If Issue/Decision is unified onto real data, Decision Maker should become a normalized lookup (so "everything from this department" is a real query), not a repeated free-text label. |

## Committee

**Not currently modeled.** No table, type, or component references parliamentary committees anywhere in the codebase. If committee-level reporting becomes a goal (committee reports are a rich, underused evidence source for exactly the kind of claims Stickee wants to make), this is a genuinely missing object, not a duplicate of anything existing.

## Election

| | |
|---|---|
| **Purpose** | Represent a specific Australian election event and its live/final results. |
| **Relationships** | Produces MP outcomes (who holds a seat); is the subject of Live Election System snapshots. |
| **Canonical identifier** | None persisted — the Live Election System (`src/lib/aec-election.ts`) is stateless/pass-through against the live AEC scrape; there is no `elections` table. |
| **Lifecycle** | Modeled implicitly by the scrape's own state (pre-election / counting / final) via `LiveElectionSnapshot`, not stored. |
| **Future scalability** | If historical election results ever need to be queried (e.g. "how did this seat change hands"), a real `elections`/`election_results` table would be needed — today's design deliberately has none because the system's only job is a live pass-through. |

## Political Party

| | |
|---|---|
| **Purpose** | Group MPs; provide the colour/short-name convention used throughout chamber and vote visualizations. |
| **Canonical identifier** | Party name string (no numeric/UUID party table) — normalized via `normaliseParty()` in `src/lib/live-parliament.ts` and a hardcoded colour/short-name map. |
| **Connected objects** | MP (many-to-one), Senate/House composition. |
| **Status** | Real in the sense that party affiliation on real MPs is real synced data; the party *entity itself* (colour, full metadata) is a hardcoded map, not a database row. |
| **Future scalability** | Fine as-is at Australia's party-count scale; would only need to become a real table if party metadata (e.g. logos, founding date, ideology tags) grows beyond what a map literal should hold. |

## Member of Parliament (MP)

| | |
|---|---|
| **Purpose** | A real, currently- or formerly-sitting representative. |
| **Relationships** | Belongs to a Party; represents an Electorate; casts many Votes (via Division); may be the subject of Feed Posts (`parliament-watcher` rebellion call-outs); may receive Endorsements (conceptually — endorsement is currently modeled against Community Leaders, not MPs — see People System problems). |
| **Canonical identifier** | `members.id`, cross-referenced to TheyVoteForYou's own MP id for sync idempotency. |
| **Lifecycle** | Synced, not authored — created/updated by `/api/sync/members`; not deleted, only superseded on re-sync. |
| **Required metadata** | Name, party, electorate, chamber (House/Senate). |
| **Evidence requirements** | Every displayed fact should be traceable to the TheyVoteForYou sync, which it currently is for identity fields; the retired "Stickee Score" failed this requirement for voting-pattern claims specifically (see `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` for what a reintroduced score must satisfy). |
| **History requirements** | Full vote history exists in `member_votes` but is **not surfaced on `/mp/[id]`** today — a real object with unused real history. |
| **Future scalability** | The MP object is in good shape; the debt is entirely on the *presentation* side (wiring existing `member_votes` into the profile), not the data model. |

## Minister / Department

**Not currently modeled as distinct objects.** No table or type distinguishes a Minister from any other MP, or a Department from a free-text label inside mock decision data. If a future feature needs "everything this specific minister has done" or "everything from this department," both would need to be introduced as first-class, normalized concepts — today there is nothing to duplicate, only something to build.

## Policy / Proposal

Two different real things currently share informal use of "proposal":

1. **Market proposal** (`ProposeMarketModal.tsx`) — a user suggesting a new forecast market. **Confirmed to never persist** (`docs/audits/FEATURE_AND_ROVE_INVENTORY.md`/`FEATURE_AND_ROUTE_INVENTORY.md`) — fully client-state, decorative today.
2. **Leader nomination** (`Nomination` type, `src/types/leaders.ts`) — a user nominating a community leader. Real, but backed by mock leader-profile content rather than a real review/approval pipeline.

**Policy** as an object in its own right (a specific government policy, distinct from a single Issue/Bill) is **not currently modeled**.

## Evidence / Source

| | |
|---|---|
| **Purpose** | Ground every factual claim in something checkable — the mechanism the constitution's entire "truthfulness" section depends on. |
| **Status** | **Schema exists, mostly unused.** `issues.source_url` and `pillar_metrics.source` are the only source-attribution columns found anywhere in the schema, and per `docs/audits/DATA_AND_CONTENT_AUDIT.md` §5, most of the fields a rigorous evidence model would need (retrieval date, confidence, methodology link, citation text) are **absent from every table** — not partially present, absent. |
| **Future scalability** | This is the most consequential missing piece of the domain model relative to the platform's stated mission. A proper `evidence`/`citations` join table (source name, url, publication date, retrieval date, linked object type+id, confidence/classification per `AGENTS.md`'s truthfulness taxonomy) would let every other object (Issue, Pillar score, MP claim) point at real evidence instead of relying on component-level trust. This should be treated as foundational infrastructure, not a per-feature add-on. |

## Timeline Event

| | |
|---|---|
| **Purpose** | A dated milestone in an Issue/Decision's progress (introduced, debated, passed, etc.). |
| **Canonical identifier** | `TimelineEvent` type (`src/types/government.ts`), nested inside mock `Decision` objects — **not a real table**. `BillStageTimeline.tsx` renders a parallel, separately-sourced stage progression from `mock-senate-data.ts`. |
| **Status** | Mock, and duplicated across two components (`Decision.timeline` vs. `BillStageTimeline`'s own bill-stage tracker) that both claim to represent the same kind of fact. |
| **Future scalability** | Should become one real table (`issue_timeline_events`, FK to `issues.id`) written to by `bill-stage-tracker` (which already detects the transitions that would populate it) rather than two independent mock representations. |

## Indicator / Civic Metric / Pillar

| | |
|---|---|
| **Purpose** | A measured national statistic (e.g. housing affordability) rolled up into a Pillar grade. |
| **Canonical identifier** | Should be `pillar_metrics.id`; is actually a key into `mock-civic-data.ts`'s `CIVIC_PILLARS` array. |
| **Relationships** | Many Indicators roll up into one Pillar; a Pillar has a time series (`pillar_time_series`, unused) and per-politician ratings (`politician_pillar_ratings`, unused). |
| **Evidence requirements** | `pillar_metrics.source` column exists for exactly this purpose and is unused because the table itself is unused. |
| **Future scalability** | See Civic Indicator System in `STICKEE_SYSTEM_ARCHITECTURE.md` — this is a "wire up the real thing" problem, not a modeling problem; the schema is already reasonably well-shaped for it. |

## Organisation

**Not currently modeled as a distinct object.** No table represents non-government organisations (advocacy groups, industry bodies) as entities in their own right; they appear only as unstructured text inside mock decision/issue content where relevant at all.

## Electorate

| | |
|---|---|
| **Purpose** | The geographic unit connecting a citizen to their local MP. |
| **Canonical identifier** | Electorate name string; matched to `members.electorate`. |
| **Status** | The MP side is real; the **user → electorate mapping is fake** (`/api/electorate-lookup` is hash-based, not geographic — see Personalisation System). |
| **Connected objects** | MP (one electorate → one current MP), User (via `useElectorate`), Feed Post (`electorate-pulse` digests). |
| **Future scalability** | Needs a real electorate-boundary lookup before any consequential feature (targeted email-MP, personalised digests) should be trusted to route correctly. |

## Notification

| | |
|---|---|
| **Purpose** | A personal, actionable or informational alert for one user. |
| **Canonical identifier** | `notifications.id`. |
| **Lifecycle** | Created (by an agent or system event) → delivered → read/unread. |
| **Connected objects** | User, and whatever triggered it (bill status change, pressure-campaign result, donation receipt). |
| **Status** | Real table, real read/unread state — the defect is purely presentational (demo array masking empty state), not structural. |

## User

| | |
|---|---|
| **Purpose** | A Stickee account holder. |
| **Canonical identifier** | Supabase `auth.users.id`, mirrored into `user_profiles`. |
| **Relationships** | Has a Wallet, Positions, Streaks, Follows, Notifications, Push Subscriptions, Comments, Reactions, Onboarding Events, Content Reports (filed by), Donations (optional attribution). |
| **Lifecycle** | Sign-up (`handle_new_user()` trigger, fixed twice for handle-collision bugs in migrations `011`/`012`) → active → (no deletion path found beyond admin-initiated). |
| **Status** | Real and centrally correct — the account object itself has no duplication problem; the duplication problems live in *what's attached to it* (two wallets, for instance). |

## Saved Topic / Watchlist

**Not currently modeled.** No table or hook lets a user save/follow a specific Issue, Pillar, or MP for personalised tracking — `user_follows` exists but is scoped to *other users* (social follow), not *topics*. This is a real gap relative to a "personalised civic briefing" product goal, not a duplicate of the existing follow feature.

## Forecast Market

| | |
|---|---|
| **Purpose** | A tradeable probability estimate tied to a real Issue's outcome. |
| **Canonical identifier** | `issue_markets.id`. |
| **Relationships** | Belongs to one Issue; has many Wallet Positions; is resolved by `resolve_market()`. |
| **Lifecycle** | Open → (optionally) closing-soon → resolved (Yes/No) or voided, per `market-eligibility.ts` and migration `017`'s status constraints. |
| **Evidence requirements** | Resolution should point to the real-world outcome it settled against (the Issue's own status transition) — this linkage exists structurally via the FK but is not separately surfaced as "resolved because Issue X passed on [date]" copy anywhere audited. |
| **Status** | Verified against a real Supabase environment per `AGENTS.md`'s trusted-infrastructure list (staking, eligibility, settlement, concurrency). |

## Wallet / Position

| | |
|---|---|
| **Purpose** | The real points ledger a user stakes with. |
| **Canonical identifier** | `user_wallets.user_id` (1:1 with User); `wallet_positions.id`. |
| **Status** | Real and verified. **A second, parallel implementation exists** (`useWallet.ts`, `localStorage`-only) — this is a duplication defect on the object, not a modeling gap; there is exactly one legitimate Wallet object and it is the Supabase one. |

## Bill Pressure / Civic Action

| | |
|---|---|
| **Purpose** | A recorded citizen support/oppose stance on a specific bill, aggregated into visible pressure. |
| **Canonical identifier** | `bill_pressures.id`, keyed by `(issue_id, user_id | session_id)`. |
| **Status** | Real. The standalone `/campaigns` page's "campaign" concept is **not** this object — it is unconnected mock UI state and should not be confused with it in any future schema work. |

## Feed Post

| | |
|---|---|
| **Purpose** | One item in the civic activity stream — either agent-authored (civic alert, decision update, score change, digest) or human-authored (commentary). |
| **Canonical identifier** | `feed_posts.id`. |
| **Required metadata** | `source_agent_id` (nullable — null for human posts) exists specifically to disclose authorship and is currently dropped before reaching the client (see Feed & Activity System). |
| **Connected objects** | User (author, if human) or Agent (author, if automated), Reactions, Comments, and optionally an Issue/MP it references. |

## Community Leader

| | |
|---|---|
| **Purpose** | A community-nominated aspiring politician, distinct from a sitting MP. |
| **Canonical identifier** | An id local to `mock-leaders-data.ts` — **not** compatible with `members.id`, a deliberate distinction (these are not sitting MPs) but currently under-signaled in the UI (`/leaders` mixes both under one label). |
| **Relationships** | Has Endorsements (`Endorsement` type), a Credibility score (`computeCredibility()`), a Pathway-to-politics narrative. |
| **Status** | Support-pledge writes (`leader_supports`) are real; the profile content itself is fictional/illustrative by current design. |

## Agent / Agent Run

| | |
|---|---|
| **Purpose** | A registered background job and its execution history. |
| **Canonical identifier** | `agents.id` (slug-keyed, `AGENT_IDS`), `agent_runs.id`. |
| **Lifecycle** | Registered → scheduled/manually triggered → run (logged with status/output) → (admin can enable/disable). |
| **Status** | Real, well-instrumented (visible in `/admin/agents`). |

## Donation

| | |
|---|---|
| **Purpose** | A real financial contribution. |
| **Canonical identifier** | `donation_records.id`, cross-referenced to Stripe's payment/session id. |
| **Status** | Real, working, isolated. |

---

## Objects named in scope that resolve to "not a distinct object"

- **Proposal** → resolves to either Market Proposal (unpersisted) or Leader Nomination (real) — not one thing.
- **Evidence** and **Source** → same underlying gap (see above), treated as one entry.
- **Indicator** and **Pillar** → same underlying object at two granularities (metric → pillar rollup), not two separate models.
