'use client'

/**
 * PillarScoreboard — Australia's Report Card
 *
 * Level 1 view: 5 traffic-light cards, each expandable to Level 2.
 * Sidebar: Civic Insights strip (biggest improvement / decline / fastest changing).
 *
 * This is the "5-second understanding" layer of Stickee.
 * A new user sees: 5 pillar names + traffic lights + one-liner headline.
 * A power user clicks any card → sub-metrics + sparklines + methodology.
 */

import { BarChart2, TrendingDown, TrendingUp, Zap, CheckCircle2 } from 'lucide-react'
import { CIVIC_PILLARS, CIVIC_INSIGHTS } from '@/lib/mock-civic-data'
import { PillarCard } from '@/components/PillarCard'
import type { CivicInsight, CivicStatus } from '@/types/civic'

// ─── Overall National Score ───────────────────────────────────────────────────

function overallScore(scores: number[]): number {
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

function overallStatusLabel(score: number): { label: string; color: string } {
  if (score >= 65) return { label: 'Tracking well', color: 'text-emerald-400' }
  if (score >= 45) return { label: 'Mixed results', color: 'text-amber-400' }
  return { label: 'Needs attention', color: 'text-red-400' }
}

// ─── Insights Strip ───────────────────────────────────────────────────────────

const INSIGHT_ICONS: Record<CivicInsight['type'], React.ElementType> = {
  'biggest-improvement': TrendingUp,
  'biggest-decline':     TrendingDown,
  'fastest-changing':    Zap,
  'trending':            BarChart2,
}

const INSIGHT_LABELS: Record<CivicInsight['type'], string> = {
  'biggest-improvement': 'Biggest Improvement',
  'biggest-decline':     'Biggest Decline',
  'fastest-changing':    'Fastest Moving',
  'trending':            'Watch',
}

const INSIGHT_STATUS_COLOR: Record<CivicStatus, string> = {
  green:  'text-emerald-400',
  yellow: 'text-amber-400',
  red:    'text-red-400',
}

function InsightChip({ insight }: { insight: CivicInsight }) {
  const Icon = INSIGHT_ICONS[insight.type]
  const sign = insight.trendPercent > 0 ? '+' : ''
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card/60 px-3.5 py-2.5 min-w-0">
      <Icon className={`h-4 w-4 flex-shrink-0 ${INSIGHT_STATUS_COLOR[insight.status]}`} />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">
          {INSIGHT_LABELS[insight.type]}
        </p>
        <p className="text-sm font-medium text-foreground truncate">{insight.label}</p>
      </div>
      <span className={`ml-auto text-xs font-mono font-semibold flex-shrink-0 ${INSIGHT_STATUS_COLOR[insight.status]}`}>
        {sign}{insight.trendPercent.toFixed(1)}%
      </span>
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      {[
        { dot: 'bg-emerald-500', label: 'Improving' },
        { dot: 'bg-amber-400',  label: 'Stable' },
        { dot: 'bg-red-500',    label: 'Worsening' },
      ].map(({ dot, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${dot}`} />
          {label}
        </div>
      ))}
      <span className="ml-auto hidden sm:inline">Click any card to drill down →</span>
    </div>
  )
}

// ─── PillarScoreboard ─────────────────────────────────────────────────────────

export function PillarScoreboard({ showGrade = false }: { showGrade?: boolean }) {
  const pillars = CIVIC_PILLARS
  const score = overallScore(pillars.map(p => p.civicScore))
  const { label: statusLabel, color: statusColor } = overallStatusLabel(score)
  const redCount  = pillars.filter(p => p.status === 'red').length
  const greenCount = pillars.filter(p => p.status === 'green').length

  return (
    <section className="space-y-5">
      {/* Section header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <div className="h-4 w-0.5 rounded-full bg-primary/60" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Australia&apos;s Report Card
            </h2>
          </div>
          <p className="pl-[22px] text-xs text-muted-foreground">
            5 pillars · {pillars.reduce((s, p) => s + p.metrics.length, 0)} indicators · Updated Mar 2025
          </p>
        </div>

        {/* Overall national score */}
        <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">National Civic Score</p>
            <p className={`text-2xl font-bold tabular-nums ${statusColor}`}>{score}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
          </div>
          <div className="h-10 w-px bg-border/60" />
          <div className="text-right">
            <p className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</p>
            <p className="text-xs text-muted-foreground">{redCount} pillar{redCount !== 1 ? 's' : ''} worsening</p>
          </div>
        </div>
      </div>

      {/* Insights strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CIVIC_INSIGHTS.map(insight => (
          <InsightChip key={insight.metricId} insight={insight} />
        ))}
      </div>

      {/* Legend */}
      <Legend />

      {/* 5 Pillar cards */}
      <div className="space-y-2">
        {pillars.map(pillar => (
          <PillarCard key={pillar.id} pillar={pillar} showGrade={showGrade} />
        ))}
      </div>

      {/* Green count footer */}
      {greenCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pl-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          {greenCount} pillar{greenCount !== 1 ? 's' : ''} improving — {pillars.filter(p => p.status === 'green').map(p => p.label).join(', ')}
        </div>
      )}
    </section>
  )
}
