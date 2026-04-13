export type GovernmentLevel = 'federal' | 'state' | 'local'

export type DecisionType =
  | 'Bill'
  | 'Policy Change'
  | 'Announcement'
  | 'Funding Allocation'
  | 'Regulation'
  | 'Infrastructure'

export type DecisionStatus =
  | 'Proposed'
  | 'In Debate'
  | 'Passed'
  | 'Rejected'
  | 'Implemented'

export type ImpactLevel = 'Low' | 'Medium' | 'High'

export type ImpactArea =
  | 'Healthcare'
  | 'Education'
  | 'Housing'
  | 'Cost of Living'
  | 'Environment'
  | 'Transport'
  | 'Infrastructure'
  | 'Economy'
  | 'Security'
  | 'Social Services'

export type AustralianState =
  | 'NSW'
  | 'VIC'
  | 'QLD'
  | 'WA'
  | 'SA'
  | 'TAS'
  | 'ACT'
  | 'NT'

export interface TimelineEvent {
  date: string
  label: string
  status: DecisionStatus
  note?: string
}

export interface DecisionMaker {
  id: string
  name: string
  role: string
  party: string
  partyShort: string
  electorate: string
  level: GovernmentLevel
  state?: AustralianState
  council?: string
  approvalRating: number // 0–100
  keyResponsibilities: string[]
  decisions: string[] // decision IDs
  trustScore: number // 0–100, community-voted
  totalRatings: number
}

export interface Decision {
  id: string
  decisionMakerId: string
  type: DecisionType
  title: string
  summary: string
  status: DecisionStatus
  date: string
  timeline: TimelineEvent[]
  impactAreas: ImpactArea[]
  level: GovernmentLevel
  state?: AustralianState
  council?: string
  affectsScope: string // "All Australians" | "NSW residents" | "Inner West, Sydney"
  impactLevel: ImpactLevel
  expectedShortTerm: string
  expectedLongTerm: string
  likes: number
  dislikes: number
  isTrending: boolean
  isControversial: boolean
  tags: string[]
  relevanceTags: string[]
  predictionQuestion: string
}
