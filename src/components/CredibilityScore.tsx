import type { CredibilityBreakdown } from '@/types/leaders'

interface CredibilityScoreProps {
  breakdown: CredibilityBreakdown
  size?: 'sm' | 'lg'
}

const BARS = [
  { key: 'experienceScore'  as const, label: 'Experience',        max: 25 },
  { key: 'achievementScore' as const, label: 'Achievements',      max: 25 },
  { key: 'communityScore'   as const, label: 'Community',         max: 20 },
  { key: 'endorsementScore' as const, label: 'Endorsements',      max: 20 },
  { key: 'reasoningScore'   as const, label: 'Reasoning Quality', max: 10 },
]

function scoreBadgeClass(total: number): string {
  if (total >= 65) return 'text-emerald-400 bg-emerald-500/10 ring-1 ring-emerald-500/25'
  if (total >= 45) return 'text-amber-400  bg-amber-400/10  ring-1 ring-amber-400/25'
  return 'text-red-400 bg-red-500/10 ring-1 ring-red-500/25'
}

function barFillClass(total: number): string {
  if (total >= 65) return 'bg-emerald-500'
  if (total >= 45) return 'bg-amber-400'
  return 'bg-red-500'
}

export function CredibilityScore({ breakdown, size = 'sm' }: CredibilityScoreProps) {
  const fill = barFillClass(breakdown.total)
  const badge = scoreBadgeClass(breakdown.total)

  return (
    <div className={size === 'lg' ? 'space-y-4' : 'space-y-3'}>
      {/* Score badge */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-baseline gap-0.5 rounded-lg px-2.5 py-1 font-bold tabular-nums ${badge} ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>
          {breakdown.total}
          <span className={`font-normal ${size === 'lg' ? 'text-sm' : 'text-xs'} opacity-60`}>/100</span>
        </span>
        <span className="text-xs text-muted-foreground">Credibility score</span>
      </div>

      {/* Sub-score bars */}
      <div className={`space-y-${size === 'lg' ? '2.5' : '2'}`}>
        {BARS.map(({ key, label, max }) => {
          const score = breakdown[key]
          const pct = Math.round((score / max) * 100)
          return (
            <div key={key} className="flex items-center gap-2.5">
              <span className={`${size === 'lg' ? 'w-36 text-xs' : 'w-28 text-[11px]'} text-muted-foreground/70 shrink-0`}>
                {label}
              </span>
              <div className={`flex-1 rounded-full bg-border/30 overflow-hidden ${size === 'lg' ? 'h-2' : 'h-1.5'}`}>
                <div
                  className={`h-full rounded-full ${fill} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`${size === 'lg' ? 'text-xs w-8' : 'text-[10px] w-6'} text-right tabular-nums text-muted-foreground/60 shrink-0`}>
                {score}
              </span>
            </div>
          )
        })}
      </div>

      {size === 'lg' && (
        <p className="text-[11px] text-muted-foreground/50 border-t border-border/30 pt-2.5">
          Score based on verified evidence, weighted endorsements, and nomination quality. Higher weight given to verifiable claims and credentialled endorsers.
        </p>
      )}
    </div>
  )
}
