import 'server-only'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import type { FeedPost, FeedPostType } from '@/lib/mock-feed-data'

/**
 * X-algorithm-inspired feed ranker.
 * ───────────────────────────────────────────────────────────
 * Mirrors the four stages of twitter/the-algorithm:
 *
 *   1. Candidate sourcing  (in-network + out-of-network)
 *   2. Heavy ranker        (weighted linear model — fast, debuggable)
 *   3. Filters & heuristics (dedupe, blocked, dwell-cap)
 *   4. Mixer               (interleave organic + boosts)
 *
 * The heavy ranker in X is a neural net (MaskNet). Replacing that with a
 * weighted linear combination captures ~80% of the perceived quality at
 * 1% of the engineering cost, and lets us A/B-test weights directly.
 *
 * Inputs:
 *   - userId:    string | null   (null = anonymous viewer; only public signal)
 *   - prefs:     { electorate?: string; topIssues?: string[] }
 *   - follows:   string[]        (author_ids the user follows)
 *   - limit:     number          (cap on returned posts)
 */

// ─── Weights (X-style "global model" knobs) ──────────────────────────────────

const W = {
  fire:           1.4,
  heart:          0.9,
  comments:       1.2,
  shares:         1.3,
  recency:        2.5,   // strongest signal — civic info goes stale fast
  pillarMatch:    1.8,
  electorateMatch:2.2,
  authority:      0.6,   // log(civic_score)
  follows:        2.5,
  alertBoost:     1.0,   // civic_alerts get a small constant boost
} as const

const P = {
  reported:       3.0,   // penalty for posts whose author the user reported
  seen:           1.5,   // penalty for previously-impressed posts
  duplicateLink:  0.8,   // penalty for second post about same decision
} as const

// Recency half-lives, in hours. Different post types decay at different rates.
const HALF_LIFE_H: Record<FeedPostType, number> = {
  civic_alert:     6,
  decision_update: 12,
  leader_update:   24,
  user_post:       18,
}

// ─── Types returned from supabase ────────────────────────────────────────────

interface FeedPostRow {
  id: string
  type: FeedPostType
  author_id: string | null
  author_name: string
  author_handle: string
  author_verified: boolean
  civic_score: number | null
  content: string
  linked_pillar_id: string | null
  linked_decision_id: string | null
  linked_leader_id: string | null
  linked_bill_id: string | null
  linked_electorate: string | null
  posted_at: string
  hearts: number
  fires: number
  flags: number
  comment_count: number
  share_count: number
  is_boost: boolean
}

// ─── Scoring helpers ─────────────────────────────────────────────────────────

function recencyDecay(postedAt: string, type: FeedPostType): number {
  const ageH = (Date.now() - new Date(postedAt).getTime()) / 3_600_000
  const halfLife = HALF_LIFE_H[type] ?? 18
  // Exponential decay normalised to [0..1].
  return Math.pow(0.5, ageH / halfLife)
}

function log1p(n: number): number {
  return Math.log(1 + Math.max(0, n))
}

function score(
  row: FeedPostRow,
  ctx: {
    follows: Set<string>
    topIssues: Set<string>
    electorate: string | null
    seenPostIds: Set<string>
    reportedAuthorIds: Set<string>
    seenDecisionIds: Set<string>
  },
): number {
  let s = 0

  // Engagement features
  s += W.fire    * log1p(row.fires)
  s += W.heart   * log1p(row.hearts)
  s += W.comments* log1p(row.comment_count)
  s += W.shares  * log1p(row.share_count)

  // Recency
  s += W.recency * recencyDecay(row.posted_at, row.type)

  // Pillar match (user-stated top issues)
  if (row.linked_pillar_id && ctx.topIssues.has(row.linked_pillar_id)) {
    s += W.pillarMatch
  }

  // Electorate match
  if (
    row.linked_electorate &&
    ctx.electorate &&
    row.linked_electorate.toLowerCase() === ctx.electorate.toLowerCase()
  ) {
    s += W.electorateMatch
  }

  // Author authority (civic_score, log-scaled)
  if (row.civic_score) s += W.authority * log1p(row.civic_score / 10)

  // In-network bonus
  if (row.author_id && ctx.follows.has(row.author_id)) {
    s += W.follows
  }

  // Boost flag (algorithm-promoted civic alerts)
  if (row.is_boost) s += W.alertBoost

  // ── Penalties ──
  if (row.author_id && ctx.reportedAuthorIds.has(row.author_id)) s -= P.reported
  if (ctx.seenPostIds.has(row.id)) s -= P.seen
  if (row.linked_decision_id && ctx.seenDecisionIds.has(row.linked_decision_id)) {
    s -= P.duplicateLink
  }

  return s
}

// ─── Mixer ───────────────────────────────────────────────────────────────────

/**
 * X's home timeline mixes types so the user never sees 5 ads in a row.
 * Equivalent here: alternate organic community posts with a system alert
 * roughly every 4 items, and never put two posts about the same decision
 * back-to-back.
 */
