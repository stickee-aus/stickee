import type { Metadata } from 'next'
import { connection } from 'next/server'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  DollarSign,
  Flag,
  MessageSquare,
  TrendingUp,
  Users,
  UserPlus,
} from 'lucide-react'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { getAdminUser, requireAdminUserId } from './_lib/guard'

export const metadata: Metadata = {
  title: 'Admin — Stickee',
  description: 'Moderation and operating dashboard for Stickee administrators.',
}

const WINDOW_DAYS = 14

type AdminClient = ReturnType<typeof createAdminSupabaseClient>
type TableQuery = ReturnType<AdminClient['from']>
type CountQuery = ReturnType<TableQuery['select']>

interface ContentReportRow {
  id: string
  target_type: string
  target_id: string
  reason: string
  notes: string | null
  status: string
}

interface ModerationActionRow {
  id: string
  target_type: string
  target_id: string
  action: string
  notes: string | null
  created_at: string
}

interface RecentUserRow {
  user_id: string
  handle: string | null
  display_name: string | null
  electorate: string | null
  civic_score: number | null
  onboarding_completed_at: string | null
  created_at: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function startOfDayUTC(d: Date) {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

function dayKey(iso: string) {
  return iso.slice(0, 10)
}

function emptyBuckets(days: number) {
  const today = startOfDayUTC(new Date())
  const out: { day: string; count: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(today.getUTCDate() - i)
    out.push({ day: d.toISOString().slice(0, 10), count: 0 })
  }
  return out
}

function bucketize<T extends { created_at: string | null }>(rows: T[], days: number) {
  const buckets = emptyBuckets(days)
  const idx = new Map(buckets.map((b, i) => [b.day, i]))
  for (const row of rows) {
    if (!row.created_at) continue
    const i = idx.get(dayKey(row.created_at))
    if (i !== undefined) buckets[i].count++
  }
  return buckets
}

function formatAud(cents: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100)
}

function deltaPct(today: number, yesterday: number) {
  if (yesterday === 0) return today === 0 ? 0 : 100
  return Math.round(((today - yesterday) / yesterday) * 100)
}

async function getCount(table: string, filters?: (query: CountQuery) => CountQuery) {
  const admin = createAdminSupabaseClient()
  let q = admin.from(table).select('*', { count: 'exact', head: true })
  if (filters) q = filters(q)
  const { count } = await q
  return count ?? 0
}

// ─── Server action: update a content report inline ───────────────────────────

async function updateReportAction(formData: FormData) {
  'use server'
  const adminUserId = await requireAdminUserId()
  const reportId = String(formData.get('reportId') ?? '')
  const status = String(formData.get('status') ?? '')
  const action = String(formData.get('action') ?? '').trim().slice(0, 80)
  const notes = String(formData.get('notes') ?? '').trim().slice(0, 500)
  const targetType = String(formData.get('targetType') ?? '')
  const targetId = String(formData.get('targetId') ?? '')

  if (!reportId || !['open', 'reviewing', 'resolved', 'dismissed'].includes(status)) return

  const admin = createAdminSupabaseClient()
  await admin
    .from('content_reports')
    .update({
      status,
      resolved_at: status === 'resolved' || status === 'dismissed' ? new Date().toISOString() : null,
    })
    .eq('id', reportId)

  if (action) {
    await admin.from('moderation_actions').insert({
      admin_id: adminUserId,
      target_type: targetType || 'report',
      target_id: targetId || reportId,
      action,
      notes: notes || null,
    })
  }
  revalidatePath('/admin')
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function AdminOverviewPage() {
  await connection()
  if (!(await getAdminUser()).isAdmin) return null

  const since = new Date()
  since.setUTCHours(0, 0, 0, 0)
  since.setUTCDate(since.getUTCDate() - (WINDOW_DAYS - 1))
  const sinceISO = since.toISOString()

  const admin = createAdminSupabaseClient()

  const [
    totalUsers,
    totalOnboarded,
    totalPredictions,
    totalComments,
    openReports,
    donationsStarted,
    donationsPaid,
    profilesWindow,
    predictionsWindow,
    commentsWindow,
    reactionsWindow,
    pressuresWindow,
    donationsWindow,
    recentReports,
    recentUsers,
    recentActions,
  ] = await Promise.all([
    getCount('user_profiles'),
    getCount('user_profiles', q => q.not('onboarding_completed_at', 'is', null)),
    getCount('predictions'),
    getCount('comments'),
    getCount('content_reports', q => q.eq('status', 'open')),
    getCount('donation_records'),
    getCount('donation_records', q => q.eq('status', 'paid')),

    admin.from('user_profiles').select('user_id, created_at').gte('created_at', sinceISO),
    admin.from('predictions').select('id, user_id, created_at').gte('created_at', sinceISO),
    admin.from('comments').select('id, user_id, created_at').gte('created_at', sinceISO),
    admin.from('feed_reactions').select('id, user_id, created_at').gte('created_at', sinceISO),
    admin.from('bill_pressures').select('id, user_id, created_at').gte('created_at', sinceISO),
    admin.from('donation_records').select('id, amount_cents, status, created_at').gte('created_at', sinceISO),

    admin
      .from('content_reports')
      .select('id, reporter_id, target_type, target_id, reason, notes, status, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    admin
      .from('user_profiles')
      .select('user_id, handle, display_name, electorate, civic_score, onboarding_completed_at, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    admin
      .from('moderation_actions')
      .select('id, target_type, target_id, action, notes, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const profiles = (profilesWindow.data ?? []) as Array<{ user_id: string; created_at: string }>
  const predictions = (predictionsWindow.data ?? []) as Array<{ id: string; user_id: string | null; created_at: string }>
  const comments = (commentsWindow.data ?? []) as Array<{ id: string; user_id: string | null; created_at: string }>
  const reactions = (reactionsWindow.data ?? []) as Array<{ id: string; user_id: string; created_at: string }>
  const pressures = (pressuresWindow.data ?? []) as Array<{ id: string; user_id: string | null; created_at: string }>
  const donations = (donationsWindow.data ?? []) as Array<{ id: string; amount_cents: number | null; status: string; created_at: string }>

  const signupBuckets = bucketize(profiles, WINDOW_DAYS)
  const predictionBuckets = bucketize(predictions, WINDOW_DAYS)
  const commentBuckets = bucketize(comments, WINDOW_DAYS)

  // Donation paid amount per day (in AUD)
  const donationBuckets = emptyBuckets(WINDOW_DAYS)
  const donationIdx = new Map(donationBuckets.map((b, i) => [b.day, i]))
  let paidCents = 0
  for (const d of donations) {
    if (d.status !== 'paid') continue
    paidCents += d.amount_cents ?? 0
    const i = donationIdx.get(dayKey(d.created_at))
    if (i !== undefined) donationBuckets[i].count += Math.round((d.amount_cents ?? 0) / 100)
  }

  // DAU per day across engagement events
  const dauSets = new Map<string, Set<string>>()
  function addDau(uid: string | null | undefined, ts: string) {
    if (!uid) return
    const key = dayKey(ts)
    let s = dauSets.get(key)
    if (!s) { s = new Set(); dauSets.set(key, s) }
    s.add(uid)
  }
  for (const r of predictions) addDau(r.user_id, r.created_at)
  for (const r of comments) addDau(r.user_id, r.created_at)
  for (const r of reactions) addDau(r.user_id, r.created_at)
  for (const r of pressures) addDau(r.user_id, r.created_at)
  const dauBuckets = emptyBuckets(WINDOW_DAYS).map(b => ({
    day: b.day,
    count: dauSets.get(b.day)?.size ?? 0,
  }))

  const last = (b: { count: number }[]) => b[b.length - 1]?.count ?? 0
  const prev = (b: { count: number }[]) => b[b.length - 2]?.count ?? 0

  const conversion = donationsStarted > 0
    ? Math.round((donationsPaid / donationsStarted) * 100)
    : 0

  const todayKey = startOfDayUTC(new Date()).toISOString().slice(0, 10)
  const newToday = signupBuckets.find(b => b.day === todayKey)?.count ?? 0

  const kpis: KpiCard[] = [
    {
      label: 'Signups',
      value: String(totalUsers),
      Icon: Users,
      today: last(signupBuckets),
      delta: deltaPct(last(signupBuckets), prev(signupBuckets)),
      sparkline: signupBuckets,
      hint: `${totalOnboarded.toLocaleString('en-AU')} onboarded`,
    },
    {
      label: 'DAU',
      value: String(last(dauBuckets)),
      Icon: TrendingUp,
      today: last(dauBuckets),
      delta: deltaPct(last(dauBuckets), prev(dauBuckets)),
      sparkline: dauBuckets,
      accent: '#5b9bd5',
      hint: 'Distinct active users today',
    },
    {
      label: 'Engagement',
      value: String(predictions.length + comments.length),
      Icon: MessageSquare,
      today: last(predictionBuckets) + last(commentBuckets),
      delta: deltaPct(
        last(predictionBuckets) + last(commentBuckets),
        prev(predictionBuckets) + prev(commentBuckets),
      ),
      sparkline: predictionBuckets.map((b, i) => ({
        day: b.day,
        count: b.count + (commentBuckets[i]?.count ?? 0),
      })),
      hint: `${totalPredictions} preds · ${totalComments} comments`,
    },
    {
      label: 'Donations',
      value: formatAud(paidCents),
      Icon: DollarSign,
      today: donationBuckets[donationBuckets.length - 1]?.count ?? 0,
      delta: deltaPct(
        donationBuckets[donationBuckets.length - 1]?.count ?? 0,
        donationBuckets[donationBuckets.length - 2]?.count ?? 0,
      ),
      sparkline: donationBuckets,
      accent: '#2ec266',
      hint: `${donationsPaid}/${donationsStarted} paid · ${conversion}% conv.`,
      asCurrency: true,
    },
  ]

  return (
    <div className="space-y-8">
      {/* ─── Hero / today strip ─────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Operations · Last {WINDOW_DAYS}d
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Welcome back.
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {newToday > 0
                ? `${newToday} new ${newToday === 1 ? 'signup' : 'signups'} today.`
                : 'No new signups today yet.'}
              {' '}{openReports > 0 && <span style={{ color: '#f5a623' }}>{openReports} report{openReports === 1 ? '' : 's'} need review.</span>}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 h-10 text-xs uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" /> Users
            </Link>
            <Link
              href="/admin/activity"
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 h-10 text-xs uppercase tracking-widest text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              <Activity className="h-3.5 w-3.5" /> Activity
            </Link>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-2 rounded-md bg-foreground text-background px-4 h-10 text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Analytics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── KPI grid ───────────────────────────────────────────────── */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map(card => (
          <KpiTile key={card.label} {...card} />
        ))}
      </section>

      {/* ─── Moderation + Recent moderation ─────────────────────────── */}
      <section className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel
          icon={<Flag className="h-4 w-4" style={{ color: '#f5a623' }} />}
          title="Moderation queue"
          subtitle={`${recentReports.data?.length ?? 0} most recent · ${openReports} open total`}
          action={
            <Link href="/admin/activity?type=report" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
              All reports →
            </Link>
          }
        >
          {!recentReports.data || recentReports.data.length === 0 ? (
            <Empty>No content reports yet.</Empty>
          ) : (
            <div className="divide-y divide-border">
              {(recentReports.data as ContentReportRow[]).map(report => (
                <form key={report.id} action={updateReportAction} className="space-y-3 px-5 py-4">
                  <input type="hidden" name="reportId" value={report.id} />
                  <input type="hidden" name="targetType" value={report.target_type} />
                  <input type="hidden" name="targetId" value={report.target_id} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">
                        <span className="text-muted-foreground">{report.target_type}</span>{' '}
                        {report.target_id}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                        {report.reason}
                      </p>
                      {report.notes && (
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {report.notes}
                        </p>
                      )}
                    </div>
                    <StatusPill status={report.status} />
                  </div>
                  <div className="grid gap-2 md:grid-cols-[140px_1fr_140px_92px]">
                    <select
                      name="status"
                      defaultValue={report.status}
                      className="h-9 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                    >
                      <option value="open">Open</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                    <input
                      name="notes"
                      placeholder="Internal note"
                      className="h-9 rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground"
                    />
                    <input
                      name="action"
                      placeholder="Action label"
                      className="h-9 rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      type="submit"
                      className="h-9 rounded-md bg-foreground px-3 text-[10px] uppercase tracking-widest text-background hover:opacity-90 transition-opacity"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          title="Recent moderation"
          subtitle="Last actions taken"
        >
          {!recentActions.data || recentActions.data.length === 0 ? (
            <Empty>No moderation actions yet.</Empty>
          ) : (
            <div className="divide-y divide-border">
              {(recentActions.data as ModerationActionRow[]).map(a => (
                <div key={a.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-foreground truncate">{a.action}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {relative(a.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground truncate">
                    {a.target_type}: {a.target_id}
                  </p>
                  {a.notes && (
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{a.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      {/* ─── Recent users ───────────────────────────────────────────── */}
      <Panel
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        title="Recent users"
        subtitle="Latest signups"
        action={
          <Link href="/admin/users" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
            Manage users →
          </Link>
        }
      >
        {!recentUsers.data || recentUsers.data.length === 0 ? (
          <Empty>No user profiles yet.</Empty>
        ) : (
          <div className="divide-y divide-border">
            {(recentUsers.data as RecentUserRow[]).map(row => (
              <div key={row.user_id} className="flex items-center gap-4 px-5 py-3">
                <Avatar name={row.display_name ?? row.handle ?? row.user_id} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">
                    {row.display_name ?? row.handle ?? 'unknown'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    @{row.handle ?? 'unclaimed'}
                    {row.electorate ? ` · ${row.electorate}` : ''}
                    {' · '}joined {relative(row.created_at)}
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground hidden md:inline-block">
                  Score {row.civic_score ?? 0}
                </span>
                <span
                  className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md border whitespace-nowrap"
                  style={{
                    color: row.onboarding_completed_at ? '#2ec266' : '#5a5a5e',
                    borderColor: row.onboarding_completed_at ? '#0e3020' : '#1e1e20',
                    background: row.onboarding_completed_at ? '#041008' : 'transparent',
                  }}
                >
                  {row.onboarding_completed_at ? 'Onboarded' : 'New'}
                </span>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

interface KpiCard {
  label: string
  value: string
  Icon: typeof Users
  today: number
  delta: number
  sparkline: { day: string; count: number }[]
  accent?: string
  hint?: string
  asCurrency?: boolean
}

function KpiTile({ label, value, Icon, today, delta, sparkline, accent = '#e8e8e6', hint, asCurrency }: KpiCard) {
  const positive = delta >= 0
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight
  return (
    <div className="rounded-md border border-border bg-card/40 p-5 transition-colors hover:bg-card/60">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        <span
          className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-widest"
          style={{ color: positive ? '#2ec266' : '#f04747' }}
        >
          <DeltaIcon className="h-3 w-3" />
          {Math.abs(delta)}%
        </span>
      </div>
      {hint && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          {asCurrency ? `Today ${formatAud(today * 100)}` : `Today ${today}`} · {hint}
        </p>
      )}
      <div className="mt-3" style={{ color: accent }}>
        <Sparkline data={sparkline} accent={accent} />
      </div>
    </div>
  )
}

function Sparkline({ data, accent = '#e8e8e6', height = 32 }: {
  data: { day: string; count: number }[]
  accent?: string
  height?: number
}) {
  if (data.length === 0) return null
  const max = Math.max(1, ...data.map(d => d.count))
  const width = 120
  const step = width / Math.max(1, data.length - 1)
  const points = data.map((d, i) => {
    const x = i * step
    const y = height - (d.count / max) * (height - 2) - 1
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <polyline points={points.join(' ')} fill="none" stroke={accent} strokeWidth="1.4" />
    </svg>
  )
}

function Panel({
  icon, title, subtitle, action, children,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-md border border-border bg-card/30 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <h2 className="text-sm font-semibold text-foreground truncate">{title}</h2>
          {subtitle && (
            <span className="text-[10px] text-muted-foreground truncate">· {subtitle}</span>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-8 text-xs text-muted-foreground">{children}</p>
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; bd: string }> = {
    open:       { bg: '#1e1a0a', fg: '#f5a623', bd: '#3a2f14' },
    reviewing:  { bg: '#0a141e', fg: '#5b9bd5', bd: '#14253a' },
    resolved:   { bg: '#0a1e10', fg: '#2ec266', bd: '#143a1d' },
    dismissed:  { bg: '#1e1e20', fg: '#5a5a5e', bd: '#3a3a3e' },
  }
  const c = map[status] ?? map.dismissed
  return (
    <span
      className="text-[9px] uppercase tracking-widest px-2 py-1 rounded-md border whitespace-nowrap"
      style={{ background: c.bg, color: c.fg, borderColor: c.bd }}
    >
      {status}
    </span>
  )
}

function Avatar({ name }: { name: string }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase()
  // hash the name into a stable hue
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  const hue = h % 360
  return (
    <div
      className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
      style={{
        background: `hsl(${hue} 60% 18%)`,
        color: `hsl(${hue} 80% 70%)`,
        border: `1px solid hsl(${hue} 50% 25%)`,
      }}
    >
      {initial}
    </div>
  )
}

function relative(iso: string) {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const s = Math.round((now - then) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })
}
