import { MapPin } from 'lucide-react'
import type { AustralianState } from '@/types/government'
import type { LocalMomentumEntry } from '@/types/leaders'

interface LocalMomentumWidgetProps {
  localBreakdown: LocalMomentumEntry[]
  leaderState: AustralianState
  totalSupporters: number
}

export function LocalMomentumWidget({
  localBreakdown,
  totalSupporters,
}: LocalMomentumWidgetProps) {
  const entries = localBreakdown.slice(0, 3)

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-0.5 rounded-full bg-primary/60" />
        <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Local Momentum
        </h2>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground/50 italic">
          No location data yet — be the first supporter in your area.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const pct = totalSupporters > 0
              ? Math.round((entry.count / totalSupporters) * 100)
              : 0

            return (
              <div key={`${entry.city}-${entry.state}`} className="flex items-center gap-3">
                <MapPin className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                <span className="text-sm text-foreground/80 w-36 shrink-0 truncate">
                  {entry.city},&nbsp;{entry.state}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary/60 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-bold tabular-nums text-primary/80 w-8 text-right shrink-0">
                  {entry.count}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-4 text-[11px] text-muted-foreground/40">
        Supporter locations are approximate. Postcodes are never published.
      </p>
    </div>
  )
}
