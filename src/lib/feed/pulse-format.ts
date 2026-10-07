import type { FeedPostType } from '@/lib/mock-feed-data'

/**
 * Political Pulse V1 — pure, server/client-safe formatting helpers.
 * No Supabase import here on purpose: this module is unit-tested directly
 * and reused by both the server data-fetcher (pulse-data.ts) and the client
 * page component, so it must stay free of 'server-only' imports.
 */

// The only agent slugs whose posts have a real, traceable evidence chain
// (per docs/page-audits/POLITICAL_PULSE_PAGE_AUDIT.md's content-type scope
// gate). mp-scorecard is deliberately excluded — its civic_score is the same
// unscoped heuristic already removed elsewhere (see commit e8aab4d, "fix:
// remove misleading MP voting-consistency score"). moderation-triage and
// daily-bonus never write feed_posts. user_post/leader_update (human/community
// content) are excluded per this batch's scope: Political Pulse V1 is
// agent-authored civic alerts only.
export const PULSE_AGENT_IDS = [
  'parliament-watcher',
  'bill-stage-tracker',
  'prediction-resolver',
  'electorate-pulse',
] as const

export type PulseAgentId = (typeof PULSE_AGENT_IDS)[number]

export function isPulseAgentId(value: string | null): value is PulseAgentId {
  return !!value && (PULSE_AGENT_IDS as readonly string[]).includes(value)
}

// Visible, truthful authorship label per agent — restores the
// source_agent_id disclosure that the old ranker dropped before it reached
// the client (POLITICAL_PULSE_PAGE_AUDIT.md P1).
export const AGENT_LABELS: Record<PulseAgentId, string> = {
  'parliament-watcher': 'Parliament watcher',
  'bill-stage-tracker': 'Bill stage tracker',
  'prediction-resolver': 'Prediction resolver',
  'electorate-pulse': 'Electorate pulse',
}

export function agentLabel(agentId: string | null): string {
  return isPulseAgentId(agentId) ? AGENT_LABELS[agentId] : 'Source unavailable'
}

// Minimal filter model (All / Parliament / Forecasts / Issues). electorate-pulse
// digests aggregate cross-pillar local activity and don't map cleanly onto any
// one of these — they surface only under "All", not as a dedicated tab, per
// this batch's "no decorative filters" instruction.
export type PulseCategory = 'parliament' | 'issues' | 'forecasts'

export const AGENT_CATEGORY: Record<PulseAgentId, PulseCategory | null> = {
  'parliament-watcher': 'parliament',
  'bill-stage-tracker': 'issues',
  'prediction-resolver': 'forecasts',
  'electorate-pulse': null,
}

export const CATEGORY_LABEL: Record<PulseCategory, string> = {
  parliament: 'Parliament',
  issues: 'Issues',
  forecasts: 'Forecasts',
}

export interface PulseEvent {
  id: string
  type: FeedPostType
  content: string
  postedAt: string
  sourceAgentId: PulseAgentId
  category: PulseCategory | null
  relatedIssueId: string | null
  relatedIssueTitle: string | null
  relatedElectorate: string | null
}

/** Strips a leading emoji/symbol glyph from agent copy — display-only, never rewrites the underlying fact. */
export function stripLeadingGlyph(text: string): string {
  return text.replace(/^[^\p{L}\p{N}]+/u, '').trim()
}

export function eventHref(event: Pick<PulseEvent, 'sourceAgentId' | 'relatedIssueId'>): string | undefined {
  if (event.relatedIssueId) return `/issue/${event.relatedIssueId}`
  if (event.sourceAgentId === 'parliament-watcher') return '/parliament'
  return undefined
}

export function eventLinkLabel(event: Pick<PulseEvent, 'sourceAgentId' | 'relatedIssueId'>): string {
  if (event.relatedIssueId) return 'View issue →'
  if (event.sourceAgentId === 'parliament-watcher') return 'View Parliament →'
  return 'View →'
}

export function formatEventTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export interface PulseDateGroup {
  label: 'Today' | 'Yesterday' | 'Earlier'
  events: PulseEvent[]
}

/** Chronological (newest-first) date grouping — the primary ordering mechanism for Political Pulse V1. */
export function groupEventsByDate(events: PulseEvent[], now: Date = new Date()): PulseDateGroup[] {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  const today: PulseEvent[] = []
  const yesterday: PulseEvent[] = []
  const earlier: PulseEvent[] = []

  for (const event of events) {
    const postedAt = new Date(event.postedAt)
    if (postedAt >= startOfToday) today.push(event)
    else if (postedAt >= startOfYesterday) yesterday.push(event)
    else earlier.push(event)
  }

  const groups: PulseDateGroup[] = []
  if (today.length > 0) groups.push({ label: 'Today', events: today })
  if (yesterday.length > 0) groups.push({ label: 'Yesterday', events: yesterday })
  if (earlier.length > 0) groups.push({ label: 'Earlier', events: earlier })
  return groups
}
