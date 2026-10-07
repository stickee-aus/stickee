Governed by [`AGENTS.md`](../../AGENTS.md), which these principles operationalise but never override. Documentation only, no code changed.

# Stickee — Engineering Principles

These are the rules every contributor — engineer, designer, or agent — checks a change against before writing it, derived from the systems audit in this folder and from patterns already observed going wrong at least once in this codebase.

## Systems-thinking principles

1. **Every feature must belong to at least one system.** If you can't name which system in `STICKEE_SYSTEM_ARCHITECTURE.md` a new feature extends, that's a signal to either extend an existing system properly or stop and name the new system explicitly (rare) — not to build it as a page-local one-off. `/campaigns` and the `useWallet.ts` duplicate wallet both exist because this rule wasn't applied.

2. **Every object must have a canonical source.** One table, one file, one function — never "whichever one happened to be imported." Before adding a new data source for an existing object (Issue, MP, Market, Pillar), check `DOMAIN_MODEL.md` for the object's stated canonical source and use it, even if it's less convenient than writing a new fixture.

3. **Every claim must have evidence, or say it doesn't.** Per `AGENTS.md`'s truthfulness section: every public political statement is Verified fact / Sourced analysis / Forecast / Community opinion / AI-generated interpretation / Demo content / Unverified / or "No verified data available" — and the UI must say which. A number with no source line is not a smaller version of a sourced number; it's a different, riskier kind of claim.

4. **Every relationship should be explicit, not implied by proximity.** If an Issue page shows an MP's name, that should be a real link to a real MP object (`/mp/[id]`), not a string that happens to match. `RELATIONSHIP_GRAPH.md` names several relationships that exist as unlinked mock data today for exactly this reason.

5. **Every page should compose systems, not reimplement them.** Before writing logic in a `page.tsx`, ask whether that logic already exists in a system's shared component/lib file. If yes, import it. If a similar-but-not-identical version already exists in two places (e.g. two leaderboard arrays), that's a bug to fix, not a precedent to follow.

## Anti-duplication principles

6. **Avoid duplicate architectures.** One wallet, one market-eligibility check, one navigation registry, one design-token set. When you find a second implementation of something that should be singular, the fix is deletion of one, not documentation of both as "the two ways to do X."

7. **Avoid duplicate APIs.** A new route handler that does what an existing one already does (even with a different name — `/campaigns`' fake mechanic vs. the real `CampaignModal` system) is a duplicate API regardless of the URL.

8. **Avoid duplicate business logic.** Grade→colour mapping, market eligibility, credibility scoring — each should live in exactly one `lib` function, imported everywhere it's needed, never reimplemented per-component (`PillarCard.tsx`/`PillarGradeChip.tsx` currently violate this).

9. **Avoid duplicate data models.** `issues` vs. the mock `Decision` type are the same real-world concept with two incompatible ID/status schemes — this is the costliest current instance of this principle being violated, and the highest-priority fix named in `DOMAIN_MODEL.md`.

10. **Prefer extending systems over creating new ones.** A new "Petitions" feature is Civic Action with a new bill-pressure sub-type, not a new system. A new "Committee reports" feature might be a genuinely new object (Committee doesn't exist yet) but should attach to Government Record's ownership and evidence conventions, not invent its own.

## Trust and safety principles

11. **Truth before completeness.** Never keep mock/demo content live on a public page merely so the page looks populated. An honest "No verified data available" is always preferable to a fabricated number — this is not a design nicety, it's the platform's entire value proposition.

12. **Real-database verification for anything financial-equivalent.** Wallets, staking, settlement, bonuses, RLS, PostgREST grants, SECURITY DEFINER functions: static review is insufficient, per `AGENTS.md`. Extend the existing pgTAP test pattern (`supabase/tests/*.test.sql`) rather than trusting a code read alone.

13. **AI-generated content must be visibly distinguishable from verified fact.** Currently easy to satisfy because no agent calls an LLM — but this principle must be re-checked the moment any agent, feature, or third-party integration introduces generated text, not assumed to hold forever by default.

14. **No number implies more confidence than the evidence behind it.** A probability, score, or grade rendered without a source/methodology line or an explicit "demo" label is a design defect, not just a content one — see `CIVIC_DESIGN_SYSTEM.md` Part 2, principle 6.

## Design-system alignment (why "calm and structured" works, and how to get there without copying anyone)

The brief asks specifically *why* a calm, modern reference product (Kalshi is the named example) reads as calm, readable, and consistent — not to copy its look. Reverse-engineered principles, independent of any specific product's brand:

- **One decision, one visual weight.** A calm interface uses exactly one strong visual signal per decision a user needs to make (is this passing? is this real?) — not five reinforcing cues (colour + shadow + gradient + pill shape + icon) stacked on the same fact. Stickee's current density of colour-coded status inks (12+ hues cataloged in `CIVIC_DESIGN_SYSTEM.md`) is the opposite of this — not because colour is wrong, but because too much of it is trying to say the same thing at once.
- **Structure comes from grid and type, not chrome.** Calm products use consistent column widths, consistent type scale, and hairline dividers to create order — they very rarely use shadows or gradients to do that job. This is exactly `CIVIC_DESIGN_SYSTEM.md`'s "borders instead of shadows" rule, arrived at independently from the same observation.
- **Numbers are legible at a glance because there are few of them, well-hierarchized.** A calm market/data product shows one primary number per card, prominently, with everything else demoted to metadata weight — not a dashboard tile with five competing stats. Stickee's newspaper-card model (kicker → headline → dek → byline metadata, per `CIVIC_DESIGN_SYSTEM.md` Part 2) achieves the same effect through an editorial metaphor instead of a fintech one — this is the "uniquely Stickee" version of the same underlying principle, not a copy.
- **Motion is informational, never decorative.** Calm products animate state changes (a number updating, a filter applying) and nothing else — no hover-lift, no celebratory motion for routine actions. Stickee's current hover-lift transforms and confetti-adjacent streak/badge animations are the specific violations of this principle already catalogued.
- **Consistency is enforced by a shared system, not by convention.** The reason a calm product feels the same on every screen is that every screen imports the same token set and component library — it is a structural property, not a discipline habit. Stickee's four coexisting visual systems exist precisely because there has been no single enforced source; `CIVIC_DESIGN_SYSTEM.md`'s token specification is the fix, once implemented in code (it is not yet).

The takeaway for contributors: when a component "needs a shadow to look right," the actual missing thing is almost always a clearer type hierarchy or a hairline border, not the shadow. Reach for `CIVIC_DESIGN_SYSTEM.md`'s tokens before reaching for a new visual effect.

## Process principles

15. **Audit before building.** Read `STICKEE_SYSTEM_ARCHITECTURE.md`, `DOMAIN_MODEL.md`, and this file before starting non-trivial work — this mirrors `AGENTS.md`'s own workflow section and is not optional ceremony.

16. **Explain trade-offs before large refactors, then wait for approval.** Consolidating Issues/Decisions, retiring `useWallet.ts`, or wiring Civic Indicator to real data are all large, valuable, and risky enough to need an explicit implementation plan and owner sign-off before code changes — per `FUTURE_SYSTEMS.md`'s recommended order.

17. **Prefer reversible changes.** Relabeling a mock section as "illustrative" is reversible and immediate; deleting a mock file outright before its replacement exists is not — sequence fixes accordingly.
