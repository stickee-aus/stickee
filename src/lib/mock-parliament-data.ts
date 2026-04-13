// Extended mock data for Parliament page — party voting grid, MP drilldown, civic panel, simulator

import { MPIndex } from './mock-data'
import { PARTY_COLORS } from './mock-data'

export { PARTY_COLORS }

// ─── Types ────────────────────────────────────────────────────────────────────

export type VoteDirection = 'for' | 'against' | 'split' | 'abstain'

export interface PartyBillVote {
  party: string
  direction: VoteDirection
  forCount: number
  againstCount: number
  abstainCount: number
  totalSeats: number
  keyMPs: string[]
}

export type BillUrgency = 'swing-vote' | 'highly-contested' | 'closing-soon' | 'just-moved'

export interface RealWorldImpact {
  headline: string        // "Saves first home buyers ~$40k"
  details: string[]       // supporting bullet points
  affectedCount: string   // "~127,000 Australians per year"
}

export interface BillVoteRow {
  id: string
  name: string
  status: 'passed' | 'failed' | 'ongoing'
  publicPrediction: number   // % Yes from prediction markets
  change: number             // daily price change in pp
  volume: number             // total participants
  sparkline: number[]        // 14-day price history
  parties: Record<string, PartyBillVote>
  totalFor: number
  totalAgainst: number
  totalAbstain: number
  controversy: number        // 0–100: higher = more splits / closer outcome
  // ── New civic action fields ────────────────────────────────────────────────
  eli15: string              // Plain-English explanation for general public
  tags: string[]             // Topic tags e.g. ['Housing', 'Cost of Living']
  publicSupport: number      // 0–100: % of public who support the bill
  affectedGroups: string[]   // Who is most affected
  campaignCount: number      // Total pressure campaign participants
  campaignDailyGrowth: number // New participants in the last 24h
  swingMPIds: string[]       // MP IDs currently undecided / persuadable
  // ── Urgency & impact ──────────────────────────────────────────────────────
  urgency?: BillUrgency      // Urgency signal shown on bill card
  voteCountdown?: string     // e.g. "3 days", "Next week"
  daysUntilVote?: number     // Numeric days until vote — enables live countdown
  campaignWeeklyGrowth?: number // New pressure participants in last 7 days
  realWorldImpact?: RealWorldImpact
}

// ─── Swing vote data ──────────────────────────────────────────────────────────

export type SwingLean = 'undecided' | 'leaning-for' | 'leaning-against'

export interface SwingMP {
  id: string
  name: string
  electorate: string
  party: string
  lean: SwingLean
  reason: string
  pressureReceived: number           // 0–100
  strategicImpact: 'decisive' | 'significant' | 'symbolic'
  recentStanceChange?: string        // "Changed to undecided 3 days ago"
  contactCount: number               // how many users have contacted this MP
  weeklyContactGrowth?: number       // new contacts this week
}

