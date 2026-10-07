// Senate mock data — composition, per-bill votes, bill progress tracker

import type { BillVoteRow } from './mock-parliament-data'

// ─── Senate composition ───────────────────────────────────────────────────────
// 48th Parliament · 76 senators (12 per state, 2 per territory)

export const SENATE_SEAT_COUNTS: Record<string, number> = {
  'Labor':                  29,
  'Coalition':              27,
  'Greens':                 10,
  'One Nation':              4,
  'Independent':             3,
  "Australia's Voice":       1,
  'Jacqui Lambie Network':   1,
  'United Australia Party':  1,
}

export const SENATE_PARTY_COLORS: Record<string, string> = {
  'Labor':                  '#E53935',
  'Coalition':              '#1565C0',
  'Greens':                 '#2E7D32',
  'One Nation':             '#FF6F00',
  'Independent':            '#EC407A',
  "Australia's Voice":      '#14B8A6',
  'Jacqui Lambie Network':  '#7C3AED',
  'United Australia Party': '#F59E0B',
}

// Ordered for display: Govt → Crossbench → Opposition
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

export const SENATE_PARTIES_TO_SHOW = [
  'Labor', 'Coalition', 'Greens', 'One Nation', 'Independent',
] as const

export const SENATE_MAJORITY = 39 // of 76

// ─── Bill progress through both chambers ──────────────────────────────────────

export type StageStatus = 'passed' | 'ongoing' | 'pending' | 'failed'

export interface BillProgress {
  house:       StageStatus
  senate:      StageStatus
  royalAssent: StageStatus
}

export const BILL_PROGRESS: Record<string, BillProgress> = {
  'housing-affordability': { house: 'passed',  senate: 'ongoing', royalAssent: 'pending' },
  'climate-safeguard':     { house: 'passed',  senate: 'passed',  royalAssent: 'passed'  },
  'ndis-reform':           { house: 'ongoing', senate: 'pending', royalAssent: 'pending' },
  'tax-cuts':              { house: 'passed',  senate: 'passed',  royalAssent: 'passed'  },
  'misinformation-bill':   { house: 'ongoing', senate: 'pending', royalAssent: 'pending' },
}

// ─── Senate bill vote rows (same shape as BillVoteRow for component reuse) ────

