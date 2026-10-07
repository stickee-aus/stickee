'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bot, GitCompare, Newspaper } from 'lucide-react'
import { RecordRow } from '@/components/ui/record-row'
import { StatusLabel, type Status } from '@/components/ui/status-label'
import type { MarketCategory, MarketTimelineImpact, PredictionMarket } from '@/lib/mock-market-data'
import { getMarketEligibility } from '@/lib/market-eligibility'

export const CATEGORY_LABELS: Record<MarketCategory, string> = {
  bill: 'Bill',
  civic: 'Civic',
  election: 'Election',
  'mp-vote': 'MP Vote',
}

function statusFor(market: PredictionMarket): Status {
  const { isDemo, isVoided, isResolved } = getMarketEligibility(market)
  if (isDemo) return 'demo'
  if (isVoided) return 'voided'
  if (isResolved) return 'resolved'
  return 'active'
}

/** One sentence max, so a sourced summary never dominates a list row. */
function firstSentence(text: string, maxLength = 140): string {
  const match = text.match(/^[^.!?]*[.!?]/)
  const candidate = (match ? match[0] : text).trim()
  return candidate.length > maxLength ? `${candidate.slice(0, maxLength - 1).trimEnd()}…` : candidate
}

export function MarketCard({
  market,
  hasPosition,
  onStake,
  whyThisMatters,
}: {
  market: PredictionMarket
  hasPosition: boolean
  onStake: (market: PredictionMarket, direction: 'yes' | 'no') => void
  /** Real, sourced issue summary — only ever passed for a bill market with one. Never generated. */
  whyThisMatters?: string
}) {
  const { canStake, isResolved, isResolvedYes, isDemo, isVoided } = getMarketEligibility(market)
  const meta = [
    CATEGORY_LABELS[market.category] ?? market.category,
    `Resolves ${market.resolvesBy}`,
    isResolved && market.resolutionSource ? `Resolution source: ${market.resolutionSource}` : null,
  ].filter(Boolean).join(' · ')
  const settledLabel = isResolved && !isDemo && !isVoided ? (isResolvedYes ? 'Resolved Yes' : 'Resolved No') : undefined

  return (
    <RecordRow
      label={market.question}
      summary={whyThisMatters ? `Why this matters: ${firstSentence(whyThisMatters)}` : undefined}
      meta={meta}
      value={`${market.probability}%`}
      status={
        <div className="flex flex-col items-end gap-2">
          <StatusLabel status={statusFor(market)} label={settledLabel} />
          {canStake && (
            <div className="flex items-center gap-2">
              {hasPosition && <span className="text-micro-label">Staked</span>}
              <button
                type="button"
                onClick={() => onStake(market, 'yes')}
                className="transition-calm rounded-[var(--radius-sm)] border border-[var(--status-positive)] px-2.5 py-1 text-micro-label text-[var(--status-positive)] hover:bg-[var(--status-positive)]/10"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => onStake(market, 'no')}
                className="transition-calm rounded-[var(--radius-sm)] border border-[var(--status-negative)] px-2.5 py-1 text-micro-label text-[var(--status-negative)] hover:bg-[var(--status-negative)]/10"
              >
                No
              </button>
            </div>
          )}
          {market.category === 'bill' && (
            <Link href={`/issue/${market.id}`} className="text-micro-label text-muted-foreground hover:text-foreground">
              See issue →
            </Link>
          )}
        </div>
      }
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Legacy subcomponents — kept only because FeaturedMarketCard.tsx (a
// pre-existing tracked file with its own uncommitted changes, currently
// unrendered anywhere in the app as of the Forecasts V1 simplification
// batch — see FORECASTS_V1_SIMPLIFICATION_REPORT.md) still imports them.
// None of these are used by MarketCard above. Do not extend or fix bugs in
// this block for FeaturedMarketCard's benefit — if FeaturedMarketCard is
// ever deleted, delete this block with it.
// ─────────────────────────────────────────────────────────────────────────

export const CATEGORY_COLORS: Record<MarketCategory, string> = {
  bill: '#6b7280',
  civic: '#f5a623',
  election: '#3b82f6',
  'mp-vote': '#a855f7',
}

export function probColor(p: number): string {
  if (p >= 60) return '#2ec266'
  if (p >= 45) return '#f5a623'
  return '#f04747'
}

export function changeColor(c: number): string {
  if (c > 0) return '#2ec266'
  if (c < 0) return '#f04747'
  return '#5a5a5e'
}

export function MarketThumbnail({
  market,
  className = '',
}: {
  market: Pick<PredictionMarket, 'category' | 'topic' | 'imageUrl' | 'imageAlt'>
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const catColor = CATEGORY_COLORS[market.category] ?? '#5a5a5e'

  return (
    <div
      className={`relative overflow-hidden bg-secondary ${className}`}
      style={{
        background:
          failed || !market.imageUrl
            ? `linear-gradient(135deg, ${catColor}30 0%, #111113 46%, #0a0a0b 100%)`
            : '#111113',
      }}
    >
      {!failed && market.imageUrl && (
        // Legacy remote URLs are not constrained to configured Next.js image hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={market.imageUrl}
          alt={market.imageAlt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10" />
      {(failed || !market.imageUrl) && (
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
          <span className="font-mono text-[10px] tracking-widest uppercase text-foreground/70">
            {market.topic}
          </span>
        </div>
      )}
    </div>
  )
}

export function ProbabilityHistoryChart({
  history,
  color = '#2ec266',
  height = 72,
}: {
  history?: number[]
  color?: string
  height?: number
}) {
  const points = history && history.length > 1 ? history : [50, 50]
  const min = Math.min(...points, 0)
  const max = Math.max(...points, 100)
  const range = max - min || 1
  const width = 240
  const pad = 8
  const path = points.map((value, index) => {
    const x = pad + (index / (points.length - 1 || 1)) * (width - pad * 2)
    const y = pad + (1 - (value - min) / range) * (height - pad * 2)
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
  const areaPath = `${path} L ${width - pad} ${height - pad} L ${pad} ${height - pad} Z`

  return (
    <div className="rounded-md border border-border bg-secondary/25 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">14d probability</span>
        <span className="font-mono text-[10px] text-foreground">
          {points[0]}%{' -> '}{points[points.length - 1]}%
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[72px] w-full overflow-visible">
        <path d={areaPath} fill={color} opacity="0.12" />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} stroke="#1e1e20" strokeWidth="1" />
      </svg>
    </div>
  )
}

function impactColor(impact: MarketTimelineImpact) {
  if (impact === 'up') return '#2ec266'
  if (impact === 'down') return '#f04747'
  return '#5a5a5e'
}

export function MarketNewsTimeline({ market }: { market: PredictionMarket }) {
  const events = market.newsTimeline ?? []
  if (events.length === 0) return null

  return (
    <div className="rounded-md border border-border bg-secondary/20 p-3">
      <div className="mb-3 flex items-center gap-2">
        <Newspaper size={13} className="text-muted-foreground" />
        <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Why it moved</span>
      </div>
      <div className="space-y-3">
        {events.map(event => (
          <div key={`${event.date}-${event.label}`} className="grid grid-cols-[54px_1fr] gap-3">
            <span className="font-mono text-[9px] leading-relaxed text-muted-foreground">{event.date}</span>
            <div className="border-l border-border pl-3">
              <div className="mb-0.5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: impactColor(event.impact) }} />
                <span className="font-mono text-[9px] tracking-widest uppercase text-foreground/80">{event.label}</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{event.summary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BullBearCase({ market }: { market: PredictionMarket }) {
  if (!market.bullCase && !market.bearCase) return null

  return (
    <div className="rounded-md border border-border bg-secondary/20 p-3">
      <div className="mb-3 flex items-center gap-2">
        <Bot size={13} className="text-muted-foreground" />
        <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">AI bull / bear case</span>
      </div>
      <div className="grid gap-2">
        <div className="rounded-md border border-[#2ec26626] bg-[#2ec2660d] p-3">
          <p className="mb-1 font-mono text-[9px] tracking-widest uppercase text-[#2ec266]">Bull case</p>
          <p className="text-xs leading-relaxed text-foreground/75">{market.bullCase ?? 'YES strengthens if the next verified signal confirms the market thesis.'}</p>
        </div>
        <div className="rounded-md border border-[#f0474726] bg-[#f047470d] p-3">
          <p className="mb-1 font-mono text-[9px] tracking-widest uppercase text-[#f04747]">Bear case</p>
          <p className="text-xs leading-relaxed text-foreground/75">{market.bearCase ?? 'NO gains if implementation stalls or fresh evidence undercuts the current probability.'}</p>
        </div>
      </div>
    </div>
  )
}

export function SimulatorComparison({ market }: { market: PredictionMarket }) {
  const comparison = market.simulatorComparison
  if (!comparison) return null

  return (
    <div className="rounded-md border border-[#2ec26624] bg-[#041008] p-3">
      <div className="mb-3 flex items-center gap-2">
        <GitCompare size={13} className="text-[#2ec266]" />
        <span className="font-mono text-[9px] tracking-widest uppercase text-[#2ec266]">What happens next</span>
      </div>
      <div className="grid gap-2">
        <div className="grid grid-cols-[34px_1fr] gap-2">
          <span className="font-mono text-[9px] tracking-widest uppercase text-[#2ec266]">Yes</span>
          <p className="text-xs leading-relaxed text-foreground/75">{comparison.yes}</p>
        </div>
        <div className="grid grid-cols-[34px_1fr] gap-2">
          <span className="font-mono text-[9px] tracking-widest uppercase text-[#f04747]">No</span>
          <p className="text-xs leading-relaxed text-foreground/75">{comparison.no}</p>
        </div>
        <p className="border-t border-[#2ec2661f] pt-2 text-xs leading-relaxed text-muted-foreground">
          {comparison.next}
        </p>
      </div>
    </div>
  )
}
