import type { AgentHandler } from './runner'

/**
 * Electorate Pulse
 * ───────────────────────────────────────────────────────────
 * Once a week, summarises each electorate's civic activity (posts,
 * pressures, predictions, comments) and emits one digest post per
 * electorate with a heat number and the top pillar that drew engagement.
 */
export const electoratePulse: AgentHandler = async (ctx) => {
  const minActivity = Number(ctx.config.minActivity ?? 3)

  const sinceISO = new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString()

  // Pull engagement events with electorate tags.
  const [{ data: pressures }, { data: profiles }] = await Promise.all([
    ctx.admin
      .from('bill_pressures')
      .select('electorate, bill_id, created_at, stance')
      .gte('created_at', sinceISO)
      .not('electorate', 'is', null),
    ctx.admin
      .from('user_profiles')
      .select('user_id, electorate'),
  ])

  // Map user → electorate so we can attribute predictions/comments too.
  const userElectorate = new Map<string, string>()
  for (const p of (profiles ?? []) as Array<{ user_id: string; electorate: string | null }>) {
    if (p.electorate) userElectorate.set(p.user_id, p.electorate)
  }

  const [{ data: predictions }, { data: comments }] = await Promise.all([
    ctx.admin
      .from('predictions')
      .select('user_id, issue_id, created_at')
      .gte('created_at', sinceISO),
    ctx.admin
      .from('comments')
      .select('user_id, post_id, created_at')
      .gte('created_at', sinceISO),
  ])

  // Aggregate per-electorate counts.
  type Bucket = { pressures: number; predictions: number; comments: number; topBill: Map<string, number> }
  const buckets = new Map<string, Bucket>()
  const ensure = (e: string) => {
    let b = buckets.get(e)
    if (!b) { b = { pressures: 0, predictions: 0, comments: 0, topBill: new Map() }; buckets.set(e, b) }
    return b
  }

  for (const p of (pressures ?? []) as Array<{ electorate: string | null; bill_id: string }>) {
    if (!p.electorate) continue
    const b = ensure(p.electorate)
    b.pressures++
    b.topBill.set(p.bill_id, (b.topBill.get(p.bill_id) ?? 0) + 1)
  }
  for (const r of (predictions ?? []) as Array<{ user_id: string | null }>) {
    const e = r.user_id ? userElectorate.get(r.user_id) : undefined
    if (e) ensure(e).predictions++
  }
  for (const r of (comments ?? []) as Array<{ user_id: string | null }>) {
    const e = r.user_id ? userElectorate.get(r.user_id) : undefined
    if (e) ensure(e).comments++
  }

  ctx.processed = buckets.size

  const now = new Date()
  const isoDay = now.toISOString().slice(0, 10)
  let written = 0

  for (const [electorate, b] of buckets) {
    const total = b.pressures + b.predictions + b.comments
    if (total < minActivity) continue

    const topBill = Array.from(b.topBill.entries()).sort((x, y) => y[1] - x[1])[0]
    const topBillNote = topBill ? ` Top bill: ${topBill[0]} (${topBill[1]} pressure actions).` : ''

    const postId = `pulse-${electorate.toLowerCase().replace(/\s+/g, '-')}-${isoDay}`
    const { error } = await ctx.admin.from('feed_posts').upsert({
      id: postId,
      type: 'civic_alert',
      author_id: 'system',
      author_name: `${electorate} pulse`,
      author_handle: '@stickee',
      author_verified: true,
      content:
        `📍 ${electorate} this week: ${b.pressures} bill pressures · ${b.predictions} predictions · ${b.comments} comments.` +
        topBillNote,
      linked_electorate: electorate,
      posted_at: now.toISOString(),
      is_boost: false,
      source_agent_id: 'electorate-pulse',
    }, { onConflict: 'id' })
    if (!error) written++
  }

  ctx.written = written
  return {
    status: 'ok',
    summary: `${buckets.size} electorates with activity · ${written} digests written (min activity ${minActivity})`,
  }
}
