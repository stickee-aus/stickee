import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

type Reaction = 'heart' | 'fire' | 'flag'
const VALID_REACTIONS: Reaction[] = ['heart', 'fire', 'flag']

const REACTION_COL: Record<Reaction, 'hearts' | 'fires' | 'flags'> = {
  heart: 'hearts',
  fire:  'fires',
  flag:  'flags',
}

/**
 * POST /api/feed/react
 * Toggles a reaction for the signed-in user.
 *
 * Body: { postId: string, reaction: 'heart' | 'fire' | 'flag' }
 *
 * Response: { active: boolean, counts: { heart: number, fire: number, flag: number } }
 *
 * Logic:
 *   - If a feed_reactions row already exists → delete it (un-react), decrement count
 *   - Otherwise → insert it (react), increment count
 * Both operations use the admin client so we can update feed_posts freely,
 * but we verify the user session first.
 */
export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Sign in to react to posts.' }, { status: 401 })
  }

  // ── Validate body ─────────────────────────────────────────────────────────
  let body: { postId?: string; reaction?: string }
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { postId, reaction } = body
  if (!postId || typeof postId !== 'string') {
    return Response.json({ error: 'postId is required' }, { status: 400 })
  }
  if (!reaction || !VALID_REACTIONS.includes(reaction as Reaction)) {
    return Response.json({ error: 'reaction must be heart | fire | flag' }, { status: 400 })
  }
  const r = reaction as Reaction
  const col = REACTION_COL[r]

  const admin = createAdminSupabaseClient()

  // ── Check existing reaction ───────────────────────────────────────────────
  const { data: existing } = await admin
    .from('feed_reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .eq('reaction', r)
    .maybeSingle()

  let active: boolean

  if (existing) {
    // Un-react
    await admin
      .from('feed_reactions')
      .delete()
      .eq('id', existing.id)

    await admin.rpc('decrement_feed_count', { p_post_id: postId, p_col: col })
    active = false
  } else {
    // React
    await admin
      .from('feed_reactions')
      .insert({ user_id: user.id, post_id: postId, reaction: r })

    await admin.rpc('increment_feed_count', { p_post_id: postId, p_col: col })
    active = true
  }

  // ── Return fresh counts ───────────────────────────────────────────────────
  const { data: post } = await admin
    .from('feed_posts')
    .select('hearts, fires, flags')
    .eq('id', postId)
    .maybeSingle()

  // Also return what reactions the user currently has on this post
  const { data: userReactions } = await admin
    .from('feed_reactions')
    .select('reaction')
    .eq('user_id', user.id)
    .eq('post_id', postId)

  const active_reactions = new Set((userReactions ?? []).map((r: { reaction: string }) => r.reaction))

  return Response.json({
    active,
    activeReactions: {
      heart: active_reactions.has('heart'),
      fire:  active_reactions.has('fire'),
      flag:  active_reactions.has('flag'),
    },
    counts: {
      heart: post?.hearts ?? 0,
      fire:  post?.fires  ?? 0,
      flag:  post?.flags  ?? 0,
    },
  })
}

/**
 * GET /api/feed/react?postIds=a,b,c
 * Returns the signed-in user's existing reactions for the given post IDs.
 * Used on page load to restore reaction state.
 */
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ reactions: {} })
  }

  const postIds = (request.nextUrl.searchParams.get('postIds') ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 100)

  if (postIds.length === 0) return Response.json({ reactions: {} })

  const admin = createAdminSupabaseClient()
  const { data } = await admin
    .from('feed_reactions')
    .select('post_id, reaction')
    .eq('user_id', user.id)
    .in('post_id', postIds)

  // Build map: postId → { heart, fire, flag }
  const reactions: Record<string, { heart: boolean; fire: boolean; flag: boolean }> = {}
  for (const row of (data ?? []) as Array<{ post_id: string; reaction: string }>) {
    if (!reactions[row.post_id]) {
      reactions[row.post_id] = { heart: false, fire: false, flag: false }
    }
    if (row.reaction === 'heart') reactions[row.post_id].heart = true
    if (row.reaction === 'fire')  reactions[row.post_id].fire  = true
    if (row.reaction === 'flag')  reactions[row.post_id].flag  = true
  }

  return Response.json({ reactions })
}
