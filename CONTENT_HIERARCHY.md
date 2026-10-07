# Stickee V1 — Content Hierarchy

Companion to `CORE_PAGE_REDESIGN.md`. This document specifies the content model every page composes from: the mandatory claim classification, the evidence metadata standard, the single-source-of-truth map (which real system backs which page element), and the "one hero number" discipline applied consistently. Grounded in the Data & Evidence Steward, Editorial Advisor, and Public Policy Advisor's Council findings (`STICKEE_V1_EXECUTIVE_SUMMARY.md`).

---

## 1. Mandatory claim classification

Per `AGENTS.md`, every public-facing political claim on every page in this blueprint carries exactly one of:

- **Verified fact** — traceable to a specific, checkable primary source
- **Sourced analysis** — a reasoned interpretation, attributed
- **Forecast** — a probability estimate, never presented with the certainty of fact
- **Community opinion** — a stated position, attributed to who holds it
- **AI-generated interpretation** — explicitly labelled as such, never inheriting the confidence of the source material it summarises
- **Demo content** — explicitly labelled, never indistinguishable from real content
- **Unverified** — flagged, not hidden
- **No verified data available** — the only acceptable fallback when nothing above applies; never filled with a plausible-sounding placeholder

This is not a style guideline. It is the Editorial Advisor's mandatory classification requirement, applied here as a build constraint: **a page element that cannot be classified does not ship.**

## 2. Evidence metadata standard

Per the Data & Evidence Steward's canonical-reviewer standard, every issue page, government decision, forecast, parliamentary record, MP profile, evidence summary, and AI-generated explanation should carry (schema permitting):

```
Source:
Published:
Retrieved:
Verified:
Confidence:
Methodology:
Last successful sync:
```

Where a schema does not yet have a field for one of these, that is a Software Architect-relevant gap ("field does not exist"), not a silent pass. Today, per the Council review, this is true almost everywhere: `issues.source_url` exists but is unused for the who-supports/who-opposes claims most likely to be quoted; the mock `Decision` type has no source field at all, structurally; `resolution_source` exists at the database layer but isn't surfaced to the reader.

**This blueprint does not ask every page to invent this metadata from nothing.** It asks that no page present a claim as more certain than its actual evidence chain — where the chain doesn't exist, the content is Demo/Unverified/No verified data available, stated plainly, per §1.

## 3. Political Pulse — the evidence-chain gate, restated as content policy

Because Political Pulse is the single page in this blueprint whose proposed content list most exceeds current evidence infrastructure, its content policy is stated here explicitly rather than left to page design:

| Proposed content type | Evidence status today | V1 policy |
|---|---|---|
| Parliament | Real, traceable (TheyVoteForYou sync) | **Included** |
| Bills | Status/source real; who-supports/opposes unsourced | **Included** — status/source fields only |
| Decisions | No source field exists on the object at all | **Excluded** until the Issue/Decision merge lands |
| Committees | No table, type, or sync exists | **Excluded** until a real pipeline exists |
| Elections | Real live state; no persisted history | **Excluded from chronology**; live-only state may appear elsewhere, not as a Pulse entry |
| ABS | No sync; only mock-labelled fixture strings exist | **Excluded** until a real ABS integration exists |
| RBA | No sync; existing references are inside the Scenario Simulator's synthetic/hypothetical data | **Excluded** — do not reuse simulator content for real Pulse entries under any circumstance |
| Treasury | No sync; existing references are explicitly fictional ("leaked... paper") inside simulator data | **Excluded** — same reason as RBA, doubly so |
| Speeches | No table, sync, or even mock precedent exists anywhere | **Excluded** — net-new scope, not a relabeling task |
| Forecast openings | Real, verified infrastructure (`issue_markets`) | **Included** |
| Forecast resolutions | Real at the database layer; `resolution_source` not yet public | **Included**, contingent on surfacing `resolution_source` publicly first |
| Source corrections | No mechanism exists anywhere in the schema | **Excluded** — foundational infrastructure gap, see §5 |

**Every excluded row above is a P0 in the Data & Evidence Steward's review — none may be waived for design or launch-date reasons.** Re-including any of them requires the specific, named infrastructure work in `IMPLEMENTATION_BATCHES.md`, not a copy/labeling fix.

Every included row still requires a mandatory, visible actor-type tag per entry — **Executive / Legislature / Independent statutory body / Statistical agency / Stickee-forecast** — per the Public Policy Advisor's finding that a single chronological stream mixing institutionally distinct actor types, without this tag, risks a reader treating a legislative vote, an RBA decision, and a Stickee forecast resolution as equivalent in kind. This is a content requirement, not an optional design flourish.

