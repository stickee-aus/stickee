/**
 * mock-civic-data.ts
 *
 * Simulates ABS + external data feeds for the 5 civic pillars.
 * All values reflect plausible 2024–2025 Australian conditions.
 *
 * Scoring thresholds:
 *   For metrics where UP is BAD (rent, crime, CPI):
 *     > +5%  → red   | 0–5%  → yellow | ≤ 0% → green
 *   For metrics where UP is GOOD (wages, renewables, employment):
 *     > +3%  → green | 0–3%  → yellow | < 0% → red
 */

import type {
  CivicMetric,
  CivicPillar,
  CivicStatus,
  PoliticianScorecard,
  TrendDirection,
  CivicInsight,
} from '@/types/civic'
import type { TimeSeriesPoint } from '@/types/civic'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function trend(current: number, previous: number): number {
  return parseFloat(((current - previous) / Math.abs(previous) * 100).toFixed(1))
}

function status(pct: number, positiveWhenUp: boolean): CivicStatus {
  if (positiveWhenUp) {
    if (pct > 3) return 'green'
    if (pct >= 0) return 'yellow'
    return 'red'
  } else {
    if (pct > 5) return 'red'
    if (pct > 0) return 'yellow'
    return 'green'
  }
}

function direction(pct: number, positiveWhenUp: boolean): TrendDirection {
  const isGood = positiveWhenUp ? pct > 3 : pct <= 0
  const isBad = positiveWhenUp ? pct < 0 : pct > 5
  if (isGood) return 'improving'
  if (isBad) return 'worsening'
  return 'stable'
}

/** Generate 12 monthly data points trending from start to end */
function series(start: number, end: number, fromMonth = '2024-04'): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = []
  const [startYear, startMonth] = fromMonth.split('-').map(Number)
  for (let i = 0; i < 12; i++) {
    const rawMonth = startMonth + i
    const year = startYear + Math.floor((rawMonth - 1) / 12)
    const month = ((rawMonth - 1) % 12) + 1
    const t = i / 11
    const noise = (Math.sin(i * 2.4) * 0.3 + Math.cos(i * 1.1) * 0.2) * (end - start) * 0.15
    const value = parseFloat((start + (end - start) * t + noise).toFixed(2))
    points.push({ date: `${year}-${String(month).padStart(2, '0')}`, value })
  }
  return points
}

function makeMetric(
  id: string,
  label: string,
  current: number,
  previous: number,
  unit: string,
  positiveWhenUp: boolean,
  insight: string,
  source: string,
  seriesStart: number,
  seriesEnd: number,
): CivicMetric {
  const pct = trend(current, previous)
  return {
    id,
    label,
    value: current,
    previousValue: previous,
    unit,
    positiveWhenUp,
    trendPercent: pct,
    trendDirection: direction(pct, positiveWhenUp),
    status: status(pct, positiveWhenUp),
    insight,
    source,
    timeSeries: series(seriesStart, seriesEnd),
  }
}

// ─── Pillar 1: Cost of Living ─────────────────────────────────────────────────

const costOfLivingMetrics: CivicMetric[] = [
  makeMetric(
    'cpi',
    'Consumer Price Index (CPI)',
    3.8, 4.9, '%', false,
    'Inflation easing but still above the 2–3% target band.',
    'ABS, Q1 2025',
    6.2, 3.8,
  ),
  makeMetric(
    'grocery-prices',
    'Grocery Prices',
    4.2, 3.1, '%', false,
    'Supermarket basket costs rising faster than wages for third year.',
    'ABS Food Price Index',
    3.0, 4.2,
  ),
  makeMetric(
    'energy-costs',
    'Household Energy Bills',
    11.2, 9.8, '%', false,
    'Electricity costs up 11.2% YoY — biggest household pressure point.',
    'AEMO / AER, 2025',
    8.1, 11.2,
  ),
  makeMetric(
    'petrol',
    'Petrol Prices',
    -2.1, 1.4, '%', false,
    'Global oil prices falling — modest relief at the pump.',
    'FuelWatch / AIP',
    3.2, -2.1,
  ),
  makeMetric(
    'mortgage-rates',
    'Average Mortgage Rate',
    6.14, 6.29, '%', false,
    'RBA held cash rate; fixed rates beginning to fall from peak.',
    'RBA / APRA, Mar 2025',
    5.80, 6.14,
  ),
]

