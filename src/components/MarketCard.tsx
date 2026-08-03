'use client'

import { useState } from 'react'
import { Activity, Bot, Clock3, GitCompare, Newspaper, Users } from 'lucide-react'
import { SimulateThisButton } from '@/components/simulator/SimulateThisButton'
import { useCountdown } from '@/hooks/useCountdown'
import type { LiveElectionSnapshot } from '@/lib/aec-election-types'
import type { MarketCategory, MarketTimelineImpact, PredictionMarket } from '@/lib/mock-market-data'
import { getMarketEligibility } from '@/lib/market-eligibility'

export const CATEGORY_LABELS: Record<MarketCategory, string> = {
  bill: 'BILL',
  civic: 'CIVIC',
  election: 'ELEC',
  'mp-vote': 'MP',
}

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

function MarketCountdownBadge({ resolvesBy }: { resolvesBy: string }) {
  const parsed = new Date(resolvesBy)
  const isExact = !isNaN(parsed.getTime())
  const countdown = useCountdown(isExact ? parsed : null)

  if (!isExact || !countdown.isClosingSoon) return null

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[9px] tracking-widest uppercase"
      style={{
        color: countdown.isUrgent ? '#f04747' : '#f5a623',
        background: countdown.isUrgent ? '#f0474712' : '#f5a62312',
        border: `1px solid ${countdown.isUrgent ? '#f0474730' : '#f5a62330'}`,
      }}
    >
      <Clock3 size={10} />
      {countdown.label}
    </span>
  )
}

