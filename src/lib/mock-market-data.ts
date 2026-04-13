import { issues, MPs, getVoteSummary, calculateStickeeScore } from './mock-data'

// ─── Market / probability data ───────────────────────────────────────────────

export interface MarketOutcome {
  outcome: 'Yes' | 'No'
  price: number       // 0–100, current probability
  change: number      // change vs previous day (percentage points)
  volume: number      // number of predictions placed
  history: number[]   // last-14-day daily closing prices (oldest first)
}

export interface IssueMarket {
  issueId: string
  probability: number         // current Yes probability (0–100)
  totalParticipants: number
  outcomes: [MarketOutcome, MarketOutcome]  // [Yes, No]
}

const marketRaw: Array<{
  id: string
  prob: number
  participants: number
  yesVol: number
  noVol: number
  yesChange: number
  history: number[]
}> = [
  {
    id: 'housing-affordability',
    prob: 62,
    participants: 4180,
    yesVol: 2320,
    noVol: 1860,
    yesChange: +2.1,
    history: [51, 53, 54, 56, 55, 57, 58, 59, 58, 60, 61, 60, 62, 62],
  },
  {
    id: 'climate-safeguard',
    prob: 78,
    participants: 6340,
    yesVol: 4490,
    noVol: 1850,
    yesChange: +0.4,
    history: [65, 66, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 78],
  },
  {
    id: 'ndis-reform',
    prob: 44,
    participants: 3210,
    yesVol: 1380,
    noVol: 1830,
    yesChange: -1.8,
    history: [51, 50, 49, 50, 48, 47, 48, 46, 47, 46, 45, 44, 44, 44],
  },
  {
    id: 'tax-cuts',
    prob: 71,
    participants: 5090,
    yesVol: 3480,
    noVol: 1610,
    yesChange: +1.3,
    history: [60, 61, 63, 64, 65, 66, 66, 67, 68, 69, 70, 70, 71, 71],
  },
  {
    id: 'misinformation-bill',
    prob: 37,
    participants: 2870,
    yesVol: 1020,
    noVol: 1850,
    yesChange: -3.2,
    history: [48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 38, 37, 37],
  },
]

export const issueMarkets: Record<string, IssueMarket> = Object.fromEntries(
  marketRaw.map(r => {
    const yes: MarketOutcome = {
      outcome: 'Yes',
      price: r.prob,
      change: r.yesChange,
      volume: r.yesVol,
      history: r.history,
    }
    const no: MarketOutcome = {
      outcome: 'No',
      price: 100 - r.prob,
      change: -r.yesChange,
      volume: r.noVol,
      history: r.history.map(p => 100 - p),
    }
    return [r.id, { issueId: r.id, probability: r.prob, totalParticipants: r.participants, outcomes: [yes, no] }]
  })
)

// ─── Community predictions (seeded) ──────────────────────────────────────────

export const communityPredictions: Record<string, { yes: number; no: number }> = {
  'housing-affordability': { yes: 312, no: 198 },
  'climate-safeguard': { yes: 445, no: 221 },
  'ndis-reform': { yes: 187, no: 290 },
  'tax-cuts': { yes: 380, no: 145 },
  'misinformation-bill': { yes: 201, no: 388 },
}

// ─── Dashboard row (derived) ─────────────────────────────────────────────────

export interface DashboardRow {
  id: string
  title: string
  status: 'active' | 'passed' | 'rejected'
  probability: number
  participants: number
  mpYes: number
  mpNo: number
  mpAbstain: number
  mpTotal: number
  mpAlignmentPct: number  // % of MPs voting Yes
  priceChange: number
}

