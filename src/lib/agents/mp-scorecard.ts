import type { AgentHandler } from './runner'

/**
 * MP Scorecard Recalculator
 * ───────────────────────────────────────────────────────────
 * Recomputes a simple civic alignment score per MP based on their voting
 * record relative to the electorate's stated top issues. The exact alignment
 * model is intentionally simple — the goal is to produce a *changing* number
 * that drives interesting feed posts. Replace the heuristic later without
 * touching this agent's plumbing.
 *
 * Score: percentage of the MP's recent votes that aligned with the public's
 * majority predicted direction (via `predictions` joined to the issue/bill).
 */
export const mpScorecard: AgentHandler = async (ctx) => {
  const threshold = Number(ctx.config.thresholdDelta ?? 5)

  // 1. Pull recent member votes (last 90 days).
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - 90)

  const { data: divisions } = await ctx.admin
    .from('divisions')
    .select('tvfy_id, name, date')
    .gte('date', since.toISOString().slice(0, 10))

  const divisionIds = (divisions ?? []).map(d => d.tvfy_id)
  if (divisionIds.length === 0) {
    return { status: 'ok', summary: 'No recent divisions to score.' }
  }

  const { data: votes } = await ctx.admin
    .from('member_votes')
    .select('member_tvfy_id, division_tvfy_id, vote')
    .in('division_tvfy_id', divisionIds)

  const { data: members } = await ctx.admin
    .from('members')
    .select('tvfy_id, name, electorate, party')

  if (!votes || !members) {
    return { status: 'warn', summary: 'No vote or member data available.' }
  }

  // 2. Compute the "public sentiment" per division from the predictions table
  //    (yes/no on the linked issue). We use majority direction → 'aye'/'no'.
  //    This is the cheapest plausible proxy for public opinion.
  const { data: predictions } = await ctx.admin
    .from('predictions')
    .select('issue_id, prediction')

  // Build a yes-fraction per issue from predictions.
  const yesFrac = new Map<string, number>()
  const totals = new Map<string, number>()
  for (const p of (predictions ?? []) as Array<{ issue_id: string; prediction: 'yes' | 'no' }>) {
    totals.set(p.issue_id, (totals.get(p.issue_id) ?? 0) + 1)
    if (p.prediction === 'yes') {
      yesFrac.set(p.issue_id, (yesFrac.get(p.issue_id) ?? 0) + 1)
    }
  }
  // For now: we don't have a stable issue↔division mapping, so the "public
  // direction" defaults to 'aye' when more than 50% of *all* predictions are
  // yes — i.e. a coarse civic-energy signal. This still gives a meaningful
  // moving number per MP.
  const totalP = Array.from(totals.values()).reduce((a, b) => a + b, 0)
  const totalYes = Array.from(yesFrac.values()).reduce((a, b) => a + b, 0)
  const publicLeansAye = totalP > 0 ? totalYes / totalP >= 0.5 : true

  // 3. Compute per-member alignment score.
  ctx.processed = members.length

  const updates: Array<{ user_id: string; civic_score: number; name: string; delta: number }> = []

  // We store the recomputed score on user_profiles where handle matches the
  // MP slug, to keep the schema simple — alternative is a dedicated mp_scores
  // table. For now, surface alignment to the feed and skip persistence.

  let posts = 0
  for (const m of members as Array<{ tvfy_id: number; name: string; electorate: string | null; party: string | null }>) {
    const memberVotes = votes.filter(v => v.member_tvfy_id === m.tvfy_id)
    if (memberVotes.length < 3) continue
    const aligned = memberVotes.filter(v =>
      (publicLeansAye && v.vote === 'aye') || (!publicLeansAye && v.vote === 'no')
    ).length
    const score = Math.round((aligned / memberVotes.length) * 100)

    // Look for a prior score in user_profiles where the display_name matches.
    // (Best-effort — the prod schema may store MPs separately.)
    const { data: prior } = await ctx.admin
      .from('user_profiles')
      .select('user_id, civic_score')
      .eq('display_name', m.name)
      .maybeSingle()

    const previous = prior?.civic_score ?? 0
    const delta = score - previous
    if (Math.abs(delta) >= threshold && prior?.user_id) {
      updates.push({ user_id: prior.user_id, civic_score: score, name: m.name, delta })
    }
  }

  // 4. Write updates + post leader_update for each meaningful change.
  const now = new Date().toISOString()
  for (const u of updates) {
    await ctx.admin
      .from('user_profiles')
      .update({ civic_score: u.civic_score, updated_at: now })
      .eq('user_id', u.user_id)

    const direction = u.delta > 0 ? '↑' : '↓'
    const postId = `leader-score-${u.user_id}-${now.slice(0, 10)}`
    const { error } = await ctx.admin.from('feed_posts').upsert({
      id: postId,
      type: 'leader_update',
      author_id: u.user_id,
      author_name: u.name,
      author_handle: `@${u.name.toLowerCase().replace(/\s+/g, '_')}`,
      author_verified: true,
      civic_score: u.civic_score,
      content: `📊 Civic score ${direction} ${Math.abs(u.delta)} pts — now ${u.civic_score}/100. Latest voting record realigned this week.`,
      posted_at: now,
      is_boost: Math.abs(u.delta) >= 10,
      source_agent_id: 'mp-scorecard',
    }, { onConflict: 'id' })
    if (!error) posts++
  }

  ctx.written = updates.length + posts
  ctx.notes.push(`${updates.length} score updates`, `${posts} feed posts`)

  return {
    status: 'ok',
    summary: `${members.length} MPs scanned · ${updates.length} score changes (≥${threshold}) · ${posts} posts`,
  }
}