function ProbabilityBars({ probability }: { probability: number }) {
  const yes = Math.max(0, Math.min(100, probability))
  const no = 100 - yes

  return (
    <div className="space-y-1.5">
      <div className="flex h-2 overflow-hidden rounded-full bg-secondary">
        <div className="bg-[#2ec266]" style={{ width: `${yes}%` }} />
        <div className="bg-[#f04747]" style={{ width: `${no}%` }} />
      </div>
      <div className="flex justify-between font-mono text-[9px] tracking-widest uppercase text-muted-foreground">
        <span>Yes {yes}%</span>
        <span>No {no}%</span>
      </div>
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

function electionSignalFor(market: PredictionMarket, liveElection: LiveElectionSnapshot) {
  if (market.category !== 'election' || !liveElection.active) return []

  return [
    liveElection.national.leadingParty
      ? `${liveElection.national.leadingParty} leading in ${liveElection.national.calledSeats + liveElection.national.leadingSeats} seats`
      : null,
    liveElection.national.reportingProgressPct !== null
      ? `${liveElection.national.reportingProgressPct}% counted`
      : null,
    'AEC live signal',
  ].filter((line): line is string => Boolean(line))
}

export function MarketCard({
  market,
  hasPosition,
  onStake,
  liveElection,
}: {
  market: PredictionMarket
  hasPosition: boolean
  onStake: (market: PredictionMarket, direction: 'yes' | 'no') => void
  liveElection: LiveElectionSnapshot
}) {
  const { isResolved: resolved, isResolvedYes: resolvedY, isDemo, isVoided } = getMarketEligibility(market)
  const color = probColor(market.probability)
  const cColor = changeColor(market.priceChange)
  const sign = market.priceChange > 0 ? '+' : ''
  const catColor = CATEGORY_COLORS[market.category] ?? '#5a5a5e'
  const catLabel = CATEGORY_LABELS[market.category] ?? market.category
  const electionSignal = electionSignalFor(market, liveElection)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[0_18px_50px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="relative">
        <MarketThumbnail market={market} className="aspect-[16/9]" />
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase backdrop-blur"
            style={{ color: catColor, background: '#0a0a0bcc', border: `1px solid ${catColor}45` }}
          >
            {catLabel}
          </span>
          <span className="rounded-full border border-white/10 bg-black/55 px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase text-foreground/80 backdrop-blur">
            {market.topic}
          </span>
        </div>
        {hasPosition && !resolved && (
          <span className="absolute right-3 top-3 rounded-full border border-[#f5a62330] bg-[#0a0a0bcc] px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase text-[#f5a623] backdrop-blur">
            Staked
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Resolves {market.resolvesBy}
            </p>
            <h3 className="text-[15px] font-medium leading-snug text-foreground">{market.question}</h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-2xl leading-none" style={{ color }}>
              {market.probability}%
            </p>
            <p className="mt-1 font-mono text-[9px] tracking-widest uppercase text-muted-foreground">YES</p>
          </div>
        </div>

        {electionSignal.length > 0 && (
          <div className="mb-3 rounded-md border border-[#3b82f630] bg-[#3b82f610] px-3 py-2">
            {electionSignal.map(line => (
              <p key={line} className="font-mono text-[10px] leading-relaxed text-muted-foreground/80">
                {line}
              </p>
            ))}
          </div>
        )}

        <ProbabilityBars probability={market.probability} />

        <div className="mt-3">
          <ProbabilityHistoryChart history={market.history} color={color} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity size={14} />
            <div>
              <p className="font-mono text-[9px] tracking-widest uppercase">24h</p>
              <p className="font-mono text-xs" style={{ color: cColor }}>
                {sign}{market.priceChange.toFixed(1)}pp
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users size={14} />
            <div>
              <p className="font-mono text-[9px] tracking-widest uppercase">Volume</p>
              <p className="font-mono text-xs text-foreground">{market.participants.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {!resolved && <MarketCountdownBadge resolvesBy={market.resolvesBy} />}
          {isDemo && (
            <span
              className="rounded-full px-2 py-1 font-mono text-[9px] tracking-widest uppercase"
              style={{ color: '#f5a623', background: '#f5a62312', border: '1px solid #f5a62330' }}
              title="Not backed by a verified, currently-open market — staking is disabled until it is."
            >
              Demo — not tradeable
            </span>
          )}
          {isVoided && (
            <span
              className="rounded-full px-2 py-1 font-mono text-[9px] tracking-widest uppercase"
              style={{ color: '#5a5a5e', background: '#5a5a5e12', border: '1px solid #5a5a5e30' }}
            >
              Voided — refunded
            </span>
          )}
          {resolved && !isDemo && !isVoided && (
            <span
              className="rounded-full px-2 py-1 font-mono text-[9px] tracking-widest uppercase"
              style={{
                color: resolvedY ? '#2ec266' : '#f04747',
                background: resolvedY ? '#2ec26612' : '#f0474712',
                border: `1px solid ${resolvedY ? '#2ec26630' : '#f0474730'}`,
              }}
            >
              {resolvedY ? 'Resolved Yes' : 'Resolved No'}
            </span>
          )}
        </div>

        <div className="mt-3 space-y-3">
          <MarketNewsTimeline market={market} />
          <BullBearCase market={market} />
          <SimulatorComparison market={market} />
        </div>

        <div className="mt-auto pt-4">
          {!resolved && (
            <SimulateThisButton
              size="sm"
              className="mb-3 w-full justify-center rounded-md py-2"
              entity={{
                type: 'market',
                id: market.id,
                title: market.question,
                summary: `Resolves ${market.resolvesBy}. Current market: ${market.probability}% YES.`,
              }}
            />
          )}

          {resolved ? (
            <div className="rounded-md border border-border bg-secondary/50 py-2 text-center font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              {isDemo ? 'Not tradeable' : 'Closed'}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onStake(market, 'yes')}
                className="rounded-md border border-[#2ec26640] bg-[#2ec26612] px-3 py-2.5 font-mono text-[10px] tracking-widest text-[#2ec266] uppercase transition-colors hover:bg-[#2ec26622]"
              >
                Yes
              </button>
              <button
                onClick={() => onStake(market, 'no')}
                className="rounded-md border border-[#f0474740] bg-[#f0474712] px-3 py-2.5 font-mono text-[10px] tracking-widest text-[#f04747] uppercase transition-colors hover:bg-[#f0474722]"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
