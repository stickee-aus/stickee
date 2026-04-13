import type { Metadata } from 'next'
import { CIVIC_PILLARS } from '@/lib/mock-civic-data'
import { nationalCivicScore, scoreToGrade } from '@/lib/civic-utils'
import { TickerBar } from '@/components/TickerBar'
import { IssueAccordion } from '@/components/IssueAccordion'

export const metadata: Metadata = {
  title: 'Stickee — Australia\'s Civic Intelligence Platform',
  description: 'Track how well Australia\'s government is performing across housing, cost of living, jobs, crime, and the future. Real-time civic scores, bills, and community action.',
  openGraph: {
    title: 'Stickee — Australia\'s Civic Intelligence Platform',
    description: 'Track government performance across 5 civic pillars. Real-time scores, live bills, and community action.',
    type: 'website',
  },
}

const score = nationalCivicScore(CIVIC_PILLARS)
const grade = scoreToGrade(score)

const improvingCount = CIVIC_PILLARS.filter(p => p.trendDirection === 'improving').length

// GDP growth metric for the stats bar
const gdpPillar  = CIVIC_PILLARS.find(p => p.id === 'jobs-economy')
const gdpMetric  = gdpPillar?.metrics.find(m => m.id === 'gdp-growth')
const gdpValue   = gdpMetric
  ? `${gdpMetric.trendPercent > 0 ? '+' : ''}${gdpMetric.trendPercent}%`
  : '–'
const gdpPositive = (gdpMetric?.trendPercent ?? 0) > 0

// Score delta (average trend across all pillars)
const avgTrend        = CIVIC_PILLARS.reduce((s, p) => s + p.trendPercent, 0) / CIVIC_PILLARS.length
const scoreDelta      = `${avgTrend > 0 ? '+' : ''}${avgTrend.toFixed(1)}`
const scoreDeltaPositive = avgTrend > 0

const now         = new Date()
const updateLabel = now.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })

export default function HomePage() {
  return (
    <div>
      {/* ── Ticker ──────────────────────────────────────────────────────────── */}
      <TickerBar pillars={CIVIC_PILLARS} />

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="border-b border-border px-6 py-10">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row md:items-end md:justify-between gap-8">

          {/* Left: score */}
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Australia · Civic Score
            </p>

            <div className="flex items-baseline gap-3 mb-2">
              <span
                className="font-mono font-normal leading-none text-foreground"
                style={{ fontSize: 'clamp(52px, 10vw, 72px)', letterSpacing: '-0.02em' }}
              >
                {score}
              </span>
              <span className="font-mono text-2xl text-muted-foreground/40 font-normal">/100</span>
              <span
                className="font-mono text-xs font-medium px-2 py-1 border"
                style={{
                  color:        grade === 'A' || grade === 'B' ? '#2ec266' : grade === 'C' ? '#f5a623' : '#f04747',
                  borderColor:  grade === 'A' || grade === 'B' ? '#0e3020' : grade === 'C' ? '#3a2e10' : '#3a1414',
                  background:   'transparent',
                  letterSpacing: '0.1em',
                }}
              >
                {grade}
              </span>
            </div>

            <p className="font-mono text-xs text-muted-foreground" style={{ letterSpacing: '0.03em' }}>
              <span style={{ color: '#2ec266' }}>{improvingCount} of 5 areas improving</span>
              {' '}·{' '}Updated {updateLabel}
            </p>
          </div>

          {/* Right: stats */}
          <div className="flex items-end gap-6 md:gap-8 pb-1">
            <div className="text-right">
              <p
                className="font-mono text-xl font-normal mb-1"
                style={{ color: gdpPositive ? '#2ec266' : '#f04747' }}
              >
                {gdpValue}
              </p>
              <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
                GDP Growth
              </p>
            </div>

            <div className="w-px h-10 bg-border" />

            <div className="text-right">
              <p
                className="font-mono text-xl font-normal mb-1"
                style={{ color: scoreDeltaPositive ? '#2ec266' : '#f04747' }}
              >
                {scoreDelta}
              </p>
              <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
                Score Δ 30d
              </p>
            </div>

            <div className="w-px h-10 bg-border" />

            <div className="text-right">
              <p className="font-mono text-xl font-normal mb-1 text-foreground">
                {improvingCount}/5
              </p>
              <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
                Improving
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Issue Breakdown ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between py-5 border-b border-border">
            <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              5 Civic Pillars · Click to drill down
            </span>
            <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Grade · Trend · Score
            </span>
          </div>

          <IssueAccordion />
        </div>
      </section>
    </div>
  )
}