export const SWING_MPS_DATA: Record<string, SwingMP[]> = {
  'housing-affordability': [
    { id: 'mp-ind-9',        name: 'Zali Steggall',    electorate: 'Warringah', party: 'Independent',    lean: 'leaning-for',     reason: 'Constituents overwhelmingly support housing access reform',          pressureReceived: 74, strategicImpact: 'significant', contactCount: 312, weeklyContactGrowth: 48 },
    { id: 'mp-ind-8',        name: 'Allegra Spender',  electorate: 'Wentworth', party: 'Independent',    lean: 'undecided',        reason: 'Raised concerns about equity co-ownership eligibility cap',          pressureReceived: 61, strategicImpact: 'decisive',     recentStanceChange: 'Moved to undecided 4 days ago', contactCount: 247, weeklyContactGrowth: 62 },
    { id: 'mp-ind-6',        name: 'Monique Ryan',     electorate: 'Kooyong',   party: 'Independent',    lean: 'leaning-for',     reason: 'Committed to first-homebuyer support in her electorate',             pressureReceived: 58, strategicImpact: 'significant', contactCount: 189, weeklyContactGrowth: 31 },
    { id: 'mp-ca-1',         name: 'Rebekha Sharkie',  electorate: 'Mayo',      party: 'Centre Alliance', lean: 'leaning-for',    reason: 'SA regional communities facing severe housing shortages',            pressureReceived: 52, strategicImpact: 'symbolic',    contactCount: 134, weeklyContactGrowth: 19 },
    { id: 'mp-coalition-20', name: 'Scott Buchholz',   electorate: 'Wright',    party: 'Coalition',      lean: 'undecided',        reason: 'Queensland seat with rising renter population',                      pressureReceived: 34, strategicImpact: 'symbolic',    recentStanceChange: 'Publicly softened position this week', contactCount: 98, weeklyContactGrowth: 24 },
    { id: 'mp-coalition-31', name: 'Angus Taylor',     electorate: 'Hume',      party: 'Coalition',      lean: 'leaning-against', reason: 'Prefers market-led housing solutions over government co-ownership',   pressureReceived: 28, strategicImpact: 'symbolic',    contactCount: 76, weeklyContactGrowth: 8 },
  ],
  'ndis-reform': [
    { id: 'mp-greens-1',     name: 'Elizabeth Watson-Brown', electorate: 'Ryan',     party: 'Greens',      lean: 'leaning-against', reason: 'Seeking stronger participant safeguards before supporting',   pressureReceived: 81, strategicImpact: 'decisive',     recentStanceChange: 'Hardened opposition stance yesterday', contactCount: 421, weeklyContactGrowth: 73 },
    { id: 'mp-ind-4',        name: 'Helen Haines',           electorate: 'Indi',     party: 'Independent', lean: 'leaning-for',     reason: 'Rural NDIS participants in Indi need better service access',  pressureReceived: 63, strategicImpact: 'significant', contactCount: 198, weeklyContactGrowth: 34 },
    { id: 'mp-ind-3',        name: 'Andrew Gee',             electorate: 'Calare',   party: 'Independent', lean: 'undecided',        reason: 'Wants independent review of participant eligibility changes', pressureReceived: 47, strategicImpact: 'significant', recentStanceChange: 'Moved to undecided 2 days ago', contactCount: 156, weeklyContactGrowth: 41 },
    { id: 'mp-ind-10',       name: 'Andrew Wilkie',          electorate: 'Clark',    party: 'Independent', lean: 'undecided',        reason: 'Concerned about impact on Tasmanian disability community',   pressureReceived: 44, strategicImpact: 'significant', contactCount: 143, weeklyContactGrowth: 22 },
    { id: 'mp-coalition-22', name: 'Michael McCormack',      electorate: 'Riverina', party: 'Coalition',   lean: 'leaning-against', reason: 'Coalition opposes changes to NDIS eligibility scope',         pressureReceived: 29, strategicImpact: 'symbolic',    contactCount: 87, weeklyContactGrowth: 11 },
    { id: 'mp-coalition-8',  name: 'Mark Coulton',           electorate: 'Parkes',   party: 'Coalition',   lean: 'leaning-against', reason: 'Regional NSW Coalition MP opposing reform framework',          pressureReceived: 22, strategicImpact: 'symbolic',    contactCount: 54, weeklyContactGrowth: 7 },
  ],
  'misinformation-bill': [
    { id: 'mp-ind-9',  name: 'Zali Steggall',   electorate: 'Warringah', party: 'Independent',    lean: 'leaning-against', reason: 'Wants stronger free-speech protections and narrower scope',      pressureReceived: 69, strategicImpact: 'decisive',     recentStanceChange: 'Announced opposition 6 days ago', contactCount: 387, weeklyContactGrowth: 58 },
    { id: 'mp-ind-8',  name: 'Allegra Spender', electorate: 'Wentworth', party: 'Independent',    lean: 'leaning-against', reason: 'Concerns about ACMA oversight powers and enforcement scope',    pressureReceived: 63, strategicImpact: 'significant', contactCount: 302, weeklyContactGrowth: 44 },
    { id: 'mp-ind-6',  name: 'Monique Ryan',    electorate: 'Kooyong',   party: 'Independent',    lean: 'undecided',        reason: 'Constituents are divided on digital speech regulation',          pressureReceived: 55, strategicImpact: 'significant', recentStanceChange: 'Moved to undecided 3 days ago', contactCount: 241, weeklyContactGrowth: 52 },
    { id: 'mp-ind-4',  name: 'Helen Haines',    electorate: 'Indi',      party: 'Independent',    lean: 'undecided',        reason: 'Wants clearer definition of "serious harm" before committing', pressureReceived: 49, strategicImpact: 'significant', contactCount: 178, weeklyContactGrowth: 29 },
    { id: 'mp-ca-1',   name: 'Rebekha Sharkie', electorate: 'Mayo',      party: 'Centre Alliance', lean: 'undecided',       reason: 'Awaiting Senate committee review and legal advice',             pressureReceived: 38, strategicImpact: 'symbolic',    contactCount: 123, weeklyContactGrowth: 18 },
    { id: 'mp-ind-10', name: 'Andrew Wilkie',   electorate: 'Clark',     party: 'Independent',    lean: 'leaning-against', reason: 'Concerned whistleblower and journalism protections are too weak', pressureReceived: 34, strategicImpact: 'symbolic',    contactCount: 97, weeklyContactGrowth: 14 },
  ],
}

// ─── Bill vote data ───────────────────────────────────────────────────────────

