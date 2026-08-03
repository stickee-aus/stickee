/**
 * simulator-engine.ts
 *
 * MiroFish-inspired prediction engine — purely client-side and deterministic.
 *
 * Every (scenario, alternative, seed) triple produces the same outcome, so
 * the same simulation can be re-run and shared. The engine takes a synthetic
 * Australian electorate (12 cohorts) and combines:
 *
 *   - the alternative's "bias" (-1 dovish ↔ +1 hawkish/restrictive)
 *   - the scenario's domain (markets / issues / leaders / geopolitics)
 *   - each cohort's pillar priorities and political lean
 *
 * to produce per-pillar score deltas, market moves, leader approval shifts,
 * a geopolitical-risk index move, and a sentiment breakdown with
 * representative quotes.
 *
 * The "country score" the engine assigns to each alternative is a weighted
 * blend of pillar improvement, sentiment, market reaction, geopolitical
 * stability, and inverse-cost. The recommended alternative is whichever
 * scores highest, with confidence reflecting how close the runner-up is.
 */

import type { PillarId } from '@/types/civic'
import type {
  Scenario,
  Alternative,
  AgentCohort,
  AlternativeOutcome,
  SimulationResult,
  PillarImpact,
  MarketImpact,
  LeaderImpact,
  SentimentBreakdown,
} from '@/types/simulator'
import { AGENT_COHORTS, TOTAL_POPULATION, SIMULATOR_LEADERS } from './mock-simulator-data'

// ─── Deterministic PRNG (mulberry32) ─────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function jitter(rng: () => number, magnitude: number): number {
  return (rng() - 0.5) * 2 * magnitude
}

// ─── Pillar impact ───────────────────────────────────────────────────────────

const ALL_PILLARS: PillarId[] = [
  'cost-of-living',
  'housing',
  'crime-safety',
  'jobs-economy',
  'future',
]

/** How a (domain, alternative bias) combination tends to move each pillar */
const PILLAR_RESPONSE: Record<string, Record<PillarId, number>> = {
  // Markets (e.g. RBA): negative bias = relief = good for cost-of-living, neutral on future
  'markets:-1': { 'cost-of-living': 4.2, housing: 1.8, 'crime-safety': 0, 'jobs-economy': 2.1, future: -0.5 },
  'markets:0':  { 'cost-of-living': 0.6, housing: 0,    'crime-safety': 0, 'jobs-economy': 0.4, future: 0.2 },
  'markets:1':  { 'cost-of-living': -3.0, housing: -2.2, 'crime-safety': 0, 'jobs-economy': -1.4, future: 0.8 },

  // Issues (housing/energy etc.): bias measures intervention strength
  'issues:-1': { 'cost-of-living': 1.0, housing: 0.5, 'crime-safety': 0.2, 'jobs-economy': 0.4, future: -0.6 },
  'issues:0':  { 'cost-of-living': 2.4, housing: 3.6, 'crime-safety': 0.4, 'jobs-economy': 1.2, future: 1.8 },
  'issues:1':  { 'cost-of-living': 3.6, housing: 5.4, 'crime-safety': 0.6, 'jobs-economy': -0.6, future: 2.6 },

  // Leaders: stronger bias = more disruptive, lower civic-pillar movement
  'leaders:-1': { 'cost-of-living': 0.8, housing: 0.4, 'crime-safety': 0.4, 'jobs-economy': 0.8, future: 1.0 },
  'leaders:0':  { 'cost-of-living': 0,   housing: 0,   'crime-safety': 0,   'jobs-economy': 0,   future: 0 },
  'leaders:1':  { 'cost-of-living': -0.4, housing: -0.6, 'crime-safety': 1.0, 'jobs-economy': -0.4, future: -1.4 },

  // Geopolitics: more assertive = future + crime-safety up, jobs-economy down
  'geopolitics:-1': { 'cost-of-living': 0.4, housing: 0,   'crime-safety': -0.4, 'jobs-economy': 1.2, future: -0.4 },
  'geopolitics:0':  { 'cost-of-living': 0,   housing: 0,   'crime-safety': 0.6,  'jobs-economy': 0.4, future: 0.8 },
  'geopolitics:1':  { 'cost-of-living': -0.8, housing: 0,   'crime-safety': 1.4, 'jobs-economy': -1.6, future: 1.6 },
}

function biasBucket(bias: number): -1 | 0 | 1 {
  if (bias <= -0.33) return -1
  if (bias >= 0.33) return 1
  return 0
}

