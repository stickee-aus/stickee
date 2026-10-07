'use client'

import Link from 'next/link'
import { getElectionPartyColor } from '@/lib/aec-election'
import type { LiveElectionSnapshot } from '@/lib/aec-election-types'
import { LiveResultsExplainer } from '@/components/LiveResultsExplainer'

function formatUpdatedAt(value: string | null) {
  if (!value) return 'Waiting for AEC update'
  return new Date(value).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function LiveElectionPulse({ snapshot }: { snapshot: LiveElectionSnapshot }) {
  if (!snapshot.active) {
    return (
      <div className="mt-6 rounded-2xl border border-white/[0.07] bg-card px-5 py-4">
        <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Live Election Pulse</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">{snapshot.reason ?? 'No live federal count right now'}</p>
      </div>
    )
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/[0.07] bg-card px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Live Election Pulse</p>
          <p className="mt-2 text-sm font-medium text-foreground">{snapshot.national.governmentLabel}</p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground/70">
            {snapshot.national.reportingProgressPct !== null
              ? `${snapshot.national.reportingProgressPct}% of votes counted`
              : snapshot.national.reportingLabel}
          </p>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground/60">
            Official source: AEC · Last updated {formatUpdatedAt(snapshot.event.updatedAt)}
          </p>
        </div>

        {snapshot.event.resultsUrl && (
          <Link
            href={snapshot.event.resultsUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 font-mono text-[10px] tracking-widest uppercase text-foreground"
          >
            View full live results
          </Link>
        )}
      </div>

      {snapshot.national.seatCounts.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {snapshot.national.seatCounts.map(entry => (
            <div
              key={entry.party}
              className="rounded-xl border border-white/[0.06] bg-background/30 px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: getElectionPartyColor(entry.party) }}
                />
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  {entry.party}
                </span>
              </div>
              <p className="mt-2 font-mono text-sm text-foreground">{entry.called} called</p>
              <p className="font-mono text-[10px] text-muted-foreground/70">{entry.leading} leading</p>
            </div>
          ))}
        </div>
      )}

      <LiveResultsExplainer />
    </div>
  )
}
