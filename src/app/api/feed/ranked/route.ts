import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { getRankedFeed } from '@/lib/feed/ranker'
import { FEED_POSTS } from '@/lib/mock-feed-data'

/**
 * GET /api/feed/ranked
 * Returns a ranked feed. Falls back to the bundled mock data if no posts
 * exist in feed_posts yet (helps local dev before agents have run).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '60', 10) || 60, 200)

  // Resolve the caller. We accept the user from the cookie session — if
  // they aren't signed in, we rank for an anonymous viewer using only the
  // public signal.
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  let electorate: string | null = null
  let topIssues: string[] = []
  let follows: string[] = []

  if (user) {
    const admin = createAdminSupabaseClient()
    const [{ data: profile }, { data: follow }] = await Promise.all([
      admin
        .from('user_profiles')
        .select('electorate, top_issues')
        .eq('user_id', user.id)
        .maybeSingle(),
      admin
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id),
    ])

    electorate = profile?.electorate ?? null
    topIssues = (profile?.top_issues ?? []) as string[]
    follows = ((follow ?? []) as Array<{ following_id: string }>).map(r => r.following_id)
  } else {
    // Cookies / query params for anonymous personalisation.
    electorate = url.searchParams.get('electorate')
    const issues = url.searchParams.get('issues')
    if (issues) topIssues = issues.split(',').map(s => s.trim()).filter(Boolean)
  }

  const ranked = await getRankedFeed({
    userId: user?.id ?? null,
    electorate,
    topIssues,
    follows,
    limit,
  })

  // Fallback to the mock fixture if the DB is empty (fresh dev environment).
  if (ranked.length === 0) {
    return Response.json({
      posts: FEED_POSTS.slice(0, limit),
      source: 'mock-fallback',
    })
  }

  return Response.json({ posts: ranked, source: 'ranked' })
}