function pillarImpact(
  scenario: Scenario,
  alt: Alternative,
  rng: () => number,
): PillarImpact[] {
  const key = `${scenario.domain}:${biasBucket(alt.bias)}`
  const base = PILLAR_RESPONSE[key]
  return ALL_PILLARS.map(p => {
    const delta = parseFloat((base[p] + jitter(rng, 1.0)).toFixed(1))
    return {
      pillarId: p,
      scoreDelta: delta,
      rationale: rationaleFor(scenario.domain, alt, p, delta),
    }
  })
}

function rationaleFor(
  domain: string,
  alt: Alternative,
  pillar: PillarId,
  delta: number,
): string {
  const dir = delta > 0.5 ? 'improves' : delta < -0.5 ? 'worsens' : 'is roughly neutral on'
  const map: Record<PillarId, string> = {
    'cost-of-living': 'household budgets',
    housing: 'rent and supply pressure',
    'crime-safety': 'community safety indicators',
    'jobs-economy': 'employment and growth',
    future: 'long-term resilience',
  }
  return `${alt.label} ${dir} ${map[pillar]}.`
}

// ─── Market impact ───────────────────────────────────────────────────────────

function marketImpact(
  scenario: Scenario,
  alt: Alternative,
  rng: () => number,
): MarketImpact {
  const b = alt.bias
  let asx = 0
  let aud = 0
  let winners: string[] = []
  let losers: string[] = []

  if (scenario.domain === 'markets') {
    // Cuts → ASX up, AUD down. Hikes → opposite.
    asx = -b * 1.6 + jitter(rng, 0.4)
    aud = b * 35 + jitter(rng, 8)
    if (b < 0) {
      winners = ['Banks', 'REITs', 'Discretionary retail']
      losers = ['Insurers', 'AUD-cash holders']
    } else if (b > 0) {
      winners = ['Insurers', 'Cash-rich industrials']
      losers = ['REITs', 'Mortgage-exposed banks']
    } else {
      winners = ['Defensives']
      losers = ['Growth tech']
    }
  } else if (scenario.domain === 'issues') {
    asx = -b * 0.8 + jitter(rng, 0.3)
    aud = b * 8 + jitter(rng, 5)
    if (alt.id.includes('housing')) {
      winners = b > 0 ? ['Affordable-housing REITs', 'Construction unions'] : ['Builders', 'Materials']
      losers = b > 0 ? ['Listed landlords', 'Mortgage banks'] : ['Renters (no relief)']
    } else if (alt.id.includes('energy') || alt.id.includes('grid')) {
      winners = b > 0 ? ['Transmission cos', 'Renewables developers'] : ['Households', 'Retailers']
      losers = b > 0 ? ['Coal generators'] : ['Grid investors']
    } else {
      winners = ['Domestic services']
      losers = ['Importers']
    }
  } else if (scenario.domain === 'leaders') {
    asx = -Math.abs(b) * 0.6 + jitter(rng, 0.4)
    aud = -Math.abs(b) * 12 + jitter(rng, 6)
    winners = ['Defensives']
    losers = b !== 0 ? ['Banks (uncertainty)'] : ['—']
  } else {
    // geopolitics
    asx = -b * 1.2 + jitter(rng, 0.5)
    aud = -b * 18 + jitter(rng, 8)
    if (b > 0) {
      winners = ['Defence primes', 'India-exposed exporters']
      losers = ['Iron ore', 'Wine', 'Education exports']
    } else {
      winners = ['Iron ore', 'Wine']
      losers = ['Defence primes']
    }
  }

  return {
    asx200Pct: parseFloat(asx.toFixed(2)),
    audUsdBp: Math.round(aud),
    winners,
    losers,
  }
}

// ─── Leader approval impact ──────────────────────────────────────────────────

