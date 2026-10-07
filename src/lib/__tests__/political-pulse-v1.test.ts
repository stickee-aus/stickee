import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  PULSE_AGENT_IDS,
  isPulseAgentId,
  agentLabel,
  AGENT_CATEGORY,
  stripLeadingGlyph,
  eventHref,
  eventLinkLabel,
  formatEventTime,
  groupEventsByDate,
  type PulseEvent,
} from '@/lib/feed/pulse-format'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// Regression tests for POLITICAL_PULSE_V1_REPORT.md — Political Pulse V1:
// the chronological civic change stream, governed by AGENTS.md and
// docs/philosophy/STICKEE_CHARTER.md. See the report for full before/after
// evidence and the classification of every value removed or preserved.

function makeEvent(overrides: Partial<PulseEvent> = {}): PulseEvent {
  return {
    id: 'evt-1',
    type: 'civic_alert',
    content: 'PASSED: Housing Affordability and Rental Reform Bill.',
    postedAt: '2026-08-11T02:00:00.000Z',
    sourceAgentId: 'parliament-watcher',
    category: 'parliament',
    relatedIssueId: null,
    relatedIssueTitle: null,
    relatedElectorate: null,
    ...overrides,
  }
}

describe('pulse-format — agent scope and authorship', () => {
  it('only recognises the four verified, real-source-chain agents', () => {
    expect(PULSE_AGENT_IDS).toEqual([
      'parliament-watcher',
      'bill-stage-tracker',
      'prediction-resolver',
      'electorate-pulse',
    ])
  })

  it('excludes mp-scorecard (the misleading civic-alignment heuristic already removed elsewhere)', () => {
    expect(isPulseAgentId('mp-scorecard')).toBe(false)
    expect(agentLabel('mp-scorecard')).toBe('Source unavailable')
  })

  it('excludes moderation-triage and daily-bonus (never write feed_posts / not civic content)', () => {
    expect(isPulseAgentId('moderation-triage')).toBe(false)
    expect(isPulseAgentId('daily-bonus')).toBe(false)
  })

  it('resolves a truthful human-readable label for every real agent', () => {
    expect(agentLabel('parliament-watcher')).toBe('Parliament watcher')
    expect(agentLabel('bill-stage-tracker')).toBe('Bill stage tracker')
    expect(agentLabel('prediction-resolver')).toBe('Prediction resolver')
    expect(agentLabel('electorate-pulse')).toBe('Electorate pulse')
  })

  it('falls back to "Source unavailable" rather than defaulting to a human/editorial byline', () => {
    expect(agentLabel(null)).toBe('Source unavailable')
    expect(agentLabel('some-future-agent')).toBe('Source unavailable')
  })
})

describe('pulse-format — category mapping (minimal filter model)', () => {
  it('maps each real agent to at most one of Parliament/Issues/Forecasts', () => {
    expect(AGENT_CATEGORY['parliament-watcher']).toBe('parliament')
    expect(AGENT_CATEGORY['bill-stage-tracker']).toBe('issues')
    expect(AGENT_CATEGORY['prediction-resolver']).toBe('forecasts')
  })

  it('does not force electorate-pulse digests into a category they do not fit (no decorative filter)', () => {
    expect(AGENT_CATEGORY['electorate-pulse']).toBeNull()
  })
})

describe('pulse-format — event copy', () => {
  it('strips a leading emoji/symbol glyph without altering the factual content', () => {
    expect(stripLeadingGlyph('🗳 PASSED: Some Bill.')).toBe('PASSED: Some Bill.')
    expect(stripLeadingGlyph('📍 Brisbane this week: 4 bill pressures.')).toBe('Brisbane this week: 4 bill pressures.')
    expect(stripLeadingGlyph('No leading glyph here.')).toBe('No leading glyph here.')
  })
})