export const dashboardRows: DashboardRow[] = issues.map(issue => {
  const summary = getVoteSummary(issue.id)
  const market = issueMarkets[issue.id]
  const total = summary.yes + summary.no + summary.abstain
  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    probability: market?.probability ?? 50,
    participants: market?.totalParticipants ?? 0,
    mpYes: summary.yes,
    mpNo: summary.no,
    mpAbstain: summary.abstain,
    mpTotal: total,
    mpAlignmentPct: total > 0 ? Math.round((summary.yes / total) * 100) : 50,
    priceChange: market?.outcomes[0].change ?? 0,
  }
})

// ─── Unified prediction market type ──────────────────────────────────────────
//
// Covers both bill/policy markets (derived from dashboardRows) and
// civic-score markets (will a pillar grade hit a target by a deadline?).

export type MarketCategory = 'bill' | 'civic' | 'election' | 'mp-vote'
export type MarketStatus   = 'active' | 'resolved-yes' | 'resolved-no'

export interface PredictionMarket {
  id: string
  category: MarketCategory
  question: string            // full question shown to users
  status: MarketStatus
  probability: number         // 0–100, current YES probability
  priceChange: number         // 24h change in pp
  participants: number
  resolvesBy: string          // human-readable deadline
  pillarId?: string           // civic markets only
}

// ── Bill/policy markets (bridged from dashboardRows) ─────────────────────────

const STATUS_MAP: Record<string, MarketStatus> = {
  active:   'active',
  passed:   'resolved-yes',
  rejected: 'resolved-no',
}

const BILL_QUESTIONS: Record<string, string> = {
  'housing-affordability': 'Will the Housing Australia Future Fund meaningfully reduce rental vacancy rates by end of 2026?',
  'climate-safeguard':     'Will Australia\'s Safeguard Mechanism cut industrial emissions by 10%+ by end of 2025?',
  'ndis-reform':           'Will the NDIS Reform Bill reduce scheme growth below 8% annually by mid-2026?',
  'tax-cuts':              'Will the modified Stage 3 tax cuts increase real disposable incomes by 2%+ in FY2025?',
  'misinformation-bill':   'Will the Misinformation & Disinformation Bill pass the Senate in its current form?',
}

export const billMarkets: PredictionMarket[] = dashboardRows.map(row => ({
  id: row.id,
  category: 'bill',
  question: BILL_QUESTIONS[row.id] ?? row.title,
  status: STATUS_MAP[row.status] ?? 'active',
  probability: row.probability,
  priceChange: row.priceChange,
  participants: row.participants,
  resolvesBy: 'Dec 2026',
}))

// ── Civic score markets ───────────────────────────────────────────────────────

export const civicMarkets: PredictionMarket[] = [
  {
    id: 'civic-housing-grade',
    category: 'civic',
    question: 'Will Australia\'s Housing grade improve from D to C by Dec 2026?',
    status: 'active',
    probability: 38,
    priceChange: -0.5,
    participants: 1240,
    resolvesBy: 'Dec 2026',
    pillarId: 'housing',
  },
  {
    id: 'civic-gdp-positive',
    category: 'civic',
    question: 'Will GDP growth per capita turn positive before end of FY2026?',
    status: 'active',
    probability: 41,
    priceChange: +1.2,
    participants: 890,
    resolvesBy: 'Jun 2026',
    pillarId: 'jobs-economy',
  },
  {
    id: 'civic-renewables-45',
    category: 'civic',
    question: 'Will renewable energy reach 45% of the grid by end of 2025?',
    status: 'active',
    probability: 67,
    priceChange: +0.8,
    participants: 2140,
    resolvesBy: 'Dec 2025',
    pillarId: 'future',
  },
  {
    id: 'civic-col-grade',
    category: 'civic',
    question: 'Will the Cost of Living grade improve from C to B by mid-2026?',
    status: 'active',
    probability: 29,
    priceChange: -1.1,
    participants: 760,
    resolvesBy: 'Jun 2026',
    pillarId: 'cost-of-living',
  },
  {
    id: 'civic-unemployment-4',
    category: 'civic',
    question: 'Will the national unemployment rate fall back below 4% by Q3 2026?',
    status: 'active',
    probability: 52,
    priceChange: +0.3,
    participants: 1580,
    resolvesBy: 'Sep 2026',
    pillarId: 'jobs-economy',
  },
]

