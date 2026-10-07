# Stickee V1 — Executive Summary

**Level 3 Stickee Governance Council review.** Full council (all twelve specialist agents, independently, plus this Chair synthesis) reviewed a first-principles redesign of Stickee's core product — Today, Issues, Government, Forecasts, People, Political Pulse, and their secondary pages (Issue detail, Government Decision, Forecast detail, MP profile, Parliament), plus a future Community contribution feature — as if Version 1 were launching today. Governed by `AGENTS.md`; conducted per `docs/STICKEE_COUNCIL.md`.

**Read this document first.** It is the synthesis of, and index to, the other seven deliverables:

| Document | What it contains |
|---|---|
| `STICKEE_V1_PRODUCT_BLUEPRINT.md` | The vision: mission, design principles, product identity, the five-page + Pulse + Community structure, non-negotiables |
| `CORE_PAGE_REDESIGN.md` | Full first-principles spec for all eleven pages (question, hierarchy, interaction model, evidence requirements, etc.) |
| `LOW_FIDELITY_WIREFRAMES.md` | Low-fidelity structural wireframes for every page, desktop and mobile |
| `CONTENT_HIERARCHY.md` | Content model, metadata standard, claim-classification taxonomy, single-source-of-truth map |
| `USER_JOURNEY_MAPS.md` | Current → proposed journeys, traced through real code, with click-count/trust deltas |
| `SIMPLIFICATION_RECOMMENDATIONS.md` | Page-by-page keep/cut/merge/relocate ledger, plus cross-cutting duplicate-system findings |
| `IMPLEMENTATION_BATCHES.md` | The phased build plan, reconciled with the existing `PAGE_REFACTOR_ROADMAP.md` |

This document does not repeat their content — it tells you what the Council found, where it agrees, where it doesn't, what's blocking, and what you need to decide.

**Independent-review principle honoured:** each of the twelve specialists reviewed the mission brief and the current codebase directly, without seeing another agent's conclusions first. What follows is genuine convergence, not one opinion echoed twelve times.

---

## Approval matrix

```
Software Architecture:      Approved with conditions
Product:                     Approved with conditions
Public Policy:                Approved with conditions
Civic Technology:            Approved with conditions
Legal and Regulatory:        Professional review required
Editorial:                    Blocked (as of current content; redesign direction itself not blocked)
UX:                           Approved with changes
Open Source:                  Private-only (unchanged by this review; mostly Not applicable)
Journey and Bottlenecks:      Significant friction (two journeys: Blocking friction)
Product Benchmarking:         Adapt / Experiment first (mixed — one pattern Blocked pending professional review)
Data & Evidence:              Blocked (six of twelve proposed Political Pulse content types; two core objects)
Historical Integrity:         Approved with conditions
```

Reading this matrix honestly: **no agent found the redesign's underlying direction wrong.** Every specialist that reviewed product/UX/architecture/policy substance called the five-page structure (Today/Issues/Government/Forecasts/People), the Forecasts-as-participation-layer reframing, and the Political Pulse concept sound — several independently noted it converges with work this repository had already done on its own (`INFORMATION_ARCHITECTURE_AUDIT.md`'s Option C). What blocks a clean "Merge" is not the vision. It's that **building V1 today, as literally specified, on top of the current codebase would ship real, evidenced defects** — some pre-existing and independently confirmed by two or more agents, some newly exposed by the ambition of the brief itself (Political Pulse's content list in particular).

---

## Consensus findings

Findings independently raised by two or more agents, merged and credited.

