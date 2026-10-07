import { Users, MapPin, Wrench } from 'lucide-react'
import type { LeaderSupportSummary } from '@/types/leaders'

interface SupportStrengthBarProps {
  summary: LeaderSupportSummary
  size?: 'sm' | 'lg'
}

export function SupportStrengthBar({ summary, size = 'lg' }: SupportStrengthBarProps) {
  const { totalSupporters, volunteerCount, skilledContributorCount } = summary

  if (size === 'sm') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Users className="h-3 w-3 shrink-0" />
        <span className="tabular-nums">{totalSupporters}</span>
        <span>supporters</span>
        {volunteerCount > 0 && (
          <>
            <span className="text-border/60">·</span>
            <span className="tabular-nums">{volunteerCount}</span>
            <span>volunteers</span>
          </>
        )}
        {skilledContributorCount > 0 && (
          <>
            <span className="text-border/60">·</span>
            <span className="tabular-nums">{skilledContributorCount}</span>
            <span>skilled</span>
          </>
        )}
      </span>
    )
  }

  const volunteerPct = totalSupporters > 0 ? (volunteerCount / totalSupporters) * 100 : 0
  const skilledPct   = totalSupporters > 0 ? (skilledContributorCount / totalSupporters) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {/* Total supporters */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/30 p-3">
          <Users className="h-4 w-4 text-muted-foreground/50 mb-0.5" />
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {totalSupporters.toLocaleString()}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60 text-center leading-tight">
            Supporters
          </span>
        </div>

        {/* Volunteers */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/30 p-3">
          <MapPin className="h-4 w-4 text-muted-foreground/50 mb-0.5" />
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {volunteerCount.toLocaleString()}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60 text-center leading-tight">
            Volunteers
          </span>
        </div>

        {/* Skilled contributors */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/30 p-3">
          <Wrench className="h-4 w-4 text-muted-foreground/50 mb-0.5" />
          <span className="text-2xl font-bold tabular-nums text-foreground">
            {skilledContributorCount.toLocaleString()}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60 text-center leading-tight">
            Skilled
          </span>
        </div>
      </div>

      {/* Proportional depth bar */}
      {totalSupporters > 0 && (
        <div className="space-y-1.5">
          <div className="relative h-2 rounded-full bg-border/30 overflow-hidden">
            {/* Volunteer proportion */}
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-primary/50 transition-all duration-500"
              style={{ width: `${volunteerPct}%` }}
            />
            {/* Skilled proportion (narrower, on top) */}
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-primary/80 transition-all duration-500"
              style={{ width: `${skilledPct}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground/40">
            Depth of support: volunteers and skilled contributors shown within total
          </p>
        </div>
      )}
    </div>
  )
}
