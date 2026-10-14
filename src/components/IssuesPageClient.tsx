'use client'

import { useState } from 'react'
import type { IssueMarket } from '@/lib/mock-market-data'
import type { IssueWithStats, IssuesDataSource } from '@/lib/issues-data'
import { PageShell } from '@/components/ui/page-shell'
import { PageHeader } from '@/components/ui/page-header'
import { RecordRow } from '@/components/ui/record-row'
import { StatusLabel, type Status } from '@/components/ui/status-label'
import { UnderlineTabs, type UnderlineTabItem } from '@/components/ui/underline-tabs'
import { EmptyState } from '@/components/ui/empty-state'
import { useElectorateStorage } from '@/hooks/useElectorateStorage'
import { CivicExplainer } from '@/components/CivicExplainer'
import Link from 'next/link'

type StatusFilter = 'all' | 'active' | 'passed' | 'rejected'

const STATUS_TABS: UnderlineTabItem[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'passed', label: 'Passed' },
  { id: 'rejected', label: 'Rejected' },
]

const STATUS_CONFIG: Record<IssueWithStats['status'], { status: Status; label: string }> = {
  active: { status: 'active', label: 'Active' },
  passed: { status: 'passed', label: 'Passed' },
  rejected: { status: 'voided', label: 'Rejected' },
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function IssueRow({
  issue,
  hasForecast,
  source,
}: {
  issue: IssueWithStats
  hasForecast: boolean
  source: IssuesDataSource
}) {
  const config = STATUS_CONFIG[issue.status]

  const metaParts: string[] = []
  if (source === 'database' && issue.updatedAt) metaParts.push(`Updated ${formatDate(issue.updatedAt)}`)
  if (source === 'database' && hasForecast) metaParts.push('Forecast available')

  return (
    <RecordRow
      href={`/issue/${issue.id}`}
      label={issue.title}
      summary={issue.summary}
      meta={metaParts.length > 0 ? metaParts.join(' · ') : undefined}
      status={
        <div className="flex items-center gap-1.5">
          <StatusLabel status={config.status} label={config.label} />
          {source === 'mock' && <StatusLabel status="demo" />}
        </div>
      }
      value={<span className="text-metadata normal-case tracking-normal text-muted-foreground">View issue →</span>}
    />
  )
}

export function IssuesPageClient({
  issues,
  markets,
  source,
}: {
  issues: IssueWithStats[]
  markets: Record<string, IssueMarket>
  source: IssuesDataSource
}) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const { electorate, loaded } = useElectorateStorage()

  const filtered = issues.filter(issue => statusFilter === 'all' || issue.status === statusFilter)

  return (
    <PageShell>
      <PageHeader
        eyebrow="Australia · Issues"
        title="Issues"
        summary="What major problems is Australia dealing with, and why do they matter?"
        metadata={{ verification: source === 'database' ? 'verified' : 'demo' }}
        metric={{ value: issues.length, label: 'Issues tracked' }}
      />

      {loaded && electorate && (
        <div className="mt-6 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Showing issues relevant to </span>
          <span className="font-medium text-foreground">{electorate.electorate}</span>
          <span className="text-muted-foreground">. </span>
          <Link href="/leaders" className="underline-offset-2 hover:underline">
            See how your MP votes
          </Link>
          <span className="text-muted-foreground"> on related bills once records are ready.</span>
        </div>
      )}

      <div className="mt-6">
        <CivicExplainer title="How do issues become votes?">
          <p>
            Most issues start as bills or motions in Parliament. When the House or Senate is divided, a formal vote (a division) is recorded.
            Your MP’s vote on those divisions is the clearest record of what they actually did — which is why Stickee focuses on verified voting records rather than statements alone.
          </p>
        </CivicExplainer>
      </div>

      <div className="mt-8">
        <UnderlineTabs items={STATUS_TABS} value={statusFilter} onChange={value => setStatusFilter(value as StatusFilter)} />
      </div>

      <div className="mt-2">
        {filtered.length === 0 ? (
          <EmptyState title="No issues match this filter" description="Try a different status filter." />
        ) : (
          <div role="list">
            {filtered.map(issue => (
              <div role="listitem" key={issue.id}>
                <IssueRow issue={issue} hasForecast={!!markets[issue.id]} source={source} />
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  )
}
