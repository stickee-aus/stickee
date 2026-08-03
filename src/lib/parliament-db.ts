/**
 * Server-side data access layer for parliamentary data.
 * Reads from Supabase tables populated by the sync routes.
 * Returns empty arrays when the DB has no data yet (components fall back to mock data).
 */

import { createClient } from '@supabase/supabase-js'
import type { MP, Party } from '@/types'
import type { BillVoteRow, PartyBillVote, VoteDirection } from '@/lib/mock-parliament-data'

// ─── Supabase client (anon key, read-only) ────────────────────────────────────

function createReadClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ─── Party name normalisation ────────────────────────────────────────────────
// Maps TheyVoteForYou party strings to our app's Party union.

const PARTY_MAP: Record<string, Party> = {
  'Australian Labor Party': 'Labor',
  'Liberal Party of Australia': 'Coalition',
  'The Nationals': 'Coalition',
  'National Party of Australia': 'Coalition',
  'Liberal National Party of Queensland': 'Coalition',
  'Country Liberal Party': 'Coalition',
  'Australian Greens': 'Greens',
  'Centre Alliance': 'Centre Alliance',
  "Katter's Australian Party": "Katter's Australian Party",
  "Katter's Australian Party (KAP)": "Katter's Australian Party",
  "Pauline Hanson's One Nation": 'One Nation',
  "Pauline Hanson's One Nation Party": 'One Nation',
  'One Nation': 'One Nation',
  'Jacqui Lambie Network': 'Jacqui Lambie Network',
  'United Australia Party': 'United Australia Party',
  "Australia's Voice": "Australia's Voice",
  'Independent': 'Independent',
}

function normaliseParty(raw: string | null): Party {
  if (!raw) return 'Independent'
  return PARTY_MAP[raw] ?? raw
}

// ─── DB row types ─────────────────────────────────────────────────────────────

interface DBMember {
  tvfy_id: number
  name: string
  electorate: string | null
  party: string | null
  house: string
  image_url: string | null
}

interface DBDivision {
  tvfy_id: number
  name: string
  date: string
  passed: boolean | null
  aye_count: number
  no_count: number
  abstain_count: number
}

interface DBMemberVote {
  member_tvfy_id: number
  division_tvfy_id: number
  vote: 'aye' | 'no' | 'abstain'
}

// ─── Transformation helpers ───────────────────────────────────────────────────

function mpId(tvfyId: number): string {
  return `tvfy-${tvfyId}`
}

function transformMember(m: DBMember, seatIndex: number): MP {
  return {
    id: mpId(m.tvfy_id),
    name: m.name,
    party: normaliseParty(m.party),
    electorate: m.electorate ?? '',
    seatIndex,
    stickeeScore: 0,
  }
}

function buildPartyVotes(
  membersByTvfyId: Map<number, DBMember>,
  votesForDivision: DBMemberVote[],
  publicPrediction: number
): Record<string, PartyBillVote> {
  // Aggregate votes per party
  const partyMap: Record<string, { for: string[]; against: string[]; abstain: string[] }> = {}

  for (const v of votesForDivision) {
    const member = membersByTvfyId.get(v.member_tvfy_id)
    if (!member) continue
    const party = normaliseParty(member.party)
    if (!partyMap[party]) partyMap[party] = { for: [], against: [], abstain: [] }
    if (v.vote === 'aye') partyMap[party].for.push(member.name)
    else if (v.vote === 'no') partyMap[party].against.push(member.name)
    else partyMap[party].abstain.push(member.name)
  }

  const result: Record<string, PartyBillVote> = {}
  for (const [party, counts] of Object.entries(partyMap)) {
    const forN = counts.for.length
    const againstN = counts.against.length
    const abstainN = counts.abstain.length
    const total = forN + againstN + abstainN

    let direction: VoteDirection
    if (abstainN === total) direction = 'abstain'
    else if (forN === 0) direction = 'against'
    else if (againstN === 0) direction = 'for'
    else direction = 'split'

    // Key MPs: pick a couple notable names
    const publicLeanFor = publicPrediction >= 50
    const keyMPs: string[] = []
    if (direction === 'split') {
      const against = counts.against[0]
      const forMp = counts.for[0]
      if (forMp) keyMPs.push(`${forMp} (For)`)
      if (against) keyMPs.push(`${against} (Against)`)
    } else {
      const list = publicLeanFor ? counts.for : counts.against
      keyMPs.push(...list.slice(0, 2))
    }

    result[party] = {
      party,
      direction,
      forCount: forN,
      againstCount: againstN,
      abstainCount: abstainN,
      totalSeats: total,
      keyMPs,
    }
  }

  return result
}