export const senateBillVoteRows: BillVoteRow[] = [
  {
    id:   'housing-affordability',
    name: 'Help to Buy (Housing)',
    status: 'ongoing',
    publicPrediction: 51,
    change:  +0.8,
    volume:  2140,
    sparkline: [44, 45, 46, 46, 47, 48, 49, 49, 50, 50, 51, 51, 51, 51],
    parties: {
      'Labor':                  { party: 'Labor',                  direction: 'for',     forCount: 29, againstCount: 0,  abstainCount: 0, totalSeats: 29, keyMPs: ['Penny Wong', 'Katy Gallagher'] },
      'Coalition':              { party: 'Coalition',              direction: 'against', forCount: 0,  againstCount: 27, abstainCount: 0, totalSeats: 27, keyMPs: ['Michaelia Cash', 'Jane Hume'] },
      'Greens':                 { party: 'Greens',                 direction: 'for',     forCount: 10, againstCount: 0,  abstainCount: 0, totalSeats: 10, keyMPs: ['Sarah Hanson-Young', 'Mehreen Faruqi'] },
      'One Nation':             { party: 'One Nation',             direction: 'against', forCount: 0,  againstCount: 4,  abstainCount: 0, totalSeats: 4,  keyMPs: ['Pauline Hanson'] },
      'Independent':            { party: 'Independent',            direction: 'split',   forCount: 2,  againstCount: 1,  abstainCount: 0, totalSeats: 3,  keyMPs: ['David Pocock (For)', 'Lidia Thorpe (Against)'] },
      "Australia's Voice":      { party: "Australia's Voice",      direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Fatima Payman'] },
      'Jacqui Lambie Network':  { party: 'Jacqui Lambie Network',  direction: 'for',     forCount: 1,  againstCount: 0,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Jacqui Lambie'] },
      'United Australia Party': { party: 'United Australia Party', direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Ralph Babet'] },
    },
    totalFor: 42, totalAgainst: 34, totalAbstain: 0,
    controversy: 62,
    eli15: "The government wants to co-own up to 40% of your home so you need a smaller deposit and mortgage. This is the Senate vote on the same bill already passed by the House.",
    tags: ['Housing', 'Cost of Living', 'First Home Buyers'],
    publicSupport: 68,
    affectedGroups: ['First Home Buyers', 'Renters', 'Low-Income Earners'],
    campaignCount: 2134,
    campaignDailyGrowth: 120,
    swingMPIds: [],
  },
  {
    id:   'climate-safeguard',
    name: 'Safeguard Mechanism Reforms',
    status: 'passed',
    publicPrediction: 72,
    change:  +0.2,
    volume:  3870,
    sparkline: [62, 63, 65, 66, 67, 68, 69, 70, 70, 71, 71, 72, 72, 72],
    parties: {
      'Labor':                  { party: 'Labor',                  direction: 'for',     forCount: 29, againstCount: 0,  abstainCount: 0, totalSeats: 29, keyMPs: ['Penny Wong', 'Katy Gallagher'] },
      'Coalition':              { party: 'Coalition',              direction: 'against', forCount: 0,  againstCount: 27, abstainCount: 0, totalSeats: 27, keyMPs: ['Michaelia Cash', 'Jane Hume'] },
      'Greens':                 { party: 'Greens',                 direction: 'for',     forCount: 10, againstCount: 0,  abstainCount: 0, totalSeats: 10, keyMPs: ['Sarah Hanson-Young', 'Mehreen Faruqi'] },
      'One Nation':             { party: 'One Nation',             direction: 'against', forCount: 0,  againstCount: 4,  abstainCount: 0, totalSeats: 4,  keyMPs: ['Pauline Hanson'] },
      'Independent':            { party: 'Independent',            direction: 'split',   forCount: 2,  againstCount: 1,  abstainCount: 0, totalSeats: 3,  keyMPs: ['David Pocock (For)', 'Lidia Thorpe (Against)'] },
      "Australia's Voice":      { party: "Australia's Voice",      direction: 'for',     forCount: 1,  againstCount: 0,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Fatima Payman'] },
      'Jacqui Lambie Network':  { party: 'Jacqui Lambie Network',  direction: 'for',     forCount: 1,  againstCount: 0,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Jacqui Lambie'] },
      'United Australia Party': { party: 'United Australia Party', direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Ralph Babet'] },
    },
    totalFor: 43, totalAgainst: 33, totalAbstain: 0,
    controversy: 20,
    eli15: "Big companies that produce lots of pollution now have a cap on how much CO₂ they can emit. Senate passed this alongside the House.",
    tags: ['Climate', 'Environment', 'Industry'],
    publicSupport: 76,
    affectedGroups: ['Mining Industry', 'Manufacturing Sector', 'Regional Workers'],
    campaignCount: 3891,
    campaignDailyGrowth: 87,
    swingMPIds: [],
  },
  {
    id:   'ndis-reform',
    name: 'NDIS Reform Bill',
    status: 'ongoing',
    publicPrediction: 38,
    change:  -1.2,
    volume:  1150,
    sparkline: [44, 43, 42, 41, 41, 40, 39, 39, 39, 38, 38, 38, 38, 38],
    parties: {
      'Labor':                  { party: 'Labor',                  direction: 'for',     forCount: 29, againstCount: 0,  abstainCount: 0, totalSeats: 29, keyMPs: ['Penny Wong'] },
      'Coalition':              { party: 'Coalition',              direction: 'against', forCount: 0,  againstCount: 27, abstainCount: 0, totalSeats: 27, keyMPs: ['Michaelia Cash'] },
      'Greens':                 { party: 'Greens',                 direction: 'abstain', forCount: 0,  againstCount: 0,  abstainCount: 10, totalSeats: 10, keyMPs: ['Sarah Hanson-Young'] },
      'One Nation':             { party: 'One Nation',             direction: 'against', forCount: 0,  againstCount: 4,  abstainCount: 0, totalSeats: 4,  keyMPs: ['Pauline Hanson'] },
      'Independent':            { party: 'Independent',            direction: 'split',   forCount: 1,  againstCount: 1,  abstainCount: 1, totalSeats: 3,  keyMPs: ['David Pocock'] },
      "Australia's Voice":      { party: "Australia's Voice",      direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Fatima Payman'] },
      'Jacqui Lambie Network':  { party: 'Jacqui Lambie Network',  direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Jacqui Lambie'] },
      'United Australia Party': { party: 'United Australia Party', direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Ralph Babet'] },
    },
    totalFor: 30, totalAgainst: 35, totalAbstain: 11,
    controversy: 70,
    eli15: "The NDIS helps Australians with disabilities pay for support. This Senate vote on reform changes which supports are funded.",
    tags: ['Disability', 'Healthcare', 'Social Services'],
    publicSupport: 52,
    affectedGroups: ['NDIS Participants', 'Carers & Families', 'Healthcare Workers'],
    campaignCount: 1247,
    campaignDailyGrowth: 43,
    swingMPIds: [],
  },
  {
    id:   'tax-cuts',
    name: 'Stage 3 Tax Cuts (Modified)',
    status: 'passed',
    publicPrediction: 68,
    change:  +0.5,
    volume:  2890,
    sparkline: [56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 68],
    parties: {
      'Labor':                  { party: 'Labor',                  direction: 'for',     forCount: 29, againstCount: 0,  abstainCount: 0, totalSeats: 29, keyMPs: ['Penny Wong', 'Katy Gallagher'] },
      'Coalition':              { party: 'Coalition',              direction: 'against', forCount: 0,  againstCount: 27, abstainCount: 0, totalSeats: 27, keyMPs: ['Michaelia Cash', 'Jane Hume'] },
      'Greens':                 { party: 'Greens',                 direction: 'for',     forCount: 10, againstCount: 0,  abstainCount: 0, totalSeats: 10, keyMPs: ['Sarah Hanson-Young'] },
      'One Nation':             { party: 'One Nation',             direction: 'split',   forCount: 2,  againstCount: 2,  abstainCount: 0, totalSeats: 4,  keyMPs: ['Pauline Hanson'] },
      'Independent':            { party: 'Independent',            direction: 'for',     forCount: 3,  againstCount: 0,  abstainCount: 0, totalSeats: 3,  keyMPs: ['David Pocock'] },
      "Australia's Voice":      { party: "Australia's Voice",      direction: 'for',     forCount: 1,  againstCount: 0,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Fatima Payman'] },
      'Jacqui Lambie Network':  { party: 'Jacqui Lambie Network',  direction: 'for',     forCount: 1,  againstCount: 0,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Jacqui Lambie'] },
      'United Australia Party': { party: 'United Australia Party', direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Ralph Babet'] },
    },
    totalFor: 46, totalAgainst: 30, totalAbstain: 0,
    controversy: 40,
    eli15: "Everyone pays less income tax, with middle-income earners getting a bigger cut than originally planned. Senate approved this.",
    tags: ['Tax', 'Cost of Living', 'Economy'],
    publicSupport: 74,
    affectedGroups: ['Middle-Income Earners', 'PAYG Workers', 'Small Business Owners'],
    campaignCount: 4203,
    campaignDailyGrowth: 156,
    swingMPIds: [],
  },
  {
    id:   'misinformation-bill',
    name: 'Misinformation & Disinformation Bill',
    status: 'ongoing',
    publicPrediction: 29,
    change:  -2.1,
    volume:  890,
    sparkline: [38, 37, 36, 35, 34, 33, 32, 31, 31, 30, 30, 29, 29, 29],
    parties: {
      'Labor':                  { party: 'Labor',                  direction: 'for',     forCount: 29, againstCount: 0,  abstainCount: 0, totalSeats: 29, keyMPs: ['Penny Wong', 'Don Farrell'] },
      'Coalition':              { party: 'Coalition',              direction: 'against', forCount: 0,  againstCount: 27, abstainCount: 0, totalSeats: 27, keyMPs: ['Michaelia Cash', 'Jane Hume'] },
      'Greens':                 { party: 'Greens',                 direction: 'against', forCount: 0,  againstCount: 10, abstainCount: 0, totalSeats: 10, keyMPs: ['Sarah Hanson-Young'] },
      'One Nation':             { party: 'One Nation',             direction: 'against', forCount: 0,  againstCount: 4,  abstainCount: 0, totalSeats: 4,  keyMPs: ['Pauline Hanson'] },
      'Independent':            { party: 'Independent',            direction: 'split',   forCount: 0,  againstCount: 2,  abstainCount: 1, totalSeats: 3,  keyMPs: ['David Pocock'] },
      "Australia's Voice":      { party: "Australia's Voice",      direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Fatima Payman'] },
      'Jacqui Lambie Network':  { party: 'Jacqui Lambie Network',  direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Jacqui Lambie'] },
      'United Australia Party': { party: 'United Australia Party', direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Ralph Babet'] },
    },
    totalFor: 29, totalAgainst: 46, totalAbstain: 1,
    controversy: 35,
    eli15: "This law would give a government body powers to force social media platforms to remove 'false and harmful' content. Facing strong Senate opposition.",
    tags: ['Digital', 'Free Speech', 'Regulation'],
    publicSupport: 38,
    affectedGroups: ['Social Media Users', 'Journalists', 'Content Creators', 'Researchers'],
    campaignCount: 1876,
    campaignDailyGrowth: 94,
    swingMPIds: [],
  },
]
