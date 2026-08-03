import type { Metadata } from 'next'
import {
  Activity,
  UserPlus,
  TrendingUp,
  MessageSquare,
  Heart,
  Megaphone,
  DollarSign,
  Shield,
  Flag,
} from 'lucide-react'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export const metadata: Metadata = { title: 'Activity — Admin' }

const PAGE_SIZE = 60

type SearchParams = Promise<{ type?: string; limit?: string }>

type EventKind =
  | 'signup'
  | 'onboarded'
  | 'prediction'
  | 'comment'
  | 'reaction'
  | 'bill_pressure'
  | 'donation'
  | 'report'
  | 'moderation'

type ActivityEvent = {
  id: string
  kind: EventKind
  createdAt: string
  actor?: string | null
  summary: string
  details?: string | null
}

const FILTERS: { value: 'all' | EventKind; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'signup', label: 'Signups' },
  { value: 'onboarded', label: 'Onboarded' },
  { value: 'prediction', label: 'Predictions' },
  { value: 'comment', label: 'Comments' },
  { value: 'reaction', label: 'Reactions' },
  { value: 'bill_pressure', label: 'Bill pressure' },
  { value: 'donation', label: 'Donations' },
  { value: 'report', label: 'Reports' },
  { value: 'moderation', label: 'Moderation' },
]

const KIND_META: Record<
  EventKind,
  { Icon: typeof Activity; label: string; tone: 'default' | 'info' | 'warn' | 'good' | 'danger' }
> = {
  signup: { Icon: UserPlus, label: 'Signup', tone: 'good' },
  onboarded: { Icon: UserPlus, label: 'Onboarded', tone: 'good' },
  prediction: { Icon: TrendingUp, label: 'Prediction', tone: 'info' },
  comment: { Icon: MessageSquare, label: 'Comment', tone: 'default' },
  reaction: { Icon: Heart, label: 'Reaction', tone: 'default' },
  bill_pressure: { Icon: Megaphone, label: 'Bill pressure', tone: 'info' },
  donation: { Icon: DollarSign, label: 'Donation', tone: 'good' },
  report: { Icon: Flag, label: 'Report', tone: 'warn' },
  moderation: { Icon: Shield, label: 'Moderation', tone: 'danger' },
}

function toneStyle(tone: 'default' | 'info' | 'warn' | 'good' | 'danger') {
  switch (tone) {
    case 'good':
      return { background: '#0a1e10', color: '#2ec266', border: '1px solid #143a1d' }
    case 'info':
      return { background: '#0a141e', color: '#5b9bd5', border: '1px solid #14253a' }
    case 'warn':
      return { background: '#1e1a0a', color: '#e0a800', border: '1px solid #3a2f14' }
    case 'danger':
      return { background: '#1e0a0a', color: '#f04747', border: '1px solid #3a1414' }
    default:
      return undefined
  }
}

