export type Party =
  | 'Labor'
  | 'Coalition'
  | 'Greens'
  | 'Independent'
  | 'Centre Alliance'
  | "Katter's Australian Party"
  | 'One Nation'
  | 'Jacqui Lambie Network'
  | 'United Australia Party'
  | "Australia's Voice"
  | (string & {})

export interface MP {
  id: string
  name: string
  party: Party
  electorate: string
  seatIndex: number
  stickeeScore: number
}

export interface Issue {
  id: string
  title: string
  summary: string
  content: string
  whatIsHappening: string
  whoSupports: string
  whoOpposes: string
  status: 'active' | 'passed' | 'rejected'
}

export interface Vote {
  mpId: string
  issueId: string
  vote: 'yes' | 'no' | 'abstain'
}

export interface Prediction {
  userId: string
  issueId: string
  prediction: 'yes' | 'no'
}
