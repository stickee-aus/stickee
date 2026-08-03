import { LIVE_PARTY_COLORS, LIVE_PARTY_SHORT, normaliseParty } from '@/lib/live-parliament'
import {
  buildInactiveElectionSnapshot,
  type ElectionCandidateSummary,
  type ElectionHouseSeat,
  type ElectionPartyCount,
  type ElectionSeatStatus,
  type ElectionSenateState,
  type LiveElectionSnapshot,
} from '@/lib/aec-election-types'

const AEC_TALLY_ROOM_ROOT = 'https://tallyroom.aec.gov.au/'
const FETCH_REVALIDATE_SECONDS = 90

interface ParsedFile<Row> {
  meta: {
    eventId: string | null
    phase: string | null
    generatedAt: string | null
  }
  rows: Row[]
}

interface LinkEntry {
  href: string
  text: string
}

interface ActiveEvent {
  eventId: string
  name: string
  houseMenuUrl: string
  senateMenuUrl: string
  resultsUrl: string
}

interface HouseDivisionRow {
  DivisionID: string
  DivisionNm: string
  StateAb: string
  Enrolment: string
  TotalVotes: string
  TotalPercentage: string
}

interface HouseMemberRow {
  DivisionID: string
  CandidateID: string
  GivenNm: string
  Surname: string
  PartyNm: string
  PartyAb: string
}

interface HouseFirstPrefRow {
  DivisionID: string
  DivisionNm: string
  CandidateID: string
  GivenNm: string
  Surname: string
  Elected: string
  PartyAb: string
  PartyNm: string
  TotalVotes: string
  Swing: string
}

interface HouseTcpRow {
  DivisionID: string
  DivisionNm: string
  CandidateID: string
  GivenNm: string
  Surname: string
  Elected: string
  PartyAb: string
  PartyNm: string
  OrdinaryVotes: string
}

interface SenateVoteRow {
  StateAb: string
  Group: string
  BallotPosition: string
  PartyName: string
  TotalVotes: string
}

interface SenateCountRow {
  StateAb: string
  Enrolment: string
  TotalVotes: string
  TotalPercentage: string
}

interface CandidateAccumulator {
  candidateId: string
  candidate: string
  party: string
  partyShort: string
  votes: number
  swing: number | null
  elected: boolean
}

