import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

// ─── Types ───────────────────────────────────────────────────────────────────

export type AgentTrigger = 'cron' | 'manual' | 'webhook'

export interface AgentContext {
  admin: SupabaseClient
  config: Record<string, unknown>
  /** Mutate this to record how many input items were considered. */
  processed: number
  /** Mutate this to record how many rows the agent wrote. */
  written: number
  /** Append short human-readable lines that will join into the run summary. */
  notes: string[]
}

export interface AgentResult {
  status?: 'ok' | 'warn' | 'error'
  summary?: string
}

export type AgentHandler = (ctx: AgentContext) => Promise<AgentResult | void>

// ─── Cron → next run estimator (simple) ──────────────────────────────────────

function estimateNextRun(cron: string | null): Date | null {
  if (!cron) return null
  // Best-effort: we just bump by an interval that matches common cron patterns.
  // (A real cron parser is overkill here — Supabase's pg_cron computes the
  // authoritative next_run when the schedule actually fires.)
  if (cron.startsWith('*/5'))  return new Date(Date.now() + 5  * 60_000)
  if (cron.startsWith('*/15')) return new Date(Date.now() + 15 * 60_000)
  if (cron.startsWith('*/30')) return new Date(Date.now() + 30 * 60_000)
  if (cron.startsWith('0 */2')) return new Date(Date.now() + 2  * 60 * 60_000)
  if (cron.startsWith('0 3'))  {
    const d = new Date()
    d.setUTCHours(3, 0, 0, 0)
    if (d.getTime() < Date.now()) d.setUTCDate(d.getUTCDate() + 1)
    return d
  }
  if (cron.includes('MON')) {
    const d = new Date()
    const offset = (8 - d.getUTCDay()) % 7 || 7
    d.setUTCDate(d.getUTCDate() + offset)
    d.setUTCHours(9, 0, 0, 0)
    return d
  }
  return new Date(Date.now() + 60 * 60_000) // default: ~1h
}

// ─── Core runner ─────────────────────────────────────────────────────────────

/**
 * Wraps an agent handler with run-tracking. Inserts a row into agent_runs,
 * executes the handler, updates the row + the agents catalogue, and returns
 * the final outcome. Errors are caught and recorded — they never throw out.
 */
export async function runWithTracking(
  agentId: string,
  handler: AgentHandler,
  opts: { trigger?: AgentTrigger } = {},
): Promise<{ runId: string; status: 'ok' | 'warn' | 'error'; summary: string }> {
  const admin = createAdminSupabaseClient()
  const trigger = opts.trigger ?? 'cron'

  // Read the agent row to pick up config + the enabled flag.
  const { data: agent } = await admin
    .from('agents')
    .select('id, enabled, schedule_cron, config')
    .eq('id', agentId)
    .maybeSingle()

  if (!agent) {
    return { runId: '', status: 'error', summary: `Agent ${agentId} not registered.` }
  }

  if (!agent.enabled && trigger === 'cron') {
    return { runId: '', status: 'ok', summary: 'Agent is paused — skipped.' }
  }

  // Open a run row.
  const startedAt = new Date().toISOString()
  const { data: runRow } = await admin
    .from('agent_runs')
    .insert({
      agent_id: agentId,
      started_at: startedAt,
      status: 'running',
      trigger,
    })
    .select('id')
    .single()

  const runId = runRow?.id as string

  const ctx: AgentContext = {
    admin,
    config: (agent.config as Record<string, unknown>) ?? {},
    processed: 0,
    written: 0,
    notes: [],
  }

  let status: 'ok' | 'warn' | 'error' = 'ok'
  let summary = ''
  let errorText: string | null = null

  try {
    const result = (await handler(ctx)) ?? {}
    status = result.status ?? 'ok'
    summary = result.summary ?? defaultSummary(ctx)
  } catch (err) {
    status = 'error'
    errorText = err instanceof Error ? err.message : String(err)
    summary = `Failed: ${errorText}`
  }

  const finishedAt = new Date().toISOString()
  const nextRunAt = estimateNextRun(agent.schedule_cron ?? null)

  // Update the run row.
  if (runId) {
    await admin
      .from('agent_runs')
      .update({
        finished_at: finishedAt,
        status,
        items_processed: ctx.processed,
        items_written: ctx.written,
        summary,
        error: errorText,
      })
      .eq('id', runId)
  }

  // Update the agents catalogue.
  await admin
    .from('agents')
    .update({
      last_run_at: finishedAt,
      last_status: status,
      last_summary: summary,
      last_items: ctx.written,
      next_run_at: nextRunAt?.toISOString() ?? null,
      updated_at: finishedAt,
    })
    .eq('id', agentId)

  return { runId: runId ?? '', status, summary }
}

function defaultSummary(ctx: AgentContext) {
  const head = `${ctx.processed} processed · ${ctx.written} written`
  if (ctx.notes.length === 0) return head
  return `${head} · ${ctx.notes.join(' · ')}`
}
