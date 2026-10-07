'use client'

import { useState } from 'react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import type { CivicPillar, CivicMetric, CivicStatus } from '@/types/civic'
import { scoreToGrade } from '@/lib/civic-utils'

// ─── Colour helpers ───────────────────────────────────────────────────────────

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
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="opacity-60">
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

// ─── Trend badge ──────────────────────────────────────────────────────────────

function TrendBadge({ pct, positiveWhenUp }: { pct: number; positiveWhenUp: boolean }) {
  const isGood    = positiveWhenUp ? pct > 0 : pct < 0
  const isNeutral = Math.abs(pct) < 0.5
  const color     = isNeutral ? '#5a5a5e' : isGood ? '#2ec266' : '#f04747'
  const Icon      = isNeutral ? Minus : pct > 0 ? ArrowUpRight : ArrowDownRight
  const sign      = pct > 0 ? '+' : ''
  return (
    <span className="inline-flex items-center gap-0.5 font-mono text-xs" style={{ color }}>
      <Icon className="h-3 w-3" />
      {sign}{Math.abs(pct).toFixed(1)}%
    </span>
  )
}

// ─── Metric row ───────────────────────────────────────────────────────────────

function MetricRow({ metric }: { metric: CivicMetric }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: STATUS_COLOR[metric.status] }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground truncate">{metric.label}</p>
        <p className="font-mono text-[11px] text-muted-foreground truncate hidden sm:block">{metric.insight}</p>
      </div>
      <div className="shrink-0 hidden sm:block">
        <Sparkline data={metric.timeSeries.map(p => p.value)} status={metric.status} />
      </div>
      <div className="shrink-0 text-right">
        <TrendBadge pct={metric.trendPercent} positiveWhenUp={metric.positiveWhenUp} />
        <p className="font-mono text-[11px] text-muted-foreground mt-0.5">
          {metric.value.toFixed(1)}{metric.unit}
        </p>
      </div>
    </div>
  )
}

// ─── PillarCard ───────────────────────────────────────────────────────────────

interface PillarCardProps {
  pillar: CivicPillar
  showGrade?: boolean
}

export function PillarCard({ pillar, showGrade = false }: PillarCardProps) {
  const [expanded, setExpanded] = useState(false)
  const g  = scoreToGrade(pillar.civicScore)
  const gs = gradeStyle(g)
  const isImproving = pillar.trendDirection === 'improving'
  const isWorsening = pillar.trendDirection === 'worsening'
  const trendColor  = isImproving ? '#2ec266' : isWorsening ? '#f04747' : '#5a5a5e'
  const trendLabel  = isImproving ? '↑ improving' : isWorsening ? '↓ declining' : '→ stable'

  return (
    <div id={pillar.id} className="border-b border-border scroll-mt-24">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 py-4 px-1 text-left hover:bg-card/30 transition-colors"
      >
        {showGrade ? (
          <span
            className="font-mono text-xs font-medium px-2 py-0.5 border shrink-0 min-w-[28px] text-center"
            style={gs}
          >
            {g}
          </span>
        ) : (
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: STATUS_COLOR[pillar.status] }}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">{pillar.label}</div>
          <div className="font-mono text-[11px] text-muted-foreground mt-0.5 truncate hidden sm:block">
            {pillar.headline}
          </div>
        </div>

        <div className="w-20 hidden md:block shrink-0">
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

      {expanded && (
        <div className="px-1 pb-6">
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
            {pillar.metrics.length} indicators
          </p>
          {pillar.metrics.map(m => (
            <MetricRow key={m.id} metric={m} />
          ))}
        </div>
      )}
    </div>
  )
}
