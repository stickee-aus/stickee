import { MPs as MOCK_HOUSE_MPS, PARTY_COLORS as MOCK_PARTY_COLORS } from '@/lib/mock-data'
import { SENATE_SEAT_COUNTS as MOCK_SENATE_SEAT_COUNTS } from '@/lib/mock-senate-data'
import type { MP } from '@/types'

export type ChamberName = 'representatives' | 'senate'

export interface ParliamentSourceMember {
  name: string
  electorate: string | null
  party: string | null
  house: ChamberName
}

export interface LiveParliamentMember extends MP {
  house: ChamberName
  rawParty: string | null
}

export interface ChamberMembersPayload {
  members: LiveParliamentMember[]
  countsByParty: Record<string, number>
  total: number
}

export interface LiveParliamentPayload {
  source: 'supabase' | 'tvfy' | 'mock'
  syncedAt: string | null
  house: ChamberMembersPayload
  senate: ChamberMembersPayload
}

export const LIVE_PARTY_COLORS: Record<string, string> = {
  ...MOCK_PARTY_COLORS,
  'Jacqui Lambie Network': '#7C3AED',
  'United Australia Party': '#F59E0B',
  "Australia's Voice": '#14B8A6',
}

export const LIVE_PARTY_SHORT: Record<string, string> = {
  Labor: 'ALP',
  Coalition: 'LIB/NAT',
  Greens: 'GRN',
  Independent: 'IND',
  'Centre Alliance': 'CA',
  "Katter's Australian Party": 'KAP',
  'One Nation': 'ONP',
  'Jacqui Lambie Network': 'JLN',
  'United Australia Party': 'UAP',
  "Australia's Voice": 'AV',
}

const HOUSE_PARTY_ORDER = [
  'Labor',
  'Greens',
  'Independent',
  'Centre Alliance',
  "Katter's Australian Party",
  'One Nation',
  'Coalition',
] as const

export const SENATE_PARTY_ORDER = [
  'Labor',
  'Greens',
  'Independent',
  "Australia's Voice",
  'Jacqui Lambie Network',
  'United Australia Party',
  'Coalition',
  'One Nation',
] as const

const mockHouseByElectorate = new Map(
  MOCK_HOUSE_MPS.map(mp => [mp.electorate.toLowerCase(), mp])
)

function compareMembers(a: ParliamentSourceMember, b: ParliamentSourceMember) {
  const electorateA = a.electorate ?? ''
  const electorateB = b.electorate ?? ''
  const electorateCmp = electorateA.localeCompare(electorateB)
  if (electorateCmp !== 0) return electorateCmp
  return a.name.localeCompare(b.name)
}

function sortPartyKeys(countsByParty: Record<string, number>, partyOrder: readonly string[]) {
  const base = partyOrder.filter(party => (countsByParty[party] ?? 0) > 0)
  const extras = Object.keys(countsByParty)
    .filter(party => !partyOrder.includes(party) && countsByParty[party] > 0)
    .sort((a, b) => a.localeCompare(b))
  return [...base, ...extras]
}

export function normaliseParty(rawParty: string | null): string {
  if (!rawParty) return 'Independent'

  const party = rawParty.trim()

  if (party === 'Australian Labor Party') return 'Labor'
  if (
    party === 'Liberal Party of Australia' ||
    party === 'The Nationals' ||
    party === 'National Party of Australia' ||
    party === 'Liberal National Party of Queensland' ||
    party === 'Country Liberal Party'
  ) {
    return 'Coalition'
  }
  if (party === 'Australian Greens') return 'Greens'
  if (party === 'Centre Alliance') return 'Centre Alliance'
  if (party === "Katter's Australian Party" || party === "Katter's Australian Party (KAP)") {
    return "Katter's Australian Party"
  }
  if (
    party === "Pauline Hanson's One Nation" ||
    party === "Pauline Hanson's One Nation Party" ||
    party === 'One Nation'
  ) {
    return 'One Nation'
  }
  if (party === 'Jacqui Lambie Network') return 'Jacqui Lambie Network'
  if (party === 'United Australia Party') return 'United Australia Party'
  if (party === "Australia's Voice") return "Australia's Voice"
  if (party === 'Independent') return 'Independent'

  return party
}