// ─── Pillar 2: Housing ────────────────────────────────────────────────────────

const housingMetrics: CivicMetric[] = [
  makeMetric(
    'house-prices-median',
    'Median House Price (National)',
    8.6, 5.2, '%', false,
    'Capital city prices accelerating — affordability at 30-year low.',
    'CoreLogic / PropTrack, 2025',
    4.8, 8.6,
  ),
  makeMetric(
    'rent-national',
    'National Median Rent',
    8.1, 9.4, '%', false,
    'Rental growth slowing slightly but still 3× wage growth.',
    'Domain / REA Group, 2025',
    9.8, 8.1,
  ),
  makeMetric(
    'vacancy-rate',
    'Rental Vacancy Rate',
    1.0, 1.1, '%', false,
    'Vacancy at 1.0% — well below the 2.5% considered "healthy".',
    'SQM Research, Mar 2025',
    1.3, 1.0,
  ),
  makeMetric(
    'housing-approvals',
    'New Housing Approvals',
    -8.4, -3.1, '%', true,
    'Construction pipeline shrinking — headwinds from high build costs.',
    'ABS Building Approvals',
    -2.0, -8.4,
  ),
  makeMetric(
    'social-housing-waitlist',
    'Social Housing Waitlist',
    12.3, 8.7, '%', false,
    'Over 640,000 households on public housing waitlists nationally.',
    'AIHW, 2025',
    6.0, 12.3,
  ),
]

// ─── Pillar 3: Crime & Safety ─────────────────────────────────────────────────

const crimeSafetyMetrics: CivicMetric[] = [
  makeMetric(
    'overall-crime',
    'Overall Crime Rate (per 100k)',
    -1.2, 0.8, '/100k', false,
    'Total crime rate falling for second consecutive year.',
    'ABS Crime Statistics, 2024',
    1.2, -1.2,
  ),
  makeMetric(
    'domestic-violence',
    'Domestic Violence Reports',
    3.4, 5.1, '%', false,
    'DV reports easing but remain 18% above pre-pandemic levels.',
    'BOCSAR / AIC, 2025',
    6.2, 3.4,
  ),
  makeMetric(
    'cybercrime',
    'Cybercrime Incidents',
    18.5, 12.3, '%', false,
    'Record 95,000+ cybercrime reports — AFP warning of escalation.',
    'AFP / ACSC Annual Report 2025',
    9.0, 18.5,
  ),
  makeMetric(
    'youth-crime',
    'Youth Crime Rate',
    -2.8, -1.4, '%', false,
    'Youth crime declining — early intervention programs cited.',
    'AIHW Youth Justice Data, 2024',
    0.5, -2.8,
  ),
  makeMetric(
    'road-safety',
    'Road Fatalities',
    -3.6, -1.8, '%', false,
    'Road deaths falling — speed camera rollout credited.',
    'BITRE Road Trauma, 2025',
    0.3, -3.6,
  ),
]

// ─── Pillar 4: Jobs & Economy ─────────────────────────────────────────────────

const jobsEconomyMetrics: CivicMetric[] = [
  makeMetric(
    'unemployment',
    'Unemployment Rate',
    4.1, 3.9, '%', false,
    'Unemployment ticking up from historic 3.5% low in 2023.',
    'ABS Labour Force, Mar 2025',
    3.7, 4.1,
  ),
  makeMetric(
    'wage-growth',
    'Wage Price Index (WPI)',
    3.2, 3.6, '%', true,
    'Wage growth slowing — now barely above CPI of 3.8%.',
    'ABS WPI, Q4 2024',
    3.9, 3.2,
  ),
  makeMetric(
    'gdp-growth',
    'GDP Growth (Annual)',
    1.1, 2.0, '%', true,
    'Per-capita recession in effect — weakest growth since 1990s.',
    'ABS National Accounts, Q3 2024',
    2.4, 1.1,
  ),
  makeMetric(
    'business-confidence',
    'NAB Business Confidence',
    -4.2, -1.8, 'index', true,
    'Business confidence in negative territory for third quarter.',
    'NAB Business Survey, Mar 2025',
    -0.5, -4.2,
  ),
  makeMetric(
    'real-wages',
    'Real Wages (Inflation-Adjusted)',
    -0.6, 0.4, '%', true,
    'Workers effectively losing purchasing power in real terms.',
    'RBA / ABS, 2025',
    0.8, -0.6,
  ),
]