function toNumber(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function round(value: number | null, digits = 1) {
  if (value === null) return null
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function normaliseKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
}

function stripTags(value: string) {
  return decodeEntities(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function parseLinks(html: string): LinkEntry[] {
  const links: LinkEntry[] = []
  const regex = /<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let match = regex.exec(html)
  while (match) {
    links.push({
      href: decodeEntities(match[1]),
      text: stripTags(match[2]),
    })
    match = regex.exec(html)
  }
  return links
}

async function fetchText(url: string, revalidateSeconds = FETCH_REVALIDATE_SECONDS) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/plain,text/html;q=0.9,*/*;q=0.8',
    },
    next: {
      revalidate: revalidateSeconds,
    },
  })

  if (!response.ok) {
    throw new Error(`AEC request failed (${response.status}) for ${url}`)
  }

  return response.text()
}

function parseFile<Row>(text: string): ParsedFile<Row> {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trimEnd())
    .filter(Boolean)

  if (lines.length < 2) {
    return {
      meta: { eventId: null, phase: null, generatedAt: null },
      rows: [],
    }
  }

  const metaLine = lines[0]
  const headerLine = lines[1]
  const delimiter = headerLine.includes('\t') ? '\t' : ','
  const headers = headerLine.split(delimiter).map(header => header.trim())

  const rows = lines.slice(2).map(line => {
    const columns = line.split(delimiter)
    return Object.fromEntries(headers.map((header, index) => [header, columns[index] ?? ''])) as Row
  })

  return {
    meta: {
      eventId: metaLine.match(/Event:(\d+)/)?.[1] ?? null,
      phase: metaLine.match(/Phase:([A-Za-z]+)/)?.[1] ?? null,
      generatedAt: metaLine.match(/Generated:([0-9T:\-]+)/)?.[1] ?? null,
    },
    rows,
  }
}

function latestTimestamp(...values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  return values.find((value): value is string => Boolean(value)) ?? null
}

function normaliseElectionParty(partyName: string, partyAb: string) {
  if (partyAb === 'ALP' || /labor/i.test(partyName)) return 'Labor'
  if (['LP', 'LNP', 'NP', 'CLP'].includes(partyAb) || /liberal|national/i.test(partyName)) return 'Coalition'
  if (partyAb === 'GRN' || /greens/i.test(partyName)) return 'Greens'
  if (partyAb === 'IND' || /independent/i.test(partyName)) return 'Independent'
  if (partyAb === 'XEN' || /centre alliance/i.test(partyName)) return 'Centre Alliance'
  if (partyAb === 'KAP' || /katter/i.test(partyName)) return "Katter's Australian Party"
  if (partyAb === 'ON' || /one nation/i.test(partyName)) return 'One Nation'
  if (partyAb === 'JLN' || /jacqui lambie/i.test(partyName)) return 'Jacqui Lambie Network'
  if (partyAb === 'UAP' || /united australia/i.test(partyName)) return 'United Australia Party'
  if (partyAb === 'AV' || /australia'?s voice/i.test(partyName)) return "Australia's Voice"
  if (!partyName.trim() && !partyAb.trim()) return 'Independent'
  return normaliseParty(partyName || partyAb || 'Independent')
}

function toPartyShort(party: string, partyAb: string) {
  if (LIVE_PARTY_SHORT[party]) return LIVE_PARTY_SHORT[party]
  if (partyAb) return partyAb
  return party.slice(0, 3).toUpperCase()
}

function partyBucket(party: string) {
  if (party === 'Labor') return 'Labor'
  if (party === 'Coalition') return 'Coalition'
  if (party === 'Greens') return 'Greens'
  return 'Crossbench'
}

function candidateSummary(candidate: CandidateAccumulator, totalVotes: number): ElectionCandidateSummary {
  return {
    candidateId: candidate.candidateId,
    candidate: candidate.candidate,
    party: candidate.party,
    partyShort: candidate.partyShort,
    votes: candidate.votes,
    pct: totalVotes > 0 ? round((candidate.votes / totalVotes) * 100, 2) : null,
    swing: round(candidate.swing, 2),
  }
}

async function discoverActiveFederalEvent(): Promise<ActiveEvent | null> {
  const response = await fetch(AEC_TALLY_ROOM_ROOT, {
    headers: {
      accept: 'text/html,*/*;q=0.8',
    },
    next: {
      revalidate: 300,
    },
  })

  if (!response.ok) {
    return null
  }

  const html = await response.text()
  if (!/Federal Election/i.test(html)) {
    return null
  }

  const links = parseLinks(html)
  const houseLink = links.find(link =>
    /HouseDownloadsMenu/i.test(link.href) ||
    (/house of representatives/i.test(link.text) && /downloads/i.test(link.text))
  )
  const senateLink = links.find(link =>
    /SenateDownloadsMenu/i.test(link.href) ||
    (/senate/i.test(link.text) && /downloads/i.test(link.text))
  )

  if (!houseLink || !senateLink) {
    return null
  }

  const eventIdMatch = `${houseLink.href} ${senateLink.href}`.match(/(\d{4,})/)
  const eventId = eventIdMatch?.[1] ?? null
  if (!eventId) {
    return null
  }

  const eventName = html.match(/(\d{4}\s+Federal Election)/i)?.[1] ?? 'Federal Election'

  return {
    eventId,
    name: eventName,
    houseMenuUrl: new URL(houseLink.href, AEC_TALLY_ROOM_ROOT).toString(),
    senateMenuUrl: new URL(senateLink.href, AEC_TALLY_ROOM_ROOT).toString(),
    resultsUrl: AEC_TALLY_ROOM_ROOT,
  }
}

function downloadUrl(menuUrl: string, filename: string) {
  return new URL(`Downloads/${filename}`, menuUrl).toString()
}

function buildHouseCandidates(rows: HouseFirstPrefRow[]) {
  const byDivision = new Map<string, CandidateAccumulator[]>()

  for (const row of rows) {
    if (row.CandidateID === '999' || /informal/i.test(row.Surname)) continue

    const party = normaliseElectionParty(row.PartyNm ?? '', row.PartyAb ?? '')
    const candidate: CandidateAccumulator = {
      candidateId: row.CandidateID,
      candidate: `${row.GivenNm} ${row.Surname}`.trim(),
      party,
      partyShort: toPartyShort(party, row.PartyAb ?? ''),
      votes: toNumber(row.TotalVotes) ?? 0,
      swing: toNumber(row.Swing),
      elected: row.Elected === 'Y',
    }

    const current = byDivision.get(row.DivisionID) ?? []
    current.push(candidate)
    byDivision.set(row.DivisionID, current)
  }

  return byDivision
}