// ── Election / seat markets ───────────────────────────────────────────────────

export const electionMarkets: PredictionMarket[] = [
  {
    id: 'election-labor-majority',
    category: 'election',
    question: 'Will Labor retain a parliamentary majority at the next federal election?',
    status: 'active',
    probability: 51,
    priceChange: -1.4,
    participants: 3820,
    resolvesBy: 'May 2025',
  },
  {
    id: 'election-teal-wentworth',
    category: 'election',
    question: 'Will the Teal independent hold Wentworth at the next election?',
    status: 'active',
    probability: 72,
    priceChange: +0.9,
    participants: 1650,
    resolvesBy: 'May 2025',
  },
  {
    id: 'election-greens-brisbane',
    category: 'election',
    question: 'Will the Greens hold Brisbane at the next election?',
    status: 'active',
    probability: 58,
    priceChange: -0.6,
    participants: 1290,
    resolvesBy: 'May 2025',
  },
  {
    id: 'election-coalition-opp-leader',
    category: 'election',
    question: 'Will the Coalition Opposition leader change before the election?',
    status: 'active',
    probability: 34,
    priceChange: +2.1,
    participants: 2410,
    resolvesBy: 'Jan 2025',
  },
  {
    id: 'election-senate-crossbench',
    category: 'election',
    question: 'Will the Senate crossbench hold 20+ seats after the next election?',
    status: 'active',
    probability: 63,
    priceChange: +0.3,
    participants: 980,
    resolvesBy: 'May 2025',
  },
]

// ── MP vote prediction markets ────────────────────────────────────────────────

export const mpVoteMarkets: PredictionMarket[] = [
  {
    id: 'mp-vote-plibersek-housing',
    category: 'mp-vote',
    question: 'Will Tanya Plibersek vote YES on the next housing affordability bill?',
    status: 'active',
    probability: 91,
    priceChange: 0,
    participants: 520,
    resolvesBy: 'Q2 2026',
  },
  {
    id: 'mp-vote-dutton-climate',
    category: 'mp-vote',
    question: 'Will Peter Dutton vote NO on the next climate safeguard amendment?',
    status: 'active',
    probability: 87,
    priceChange: +0.5,
    participants: 740,
    resolvesBy: 'Q2 2026',
  },
  {
    id: 'mp-vote-greens-ndis',
    category: 'mp-vote',
    question: 'Will the Greens crossbench support the NDIS Reform Bill?',
    status: 'active',
    probability: 42,
    priceChange: -2.8,
    participants: 890,
    resolvesBy: 'Q1 2026',
  },
  {
    id: 'mp-vote-teal-tax',
    category: 'mp-vote',
    question: 'Will Teal independents collectively support the Stage 3 tax cut modifications?',
    status: 'active',
    probability: 65,
    priceChange: +1.2,
    participants: 610,
    resolvesBy: 'Q3 2026',
  },
  {
    id: 'mp-vote-one-nation-misinfo',
    category: 'mp-vote',
    question: 'Will One Nation vote against the Misinformation & Disinformation Bill?',
    status: 'active',
    probability: 94,
    priceChange: 0,
    participants: 380,
    resolvesBy: 'Q4 2025',
  },
]

// ── Closing-soon markets (near-future ISO dates for live countdowns) ──────────

export const urgentMarkets: PredictionMarket[] = [
  {
    id: 'urgent-senate-vote',
    category: 'bill',
    question: 'Will the Senate pass the Emergency Housing Relief Bill before the April recess?',
    status: 'active',
    probability: 61,
    priceChange: +4.2,
    participants: 3120,
    resolvesBy: '2026-04-10T14:00:00+10:00',  // ~2 days away
  },
  {
    id: 'urgent-rba-rate',
    category: 'civic',
    question: 'Will the RBA cut the cash rate at this week\'s April board meeting?',
    status: 'active',
    probability: 74,
    priceChange: +6.1,
    participants: 5880,
    resolvesBy: '2026-04-09T16:30:00+10:00',  // ~1 day away
  },
]

