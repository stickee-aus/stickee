import type { AustralianState, ImpactArea } from '@/types/government'

export type ReadinessLevel = 'Ready' | 'Developing' | 'Not Ready'

export type PathwayStage =
  | 'Community Contributor'
  | 'Local Council'
  | 'State Level'
  | 'Federal Level'

export type LeaderField =
  | 'Environment'
  | 'Housing'
  | 'Healthcare'
  | 'Education'
  | 'Economy'
  | 'Indigenous Affairs'
  | 'Technology'
  | 'Infrastructure'
  | 'Social Services'
  | 'Foreign Policy'

export type ModerationStatus = 'pending' | 'approved' | 'rejected'

// ── Support system ─────────────────────────────────────────────────────────

export type SupportType =
  | 'General Support'
  | 'Volunteer Locally'
  | 'Offer Skills'
  | 'Join Discussions'
  | 'Advocate / Share'

export type SkillTag =
  | 'Legal'
  | 'Marketing'
  | 'Technology'
  | 'Operations'
  | 'Communications'
  | 'Fundraising'
  | 'Data'
  | 'Policy'

export type AvailabilityLevel = 'Weekend warrior' | 'Few hours/week' | 'Full-time'

export interface LocalMomentumEntry {
  city: string
  state: AustralianState
  count: number
}

export interface LeaderSupportSummary {
  totalSupporters: number
  volunteerCount: number
  skilledContributorCount: number
  localBreakdown: LocalMomentumEntry[]
  skillBreakdown: Partial<Record<SkillTag, number>>
}

export interface ReadinessThreshold {
  stage: PathwayStage
  localSupporters: number
  volunteers: number
  skilledContributors: number
  credibilityScore: number
}

export interface NominationOpportunity {
  id: string
  title: string
  body: string
  state: AustralianState
  closingDate: string
  url?: string
}

export interface PathwayToRealPoliticsContent {
  howToGetInvolvedLocally: string
  nextStepsToRun: string[]
  upcomingNominationOpportunities: NominationOpportunity[]
}

export interface Endorsement {
  id: string
  leaderId: string
  type: 'endorse' | 'concern'
  reason: string           // min 80 chars enforced in UI
  authorHandle: string     // e.g. "@civic_user_42"
  authorCredential?: string
  createdAt: string
  weight: number           // 1 standard | 2 verified credential
}

export interface EvidenceItem {
  category: 'experience' | 'achievement' | 'community'
  description: string      // min 60 chars
  verifiable: boolean
  sourceUrl?: string
}

export interface Nomination {
  id: string
  nominatorHandle: string
  justification: string    // min 120 chars
  evidence: EvidenceItem[]
  nominatedAt: string
  consentGiven: boolean
  moderationStatus: ModerationStatus
}

export interface CredibilityBreakdown {
  experienceScore: number    // 0–25
  achievementScore: number   // 0–25
  communityScore: number     // 0–20
  endorsementScore: number   // 0–20
  reasoningScore: number     // 0–10
  total: number              // 0–100
}

export interface LinkedDecision {
  decisionId: string         // references Decision.id from government.ts
  relevance: string
}

export interface FutureLeader {
  id: string
  name: string
  location: string
  state: AustralianState
  field: LeaderField
  shortBio: string
  fullBio: string
  avatarInitials: string
  readiness: ReadinessLevel
  currentPathwayStage: PathwayStage
  pathwayHistory: PathwayStage[]
  credibility: CredibilityBreakdown
  endorsements: Endorsement[]
  concerns: Endorsement[]
  linkedDecisions: LinkedDecision[]
  linkedIssueAreas: ImpactArea[]
  nomination: Nomination
  isRising: boolean
  isTrending: boolean
  isControversial: boolean   // endorsement:concern ratio < 2:1
  nominatedAt: string
  tags: string[]
  supportSummary?: LeaderSupportSummary
  pathwayContent?: PathwayToRealPoliticsContent
}
