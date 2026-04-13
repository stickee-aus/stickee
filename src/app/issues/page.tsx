'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, TrendingUp, TrendingDown, Users, CheckCircle, XCircle, MinusCircle } from 'lucide-react'
import { issues, getVoteSummary } from '@/lib/mock-data'
import type { Issue } from '@/types'
import { issueMarkets } from '@/lib/mock-market-data'
import { EmailMPModal } from '@/components/EmailMPModal'
import { useToast } from '@/components/ui/toast'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function probColor(p: number): string {
  if (p >= 60) return '#2ec266'
  if (p >= 45) return '#f5a623'
  return '#f04747'
}

function statusStyle(status: string) {
  if (status === 'passed')   return { color: '#2ec266', label: 'PASSED',  bg: '#041008' }
  if (status === 'rejected') return { color: '#f04747', label: 'REJECTED', bg: '#1e0a0a' }
  return                            { color: '#f5a623', label: 'ACTIVE',   bg: '#1e1800' }
}

// ─── Issue card ───────────────────────────────────────────────────────────────

function IssueCard({ issue, onEmailMP }: {
  issue: typeof issues[number]
  onEmailMP: (issueId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const summary = getVoteSummary(issue.id)
  const market  = issueMarkets[issue.id]
  const total   = summary.yes + summary.no + summary.abstain
  const yesPct  = total > 0 ? Math.round((summary.yes / total) * 100) : 0
  const st      = statusStyle(issue.status)
  const prob    = market?.probability ?? 50
  const change  = market?.outcomes[0].change ?? 0

  return (
    <article className="border-b border-border last:border-0">
      {/* ── Summary row ── */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full text-left py-5 hover:bg-card/20 transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* Status badge */}
          <span
            className="font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 border shrink-0 mt-0.5"
            style={{ color: st.color, borderColor: `${st.color}30`, background: st.bg }}
          >
            {st.label}
          </span>

          {/* Title + summary */}
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-foreground mb-0.5">{issue.title}</p>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed">{issue.summary}</p>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-5 shrink-0">
            {/* MP vote split */}
            <div className="text-right">
              <p className="font-mono text-xs" style={{ color: yesPct >= 50 ? '#2ec266' : '#f04747' }}>
                {yesPct}%
              </p>
              <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>MP Yes</p>
            </div>

            {/* Prediction market probability */}
            {market && (
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end">
                  <span className="font-mono text-xs" style={{ color: probColor(prob) }}>{prob}%</span>
                  {change > 0
                    ? <TrendingUp className="h-2.5 w-2.5" style={{ color: '#2ec266' }} />
                    : change < 0
                    ? <TrendingDown className="h-2.5 w-2.5" style={{ color: '#f04747' }} />
                    : null
                  }
                </div>
                <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
                  <Users className="h-2 w-2 inline mr-0.5" />{market.totalParticipants.toLocaleString()}
                </p>
              </div>
            )}

            {/* Chevron */}
            <span
              className="font-mono text-xs transition-transform duration-200"
              style={{ color: '#3a3a3e', display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'none' }}
            >
              ▾
            </span>
          </div>
        </div>

        {/* Vote bar */}
        <div className="mt-3 flex gap-px h-1 rounded-full overflow-hidden">
          <div style={{ width: `${yesPct}%`, background: '#2ec266' }} />
          <div style={{ width: `${100 - yesPct - Math.round((summary.abstain / total) * 100)}%`, background: '#f04747' }} />
          <div style={{ width: `${total > 0 ? Math.round((summary.abstain / total) * 100) : 0}%`, background: '#2a2a2e' }} />
        </div>
        <div className="mt-1 flex gap-4">
          <span className="font-mono text-[9px]" style={{ color: '#2ec266' }}>
            <CheckCircle className="h-2 w-2 inline mr-0.5" />{summary.yes} Yes
          </span>
          <span className="font-mono text-[9px]" style={{ color: '#f04747' }}>
            <XCircle className="h-2 w-2 inline mr-0.5" />{summary.no} No
          </span>
          <span className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>
            <MinusCircle className="h-2 w-2 inline mr-0.5" />{summary.abstain} Abstain
          </span>
        </div>
      </button>

      {/* ── Expanded detail ── */}
      {expanded && (
        <div className="pb-6 space-y-4">
          {/* What's happening */}
          <div className="pl-0 space-y-3">
            <div>
              <p className="font-mono text-[9px] tracking-widest uppercase mb-1.5" style={{ color: '#3a3a3e' }}>What&apos;s happening</p>
              <p className="font-mono text-xs text-muted-foreground leading-relaxed">{issue.whatIsHappening}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-border/50 p-3">
                <p className="font-mono text-[9px] tracking-widest uppercase mb-1" style={{ color: '#2ec266' }}>Supports</p>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">{issue.whoSupports}</p>
              </div>
              <div className="border border-border/50 p-3">
                <p className="font-mono text-[9px] tracking-widest uppercase mb-1" style={{ color: '#f04747' }}>Opposes</p>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed">{issue.whoOpposes}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => onEmailMP(issue.id)}
              className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 transition-colors"
              style={{ background: '#e8e8e6', color: '#0a0a0b' }}
            >
              <Mail className="h-3 w-3" />
              Email your MP
            </button>
            <Link
              href={`/predictions?market=${issue.id}`}
              className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 border border-border transition-colors hover:bg-card/50"
            >
              <TrendingUp className="h-3 w-3" />
              Predict outcome
            </Link>
          </div>
        </div>
      )}
    </article>
  )
}

// ─── Issues page ──────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'active' | 'passed' | 'rejected'

export default function IssuesPage() {
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [emailTarget, setEmailTarget]   = useState<Issue | null>(null)

  const filtered = issues.filter(i => statusFilter === 'all' || i.status === statusFilter)

  const activeCount   = issues.filter(i => i.status === 'active').length
  const passedCount   = issues.filter(i => i.status === 'passed').length
  const rejectedCount = issues.filter(i => i.status === 'rejected').length

  function handleEmailMP(issueId: string) {
    const issue = issues.find(i => i.id === issueId) ?? null
    setEmailTarget(issue)
  }

  const STATUS_FILTERS: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all',      label: 'All',      count: issues.length },
    { key: 'active',   label: 'Active',   count: activeCount },
    { key: 'passed',   label: 'Passed',   count: passedCount },
    { key: 'rejected', label: 'Rejected', count: rejectedCount },
  ]

  return (
    <div className="mx-auto max-w-3xl px-6">

      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-6 py-10 border-b border-border">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Australia · Bills &amp; Issues
          </p>
          <div className="flex items-baseline gap-3">
            <span
              className="font-mono font-normal leading-none text-foreground"
              style={{ fontSize: 'clamp(40px, 8vw, 56px)', letterSpacing: '-0.02em' }}
            >
              {issues.length}
            </span>
            <span className="font-mono text-xl text-muted-foreground/40">bills tracked</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-2" style={{ letterSpacing: '0.03em' }}>
            {activeCount} active · {passedCount} passed · {rejectedCount} rejected
          </p>
        </div>

        <div className="hidden sm:flex items-end gap-6 pb-1">
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1" style={{ color: '#f5a623' }}>{activeCount}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Active</p>
          </div>
          <div className="w-px h-8 bg-border mb-1" />
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1" style={{ color: '#2ec266' }}>{passedCount}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Passed</p>
          </div>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-0 py-4 border-b border-border">
        {STATUS_FILTERS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className="font-mono text-[10px] tracking-widest uppercase px-4 py-2 border-b-2 transition-colors"
            style={{
              color:       statusFilter === key ? '#e8e8e6' : '#5a5a5e',
              borderColor: statusFilter === key ? '#e8e8e6' : 'transparent',
            }}
          >
            {label} <span style={{ color: '#2a2a2e' }}>({count})</span>
          </button>
        ))}
      </div>

      {/* ── Issue list ── */}
      <div className="mb-12">
        {filtered.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground py-12 text-center">
            No bills match this filter
          </p>
        ) : (
          filtered.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onEmailMP={handleEmailMP}
            />
          ))
        )}
      </div>

      {/* ── Email modal ── */}
      {emailTarget && (
        <EmailMPModal
          issue={emailTarget}
          open={!!emailTarget}
          onOpenChange={(open) => {
            if (!open) {
              setEmailTarget(null)
              toast('Email copied — send it to your MP to take action', 'success')
            }
          }}
        />
      )}
    </div>
  )
}
