import type { AgentHandler } from './runner'

/**
 * MP Scorecard Recalculator — DISABLED (safe no-op)
 * ───────────────────────────────────────────────────────────
 * This agent previously computed a "civic alignment score" per MP and wrote
 * it onto whichever `user_profiles` row had a `display_name` that exact-
 * string-matched the MP's name, then published a "leader_update" feed post
 * in that user's name. `display_name` is a real, user-editable field (see
 * `handle_new_user()` in migrations 011/012) — it is not an identity column
 * for anyone, let alone a sitting MP. Any user who set their own display
 * name to match an MP's name (accidentally or deliberately) would have had
 * their own account's `civic_score` silently overwritten by this agent, and
 * a fabricated civic-score feed post published as if it were about them.
 * That is a real correctness/privacy defect, found during the Responsibility
 * Engine architecture audit (see docs/architecture/CANONICAL_ID_STRATEGY.md
 * §1 and RESPONSIBILITY_ENGINE_V1_FOUNDATION_REPORT.md §1).
 *
 * There is no canonical Person ↔ User-account relationship anywhere in this
 * schema — Stickee has no verified way to link a real MP's identity to a
 * specific human user account. Per the fix instructions, this agent is
 * disabled outright rather than patched with a different matching heuristic
 * (fuzzy name match, electorate match, etc.): every substitute join carries
 * the same identity-conflation risk this fix exists to remove, and inventing
 * one would just move the bug, not close it.
 *
 * Separately, and independent of the identity bug: the "civic score" this
 * agent computed is, by this file's own original comment, "the cheapest
 * plausible proxy for public opinion" — the same defect class as the MP
 * voting-consistency score already removed from `/mp/[id]` for truthfulness,
 * and already excluded from Political Pulse for exactly this reason (see
 * `src/lib/feed/pulse-format.ts`). Re-enabling this agent requires BOTH a
 * real, verified identity link AND a real scoring methodology meeting
 * docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md — neither exists today.
 *
 * This handler intentionally does nothing. It performs no reads or writes
 * against `user_profiles`, `members`, `divisions`, `member_votes`,
 * `predictions`, or `feed_posts` — there is nothing it can safely compute or
 * publish without the missing identity link.
 */
export const mpScorecard: AgentHandler = async (ctx) => {
  ctx.processed = 0
  ctx.written = 0
  ctx.notes.push(
    'Disabled: no canonical Person↔User-account relationship exists. ' +
    'The previous display_name string-match join against user_profiles has ' +
    'been removed, not replaced with another heuristic.',
  )

  return {
    status: 'warn',
    summary:
      'mp-scorecard is disabled. It previously matched MPs to user accounts by ' +
      'exact display-name string equality, which could silently overwrite a ' +
      'real user’s civic_score and publish a fabricated feed post in their ' +
      'name. No canonical MP↔user identity link exists, so this agent now ' +
      'performs no reads or writes and is a safe no-op.',
  }
}