export const billVoteRows: BillVoteRow[] = [
  {
    id: 'housing-affordability',
    name: 'Help to Buy (Housing)',
    status: 'ongoing',
    publicPrediction: 62,
    change: +2.1,
    volume: 4180,
    sparkline: [51, 53, 54, 56, 55, 57, 58, 59, 58, 60, 61, 60, 62, 62],
    parties: {
      'Labor':       { party: 'Labor',       direction: 'for',     forCount: 94, againstCount: 0,  abstainCount: 0, totalSeats: 94, keyMPs: ['Anthony Albanese', 'Jim Chalmers'] },
      'Coalition':   { party: 'Coalition',   direction: 'against', forCount: 0,  againstCount: 42, abstainCount: 0, totalSeats: 42, keyMPs: ['Angus Taylor', 'Sussan Ley'] },
      'Greens':      { party: 'Greens',      direction: 'for',     forCount: 1,  againstCount: 0,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Elizabeth Watson-Brown'] },
      'Independent': { party: 'Independent', direction: 'for',     forCount: 10, againstCount: 0,  abstainCount: 0, totalSeats: 10, keyMPs: ['Zali Steggall', 'Allegra Spender'] },
      'Centre Alliance':           { party: 'Centre Alliance',           direction: 'for',     forCount: 1, againstCount: 0, abstainCount: 0, totalSeats: 1, keyMPs: ['Rebekha Sharkie'] },
      "Katter's Australian Party": { party: "Katter's Australian Party", direction: 'against', forCount: 0, againstCount: 1, abstainCount: 0, totalSeats: 1, keyMPs: ['Bob Katter'] },
      'One Nation':  { party: 'One Nation',  direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Barnaby Joyce'] },
    },
    totalFor: 106, totalAgainst: 44, totalAbstain: 0,
    controversy: 45,
    eli15: "The government wants to co-own up to 40% of your home so you need a smaller deposit and mortgage. You share the property's future value with them. It's designed to help people who can't save a full deposit.",
    tags: ['Housing', 'Cost of Living', 'First Home Buyers'],
    publicSupport: 68,
    affectedGroups: ['First Home Buyers', 'Renters', 'Low-Income Earners', 'Regional Communities'],
    campaignCount: 2134,
    campaignDailyGrowth: 120,
    swingMPIds: ['mp-ind-9', 'mp-ind-8', 'mp-ind-6', 'mp-ca-1', 'mp-coalition-20', 'mp-coalition-31'],
    urgency: 'closing-soon',
    voteCountdown: '3 days',
    daysUntilVote: 3,
    campaignWeeklyGrowth: 840,
    realWorldImpact: {
      headline: 'Saves first home buyers ~$40k on deposit requirements',
      details: [
        'Reduces required deposit from 20% to 2% on government co-owned portion',
        'Government takes up to 40% equity stake — repaid when you sell',
        'Available to 40,000 Australians per year at income caps of $90k (single) / $120k (couple)',
      ],
      affectedCount: '~40,000 Australians per year',
    },
  },
  {
    id: 'climate-safeguard',
    name: 'Safeguard Mechanism Reforms',
    status: 'passed',
    publicPrediction: 78,
    change: +0.4,
    volume: 6340,
    sparkline: [65, 66, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 78],
    parties: {
      'Labor':       { party: 'Labor',       direction: 'for',     forCount: 94, againstCount: 0,  abstainCount: 0, totalSeats: 94, keyMPs: ['Chris Bowen', 'Tanya Plibersek'] },
      'Coalition':   { party: 'Coalition',   direction: 'against', forCount: 0,  againstCount: 42, abstainCount: 0, totalSeats: 42, keyMPs: ['Angus Taylor', 'Dan Tehan'] },
      'Greens':      { party: 'Greens',      direction: 'for',     forCount: 1,  againstCount: 0,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Elizabeth Watson-Brown'] },
      'Independent': { party: 'Independent', direction: 'for',     forCount: 10, againstCount: 0,  abstainCount: 0, totalSeats: 10, keyMPs: ['Zali Steggall'] },
      'Centre Alliance':           { party: 'Centre Alliance',           direction: 'for',     forCount: 1, againstCount: 0, abstainCount: 0, totalSeats: 1, keyMPs: ['Rebekha Sharkie'] },
      "Katter's Australian Party": { party: "Katter's Australian Party", direction: 'against', forCount: 0, againstCount: 1, abstainCount: 0, totalSeats: 1, keyMPs: ['Bob Katter'] },
      'One Nation':  { party: 'One Nation',  direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Barnaby Joyce'] },
    },
    totalFor: 106, totalAgainst: 44, totalAbstain: 0,
    controversy: 15,
    eli15: "Big companies that produce lots of pollution now have a cap on how much CO₂ they can emit. If they go over the limit, they must buy carbon credits or pay a fine. This pushes them toward cleaner energy without shutting them down.",
    tags: ['Climate', 'Environment', 'Industry'],
    publicSupport: 76,
    affectedGroups: ['Mining Industry', 'Manufacturing Sector', 'Regional Workers', 'Environment Groups'],
    campaignCount: 3891,
    campaignDailyGrowth: 87,
    campaignWeeklyGrowth: 609,
    swingMPIds: [],
    realWorldImpact: {
      headline: 'Cuts industrial emissions by ~205 million tonnes by 2030',
      details: [
        'Covers ~215 of Australia\'s highest-polluting industrial facilities',
        'Sets declining emission caps with tradeable carbon credits to manage costs',
        'Estimated $600m cost to industry — passed partly to consumers via energy prices',
      ],
      affectedCount: '~215 facilities, 28 million Australians downstream',
    },
  },
  {
    id: 'ndis-reform',
    name: 'NDIS Reform Bill',
    status: 'ongoing',
    publicPrediction: 44,
    change: -1.8,
    volume: 3210,
    sparkline: [51, 50, 49, 50, 48, 47, 48, 46, 47, 46, 45, 44, 44, 44],
    parties: {
      'Labor':       { party: 'Labor',       direction: 'for',     forCount: 94, againstCount: 0, abstainCount: 0, totalSeats: 94, keyMPs: ['Mark Dreyfus', 'Amanda Rishworth'] },
      'Coalition':   { party: 'Coalition',   direction: 'against', forCount: 0,  againstCount: 42, abstainCount: 0, totalSeats: 42, keyMPs: ['Angus Taylor', 'Julian Leeser'] },
      'Greens':      { party: 'Greens',      direction: 'abstain', forCount: 0,  againstCount: 0,  abstainCount: 1, totalSeats: 1,  keyMPs: ['Elizabeth Watson-Brown'] },
      'Independent': { party: 'Independent', direction: 'for',     forCount: 10, againstCount: 0,  abstainCount: 0, totalSeats: 10, keyMPs: ['Zali Steggall', 'Helen Haines'] },
      'Centre Alliance':           { party: 'Centre Alliance',           direction: 'for',     forCount: 1, againstCount: 0, abstainCount: 0, totalSeats: 1, keyMPs: ['Rebekha Sharkie'] },
      "Katter's Australian Party": { party: "Katter's Australian Party", direction: 'against', forCount: 0, againstCount: 1, abstainCount: 0, totalSeats: 1, keyMPs: ['Bob Katter'] },
      'One Nation':  { party: 'One Nation',  direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Barnaby Joyce'] },
    },
    totalFor: 105, totalAgainst: 44, totalAbstain: 1,
    controversy: 55,
    eli15: "The NDIS helps Australians with disabilities pay for support like carers, equipment, and therapy. This bill changes which supports are funded — focusing on specific disability-related needs rather than general wellbeing. Some say it saves money; others worry people will lose vital support.",
    tags: ['Disability', 'Healthcare', 'Social Services'],
    publicSupport: 52,
    affectedGroups: ['NDIS Participants', 'Carers & Families', 'Disability Service Workers', 'Healthcare Providers'],
    campaignCount: 1247,
    campaignDailyGrowth: 43,
    swingMPIds: ['mp-greens-1', 'mp-ind-4', 'mp-ind-3', 'mp-ind-10', 'mp-coalition-22', 'mp-coalition-8'],
    urgency: 'swing-vote',
    voteCountdown: 'Next week',
    daysUntilVote: 7,
    campaignWeeklyGrowth: 301,
    realWorldImpact: {
      headline: 'Could cut support for ~50,000 current NDIS participants',
      details: [
        'Narrows eligibility to "disability-related" supports — excludes general wellbeing costs',
        'New Independent Assessment process replaces self-nominated plans for many',
        'Projected $14.4bn savings over 4 years — critics say this comes from reduced participant access',
      ],
      affectedCount: '~610,000 NDIS participants + 300,000 carers',
    },
  },
  {
    id: 'tax-cuts',
    name: 'Stage 3 Tax Cuts (Modified)',
    status: 'passed',
    publicPrediction: 71,
    change: +1.3,
    volume: 5090,
    sparkline: [60, 61, 63, 64, 65, 66, 66, 67, 68, 69, 70, 70, 71, 71],
    parties: {
      'Labor':       { party: 'Labor',       direction: 'for',     forCount: 94, againstCount: 0,  abstainCount: 0, totalSeats: 94, keyMPs: ['Jim Chalmers', 'Anthony Albanese'] },
      'Coalition':   { party: 'Coalition',   direction: 'against', forCount: 0,  againstCount: 42, abstainCount: 0, totalSeats: 42, keyMPs: ['Angus Taylor (Against)', 'Julian Leeser (Against)'] },
      'Greens':      { party: 'Greens',      direction: 'for',     forCount: 1,  againstCount: 0,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Elizabeth Watson-Brown'] },
      'Independent': { party: 'Independent', direction: 'for',     forCount: 10, againstCount: 0,  abstainCount: 0, totalSeats: 10, keyMPs: ['Zali Steggall', 'Allegra Spender'] },
      'Centre Alliance':           { party: 'Centre Alliance',           direction: 'for',     forCount: 1, againstCount: 0, abstainCount: 0, totalSeats: 1, keyMPs: ['Rebekha Sharkie'] },
      "Katter's Australian Party": { party: "Katter's Australian Party", direction: 'against', forCount: 0, againstCount: 1, abstainCount: 0, totalSeats: 1, keyMPs: ['Bob Katter'] },
      'One Nation':  { party: 'One Nation',  direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Barnaby Joyce'] },
    },
    totalFor: 106, totalAgainst: 44, totalAbstain: 0,
    controversy: 50,
    eli15: "Everyone pays less income tax. The original plan gave bigger cuts to high earners, but this modified version gives more back to people earning $45k–$120k. If you're on a middle income, you'll notice the difference in your pay.",
    tags: ['Tax', 'Cost of Living', 'Economy'],
    publicSupport: 74,
    affectedGroups: ['Middle-Income Earners', 'PAYG Workers', 'Small Business Owners', 'Low-Income Families'],
    campaignCount: 4203,
    campaignDailyGrowth: 156,
    campaignWeeklyGrowth: 1092,
    swingMPIds: [],
    realWorldImpact: {
      headline: 'Puts ~$1,500 more per year in the pocket of middle-income earners',
      details: [
        'Earners between $45k–$120k receive the largest benefit vs original Stage 3 design',
        'Someone earning $80k saves ~$1,679/year; someone earning $200k saves ~$9,075/year',
        'Total cost: $243bn over 10 years — funded through bracket creep offset',
      ],
      affectedCount: '~13.6 million Australian taxpayers',
    },
  },
  {
    id: 'misinformation-bill',
    name: 'Misinformation & Disinformation Bill',
    status: 'ongoing',
    publicPrediction: 37,
    change: -3.2,
    volume: 2870,
    sparkline: [48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 38, 37, 37],
    parties: {
      'Labor':       { party: 'Labor',       direction: 'for',     forCount: 94, againstCount: 0,  abstainCount: 0, totalSeats: 94, keyMPs: ['Mark Dreyfus (For)', 'Michelle Rowland (For)'] },
      'Coalition':   { party: 'Coalition',   direction: 'against', forCount: 0,  againstCount: 42, abstainCount: 0, totalSeats: 42, keyMPs: ['Angus Taylor', 'Dan Tehan'] },
      'Greens':      { party: 'Greens',      direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Elizabeth Watson-Brown'] },
      'Independent': { party: 'Independent', direction: 'against', forCount: 0,  againstCount: 10, abstainCount: 0, totalSeats: 10, keyMPs: ['Zali Steggall', 'Allegra Spender'] },
      'Centre Alliance':           { party: 'Centre Alliance',           direction: 'abstain', forCount: 0, againstCount: 0, abstainCount: 1, totalSeats: 1, keyMPs: ['Rebekha Sharkie'] },
      "Katter's Australian Party": { party: "Katter's Australian Party", direction: 'against', forCount: 0, againstCount: 1, abstainCount: 0, totalSeats: 1, keyMPs: ['Bob Katter'] },
      'One Nation':  { party: 'One Nation',  direction: 'against', forCount: 0,  againstCount: 1,  abstainCount: 0, totalSeats: 1,  keyMPs: ['Barnaby Joyce'] },
    },
    totalFor: 94, totalAgainst: 55, totalAbstain: 1,
    controversy: 80,
    eli15: "This law would let a government body (ACMA) force social media platforms to remove content labelled 'false and seriously harmful'. Supporters say it protects democracy; critics say it could silence legitimate speech and be used to censor journalists or researchers.",
    tags: ['Digital', 'Free Speech', 'Regulation'],
    publicSupport: 38,
    affectedGroups: ['Social Media Users', 'Journalists', 'Content Creators', 'Researchers & Academics'],
    campaignCount: 1876,
    campaignDailyGrowth: 94,
    swingMPIds: ['mp-ind-9', 'mp-ind-8', 'mp-ind-6', 'mp-ind-4', 'mp-ca-1', 'mp-ind-10'],
    urgency: 'highly-contested',
    voteCountdown: '5 days',
    daysUntilVote: 5,
    campaignWeeklyGrowth: 658,
    realWorldImpact: {
      headline: 'Social media platforms could be fined up to $6.8m for spreading misinformation',
      details: [
        'ACMA gains new powers to force platforms to remove content deemed "seriously harmful"',
        'News content, satire and academic research are excluded from the law\'s scope',
        'Critics warn "serious harm" is poorly defined — could chill legitimate political speech',
      ],
      affectedCount: '~21 million Australian internet users',
    },
  },
]

// ─── MP state mapping ─────────────────────────────────────────────────────────

export const MP_STATES: Record<string, string> = {
  // Labor
  'mp-labor-1': 'VIC',  'mp-labor-2': 'NSW',  'mp-labor-3': 'WA',
  'mp-labor-4': 'NSW',  'mp-labor-5': 'VIC',  'mp-labor-6': 'NSW',
  'mp-labor-7': 'NSW',  'mp-labor-8': 'VIC',  'mp-labor-9': 'NSW',
  'mp-labor-10': 'SA',  'mp-labor-11': 'VIC', 'mp-labor-12': 'SA',
  'mp-labor-13': 'NSW', 'mp-labor-14': 'QLD', 'mp-labor-15': 'QLD',
  'mp-labor-16': 'NSW', 'mp-labor-17': 'VIC', 'mp-labor-18': 'NSW',
  'mp-labor-19': 'NSW', 'mp-labor-20': 'SA',  'mp-labor-21': 'QLD',
  'mp-labor-22': 'VIC', 'mp-labor-23': 'TAS', 'mp-labor-24': 'QLD',
  'mp-labor-25': 'NSW', 'mp-labor-26': 'QLD', 'mp-labor-27': 'WA',
  'mp-labor-28': 'QLD', 'mp-labor-29': 'VIC', 'mp-labor-30': 'VIC',
  'mp-labor-31': 'NSW', 'mp-labor-32': 'VIC', 'mp-labor-33': 'QLD',
  'mp-labor-34': 'NSW', 'mp-labor-35': 'WA',  'mp-labor-36': 'VIC',
  'mp-labor-37': 'SA',  'mp-labor-38': 'VIC', 'mp-labor-39': 'WA',
  'mp-labor-40': 'NT',  'mp-labor-41': 'VIC', 'mp-labor-42': 'VIC',
  'mp-labor-43': 'QLD', 'mp-labor-44': 'NSW', 'mp-labor-45': 'QLD',
  'mp-labor-46': 'VIC', 'mp-labor-47': 'VIC', 'mp-labor-48': 'WA',
  'mp-labor-49': 'VIC', 'mp-labor-50': 'VIC', 'mp-labor-51': 'WA',
  'mp-labor-52': 'WA',  'mp-labor-53': 'NSW', 'mp-labor-54': 'ACT',
  'mp-labor-55': 'WA',  'mp-labor-56': 'VIC', 'mp-labor-57': 'WA',
  'mp-labor-58': 'NSW', 'mp-labor-59': 'NSW', 'mp-labor-60': 'SA',
  'mp-labor-61': 'VIC', 'mp-labor-62': 'NSW', 'mp-labor-63': 'VIC',
  'mp-labor-64': 'QLD', 'mp-labor-65': 'VIC', 'mp-labor-66': 'VIC',
  'mp-labor-67': 'ACT', 'mp-labor-68': 'NSW', 'mp-labor-69': 'NSW',
  'mp-labor-70': 'VIC', 'mp-labor-71': 'NSW', 'mp-labor-72': 'NSW',
  'mp-labor-73': 'SA',  'mp-labor-74': 'WA',  'mp-labor-75': 'NSW',
  'mp-labor-76': 'VIC', 'mp-labor-77': 'NT',  'mp-labor-78': 'NSW',
  'mp-labor-79': 'ACT', 'mp-labor-80': 'QLD', 'mp-labor-81': 'NSW',
  'mp-labor-82': 'NSW', 'mp-labor-83': 'NSW', 'mp-labor-84': 'TAS',
  'mp-labor-85': 'NSW', 'mp-labor-86': 'NSW', 'mp-labor-87': 'VIC',
  'mp-labor-88': 'TAS', 'mp-labor-89': 'VIC', 'mp-labor-90': 'QLD',
  'mp-labor-91': 'TAS', 'mp-labor-92': 'WA',  'mp-labor-93': 'VIC',
  'mp-labor-94': 'SA',
  // Greens
  'mp-greens-1': 'QLD',
  // Independents
  'mp-ind-1': 'NSW', 'mp-ind-2': 'WA',  'mp-ind-3': 'NSW',
  'mp-ind-4': 'VIC', 'mp-ind-5': 'NSW', 'mp-ind-6': 'VIC',
  'mp-ind-7': 'NSW', 'mp-ind-8': 'NSW', 'mp-ind-9': 'NSW',
  'mp-ind-10': 'TAS',
  // Centre Alliance, KAP & One Nation
  'mp-ca-1': 'SA', 'mp-kap-1': 'QLD', 'mp-onenat-1': 'NSW',
  // Coalition (42: Nationals 14 + Liberals 28; Joyce moved to One Nation)
  'mp-coalition-1': 'VIC',  'mp-coalition-2': 'QLD',  'mp-coalition-3': 'QLD',
  'mp-coalition-4': 'VIC',  'mp-coalition-5': 'QLD',  'mp-coalition-6': 'QLD',
  'mp-coalition-7': 'QLD',  'mp-coalition-8': 'NSW',  'mp-coalition-9': 'VIC',
  'mp-coalition-10': 'NSW', 'mp-coalition-11': 'QLD', 'mp-coalition-12': 'WA',
  'mp-coalition-13': 'NSW', 'mp-coalition-14': 'NSW', 'mp-coalition-15': 'NSW',
  'mp-coalition-16': 'QLD', 'mp-coalition-17': 'NSW', 'mp-coalition-18': 'NSW',
  'mp-coalition-19': 'QLD', 'mp-coalition-20': 'NSW', 'mp-coalition-21': 'VIC',
  'mp-coalition-22': 'NSW', 'mp-coalition-23': 'QLD', 'mp-coalition-24': 'QLD',
  'mp-coalition-25': 'SA',  'mp-coalition-26': 'NSW', 'mp-coalition-27': 'QLD',
  'mp-coalition-28': 'WA',  'mp-coalition-29': 'QLD', 'mp-coalition-30': 'WA',
  'mp-coalition-31': 'NSW', 'mp-coalition-32': 'VIC', 'mp-coalition-33': 'QLD',
  'mp-coalition-34': 'SA',  'mp-coalition-35': 'VIC', 'mp-coalition-36': 'QLD',
  'mp-coalition-37': 'VIC', 'mp-coalition-38': 'QLD', 'mp-coalition-39': 'WA',
  'mp-coalition-40': 'VIC', 'mp-coalition-41': 'VIC', 'mp-coalition-42': 'QLD',
}

// ─── Per-MP vote directions per bill ─────────────────────────────────────────
// All MPs follow party line by default; only overrides are listed here.

const MP_VOTE_DIRECTIONS: Record<string, Record<string, 'for' | 'against' | 'absent'>> = {
  'housing-affordability':  {},
  'climate-safeguard':      {},
  'ndis-reform':            { 'mp-greens-1': 'absent' },
  'tax-cuts':               {},
  'misinformation-bill':    {},
}

// ─── Shared utility functions ─────────────────────────────────────────────────

/** % of parliament voting For on a bill */
export function parliamentSupportPct(bill: BillVoteRow): number {
  const total = bill.totalFor + bill.totalAgainst + bill.totalAbstain
  return total > 0 ? Math.round((bill.totalFor / total) * 100) : 0
}

/** Positive = public leads parliament (misaligned/pressure case), negative = parliament ahead */
export function computeGap(bill: BillVoteRow): number {
  return bill.publicSupport - parliamentSupportPct(bill)
}

export const PRIORITY_URGENCY_SCORE: Record<BillUrgency, number> = {
  'closing-soon':    40,
  'swing-vote':      30,
  'highly-contested': 20,
  'just-moved':       10,
}

/** Selects the most urgent unacted ongoing bill for the priority hero section */
export function selectTodaysAction(
  bills: BillVoteRow[],
  campaigns: Record<string, 'support' | 'oppose'>
): BillVoteRow | null {
  const ongoing = bills.filter(b => b.status === 'ongoing')
  if (ongoing.length === 0) return null
  const scored = ongoing.map(bill => {
    let score = 0
    if (bill.urgency) score += PRIORITY_URGENCY_SCORE[bill.urgency]
    if (bill.daysUntilVote !== undefined && bill.daysUntilVote <= 3) score += 20
    if (!campaigns[bill.id]) score += 15
    return { bill, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.bill ?? null
}

export function getMPVoteForBill(mpId: string, billId: string): 'for' | 'against' | 'absent' {
  const override = MP_VOTE_DIRECTIONS[billId]?.[mpId]
  if (override !== undefined) return override

  // Fall back to party-line vote
  const mp = MPIndex[mpId]
  if (!mp) return 'absent'
  const bill = billVoteRows.find(b => b.id === billId)
  if (!bill) return 'absent'
  const partyVote = bill.parties[mp.party]
  if (!partyVote) return 'absent'
  if (partyVote.direction === 'for')     return 'for'
  if (partyVote.direction === 'against') return 'against'
  if (partyVote.direction === 'abstain') return 'absent'
  // split: use majority direction
  return partyVote.forCount >= partyVote.againstCount ? 'for' : 'against'
}

export function getPartyAlignment(mpId: string, billId: string): number {
  const mp = MPIndex[mpId]
  if (!mp) return 100
  const mpVote = getMPVoteForBill(mpId, billId)
  const bill = billVoteRows.find(b => b.id === billId)
  if (!bill) return 100
  const partyVote = bill.parties[mp.party]
  if (!partyVote) return 100

  if (partyVote.direction === 'for')     return mpVote === 'for'     ? 100 : 0
  if (partyVote.direction === 'against') return mpVote === 'against' ? 100 : 0
  if (partyVote.direction === 'abstain') return mpVote === 'absent'  ? 100 : 0
  // split: align with whichever way the majority of the party voted
  const partyMajDir = partyVote.forCount >= partyVote.againstCount ? 'for' : 'against'
  return mpVote === partyMajDir ? 100 : 0
}

export function getPublicAlignment(mpId: string, billId: string): number {
  const mpVote = getMPVoteForBill(mpId, billId)
  if (mpVote === 'absent') return 50
  const bill = billVoteRows.find(b => b.id === billId)
  if (!bill) return 50
  const publicLeanFor = bill.publicPrediction >= 50
  return (mpVote === 'for') === publicLeanFor ? 100 : 0
}

// ─── Civic Panel — electorate → MP ───────────────────────────────────────────

export const ELECTORATE_MP_MAP: Record<string, string> = {
  // Labor
  'Calwell': 'mp-labor-1', 'Grayndler': 'mp-labor-2', 'Cowan': 'mp-labor-3',
  'Barton': 'mp-labor-4', 'Dunkley': 'mp-labor-5', 'Whitlam': 'mp-labor-6',
  'McMahon': 'mp-labor-7', 'Maribyrnong': 'mp-labor-8', 'Watson': 'mp-labor-9',
  'Spence': 'mp-labor-10', 'Macnamara': 'mp-labor-11', 'Hindmarsh': 'mp-labor-12',
  'Cunningham': 'mp-labor-13', 'Moreton': 'mp-labor-14', 'Rankin': 'mp-labor-15',
  'Parramatta': 'mp-labor-16', 'Bendigo': 'mp-labor-17', 'Blaxland': 'mp-labor-18',
  'Newcastle': 'mp-labor-19', 'Sturt': 'mp-labor-20', 'Griffith': 'mp-labor-21',
  'Corangamite': 'mp-labor-22', 'Franklin': 'mp-labor-23', 'Petrie': 'mp-labor-24',
  'Shortland': 'mp-labor-25', 'Bonner': 'mp-labor-26', 'Bullwinkel': 'mp-labor-27',
  'Oxley': 'mp-labor-28', 'Aston': 'mp-labor-29', 'Isaacs': 'mp-labor-30',
  'Richmond': 'mp-labor-31', 'Holt': 'mp-labor-32', 'Dickson': 'mp-labor-33',
  'Macarthur': 'mp-labor-34', 'Moore': 'mp-labor-35', 'Chisholm': 'mp-labor-36',
  'Adelaide': 'mp-labor-37', 'Scullin': 'mp-labor-38', 'Perth': 'mp-labor-39',
  'Solomon': 'mp-labor-40', 'Deakin': 'mp-labor-41', 'Bruce': 'mp-labor-42',
  'Forde': 'mp-labor-43', 'Chifley': 'mp-labor-44', 'Brisbane': 'mp-labor-45',
  'Gorton': 'mp-labor-46', 'Cooper': 'mp-labor-47', 'Burt': 'mp-labor-48',
  'Wills': 'mp-labor-49', 'Ballarat': 'mp-labor-50', 'Brand': 'mp-labor-51',
  'Hasluck': 'mp-labor-52', 'Bennelong': 'mp-labor-53', 'Fenner': 'mp-labor-54',
  'Tangney': 'mp-labor-55', 'Corio': 'mp-labor-56', 'Swan': 'mp-labor-57',
  'Eden-Monaro': 'mp-labor-58', 'Dobell': 'mp-labor-59', 'Boothby': 'mp-labor-60',
  'McEwen': 'mp-labor-61', 'Hughes': 'mp-labor-62', 'Fraser': 'mp-labor-63',
  'Blair': 'mp-labor-64', 'Menzies': 'mp-labor-65', 'Hotham': 'mp-labor-66',
  'Canberra': 'mp-labor-67', 'Gilmore': 'mp-labor-68', 'Sydney': 'mp-labor-69',
  'Hawke': 'mp-labor-70', 'Robertson': 'mp-labor-71', 'Hunter': 'mp-labor-72',
  'Kingston': 'mp-labor-73', 'Pearce': 'mp-labor-74', 'Greenway': 'mp-labor-75',
  'Lalor': 'mp-labor-76', 'Lingiari': 'mp-labor-77', 'Reid': 'mp-labor-78',
  'Bean': 'mp-labor-79', 'Leichhardt': 'mp-labor-80', 'Banks': 'mp-labor-81',
  'Werriwa': 'mp-labor-82', 'Paterson': 'mp-labor-83', 'Bass': 'mp-labor-84',
  'Macquarie': 'mp-labor-85', 'Kingsford Smith': 'mp-labor-86', 'Jagajaga': 'mp-labor-87',
  'Braddon': 'mp-labor-88', 'Gellibrand': 'mp-labor-89', 'Lilley': 'mp-labor-90',
  'Lyons': 'mp-labor-91', 'Fremantle': 'mp-labor-92', 'Melbourne': 'mp-labor-93',
  'Makin': 'mp-labor-94',
  // Greens
  'Ryan': 'mp-greens-1',
  // Independents
  'Bradfield': 'mp-ind-1', 'Curtin': 'mp-ind-2', 'Calare': 'mp-ind-3',
  'Indi': 'mp-ind-4', 'Fowler': 'mp-ind-5', 'Kooyong': 'mp-ind-6',
  'Mackellar': 'mp-ind-7', 'Wentworth': 'mp-ind-8', 'Warringah': 'mp-ind-9',
  'Clark': 'mp-ind-10',
  // Centre Alliance & KAP
  'Mayo': 'mp-ca-1', 'Kennedy': 'mp-kap-1',
  // Coalition
  'Monash': 'mp-coalition-1', 'Hinkler': 'mp-coalition-2', 'Moncrieff': 'mp-coalition-3',
  'Nicholls': 'mp-coalition-4', 'Flynn': 'mp-coalition-5', 'Wright': 'mp-coalition-6',
  'Fadden': 'mp-coalition-7', 'Parkes': 'mp-coalition-8', 'Gippsland': 'mp-coalition-9',
  'Cowper': 'mp-coalition-10', 'Groom': 'mp-coalition-11', 'Canning': 'mp-coalition-12',
  'New England': 'mp-onenat-1',
  'Mitchell': 'mp-coalition-13', 'Page': 'mp-coalition-14', 'Cook': 'mp-coalition-15',
  'Capricornia': 'mp-coalition-16', 'Berowra': 'mp-coalition-17', 'Farrer': 'mp-coalition-18',
  'Maranoa': 'mp-coalition-19', 'Lindsay': 'mp-coalition-20', 'Flinders': 'mp-coalition-21',
  'Riverina': 'mp-coalition-22', 'Wide Bay': 'mp-coalition-23', 'Fairfax': 'mp-coalition-24',
  'Barker': 'mp-coalition-25', 'Lyne': 'mp-coalition-26', 'Bowman': 'mp-coalition-27',
  'Durack': 'mp-coalition-28', 'McPherson': 'mp-coalition-29', 'Forrest': 'mp-coalition-30',
  'Hume': 'mp-coalition-31', 'Wannon': 'mp-coalition-32', 'Herbert': 'mp-coalition-33',
  'Grey': 'mp-coalition-34', 'Casey': 'mp-coalition-35', 'Fisher': 'mp-coalition-36',
  'Mallee': 'mp-coalition-37', 'Dawson': 'mp-coalition-38', "O'Connor": 'mp-coalition-39',
  'Goldstein': 'mp-coalition-40', 'La Trobe': 'mp-coalition-41', 'Longman': 'mp-coalition-42',
}

// ─── Impact Simulator ─────────────────────────────────────────────────────────

// Which parties support each bill (vote For by party line)
export const BILL_SUPPORT_PARTIES: Record<string, string[]> = {
  'housing-affordability': ['Labor', 'Greens', 'Independent', 'Centre Alliance'],
  'climate-safeguard':     ['Labor', 'Greens', 'Independent', 'Centre Alliance'],
  'ndis-reform':           ['Labor', 'Independent', 'Centre Alliance'],
  'tax-cuts':              ['Labor', 'Greens', 'Independent', 'Centre Alliance'],
  'misinformation-bill':   ['Labor'],
}

export const MAJORITY_THRESHOLD = 76

export interface SimOutcome {
  for: number
  against: number
  passes: boolean
  probability: number
}

export function simulateBillOutcomes(
  seatCounts: Record<string, number>
): Record<string, SimOutcome> {
  const results: Record<string, SimOutcome> = {}

  for (const bill of billVoteRows) {
    const supportParties = BILL_SUPPORT_PARTIES[bill.id] ?? []
    let forSeats = 0
    let againstSeats = 0

    for (const [party, seats] of Object.entries(seatCounts)) {
      if (supportParties.includes(party)) {
        forSeats += seats
      } else {
        againstSeats += seats
      }
    }

    const total = forSeats + againstSeats
    results[bill.id] = {
      for: forSeats,
      against: againstSeats,
      passes: forSeats >= MAJORITY_THRESHOLD,
      probability: total > 0 ? Math.round((forSeats / total) * 100) : 50,
    }
  }

  return results
}

export const BASE_SEAT_COUNTS: Record<string, number> = {
  'Labor': 94,
  'Coalition': 42,
  'Greens': 1,
  'Independent': 10,
  'Centre Alliance': 1,
  "Katter's Australian Party": 1,
  'One Nation': 1,
}
