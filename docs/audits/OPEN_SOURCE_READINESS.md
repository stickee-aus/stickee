# Stickee — Open Source Readiness

## Recommended model: **open-core, staged, not yet**

Stickee has real architectural strengths (the atomic staking RPC, RLS coverage, the TheyVoteForYou/AEC integrations) that would benefit from community contribution, but it currently mixes those with unresolved trust issues (fabricated MP scores, unsourced political claims) that would be actively harmful to publish as-is on a politics platform. Recommend: **not now**, revisit after `PRODUCTION_BLOCKERS.md` P0 items are resolved, then open-core (core engine public, specific data/scoring pipelines and admin tooling private).

## What can be public (after P0 fixes)

- Core Next.js app scaffolding, UI components, design system usage (shadcn/Tailwind)
- The wallet staking RPC and its tests, once written — this is genuinely good, defensible code
- The TheyVoteForYou/AEC sync integration pattern
- Generic infrastructure: auth flows, admin console pattern, feed ranking mechanics (once bot-labeling is fixed)

## What should remain private, or be re-architected before going public

- **Any MP/leader scoring logic**, until it is either real or clearly and permanently relabeled as illustrative — publishing the current mismatch between claimed and actual methodology (P0-4) would let anyone read the exact mechanism by which real politicians get an inaccurate public score, compounding rather than mitigating the reputational risk.
- **Political claim content** (`whoSupports`/`whoOpposes` and similar) until sourced — same reasoning.
- **Admin tooling internals** and the exact shape of moderation/ban logic, which is common practice to keep semi-private to reduce gaming.
- **Secrets and deployment configuration** — obviously, and note `MVP_LAUNCH.md` must be scrubbed and gitignored first (P0-6).

## Missing governance files

None of the following exist; all are needed before a public release:
- `LICENSE` — pick a license first (MIT is the common default for this kind of project; final choice needs your call, not a technical one).
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md` (how to report vulnerabilities — especially relevant given the P0 findings in this audit)
- `.github/ISSUE_TEMPLATE/`
- `.github/PULL_REQUEST_TEMPLATE.md`

## Licensing concerns

- No full dependency-license audit was performed (a full `node_modules` scan was explicitly out of scope for this pass); direct dependencies spot-checked clean (no GPL/AGPL flags), but this needs a proper legal/licensing review before any public release, not just a spot check.
- Any copied UI assets, icons, or fonts should be inventoried for license compliance — not verified in this audit; flag as **requires manual review**.
- The AEC and TheyVoteForYou data usage should be checked against those services' terms of use before redistributing derived data publicly (this is a data-licensing question, not a code-licensing one, and needs review independent of the software license choice).

## Secret and history cleanup required before going public

1. Scrub/gitignore `MVP_LAUNCH.md` (P0-6) — confirmed not yet in git history, so no history rewrite is needed *if fixed now*.
2. Rotate `SYNC_SECRET` and `THEYVOTEFORYOU_API_KEY` regardless, since they've been visible in plaintext in the working directory.
3. Re-confirm no env file or secret ever entered git history immediately before making the repo (or any part of it) public — this audit found none, but re-check at the time of the actual release, since new commits will have been made between now and then.

## Recommended staged open-source plan

1. **Now → Phase 4 (per roadmap):** Stay private. Fix P0 data-trust and market-engine issues first — publishing a politics platform with a demonstrably fake MP scoring system attached to real politicians' names is the kind of thing that gets picked up and is very hard to walk back once public.
2. **After Phase 4:** Add governance files, pick a license, do the dependency/asset licensing review.
3. **After Phase 5 (public-user readiness):** Consider open-sourcing the generic application shell and infrastructure patterns (auth, admin console pattern, wallet RPC, sync integrations) as a reference/open-core release, keeping content-sourcing pipelines and moderation internals private.
4. **Ongoing:** Once public, `SECURITY.md` and a clear "this data may be illustrative/demo" disclosure become permanent requirements, not one-time fixes — any future mock/demo content added to the public repo needs to carry the same labeling discipline recommended in `DATA_AND_CONTENT_AUDIT.md` §7.

## Directories that could be open-sourced first with lowest risk

- `src/components/ui/` (shadcn-based primitives) — generic, no domain risk.
- The staking RPC + wallet migration pattern, once tests exist — demonstrates a genuinely well-built pattern others could learn from.
- The sync integration pattern (`api/sync/*`, `lib/aec-election.ts`) — shows a clean real-data integration, low domain risk since it's read-only public data.

Everything under `src/lib/mock-data.ts`, `mock-market-data.ts`, and the MP/leader scoring path should be the **last** thing made public, and only after it stops being fictional.