const LEADER_BIAS_RESPONSE: Record<string, Record<string, number>> = {
  // dovish / relief plays well for the government and the Greens, less so for the Coalition
  'markets:-1': { 'mp-albanese': +2.4, 'mp-chalmers': +2.8, 'mp-dutton': -1.2, 'mp-butler': +1.4, 'mp-bandt': +1.0 },
  'markets:0':  { 'mp-albanese': +0.4, 'mp-chalmers': +0.6, 'mp-dutton': +0.2, 'mp-butler': +0.2, 'mp-bandt': -0.2 },
  'markets:1':  { 'mp-albanese': -1.6, 'mp-chalmers': -2.4, 'mp-dutton': +1.4, 'mp-butler': -0.6, 'mp-bandt': -0.4 },

  'issues:-1': { 'mp-albanese': -1.0, 'mp-chalmers': -0.8, 'mp-dutton': +1.6, 'mp-butler': -0.4, 'mp-bandt': -1.6 },
  'issues:0':  { 'mp-albanese': +1.4, 'mp-chalmers': +1.2, 'mp-dutton': -0.4, 'mp-butler': +1.0, 'mp-bandt': +0.4 },
  'issues:1':  { 'mp-albanese': +0.2, 'mp-chalmers': -0.6, 'mp-dutton': -1.6, 'mp-butler': +0.4, 'mp-bandt': +3.2 },

  'leaders:-1': { 'mp-albanese': -0.4, 'mp-chalmers': -0.4, 'mp-dutton': +1.2, 'mp-butler': -0.2, 'mp-bandt': -0.4 },
  'leaders:0':  { 'mp-albanese': +0.6, 'mp-chalmers': +0.4, 'mp-dutton': -0.4, 'mp-butler': +0.2, 'mp-bandt': +0.2 },
  'leaders:1':  { 'mp-albanese': +1.6, 'mp-chalmers': +0.8, 'mp-dutton': -2.4, 'mp-butler': +0.4, 'mp-bandt': +0.6 },

  'geopolitics:-1': { 'mp-albanese': +0.6, 'mp-chalmers': +0.4, 'mp-dutton': -0.6, 'mp-butler': +0.2, 'mp-bandt': +0.4 },
  'geopolitics:0':  { 'mp-albanese': +1.0, 'mp-chalmers': +0.6, 'mp-dutton': +0.2, 'mp-butler': +0.4, 'mp-bandt': -0.2 },
  'geopolitics:1':  { 'mp-albanese': +0.4, 'mp-chalmers': -0.4, 'mp-dutton': +1.6, 'mp-butler': -0.2, 'mp-bandt': -1.4 },
}

function leaderImpact(scenario: Scenario, alt: Alternative, rng: () => number): LeaderImpact {
  const key = `${scenario.domain}:${biasBucket(alt.bias)}`
  const base = LEADER_BIAS_RESPONSE[key]
  const out: Record<string, number> = {}
  for (const l of SIMULATOR_LEADERS) {
    out[l.mpId] = parseFloat(((base[l.mpId] ?? 0) + jitter(rng, 0.4)).toFixed(1))
  }
  return { approvalDeltaByMp: out }
}

// ─── Sentiment ───────────────────────────────────────────────────────────────

const COHORT_QUOTES: Record<string, { positive: string; negative: string }> = {
  'nsw-renters-young': {
    positive: 'Renters under 35 in Sydney say it\'s the first relief they\'ve felt in years.',
    negative: 'Sydney renters under 35 say it does nothing for the people locked out of the market.',
  },
  'nsw-mortgage-middle': {
    positive: 'Western Sydney mortgage holders welcome the breathing room.',
    negative: 'Western Sydney mortgage holders say their family budget is still in the red.',
  },
  'nsw-regional': {
    positive: 'Regional NSW owner-occupiers see a steadying hand.',
    negative: 'Regional NSW says Canberra is not listening to people outside the cities.',
  },
  'vic-inner-prog': {
    positive: 'Inner-Melbourne professionals call it overdue and consistent with the climate plan.',
    negative: 'Inner-Melbourne professionals warn it walks back the climate plan.',
  },
  'vic-outer-mortgage': {
    positive: 'Outer-Melbourne mortgage belt families say it\'s a fair deal.',
    negative: 'Outer-Melbourne mortgage belt families say it\'s a missed opportunity.',
  },
  'vic-regional': {
    positive: 'Regional Victoria says jobs and trades will hold up.',
    negative: 'Regional Victoria warns of pressure on farms and small business.',
  },
  'qld-seq-mortgage': {
    positive: 'SEQ mortgage belt says cost-of-living pressure finally getting a response.',
    negative: 'SEQ mortgage belt says half-measures won\'t move the needle.',
  },
  'qld-regional-mining': {
    positive: 'Regional Queensland mining communities back the move on jobs grounds.',
    negative: 'Regional Queensland mining communities warn of project deferrals.',
  },
  'wa-perth': {
    positive: 'Perth backs a steady hand from Canberra.',
    negative: 'Perth says the East Coast is calling the shots again.',
  },
  'wa-mining': {
    positive: 'WA mining regions say it preserves the investment pipeline.',
    negative: 'WA mining regions say it puts $20B of projects under review.',
  },
  'sa-adelaide': {
    positive: 'Adelaide households welcome the relief.',
    negative: 'Adelaide households say the budget is still going backwards.',
  },
  'tas-act-nt': {
    positive: 'TAS / ACT / NT residents back the long-term framing.',
    negative: 'TAS / ACT / NT residents say their priorities keep getting deprioritised.',
  },
}

