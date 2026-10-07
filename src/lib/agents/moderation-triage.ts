import type { AgentHandler } from './runner'

/**
 * Moderation Triage
 * ───────────────────────────────────────────────────────────
 * Classifies new content_reports using a transparent rule-based heuristic
 * (no LLM call in the MVP — keeps the agent fast and predictable). Outputs:
 *   - auto-resolves obvious spam (the report itself, not the underlying post)
 *   - moves the rest to 'reviewing' with a suggested action label written
 *     into moderation_actions (admin can override on /admin).
 *
 * Categories:
 *   spam       → keywords like "buy followers", "crypto", "free", repeated emoji
 *   harassment → keywords like "kill", "die", explicit slurs (very small list)
 *   policy     → political topic markers, "fake news", flagged user dispute
 *   real_flag  → none of the above; needs human eyes
 */
export const moderationTriage: AgentHandler = async (ctx) => {
  const autoResolveSpam = ctx.config.autoResolveSpam !== false

  // Pull open reports.
  const { data: reports } = await ctx.admin
    .from('content_reports')
    .select('id, reporter_id, target_type, target_id, reason, notes, status, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: true })
    .limit(50)

  const rows = (reports ?? []) as Array<{
    id: string
    target_type: string
    target_id: string
    reason: string | null
    notes: string | null
    status: string
  }>

  ctx.processed = rows.length
  if (rows.length === 0) {
    return { status: 'ok', summary: 'No open reports.' }
  }

  let resolved = 0
  let escalated = 0
  let triaged = 0

  for (const r of rows) {
    const blob = `${r.reason ?? ''} ${r.notes ?? ''}`.toLowerCase()
    const category = classify(blob)

    let nextStatus: 'resolved' | 'reviewing' | 'open' = 'reviewing'
    let actionLabel = `triage:${category}`
    let actionNotes = `Auto-triaged as ${category} by moderation-triage.`

    if (category === 'spam' && autoResolveSpam) {
      nextStatus = 'resolved'
      actionLabel = 'auto-dismiss-spam'
      actionNotes = 'Auto-dismissed: report matched spam heuristics.'
      resolved++
    } else if (category === 'harassment') {
      actionLabel = 'escalate-harassment'
      actionNotes = 'Escalated: harassment indicators present. Admin should review urgently.'
      escalated++
    } else {
      triaged++
    }

    // Update the report.
    await ctx.admin
      .from('content_reports')
      .update({
        status: nextStatus,
        resolved_at: nextStatus === 'resolved' ? new Date().toISOString() : null,
      })
      .eq('id', r.id)

    // Record the action. admin_id is null since this is the system agent —
    // moderation_actions has a nullable admin_id reference.
    await ctx.admin.from('moderation_actions').insert({
      admin_id: null,
      target_type: r.target_type,
      target_id: r.target_id,
      action: actionLabel,
      notes: actionNotes,
    })
  }

  ctx.written = rows.length
  ctx.notes.push(`${resolved} auto-resolved`, `${escalated} escalated`, `${triaged} flagged for review`)

  return {
    status: escalated > 0 ? 'warn' : 'ok',
    summary: `${rows.length} reports triaged · ${resolved} spam · ${escalated} harassment · ${triaged} needs review`,
  }
}

function classify(blob: string): 'spam' | 'harassment' | 'policy' | 'real_flag' {
  // Spam markers
  if (
    /\b(buy followers|crypto giveaway|free \$|click here|onlyfans|seo backlink|win an? iphone)\b/.test(blob) ||
    /(.)\1{6,}/.test(blob) ||                       // 7+ repeated char (e.g. "aaaaaaa")
    /(http[s]?:\/\/[^\s]+){3,}/.test(blob)          // 3+ URLs
  ) return 'spam'

  // Harassment markers (intentionally a tiny, well-known list — broad NSFW
  // and slur detection belongs in a model, not a regex).
  if (/\b(kill yourself|kys|go die|die in a fire)\b/.test(blob)) return 'harassment'

  // Policy / political dispute markers
  if (/\b(fake news|propaganda|lying|partisan|biased)\b/.test(blob)) return 'policy'

  return 'real_flag'
}