### C1 — "Government" is Stickee's most-corroborated single defect
**Raised by:** UX Journey and Bottleneck Analyst (P0, "Blocking friction"), Editorial Advisor (P0, whole-page-unsourced escalation), Data & Evidence Steward (P0), Historian (P1), Public Policy Advisor (institutional-accuracy concern), UX Researcher (P1).
The primary-nav item literally named "Government" (`src/lib/navigation.ts:48`) routes to `/decisions`, a page rendering `mock-government-data.ts` — 100% fictional decision records with fabricated engagement fields (`likes`, `dislikes`, `isTrending`, `isControversial`), a decorative Yes/No poll that discards the user's input, and no `source` field anywhere in its own type definition. The real, verified, Supabase-backed parliamentary record lives at `/parliament`, one small inline text link away. A first-time visitor asking the mission's own question — "what has government actually done?" — is answered by fiction first, on the exact page whose entire purpose is that question. This is the single highest-priority fix in the whole review, independent of everything else.

### C2 — Political Pulse's content ambition outruns its evidence infrastructure
**Raised by:** Data & Evidence Steward (six P0s: Committees, ABS, RBA, Treasury, Speeches, Source corrections — "no evidence chain, regardless of how good the UX design would be"), Editorial Advisor (four P1s, same content types, independently derived), Software Architect (P1, `ranker.ts` is an engagement-weighted algorithm, architecturally the opposite of a chronological feed), Legal Advisor (IP/licensing risk on speeches, electoral-law risk on election content, corrections-workflow defamation exposure), Product Strategist (recommends "Build smaller" — agent-authored civic alerts only for V1), Civic Technology Advisor (P1, current `/feed`'s "algorithmically boosted" badge and share-for-points contradict the brief's own "reject algorithmic outrage" instruction).
Six of the twelve content types the brief names for Political Pulse (Committees, ABS, RBA, Treasury, Speeches, Source corrections) have **zero real data pipeline today** — not partially built, structurally absent. Two more (Elections, Decisions) have real-time state but no persisted history to build a chronological entry from. Only Parliament, Bills (partially), and Forecast openings/resolutions are evidence-supportable today.

### C3 — The "real" participation mechanism the redesign wants to build on is not actually real end-to-end
**Raised by:** Civic Technology Advisor (four P0s), Software Architect (P1, campaign-system duplication), UX Journey Analyst (P1, escalated as a trust issue).
The Civic Action System (`bill_pressures`) is architecturally the right foundation — but today: it's absent from the Issue detail page entirely; `CampaignModal`'s "Contact MP" button has no `mailto:` resolution anywhere in the file (copies text to clipboard and stops); its participant counter is hardcoded per-bill in a mock file while a real aggregation endpoint sits unused nearby; and the market-proposal flow that would be Community's closest existing precedent (`ProposeMarketModal`) never persists past `localStorage`. A redesign whose core participation premise is "we build on the real mechanism, not the fake one" cannot currently make that claim truthfully.

