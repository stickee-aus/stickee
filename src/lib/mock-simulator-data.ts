/**
 * mock-simulator-data.ts
 *
 * Seed scenarios for the MiroFish-inspired prediction sandbox.
 * Each scenario is a real-world Australian event the user might want
 * to "rehearse" by comparing alternative responses.
 *
 * Synthetic population is a stylised Australian electorate broken into
 * 12 cohorts that together cover the major axes of difference (state,
 * income, age proxy via lean, urban/regional). Sizes are proportional
 * to ABS 2024 estimates but rounded for legibility.
 */

import type {
  Scenario,
  Alternative,
  AgentCohort,
  ScenarioDomain,
} from '@/types/simulator'

// ─── Synthetic Australian electorate ─────────────────────────────────────────

export const AGENT_COHORTS: AgentCohort[] = [
  // NSW
  {
    id: 'nsw-renters-young',
    label: 'Renters under 35 · Greater Sydney',
    size: 1_120_000,
    state: 'NSW',
    income: 'low',
    lean: 'progressive',
    priorities: ['housing', 'cost-of-living'],
  },
  {
    id: 'nsw-mortgage-middle',
    label: 'Mortgage holders · Western Sydney',
    size: 980_000,
    state: 'NSW',
    income: 'middle',
    lean: 'centrist',
    priorities: ['cost-of-living', 'jobs-economy'],
  },
  {
    id: 'nsw-regional',
    label: 'Regional NSW · Owner-occupiers',
    size: 540_000,
    state: 'NSW',
    income: 'middle',
    lean: 'conservative',
    priorities: ['jobs-economy', 'crime-safety'],
  },

  // VIC
  {
    id: 'vic-inner-prog',
    label: 'Inner-Melbourne professionals',
    size: 720_000,
    state: 'VIC',
    income: 'high',
    lean: 'progressive',
    priorities: ['future', 'housing'],
  },
  {
    id: 'vic-outer-mortgage',
    label: 'Outer-Melbourne mortgage belt',
    size: 860_000,
    state: 'VIC',
    income: 'middle',
    lean: 'centrist',
    priorities: ['cost-of-living', 'crime-safety'],
  },
  {
    id: 'vic-regional',
    label: 'Regional VIC · Farming + trades',
    size: 410_000,
    state: 'VIC',
    income: 'middle',
    lean: 'conservative',
    priorities: ['jobs-economy', 'future'],
  },

  // QLD
  {
    id: 'qld-seq-mortgage',
    label: 'SE Queensland · Mortgage belt',
    size: 940_000,
    state: 'QLD',
    income: 'middle',
    lean: 'centrist',
    priorities: ['cost-of-living', 'housing'],
  },
  {
    id: 'qld-regional-mining',
    label: 'Regional QLD · Mining + agriculture',
    size: 480_000,
    state: 'QLD',
    income: 'middle',
    lean: 'conservative',
    priorities: ['jobs-economy', 'future'],
  },

  // WA
  {
    id: 'wa-perth',
    label: 'Perth metro · Mixed',
    size: 760_000,
    state: 'WA',
    income: 'middle',
    lean: 'centrist',
    priorities: ['jobs-economy', 'cost-of-living'],
  },
  {
    id: 'wa-mining',
    label: 'WA mining regions',
    size: 220_000,
    state: 'WA',
    income: 'high',
    lean: 'conservative',
    priorities: ['jobs-economy', 'future'],
  },

  // SA / TAS / ACT / NT
  {
    id: 'sa-adelaide',
    label: 'Greater Adelaide · Mixed',
    size: 480_000,
    state: 'SA',
    income: 'middle',
    lean: 'centrist',
    priorities: ['cost-of-living', 'jobs-economy'],
  },
  {
    id: 'tas-act-nt',
    label: 'TAS / ACT / NT · Aggregate',
    size: 420_000,
    state: 'ACT',
    income: 'middle',
    lean: 'progressive',
    priorities: ['future', 'crime-safety'],
  },
]

export const TOTAL_POPULATION = AGENT_COHORTS.reduce((s, c) => s + c.size, 0)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function alt(
  id: string,
  label: string,
  description: string,
  bias: number,
  costLabel: string,
): Alternative {
  return { id, label, description, bias, costLabel }
}

// ─── Preset scenarios ────────────────────────────────────────────────────────

