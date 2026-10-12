import { issueIndex, issues as mockIssues, getVoteSummary } from '@/lib/mock-data'
import { issueMarkets as mockIssueMarkets, type IssueMarket, type PredictionMarket } from '@/lib/mock-market-data'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  mapIssueMarketRecord,
  mapIssueMarketRecordToPredictionMarket,
  type IssueMarketRecord,
  type IssueWithStats,
  type IssuesDataSource,
} from '@/lib/issues-data'
import { isSupabaseConfigured } from '@/lib/supabase-config'

interface DBIssueRow {
  id: string
  title: string
  summary: string
  content: string
  what_is_happening: string
  who_supports: string
  who_opposes: string
  status: 'active' | 'passed' | 'rejected'
  mp_yes_count: number
  mp_no_count: number
  mp_abstain_count: number
  source_url: string | null
  updated_at: string
}

const ISSUE_ROW_COLUMNS =
  'id, title, summary, content, what_is_happening, who_supports, who_opposes, status, mp_yes_count, mp_no_count, mp_abstain_count, source_url, updated_at'

function mapIssueRow(row: DBIssueRow): IssueWithStats {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    content: row.content,
    whatIsHappening: row.what_is_happening,
    whoSupports: row.who_supports,
    whoOpposes: row.who_opposes,
    status: row.status,
    voteSummary: {
      yes: row.mp_yes_count ?? 0,
      no: row.mp_no_count ?? 0,
      abstain: row.mp_abstain_count ?? 0,
    },
    updatedAt: row.updated_at,
    sourceUrl: row.source_url,
  }
}

function getMockIssuesWithStats(): IssueWithStats[] {
  return mockIssues.map(issue => ({
    ...issue,
    voteSummary: getVoteSummary(issue.id),
  }))
}

function getMockIssueWithStats(issueId: string): IssueWithStats | null {
  const issue = issueIndex[issueId]
  if (!issue) return null

  return {
    ...issue,
    voteSummary: getVoteSummary(issueId),
  }
}

export async function getIssuesPageData(): Promise<{
  issues: IssueWithStats[]
  markets: Record<string, IssueMarket>
  /** 'database' only when every issue and market below is real Supabase data — never assume otherwise. */
  source: IssuesDataSource
}> {
  if (!isSupabaseConfigured) {
    return { issues: getMockIssuesWithStats(), markets: mockIssueMarkets, source: 'mock' }
  }

  try {
    const supabase = await createServerSupabaseClient()
    const [issuesRes, marketsRes] = await Promise.all([
      supabase
        .from('issues')
        .select(ISSUE_ROW_COLUMNS)
        .eq('is_test_fixture', false)
        .order('updated_at', { ascending: false }),
      supabase
        .from('issue_markets')
        .select('issue_id, question, category, status, probability, total_participants, resolves_by, yes_change, yes_volume, no_volume, yes_history')
        .eq('is_test_fixture', false),
    ])

    const issueRows = (issuesRes.data ?? []) as DBIssueRow[]
    const marketRows = (marketsRes.data ?? []) as IssueMarketRecord[]

    if (issueRows.length === 0) {
      return { issues: getMockIssuesWithStats(), markets: mockIssueMarkets, source: 'mock' }
    }

    return {
      issues: issueRows.map(mapIssueRow),
      markets: Object.fromEntries(
        marketRows.map(row => [row.issue_id, mapIssueMarketRecord(row)])
      ),
      source: 'database',
    }
  } catch {
    return { issues: getMockIssuesWithStats(), markets: mockIssueMarkets, source: 'mock' }
  }
}

export async function getIssueDetailData(issueId: string): Promise<{
  issue: IssueWithStats
  /**
   * The canonical Forecasts-page market shape (same mapper/eligibility rules
   * as /predictions), never the older IssueMarket type. Only ever populated
   * from a real issue_markets row — the mock fallback below intentionally
   * returns null here, never a demo market, per ISSUE_DETAIL_V1_REPORT.md's
   * "no mock fallback" rule for the Forecasts section.
   */
  market: PredictionMarket | null
  /** 'database' only when the issue itself is real Supabase data — never assume otherwise. */
  source: IssuesDataSource
} | null> {
  if (!isSupabaseConfigured) {
    const issue = getMockIssueWithStats(issueId)
    return issue ? { issue, market: null, source: 'mock' } : null
  }

  try {
    const supabase = await createServerSupabaseClient()
    const [issueRes, marketRes] = await Promise.all([
      supabase
        .from('issues')
        .select(ISSUE_ROW_COLUMNS)
        .eq('id', issueId)
        .eq('is_test_fixture', false)
        .maybeSingle(),
      supabase
        .from('issue_markets')
        .select('issue_id, question, category, status, probability, total_participants, resolves_by, yes_change, yes_volume, no_volume, yes_history, resolution_source')
        .eq('issue_id', issueId)
        .eq('is_test_fixture', false)
        .maybeSingle(),
    ])

    if (issueRes.data) {
      return {
        issue: mapIssueRow(issueRes.data as DBIssueRow),
        market: marketRes.data ? mapIssueMarketRecordToPredictionMarket(marketRes.data as IssueMarketRecord) : null,
        source: 'database',
      }
    }
  } catch {
    // Fall through to mock data.
  }

  const issue = getMockIssueWithStats(issueId)
  if (!issue) return null

  return {
    issue,
    market: null,
    source: 'mock',
  }
}
