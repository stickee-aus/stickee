import type { Issue } from '@/types'
import { marketStoryFor, marketVisualFor, type IssueMarket, type MarketCategory, type MarketStatus, type PredictionMarket } from '@/lib/mock-market-data'

export interface IssueVoteSummary {
  yes: number
  no: number
  abstain: number
}

export interface IssueWithStats extends Issue {
  voteSummary: IssueVoteSummary
}

export interface IssueMarketRecord {
  issue_id: string
  question: string
  category: string
  status: string
  probability: number | string
  total_participants: number
  resolves_by: string
  yes_change: number | string
  yes_volume: number
  no_volume: number
  yes_history: Array<number | string> | null
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toHistory(values: Array<number | string> | null | undefined) {
  if (!Array.isArray(values)) return []
  return values
    .map(value => toNumber(value, NaN))
    .filter(value => Number.isFinite(value))
}

function toMarketStatus(status: string): MarketStatus {
  if (status === 'resolved-yes' || status === 'resolved-no') return status
  return 'active'
}

function toMarketCategory(category: string): MarketCategory {
  if (category === 'civic' || category === 'election' || category === 'mp-vote') return category
  return 'bill'
}

export function mapIssueMarketRecord(record: IssueMarketRecord): IssueMarket {
  const probability = toNumber(record.probability, 50)
  const yesChange = toNumber(record.yes_change, 0)
  const yesHistory = toHistory(record.yes_history)

  return {
    issueId: record.issue_id,
    probability,
    totalParticipants: record.total_participants ?? 0,
    outcomes: [
      {
        outcome: 'Yes',
        price: probability,
        change: yesChange,
        volume: record.yes_volume ?? 0,
        history: yesHistory,
      },
      {
        outcome: 'No',
        price: Math.max(0, 100 - probability),
        change: yesChange * -1,
        volume: record.no_volume ?? 0,
        history: yesHistory.map(point => Math.max(0, 100 - point)),
      },
    ],
  }
}

export function isMarketActive(status: string) {
  return toMarketStatus(status) === 'active'
}

export function mapIssueMarketRecordToPredictionMarket(record: IssueMarketRecord): PredictionMarket {
  const category = toMarketCategory(record.category)
  const probability = toNumber(record.probability, 50)
  const priceChange = toNumber(record.yes_change, 0)

  return {
    id: record.issue_id,
    category,
    question: record.question,
    status: toMarketStatus(record.status),
    probability,
    priceChange,
    participants: record.total_participants ?? 0,
    resolvesBy: record.resolves_by,
    ...marketVisualFor(record.issue_id, category),
    ...marketStoryFor({
      id: record.issue_id,
      category,
      question: record.question,
      probability,
      priceChange,
      resolvesBy: record.resolves_by,
      history: toHistory(record.yes_history),
    }),
  }
}