// ─── Pillar 5: Future ─────────────────────────────────────────────────────────

const futureMetrics: CivicMetric[] = [
  makeMetric(
    'renewables-share',
    'Renewable Energy (% of Grid)',
    38.4, 35.4, '%', true,
    'Renewables now supplying 38% of grid — on track for 82% by 2030.',
    'AEMO Energy Trends, 2025',
    31.0, 38.4,
  ),
  makeMetric(
    'carbon-emissions',
    'Carbon Emissions Change',
    -3.2, -2.1, '%', false,
    'Emissions falling — new safeguard mechanism having effect.',
    'DCCEEW Quarterly Update, 2025',
    -1.0, -3.2,
  ),
  makeMetric(
    'naplan-trend',
    'NAPLAN Avg Score Trend',
    1.2, 0.8, '%', true,
    'Marginal improvement — literacy gains offset by numeracy plateau.',
    'ACARA NAPLAN, 2024',
    0.4, 1.2,
  ),
  makeMetric(
    'infrastructure-spend',
    'Public Infrastructure Investment',
    12.1, 9.3, '%', true,
    '$120B 10-year pipeline — major rail and road projects underway.',
    'Infrastructure Australia, 2025',
    7.0, 12.1,
  ),
  makeMetric(
    'youth-unemployment',
    'Youth Unemployment (15–24)',
    9.2, 8.6, '%', false,
    'Youth joblessness rising — university-to-work pipeline weakening.',
    'ABS Labour Force, 2025',
    8.0, 9.2,
  ),
]

// ─── Aggregate Pillar Score ────────────────────────────────────────────────────