### C4 — Two fabricated per-politician score systems survived the People Truthfulness batch
**Raised by:** Public Policy Advisor (two independent P0s), Data & Evidence Steward (finding 15, same defect from the evidence-chain angle), corroborated by direct code citation from both.
`mock-government-data.ts`'s `DecisionMaker.approvalRating`/`trustScore` (fabricated numbers on real, named ministers) and `HouseChamber.tsx`'s `generateScores()` (a hash of the MP's own id string, rendered as "Approval"/"Trust" on `/leaders` and `/parliament`) are both live, unlabeled, and structurally identical to the "Stickee Score" defect the People Truthfulness batch believed it had removed. Neither was touched by that batch because both live in components the batch didn't scope. `POLITICIAN_SCORECARDS` and `PARTY_VOTE_MAP` (the batch's actual target) also remain imported live by `/impact` and `/issue/[id]`'s `MPVoteGrid` — the same defect, two more unfixed instances.

### C5 — Community, as briefed, is the same feature as the already-once-disabled Community Leader system, not a new one
**Raised by:** Software Architect (recommends reuse, architecturally), Legal Advisor ("Requires professional legal review" — reactivating this exact mechanism for real, identifiable people is a different and more serious risk than the fictional-profile version it replaced), Product Intelligence & Benchmarking Advisor (Scorecard 6, "Blocked pending professional review"), Product Strategist (recommends deferring any new Community surface).
"People they believe could improve Australia" is the Community Leader nomination concept (`NominationModal.tsx`, `leader_supports`, `computeCredibility()`) under a new name. It was disabled after `/leaders/[id]` was found rendering fictional profiles indistinguishably from real people. Reactivating it for real, named individuals does not remove the risk that motivated the takedown — it changes the risk category from fabrication to unverified crowd characterisation of a real person, which is a *harder* legal question, not an easier one.

### C6 — Two duplicate/fake systems must not be relocated with the duplication intact
**Raised by:** Software Architect (P1 ×2), Legal Advisor (Moderate), Product Strategist.
`useWallet.ts` (localStorage, fake) vs. `usePredictionWallet.ts` (real, Supabase) — moving wallet UI to an Account section without retiring the fake one relocates the "two balances for one user" defect rather than fixing it. Same pattern for the leaderboard (hardcoded array, duplicated across `/leaderboard` and `/predictions` today) — reinstating it anywhere without one canonical ranking query reproduces the defect under a new route.

### C7 — Onboarding/personalisation is non-functional at exactly the two places the homepage sends users to fix it
**Raised by:** UX Journey and Bottleneck Analyst (P0, "Blocking friction," escalated to Product Strategist as a scope gap per its own mandate), Legal Advisor (Moderate, privacy implications of a more "personalised" Today page riding on a fake electorate lookup).
Both homepage CTAs literally labelled "Personalise my brief" / "Build my brief" link to `/onboarding`, a fully static page with zero data-collection fields. The one flow that actually collects electorate/issue preferences (`OnboardingModal`) only ever appears automatically on first visit and has no button anywhere that reopens it. Separately, the one real personalisation signal that exists — electorate lookup — is confirmed hash-based, not geographic, by its own code comment.

### C8 — Fabricated precision on the pages that most need to avoid it
**Raised by:** UX Researcher (P1), UX Journey Analyst (P1), Editorial Advisor (P1) — three independent citations of the same finding.
`/parliament`'s header hardcodes four literal stat strings, including "74% Predict Acc." — a number that directly contradicts Forecasts' own honest disclosure, three clicks away, that "Predictor rankings aren't available yet." Legal Advisor separately rates the adjacent AI bull/bear fallback copy and fake market-volume/24h-move figures "High" risk under Australian Consumer Law's misleading-conduct standard.

### C9 — People standing alone as a top-level page (not folded under Government) is correct, and should be formally ratified
**Raised by:** Public Policy Advisor (institutional-accuracy grounds — MPs collectively constitute Parliament, not "the government," in a multi-party legislature; folding them under a "Government" label risks implying partisan membership), UX Researcher and Historian (both independently flag that this diverges from `PROPOSED_ROUTE_TREE.md`'s original Option C, which folded People under Government and gave the fifth nav slot to Support), Product Intelligence & Benchmarking Advisor (corrects a citation risk: this structure is better evidenced as editorial/newsroom section-nav convention than as GOV.UK convention, but independently corroborates the Option-C-equivalent five-way split either way).
This is a genuine, positive finding, not a defect — but it means `PROPOSED_ROUTE_TREE.md` is now the stale document on this specific point (the shipped `src/lib/navigation.ts` already matches this brief, not the older doc). See Owner Decisions.

---

## Disagreements

### D1 — Does "keep Forecasts engaging" survive a re-skin, or does it need real legal review?
**Product Strategist / Product Intelligence & Benchmarking Advisor** treat "engaging but calm" as resolvable by reframing engagement as epistemic (evidence legibility, resolution transparency) rather than behavioural (streaks, urgency) — both recommend proceeding with that operational definition, Benchmarking at "Experiment first."
**Legal Advisor** disagrees on scope, not direction: removing casino *styling* while retaining virtual points, a daily-bonus banner, and a "buy a streak freeze" purchase mechanic addresses the visual-identity risk the constitution names but not the underlying *mechanic-level* pattern (variable-schedule reward plus loss-averse purchase plus probability-based staking) that Australian gambling-adjacent regulatory attention increasingly focuses on independent of art direction. Rates this "Requires professional legal review," not resolvable by design reframing alone.
**Chair's ruling:** both positions stand as stated. Per escalation rules, Legal's "Requires professional legal review" is blocking-equivalent and is not downgraded by Product's more optimistic framing — the *direction* (evidence-first, not urgency-first) is approved to design toward, but no engagement mechanic (including the ones currently live: daily bonus, streak freeze purchase) may be presented as "resolved" by this redesign until a real lawyer has reviewed the mechanic, not just the visual treatment. **Requires owner decision** on whether to commission that review now or gate it at the point Forecasts implementation begins.

### D2 — Is the Community Leader system's real infrastructure a reason to reuse it, or a reason to be more careful?
**Software Architect** frames existing `leader_supports`/`NominationModal.tsx` infrastructure as the efficient path — "don't build a fourth person-type," extend what's real.
**Legal Advisor / Benchmarking Advisor** frame the same infrastructure as the thing that makes this *more* dangerous to casually reactivate, not less — real, persisted writes (support pledges, a computed credibility score) about real, identifiable people is a materially different risk than the fictional version that was disabled.
**Chair's ruling:** not a true contradiction — both are correct on their own axis (architectural reuse vs. legal risk), and neither should be read as overriding the other. **Do not reactivate or build toward this feature until the Legal Advisor's "Requires professional legal review" is resolved by a real lawyer**, regardless of how clean the architectural reuse path is.

### D3 — Where does Support/About live now that People occupies the fifth nav slot?
Not a disagreement between agents so much as a gap: `PROPOSED_ROUTE_TREE.md` assumed Support would hold the fifth primary-nav slot; this mission's brief (already reflected in shipped code) gives that slot to People instead. No agent objects to People's placement (see C9) — the gap is that no document yet states where Support/About/legal pages land instead. **Requires owner decision**, flagged by UX Researcher and Historian.

---

## Blocking risks, in priority order

1. **Data & Evidence Steward — Blocked.** Six Political Pulse content types (Committees, ABS, RBA, Treasury, Speeches, Source corrections) have no evidence chain; "Decision" as an object has no source field by construction; the mission's own "Issue → Evidence → Timeline → Forecast" progression is broken at two of five steps (Evidence, Timeline) by a schema gap, not a design gap.
2. **Legal Advisor — six items at "Requires professional legal review" or higher**, none downgradeable: the forecast engagement-mechanic question (D1); the Community real-person nomination/scoring feature (D2, C5); the missing Privacy Policy/Terms of Service (repo-wide, confirmed absent, already handling real auth/wallet/donation data); the Political Pulse "source corrections" defamation-adjacent exposure; the UGC moderation gap (no admin queue exists at all — System 12); electoral-law exposure for live election content.
3. **Editorial Advisor — Blocked** on current content: the Government/Decisions page's entire premise is fabricated, not just individually unsourced claims (its own escalation rule for whole-page defects); a live "✓ You're with the majority — X% of Australians agree" claim misattributes a Stickee forecast-market figure as national public opinion.
4. **Civic Technology Advisor — four P0s** undermining the redesign's central participation premise (C3).
5. **Public Policy Advisor — two live P0 fabricated-score systems** (C4), independent of whether the redesign proceeds at all — these are current-production defects that should be fixed regardless.
6. **UX Journey and Bottleneck Analyst — two journeys rated "Blocking friction"**: Government (C1) and personalisation (C7).

No agent rated the redesign's underlying product direction itself "Blocked." Every blocking finding above is either (a) a pre-existing, independently-confirmed defect in the current codebase that must be fixed as part of — not instead of — this redesign, or (b) a real legal/evidence gate on a specific proposed feature (Political Pulse's weakest content types, Community) rather than on the five core pages.

---

## Owner decisions required

Consolidated from all twelve reviews — none of these are resolved by this document.

1. **Confirm this Council's output extends `PAGE_REFACTOR_ROADMAP.md` rather than superseding it** (Product Strategist) — the two independently converge on nearly the same five-page hierarchy; treat as confirming evidence, not a competing plan.
2. **Approve the Issue/Bill/Decision schema merge** as a real data migration (own-table vs. presentation-layer strategy) before Issues-page or Government-Decision-page implementation begins (Software Architect, Data Steward, Historian all name this; Historian notes it is *lower* risk than it looks, since the mock `Decision` side has no real history to lose).
3. **Approve retiring `useWallet.ts`** in favour of the single real wallet before any Account/wallet relocation ships (Software Architect, Legal).
4. **Decide Political Pulse's V1 scope**: agent-authored civic alerts only (Parliament, Bills, Forecast openings/resolutions — the evidence-supportable subset), with Committees/ABS/RBA/Treasury/Speeches/Source-corrections explicitly deferred until each has a real pipeline (Data Steward, Editorial, Product Strategist all converge on this scoping).
5. **Confirm Political Pulse ships as a secondary/contextual page, not a sixth primary-nav slot** (Product Strategist) — re-adding a sixth top-level item would repeat the exact "too many top-level concepts" problem the standing IA audit already diagnosed.
6. **Defer the Community feature past V1 launch**, pending: a real lawyer's review of real-person nomination/scoring (Legal, Benchmarking); a built admin moderation queue (Product Strategist, Legal, Civic Technology — System 12 currently has none); and an explicit decision on whether it's a fast-follow or genuinely out of scope (Product Strategist).
7. **Commission a real, qualified Australian lawyer** to review: the forecast engagement-mechanic question (D1); Privacy Policy/Terms of Service (currently absent entirely); moderation/Online Safety Act exposure; and the Community nomination concept specifically before any of the four proceed.
8. **Reconcile `PROPOSED_ROUTE_TREE.md`'s nav table** with the now-confirmed People-as-primary decision (D3) and state explicitly where Support/About/legal pages live (footer/secondary nav is the natural answer; not yet written down anywhere).
9. ✅ **Implemented 2026-08-05.** **Approve the two immediate, independent, no-dependency fixes** that should not wait for the rest of this program: point the "Government" nav item at real content (C1) and remove or fix the two live fabricated-score systems (C4) — both are P0-severity, both are small, scoped, and unrelated to any other decision on this list. C4's import trace found two additional live instances beyond the two originally cited (`POLITICIAN_SCORECARDS` on `/impact`, `PARTY_VOTE_MAP` via `MPVoteGrid` on `/issue/[id]`) — all four fixed in the same pass. See `STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md` for full detail; this did not begin the Issue/Decision schema merge (Owner Decision 2) or any other item on this list. ✅ **Further implemented 2026-08-09** (`GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`): `/parliament`'s four hardcoded header stats (including "74% Predict Acc.," cited in C8 below) are removed; the fabricated public-support percentage was found to be generated even in the "real," Supabase-backed data path (`parliament-db.ts`) and removed there too; `MPDrilldownTable`'s live "Public align" column (a second, previously undocumented instance of the same defect) was found and removed; the party-line vote inference is no longer presented as an individually recorded vote; the duplicate bill catalogue was removed in favour of a link to Issues.
10. **Decide the MP canonical-identifier migration plan** (Historian) — wiring real vote data into MP profiles requires keying off `members.id`, not the current mock `MPIndex` scheme; this is an identifier migration, not a cosmetic route rename, and needs an explicit mapping before `/people/[id]` ships. **Corroborated 2026-08-09** (`GOVERNMENT_V1_SIMPLIFICATION_REPORT.md`): `HouseChamber`'s live member source (`useLiveParliamentMembers`, ids like `house-live-3`) and the real per-member vote data (`parliament-db.ts`'s `voteMatrix`, ids like `tvfy-10029`) use disjoint id schemes today — confirmed by direct code reading, not assumed. Wiring `voteMatrix` into the chamber's seat-level display was attempted and abandoned for this reason; it would silently never match. This is the same migration this item already names, not a new gap. **Further corroborated 2026-08-09** (`PEOPLE_V1_SIMPLIFICATION_REPORT.md`): a third id scheme is in play on `/leaders`/`/mp/[id]` specifically — the static `MPIndex` (`mock-data.ts`'s `mp-*` ids, 150 House MPs only) that `/mp/[id]` actually looks up. Live House rows resolve against it only when their electorate name string-matches a mock seat; live Senate rows never do (no mock Senate MP dataset exists at all), so every Senate profile link was 404ing before this batch guarded it. A real migration needs to reconcile all three schemes (`MPIndex`'s `mp-*`, live `house-live-N`/`senate-*`, and `tvfy-*`), not just the two named above.

---

## Overall recommendation: **Requires owner decision** and **Requires real professional review**

Per `agents/council-chair.md`'s escalation rules, a Legal Advisor "Requires professional legal review" and a Data & Evidence Steward "Blocked" are each independently blocking-equivalent to a P0 — this rules out a plain "Merge" or "Merge after specified fixes" for the program as a whole. But collapsing this into a single "Do not proceed" would misrepresent what the Council actually found: the *design and planning work* (the seven other deliverables this document indexes) is sound, evidenced, and ready for your review now. What's gated is *implementation* of specific features, not the blueprint itself.

Concretely:

- **Proceed now, no gate:** review and approve the design blueprint (this document + the other seven). Fix the two standalone P0s named in Owner Decision 9 — both are small, both are already-known defects independent of any redesign decision.
- **Proceed once the Issue/Decision schema decision is made (Owner Decision 2):** Issues, Government, Government-Decision page implementation.
- **Proceed once evidence-supportable content is scoped (Owner Decision 4):** Political Pulse, as a secondary page, agent-authored-alerts-only for V1.
- **Do not proceed without a real lawyer's review:** the forecast engagement mechanic (D1), Community (D2/C5), Privacy Policy/Terms of Service, and Political Pulse's corrections mechanism.
- **Explicitly deferred, not designed for V1 launch:** Community, in full.

See `IMPLEMENTATION_BATCHES.md` for the sequenced plan this recommendation resolves into.

## Implementation order (if proceeding)

1. Fix the two standalone P0s (Government nav destination; both fabricated-score systems) — no dependency on anything else in this document.
2. Owner approves the Issue/Bill/Decision schema-merge plan.
3. Issues + Government (evidence layer) + Government-Decision page redesign, built on the merged schema.
4. Forecasts redesign (participation-layer reframing, wallet/leaderboard consolidation) — engagement-mechanic legal review runs in parallel, gates final copy/mechanic sign-off, not the visual/structural work.
5. People redesign (MP canonical-ID migration decided first). ✅ **Truthfulness/simplification implemented 2026-08-09** (`PEOPLE_V1_SIMPLIFICATION_REPORT.md`) **without** the canonical-ID migration — per that batch's explicit instruction not to attempt a partial migration that could silently mismatch. Instead, the directory now guards every profile link against the id scheme it actually resolves against (`mp-*`), showing a truthful "Profile unavailable" label rather than a dead link for the rest — including a newly-found, previously undocumented case: every Senate row's profile link 404s today, since no mock Senate MP dataset exists to resolve against (see that report's canonical-ID findings). The full migration this item names is still not done and is still required before individual voting history or real Senate profiles can ship.
6. Political Pulse, scoped to evidence-supportable content types only.
7. Community — not scheduled; revisit after legal review and moderation-queue infrastructure exist.

Full detail, risk levels, and file-level scope for each step: `IMPLEMENTATION_BATCHES.md`.
