import type { AgentHandler } from './runner'

/**
 * Parliament Watcher
 * ───────────────────────────────────────────────────────────
 * Reads divisions that were synced into the database in the last N days,
 * and for each division emits a civic_alert post (if one doesn't already
 * exist). Also flags MPs whose vote diverged from their party's majority.
 *
 * Idempotent: the post id is derived from the division's tvfy_id, so the
 * upsert won't create duplicates.
 */
export const parliamentWatcher: AgentHandler = async (ctx) => {
  const lookbackDays = Number(ctx.config.lookbackDays ?? 1)
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - lookbackDays)

  const { data: divisions, error } = await ctx.admin
    .from('divisions')
    .select('tvfy_id, name, date, house, passed, aye_count, no_count, source_url, summary')
    .gte('date', since.toISOString().slice(0, 10))
    .order('date', { ascending: false })

  if (error) throw new Error(`divisions read: ${error.message}`)

  const list = divisions ?? []
  ctx.processed = list.length
  if (list.length === 0) {
    return { status: 'ok', summary: `No new divisions in last ${lookbackDays}d.` }
  }

  // ── Build posts. One per division. ────────────────────────────────────────

  const now = new Date().toISOString()
  const posts = list.map(d => {
    const postId = `alert-division-${d.tvfy_id}`
    const total = (d.aye_count ?? 0) + (d.no_count ?? 0)
    const margin = total > 0 ? Math.round(((d.aye_count ?? 0) / total) * 100) : 50
    const result = d.passed ? 'PASSED' : 'BLOCKED'
    return {
      id: postId,
      type: 'civic_alert',
      author_id: 'system',
      author_name: 'Stickee',
      author_handle: '@stickee',
      author_verified: true,
      content:
        `🗳 ${result}: ${d.name}. ${d.aye_count} ayes vs ${d.no_count} noes (${margin}% in favour) in the ${d.house}.` +
        (d.summary ? ` — ${d.summary.slice(0, 200)}` : ''),
      linked_decision_id: String(d.tvfy_id),
      posted_at: new Date(`${d.date}T00:00:00Z`).toISOString(),
      hearts: 0, fires: 0, flags: 0,
      comment_count: 0, share_count: 0,
      is_boost: true,
      source_agent_id: 'parliament-watcher',
      created_at: now,
    }
  })

  const { error: writeErr, count } = await ctx.admin
    .from('feed_posts')
    .upsert(posts, { onConflict: 'id', count: 'exact', ignoreDuplicates: false })

  if (writeErr) throw new Error(`feed_posts write: ${writeErr.message}`)
  ctx.written = count ?? posts.length

  // ── Rebellion detection: per-division, count members whose vote diverged
  //    from their party's majority. We post a short note when a rebellion
  //    is non-trivial (>= 2 dissenters). ───────────────────────────────────

  let rebellionPostsWritten = 0
  for (const d of list) {
    const { data: votes } = await ctx.admin
      .from('member_votes')
      .select('vote, members!inner(name, party, electorate)')
      .eq('division_tvfy_id', d.tvfy_id)

    if (!votes || votes.length === 0) continue

    // Group by party, then find dissenters.
    // Supabase typings model joined relations as arrays; we know it's a single
    // member per vote row so we normalise via `unknown` and a helper type.
    type JoinedVote = {
      vote: string
      members: { name: string; party: string | null; electorate: string | null } | null
        | Array<{ name: string; party: string | null; electorate: string | null }>
    }
    const normalisedVotes: Array<{
      vote: string
      member: { name: string; party: string | null; electorate: string | null } | null
    }> = (votes as unknown as JoinedVote[]).map(v => ({
      vote: v.vote,
      member: Array.isArray(v.members) ? (v.members[0] ?? null) : (v.members ?? null),
    }))

    const partyMajority = new Map<string, { aye: number; no: number }>()
    for (const v of normalisedVotes) {
      const party = v.member?.party ?? 'Independent'
      const m = partyMajority.get(party) ?? { aye: 0, no: 0 }
      if (v.vote === 'aye') m.aye++
      else if (v.vote === 'no') m.no++
      partyMajority.set(party, m)
    }

    const dissenters: Array<{ name: string; party: string; electorate: string }> = []
    for (const v of normalisedVotes) {
      if (!v.member) continue
      const party = v.member.party ?? 'Independent'
      const m = partyMajority.get(party)
      if (!m) continue
      const majority = m.aye >= m.no ? 'aye' : 'no'
      if (v.vote !== majority && (m.aye + m.no) >= 3) {
        dissenters.push({
          name: v.member.name,
          party,
          electorate: v.member.electorate ?? '',
        })
      }
    }

    if (dissenters.length >= 2) {
      const names = dissenters.slice(0, 4).map(x => `${x.name} (${x.party})`).join(', ')
      const more = dissenters.length > 4 ? `, +${dissenters.length - 4} more` : ''
      const { error: rErr } = await ctx.admin
        .from('feed_posts')
        .upsert({
          id: `alert-rebellion-${d.tvfy_id}`,
          type: 'civic_alert',
          author_id: 'system',
          author_name: 'Stickee',
          author_handle: '@stickee',
          author_verified: true,
          content: `⚡ Cross-party vote on "${d.name}": ${dissenters.length} MPs voted against their party — ${names}${more}.`,
          linked_decision_id: String(d.tvfy_id),
          posted_at: new Date(`${d.date}T00:00:00Z`).toISOString(),
          is_boost: true,
          source_agent_id: 'parliament-watcher',
          created_at: now,
        }, { onConflict: 'id' })
      if (!rErr) rebellionPostsWritten++
    }
  }

  ctx.written += rebellionPostsWritten
  ctx.notes.push(`${rebellionPostsWritten} rebellion alerts`)

  return {
    status: 'ok',
    summary: `${list.length} divisions scanned · ${posts.length} alerts · ${rebellionPostsWritten} rebellions`,
  }
}