export const SCENARIOS: Scenario[] = [
  // ─── Markets ──────────────────────────────────────────────────────────────
  {
    id: 'rba-cash-rate-may',
    domain: 'markets',
    title: 'RBA May cash rate decision',
    summary:
      'Headline CPI at 3.8%, real wages still negative, mortgage stress at 11-year high. Board meets in 3 weeks.',
    context:
      'The Reserve Bank board meets on the first Tuesday of May. Markets are pricing in a 60% chance of a 25bp cut. Inflation is easing but services prices remain sticky and the labour market has loosened (unemployment 4.1%, up from 3.5%). A cut would relieve mortgage holders but risks reigniting the housing market and adding to inflation. A hold preserves credibility but extends mortgage stress. A surprise hike is being floated by hawks at NAB.',
    icon: 'BarChart3',
    source: 'RBA / ABS, projected May 2025',
    seededAt: '2025-04-15',
    defaultAlternatives: [
      alt('rba-cut', 'Cut 25bp', 'Lower cash rate to 4.10%. Signals end of tightening cycle.', -1, 'Budget neutral'),
      alt('rba-hold', 'Hold', 'Leave cash rate at 4.35%. Continue data-dependent guidance.', 0, 'Budget neutral'),
      alt('rba-hike', 'Hike 25bp', 'Lift cash rate to 4.60%. Signal inflation is the priority.', 1, 'Budget neutral'),
    ],
  },
  {
    id: 'asx-mining-tax',
    domain: 'markets',
    title: 'Critical-minerals royalty proposal',
    summary:
      'Treasury floats a 4% production royalty on lithium, cobalt and rare earths to fund Future Made in Australia.',
    context:
      'A leaked Treasury options paper proposes a 4% royalty on critical-minerals production from 2026, raising an estimated $3.2B/year. Mining lobby is opposed; Greens want 8%. The policy is being framed as a way to capture more value from the energy transition, but WA Premier has warned of project deferrals.',
    icon: 'Pickaxe',
    source: 'Treasury options paper (leaked)',
    seededAt: '2026-04-10',
    defaultAlternatives: [
      alt('mining-no-tax', 'No royalty', 'Drop the proposal. Maintain status quo.', -1, 'Forgone $3.2B/yr'),
      alt('mining-4pct', 'Introduce 4% royalty', 'Phased in over 3 years from FY26.', 0, '$3.2B/yr revenue'),
      alt('mining-8pct', 'Introduce 8% royalty', 'Greens-style "windfall" rate, ringfenced for housing.', 1, '$6.4B/yr revenue'),
    ],
  },

  // ─── Issues ───────────────────────────────────────────────────────────────
  {
    id: 'housing-supply-package',
    domain: 'issues',
    title: 'Housing supply emergency package',
    summary:
      'Vacancy at 1.0%, rent up 8.1% YoY, social housing waitlist 640k. Cabinet weighing a $20B response.',
    context:
      'Housing has been the #1 cited cost-of-living concern in 11 of the last 12 ANU election monitor surveys. The HAFF is delivering more slowly than projected. Treasury has modelled three responses: a supply-only package, a mixed supply + demand package, and a sweeping rent-control + social-housing package backed by the Greens.',
    icon: 'Home',
    source: 'Treasury / Housing Australia, 2025',
    seededAt: '2025-04-22',
    defaultAlternatives: [
      alt('housing-supply', 'Supply-only ($12B)', '40k new social dwellings + planning override over 5 years.', -0.4, '$12B over 5yr'),
      alt('housing-mixed', 'Supply + Help-to-Buy ($20B)', 'Adds 50k shared-equity places + first-home concessions.', 0, '$20B over 5yr'),
      alt('housing-rent-cap', 'Supply + national rent cap', '50k dwellings + 2-year CPI-linked rent cap; states opt-in.', 0.6, '$22B + states'),
    ],
  },
  {
    id: 'energy-transition',
    domain: 'issues',
    title: 'Energy bill relief vs grid investment',
    summary:
      'Household power bills up 11.2% YoY. Government has $4B unallocated to either rebates or grid build-out.',
    context:
      'AEMO needs $20B in transmission upgrades to hit the 82% renewables target by 2030. The Treasurer has $4B from the spectrum auction unspent. Direct rebates polled best in marginal seats; grid investment polled best with under-35s and business.',
    icon: 'Zap',
    source: 'AEMO / Treasury, 2026',
    seededAt: '2026-03-30',
    defaultAlternatives: [
      alt('energy-rebates', 'Rebates ($300/household)', 'Direct $300 credit applied automatically Q3.', -1, '$3.6B'),
      alt('energy-grid', 'Grid investment', 'Allocate to AEMO transmission build-out.', 1, '$4.0B'),
      alt('energy-split', 'Split: $200 rebate + $1.6B grid', 'Compromise: smaller rebate, partial grid funding.', 0, '$4.0B'),
    ],
  },

  // ─── Leaders ──────────────────────────────────────────────────────────────
  {
    id: 'leadership-spill',
    domain: 'leaders',
    title: 'Liberal leadership question',
    summary:
      'Two-party preferred at 47/53 against the Coalition. Backbench discussion of a leadership change after Easter.',
    context:
      'Newspoll has the Coalition trailing in 2PP for the 9th consecutive month. A backbench faction is discussing whether to move on the leader before the budget reply. Possible alternatives: keep current leader, install a moderate, install a populist outsider.',
    icon: 'Users',
    source: 'Newspoll / internal Coalition party room',
    seededAt: '2026-04-18',
    defaultAlternatives: [
      alt('lead-stay', 'Status quo', 'Current leader stays. Focus on budget reply differentiation.', 0, 'No cost'),
      alt('lead-moderate', 'Moderate replacement', 'Install a centre-aligned woman MP from a city seat.', -0.4, 'Internal cost'),
      alt('lead-outsider', 'Populist replacement', 'Install a regional, anti-establishment MP. Pivot on immigration.', 0.8, 'Internal cost'),
    ],
  },

  // ─── Geopolitics ──────────────────────────────────────────────────────────
  {
    id: 'china-trade-pause',
    domain: 'geopolitics',
    title: 'China imposes 60-day barley review',
    summary:
      'MOFCOM announces a 60-day "anti-dumping" review of Australian barley exports. WA is most exposed.',
    context:
      'China lifted the 80% tariff on Australian barley in 2023. A new 60-day review has been announced citing "anomalous shipping patterns". Australian grain exporters could lose up to $1.1B if the review reimposes duties. The government has three classic options: quiet diplomatic engagement, a public WTO challenge, or a coordinated allies-and-pivot strategy.',
    icon: 'Globe',
    source: 'DFAT / MOFCOM, projected',
    seededAt: '2026-04-25',
    defaultAlternatives: [
      alt('china-quiet', 'Quiet diplomacy', 'Trade Minister visits Beijing. No public escalation.', -0.6, 'Low cost'),
      alt('china-wto', 'WTO challenge', 'File at WTO and brief the press. Defend the rules-based order.', 0.4, 'Legal cost'),
      alt('china-pivot', 'Allies + market pivot', 'Coordinated US/EU statement; $400M to fast-track India + Indonesia trade.', 0.9, '$400M'),
    ],
  },
]

