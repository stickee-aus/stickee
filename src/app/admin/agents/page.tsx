import type { Metadata } from 'next'
import { connection } from 'next/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDot,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
} from 'lucide-react'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { getAdminUser, requireAdminUserId } from '../_lib/guard'
import { runAgent, type AgentSlug } from '@/lib/agents/registry'

export const metadata: Metadata = {
  title: 'Agents — Stickee Admin',
  description: 'Background agents keeping the feed alive.',
}

// ─── Server actions ──────────────────────────────────────────────────────────

async function toggleAgentAction(formData: FormData) {
  'use server'
  await requireAdminUserId()
  const id = String(formData.get('id') ?? '')
  const enabled = String(formData.get('enabled') ?? '') === 'true'
  if (!id) return
  const admin = createAdminSupabaseClient()
  await admin.from('agents').update({ enabled, updated_at: new Date().toISOString() }).eq('id', id)
  revalidatePath('/admin/agents')
}

async function runAgentAction(formData: FormData) {
  'use server'
  await requireAdminUserId()
  const id = String(formData.get('id') ?? '') as AgentSlug
  if (!id) return
  try {
    await runAgent(id, { trigger: 'manual' })
  } catch (err) {
    console.error('[admin/agents] run failed', id, err)
  }
  revalidatePath('/admin/agents')
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relative(iso: string | null | undefined) {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  const now = Date.now()
  const s = Math.round((now - then) / 1000)
  if (s < 0) {
    const a = -s
    if (a < 60) return `in ${a}s`
    if (a < 3600) return `in ${Math.round(a / 60)}m`
    if (a < 86400) return `in ${Math.round(a / 3600)}h`
    return `in ${Math.round(a / 86400)}d`
  }
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return `${d}d ago`
}

function statusColor(s: string | null | undefined): string {
  if (s === 'ok') return '#2ec266'
  if (s === 'warn') return '#f5a623'
  if (s === 'error') return '#f04747'
  return '#5a5a5e'
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AgentsPage() {
  await connection()
  if (!(await getAdminUser()).isAdmin) return null

  // headers() ensures this isn't cached at build time
  await headers()
  const admin = createAdminSupabaseClient()

  const [{ data: agents }, { data: recentRuns }] = await Promise.all([
    admin
      .from('agents')
      .select('id, name, description, schedule_cron, enabled, last_run_at, last_status, last_summary, last_items, next_run_at')
      .order('id', { ascending: true }),
    admin
      .from('agent_runs')
      .select('id, agent_id, started_at, finished_at, status, items_processed, items_written, summary, trigger')
      .order('started_at', { ascending: false })
      .limit(20),
  ])

  const agentRows = agents ?? []
  const runs = recentRuns ?? []

  const totalEnabled = agentRows.filter(a => a.enabled).length
  const totalAgents = agentRows.length
  const lastErrorRuns = runs.filter(r => r.status === 'error').length

  // Items written across all agents in the last 24h, by agent
  const since24h = Date.now() - 24 * 60 * 60 * 1000
  const writes24h = new Map<string, number>()
  for (const r of runs) {
    if (new Date(r.started_at).getTime() < since24h) continue
    writes24h.set(r.agent_id, (writes24h.get(r.agent_id) ?? 0) + (r.items_written ?? 0))
  }
  const totalWrites24h = Array.from(writes24h.values()).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <section className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          System · Background agents
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Agents
          </h1>
          <div className="flex items-baseline gap-6">
            <Stat label="Enabled" value={`${totalEnabled}/${totalAgents}`} />
            <Stat label="Writes · 24h" value={String(totalWrites24h)} />
            <Stat
              label="Errors · 24h"
              value={String(lastErrorRuns)}
              accent={lastErrorRuns > 0 ? '#f04747' : undefined}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Agents poll external sources and your database on a schedule, then write into the feed, notifications,
          and moderation queues. Toggle one off to pause it; click <span className="text-foreground">Run now</span>{' '}
          to fire it manually.
        </p>
      </section>

      {/* ── Agent grid ─────────────────────────────────────────────── */}
      <section className="grid gap-3 md:grid-cols-2">
        {agentRows.map(a => (
          <div key={a.id} className="rounded-md border border-border bg-card/40 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <CircleDot className="h-3 w-3 shrink-0" style={{ color: a.enabled ? statusColor(a.last_status ?? null) : '#3a3a3e' }} />
                <h2 className="text-sm font-semibold text-foreground truncate">{a.name}</h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <form action={toggleAgentAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="enabled" value={String(!a.enabled)} />
                  <button
                    type="submit"
                    title={a.enabled ? 'Disable' : 'Enable'}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {a.enabled
                      ? <PauseCircle className="h-4 w-4" />
                      : <PlayCircle  className="h-4 w-4" />}
                  </button>
                </form>
                <form action={runAgentAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button
                    type="submit"
                    className="text-[10px] uppercase tracking-widest border border-border px-2 py-1 text-foreground hover:bg-foreground hover:text-background transition-colors"
                  >
                    Run now
                  </button>
                </form>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {a.description}
            </p>

            <dl className="mt-4 grid grid-cols-3 gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              <KV label="Last run" value={relative(a.last_run_at)} />
              <KV label="Status" value={a.last_status ?? '—'} accent={statusColor(a.last_status ?? null)} />
              <KV label="Writes · 24h" value={String(writes24h.get(a.id) ?? 0)} />
              <KV label="Schedule" value={a.schedule_cron ?? 'manual'} mono />
              <KV label="Next" value={relative(a.next_run_at)} />
              <KV label="State" value={a.enabled ? 'enabled' : 'paused'} accent={a.enabled ? '#2ec266' : '#5a5a5e'} />
            </dl>

            {a.last_summary && (
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                {a.last_summary}
              </p>
            )}

            <div className="mt-3 flex justify-end">
              <Link
                href={`/admin/agents/${a.id}`}
                className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                History <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}

        {agentRows.length === 0 && (
          <div className="md:col-span-2 rounded-md border border-border bg-card/30 p-12 text-center">
            <Bot className="h-6 w-6 text-muted-foreground mx-auto" />
            <p className="mt-3 text-sm text-foreground">No agents registered yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Run migration <code className="text-foreground">013_agents_and_feed_posts.sql</code> to seed the defaults.
            </p>
          </div>
        )}
      </section>

      {/* ── Recent runs ────────────────────────────────────────────── */}
      <section className="rounded-md border border-border bg-card/30 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Recent runs</h2>
            <span className="text-[10px] text-muted-foreground">· {runs.length} most recent</span>
          </div>
        </div>
        {runs.length === 0 ? (
          <p className="px-5 py-8 text-xs text-muted-foreground">
            No agent runs recorded yet. Press <span className="text-foreground">Run now</span> on any agent above
            to kick one off.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {runs.map(r => {
              const durMs = r.finished_at
                ? new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()
                : null
              const Icon = r.status === 'ok'
                ? CheckCircle2
                : r.status === 'error'
                  ? AlertTriangle
                  : CircleDot
              return (
                <div key={r.id} className="grid grid-cols-[160px_1fr_auto_auto_auto] gap-4 items-center px-5 py-3">
                  <Link href={`/admin/agents/${r.agent_id}`} className="text-xs text-foreground truncate hover:underline">
                    {r.agent_id}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">{r.summary ?? '—'}</p>
                  <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                    {r.items_written} writes
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                    {durMs !== null ? `${(durMs / 1000).toFixed(1)}s` : 'running…'}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest whitespace-nowrap"
                    style={{ color: statusColor(r.status) }}
                  >
                    <Icon className="h-3 w-3" />
                    {r.status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="text-right">
      <p className="font-mono text-xl font-normal mb-1" style={{ color: accent ?? '#e8e8e6' }}>{value}</p>
      <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>{label}</p>
    </div>
  )
}

function KV({ label, value, accent, mono }: { label: string; value: string; accent?: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[9px] tracking-widest uppercase text-muted-foreground">{label}</dt>
      <dd
        className={`mt-1 text-xs ${mono ? 'font-mono' : ''} text-foreground truncate`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </dd>
    </div>
  )
}
