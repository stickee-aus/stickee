import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import type { NextRequest } from 'next/server'

const TVFY_BASE = 'https://theyvoteforyou.org.au/api/v1'

// Actual shape returned by /api/v1/people.json
interface TVFYPerson {
  id: number
  latest_member: {
    id: number
    name: { first: string; last: string }
    electorate: string
    house: 'representatives' | 'senate'
    party: string
  } | null
}

function isAuthorized(request: NextRequest): boolean {
  if (request.headers.get('x-sync-secret') === process.env.SYNC_SECRET) return true
  const bearer = request.headers.get('authorization') ?? ''
  if (process.env.CRON_SECRET && bearer === `Bearer ${process.env.CRON_SECRET}`) return true
  return false
}

async function syncMembers(apiKey: string) {
  const res = await fetch(
    `${TVFY_BASE}/people.json?key=${encodeURIComponent(apiKey)}`,
    { next: { revalidate: 0 } }
  )
  if (!res.ok) {
    return Response.json({ error: 'TheyVoteForYou API error', upstream: res.status }, { status: 502 })
  }

  const people: TVFYPerson[] = await res.json()
  const supabase = createAdminSupabaseClient()
  const now = new Date().toISOString()

  const memberRows = people
    .filter(p => p.latest_member !== null)
    .map(p => {
      const m = p.latest_member!
      return {
        tvfy_id: p.id,
        name: `${m.name.first} ${m.name.last}`,
        electorate: m.electorate ?? null,
        party: m.party ?? null,
        house: m.house,
        image_url: null,
        synced_at: now,
      }
    })

  const { error } = await supabase
    .from('members')
    .upsert(memberRows, { onConflict: 'tvfy_id' })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ synced: memberRows.length })
}

/**
 * POST /api/sync/members
 * Manual trigger. Auth: x-sync-secret header.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const apiKey = process.env.THEYVOTEFORYOU_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'THEYVOTEFORYOU_API_KEY not configured' }, { status: 500 })
  }
  return syncMembers(apiKey)
}

/**
 * GET /api/sync/members
 * Called by Vercel cron (Authorization: Bearer CRON_SECRET).
 */
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const apiKey = process.env.THEYVOTEFORYOU_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'THEYVOTEFORYOU_API_KEY not configured' }, { status: 500 })
  }
  return syncMembers(apiKey)
}