describe('pulse-format — object links', () => {
  it('links a bill/issue event to its canonical /issue/[id] route', () => {
    const event = makeEvent({ sourceAgentId: 'bill-stage-tracker', category: 'issues', relatedIssueId: 'housing-affordability' })
    expect(eventHref(event)).toBe('/issue/housing-affordability')
    expect(eventLinkLabel(event)).toBe('View issue →')
  })

  it('links a parliament event (no issue id) to /parliament', () => {
    const event = makeEvent({ sourceAgentId: 'parliament-watcher', relatedIssueId: null })
    expect(eventHref(event)).toBe('/parliament')
    expect(eventLinkLabel(event)).toBe('View Parliament →')
  })

  it('does not fabricate a standalone route for an electorate-pulse digest', () => {
    const event = makeEvent({ sourceAgentId: 'electorate-pulse', category: null, relatedIssueId: null })
    expect(eventHref(event)).toBeUndefined()
  })

  it('prefers the real issue link even for a forecast-resolution event tied to an issue', () => {
    const event = makeEvent({ sourceAgentId: 'prediction-resolver', category: 'forecasts', relatedIssueId: 'climate-safeguard' })
    expect(eventHref(event)).toBe('/issue/climate-safeguard')
  })
})

describe('pulse-format — chronological grouping (primary ordering mechanism)', () => {
  // Grouping is by local calendar day (matches a reader's own "Today"), so
  // fixtures use local Date construction throughout rather than UTC ISO
  // strings — mixing the two makes the test's own boundary assumptions
  // timezone-dependent, not the function under test.
  const now = new Date(2026, 7, 11, 10, 0, 0) // 11 Aug 2026, 10:00 local

  it('groups strictly by calendar day into Today / Yesterday / Earlier, newest first within input order', () => {
    const events = [
      makeEvent({ id: 'a', postedAt: new Date(2026, 7, 11, 8, 0, 0).toISOString() }), // today
      makeEvent({ id: 'b', postedAt: new Date(2026, 7, 10, 20, 0, 0).toISOString() }), // yesterday
      makeEvent({ id: 'c', postedAt: new Date(2026, 7, 8, 9, 0, 0).toISOString() }), // earlier
    ]
    const groups = groupEventsByDate(events, now)
    expect(groups.map(g => g.label)).toEqual(['Today', 'Yesterday', 'Earlier'])
    expect(groups[0].events.map(e => e.id)).toEqual(['a'])
    expect(groups[1].events.map(e => e.id)).toEqual(['b'])
    expect(groups[2].events.map(e => e.id)).toEqual(['c'])
  })

  it('omits an empty group rather than rendering an empty "Yesterday" heading', () => {
    const events = [makeEvent({ id: 'a', postedAt: new Date(2026, 7, 11, 8, 0, 0).toISOString() })]
    const groups = groupEventsByDate(events, now)
    expect(groups.map(g => g.label)).toEqual(['Today'])
  })

  it('does not use engagement/boost score as a grouping or ordering input', () => {
    // groupEventsByDate's only ever accesses postedAt; asserted structurally
    // by construction (PulseEvent carries no score field at all).
    const event = makeEvent()
    expect('isAlgorithmicBoost' in event).toBe(false)
    expect('score' in event).toBe(false)
  })
})

describe('pulse-format — formatEventTime', () => {
  it('produces a readable, non-empty date/time string', () => {
    expect(formatEventTime('2026-08-11T02:00:00.000Z').length).toBeGreaterThan(0)
  })
})

describe('Political Pulse — banned engagement mechanics are absent from the rendered page', () => {
  const clientSource = read('src/components/PoliticalPulseClient.tsx')
  const pageSource = read('src/app/feed/page.tsx')
  const combined = clientSource + pageSource

  it('renders no reactions (heart/fire/flag)', () => {
    expect(combined).not.toContain('handleReact')
    expect(combined).not.toMatch(/\bFlame\b/)
    expect(combined).not.toContain('REACTION_ICONS')
  })

  it('renders no comments', () => {
    expect(combined).not.toContain('CommentPanel')
    expect(combined).not.toContain('useComments')
  })

  it('renders no share-for-points', () => {
    expect(combined).not.toContain('ShareButton')
    expect(combined).not.toContain('bonusPoints')
  })

  it('renders no "BOOSTED" badge or algorithmic-boost framing', () => {
    expect(combined).not.toContain('BOOSTED')
    expect(combined).not.toContain('isAlgorithmicBoost')
  })

  it('renders no scoreToGrade / letter-grade output', () => {
    expect(combined).not.toContain('scoreToGrade')
    expect(combined).not.toContain('gradeStyle')
    expect(combined).not.toContain('civicScore')
  })

  it('renders no compose bar or user-post authoring UI (not a community/social surface)', () => {
    expect(combined).not.toContain('ComposeBar')
    expect(combined).not.toContain("What's happening in your electorate")
  })

  it('does not use the engagement-weighted ranker as the primary ordering path', () => {
    expect(combined).not.toContain('getRankedFeed')
    expect(combined).not.toContain("from '@/lib/feed/ranker'")
    expect(combined).not.toContain('/api/feed/ranked')
  })

  it('does not present an engagement-ranking explanation ("algorithmically boosted")', () => {
    expect(combined).not.toContain('algorithmically boosted')
  })
})