function sentimentFor(
  scenario: Scenario,
  alt: Alternative,
  cohorts: AgentCohort[],
  rng: () => number,
): SentimentBreakdown {
  let approveWeighted = 0
  let disapproveWeighted = 0
  const cohortScores: { id: string; net: number }[] = []

  for (const c of cohorts) {
    // Each cohort has a baseline alignment with the alt's bias depending on lean
    const leanAlignment =
      c.lean === 'progressive' ? -alt.bias :
      c.lean === 'conservative' ? alt.bias :
      0
    // Cost-of-living / housing relief plays well across the board
    const reliefBonus =
      scenario.domain === 'markets' && alt.bias < 0 ? 0.4 :
      scenario.domain === 'issues' && c.priorities.includes('cost-of-living') && alt.bias >= 0 ? 0.3 :
      0
    // Income skew: low-income cohorts react harder to material relief
    const incomeWeight = c.income === 'low' ? 1.2 : c.income === 'high' ? 0.8 : 1
    const net = (leanAlignment * 0.6 + reliefBonus) * incomeWeight + jitter(rng, 0.15)

    cohortScores.push({ id: c.id, net })
    if (net > 0) approveWeighted += c.size * Math.min(net, 1)
    else disapproveWeighted += c.size * Math.min(-net, 1)
  }

  const total = approveWeighted + disapproveWeighted || 1
  const approvePct = Math.round((approveWeighted / total) * 100)
  const disapprovePct = 100 - approvePct

  // Pick top 2 endorsing and top 2 objecting cohorts for quotes
  cohortScores.sort((a, b) => b.net - a.net)
  const topEndorsements = cohortScores
    .filter(s => s.net > 0)
    .slice(0, 2)
    .map(s => COHORT_QUOTES[s.id]?.positive ?? '')
    .filter(Boolean)
  const topObjections = cohortScores
    .filter(s => s.net < 0)
    .slice(-2)
    .reverse()
    .map(s => COHORT_QUOTES[s.id]?.negative ?? '')
    .filter(Boolean)

  return { approvePct, disapprovePct, topObjections, topEndorsements }
}

// ─── Country score (the headline number) ─────────────────────────────────────

function countryScore(
  pillarImpacts: PillarImpact[],
  market: MarketImpact,
  geoDelta: number,
  sentiment: SentimentBreakdown,
  costPenalty: number,
): { score: number; confidence: number } {
  const pillarComponent = pillarImpacts.reduce((s, p) => s + p.scoreDelta, 0) // typical -10..+15
  const marketComponent = market.asx200Pct * 1.2                              // -3..+3
  const geoComponent = -geoDelta * 0.4                                        // -4..+4
  const sentimentComponent = (sentiment.approvePct - 50) * 0.3                // -15..+15
  const raw =
    50 +
    pillarComponent * 1.4 +
    marketComponent +
    geoComponent +
    sentimentComponent -
    costPenalty
  const score = Math.max(0, Math.min(100, Math.round(raw)))
  // Confidence = inverse of raw spread relative to neutral 50
  const confidence = Math.max(45, Math.min(95, Math.round(75 - Math.abs(50 - score) * 0.3 + sentiment.approvePct * 0.1)))
  return { score, confidence }
}

function costPenaltyFor(alt: Alternative): number {
  // Parse $XB into a small penalty so big-cost alternatives don't dominate
  const m = alt.costLabel.match(/\$(\d+(?:\.\d+)?)/)
  if (!m) return 0
  const billions = parseFloat(m[1])
  return Math.min(8, billions * 0.15)
}

// ─── Headline rationale ──────────────────────────────────────────────────────