function buildTcpCandidates(rows: HouseTcpRow[]) {
  const byDivision = new Map<string, Map<string, CandidateAccumulator>>()

  for (const row of rows) {
    const party = normaliseElectionParty(row.PartyNm ?? '', row.PartyAb ?? '')
    const division = byDivision.get(row.DivisionID) ?? new Map<string, CandidateAccumulator>()
    const existing = division.get(row.CandidateID)

    if (existing) {
      existing.votes += toNumber(row.OrdinaryVotes) ?? 0
      existing.elected = existing.elected || row.Elected === 'Y'
    } else {
      division.set(row.CandidateID, {
        candidateId: row.CandidateID,
        candidate: `${row.GivenNm} ${row.Surname}`.trim(),
        party,
        partyShort: toPartyShort(party, row.PartyAb ?? ''),
        votes: toNumber(row.OrdinaryVotes) ?? 0,
        swing: null,
        elected: row.Elected === 'Y',
      })
    }

    byDivision.set(row.DivisionID, division)
  }

  return new Map(
    Array.from(byDivision.entries()).map(([divisionId, candidates]) => [
      divisionId,
      Array.from(candidates.values()),
    ])
  )
}

function buildHouseSeats(
  divisions: HouseDivisionRow[],
  calledRows: HouseMemberRow[],
  firstPrefs: HouseFirstPrefRow[],
  tcpRows: HouseTcpRow[],
  sourceUrl: string,
  updatedAt: string | null,
): ElectionHouseSeat[] {
  const calledByDivision = new Map(calledRows.map(row => [
    row.DivisionID,
    {
      candidateId: row.CandidateID,
      candidate: `${row.GivenNm} ${row.Surname}`.trim(),
      party: normaliseElectionParty(row.PartyNm ?? '', row.PartyAb ?? ''),
      partyShort: toPartyShort(
        normaliseElectionParty(row.PartyNm ?? '', row.PartyAb ?? ''),
        row.PartyAb ?? ''
      ),
    },
  ]))
  const firstByDivision = buildHouseCandidates(firstPrefs)
  const tcpByDivision = buildTcpCandidates(tcpRows)

  return divisions.map(row => {
    const firstCandidates = [...(firstByDivision.get(row.DivisionID) ?? [])].sort((a, b) => b.votes - a.votes)
    const tcpCandidates = [...(tcpByDivision.get(row.DivisionID) ?? [])].sort((a, b) => b.votes - a.votes)
    const called = calledByDivision.get(row.DivisionID) ?? null
    const totalFirstVotes = firstCandidates.reduce((sum, candidate) => sum + candidate.votes, 0)
    const totalTcpVotes = tcpCandidates.reduce((sum, candidate) => sum + candidate.votes, 0)
    const leadingFromTcp = tcpCandidates[0] ? candidateSummary(tcpCandidates[0], totalTcpVotes) : null
    const runnerFromTcp = tcpCandidates[1] ? candidateSummary(tcpCandidates[1], totalTcpVotes) : null
    const leadingFromFirst = firstCandidates[0] ? candidateSummary(firstCandidates[0], totalFirstVotes) : null
    const runnerFromFirst = firstCandidates[1] ? candidateSummary(firstCandidates[1], totalFirstVotes) : null
    const leadingCandidate = leadingFromTcp ?? leadingFromFirst
    const runnerUpCandidate = runnerFromTcp ?? runnerFromFirst
    const marginPct = leadingCandidate && runnerUpCandidate && leadingCandidate.pct !== null && runnerUpCandidate.pct !== null
      ? round(leadingCandidate.pct - runnerUpCandidate.pct, 2)
      : null
    const reportingProgressPct = round(toNumber(row.TotalPercentage), 2)

    let status: ElectionSeatStatus = 'no-data'
    if (called) {
      status = 'called'
    } else if (leadingCandidate && (toNumber(row.TotalVotes) ?? 0) > 0) {
      status = marginPct !== null && marginPct < 1 ? 'too-close' : 'leading'
    }

    if ((toNumber(row.TotalVotes) ?? 0) === 0) {
      status = 'no-data'
    }

    return {
      chamber: 'house',
      divisionId: row.DivisionID,
      electorate: row.DivisionNm,
      state: row.StateAb,
      status,
      reportingProgressPct,
      enrolment: toNumber(row.Enrolment),
      totalVotes: toNumber(row.TotalVotes),
      leadingCandidate: called && leadingCandidate
        ? { ...leadingCandidate, party: called.party, partyShort: called.partyShort }
        : leadingCandidate,
      runnerUpCandidate,
      tcpLeader: leadingFromTcp,
      tcpRunnerUp: runnerFromTcp,
      tcpPct: leadingFromTcp?.pct ?? null,
      marginPct,
      updatedAt,
      sourceUrl,
    }
  })
}