function formatRelative(iso: string) {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diffSec = Math.round((now - then) / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d ago`
  return new Date(iso).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })
}

function shortId(id: string) {
  if (!id) return ''
  if (id.length <= 12) return id
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

function formatAud(cents: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100)
}

export default async function AdminActivityPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const requestedType = (params.type ?? 'all').toLowerCase()
  const filter: 'all' | EventKind = (FILTERS.find(f => f.value === requestedType)?.value as 'all' | EventKind) ?? 'all'
  const limit = Math.min(500, Math.max(20, parseInt(params.limit ?? String(PAGE_SIZE), 10) || PAGE_SIZE))

  const admin = createAdminSupabaseClient()

  // Fetch all source streams in parallel — pull a per-stream window so the
  // unified feed has fresh data even if one stream is heavy.
  const PER_STREAM = Math.max(20, Math.ceil(limit / 2))

  const [
    profilesR,
    onboardedR,
    predictionsR,
    commentsR,
    reactionsR,
    billPressuresR,
    donationsR,
    reportsR,
    moderationR,
  ] = await Promise.all([
    admin
      .from('user_profiles')
      .select('user_id, handle, display_name, created_at')
      .order('created_at', { ascending: false })
      .limit(PER_STREAM),
    admin
      .from('user_profiles')
      .select('user_id, handle, display_name, onboarding_completed_at')
      .not('onboarding_completed_at', 'is', null)
      .order('onboarding_completed_at', { ascending: false })
      .limit(PER_STREAM),
    admin
      .from('predictions')
      .select('id, user_id, session_id, issue_id, prediction, created_at')
      .order('created_at', { ascending: false })
      .limit(PER_STREAM),
    admin
      .from('comments')
      .select('id, user_id, post_id, author_handle, author_name, body, created_at')
      .order('created_at', { ascending: false })
      .limit(PER_STREAM),
    admin
      .from('feed_reactions')
      .select('id, user_id, post_id, reaction, created_at')
      .order('created_at', { ascending: false })
      .limit(PER_STREAM),
    admin
      .from('bill_pressures')
      .select('id, user_id, session_id, bill_id, stance, action_type, created_at')
      .order('created_at', { ascending: false })
      .limit(PER_STREAM),
    admin
      .from('donation_records')
      .select('id, user_id, amount_cents, currency, cadence, status, created_at')
      .order('created_at', { ascending: false })
      .limit(PER_STREAM),
    admin
      .from('content_reports')
      .select('id, reporter_id, target_type, target_id, reason, status, created_at')
      .order('created_at', { ascending: false })
      .limit(PER_STREAM),
    admin
      .from('moderation_actions')
      .select('id, admin_id, target_type, target_id, action, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(PER_STREAM),
  ])

  const events: ActivityEvent[] = []

  for (const row of (profilesR.data ?? []) as Array<{
    user_id: string
    handle: string | null
    display_name: string | null
    created_at: string
  }>) {
    events.push({
      id: `signup:${row.user_id}`,
      kind: 'signup',
      createdAt: row.created_at,
      actor: row.display_name ?? row.handle ?? row.user_id,
      summary: `New signup`,
      details: row.handle ? `@${row.handle}` : `user ${shortId(row.user_id)}`,
    })
  }

  for (const row of (onboardedR.data ?? []) as Array<{
    user_id: string
    handle: string | null
    display_name: string | null
    onboarding_completed_at: string
  }>) {
    events.push({
      id: `onboarded:${row.user_id}`,
      kind: 'onboarded',
      createdAt: row.onboarding_completed_at,
      actor: row.display_name ?? row.handle ?? row.user_id,
      summary: 'Completed onboarding',
      details: row.handle ? `@${row.handle}` : `user ${shortId(row.user_id)}`,
    })
  }

  for (const row of (predictionsR.data ?? []) as Array<{
    id: string
    user_id: string | null
    session_id: string | null
    issue_id: string
    prediction: string
    created_at: string
  }>) {
    events.push({
      id: `prediction:${row.id}`,
      kind: 'prediction',
      createdAt: row.created_at,
      actor: row.user_id ? shortId(row.user_id) : `anon ${row.session_id ? shortId(row.session_id) : ''}`,
      summary: `Predicted ${row.prediction.toUpperCase()}`,
      details: `issue ${row.issue_id}`,
    })
  }

  for (const row of (commentsR.data ?? []) as Array<{
    id: string
    user_id: string | null
    post_id: string
    author_handle: string | null
    author_name: string | null
    body: string
    created_at: string
  }>) {
    events.push({
      id: `comment:${row.id}`,
      kind: 'comment',
      createdAt: row.created_at,
      actor: row.author_handle ? `@${row.author_handle}` : row.author_name ?? (row.user_id ? shortId(row.user_id) : 'anon'),
      summary: `Comment on ${row.post_id}`,
      details: row.body.length > 140 ? `${row.body.slice(0, 137)}…` : row.body,
    })
  }

  for (const row of (reactionsR.data ?? []) as Array<{
    id: string
    user_id: string
    post_id: string
    reaction: string
    created_at: string
  }>) {
    events.push({
      id: `reaction:${row.id}`,
      kind: 'reaction',
      createdAt: row.created_at,
      actor: shortId(row.user_id),
      summary: `Reacted ${row.reaction}`,
      details: `post ${row.post_id}`,
    })
  }

  for (const row of (billPressuresR.data ?? []) as Array<{
    id: string
    user_id: string | null
    session_id: string | null
    bill_id: string
    stance: string
    action_type: string
    created_at: string
  }>) {
    events.push({
      id: `bill_pressure:${row.id}`,
      kind: 'bill_pressure',
      createdAt: row.created_at,
      actor: row.user_id ? shortId(row.user_id) : `anon ${row.session_id ? shortId(row.session_id) : ''}`,
      summary: `${row.stance.toUpperCase()} via ${row.action_type}`,
      details: `bill ${row.bill_id}`,
    })
  }

  for (const row of (donationsR.data ?? []) as Array<{
    id: string
    user_id: string | null
    amount_cents: number | null
    currency: string
    cadence: string
    status: string
    created_at: string
  }>) {
    events.push({
      id: `donation:${row.id}`,
      kind: 'donation',
      createdAt: row.created_at,
      actor: row.user_id ? shortId(row.user_id) : 'anon',
      summary: `${formatAud(row.amount_cents ?? 0)} ${row.cadence} · ${row.status}`,
      details: row.id,
    })
  }

  for (const row of (reportsR.data ?? []) as Array<{
    id: string
    reporter_id: string | null
    target_type: string
    target_id: string
    reason: string
    status: string
    created_at: string
  }>) {
    events.push({
      id: `report:${row.id}`,
      kind: 'report',
      createdAt: row.created_at,
      actor: row.reporter_id ? shortId(row.reporter_id) : 'anon',
      summary: `Report ${row.status}: ${row.reason}`,
      details: `${row.target_type}: ${row.target_id}`,
    })
  }

  for (const row of (moderationR.data ?? []) as Array<{
    id: string
    admin_id: string | null
    target_type: string
    target_id: string
    action: string
    notes: string | null
    created_at: string
  }>) {
    events.push({
      id: `moderation:${row.id}`,
      kind: 'moderation',
      createdAt: row.created_at,
      actor: row.admin_id ? shortId(row.admin_id) : 'system',
      summary: row.action,
      details: `${row.target_type}: ${row.target_id}${row.notes ? ` — ${row.notes}` : ''}`,
    })
  }

  events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const filtered = filter === 'all' ? events : events.filter(e => e.kind === filter)
  const visible = filtered.slice(0, limit)

  // Tally by kind from the unfiltered set so the chips show real counts.
  const counts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.kind] = (acc[e.kind] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <section className="border-b border-border pb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Admin · Activity
        </p>
        <h1 className="mt-2 font-mono text-2xl text-foreground">Activity feed</h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Unified, time-ordered stream of signups, content, reactions, donations, reports and moderation actions across the platform.
        </p>
      </section>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => {
          const active = f.value === filter
          const count = f.value === 'all' ? events.length : counts[f.value] ?? 0
          const href = f.value === 'all' ? '/admin/activity' : `/admin/activity?type=${f.value}`
          return (
            <a
              key={f.value}
              href={href}
              className={`inline-flex items-center gap-2 px-3 h-8 font-mono text-[10px] uppercase tracking-widest border ${
                active
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
              <span className={active ? 'text-background/70' : 'text-muted-foreground/70'}>{count}</span>
            </a>
          )
        })}
      </div>

      {/* Feed */}
      <section className="border border-border">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-mono text-sm text-foreground">
            {filter === 'all' ? 'All events' : FILTERS.find(f => f.value === filter)?.label}
            <span className="ml-2 font-mono text-[10px] text-muted-foreground">
              {visible.length} of {filtered.length}
            </span>
          </h2>
        </div>
        <div className="divide-y divide-border">
          {visible.length === 0 ? (
            <p className="px-5 py-8 font-mono text-xs text-muted-foreground">
              No events to show. Activity will appear here as users sign up, post, donate or get moderated.
            </p>
          ) : (
            visible.map(event => {
              const meta = KIND_META[event.kind]
              const tone = toneStyle(meta.tone)
              return (
                <div key={event.id} className="grid gap-3 px-5 py-4 md:grid-cols-[110px_1fr_auto] items-start">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-1 font-mono text-[9px] uppercase tracking-widest w-fit"
                    style={tone}
                  >
                    <meta.Icon className="h-3 w-3" />
                    {meta.label}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-foreground truncate">{event.summary}</p>
                    {event.details && (
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground break-words">
                        {event.details}
                      </p>
                    )}
                    {event.actor && (
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">by {event.actor}</p>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatRelative(event.createdAt)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </section>

      {filtered.length > limit && (
        <div className="flex justify-center">
          <a
            href={`/admin/activity?${filter !== 'all' ? `type=${filter}&` : ''}limit=${Math.min(500, limit + PAGE_SIZE)}`}
            className="border border-border px-5 h-10 inline-flex items-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Load more
          </a>
        </div>
      )}
    </div>
  )
}
