# Requirements for a legitimate MP "Stickee Score"

The previous "Stickee Score" shown on `/mp/[id]` and in `MPVoteGrid`/`leaders/page.tsx` was removed in
Implementation Batch 1 (see `docs/audits/IMPLEMENTATION_BATCH_1_REPORT.md` and `docs/audits/DATA_AND_CONTENT_AUDIT.md`) because
it was computed from a fixed per-party vote assumption applied to a handful of illustrative mock issues
— not from any individual MP's actual voting record — while the UI text claimed the opposite. This
document specifies what a real replacement needs before it's reintroduced (the code path is preserved
behind the `NEXT_PUBLIC_MP_SCORE_ENABLED` flag in `src/lib/mock-market-data.ts`, not deleted).

## Data requirements

- **Real division/vote records.** Must be computed from `member_votes` joined to `divisions` (both
  already populated by the `/api/sync/divisions` cron job from the TheyVoteForYou API) — never from a
  hardcoded party-vote map or mock issue list.
- **Source attribution.** Every score must be traceable to the specific set of divisions it was computed
  over (a list of `division_tvfy_id` values, or a saved query), not just a number.
- **Data period.** The score must state the date range of votes it covers (e.g. "current term," "last 12
  months") and must be recomputable as new divisions are synced.
- **Update date.** Store `computed_at`/`synced_at` alongside the score, and surface it in the UI ("as of
  <date>"), not just in the database.

## Methodology requirements

- **Reproducible methodology.** The exact formula (which divisions are included, how they're weighted,
  what counts as "alignment") must be written down somewhere a user can read, not just implemented in
  code.
- **Explicit treatment of:**
  - **Absences** — does a missed vote count against the MP, get excluded, or get treated separately?
  - **Pairs** (an MP formally paired with an opposing MP so both abstain) — these are not the same as a
    genuine abstention and should not be scored as such.
  - **Rebellions** (voting against your own party) — decide up front whether this is scored neutrally,
    positively, or negatively, and say so.
  - **Conscience votes** — party-line alignment is not a meaningful comparison for a vote where the party
    explicitly didn't whip it.
  - **Party-line votes** — if the methodology partly reflects party alignment, that must be labeled as
    such and clearly distinguished from an individual voting record (see the audit finding that named
    this exact conflation as the core problem with the removed score).
- **Transparent weighting.** If different divisions are weighted differently (e.g. by significance), the
  weights must be documented, not just baked into the code.
- **Correction process.** There must be a way to correct a wrong score (e.g. a division was miscounted)
  and a record of that correction — this is the same "resolution can't be silently changed" principle
  applied to `resolve_market()` in this batch, applied to scoring instead of settlement.
- **Disclaimer.** The UI must state, in plain language, what the score does and does not measure — e.g.
  "this reflects recorded division votes only; it does not capture committee work, electorate advocacy,
  or votes taken outside formal divisions."

## What NOT to do

- Do not replace the removed score with a different fabricated metric to fill the same UI slot.
- Do not present party affiliation or party-line assumptions as if they were an individual's voting
  record — if party alignment is part of the methodology, label it as party alignment, separately from
  individual vote alignment.
- Do not reintroduce the score without every item above being true, even under time pressure — this is
  the exact failure mode that created the original P0 finding.
