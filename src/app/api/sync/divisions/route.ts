import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import type { NextRequest } from 'next/server'

const TVFY_BASE = 'https://theyvoteforyou.org.au/api/v1'

// Shape from /api/v1/divisions.json (list endpoint)
interface TVFYDivisionSummary {
  id: number
  house: 'representatives' | 'senate'
  name: string
  date: string
  aye_votes: number
  no_votes: number
  summary: string
  rebellions: number
}

// Shape from /api/v1/divisions/{id}.json (detail endpoint)
interface TVFYDivisionDetail extends TVFYDivisionSummary {
  votes: Array<{
    vote: 'aye' | 'no'
    member: {
      id: number           // member ID (not person ID)
      person: { id: number } // person ID — matches people.json top-level id
      first_name: string
      last_name: string
      electorate: string
      party: string
    }
  }>
}

/**
 * POST /api/sync/divisions
 * Fetches recent divisions from TheyVoteForYou and upserts to Supabase.
 * Fetches the top `limit` most recent divisions individually to get per-member votes.
 *
 * Query params:
 *   from=YYYY-MM-DD  (default: 1 year ago)
 *   house=representatives|senate  (default: representatives)
 *   limit=N  (default: 50 — number of divisions to fetch in detail)
 *
 * Header: x-sync-secret: <SYNC_SECRET>
 */
export async function POST(request: NextRequest) {
  if (request.headers.get('x-sync-secret') !== process.env.SYNC_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.THEYVOTEFORYOU_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'THEYVOTEFORYOU_API_KEY not configured' }, { status: 500 })
  }

  const { searchParams } = request.nextUrl
  const house = searchParams.get('house') ?? 'representatives'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)

  const defaultFrom = new Date()
  defaultFrom.setFullYear(defaultFrom.getFullYear() - 1)
  const from = searchParams.get('from') ?? defaultFrom.toISOString().slice(0, 10)

  // 1. Fetch division list
  const listRes = await fetch(
    `${TVFY_BASE}/divisions.json?key=${encodeURIComponent(apiKey)}&from=${from}&house=${house}`,
    { next: { revalidate: 0 } }
  )
  if (!listRes.ok) {
    return Response.json({ error: 'TVFY list error', upstream: listRes.status }, { status: 502 })
  }

  const summaries: TVFYDivisionSummary[] = await listRes.json()
  const toFetch = summaries.slice(0, limit)

  // 2. Fetch detail for each division (with a small delay to be polite)
  const details: TVFYDivisionDetail[] = []
  for (const s of toFetch) {
    const detailRes = await fetch(
      `${TVFY_BASE}/divisions/${s.id}.json?key=${encodeURIComponent(apiKey)}`,
      { next: { revalidate: 0 } }
    )
    if (detailRes.ok) {
      details.push(await detailRes.json())
    }
    // Small delay to avoid hammering the API
    await new Promise(r => setTimeout(r, 50))
  }

  const supabase = createAdminSupabaseClient()
  const now = new Date().toISOString()

  // 3. Upsert division rows
  const divisionRows = details.map(d => ({
    tvfy_id: d.id,
    name: d.name,
    date: d.date,
    house: d.house,
    source_url: `https://theyvoteforyou.org.au/divisions/${d.house}/${d.date}/${d.id}`,
    summary: d.summary ?? null,
    passed: d.aye_votes > d.no_votes,
    aye_count: d.aye_votes,
    no_count: d.no_votes,
    abstain_count: 0, // TVFY doesn't track abstentions separately
    synced_at: now,
  }))

  const { error: divErr } = await supabase
    .from('divisions')
    .upsert(divisionRows, { onConflict: 'tvfy_id' })

  if (divErr) {
    return Response.json({ error: divErr.message }, { status: 500 })
  }

  // 4. Collect member_vote rows
  type VoteRow = { member_tvfy_id: number; division_tvfy_id: number; vote: 'aye' | 'no' | 'abstain' }
  const voteRows: VoteRow[] = []

  for (const d of details) {
    for (const v of d.votes ?? []) {
      voteRows.push({
        member_tvfy_id: v.member.person.id,
        division_tvfy_id: d.id,
        vote: v.vote,
      })
    }
  }

  // 5. Batch upsert votes in chunks of 500
  let totalVotes = 0
  for (let i = 0; i < voteRows.length; i += 500) {
    const chunk = voteRows.slice(i, i + 500)
    const { error } = await supabase
      .from('member_votes')
      .upsert(chunk, { onConflict: 'member_tvfy_id,division_tvfy_id' })
    if (error) {
      return Response.json({ error: error.message, chunk: i }, { status: 500 })
    }
    totalVotes += chunk.length
  }

  return Response.json({
    divisions: divisionRows.length,
    votes: totalVotes,
    skipped: summaries.length - toFetch.length,
  })
}
