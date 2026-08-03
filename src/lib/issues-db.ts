import { issueIndex, issues as mockIssues, getVoteSummary } from '@/lib/mock-data'
import { issueMarkets as mockIssueMarkets, type IssueMarket } from '@/lib/mock-market-data'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { mapIssueMarketRecord, type IssueMarketRecord, type IssueWithStats } from '@/lib/issues-data'

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
}

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
}> {
  try {
    const supabase = await createServerSupabaseClient()
    const [issuesRes, marketsRes] = await Promise.all([
      supabase
        .from('issues')
        .select('id, title, summary, content, what_is_happening, who_supports, who_opposes, status, mp_yes_count, mp_no_count, mp_abstain_count')
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
      return { issues: getMockIssuesWithStats(), markets: mockIssueMarkets }
    }

    return {
      issues: issueRows.map(mapIssueRow),
      markets: Object.fromEntries(
        marketRows.map(row => [row.issue_id, mapIssueMarketRecord(row)])
      ),
    }
  } catch {
    return { issues: getMockIssuesWithStats(), markets: mockIssueMarkets }
  }
}

export async function getIssueDetailData(issueId: string): Promise<{
  issue: IssueWithStats
  market: IssueMarket | null
} | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const [issueRes, marketRes] = await Promise.all([
      supabase
        .from('issues')
        .select('id, title, summary, content, what_is_happening, who_supports, who_opposes, status, mp_yes_count, mp_no_count, mp_abstain_count')
        .eq('id', issueId)
        .eq('is_test_fixture', false)
        .maybeSingle(),
      supabase
        .from('issue_markets')
        .select('issue_id, question, category, status, probability, total_participants, resolves_by, yes_change, yes_volume, no_volume, yes_history')
        .eq('issue_id', issueId)
        .eq('is_test_fixture', false)
        .maybeSingle(),
    ])

    if (issueRes.data) {
      return {
        issue: mapIssueRow(issueRes.data as DBIssueRow),
        market: marketRes.data ? mapIssueMarketRecord(marketRes.data as IssueMarketRecord) : null,
      }
    }
  } catch {
    // Fall through to mock data.
  }

  const issue = getMockIssueWithStats(issueId)
  if (!issue) return null

  return {
    issue,
    market: mockIssueMarkets[issueId] ?? null,
  }
}
