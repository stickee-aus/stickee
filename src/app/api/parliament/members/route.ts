import { createClient } from '@supabase/supabase-js'
import {
  buildLiveParliamentPayload,
  buildMockParliamentPayload,
  type ParliamentSourceMember,
} from '@/lib/live-parliament'

interface DBMemberRow {
  name: string
  electorate: string | null
  party: string | null
  house: 'representatives' | 'senate'
  synced_at: string | null
}

interface TVFYPerson {
  latest_member: {
    name: { first: string; last: string }
    electorate: string | null
    house: 'representatives' | 'senate'
    party: string | null
  } | null
}

const TVFY_BASE = 'https://theyvoteforyou.org.au/api/v1'
const STALE_AFTER_MS = 12 * 60 * 60 * 1000

function createReadClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function rowsToSourceMembers(rows: DBMemberRow[]): ParliamentSourceMember[] {
  return rows.map(row => ({
    name: row.name,
    electorate: row.electorate,
    party: row.party,
    house: row.house,
  }))
}

function isFresh(syncedAt: string | null) {
  if (!syncedAt) return false
  return Date.now() - new Date(syncedAt).getTime() < STALE_AFTER_MS
}

async function readSupabaseMembers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) return null

  const supabase = createReadClient()
  const { data, error } = await supabase
    .from('members')
    .select('name, electorate, party, house, synced_at')
    .order('house')
    .order('name')

  if (error || !data?.length) return null

  const latestSyncedAt = data.reduce<string | null>((latest, row) => {
    if (!row.synced_at) return latest
    if (!latest) return row.synced_at
    return new Date(row.synced_at) > new Date(latest) ? row.synced_at : latest
  }, null)

  return {
    members: rowsToSourceMembers(data as DBMemberRow[]),
    syncedAt: latestSyncedAt,
  }
}

async function fetchTvfyMembers() {
  const apiKey = process.env.THEYVOTEFORYOU_API_KEY
  if (!apiKey) return null

  const response = await fetch(
    `${TVFY_BASE}/people.json?key=${encodeURIComponent(apiKey)}`,
    { cache: 'no-store' }
  )

  if (!response.ok) return null

  const people = await response.json() as TVFYPerson[]

  const members: ParliamentSourceMember[] = people
    .map(person => person.latest_member)
    .filter((member): member is NonNullable<TVFYPerson['latest_member']> => member !== null)
    .map(member => ({
      name: `${member.name.first} ${member.name.last}`.trim(),
      electorate: member.electorate,
      party: member.party,
      house: member.house,
    }))

  return {
    members,
    syncedAt: new Date().toISOString(),
  }
}

export async function GET() {
  try {
    const supabaseData = await readSupabaseMembers().catch(() => null)

    if (supabaseData && isFresh(supabaseData.syncedAt)) {
      return Response.json(
        buildLiveParliamentPayload(supabaseData.members, 'supabase', supabaseData.syncedAt)
      )
    }

    const tvfyData = await fetchTvfyMembers().catch(() => null)
    if (tvfyData?.members.length) {
      return Response.json(
        buildLiveParliamentPayload(tvfyData.members, 'tvfy', tvfyData.syncedAt)
      )
    }

    if (supabaseData?.members.length) {
      return Response.json(
        buildLiveParliamentPayload(supabaseData.members, 'supabase', supabaseData.syncedAt)
      )
    }
  } catch {
    // Fall through to mock payload.
  }

  return Response.json(buildMockParliamentPayload())
}
