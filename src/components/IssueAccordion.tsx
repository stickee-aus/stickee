'use client'

import { useState, useMemo } from 'react'
import { Mail } from 'lucide-react'
import { CIVIC_PILLARS, POLITICIAN_SCORECARDS } from '@/lib/mock-civic-data'
import { DECISIONS, DECISION_MAKER_INDEX } from '@/lib/mock-government-data'
import { MPs } from '@/lib/mock-data'
import { scoreToGrade } from '@/lib/civic-utils'
import { EmailMPModal } from '@/components/EmailMPModal'
import type { CivicPillar, CivicMetric, CivicStatus } from '@/types/civic'
import type { Issue } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const mpIndex = Object.fromEntries(MPs.map(m => [m.id, m]))

const PILLAR_TAGS: Record<string, string[]> = {
  'cost-of-living': ['cost-of-living', 'energy', 'rebate', 'medicine', 'healthcare', 'medicare', 'bulk-billing', 'aged-care'],
  'housing':        ['housing', 'social-housing', 'affordability', 'planning', 'rezoning', 'homelessness', 'affordable'],
  'crime-safety':   ['crime', 'police', 'safety', 'justice'],
  'jobs-economy':   ['economy', 'manufacturing', 'investment', 'skills', 'training', 'tafe', 'hecs', 'student-debt', 'university'],
  'future':         ['clean-energy', 'nuclear', 'environment', 'infrastructure', 'transport', 'rail', 'metro', 'cycling', 'parks', 'olympics', 'gas'],
}