function buildSenateStates(
  rows: SenateVoteRow[],
  countRows: SenateCountRow[],
  sourceUrl: string,
  updatedAt: string | null,
): ElectionSenateState[] {
  const countsByState = new Map(
    countRows.map(row => [row.StateAb, row])
  )
  const grouped = new Map<string, Array<{ party: string; partyShort: string; votes: number }>>()

  for (const row of rows) {
    const isGroupedTotal = row.BallotPosition === '0'
    const isUngrouped = row.Group === 'UG'
    if (!isGroupedTotal && !isUngrouped) continue

    const party = normaliseElectionParty(row.PartyName ?? '', '')
    const stateRows = grouped.get(row.StateAb) ?? []
    stateRows.push({
      party,
      partyShort: toPartyShort(party, ''),
      votes: toNumber(row.TotalVotes) ?? 0,
    })
    grouped.set(row.StateAb, stateRows)
  }

  return Array.from(grouped.entries())
    .map(([state, items]) => {
      const sorted = [...items].sort((a, b) => b.votes - a.votes)
      const totalVotes = sorted.reduce((sum, item) => sum + item.votes, 0)
      const reportingRow = countsByState.get(state)
      const margin = sorted[0] && sorted[1] && totalVotes > 0
        ? ((sorted[0].votes - sorted[1].votes) / totalVotes) * 100
        : null

      return {
        chamber: 'senate',
        state,
        status: sorted.length === 0 ? 'no-data' : margin !== null && margin < 2 ? 'too-close' : 'leading',
        reportingProgressPct: round(toNumber(reportingRow?.TotalPercentage ?? null), 2),
        leadingParty: sorted[0]?.party ?? null,
        topGroups: sorted.slice(0, 3).map(item => ({
          party: item.party,
          partyShort: item.partyShort,
          votes: item.votes,
          pct: totalVotes > 0 ? round((item.votes / totalVotes) * 100, 2) : null,
        })),
        updatedAt,
        sourceUrl,
      } satisfies ElectionSenateState
    })
    .sort((a, b) => a.state.localeCompare(b.state))
}

function buildNationalSummary(seats: ElectionHouseSeat[]) {
  const counts = new Map<string, ElectionPartyCount>()
  let votes = 0
  let enrolment = 0
  let calledSeats = 0
  let leadingSeats = 0
  let tooCloseSeats = 0
  let noDataSeats = 0

  for (const seat of seats) {
    votes += seat.totalVotes ?? 0
    enrolment += seat.enrolment ?? 0

    if (seat.status === 'called') calledSeats += 1
    if (seat.status === 'leading') leadingSeats += 1
    if (seat.status === 'too-close') tooCloseSeats += 1
    if (seat.status === 'no-data') noDataSeats += 1

    const party = seat.leadingCandidate?.party ? partyBucket(seat.leadingCandidate.party) : null
    if (!party) continue

    const current = counts.get(party) ?? { party, called: 0, leading: 0, total: 0 }
    if (seat.status === 'called') current.called += 1
    if (seat.status === 'leading') current.leading += 1
    current.total = current.called + current.leading
    counts.set(party, current)
  }

  const order = ['Labor', 'Coalition', 'Greens', 'Crossbench']
  const seatCounts = order
    .map(party => counts.get(party))
    .filter((entry): entry is ElectionPartyCount => Boolean(entry))

  const leader = [...seatCounts].sort((a, b) => b.total - a.total)[0] ?? null
  const majority = 76
  let governmentStatus: LiveElectionSnapshot['national']['governmentStatus'] = 'none'
  let governmentLabel = 'No clear lead yet'
  let note: string | null = null

  if (leader?.called && leader.called >= majority) {
    governmentStatus = 'called'
    governmentLabel = `${leader.party} has enough called seats to form government`
  } else if (leader?.total && leader.total >= majority) {
    governmentStatus = 'projected'
    governmentLabel = `${leader.party} is projected to have enough seats to form government`
    note = 'Projected government status is Stickee’s summary from official AEC counts. It is not an AEC declaration.'
  } else if (leader) {
    governmentStatus = 'leading'
    governmentLabel = `${leader.party} is leading nationally`
  }

  return {
    totalSeats: 150,
    majority,
    reportingProgressPct: enrolment > 0 ? round((votes / enrolment) * 100, 2) : null,
    reportingLabel: 'Votes counted',
    leadingParty: leader?.party ?? null,
    governmentStatus,
    governmentLabel,
    note,
    seatCounts,
    calledSeats,
    leadingSeats,
    tooCloseSeats,
    noDataSeats,
  }
}

