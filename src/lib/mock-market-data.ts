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
// 'demo' means: shown for browsing, but not backed by a real issue_markets
// row with real timestamps, so is_market_open() (see migration 017) always
// rejects a stake on it — this is not an outcome, it's a content-readiness
// state. 'voided' mirrors the DB outcome of the same name (see resolve_market).
export type MarketStatus   = 'active' | 'resolved-yes' | 'resolved-no' | 'voided' | 'demo'
export type MarketTimelineImpact = 'up' | 'down' | 'flat'

export interface MarketNewsEvent {
  date: string
  label: string
  summary: string
  impact: MarketTimelineImpact
}

export interface MarketSimulatorComparison {
  yes: string
  no: string
  next: string
}

export interface PredictionMarket {
  id: string
  category: MarketCategory
  question: string            // full question shown to users
  status: MarketStatus
  probability: number         // 0–100, current YES probability
  priceChange: number         // 24h change in pp
  participants: number
  resolvesBy: string          // human-readable deadline
  topic: string
  imageUrl: string
  imageAlt: string
  history: number[]
  newsTimeline: MarketNewsEvent[]
  bullCase: string
  bearCase: string
  simulatorComparison: MarketSimulatorComparison
  pillarId?: string           // civic markets only
}

export const MARKET_VISUALS: Record<string, { topic: string; imageUrl: string; imageAlt: string }> = {
  'housing-affordability': {
    topic: 'Housing',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Australian apartment towers and urban housing',
  },
  'climate-safeguard': {
    topic: 'Climate',
    imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Solar panels generating renewable energy',
  },
  'ndis-reform': {
    topic: 'NDIS',
    imageUrl: 'https://images.unsplash.com/photo-1576765607924-1bfa7f88e531?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Community disability support worker with client',
  },
  'tax-cuts': {
    topic: 'Cost of Living',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Household budget papers and Australian cost of living planning',
  },
  'misinformation-bill': {
    topic: 'Civic Trust',
    imageUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'News pages and civic information',
  },
  'civic-housing-grade': {
    topic: 'Renters',
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Housing construction site and cranes',
  },
  'civic-gdp-positive': {
    topic: 'Economy',
    imageUrl: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Workers reviewing economic data in an office',
  },
  'civic-renewables-45': {
    topic: 'Renewables',
    imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Wind turbines in a renewable energy field',
  },
  'civic-col-grade': {
    topic: 'Cost of Living',
    imageUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Household bills and mortgage paperwork',
  },
  'civic-unemployment-4': {
    topic: 'Jobs',
    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Australian workers collaborating in a workplace',
  },
  'election-labor-majority': {
    topic: 'Federal Election',
    imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Parliament House in Canberra',
  },
  'election-teal-wentworth': {
    topic: 'Wentworth',
    imageUrl: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Sydney harbour and eastern suburbs',
  },
  'election-greens-brisbane': {
    topic: 'Brisbane',
    imageUrl: 'https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Brisbane city skyline',
  },
  'election-coalition-opp-leader': {
    topic: 'Opposition',
    imageUrl: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Political press conference microphones',
  },
  'election-senate-crossbench': {
    topic: 'Senate',
    imageUrl: 'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Parliamentary chamber seating',
  },
  'mp-vote-plibersek-housing': {
    topic: 'MP Vote',
    imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Public representative speaking with community members',
  },
  'mp-vote-dutton-climate': {
    topic: 'MP Vote',
    imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Parliament House exterior for MP vote market',
  },
  'mp-vote-greens-ndis': {
    topic: 'MP Vote',
    imageUrl: 'https://images.unsplash.com/photo-1576765607924-1bfa7f88e531?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Community support and care for NDIS vote market',
  },
  'mp-vote-teal-tax': {
    topic: 'MP Vote',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Tax and household finance papers for MP vote market',
  },
  'mp-vote-one-nation-misinfo': {
    topic: 'MP Vote',
    imageUrl: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'News and media pages for misinformation vote market',
  },
  'urgent-senate-vote': {
    topic: 'Senate',
    imageUrl: 'https://images.unsplash.com/photo-1541872705-1f73c6400ec9?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Parliamentary chamber during a civic vote',
  },
  'urgent-rba-rate': {
    topic: 'RBA',
    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Money and mortgage paperwork for an RBA cash rate market',
  },
}

const CATEGORY_VISUALS: Record<MarketCategory, { topic: string; imageUrl: string; imageAlt: string }> = {
  bill: {
    topic: 'Bill',
    imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Australian Parliament House for a bill market',
  },
  civic: {
    topic: 'Civic',
    imageUrl: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Civic and economic data dashboard',
  },
  election: {
    topic: 'Election',
    imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Parliament House for an election market',
  },
  'mp-vote': {
    topic: 'MP Vote',
    imageUrl: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=900&q=80',
    imageAlt: 'Press microphones for an MP vote market',
  },
}