function transformDivision(
  d: DBDivision,
  votesForDivision: DBMemberVote[],
  membersByTvfyId: Map<number, DBMember>
): BillVoteRow {
  // Use passed flag as proxy for publicPrediction if no market data
  const publicPrediction = d.passed === true ? 75 : d.passed === false ? 25 : 50
  const total = d.aye_count + d.no_count
  const controversy = total > 0
    ? Math.round(100 - Math.abs((d.aye_count / total) * 100 - 50) * 2)
    : 50

  const parties = buildPartyVotes(membersByTvfyId, votesForDivision, publicPrediction)

  return {
    id: `tvfy-${d.tvfy_id}`,
    name: d.name,
    status: d.passed === true ? 'passed' : d.passed === false ? 'failed' : 'ongoing',
    publicPrediction,
    change: 0,
    volume: d.aye_count + d.no_count + d.abstain_count,
    sparkline: [],
    parties,
    totalFor: d.aye_count,
    totalAgainst: d.no_count,
    totalAbstain: d.abstain_count,
    controversy,
    eli15: d.name,
    tags: [],
    publicSupport: publicPrediction,
    affectedGroups: [],
    campaignCount: 0,
    campaignDailyGrowth: 0,
    swingMPIds: [],
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ParliamentDBData {
  /** Transformed members (House only, sorted by party) */
  members: MP[]
  /** Lookup by MP id (e.g. 'tvfy-10001') */
  memberIndex: Record<string, MP>
  /** State for each MP id */
  memberStates: Record<string, string>
  /** Electorate name → MP id */
  electorateMPMap: Record<string, string>
  /** Recent divisions as BillVoteRow (most recent 20) */
  bills: BillVoteRow[]
  /**
   * Vote matrix: billId → mpId → 'for'|'against'|'absent'
   * Used by MPDrilldownTable to display per-MP vote breakdown.
   */
  voteMatrix: Record<string, Record<string, 'for' | 'against' | 'absent'>>
}

/**
 * Fetches all parliament data from Supabase.
 * Returns null if the DB tables are empty — components should fall back to mock data.
 */
export async function getParliamentDBData(): Promise<ParliamentDBData | null> {
  const supabase = createReadClient()

  const [membersRes, divisionsRes, votesRes] = await Promise.all([
    supabase
      .from('members')
      .select('tvfy_id, name, electorate, party, house, image_url')
      .eq('house', 'representatives'),
    supabase
      .from('divisions')
      .select('tvfy_id, name, date, passed, aye_count, no_count, abstain_count')
      .eq('house', 'representatives')
      .order('date', { ascending: false })
      .limit(20),
    supabase
      .from('member_votes')
      .select('member_tvfy_id, division_tvfy_id, vote'),
  ])

  const rawMembers: DBMember[] = membersRes.data ?? []
  const rawDivisions: DBDivision[] = divisionsRes.data ?? []
  const rawVotes: DBMemberVote[] = votesRes.data ?? []

  // If DB has no data yet, signal fallback
  if (rawMembers.length === 0 || rawDivisions.length === 0) return null

  // Build a member lookup map
  const membersByTvfyId = new Map(rawMembers.map(m => [m.tvfy_id, m]))

  // Transform members
  const members: MP[] = rawMembers.map((m, i) => transformMember(m, i))
  const memberIndex: Record<string, MP> = Object.fromEntries(members.map(m => [m.id, m]))

  // Build electorate map (electorate → MP id)
  const electorateMPMap: Record<string, string> = {}
  for (const m of rawMembers) {
    if (m.electorate) electorateMPMap[m.electorate] = mpId(m.tvfy_id)
  }

  // State is not in TVFY data — leave empty for now (UI shows '—')
  const memberStates: Record<string, string> = {}

  // Group votes by division
  const votesByDivision = new Map<number, DBMemberVote[]>()
  for (const v of rawVotes) {
    if (!votesByDivision.has(v.division_tvfy_id)) votesByDivision.set(v.division_tvfy_id, [])
    votesByDivision.get(v.division_tvfy_id)!.push(v)
  }

  // Transform divisions to BillVoteRow
  const bills: BillVoteRow[] = rawDivisions.map(d =>
    transformDivision(d, votesByDivision.get(d.tvfy_id) ?? [], membersByTvfyId)
  )

  // Build vote matrix: billId → mpId → vote direction
  const voteMatrix: Record<string, Record<string, 'for' | 'against' | 'absent'>> = {}
  for (const d of rawDivisions) {
    const billId = `tvfy-${d.tvfy_id}`
    voteMatrix[billId] = {}
    for (const v of votesByDivision.get(d.tvfy_id) ?? []) {
      const mId = mpId(v.member_tvfy_id)
      const dir = v.vote === 'aye' ? 'for' : v.vote === 'no' ? 'against' : 'absent'
      voteMatrix[billId][mId] = dir
    }
  }

  return { members, memberIndex, memberStates, electorateMPMap, bills, voteMatrix }
}
