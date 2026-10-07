import type { PillarId } from '@/types/civic'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedPostType = 'user_post' | 'civic_alert' | 'leader_update' | 'decision_update'

export type FeedReaction = 'heart' | 'fire' | 'flag'

export interface FeedPost {
  id: string
  type: FeedPostType
  authorId: string
  authorName: string
  authorHandle: string
  authorVerified: boolean
  civicScore?: number
  content: string
  linkedPillarId?: PillarId
  linkedDecisionId?: string
  linkedLeaderId?: string
  postedAt: string // ISO timestamp
  reactions: Record<FeedReaction, number>
  commentCount: number
  shareCount: number
  isAlgorithmicBoost: boolean
}

// ─── Feed posts ───────────────────────────────────────────────────────────────

export const FEED_POSTS: FeedPost[] = [

  // ── Civic alerts (system) ────────────────────────────────────────────────

  {
    id: 'alert-housing-drop',
    type: 'civic_alert',
    authorId: 'system',
    authorName: 'Stickee',
    authorHandle: '@stickee',
    authorVerified: true,
    content: '🏠 Housing score dropped to 32/100 — the lowest in 18 months. Vacancy rates have fallen to a national record low of 0.8%, pushing rents up 11% year-on-year in capital cities. This is now the worst-performing civic pillar.',
    linkedPillarId: 'housing',
    postedAt: '2026-04-03T08:00:00.000Z',
    reactions: { heart: 312, fire: 891, flag: 14 },
    commentCount: 87,
    shareCount: 234,
    isAlgorithmicBoost: true,
  },

  {
    id: 'alert-cost-living',
    type: 'civic_alert',
    authorId: 'system',
    authorName: 'Stickee',
    authorHandle: '@stickee',
    authorVerified: true,
    content: '📊 Cost of Living alert: CPI held at 4.2% this quarter — still above the RBA target band. Grocery prices rose 7.3% and energy bills are up 18% since last year. Real wages remain negative for a third consecutive quarter.',
    linkedPillarId: 'cost-of-living',
    postedAt: '2026-04-02T09:15:00.000Z',
    reactions: { heart: 204, fire: 672, flag: 8 },
    commentCount: 63,
    shareCount: 189,
    isAlgorithmicBoost: true,
  },

  // ── Leader updates ────────────────────────────────────────────────────────

  {
    id: 'leader-sara-housing',
    type: 'leader_update',
    authorId: 'sara-patel',
    authorName: 'Sara Patel',
    authorHandle: '@sarapatel_housing',
    authorVerified: true,
    civicScore: 82,
    content: 'I\'ve spent the last 3 months working with community housing providers in Western Sydney. The data is clear: we need 90,000 new social housing units by 2028. I\'ll be presenting a detailed funding model to the State Select Committee next week. Thread below 👇',
    linkedLeaderId: 'sara-patel',
    linkedPillarId: 'housing',
    postedAt: '2026-04-03T07:30:00.000Z',
    reactions: { heart: 892, fire: 341, flag: 3 },
    commentCount: 124,
    shareCount: 567,
    isAlgorithmicBoost: true,
  },

  {
    id: 'leader-marcus-climate',
    type: 'leader_update',
    authorId: 'marcus-webb',
    authorName: 'Marcus Webb',
    authorHandle: '@marcuswebb_env',
    authorVerified: true,
    civicScore: 76,
    content: 'Attended the National Climate Summit in Canberra. Key takeaway: state governments are moving faster than federal on renewables transition. Victoria\'s 95% renewables target is achievable. We need to hold the Federal government accountable to matching this ambition.',
    linkedLeaderId: 'marcus-webb',
    linkedPillarId: 'future',
    postedAt: '2026-04-01T14:20:00.000Z',
    reactions: { heart: 445, fire: 189, flag: 7 },
    commentCount: 56,
    shareCount: 203,
    isAlgorithmicBoost: true,
  },

  {
    id: 'leader-priya-econ',
    type: 'leader_update',
    authorId: 'priya-sharma',
    authorName: 'Dr Priya Sharma',
    authorHandle: '@drpriyasharma',
    authorVerified: true,
    civicScore: 71,
    content: 'New economic modelling out today: lifting JobSeeker to $90/day would inject $3.2B into regional economies — most of which stays local. The "cost" argument against welfare is economically illiterate. Link to full paper in bio.',
    linkedPillarId: 'jobs-economy',
    postedAt: '2026-03-31T11:00:00.000Z',
    reactions: { heart: 678, fire: 234, flag: 19 },
    commentCount: 98,
    shareCount: 445,
    isAlgorithmicBoost: true,
  },

  // ── User posts ────────────────────────────────────────────────────────────

  {
    id: 'user-rent-story',
    type: 'user_post',
    authorId: 'user-mel-k',
    authorName: 'Mel K',
    authorHandle: '@mel_k_melb',
    authorVerified: false,
    civicScore: 54,
    content: 'My landlord just increased rent by $280/week. That\'s more than my weekly grocery bill. I\'ve emailed my MP using Stickee and I\'m joining the rental freeze campaign. If we all do this it creates real pressure. #HousingCrisis #AustralianPolitics',
    linkedPillarId: 'housing',
    postedAt: '2026-04-03T06:45:00.000Z',
    reactions: { heart: 1243, fire: 567, flag: 4 },
    commentCount: 201,
    shareCount: 892,
    isAlgorithmicBoost: false,
  },

  {
    id: 'user-mp-response',
    type: 'user_post',
    authorId: 'user-jack-t',
    authorName: 'Jack T',
    authorHandle: '@jackfromperth',
    authorVerified: false,
    civicScore: 61,
    content: 'My local MP actually responded to my Stickee email! They said they\'re "monitoring the situation closely." That\'s politician for "doing nothing." Sending a follow-up today asking for a meeting. Anyone else had this happen? #HoldThemAccountable',
    linkedPillarId: 'housing',
    postedAt: '2026-04-02T17:30:00.000Z',
    reactions: { heart: 789, fire: 312, flag: 2 },
    commentCount: 143,
    shareCount: 334,
    isAlgorithmicBoost: false,
  },

  {
    id: 'user-climate-action',
    type: 'user_post',
    authorId: 'user-yara-s',
    authorName: 'Yara S',
    authorHandle: '@yara_sustain',
    authorVerified: false,
    civicScore: 48,
    content: 'Australia\'s future score is C (55/100) but there are real bright spots: rooftop solar penetration is world-leading and EV uptake doubled last year. The problem is we\'re not translating community action into policy fast enough. What\'s your electorate doing?',
    linkedPillarId: 'future',
    postedAt: '2026-04-01T09:00:00.000Z',
    reactions: { heart: 345, fire: 123, flag: 6 },
    commentCount: 67,
    shareCount: 156,
    isAlgorithmicBoost: false,
  },

  {
    id: 'user-crime-stats',
    type: 'user_post',
    authorId: 'user-dave-r',
    authorName: 'Dave R',
    authorHandle: '@dave_r_brisbane',
    authorVerified: false,
    civicScore: 39,
    content: 'Crime & Safety gets a D on Stickee and I think that\'s fair but it misses nuance. Property crime is up but violent crime is actually down in most states. We need better disaggregated data before throwing money at policing. The devil is in the details here.',
    linkedPillarId: 'crime-safety',
    postedAt: '2026-03-30T20:15:00.000Z',
    reactions: { heart: 234, fire: 89, flag: 45 },
    commentCount: 78,
    shareCount: 67,
    isAlgorithmicBoost: false,
  },

  {
    id: 'user-wages',
    type: 'user_post',
    authorId: 'user-tess-n',
    authorName: 'Tess N',
    authorHandle: '@tess_nurse_nsw',
    authorVerified: false,
    civicScore: 58,
    content: 'As a nurse I\'m watching the jobs & economy score. Wage growth looks OK on paper but healthcare workers are still behind inflation. We got a 3.5% pay rise this year — inflation was 4.2%. That\'s a real wage cut. This is not "improving."',
    linkedPillarId: 'jobs-economy',
    postedAt: '2026-03-29T16:45:00.000Z',
    reactions: { heart: 567, fire: 234, flag: 3 },
    commentCount: 89,
    shareCount: 234,
    isAlgorithmicBoost: false,
  },

  // ── Decision updates ──────────────────────────────────────────────────────

  {
    id: 'decision-housing-bill',
    type: 'decision_update',
    authorId: 'system',
    authorName: 'Stickee',
    authorHandle: '@stickee',
    authorVerified: true,
    content: '📋 Decision update: The Housing Affordability and Rental Reform Bill has moved to "In Debate" stage in the Senate. Key swing votes: 4 crossbench senators remain undecided. Contact your senator now — this is the moment for public pressure to matter.',
    linkedDecisionId: 'd-housing-affordability',
    linkedPillarId: 'housing',
    postedAt: '2026-04-02T12:00:00.000Z',
    reactions: { heart: 456, fire: 789, flag: 6 },
    commentCount: 112,
    shareCount: 445,
    isAlgorithmicBoost: true,
  },

  {
    id: 'decision-climate-passed',
    type: 'decision_update',
    authorId: 'system',
    authorName: 'Stickee',
    authorHandle: '@stickee',
    authorVerified: true,
    content: '✅ The Safeguard Mechanism Reform Bill passed the Senate 37–33. This is the most significant emissions policy in a decade. Predicted impact: -43% industrial emissions by 2030. Track long-term progress in the Future pillar.',
    linkedDecisionId: 'd-climate-1',
    linkedPillarId: 'future',
    postedAt: '2026-03-28T18:00:00.000Z',
    reactions: { heart: 1123, fire: 234, flag: 89 },
    commentCount: 234,
    shareCount: 678,
    isAlgorithmicBoost: true,
  },
]