export function marketVisualFor(id: string, category: MarketCategory) {
  return MARKET_VISUALS[id] ?? CATEGORY_VISUALS[category]
}

function boundedProbability(value: number) {
  return Math.max(5, Math.min(95, Math.round(value)))
}

function generatedHistory(probability: number, priceChange: number) {
  return Array.from({ length: 14 }, (_, index) => {
    const t = index / 13
    const drift = priceChange * (t - 1)
    const texture = Math.sin((index + probability) * 0.72) * 2.1 + Math.cos(index * 1.15) * 1.3
    return boundedProbability(probability + drift + texture)
  })
}

function directionLabel(priceChange: number) {
  if (priceChange > 1.5) return 'moved sharply higher'
  if (priceChange > 0) return 'edged higher'
  if (priceChange < -1.5) return 'sold off'
  if (priceChange < 0) return 'softened'
  return 'held steady'
}

function categoryCatalyst(category: MarketCategory, topic: string) {
  switch (category) {
    case 'bill':
      return `${topic} stakeholders increased pressure on crossbench and Senate offices.`
    case 'election':
      return `Seat-level chatter and campaign positioning shifted attention back to ${topic}.`
    case 'mp-vote':
      return `Party room signals and public comments narrowed the expected vote path.`
    case 'civic':
    default:
      return `New public data and household sentiment put ${topic} back on the agenda.`
  }
}

export function marketStoryFor({
  id,
  category,
  question,
  probability,
  priceChange,
  resolvesBy,
  history,
}: {
  id: string
  category: MarketCategory
  question: string
  probability: number
  priceChange: number
  resolvesBy: string
  history?: number[]
}) {
  const visual = marketVisualFor(id, category)
  const cleanHistory = history && history.length >= 4 ? history.map(boundedProbability) : generatedHistory(probability, priceChange)
  const movement = directionLabel(priceChange)
  const impact: MarketTimelineImpact = priceChange > 0.2 ? 'up' : priceChange < -0.2 ? 'down' : 'flat'
  const reverseImpact: MarketTimelineImpact = impact === 'up' ? 'down' : impact === 'down' ? 'up' : 'flat'
  const shortQuestion = question.replace(/\?$/, '')

  return {
    history: cleanHistory,
    newsTimeline: [
      {
        date: 'Today',
        label: `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}pp in 24h`,
        summary: `The market ${movement} as traders reassessed whether ${shortQuestion}.`,
        impact,
      },
      {
        date: 'This week',
        label: `${visual.topic} catalyst`,
        summary: categoryCatalyst(category, visual.topic),
        impact: Math.abs(priceChange) > 0.8 ? impact : 'flat',
      },
      {
        date: resolvesBy,
        label: 'Resolution watch',
        summary: `Next checkpoint: evidence that can confirm the YES path or force a repricing toward NO.`,
        impact: reverseImpact,
      },
    ],
    bullCase: `YES strengthens if the next public signal confirms momentum on ${visual.topic.toLowerCase()} and undecided civic actors move before ${resolvesBy}.`,
    bearCase: `NO gains if implementation stalls, official data disappoints, or the politics around ${visual.topic.toLowerCase()} harden before resolution.`,
    simulatorComparison: {
      yes: `YES scenario: Stickee models a clearer path for ${visual.topic.toLowerCase()}, with pressure shifting from uncertainty to delivery risk.`,
      no: `NO scenario: the simulator tests what breaks next: public trust, cost pressure, parliamentary support, or leader credibility.`,
      next: `Run the simulator to compare YES and NO consequences across markets, civic scores, leaders and geopolitical risk.`,
    },
  }
}

// ── Bill/policy markets (bridged from dashboardRows) ─────────────────────────

