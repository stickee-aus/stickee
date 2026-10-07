'use client'

import { useState } from 'react'
import { PageShell } from '@/components/ui/page-shell'
import { PageHeader } from '@/components/ui/page-header'
import { SectionHeader } from '@/components/ui/section-header'
import { RecordRow } from '@/components/ui/record-row'
import { UnderlineTabs, type UnderlineTabItem } from '@/components/ui/underline-tabs'
import { EmptyState } from '@/components/ui/empty-state'
import {
  agentLabel,
  eventHref,
  eventLinkLabel,
  formatEventTime,
  groupEventsByDate,
  type PulseCategory,
  type PulseEvent,
} from '@/lib/feed/pulse-format'
import type { PulsePageData } from '@/lib/feed/pulse-data'

type FilterId = 'all' | PulseCategory

const FILTER_TABS: UnderlineTabItem[] = [
  { id: 'all', label: 'All' },
  { id: 'parliament', label: 'Parliament' },
  { id: 'forecasts', label: 'Forecasts' },
  { id: 'issues', label: 'Issues' },
]

function PulseRow({ event }: { event: PulseEvent }) {
  const href = eventHref(event)
  const meta = `Automated update · ${agentLabel(event.sourceAgentId)} · ${formatEventTime(event.postedAt)}`

  return (
    <RecordRow
      href={href}
      label={event.relatedIssueTitle ?? event.content}
      summary={event.relatedIssueTitle ? event.content : undefined}
      meta={meta}
      value={
        href ? (
          <span className="text-metadata normal-case tracking-normal text-muted-foreground">
            {eventLinkLabel(event)}
          </span>
        ) : undefined
      }
    />
  )
}

export function PoliticalPulseClient({ events, source }: PulsePageData) {
  const [filter, setFilter] = useState<FilterId>('all')

  const filtered = filter === 'all' ? events : events.filter(e => e.category === filter)
  const groups = groupEventsByDate(filtered)
  const mostRecent = events[0]?.postedAt

  return (
    <PageShell>
      <PageHeader
        eyebrow="Australia · Civic record"
        title="Political Pulse"
        summary="What changed across Australian civic life?"
        metadata={
          source === 'database'
            ? { source: 'Automated civic agents', updatedDate: mostRecent ? formatEventTime(mostRecent) : undefined, verification: 'verified' }
            : undefined
        }
        metric={{ value: events.length, label: 'verified civic events' }}
      />

      <div className="mt-8">
        <UnderlineTabs items={FILTER_TABS} value={filter} onChange={value => setFilter(value as FilterId)} />
      </div>

      <div className="mt-2">
        {filtered.length === 0 ? (
          <EmptyState
            title="No verified civic updates are available for this period"
            description={events.length === 0 ? 'No automated civic alerts are currently available.' : 'Try a different filter.'}
          />
        ) : (
          groups.map(group => (
            <div key={group.label} className="mb-8">
              <SectionHeader title={group.label} />
              <div role="list">
                {group.events.map(event => (
                  <div role="listitem" key={event.id}>
                    <PulseRow event={event} />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </PageShell>
  )
}
