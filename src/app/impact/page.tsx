import { PillarScoreboard } from '@/components/PillarScoreboard'
import { CivicScorecard } from '@/components/CivicScorecard'
import { CIVIC_PILLARS } from '@/lib/mock-civic-data'

function overallScore(scores: number[]) {
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

function statusLabel(score: number) {
  if (score >= 65) return { label: 'Tracking well', color: 'text-emerald-400' }
  if (score >= 45) return { label: 'Mixed results', color: 'text-amber-400' }
  return { label: 'Needs attention', color: 'text-red-400' }
}

export default function ImpactPage() {
  const score = overallScore(CIVIC_PILLARS.map(p => p.civicScore))
  const { label, color } = statusLabel(score)

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-10">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Impact</h1>
          <p className="text-sm text-muted-foreground">
            Australia&apos;s live report card — 5 civic pillars, real metrics, updated monthly.
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-3 text-right">
          <p className="text-xs text-muted-foreground mb-0.5">National Civic Score</p>
          <p className={`text-2xl font-bold tabular-nums ${color}`}>
            {score}<span className="text-sm font-normal text-muted-foreground">/100</span>
          </p>
          <p className={`text-xs font-medium ${color}`}>{label}</p>
        </div>
      </div>

      {/* Pillar scoreboard */}
      <PillarScoreboard />

      {/* Politician scorecards */}
      <CivicScorecard />

    </div>
  )
}