const PARTY_SHORT: Record<string, string> = {
  'Australian Labor Party': 'ALP',
  'Liberal Party':          'LIB',
  'National Party':         'NAT',
  'Australian Greens':      'GRN',
  'Independent':            'IND',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pillarToIssue(pillar: CivicPillar): Issue {
  return {
    id: pillar.id,
    title: pillar.label,
    summary: pillar.summary,
    content: pillar.headline,
    whatIsHappening: pillar.summary,
    whoSupports: 'Consumer advocacy groups, unions, and policy experts.',
    whoOpposes: 'Those opposed to increased government intervention.',
    status: 'active',
  }
}

function decisionsForPillar(pillarId: string) {
  const tags = PILLAR_TAGS[pillarId] ?? []
  return DECISIONS
    .filter(d => d.tags.some(t => tags.includes(t)))
    .slice(0, 3)
}

const STATUS_COLOR: Record<CivicStatus, string> = {
  green:  '#2ec266',
  yellow: '#f5a623',
  red:    '#f04747',
}

function gradeStyle(g: string) {
  if (g === 'A' || g === 'B') return { color: '#2ec266', borderColor: '#0e3020', background: '#041008' }
  if (g === 'C')              return { color: '#f5a623', borderColor: '#3a2e10', background: '#1e1800' }
  return                             { color: '#f04747', borderColor: '#3a1414', background: '#1e0a0a' }
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, status }: { data: number[]; status: CivicStatus }) {
  if (data.length < 2) return null
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const W = 64, H = 20, pad = 1
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2)
    const y = pad + (1 - (v - min) / range) * (H - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="opacity-70">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={STATUS_COLOR[status]}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Metric Row ───────────────────────────────────────────────────────────────

function MetricRow({ metric }: { metric: CivicMetric }) {
  const sign = metric.trendPercent > 0 ? '+' : ''
  const trendGood =
    metric.positiveWhenUp ? metric.trendPercent > 0 : metric.trendPercent < 0
  const trendColor = Math.abs(metric.trendPercent) < 0.5
    ? '#5a5a5e'
    : trendGood ? '#2ec266' : '#f04747'

  return (
    <tr className="border-b border-border group">
      <td className="py-3 pr-3 w-3">
        <div
          className="h-2 w-2 rounded-full"
          style={{ background: STATUS_COLOR[metric.status] }}
        />
      </td>
      <td className="py-3 pr-4">
        <div className="text-sm text-foreground">{metric.label}</div>
        <div className="font-mono text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
          {metric.insight}
        </div>
      </td>
      <td className="py-3 pr-4 hidden md:table-cell">
        <Sparkline data={metric.timeSeries.map(p => p.value)} status={metric.status} />
      </td>
      <td className="py-3 text-right whitespace-nowrap">
        <span className="font-mono text-xs" style={{ color: trendColor }}>
          {sign}{metric.trendPercent.toFixed(1)}%
        </span>
        <div className="font-mono text-[11px] text-muted-foreground">
          {metric.value.toFixed(1)}{metric.unit}
        </div>
      </td>
    </tr>
  )
}

// ─── Decision Row ─────────────────────────────────────────────────────────────

function DecisionRow({ decision }: { decision: (typeof DECISIONS)[number] }) {
  const maker = DECISION_MAKER_INDEX[decision.decisionMakerId]
  const isImplemented = decision.status === 'Implemented' || decision.status === 'Passed'
  const isRejected    = decision.status === 'Rejected'

  return (
    <tr className="border-b border-border hover:bg-card/40 transition-colors">
      <td className="py-3 pr-4">
        <div className="text-sm font-medium text-foreground">{decision.title}</div>
        <div className="font-mono text-[11px] text-muted-foreground mt-0.5">{decision.affectsScope}</div>
      </td>
      <td className="py-3 pr-4 hidden sm:table-cell">
        <div className="font-mono text-xs text-muted-foreground">{maker?.name ?? '—'}</div>
      </td>
      <td className="py-3 text-right whitespace-nowrap">
        <span
          className="font-mono text-[10px] tracking-wider uppercase px-1.5 py-0.5"
          style={{
            color:      isImplemented ? '#2ec266' : isRejected ? '#f04747' : '#f5a623',
            border:     `1px solid ${isImplemented ? '#0e3020' : isRejected ? '#3a1414' : '#3a2e10'}`,
            background: isImplemented ? '#041008' : isRejected ? '#1e0a0a' : '#1e1800',
          }}
        >
          {decision.status}
        </span>
      </td>
    </tr>
  )
}

// ─── Politician Rating Row ────────────────────────────────────────────────────

function PoliticianRatingRow({
  scorecard,
  pillarId,
}: {
  scorecard: (typeof POLITICIAN_SCORECARDS)[number]
  pillarId: string
}) {
  const rating = scorecard.pillarRatings.find(r => r.pillarId === pillarId)
  if (!rating) return null

  const mp = mpIndex[scorecard.mpId]
  const displayName = mp?.name ?? scorecard.mpId
  const initials = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('')
  const partyFull = mp?.party ?? ''
  const party = PARTY_SHORT[partyFull] ?? partyFull.slice(0, 3).toUpperCase()

  const scoreColor =
    rating.score >= 65 ? '#2ec266' : rating.score >= 45 ? '#f5a623' : '#f04747'

  return (
    <tr className="border-b border-border">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center font-mono text-[10px] font-medium shrink-0"
            style={{ background: '#1e1e20', color: '#5a5a5e' }}
          >
            {initials}
          </div>
          <div>
            <div className="text-sm text-foreground">{displayName}</div>
            <div className="font-mono text-[10px] text-muted-foreground">{party}</div>
          </div>
        </div>
      </td>
      <td className="py-3 pr-4 hidden sm:table-cell">
        <div className="h-0.5 w-full" style={{ background: '#1e1e20', position: 'relative' }}>
          <div
            style={{
              position: 'absolute', left: 0, top: 0,
              height: '100%',
              width: `${rating.score}%`,
              background: scoreColor,
            }}
          />
        </div>
      </td>
      <td className="py-3 text-right">
        <span className="font-mono text-sm" style={{ color: scoreColor }}>
          {rating.score}<span className="text-muted-foreground text-xs">/100</span>
        </span>
      </td>
    </tr>
  )
}

// ─── Email CTA ────────────────────────────────────────────────────────────────

function EmailCTA({ pillar }: { pillar: CivicPillar }) {
  const [open, setOpen] = useState(false)
  const issue = pillarToIssue(pillar)

  return (
    <>
      <div className="flex items-center justify-between gap-4 border-t border-border pt-5 mt-2">
        <div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">
            Take Action
          </div>
          <p className="text-sm text-foreground">
            Contact your MP about {pillar.label}.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background font-mono text-xs font-medium tracking-widest uppercase hover:opacity-80 transition-opacity shrink-0"
        >
          <Mail className="h-3.5 w-3.5" />
          Email MP
        </button>
      </div>
      <EmailMPModal issue={issue} open={open} onOpenChange={setOpen} />
    </>
  )
}

// ─── Pillar Accordion Row ─────────────────────────────────────────────────────

function PillarRow({
  pillar,
  expanded,
  onToggle,
}: {
  pillar: CivicPillar
  expanded: boolean
  onToggle: () => void
}) {
  const g = scoreToGrade(pillar.civicScore)
  const gs = gradeStyle(g)
  const isImproving = pillar.trendDirection === 'improving'
  const isWorsening = pillar.trendDirection === 'worsening'
  const trendColor = isImproving ? '#2ec266' : isWorsening ? '#f04747' : '#5a5a5e'
  const trendLabel = isImproving ? '↑ improving' : isWorsening ? '↓ declining' : '→ stable'

  const decisions = useMemo(() => decisionsForPillar(pillar.id), [pillar.id])
  const politicianRatings = useMemo(
    () => POLITICIAN_SCORECARDS.filter(sc => sc.pillarRatings.some(r => r.pillarId === pillar.id)),
    [pillar.id],
  )

  return (
    <div className="border-b border-border">
      {/* ── Collapsed row ─────────────────────────────────────────────────── */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 py-4 text-left hover:bg-card/30 transition-colors px-1"
      >
        <span
          className="font-mono text-xs font-medium px-2 py-0.5 border shrink-0 min-w-[28px] text-center"
          style={gs}
        >
          {g}
        </span>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">{pillar.label}</div>
          <div className="font-mono text-[11px] text-muted-foreground mt-0.5 truncate hidden sm:block">
            {pillar.headline}
          </div>
        </div>

        <div className="w-24 hidden md:block shrink-0">
          <div className="h-px bg-border relative">
            <div
              className="absolute left-0 top-0 h-full"
              style={{ width: `${pillar.civicScore}%`, background: isWorsening ? '#3a1414' : '#3a3a3e' }}
            />
          </div>
        </div>

        <span
          className="font-mono text-xs shrink-0 w-24 text-right hidden sm:block"
          style={{ color: trendColor }}
        >
          {trendLabel}
        </span>

        <span className="font-mono text-xs text-muted-foreground shrink-0 w-4 text-center">
          {expanded ? '−' : '+'}
        </span>
      </button>

      {/* ── Expanded panel ────────────────────────────────────────────────── */}
      {expanded && (
        <div className="px-1 pb-8 space-y-8">

          {/* Metrics */}
          <div>
            <div className="flex items-center justify-between py-3 border-b border-border mb-0">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Key Metrics · {pillar.metrics.length} indicators
              </span>
            </div>
            <table className="w-full border-collapse">
              <tbody>
                {pillar.metrics.map(m => (
                  <MetricRow key={m.id} metric={m} />
                ))}
              </tbody>
            </table>
            <p className="font-mono text-[10px] text-muted-foreground mt-3">
              Green &gt;3% good / Red &gt;5% bad · Source: ABS, AER, CoreLogic, AIHW
            </p>
          </div>

          {/* Related decisions */}
          {decisions.length > 0 && (
            <div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Related Decisions
                </span>
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  {decisions.map(d => (
                    <DecisionRow key={d.id} decision={d} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Politician ratings */}
          {politicianRatings.length > 0 && (
            <div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  Politician Ratings · {pillar.label}
                </span>
              </div>
              <table className="w-full border-collapse">
                <tbody>
                  {politicianRatings.map(sc => (
                    <PoliticianRatingRow
                      key={sc.mpId}
                      scorecard={sc}
                      pillarId={pillar.id}
                    />
                  ))}
                </tbody>
              </table>
              <p className="font-mono text-[10px] text-muted-foreground mt-3">
                Based on voting records and public policy commitments
              </p>
            </div>
          )}

          {/* Email CTA */}
          <EmailCTA pillar={pillar} />
        </div>
      )}
    </div>
  )
}

// ─── Issue Accordion ─────────────────────────────────────────────────────────

export function IssueAccordion() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function toggle(id: string) {
    setExpandedId(prev => (prev === id ? null : id))
  }

  return (
    <>
      {CIVIC_PILLARS.map(pillar => (
        <PillarRow
          key={pillar.id}
          pillar={pillar}
          expanded={expandedId === pillar.id}
          onToggle={() => toggle(pillar.id)}
        />
      ))}
    </>
  )
}