function headlineFor(
  alt: Alternative,
  pillarImpacts: PillarImpact[],
  sentiment: SentimentBreakdown,
): string {
  const best = [...pillarImpacts].sort((a, b) => b.scoreDelta - a.scoreDelta)[0]
  const worst = [...pillarImpacts].sort((a, b) => a.scoreDelta - b.scoreDelta)[0]
  const pillarNames: Record<PillarId, string> = {
    'cost-of-living': 'cost-of-living',
    housing: 'housing',
    'crime-safety': 'community safety',
    'jobs-economy': 'jobs',
    future: 'long-term outlook',
  }
  if (best.scoreDelta > 1.5 && worst.scoreDelta < -1.5) {
    return `Improves ${pillarNames[best.pillarId]} but worsens ${pillarNames[worst.pillarId]}; ${sentiment.approvePct}% net approval.`
  }
  if (best.scoreDelta > 1.5) {
    return `Best for ${pillarNames[best.pillarId]}; ${sentiment.approvePct}% net approval across the synthetic electorate.`
  }
  if (worst.scoreDelta < -1.5) {
    return `Backslide on ${pillarNames[worst.pillarId]}; only ${sentiment.approvePct}% net approval.`
  }
  return `Modest movement across pillars; ${sentiment.approvePct}% approve, ${sentiment.disapprovePct}% disapprove.`
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function runSimulation(
  scenario: Scenario,
  alternatives: Alternative[],
  options?: { seed?: number; cohorts?: AgentCohort[] },
): SimulationResult {
  const cohorts = options?.cohorts ?? AGENT_COHORTS
  const baseSeed = options?.seed ?? hashString(scenario.id)
  const outcomes: AlternativeOutcome[] = alternatives.map((alt, idx) => {
    const seed = baseSeed + idx * 7919 + hashString(alt.id)
    const rng = mulberry32(seed)
    const pillarImpacts = pillarImpact(scenario, alt, rng)
    const market = marketImpact(scenario, alt, rng)
    const leaders = leaderImpact(scenario, alt, rng)
    const geoDelta = parseFloat(
      ((scenario.domain === 'geopolitics' ? alt.bias * 4 : alt.bias * 1.2) + jitter(rng, 0.6)).toFixed(1),
    )
    const sentiment = sentimentFor(scenario, alt, cohorts, rng)
    const costPenalty = costPenaltyFor(alt)
    const { score, confidence } = countryScore(pillarImpacts, market, geoDelta, sentiment, costPenalty)
    return {
      alternativeId: alt.id,
      countryScore: score,
      confidence,
      headline: headlineFor(alt, pillarImpacts, sentiment),
      pillarImpacts,
      marketImpact: market,
      leaderImpact: leaders,
      geopoliticalRiskDelta: geoDelta,
      sentiment,
    }
  })

  // Pick winner
  const sortedOutcomes = [...outcomes].sort((a, b) => b.countryScore - a.countryScore)
  const winner = sortedOutcomes[0]
  const runnerUp = sortedOutcomes[1]
  const margin = winner && runnerUp ? winner.countryScore - runnerUp.countryScore : 100

  const rationale = winner
    ? margin >= 6
      ? `${altLabel(alternatives, winner.alternativeId)} clearly outperforms — ${margin}-point margin over the next-best option, driven by ${dominantDriver(winner)}.`
      : `${altLabel(alternatives, winner.alternativeId)} narrowly leads (${margin}-point margin). Decision depends on weighting ${dominantDriver(winner)} vs cost.`
    : 'No alternatives provided.'

  return {
    scenarioId: scenario.id,
    outcomes,
    recommendedAlternativeId: winner?.alternativeId ?? alternatives[0]?.id ?? '',
    recommendationRationale: rationale,
    populationSize: cohorts.reduce((s, c) => s + c.size, 0) || TOTAL_POPULATION,
    ranAt: new Date().toISOString(),
    seed: baseSeed,
  }
}

function altLabel(alts: Alternative[], id: string): string {
  return alts.find(a => a.id === id)?.label ?? id
}

function dominantDriver(o: AlternativeOutcome): string {
  const best = [...o.pillarImpacts].sort((a, b) => Math.abs(b.scoreDelta) - Math.abs(a.scoreDelta))[0]
  const pillarNames: Record<PillarId, string> = {
    'cost-of-living': 'cost-of-living relief',
    housing: 'housing pressure',
    'crime-safety': 'community safety',
    'jobs-economy': 'jobs and growth',
    future: 'long-term resilience',
  }
  if (best && Math.abs(best.scoreDelta) > 2) return pillarNames[best.pillarId]
  if (o.sentiment.approvePct > 60) return 'broad public support'
  return 'mixed but defensible trade-offs'
}
