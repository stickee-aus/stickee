export type ElectionSeatStatus = 'called' | 'leading' | 'too-close' | 'no-data'
export type ElectionGovernmentStatus = 'called' | 'leading' | 'projected' | 'none'

export interface ElectionCandidateSummary {
  candidateId: string
  candidate: string
  party: string
  partyShort: string
  votes: number
  pct: number | null
  swing: number | null
}

export interface ElectionHouseSeat {
  chamber: 'house'
  divisionId: string
  electorate: string
  state: string
  status: ElectionSeatStatus
  reportingProgressPct: number | null
  enrolment: number | null
  totalVotes: number | null
  leadingCandidate: ElectionCandidateSummary | null
  runnerUpCandidate: ElectionCandidateSummary | null
  tcpLeader: ElectionCandidateSummary | null
  tcpRunnerUp: ElectionCandidateSummary | null
  tcpPct: number | null
  marginPct: number | null
  updatedAt: string | null
  sourceUrl: string | null
}

export interface ElectionSenateGroupSummary {
  party: string
  partyShort: string
  votes: number
  pct: number | null
}

export interface ElectionSenateState {
  chamber: 'senate'
  state: string
  status: Exclude<ElectionSeatStatus, 'called' | 'too-close'> | 'too-close'
  reportingProgressPct: number | null
  leadingParty: string | null
  topGroups: ElectionSenateGroupSummary[]
  updatedAt: string | null
  sourceUrl: string | null
}

export interface ElectionPartyCount {
  party: string
  called: number
  leading: number
  total: number
}

export interface LiveElectionSnapshot {
  active: boolean
  reason: string | null
  officialSource: 'AEC'
  event: {
    eventId: string | null
    name: string | null
    phase: string | null
    updatedAt: string | null
    resultsUrl: string | null
  }
  national: {
    totalSeats: number
    majority: number
    reportingProgressPct: number | null
    reportingLabel: string
    leadingParty: string | null
    governmentStatus: ElectionGovernmentStatus
    governmentLabel: string
    note: string | null
    seatCounts: ElectionPartyCount[]
    calledSeats: number
    leadingSeats: number
    tooCloseSeats: number
    noDataSeats: number
  }
  chambers: {
    house: {
      available: boolean
      seats: ElectionHouseSeat[]
    }
    senate: {
      available: boolean
      states: ElectionSenateState[]
    }
  }
}

export function buildInactiveElectionSnapshot(reason: string | null = 'No live federal count right now'): LiveElectionSnapshot {
  return {
    active: false,
    reason,
    officialSource: 'AEC',
    event: {
      eventId: null,
      name: null,
      phase: null,
      updatedAt: null,
      resultsUrl: null,
    },
    national: {
      totalSeats: 150,
      majority: 76,
      reportingProgressPct: null,
      reportingLabel: 'No live federal count right now',
      leadingParty: null,
      governmentStatus: 'none',
      governmentLabel: 'No live federal count right now',
      note: null,
      seatCounts: [],
      calledSeats: 0,
      leadingSeats: 0,
      tooCloseSeats: 0,
      noDataSeats: 0,
    },
    chambers: {
      house: {
        available: false,
        seats: [],
      },
      senate: {
        available: false,
        states: [],
      },
    },
  }
}
