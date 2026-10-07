import { Check } from 'lucide-react'
import type { FutureLeader, LeaderSupportSummary, PathwayStage, ReadinessThreshold } from '@/types/leaders'

const STAGE_ORDER: PathwayStage[] = [
  'Community Contributor',
  'Local Council',
  'State Level',
  'Federal Level',
]

interface ProgressRowProps {
  label: string
  current: number
  target: number
}

function ProgressRow({ label, current, target }: ProgressRowProps) {
  const pct = Math.min((current / target) * 100, 100)
  const done = current >= target

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground/70 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            done ? 'bg-emerald-500' : 'bg-primary/70'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-1 w-16 justify-end shrink-0">
        {done ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : null}
        <span className={`text-[11px] tabular-nums ${done ? 'text-emerald-500' : 'text-muted-foreground/60'}`}>
          {current}/{target}
        </span>
      </div>
    </div>
  )
}

interface ReadinessProgressTrackerProps {
  leader: FutureLeader
  summary: LeaderSupportSummary
  thresholds: Record<PathwayStage, ReadinessThreshold>
}

export function ReadinessProgressTracker({
  leader,
  summary,
  thresholds,
}: ReadinessProgressTrackerProps) {
  const currentIdx = STAGE_ORDER.indexOf(leader.currentPathwayStage)
  const nextStage  = STAGE_ORDER[currentIdx + 1] ?? null
  const threshold  = nextStage ? thresholds[nextStage] : null

  if (!nextStage || !threshold) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-emerald-500/10 ring-1 ring-emerald-500/25 text-emerald-400">
          Federal Level — highest pathway stage reached
        </span>
      </div>
    )
  }

  const rows = [
    { label: 'Local Supporters', current: summary.totalSupporters,          target: threshold.localSupporters },
    { label: 'Volunteers',        current: summary.volunteerCount,            target: threshold.volunteers },
    ...(threshold.skilledContributors > 0
      ? [{ label: 'Skilled Contributors', current: summary.skilledContributorCount, target: threshold.skilledContributors }]
      : []),
    { label: 'Credibility Score', current: leader.credibility.total,         target: threshold.credibilityScore },
  ]

  const allMet = rows.every(r => r.current >= r.target)

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground/70">
        Progress to <span className="font-semibold text-foreground/80">{nextStage}</span>
      </p>

      <div className="space-y-3">
        {rows.map(row => (
          <ProgressRow key={row.label} {...row} />
        ))}
      </div>

      {allMet && (
        <div className="rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/25 p-3">
          <p className="text-xs font-medium text-emerald-400">
            All support thresholds met. This leader is ready to advance to {nextStage}.
          </p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/40 pt-1 border-t border-border/30">
        Thresholds are community guidelines, not formal requirements. Pathway stage is verified by the Stickee moderation team.
      </p>
    </div>
  )
}