// Maps the underlying mock issue's status to a client market status. Note
// that a mock issue's "active" status maps to the market status 'demo', not
// 'active' — none of these bill markets has a real issue_markets row with
// real opens_at/closes_at yet (see migration 017), so none is genuinely
// stakeable, and the UI should say so rather than showing live Yes/No
// buttons that would fail server-side. 'passed'/'rejected' still map to a
// resolved-* display, since that's descriptive of the mock issue's outcome,
// not a claim that real money moved on it.
const STATUS_MAP: Record<string, MarketStatus> = {
  active:   'demo',
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

type PredictionMarketSeed = Omit<
  PredictionMarket,
  'history' | 'newsTimeline' | 'bullCase' | 'bearCase' | 'simulatorComparison'
> & {
  history?: number[]
}

function withMarketStory(seed: PredictionMarketSeed): PredictionMarket {
  const { history, ...market } = seed

  return {
    ...market,
    ...marketStoryFor({
      id: market.id,
      category: market.category,
      question: market.question,
      probability: market.probability,
      priceChange: market.priceChange,
      resolvesBy: market.resolvesBy,
      history,
    }),
  }
}

export const billMarkets: PredictionMarket[] = dashboardRows.map(row => withMarketStory({
  id: row.id,
  category: 'bill',
  question: BILL_QUESTIONS[row.id] ?? row.title,
  status: STATUS_MAP[row.status] ?? 'demo',
  probability: row.probability,
  priceChange: row.priceChange,
  participants: row.participants,
  resolvesBy: 'Dec 2026',
  ...marketVisualFor(row.id, 'bill'),
  history: issueMarkets[row.id]?.outcomes[0].history,
}))

// ── Civic score markets ───────────────────────────────────────────────────────

export const civicMarkets: PredictionMarket[] = ([
  {
    id: 'civic-housing-grade',
    category: 'civic',
    question: 'Will Australia\'s Housing grade improve from D to C by Dec 2026?',
    status: 'demo',
    probability: 38,
    priceChange: -0.5,
    participants: 1240,
    resolvesBy: 'Dec 2026',
    ...marketVisualFor('civic-housing-grade', 'civic'),
    pillarId: 'housing',
  },
  {
    id: 'civic-gdp-positive',
    category: 'civic',
    question: 'Will GDP growth per capita turn positive before end of FY2026?',
    status: 'demo',
    probability: 41,
    priceChange: +1.2,
    participants: 890,
    resolvesBy: 'Jun 2026',
    ...marketVisualFor('civic-gdp-positive', 'civic'),
    pillarId: 'jobs-economy',
  },
  {
    id: 'civic-renewables-45',
    category: 'civic',
    question: 'Will renewable energy reach 45% of the grid by end of 2025?',
    status: 'demo',
    probability: 67,
    priceChange: +0.8,
    participants: 2140,
    resolvesBy: 'Dec 2025',
    ...marketVisualFor('civic-renewables-45', 'civic'),
    pillarId: 'future',
  },
  {
    id: 'civic-col-grade',
    category: 'civic',
    question: 'Will the Cost of Living grade improve from C to B by mid-2026?',
    status: 'demo',
    probability: 29,
    priceChange: -1.1,
    participants: 760,
    resolvesBy: 'Jun 2026',
    ...marketVisualFor('civic-col-grade', 'civic'),
    pillarId: 'cost-of-living',
  },
  {
    id: 'civic-unemployment-4',
    category: 'civic',
    question: 'Will the national unemployment rate fall back below 4% by Q3 2026?',
    status: 'demo',
    probability: 52,
    priceChange: +0.3,
    participants: 1580,
    resolvesBy: 'Sep 2026',
    ...marketVisualFor('civic-unemployment-4', 'civic'),
    pillarId: 'jobs-economy',
  },
] as PredictionMarketSeed[]).map(withMarketStory)

// ── Election / seat markets ───────────────────────────────────────────────────

export const electionMarkets: PredictionMarket[] = ([
  {
    id: 'election-labor-majority',
    category: 'election',
    question: 'Will Labor retain a parliamentary majority at the next federal election?',
    status: 'demo',
    probability: 51,
    priceChange: -1.4,
    participants: 3820,
    resolvesBy: 'May 2025',
    ...marketVisualFor('election-labor-majority', 'election'),
  },
  {
    id: 'election-teal-wentworth',
    category: 'election',
    question: 'Will the Teal independent hold Wentworth at the next election?',
    status: 'demo',
    probability: 72,
    priceChange: +0.9,
    participants: 1650,
    resolvesBy: 'May 2025',
    ...marketVisualFor('election-teal-wentworth', 'election'),
  },
  {
    id: 'election-greens-brisbane',
    category: 'election',
    question: 'Will the Greens hold Brisbane at the next election?',
    status: 'demo',
    probability: 58,
    priceChange: -0.6,
    participants: 1290,
    resolvesBy: 'May 2025',
    ...marketVisualFor('election-greens-brisbane', 'election'),
  },
  {
    id: 'election-coalition-opp-leader',
    category: 'election',
    question: 'Will the Coalition Opposition leader change before the election?',
    status: 'demo',
    probability: 34,
    priceChange: +2.1,
    participants: 2410,
    resolvesBy: 'Jan 2025',
    ...marketVisualFor('election-coalition-opp-leader', 'election'),
  },
  {
    id: 'election-senate-crossbench',
    category: 'election',
    question: 'Will the Senate crossbench hold 20+ seats after the next election?',
    status: 'demo',
    probability: 63,
    priceChange: +0.3,
    participants: 980,
    resolvesBy: 'May 2025',
    ...marketVisualFor('election-senate-crossbench', 'election'),
  },
] as PredictionMarketSeed[]).map(withMarketStory)

// ── MP vote prediction markets ────────────────────────────────────────────────

export const mpVoteMarkets: PredictionMarket[] = ([
  {
    id: 'mp-vote-plibersek-housing',
    category: 'mp-vote',
    question: 'Will Tanya Plibersek vote YES on the next housing affordability bill?',
    status: 'demo',
    probability: 91,
    priceChange: 0,
    participants: 520,
    resolvesBy: 'Q2 2026',
    ...marketVisualFor('mp-vote-plibersek-housing', 'mp-vote'),
  },
  {
    id: 'mp-vote-dutton-climate',
    category: 'mp-vote',
    question: 'Will Peter Dutton vote NO on the next climate safeguard amendment?',
    status: 'demo',
    probability: 87,
    priceChange: +0.5,
    participants: 740,
    resolvesBy: 'Q2 2026',
    ...marketVisualFor('mp-vote-dutton-climate', 'mp-vote'),
  },
  {
    id: 'mp-vote-greens-ndis',
    category: 'mp-vote',
    question: 'Will the Greens crossbench support the NDIS Reform Bill?',
    status: 'demo',
    probability: 42,
    priceChange: -2.8,
    participants: 890,
    resolvesBy: 'Q1 2026',
    ...marketVisualFor('mp-vote-greens-ndis', 'mp-vote'),
  },
  {
    id: 'mp-vote-teal-tax',
    category: 'mp-vote',
    question: 'Will Teal independents collectively support the Stage 3 tax cut modifications?',
    status: 'demo',
    probability: 65,
    priceChange: +1.2,
    participants: 610,
    resolvesBy: 'Q3 2026',
    ...marketVisualFor('mp-vote-teal-tax', 'mp-vote'),
  },
  {
    id: 'mp-vote-one-nation-misinfo',
    category: 'mp-vote',
    question: 'Will One Nation vote against the Misinformation & Disinformation Bill?',
    status: 'demo',
    probability: 94,
    priceChange: 0,
    participants: 380,
    resolvesBy: 'Q4 2025',
    ...marketVisualFor('mp-vote-one-nation-misinfo', 'mp-vote'),
  },
] as PredictionMarketSeed[]).map(withMarketStory)

// ── Closing-soon markets (near-future ISO dates for live countdowns) ──────────

export const urgentMarkets: PredictionMarket[] = ([
  {
    id: 'urgent-senate-vote',
    category: 'bill',
    question: 'Will the Senate pass the Emergency Housing Relief Bill before the April recess?',
    status: 'demo',
    probability: 61,
    priceChange: +4.2,
    participants: 3120,
    resolvesBy: '2026-04-10T14:00:00+10:00',  // ~2 days away
    ...marketVisualFor('urgent-senate-vote', 'bill'),
  },
  {
    id: 'urgent-rba-rate',
    category: 'civic',
    question: 'Will the RBA cut the cash rate at this week\'s April board meeting?',
    status: 'demo',
    probability: 74,
    priceChange: +6.1,
    participants: 5880,
    resolvesBy: '2026-04-09T16:30:00+10:00',  // ~1 day away
    ...marketVisualFor('urgent-rba-rate', 'civic'),
  },
] as PredictionMarketSeed[]).map(withMarketStory)

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

// No UI currently reads mpExtended/mpExtendedIndex — the two surfaces that
// did (MPVoteGrid's "Accuracy" column and /leaders' "Consistency" sort) were
// removed because calculateStickeeScore() is derived from a fixed per-party
// vote assumption over a handful of illustrative issues, not this MP's
// actual recorded votes, even though real vote data already exists in
// member_votes (synced from TheyVoteForYou). See
// docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md for what's needed before this is
// wired back up. Kept behind NEXT_PUBLIC_MP_SCORE_ENABLED (unset/false by
// default) rather than deleted, so a future real-data version doesn't need
// to re-plumb every call site — flip the flag and provide a real score
// source once one exists.
const MP_SCORE_ENABLED = process.env.NEXT_PUBLIC_MP_SCORE_ENABLED === 'true'

export const mpExtended: MPExtended[] = MPs.map(mp => ({
  id: mp.id,
  name: mp.name,
  party: mp.party,
  electorate: mp.electorate,
  stickeeScore: MP_SCORE_ENABLED ? calculateStickeeScore(mp.id) : 0,
  totalVotes: 5,
  predictionsCorrect: MP_SCORE_ENABLED ? Math.round(calculateStickeeScore(mp.id) / 100 * 5) : 0,
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
