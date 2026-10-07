import type { AgentHandler } from './runner'

/**
 * Prediction Resolver
 * ───────────────────────────────────────────────────────────
 * Looks at `issues` whose status is `passed` or `rejected`, finds the
 * predictions made about them, marks them as correct/incorrect, updates
 * each predictor's civic_score, and emits a results card per issue.
 *
 * Idempotent via the resolution post id (issue + status + day).
 */
export const predictionResolver: AgentHandler = async (ctx) => {
  const { data: resolved } = await ctx.admin
    .from('issues')
    .select('id, title, status, updated_at')
    .in('status', ['passed', 'rejected'])

  const issues = (resolved ?? []) as Array<{
    id: string
    title: string
    status: 'passed' | 'rejected'
    updated_at: string | null
  }>

  ctx.processed = issues.length
  if (issues.length === 0) {
    return { status: 'ok', summary: 'No resolved issues.' }
  }

  const now = new Date()
  let postsWritten = 0
  let pointsAwarded = 0
  let participantsGraded = 0

  for (const issue of issues) {
    const correctAnswer: 'yes' | 'no' = issue.status === 'passed' ? 'yes' : 'no'
    const postId = `resolution-${issue.id}-${issue.status}`

    // ── Find predictions for this issue. ──────────────────────────────────
    const { data: predictions } = await ctx.admin
      .from('predictions')
      .select('user_id, prediction, created_at')
      .eq('issue_id', issue.id)

    const preds = (predictions ?? []) as Array<{
      user_id: string | null
      prediction: 'yes' | 'no'
    }>

    const correct = preds.filter(p => p.prediction === correctAnswer).length
    const total = preds.length
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

    // ── Award civic_score bumps to correct predictors. We do this idempotently
    //    by gating on the existence of the resolution post (created in the
    //    same run). If the post was already written previously, we still
    //    upsert it but only award points the first time we see this issue
    //    in a resolved state. We approximate "first time" by checking for
    //    a recent prior post with the same id. ─────────────────────────────
    const { data: existing } = await ctx.admin
      .from('feed_posts')
      .select('id')
      .eq('id', postId)
      .maybeSingle()

    const firstResolution = !existing

    if (firstResolution) {
      for (const p of preds) {
        if (!p.user_id || p.prediction !== correctAnswer) continue
        // Bump civic_score by 2 (small enough to not be runaway).
        // SQL: civic_score = coalesce(civic_score, 0) + 2
        const { data: prof } = await ctx.admin
          .from('user_profiles')
          .select('civic_score')
          .eq('user_id', p.user_id)
          .maybeSingle()
        const next = (prof?.civic_score ?? 0) + 2
        await ctx.admin
          .from('user_profiles')
          .update({ civic_score: next, updated_at: now.toISOString() })
          .eq('user_id', p.user_id)
        pointsAwarded += 2
        participantsGraded++
      }
    }

    // ── Post the results card. ────────────────────────────────────────────
    const headline = issue.status === 'passed' ? '✅ Passed' : '❌ Rejected'
    const content =
      `${headline}: ${issue.title}. ${correct}/${total} predictors got it right (${accuracy}% accuracy).`

    const { error } = await ctx.admin.from('feed_posts').upsert({
      id: postId,
      type: 'decision_update',
      author_id: 'system',
      author_name: 'Stickee',
      author_handle: '@stickee',
      author_verified: true,
      content,
      linked_decision_id: issue.id,
      linked_bill_id: issue.id,
      posted_at: issue.updated_at ?? now.toISOString(),
      is_boost: true,
      source_agent_id: 'prediction-resolver',
    }, { onConflict: 'id' })

    if (!error) postsWritten++
  }

  ctx.written = postsWritten + participantsGraded
  ctx.notes.push(`${pointsAwarded} pts awarded`, `${participantsGraded} graded`)

  return {
    status: 'ok',
    summary: `${issues.length} resolved issues · ${postsWritten} cards · ${participantsGraded} predictors graded`,
  }
}
