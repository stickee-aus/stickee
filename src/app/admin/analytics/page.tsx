import type { Metadata } from 'next'
import { connection } from 'next/server'
import { BarChart3, TrendingUp, Users, DollarSign, MessageSquare } from 'lucide-react'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { getAdminUser } from '../_lib/guard'

export const metadata: Metadata = { title: 'Analytics — Admin' }

const DAYS_WINDOW = 30

type SearchParams = Promise<{ days?: string }>

type Bucket = { day: string; count: number }

function startOfDayISO(date: Date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

function dayKey(iso: string) {
  // YYYY-MM-DD in UTC
  return iso.slice(0, 10)
}

function buildEmptyBuckets(days: number): Bucket[] {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const out: Bucket[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(today.getUTCDate() - i)
    out.push({ day: d.toISOString().slice(0, 10), count: 0 })
  }
  return out
}

function bucketRows<T extends { created_at: string | null }>(rows: T[], days: number): Bucket[] {
  const buckets = buildEmptyBuckets(days)
  const index = new Map(buckets.map((b, i) => [b.day, i]))
  for (const r of rows) {
    if (!r.created_at) continue
    const key = dayKey(r.created_at)
    const idx = index.get(key)
    if (idx !== undefined) buckets[idx].count += 1
  }
  return buckets
}

/** Simple inline SVG bar chart. Designed to read at 320px+ width. */
function BarChart({ data, accent = '#e8e8e6', height = 140, label }: {
  data: Bucket[]
  accent?: string
  height?: number
  label?: string
}) {
  const max = Math.max(1, ...data.map(d => d.count))
  const width = Math.max(320, data.length * 18)
  const barWidth = width / data.length - 2
  const pad = 4
  const chartHeight = height - pad * 2

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        {/* baseline */}
        <line
          x1={0}
          y1={height - pad}
          x2={width}
          y2={height - pad}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1"
          shapeRendering="crispEdges"
        />
        {data.map((d, i) => {
          const h = (d.count / max) * chartHeight
          const x = i * (barWidth + 2) + 1
          const y = height - pad - h
          return (
            <g key={d.day}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(1, h)}
                fill={accent}
                opacity={d.count === 0 ? 0.18 : 1}
              >
                <title>{`${d.day}: ${d.count}${label ? ' ' + label : ''}`}</title>
              </rect>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Sparkline for stat tiles. */
function Sparkline({ data, accent = '#e8e8e6', height = 30 }: {
  data: Bucket[]
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
      <polyline points={points.join(' ')} fill="none" stroke={accent} strokeWidth="1.2" />
    </svg>
  )
}

function formatAud(cents: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100)
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  await connection()
  if (!(await getAdminUser()).isAdmin) return null

  const params = await searchParams
  const days = Math.min(180, Math.max(7, parseInt(params.days ?? String(DAYS_WINDOW), 10) || DAYS_WINDOW))
  const since = new Date()
  since.setUTCHours(0, 0, 0, 0)
  since.setUTCDate(since.getUTCDate() - (days - 1))
  const sinceISO = startOfDayISO(since)

  const admin = createAdminSupabaseClient()

  const [
    profilesR,
    predictionsR,
    commentsR,
    reactionsR,
    billPressuresR,
    donationsR,
    topUsersR,
    topCommentersR,
  ] = await Promise.all([
    admin
      .from('user_profiles')
      .select('user_id, created_at, onboarding_completed_at')
      .gte('created_at', sinceISO),
    admin
      .from('predictions')
      .select('id, user_id, created_at')
      .gte('created_at', sinceISO),
    admin
      .from('comments')
      .select('id, user_id, created_at')
      .gte('created_at', sinceISO),
    admin
      .from('feed_reactions')
      .select('id, user_id, created_at')
      .gte('created_at', sinceISO),
    admin
      .from('bill_pressures')
      .select('id, user_id, created_at')
      .gte('created_at', sinceISO),
    admin
      .from('donation_records')
      .select('id, user_id, amount_cents, status, cadence, created_at')
      .gte('created_at', sinceISO),
    admin
      .from('user_profiles')
      .select('user_id, handle, display_name, civic_score')
      .order('civic_score', { ascending: false })
      .limit(8),
    admin
      .from('comments')
      .select('user_id, author_handle, author_name')
      .gte('created_at', sinceISO)
      .not('user_id', 'is', null)
      .limit(2000),
  ])

  const profiles = (profilesR.data ?? []) as Array<{ user_id: string; created_at: string; onboarding_completed_at: string | null }>
  const predictions = (predictionsR.data ?? []) as Array<{ id: string; user_id: string | null; created_at: string }>
  const comments = (commentsR.data ?? []) as Array<{ id: string; user_id: string | null; created_at: string }>
  const reactions = (reactionsR.data ?? []) as Array<{ id: string; user_id: string; created_at: string }>
  const billPressures = (billPressuresR.data ?? []) as Array<{ id: string; user_id: string | null; created_at: string }>
  const donations = (donationsR.data ?? []) as Array<{
    id: string
    user_id: string | null
    amount_cents: number | null
    status: string
    cadence: string
    created_at: string
  }>

  const signupBuckets = bucketRows(profiles, days)
  const predictionBuckets = bucketRows(predictions, days)
  const commentBuckets = bucketRows(comments, days)
  const reactionBuckets = bucketRows(reactions, days)
  const pressureBuckets = bucketRows(billPressures, days)

  // DAU = distinct user_id producing engagement on a given day, across
  // predictions, comments, reactions, bill_pressures.
  const dauSets = new Map<string, Set<string>>()
  function addDau(userId: string | null | undefined, createdAt: string) {
    if (!userId) return
    const k = dayKey(createdAt)
    let set = dauSets.get(k)
    if (!set) {
      set = new Set()
      dauSets.set(k, set)
    }
    set.add(userId)
  }
  for (const r of predictions) addDau(r.user_id, r.created_at)
  for (const r of comments) addDau(r.user_id, r.created_at)
  for (const r of reactions) addDau(r.user_id, r.created_at)
  for (const r of billPressures) addDau(r.user_id, r.created_at)

  const dauBuckets = buildEmptyBuckets(days).map(b => ({
    day: b.day,
    count: dauSets.get(b.day)?.size ?? 0,
  }))

  // WAU = rolling 7-day distinct user count, plotted per day.
  // Compute by maintaining a counter map of userId -> first/last day in window.
  const wauBuckets = buildEmptyBuckets(days).map((b, i, arr) => {
    const endDay = b.day
    const startIndex = Math.max(0, i - 6)
    const startDay = arr[startIndex].day
    const users = new Set<string>()
    for (const [day, set] of dauSets.entries()) {
      if (day >= startDay && day <= endDay) {
        for (const u of set) users.add(u)
      }
    }
    return { day: endDay, count: users.size }
  })

  // Donation totals
  const paidDonations = donations.filter(d => d.status === 'paid')
  const paidTotal = paidDonations.reduce((sum, d) => sum + (d.amount_cents ?? 0), 0)
  const donationStarted = donations.length
  const donationConversion = donationStarted > 0
    ? Math.round((paidDonations.length / donationStarted) * 100)
    : 0

  const donationBuckets = buildEmptyBuckets(days)
  const donationIndex = new Map(donationBuckets.map((b, i) => [b.day, i]))
  for (const d of paidDonations) {
    const k = dayKey(d.created_at)
    const idx = donationIndex.get(k)
    if (idx !== undefined) donationBuckets[idx].count += Math.round((d.amount_cents ?? 0) / 100)
  }

  // Onboarded conversion (over window)
  const onboardedInWindow = profiles.filter(p => p.onboarding_completed_at).length
  const onboardingPct = profiles.length > 0
    ? Math.round((onboardedInWindow / profiles.length) * 100)
    : 0

  // Top contributors by civic_score (snapshot)
  const topUsers = (topUsersR.data ?? []) as Array<{
    user_id: string
    handle: string | null
    display_name: string | null
    civic_score: number | null
  }>
  const topUsersMax = Math.max(1, ...topUsers.map(u => u.civic_score ?? 0))

  // Top commenters in window
  const commenterRows = (topCommentersR.data ?? []) as Array<{
    user_id: string | null
    author_handle: string | null
    author_name: string | null
  }>
  const commenterCounts = new Map<string, { label: string; count: number }>()
  for (const r of commenterRows) {
    if (!r.user_id) continue
    const label = r.author_handle ? `@${r.author_handle}` : (r.author_name ?? r.user_id.slice(0, 8))
    const cur = commenterCounts.get(r.user_id) ?? { label, count: 0 }
    cur.count += 1
    commenterCounts.set(r.user_id, cur)
  }
  const topCommenters = Array.from(commenterCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
  const topCommentersMax = Math.max(1, ...topCommenters.map(c => c.count))

  // Stat summaries (totals over window)
  const totalSignups = profiles.length
  const totalPredictions = predictions.length
  const totalComments = comments.length
  const dauToday = dauBuckets[dauBuckets.length - 1]?.count ?? 0
  const wauNow = wauBuckets[wauBuckets.length - 1]?.count ?? 0

  return (
    <div className="space-y-6">
      <section className="border-b border-border pb-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Admin · Analytics
        </p>
        <h1 className="mt-2 font-mono text-2xl text-foreground">Analytics</h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          Last {days} days · all charts UTC. {' '}
          <a className="underline decoration-border hover:text-foreground" href="/admin/analytics?days=7">7d</a>
          {' · '}
          <a className="underline decoration-border hover:text-foreground" href="/admin/analytics?days=30">30d</a>
          {' · '}
          <a className="underline decoration-border hover:text-foreground" href="/admin/analytics?days=90">90d</a>
        </p>
      </section>

      {/* KPI tiles with sparklines */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="border border-border p-5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Signups</p>
          </div>
          <p className="mt-3 font-mono text-3xl text-foreground">{totalSignups}</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">{onboardingPct}% completed onboarding</p>
          <div className="mt-3 text-foreground">
            <Sparkline data={signupBuckets} />
          </div>
        </div>

        <div className="border border-border p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">DAU / WAU</p>
          </div>
          <p className="mt-3 font-mono text-3xl text-foreground">{dauToday}<span className="text-muted-foreground"> / {wauNow}</span></p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">Distinct active users (engagement)</p>
          <div className="mt-3 text-foreground">
            <Sparkline data={dauBuckets} />
          </div>
        </div>

        <div className="border border-border p-5">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Engagement</p>
          </div>
          <p className="mt-3 font-mono text-3xl text-foreground">{totalPredictions + totalComments}</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">{totalPredictions} predictions · {totalComments} comments</p>
          <div className="mt-3 text-foreground">
            <Sparkline data={predictionBuckets} />
          </div>
        </div>

        <div className="border border-border p-5">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Donations</p>
          </div>
          <p className="mt-3 font-mono text-3xl text-foreground">{formatAud(paidTotal)}</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {paidDonations.length}/{donationStarted} paid · {donationConversion}% conversion
          </p>
          <div className="mt-3" style={{ color: '#2ec266' }}>
            <Sparkline data={donationBuckets} accent="#2ec266" />
          </div>
        </div>
      </section>

      {/* Big charts */}
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="border border-border p-5 text-foreground">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm">Signups per day</h2>
            <span className="font-mono text-[10px] text-muted-foreground">{days}d</span>
          </div>
          <div className="mt-4">
            <BarChart data={signupBuckets} label="signups" />
          </div>
        </div>

        <div className="border border-border p-5 text-foreground">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm">DAU (engagement)</h2>
            <span className="font-mono text-[10px] text-muted-foreground">{days}d</span>
          </div>
          <div className="mt-4">
            <BarChart data={dauBuckets} label="active users" accent="#5b9bd5" />
          </div>
        </div>

        <div className="border border-border p-5 text-foreground">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm">Predictions per day</h2>
            <span className="font-mono text-[10px] text-muted-foreground">{days}d</span>
          </div>
          <div className="mt-4">
            <BarChart data={predictionBuckets} label="predictions" />
          </div>
        </div>

        <div className="border border-border p-5 text-foreground">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm">Comments + reactions per day</h2>
            <span className="font-mono text-[10px] text-muted-foreground">{days}d</span>
          </div>
          <div className="mt-4">
            <BarChart
              data={commentBuckets.map((c, i) => ({
                day: c.day,
                count: c.count + (reactionBuckets[i]?.count ?? 0),
              }))}
              label="events"
            />
          </div>
        </div>

        <div className="border border-border p-5 text-foreground">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm">Bill pressure actions per day</h2>
            <span className="font-mono text-[10px] text-muted-foreground">{days}d</span>
          </div>
          <div className="mt-4">
            <BarChart data={pressureBuckets} label="actions" accent="#e0a800" />
          </div>
        </div>

        <div className="border border-border p-5" style={{ color: '#2ec266' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-sm text-foreground">Paid donations per day (AUD)</h2>
            <span className="font-mono text-[10px] text-muted-foreground">{days}d</span>
          </div>
          <div className="mt-4">
            <BarChart data={donationBuckets} label="AUD" accent="#2ec266" />
          </div>
        </div>
      </section>

      {/* Top contributors */}
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="border border-border">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-mono text-sm text-foreground">Top users by civic score</h2>
          </div>
          <div className="divide-y divide-border">
            {topUsers.length === 0 ? (
              <p className="px-5 py-6 font-mono text-xs text-muted-foreground">No users yet.</p>
            ) : (
              topUsers.map(u => {
                const score = u.civic_score ?? 0
                const pct = Math.round((score / topUsersMax) * 100)
                return (
                  <div key={u.user_id} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-xs text-foreground truncate">
                        {u.display_name ?? (u.handle ? `@${u.handle}` : u.user_id.slice(0, 8))}
                      </p>
                      <span className="font-mono text-[10px] text-muted-foreground">{score}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-muted/40">
                      <div className="h-full" style={{ width: `${pct}%`, background: '#e8e8e6' }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="border border-border">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-mono text-sm text-foreground">Top commenters · {days}d</h2>
          </div>
          <div className="divide-y divide-border">
            {topCommenters.length === 0 ? (
              <p className="px-5 py-6 font-mono text-xs text-muted-foreground">No comments in window.</p>
            ) : (
              topCommenters.map(c => {
                const pct = Math.round((c.count / topCommentersMax) * 100)
                return (
                  <div key={c.label} className="px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-mono text-xs text-foreground truncate">{c.label}</p>
                      <span className="font-mono text-[10px] text-muted-foreground">{c.count}</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-muted/40">
                      <div className="h-full" style={{ width: `${pct}%`, background: '#5b9bd5' }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