export async function getLiveElectionSnapshot(): Promise<LiveElectionSnapshot> {
  try {
    const event = await discoverActiveFederalEvent()

    if (!event) {
      return buildInactiveElectionSnapshot()
    }

    const houseVotesUrl = downloadUrl(event.houseMenuUrl, `HouseVotesCountedByDivisionDownload-${event.eventId}.txt`)
    const houseMembersUrl = downloadUrl(event.houseMenuUrl, `HouseMembersElectedDownload-${event.eventId}.txt`)
    const houseFirstPrefsUrl = downloadUrl(event.houseMenuUrl, `HouseFirstPrefsByCandidateByVoteTypeDownload-${event.eventId}.txt`)
    const houseTcpUrl = downloadUrl(event.houseMenuUrl, `HouseTcpByCandidateByPollingPlaceDownload-${event.eventId}.txt`)
    const senateFirstPrefsUrl = downloadUrl(event.senateMenuUrl, `SenateFirstPrefsByStateByVoteTypeDownload-${event.eventId}.txt`)
    const senateCountsUrl = downloadUrl(event.senateMenuUrl, `SenateVotesCountedByStateDownload-${event.eventId}.txt`)

    const [
      houseVotesText,
      houseMembersText,
      houseFirstPrefsText,
      houseTcpText,
      senateFirstPrefsText,
      senateCountsText,
    ] = await Promise.all([
      fetchText(houseVotesUrl),
      fetchText(houseMembersUrl),
      fetchText(houseFirstPrefsUrl),
      fetchText(houseTcpUrl),
      fetchText(senateFirstPrefsUrl),
      fetchText(senateCountsUrl).catch(() => ''),
    ])

    const houseVotes = parseFile<HouseDivisionRow>(houseVotesText)
    const houseMembers = parseFile<HouseMemberRow>(houseMembersText)
    const houseFirstPrefs = parseFile<HouseFirstPrefRow>(houseFirstPrefsText)
    const houseTcp = parseFile<HouseTcpRow>(houseTcpText)
    const senateFirstPrefs = parseFile<SenateVoteRow>(senateFirstPrefsText)
    const senateCounts = senateCountsText ? parseFile<SenateCountRow>(senateCountsText) : { meta: { eventId: null, phase: null, generatedAt: null }, rows: [] }

    const updatedAt = latestTimestamp(
      houseVotes.meta.generatedAt,
      houseMembers.meta.generatedAt,
      houseFirstPrefs.meta.generatedAt,
      houseTcp.meta.generatedAt,
      senateFirstPrefs.meta.generatedAt,
      senateCounts.meta.generatedAt,
    )

    const houseSeats = buildHouseSeats(
      houseVotes.rows,
      houseMembers.rows,
      houseFirstPrefs.rows,
      houseTcp.rows,
      event.resultsUrl,
      updatedAt,
    )
    const senateStates = buildSenateStates(
      senateFirstPrefs.rows,
      senateCounts.rows,
      event.resultsUrl,
      updatedAt,
    )
    const national = buildNationalSummary(houseSeats)

    return {
      active: true,
      reason: null,
      officialSource: 'AEC',
      event: {
        eventId: event.eventId,
        name: event.name,
        phase: firstNonEmpty(
          houseVotes.meta.phase,
          houseMembers.meta.phase,
          houseFirstPrefs.meta.phase,
          houseTcp.meta.phase,
          senateFirstPrefs.meta.phase,
        ),
        updatedAt,
        resultsUrl: event.resultsUrl,
      },
      national,
      chambers: {
        house: {
          available: houseSeats.length > 0,
          seats: houseSeats,
        },
        senate: {
          available: senateStates.length > 0,
          states: senateStates,
        },
      },
    }
  } catch {
    return buildInactiveElectionSnapshot('Live election data is temporarily unavailable')
  }
}

export function getElectionStatusColor(party: string | null, status: ElectionSeatStatus) {
  if (status === 'too-close') return '#f5a623'
  if (status === 'no-data') return '#5a5a5e'
  if (!party) return '#5a5a5e'
  return LIVE_PARTY_COLORS[party] ?? '#9ca3af'
}

export function getElectionPartyColor(party: string | null) {
  if (!party) return '#5a5a5e'
  return LIVE_PARTY_COLORS[party] ?? '#9ca3af'
}

export function getElectionKeyForElectorate(electorate: string) {
  return normaliseKey(electorate)
}