// ── All markets combined ──────────────────────────────────────────────────────

export const allMarkets: PredictionMarket[] = [
  ...urgentMarkets,
  ...billMarkets,
  ...civicMarkets,
  ...electionMarkets,
  ...mpVoteMarkets,
]

// ─── MP accuracy / extended data ─────────────────────────────────────────────

export interface MPExtended {
  id: string
  name: string
  party: string
  electorate: string
  stickeeScore: number
  totalVotes: number
  predictionsCorrect: number
}

export const mpExtended: MPExtended[] = MPs.map(mp => ({
  id: mp.id,
  name: mp.name,
  party: mp.party,
  electorate: mp.electorate,
  stickeeScore: calculateStickeeScore(mp.id),
  totalVotes: 5,
  predictionsCorrect: Math.round(calculateStickeeScore(mp.id) / 100 * 5),
}))

export const mpExtendedIndex: Record<string, MPExtended> = Object.fromEntries(
  mpExtended.map(m => [m.id, m])
)

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardUser {
  rank: number
  id: string
  name: string
  initials: string
  accuracy: number  // 0–100
  points: number
  streak: number    // days
  predictions: number
  badges: string[]
}

export const leaderboard: LeaderboardUser[] = [
  { rank: 1, id: 'u1', name: 'Mia Torres',      initials: 'MT', accuracy: 91, points: 14200, streak: 32, predictions: 48, badges: ['🔥','🏆','⚡'] },
  { rank: 2, id: 'u2', name: 'Liam Chen',        initials: 'LC', accuracy: 88, points: 12900, streak: 21, predictions: 52, badges: ['🏆','🎯'] },
  { rank: 3, id: 'u3', name: 'Sophie Nguyen',    initials: 'SN', accuracy: 85, points: 11400, streak: 14, predictions: 41, badges: ['🎯','🧠'] },
  { rank: 4, id: 'u4', name: 'James O\'Brien',   initials: 'JO', accuracy: 83, points: 10800, streak: 9,  predictions: 38, badges: ['🧠'] },
  { rank: 5, id: 'u5', name: 'Priya Sharma',     initials: 'PS', accuracy: 81, points: 9700,  streak: 17, predictions: 45, badges: ['⚡','🎯'] },
  { rank: 6, id: 'u6', name: 'Connor Walsh',     initials: 'CW', accuracy: 79, points: 8900,  streak: 6,  predictions: 33, badges: ['🔥'] },
  { rank: 7, id: 'u7', name: 'Aisha Rahman',     initials: 'AR', accuracy: 77, points: 8200,  streak: 12, predictions: 29, badges: ['🧠'] },
  { rank: 8, id: 'u8', name: 'Thomas Hill',      initials: 'TH', accuracy: 75, points: 7600,  streak: 3,  predictions: 36, badges: [] },
  { rank: 9, id: 'u9', name: 'Emma Johnson',     initials: 'EJ', accuracy: 73, points: 6900,  streak: 8,  predictions: 27, badges: ['🎯'] },
  { rank: 10,id: 'u10',name: 'Nathan Clarke',    initials: 'NC', accuracy: 71, points: 6100,  streak: 5,  predictions: 31, badges: [] },
  { rank: 11,id: 'u11',name: 'Zoe Mitchell',     initials: 'ZM', accuracy: 68, points: 5400,  streak: 2,  predictions: 22, badges: [] },
  { rank: 12,id: 'u12',name: 'Daniel Park',      initials: 'DP', accuracy: 65, points: 4800,  streak: 1,  predictions: 19, badges: [] },
]
