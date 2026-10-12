import 'server-only'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { FeedPostType } from '@/lib/mock-feed-data'
import {
  PULSE_AGENT_IDS,
  isPulseAgentId,
  AGENT_CATEGORY,
  stripLeadingGlyph,
  type PulseEvent,
} from '@/lib/feed/pulse-format'
import { isSupabaseConfigured } from '@/lib/supabase-config'

/**
 * Political Pulse V1 — chronological data source.
 * ───────────────────────────────────────────────────────────
 * Deliberately a new, separate query path from src/lib/feed/ranker.ts. The
 * ranker is an engagement-weighted model (per docs/page-audits/
 * POLITICAL_PULSE_PAGE_AUDIT.md, "architecturally the wrong model for a
 * chronological page") and stays in place for any surface that still needs
 * it — Political Pulse does not call it.
 *
 * Reads with the anon/session-scoped client (not the admin client), same as
 * src/lib/issues-db.ts — feed_posts and issues both carry public-read RLS
 * policies, so no elevated access is needed for a public chronological read.
 */

interface FeedPostRow {
  id: string
  type: FeedPostType
  content: string
  posted_at: string
  source_agent_id: string | null
  linked_bill_id: string | null
  linked_electorate: string | null
}

export interface PulsePageData {
  events: PulseEvent[]
  /** 'database' only when every event below is a real feed_posts row — never assume otherwise. */
  source: 'database' | 'empty'
}

export async function getChronologicalPulse(opts: { limit?: number } = {}): Promise<PulsePageData> {
  const limit = Math.min(opts.limit ?? 150, 300)

  if (!isSupabaseConfigured) return { events: [], source: 'empty' }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('feed_posts')
      .select('id, type, content, posted_at, source_agent_id, linked_bill_id, linked_electorate')
      .in('source_agent_id', PULSE_AGENT_IDS as unknown as string[])
      .order('posted_at', { ascending: false })
      .limit(limit)

    if (error || !data || data.length === 0) {
      return { events: [], source: 'empty' }
    }

    const rows = data as FeedPostRow[]

    // Batch-resolve real issue titles for rows tied to a bill/issue id, so a
    // row can surface "Housing affordability" as its headline rather than
    // just the raw agent copy — only bill-stage-tracker and prediction-resolver
    // ever set linked_bill_id to a real issues.id.
    const issueIds = Array.from(new Set(rows.map(r => r.linked_bill_id).filter((id): id is string => !!id)))
    const issueTitles = new Map<string, string>()
    if (issueIds.length > 0) {
      const { data: issueRows } = await supabase
        .from('issues')
        .select('id, title')
        .in('id', issueIds)
      for (const row of (issueRows ?? []) as Array<{ id: string; title: string }>) {
        issueTitles.set(row.id, row.title)
      }
    }

    const events: PulseEvent[] = rows
      .filter(r => isPulseAgentId(r.source_agent_id))
      .map(r => {
        const sourceAgentId = r.source_agent_id as NonNullable<typeof r.source_agent_id> & string
        return {
          id: r.id,
          type: r.type,
          content: stripLeadingGlyph(r.content),
          postedAt: r.posted_at,
          sourceAgentId: sourceAgentId as PulseEvent['sourceAgentId'],
          category: AGENT_CATEGORY[sourceAgentId as PulseEvent['sourceAgentId']],
          relatedIssueId: r.linked_bill_id,
          relatedIssueTitle: r.linked_bill_id ? issueTitles.get(r.linked_bill_id) ?? null : null,
          relatedElectorate: r.linked_electorate,
        }
      })

    if (events.length === 0) return { events: [], source: 'empty' }

    return { events, source: 'database' }
  } catch {
    // No configured Supabase environment, or a transient read failure — a
    // truthful empty state, never fabricated seed content (see report §6:
    // Political Pulse has no honest demo dataset equivalent to Issues'/
    // Forecasts' mock fallback, so V1 does not invent one).
    return { events: [], source: 'empty' }
  }
}