## 4. Single source of truth — which system backs which page element

One row per page element that has, today, more than one candidate data source. Where two exist, the real one is named; the other must not survive into V1.

| Page element | Real source (use this) | Fake/duplicate source (do not use) |
|---|---|---|
| Bill/issue list | `issues` table | Mock `Decision` type / `mock-government-data.ts` |
| Forecast probability | `issue_markets`, via `market-eligibility.ts` | `FeaturedMarketCard`'s independent demo-market path |
| Points balance | `usePredictionWallet` (Supabase) | `useWallet` (localStorage) |
| Leaderboard ranking | One real query over `wallet_positions` (does not exist yet — must be built as one query, not reinstated as a second hardcoded array) | The hardcoded array currently duplicated across `/leaderboard` and `/predictions` |
| MP vote record | `member_votes`/`divisions` | `PARTY_VOTE_MAP` (assigns every MP of a party the same vote) |
| MP/politician score | None — do not build one without satisfying `docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md` | `POLITICIAN_SCORECARDS`, `HouseChamber.tsx`'s `generateScores()` (both live fabrications today) |
| Bill-pressure/participation count | `bill_pressures`, via `/api/bills/pressure-summary` | `mock-parliament-data.ts`'s hardcoded per-bill `campaignCount` |
| Take-action mechanism | `CampaignModal`/`bill_pressures` (once its `mailto:` resolution is fixed — see `SIMPLIFICATION_RECOMMENDATIONS.md`) | `/campaigns`' standalone fake join/propose mechanic |
| Electorate | One real electorate service (does not exist yet — the current hash-based lookup is not real geography) | Two independent, unsynced storage keys (`useElectorate`'s `stickee:electorate` vs. `OnboardingModal`'s `stickee:user-prefs`) |
| Political Pulse feed | A new chronological query over `feed_posts`, filtered per §3 | `feed/ranker.ts`'s engagement-weighted algorithm (the wrong model for a chronological page) |
| Feed/Pulse authorship | `feed_posts.source_agent_id`, restored to the client shape | The current client shape, which drops this field before it reaches the reader |
| "Community leader" credibility | None — not evidence-supportable, see §5 | `computeCredibility()` over `mock-leaders-data.ts` |

## 5. Foundational gaps this content model depends on

Two pieces of missing infrastructure are load-bearing for large parts of this blueprint, not page-specific nice-to-haves — named once here, referenced by every page that needs them rather than re-derived:

**`evidence`/`citations` table.** Per the Domain Model and Software Architect's findings, no table today carries retrieval date, confidence, or methodology for any claim. A proper join table (source, url, publication date, retrieval date, linked object type+id, confidence classification per §1) would let Issue, Government Decision, MP, and Forecast content all point at real evidence instead of relying on component-level trust. This is the single most consequential schema gap relative to Stickee's stated mission, per two independent Council reviews.

**`issue_timeline_events` table.** The mission's own stated progression — Issue → Government activity → Evidence → **Timeline** → Forecast — has no durable record to draw the Timeline step from. `bill-stage-tracker` currently infers status transitions from a hash of `(status, updated_at)` rather than writing history; `BillStageTimeline.tsx` independently sources from a second, separate mock file. A real table, written to by the sync job that's already positioned to write it, resolves both problems with one piece of work.

Neither of these blocks starting the redesign. Both block calling the Issue/Government-Decision/Forecast progression "done." See `IMPLEMENTATION_BATCHES.md` for sequencing.

## 6. The "one hero number" discipline

Audited across the current implementation, hero numbers are inconsistent in a way this blueprint corrects uniformly:

| Page | Current state | V1 requirement |
|---|---|---|
| Today | None (correct — no live indicator exists) | None, until real |
| Issues | One number, stated twice (hero + duplicate stat tiles) | Stated once |
| Government/Parliament | Four hardcoded literals, none computed | Exactly one, computed from the data rendered below it |
| Forecasts | One number, sharing a header row with five other figures (wallet, positions, sign-in, propose, toggle) | One number, alone in its row |
| People | One number, real, correctly sourced | Unchanged — this is the template every other page's header should match |

A hero number that isn't computed from the content beneath it is not a design defect — it's a specific instance of the "no number implies more confidence than the evidence behind it" rule, applied at the top of the page where it does the most damage.