function buildHouseMembers(rows: ParliamentSourceMember[]): LiveParliamentMember[] {
  const unmatched: ParliamentSourceMember[] = []
  const members = rows.map((row, index) => {
    const electorateKey = (row.electorate ?? '').toLowerCase()
    const mockSeat = mockHouseByElectorate.get(electorateKey)

    if (!mockSeat) unmatched.push(row)

    return {
      id: mockSeat?.id ?? `house-live-${index + 1}`,
      name: row.name,
      party: normaliseParty(row.party),
      electorate: row.electorate ?? '',
      seatIndex: mockSeat?.seatIndex ?? MOCK_HOUSE_MPS.length + unmatched.length - 1,
      stickeeScore: mockSeat?.stickeeScore ?? 0,
      house: 'representatives' as const,
      rawParty: row.party,
    }
  })

  return members.sort((a, b) => a.seatIndex - b.seatIndex)
}

function buildSenateMembers(rows: ParliamentSourceMember[]): LiveParliamentMember[] {
  const partyBuckets = new Map<string, ParliamentSourceMember[]>()

  for (const row of rows) {
    const party = normaliseParty(row.party)
    const bucket = partyBuckets.get(party) ?? []
    bucket.push(row)
    partyBuckets.set(party, bucket)
  }

  const orderedParties = sortPartyKeys(
    Object.fromEntries(Array.from(partyBuckets.entries()).map(([party, bucket]) => [party, bucket.length])),
    SENATE_PARTY_ORDER,
  )

  const members: LiveParliamentMember[] = []

  for (const party of orderedParties) {
    const bucket = (partyBuckets.get(party) ?? []).sort(compareMembers)
    bucket.forEach((row, index) => {
      members.push({
        id: `senate-${party.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index + 1}`,
        name: row.name,
        party,
        electorate: row.electorate ?? '',
        seatIndex: members.length,
        stickeeScore: 0,
        house: 'senate',
        rawParty: row.party,
      })
    })
  }

  return members
}

function buildCountsByParty(members: LiveParliamentMember[], partyOrder: readonly string[]) {
  const counts = members.reduce<Record<string, number>>((acc, member) => {
    acc[member.party] = (acc[member.party] ?? 0) + 1
    return acc
  }, {})

  return Object.fromEntries(
    sortPartyKeys(counts, partyOrder).map(party => [party, counts[party]])
  )
}

export function buildLiveParliamentPayload(
  sourceMembers: ParliamentSourceMember[],
  source: LiveParliamentPayload['source'],
  syncedAt: string | null,
): LiveParliamentPayload {
  const houseRows = sourceMembers
    .filter(member => member.house === 'representatives')
    .sort(compareMembers)
  const senateRows = sourceMembers
    .filter(member => member.house === 'senate')
    .sort(compareMembers)

  const houseMembers = buildHouseMembers(houseRows)
  const senateMembers = buildSenateMembers(senateRows)

  return {
    source,
    syncedAt,
    house: {
      members: houseMembers,
      countsByParty: buildCountsByParty(houseMembers, HOUSE_PARTY_ORDER),
      total: houseMembers.length,
    },
    senate: {
      members: senateMembers,
      countsByParty: buildCountsByParty(senateMembers, SENATE_PARTY_ORDER),
      total: senateMembers.length,
    },
  }
}

export function buildMockParliamentPayload(): LiveParliamentPayload {
  const houseMembers: LiveParliamentMember[] = MOCK_HOUSE_MPS.map(mp => ({
    ...mp,
    house: 'representatives',
    rawParty: mp.party,
  }))

  return {
    source: 'mock',
    syncedAt: null,
    house: {
      members: houseMembers,
      countsByParty: buildCountsByParty(houseMembers, HOUSE_PARTY_ORDER),
      total: houseMembers.length,
    },
    senate: {
      members: [],
      countsByParty: Object.fromEntries(
        sortPartyKeys(MOCK_SENATE_SEAT_COUNTS, SENATE_PARTY_ORDER).map(party => [party, MOCK_SENATE_SEAT_COUNTS[party]])
      ),
      total: Object.values(MOCK_SENATE_SEAT_COUNTS).reduce((sum, count) => sum + count, 0),
    },
  }
}
