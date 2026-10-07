import type { AgentHandler } from './runner'

/**
 * Bill Stage Tracker
 * ───────────────────────────────────────────────────────────
 * Watches `issues` (which Stickee uses as the bill record) for status
 * transitions, and for each transition:
 *   - upserts a `decision_update` post into feed_posts
 *   - inserts personalised notifications for every user who pressured the
 *     bill via bill_pressures.
 *
 * To detect *transitions* without an explicit history table, we hash the
 * current (status, updated_at) into the post id and only post once per state.
 */
export const billStageTracker: AgentHandler = async (ctx) => {
  const lookbackDays = Number(ctx.config.lookbackDays ?? 3)
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - lookbackDays)

  const { data: issues, error } = await ctx.admin
    .from('issues')
    .select('id, title, summary, status, source_url, updated_at, mp_yes_count, mp_no_count')
    .gte('updated_at', since.toISOString())
    .order('updated_at', { ascending: false })

  if (error) throw new Error(`issues read: ${error.message}`)

  const list = issues ?? []
  ctx.processed = list.length

  let postsWritten = 0
  let notifsWritten = 0

  for (const issue of list) {
    const stamp = (issue.updated_at ?? '').slice(0, 10) // day granularity
    const postId = `decision-${issue.id}-${issue.status}-${stamp}`

    const STATUS_LABEL: Record<string, string> = {
      active:    '🟡 Under debate',
      passed:    '✅ Passed parliament',
      rejected:  '❌ Rejected by parliament',
    }
    const headline = STATUS_LABEL[issue.status] ?? `Update: ${issue.status}`

    const body =
      `${headline}: ${issue.title}. ` +
      `MPs ${issue.mp_yes_count ?? 0} for / ${issue.mp_no_count ?? 0} against. ` +
      (issue.summary?.slice(0, 200) ?? '')

    const { error: postErr } = await ctx.admin
      .from('feed_posts')
      .upsert({
        id: postId,
        type: 'decision_update',
        author_id: 'system',
        author_name: 'Stickee',
        author_handle: '@stickee',
        author_verified: true,
        content: body,
        linked_bill_id: issue.id,
        linked_decision_id: issue.id,
        posted_at: issue.updated_at ?? new Date().toISOString(),
        is_boost: issue.status !== 'active',
        source_agent_id: 'bill-stage-tracker',
      }, { onConflict: 'id' })

    if (!postErr) postsWritten++

    // ── Notify users who pressured this bill ────────────────────────────────

    const { data: pressures } = await ctx.admin
      .from('bill_pressures')
      .select('user_id, stance')
      .eq('bill_id', issue.id)
      .not('user_id', 'is', null)

    const pressureRows = (pressures ?? []) as Array<{ user_id: string; stance: 'support' | 'oppose' }>
    if (pressureRows.length === 0) continue

    // Build one notification per user. Dedupe by user_id (keep first stance).
    const seen = new Set<string>()
    const notifs = pressureRows
      .filter(p => {
        if (seen.has(p.user_id)) return false
        seen.add(p.user_id)
        return true
      })
      .map(p => {
        const winning =
          (issue.status === 'passed' && p.stance === 'support') ||
          (issue.status === 'rejected' && p.stance === 'oppose')
        const losing =
          (issue.status === 'passed' && p.stance === 'oppose') ||
          (issue.status === 'rejected' && p.stance === 'support')
        const verdict =
          winning ? '🎯 Your side won' :
          losing  ? '⚠ Your side lost' :
                    '📣 New update on a bill you backed'
        return {
          user_id: p.user_id,
          type: 'bill_update',
          title: `${verdict}: ${issue.title.slice(0, 80)}`,
          body: headline,
          href: `/issue/${issue.id}`,
          read: false,
        }
      })

    if (notifs.length > 0) {
      const { error: notErr, count } = await ctx.admin
        .from('notifications')
        .insert(notifs, { count: 'exact' })
      if (!notErr) notifsWritten += count ?? notifs.length
    }
  }

  ctx.written = postsWritten
  ctx.notes.push(`${notifsWritten} notifications`)

  return {
    status: 'ok',
    summary: `${list.length} bills checked · ${postsWritten} posts · ${notifsWritten} notifications`,
  }
}