// ─── Lookups ─────────────────────────────────────────────────────────────────

export const SCENARIO_INDEX: Record<string, Scenario> = Object.fromEntries(
  SCENARIOS.map(s => [s.id, s]),
)

export const DOMAIN_LABEL: Record<ScenarioDomain, string> = {
  markets: 'Markets',
  issues: 'Issues',
  leaders: 'Leaders',
  geopolitics: 'Geopolitics',
}

export const DOMAIN_ACCENT: Record<ScenarioDomain, string> = {
  markets: '#2ec266',
  issues: '#f5a623',
  leaders: '#7c8cff',
  geopolitics: '#f04747',
}

// Names for the leader-impact panel — keyed to mock-civic-data scorecards
export const SIMULATOR_LEADERS: { mpId: string; name: string; party: string }[] = [
  { mpId: 'mp-albanese', name: 'Anthony Albanese', party: 'Labor' },
  { mpId: 'mp-chalmers', name: 'Jim Chalmers',     party: 'Labor' },
  { mpId: 'mp-dutton',   name: 'Angus Taylor',     party: 'Coalition' },
  { mpId: 'mp-butler',   name: 'Mark Butler',      party: 'Labor' },
  { mpId: 'mp-bandt',    name: 'Adam Bandt',       party: 'Greens' },
]