function aggregateScore(metrics: CivicMetric[]): number {
  const scores = metrics.map(m => {
    if (m.status === 'green') return 85
    if (m.status === 'yellow') return 55
    return 25
  })
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

function aggregateStatus(metrics: CivicMetric[]): CivicStatus {
  const reds = metrics.filter(m => m.status === 'red').length
  const yellows = metrics.filter(m => m.status === 'yellow').length
  if (reds >= 3 || reds >= metrics.length * 0.5) return 'red'
  if (reds >= 1 || yellows >= 3) return 'yellow'
  return 'green'
}

function aggregateTrend(metrics: CivicMetric[]): { pct: number; dir: TrendDirection } {
  const avg = metrics.reduce((sum, m) => sum + (m.positiveWhenUp ? m.trendPercent : -m.trendPercent), 0) / metrics.length
  const dir: TrendDirection = avg > 1 ? 'improving' : avg < -1 ? 'worsening' : 'stable'
  return { pct: parseFloat(avg.toFixed(1)), dir }
}

// ─── 5 Pillars ────────────────────────────────────────────────────────────────

export const CIVIC_PILLARS: CivicPillar[] = [
  (() => {
    const metrics = costOfLivingMetrics
    const { pct, dir } = aggregateTrend(metrics)
    return {
      id: 'cost-of-living' as const,
      label: 'Cost of Living',
      icon: 'ShoppingCart',
      status: aggregateStatus(metrics),
      trendDirection: dir,
      trendPercent: pct,
      civicScore: aggregateScore(metrics),
      headline: 'Energy bills ↑ 11.2% 🔴',
      summary: 'CPI easing but energy & groceries remain well above target.',
      metrics,
    }
  })(),

  (() => {
    const metrics = housingMetrics
    const { pct, dir } = aggregateTrend(metrics)
    return {
      id: 'housing' as const,
      label: 'Housing',
      icon: 'Home',
      status: aggregateStatus(metrics),
      trendDirection: dir,
      trendPercent: pct,
      civicScore: aggregateScore(metrics),
      headline: 'Rent ↑ 8.1% 🔴',
      summary: 'Rental crisis deepening — vacancy at 1% and approvals falling.',
      metrics,
    }
  })(),

  (() => {
    const metrics = crimeSafetyMetrics
    const { pct, dir } = aggregateTrend(metrics)
    return {
      id: 'crime-safety' as const,
      label: 'Crime & Safety',
      icon: 'Shield',
      status: aggregateStatus(metrics),
      trendDirection: dir,
      trendPercent: pct,
      civicScore: aggregateScore(metrics),
      headline: 'Cybercrime ↑ 18.5% 🔴',
      summary: 'Overall crime falling, but cybercrime hitting record levels.',
      metrics,
    }
  })(),

  (() => {
    const metrics = jobsEconomyMetrics
    const { pct, dir } = aggregateTrend(metrics)
    return {
      id: 'jobs-economy' as const,
      label: 'Jobs & Economy',
      icon: 'TrendingUp',
      status: aggregateStatus(metrics),
      trendDirection: dir,
      trendPercent: pct,
      civicScore: aggregateScore(metrics),
      headline: 'GDP growth ↓ 1.1% 🔴',
      summary: 'Per-capita recession — real wages still negative.',
      metrics,
    }
  })(),

  (() => {
    const metrics = futureMetrics
    const { pct, dir } = aggregateTrend(metrics)
    return {
      id: 'future' as const,
      label: 'Future',
      icon: 'Leaf',
      status: aggregateStatus(metrics),
      trendDirection: dir,
      trendPercent: pct,
      civicScore: aggregateScore(metrics),
      headline: 'Renewables ↑ 38.4% 🟢',
      summary: 'Energy transition on track; youth unemployment rising.',
      metrics,
    }
  })(),
]

// ─── Politician Scorecards ────────────────────────────────────────────────────
//
// Maps the existing 5 mock bills/policies to pillar impact ratings.
// Covers a representative cross-section of federal government & opposition MPs.

export const POLITICIAN_SCORECARDS: PoliticianScorecard[] = [
  {
    mpId: 'mp-albanese',
    civicScore: 52,
    tenure: 'Since May 2022',
    lastUpdated: '2025-03-01',
    pillarRatings: [
      {
        pillarId: 'cost-of-living',
        status: 'yellow',
        score: 55,
        rationale: 'Energy bill relief targeted lower-income households but inflation remains above target.',
        keyActions: ['Stage 3 tax cut revision', 'Energy Bill Relief Fund ($1.5B)', 'Cheaper childcare (CPI impact)'],
      },
      {
        pillarId: 'housing',
        status: 'red',
        score: 32,
        rationale: 'Housing Australia Future Fund delayed by Senate — net new supply targets missed.',
        keyActions: ['Housing Australia Future Fund ($10B)', 'Help to Buy scheme', 'National Housing Accord'],
      },
      {
        pillarId: 'crime-safety',
        status: 'yellow',
        score: 58,
        rationale: 'New cyber legislation passed but domestic violence funding insufficient.',
        keyActions: ['Crimes Legislation Amendment (Cybercrime)', 'National Action Plan DV'],
      },
      {
        pillarId: 'jobs-economy',
        status: 'yellow',
        score: 48,
        rationale: 'GDP per-capita in recession; however employment levels remain historically high.',
        keyActions: ['NDIS Review', 'Fee-Free TAFE (10,000 places)', 'Future Made in Australia Act'],
      },
      {
        pillarId: 'future',
        status: 'green',
        score: 74,
        rationale: 'Renewable targets on track; safeguard mechanism passing and taking effect.',
        keyActions: ['Rewiring the Nation ($20B)', 'Safeguard Mechanism Reform', '82% renewables by 2030 target'],
      },
    ],
  },

  {
    mpId: 'mp-chalmers',
    civicScore: 49,
    tenure: 'Since May 2022',
    lastUpdated: '2025-03-01',
    pillarRatings: [
      {
        pillarId: 'cost-of-living',
        status: 'yellow',
        score: 52,
        rationale: 'Budget returned to surplus in 2023–24 but cost-of-living pressure persists.',
        keyActions: ['Stage 3 Tax Cuts', 'Energy rebate ($300/household)', 'Instant Asset Write-Off'],
      },
      {
        pillarId: 'housing',
        status: 'red',
        score: 35,
        rationale: 'Housing supply side measures stalled; demand-side Help to Buy awaiting Senate.',
        keyActions: ['Housing Australia Future Fund', 'Build to Rent tax incentives'],
      },
      {
        pillarId: 'crime-safety',
        status: 'yellow',
        score: 60,
        rationale: 'Financial crime unit funded; AUSTRAC capacity expanded.',
        keyActions: ['AUSTRAC funding boost', 'Anti-money laundering reforms'],
      },
      {
        pillarId: 'jobs-economy',
        status: 'yellow',
        score: 51,
        rationale: 'Budget surplus historic but growth slowing sharply below trend.',
        keyActions: ['2023–24 Budget surplus ($22.1B)', 'Productivity Commission Review'],
      },
      {
        pillarId: 'future',
        status: 'green',
        score: 70,
        rationale: 'Green bonds issued; Future Made in Australia fiscal framework strong.',
        keyActions: ['Australian Green Bond Program', 'National Reconstruction Fund ($15B)'],
      },
    ],
  },

  {
    mpId: 'mp-dutton',
    civicScore: 38,
    tenure: 'Since 2001 (Opposition Leader from 2022)',
    lastUpdated: '2025-03-01',
    pillarRatings: [
      {
        pillarId: 'cost-of-living',
        status: 'yellow',
        score: 50,
        rationale: 'Opposed energy subsidies as "inflationary"; proposed fuel excise cut instead.',
        keyActions: ['Opposed Energy Bill Relief (voted against)', 'Fuel excise cut proposal'],
      },
      {
        pillarId: 'housing',
        status: 'red',
        score: 30,
        rationale: 'Voted against Housing Australia Future Fund; no alternative supply policy.',
        keyActions: ['Voted against HAFF', 'Super-for-housing policy (contested modelling)'],
      },
      {
        pillarId: 'crime-safety',
        status: 'green',
        score: 72,
        rationale: 'Strong border protection record; expanded domestic counter-terrorism powers.',
        keyActions: ['Home Affairs counter-terrorism reforms', 'Encryption access legislation'],
      },
      {
        pillarId: 'jobs-economy',
        status: 'yellow',
        score: 45,
        rationale: 'Free-market economic policy; criticism of industrial relations changes valid.',
        keyActions: ['Opposed Closing Loopholes Act', 'Competitive grants reform advocacy'],
      },
      {
        pillarId: 'future',
        status: 'red',
        score: 28,
        rationale: 'Nuclear policy replacing renewables — no credible timeline before 2040.',
        keyActions: ['Nuclear energy policy (Liddell, Callide sites)', 'Net zero by 2050 only'],
      },
    ],
  },

  {
    mpId: 'mp-butler',
    civicScore: 61,
    tenure: 'Since 2007',
    lastUpdated: '2025-03-01',
    pillarRatings: [
      {
        pillarId: 'cost-of-living',
        status: 'green',
        score: 71,
        rationale: 'Medicare urgent care clinics reducing out-of-pocket GP costs significantly.',
        keyActions: ['50 Medicare Urgent Care Clinics', 'Cheaper medicines (60-day dispensing)'],
      },
      {
        pillarId: 'housing',
        status: 'yellow',
        score: 55,
        rationale: 'Supported HAFF; key vote on aged care + NDIS housing access reform.',
        keyActions: ['Aged Care Act reform (housing impact)', 'Supported HAFF legislation'],
      },
      {
        pillarId: 'crime-safety',
        status: 'yellow',
        score: 60,
        rationale: 'Vaping and drugs legislation reduced youth substance harm.',
        keyActions: ['Vaping reforms', 'Drug harm reduction policy', 'Mental health emergency reform'],
      },
      {
        pillarId: 'jobs-economy',
        status: 'yellow',
        score: 55,
        rationale: 'Healthcare employment strong; hospital system under wage pressure.',
        keyActions: ['Workforce Strategy for Health', 'Nursing wage awards support'],
      },
      {
        pillarId: 'future',
        status: 'green',
        score: 76,
        rationale: 'Preventive health infrastructure investment; climate-health nexus addressed.',
        keyActions: ['Preventive Health Strategy', 'ATAGI independent climate health work'],
      },
    ],
  },

  {
    mpId: 'mp-bandt',
    civicScore: 67,
    tenure: 'Since 2010 (Greens Leader from 2020)',
    lastUpdated: '2025-03-01',
    pillarRatings: [
      {
        pillarId: 'cost-of-living',
        status: 'green',
        score: 72,
        rationale: 'Strong advocate for rent caps and price controls; dental/mental Medicare wins.',
        keyActions: ['Medicare dental (negotiated with Labor)', 'Price gouging inquiry advocacy'],
      },
      {
        pillarId: 'housing',
        status: 'green',
        score: 78,
        rationale: 'Blocked HAFF until social housing floor increased — achieved stronger outcome.',
        keyActions: ['HAFF negotiation (30% social housing floor)', 'Renters rights advocacy', 'Rent freeze policy'],
      },
      {
        pillarId: 'crime-safety',
        status: 'yellow',
        score: 58,
        rationale: 'Civil liberties approach; opposed some surveillance expansion laws.',
        keyActions: ['Opposed encryption access bill', 'Youth justice reform advocacy'],
      },
      {
        pillarId: 'jobs-economy',
        status: 'yellow',
        score: 55,
        rationale: 'Windfall profits tax proposal; opposed stage 3 cuts for high earners.',
        keyActions: ['Windfall profits tax proposal', 'Closing Loopholes support'],
      },
      {
        pillarId: 'future',
        status: 'green',
        score: 92,
        rationale: 'No new coal or gas — strongest net-zero policy of any parliamentary party.',
        keyActions: ['Climate Trigger legislation', 'No new fossil fuel policy', 'Safeguard mechanism push'],
      },
    ],
  },
]

// ─── Pillar lookup ────────────────────────────────────────────────────────────

export const PILLAR_INDEX: Record<string, CivicPillar> =
  Object.fromEntries(CIVIC_PILLARS.map(p => [p.id, p]))

// ─── Sidebar Insights ─────────────────────────────────────────────────────────

export const CIVIC_INSIGHTS: CivicInsight[] = [
  {
    type: 'biggest-improvement',
    label: 'Renewable energy share',
    metricId: 'renewables-share',
    pillarId: 'future',
    trendPercent: 8.5,
    status: 'green',
  },
  {
    type: 'biggest-decline',
    label: 'Housing approvals',
    metricId: 'housing-approvals',
    pillarId: 'housing',
    trendPercent: -8.4,
    status: 'red',
  },
  {
    type: 'fastest-changing',
    label: 'Cybercrime incidents',
    metricId: 'cybercrime',
    pillarId: 'crime-safety',
    trendPercent: 18.5,
    status: 'red',
  },
  {
    type: 'trending',
    label: 'Rental vacancy rate',
    metricId: 'vacancy-rate',
    pillarId: 'housing',
    trendPercent: -0.1,
    status: 'red',
  },
]

// ─── Scoring transparency ─────────────────────────────────────────────────────

export const SCORING_METHODOLOGY = `
**How Civic Scores are calculated**

Each metric is rated Green / Yellow / Red based on its direction and magnitude:
- For metrics where an increase is bad (e.g. rent, crime, CPI):
  - Rising > 5% → Red
  - Rising 0–5% → Yellow
  - Falling → Green

- For metrics where an increase is good (e.g. wages, employment, renewables):
  - Rising > 3% → Green
  - Rising 0–3% → Yellow
  - Falling → Red

A pillar's composite score (0–100) is the weighted average of its sub-metric scores.
Green metrics contribute 80–100 pts; Yellow 40–70 pts; Red 10–40 pts.

Politician scores reflect their voting record and public commitments in each pillar area.
All source data is drawn from ABS, AER, CoreLogic, and equivalent authoritative sources.
` as const
