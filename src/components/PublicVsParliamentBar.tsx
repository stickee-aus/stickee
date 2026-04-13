'use client'

interface PublicVsParliamentBarProps {
  publicSupport: number      // 0–100
  parliamentSupport: number  // 0–100 (% voting For)
  className?: string
}

export function PublicVsParliamentBar({
  publicSupport,
  parliamentSupport,
  className = '',
}: PublicVsParliamentBarProps) {
  const gap = publicSupport - parliamentSupport
  const absGap = Math.abs(gap)
  const isSignificant = absGap > 15

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Public support row */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground shrink-0 w-20 text-right">Public</span>
        <div className="flex-1 h-1.5 bg-muted/30 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${publicSupport}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold text-foreground w-7 shrink-0">{publicSupport}%</span>
      </div>

      {/* Parliament support row */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground shrink-0 w-20 text-right">Parliament</span>
        <div className="flex-1 h-1.5 bg-muted/30 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${parliamentSupport}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold text-foreground w-7 shrink-0">{parliamentSupport}%</span>
      </div>

      {/* Gap callout */}
      {absGap > 5 && (
        <p className={`text-[10px] leading-snug ${isSignificant ? 'text-amber-400' : 'text-muted-foreground/70'}`}>
          {gap > 0
            ? `Parliament is ${absGap}pt${absGap !== 1 ? 's' : ''} below public support`
            : `Parliament is ${absGap}pt${absGap !== 1 ? 's' : ''} ahead of public support`}
          {isSignificant && ' ⚡'}
        </p>
      )}
    </div>
  )
}