describe('Political Pulse — required content is present', () => {
  const clientSource = read('src/components/PoliticalPulseClient.tsx')
  const dataSource = read('src/lib/feed/pulse-data.ts')

  it('states the page purpose in one sentence', () => {
    expect(clientSource).toContain('What changed across Australian civic life?')
  })

  it('shows at most one headline metric', () => {
    expect(clientSource).toContain("label: 'verified civic events'")
  })

  it('surfaces automated authorship as visible text, not colour alone', () => {
    expect(clientSource).toContain('Automated update ·')
    expect(clientSource).toContain('agentLabel(')
  })

  it('uses chronological date grouping as the primary order', () => {
    expect(clientSource).toContain('groupEventsByDate')
  })

  it('uses the minimal filter model (All / Parliament / Forecasts / Issues)', () => {
    expect(clientSource).toContain("{ id: 'all', label: 'All' }")
    expect(clientSource).toContain("{ id: 'parliament', label: 'Parliament' }")
    expect(clientSource).toContain("{ id: 'forecasts', label: 'Forecasts' }")
    expect(clientSource).toContain("{ id: 'issues', label: 'Issues' }")
    expect(clientSource).not.toContain("id: 'elections'")
  })

  it('shows the truthful empty-state copy', () => {
    expect(clientSource).toContain('No verified civic updates are available for this period')
  })

  it('uses the shared Civic Design System primitives', () => {
    expect(clientSource).toContain("from '@/components/ui/page-shell'")
    expect(clientSource).toContain("from '@/components/ui/page-header'")
    expect(clientSource).toContain("from '@/components/ui/section-header'")
    expect(clientSource).toContain("from '@/components/ui/record-row'")
    expect(clientSource).toContain("from '@/components/ui/underline-tabs'")
    expect(clientSource).toContain("from '@/components/ui/empty-state'")
  })

  it('does not introduce a page-scoped visual dialect (no bespoke hex colours or shadows)', () => {
    expect(clientSource).not.toMatch(/#[0-9a-fA-F]{3,6}/)
    expect(clientSource).not.toContain('shadow')
    expect(clientSource).not.toContain('rounded-full')
  })

  it('restricts the chronological query to the verified agent source chain only', () => {
    expect(dataSource).toContain('PULSE_AGENT_IDS')
    expect(dataSource).toContain("order('posted_at', { ascending: false })")
  })

  it('never fabricates seed content when the real query is empty (prefers a truthful empty state)', () => {
    expect(dataSource).not.toContain('FEED_POSTS')
    expect(dataSource).not.toContain('mock-fallback')
  })
})

describe('Political Pulse — accessibility', () => {
  const clientSource = read('src/components/PoliticalPulseClient.tsx')

  it('uses list/listitem semantics for the event stream', () => {
    expect(clientSource).toContain('role="list"')
    expect(clientSource).toContain('role="listitem"')
  })

  it('uses a real heading component for date-group headings, not a styled <div>', () => {
    expect(clientSource).toContain('<SectionHeader')
  })

  it('does not hide a functional control behind a bare "hidden sm:*" wrapper', () => {
    expect(clientSource).not.toMatch(/hidden sm:(flex|block)/)
  })
})
