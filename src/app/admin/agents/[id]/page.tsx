import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ArrowLeft, CircleDot, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { requireAdminUserId } from '../../_lib/guard'
import { runAgent, type AgentSlug, AGENT_IDS } from '@/lib/agents/registry'

export const metadata: Metadata = {
  title: 'Agent detail — Stickee Admin',
}

async function runAgentDetailAction(formData: FormData) {
  'use server'
  await requireAdminUserId()
  const id = String(formData.get('id') ?? '') as AgentSlug
  if (!AGENT_IDS.includes(id)) return
  try {
    await runAgent(id, { trigger: 'manual' })
  } catch (err) {
    console.error('[admin/agents/:id] run failed', id, err)
  }
  revalidatePath(`/admin/agents/${id}`)
}

function relative(iso: string | null | undefined) {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  const s = Math.round((Date.now() - then) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.round(s / 60)}m ago`
  if (s < 86400) return `${Math.round(s / 3600)}h ago`
  return `${Math.round(s / 86400)}d ago`
}

function statusColor(s: string | null | undefined) {
  if (s === 'ok') return '#2ec266'
  if (s === 'warn') return '#f5a623'
  if (s === 'error') return '#f04747'
  return '#5a5a5e'
}

export default async function AgentDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!AGENT_IDS.includes(id as AgentSlug)) notFound()

  const admin = createAdminSupabaseClient()
  const [{ data: agent }, { data: runs }] = await Promise.all([
    admin
      .from('agents')
      .select('id, name, description, schedule_cron, enabled, last_run_at, last_status, last_summary, next_run_at, config')
      .eq('id', id)
      .maybeSingle(),
    admin
      .from('agent_runs')
      .select('id, started_at, finished_at, status, items_processed, items_written, summary, error, trigger')
      .eq('agent_id', id)
      .order('started_at', { ascending: false })
      .limit(50),
  ])

  if (!agent) notFound()

  const runRows = runs ?? []

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/agents"
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Agents
        </Link>
      </div>

      <section className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Agent · {agent.id}
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {agent.name}
          </h1>
          <form action={runAgentDetailAction}>
            <input type="hidden" name="id" value={agent.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md bg-foreground text-background px-4 h-10 text-xs uppercase tracking-widest hover:opacity-90"
            >
              Run now
            </button>
          </form>
        </div>
        <p className="text-sm text-muted-foreground">{agent.description}</p>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Tile label="State"      value={agent.enabled ? 'enabled' : 'paused'}
              accent={agent.enabled ? '#2ec266' : '#5a5a5e'} />
        <Tile label="Last status"  value={agent.last_status ?? '—'} accent={statusColor(agent.last_status ?? null)} />
        <Tile label="Last run"     value={relative(agent.last_run_at)} />
        <Tile label="Schedule"     value={agent.schedule_cron ?? 'manual'} mono />
      </section>

      <section className="rounded-md border border-border bg-card/30 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Run history</h2>
        </div>
        {runRows.length === 0 ? (
          <p className="px-5 py-8 text-xs text-muted-foreground">
            No runs recorded. Press <span className="text-foreground">Run now</span> to start one.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {runRows.map(r => {
              const durMs = r.finished_at
                ? new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()
                : null
              const Icon = r.status === 'ok' ? CheckCircle2 : r.status === 'error' ? AlertTriangle : CircleDot
              return (
                <div key={r.id} className="grid grid-cols-[140px_140px_1fr_auto_auto] gap-4 items-start px-5 py-3">
                  <span className="text-xs text-foreground">{new Date(r.started_at).toLocaleString('en-AU')}</span>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest whitespace-nowrap"
                    style={{ color: statusColor(r.status) }}
                  >
                    <Icon className="h-3 w-3" />
                    {r.status} · {r.trigger}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {r.summary ?? r.error ?? '—'}
                  </p>
                  <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                    {r.items_processed} read · {r.items_written} write
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                    {durMs !== null ? `${(durMs / 1000).toFixed(1)}s` : 'running…'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {agent.config && Object.keys(agent.config as Record<string, unknown>).length > 0 && (
        <section className="rounded-md border border-border bg-card/30 overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Config</h2>
          </div>
          <pre className="px-5 py-4 text-xs text-muted-foreground overflow-x-auto">
{JSON.stringify(agent.config, null, 2)}
          </pre>
        </section>
      )}
    </div>
  )
}

function Tile({ label, value, accent, mono }: { label: string; value: string; accent?: string; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card/40 p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={`mt-2 text-lg ${mono ? 'font-mono' : ''} text-foreground`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  )
}
