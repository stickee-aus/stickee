import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

const VALID_PILLARS = ['cost-of-living', 'housing', 'crime-safety', 'jobs-economy', 'future']

/**
 * POST /api/feed/post
 * Creates a new user_post in feed_posts. Requires a valid session.
 *
 * Body:
 *   content    string  (1–500 chars, required)
 *   pillarId   string  (optional, must be a known pillar slug)
 *
 * Response: { post: FeedPost }
 */
export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Sign in to post.' }, { status: 401 })
  }

  // ── Parse + validate body ─────────────────────────────────────────────────
  let body: { content?: string; pillarId?: string }
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const content = (body.content ?? '').trim()
  if (!content || content.length < 1) {
    return Response.json({ error: 'Content is required.' }, { status: 400 })
  }
  if (content.length > 500) {
    return Response.json({ error: 'Posts must be 500 characters or fewer.' }, { status: 400 })
  }

  const pillarId = body.pillarId && VALID_PILLARS.includes(body.pillarId)
    ? body.pillarId
    : null

  const admin = createAdminSupabaseClient()

  // ── Load author profile ───────────────────────────────────────────────────
  const { data: profile } = await admin
    .from('user_profiles')
    .select('handle, display_name, civic_score')
    .eq('user_id', user.id)
    .maybeSingle()

  const handle      = profile?.handle ?? user.email?.split('@')[0] ?? 'citizen'
  const displayName = profile?.display_name ?? handle
  const civicScore  = profile?.civic_score ?? null

  // Stable, human-readable id
  const id = `post-${user.id.slice(0, 8)}-${Date.now()}`

  const { data: row, error } = await admin
    .from('feed_posts')
    .insert({
      id,
      type:             'user_post',
      author_id:        user.id,
      author_name:      displayName,
      author_handle:    `@${handle}`,
      author_verified:  false,
      civic_score:      civicScore,
      content,
      linked_pillar_id: pillarId,
      posted_at:        new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('[feed/post]', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Map DB row (snake_case) → FeedPost (camelCase) so the feed page can
  // prepend it directly without any re-mapping.
  const post = {
    id:                 row.id,
    type:               row.type,
    authorId:           row.author_id ?? 'system',
    authorName:         row.author_name,
    authorHandle:       row.author_handle,
    authorVerified:     row.author_verified,
    civicScore:         row.civic_score ?? undefined,
    content:            row.content,
    linkedPillarId:     row.linked_pillar_id ?? undefined,
    linkedDecisionId:   row.linked_decision_id ?? undefined,
    linkedLeaderId:     row.linked_leader_id ?? undefined,
    postedAt:           row.posted_at,
    reactions:          { heart: 0, fire: 0, flag: 0 },
    commentCount:       0,
    shareCount:         0,
    isAlgorithmicBoost: false,
  }

  return Response.json({ post }, { status: 201 })
}