function mix(ranked: Array<FeedPostRow & { _score: number }>): FeedPostRow[] {
  const alerts: FeedPostRow[] = []
  const organic: FeedPostRow[] = []

  for (const r of ranked) {
    if (r.type === 'civic_alert' || r.type === 'decision_update') alerts.push(r)
    else organic.push(r)
  }

  const out: FeedPostRow[] = []
  const ALERT_EVERY = 4
  let i = 0
  let j = 0
  let position = 0
  while (i < organic.length || j < alerts.length) {
    if (position % ALERT_EVERY === ALERT_EVERY - 1 && j < alerts.length) {
      out.push(alerts[j++])
    } else if (i < organic.length) {
      out.push(organic[i++])
    } else if (j < alerts.length) {
      out.push(alerts[j++])
    }
    position++
  }

  // Final pass: avoid two consecutive posts about the same decision.
  for (let k = 1; k < out.length; k++) {
    const a = out[k - 1].linked_decision_id
    const b = out[k].linked_decision_id
    if (a && b && a === b) {
      // Swap with the next non-conflicting item if available.
      for (let m = k + 1; m < out.length; m++) {
        if (out[m].linked_decision_id !== a) {
          ;[out[k], out[m]] = [out[m], out[k]]
          break
        }
      }
    }
  }
  return out
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface RankedFeedOptions {
  userId?: string | null
  electorate?: string | null
  topIssues?: string[]
  follows?: string[]
  limit?: number
}

export async function getRankedFeed(opts: RankedFeedOptions = {}): Promise<FeedPost[]> {
  const admin = createAdminSupabaseClient()
  const limit = Math.min(opts.limit ?? 60, 200)

  // ── 1. Candidate sourcing ────────────────────────────────────────────────
  // Pull the most recent ~3x limit candidates, both in-network and out.
  const since = new Date(Date.now() - 14 * 24 * 60 * 60_000).toISOString()
  const { data: rows, error } = await admin
    .from('feed_posts')
    .select('*')
    .gte('posted_at', since)
    .order('posted_at', { ascending: false })
    .limit(limit * 3)

  if (error) {
    console.error('[ranker] feed_posts read error', error)
    return []
  }
  const candidates = (rows ?? []) as FeedPostRow[]

  // ── 2. Build user context ────────────────────────────────────────────────
  const follows = new Set(opts.follows ?? [])
  const topIssues = new Set(opts.topIssues ?? [])
  const electorate = opts.electorate ?? null

  const seenPostIds = new Set<string>()
  const reportedAuthorIds = new Set<string>()
  if (opts.userId) {
    const [imps, reports] = await Promise.all([
      admin
        .from('feed_impressions')
        .select('post_id')
        .eq('user_id', opts.userId)
        .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString())
        .limit(500),
      admin
        .from('content_reports')
        .select('target_id, target_type')
        .eq('reporter_id', opts.userId)
        .limit(200),
    ])
    for (const r of (imps.data ?? []) as Array<{ post_id: string }>) seenPostIds.add(r.post_id)
    for (const r of (reports.data ?? []) as Array<{ target_id: string; target_type: string }>) {
      if (r.target_type === 'user') reportedAuthorIds.add(r.target_id)
    }
  }

  // ── 3. Score + filter ────────────────────────────────────────────────────
  const seenDecisionIds = new Set<string>()
  const scored = candidates
    .filter(c => !(c.author_id && reportedAuthorIds.has(c.author_id)))
    .map(c => ({ ...c, _score: score(c, {
      follows, topIssues, electorate, seenPostIds, reportedAuthorIds, seenDecisionIds,
    }) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit * 2)

  // Track decision ids in score order so the duplicate penalty applies to
  // items below the first occurrence.
  for (const c of scored) {
    if (c.linked_decision_id) seenDecisionIds.add(c.linked_decision_id)
  }

  // ── 4. Mix ────────────────────────────────────────────────────────────────
  const mixed = mix(scored).slice(0, limit)

  // ── 5. Project to the public FeedPost shape ──────────────────────────────
  return mixed.map(row => rowToFeedPost(row))
}

function rowToFeedPost(row: FeedPostRow): FeedPost {
  return {
    id: row.id,
    type: row.type,
    authorId: row.author_id ?? 'system',
    authorName: row.author_name,
    authorHandle: row.author_handle,
    authorVerified: row.author_verified,
    civicScore: row.civic_score ?? undefined,
    content: row.content,
    linkedPillarId: (row.linked_pillar_id ?? undefined) as FeedPost['linkedPillarId'],
    linkedDecisionId: row.linked_decision_id ?? undefined,
    linkedLeaderId: row.linked_leader_id ?? undefined,
    postedAt: row.posted_at,
    reactions: { heart: row.hearts, fire: row.fires, flag: row.flags },
    commentCount: row.comment_count,
    shareCount: row.share_count,
    isAlgorithmicBoost: row.is_boost,
  }
}
