'use client'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Chamber = 'house' | 'senate'

interface ChamberToggleProps {
  value: Chamber
  onChange: (chamber: Chamber) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChamberToggle({ value, onChange }: ChamberToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-muted-foreground hidden sm:block">Chamber</span>

      <div className="relative flex rounded-lg border border-border/60 bg-muted/20 p-0.5 gap-0.5">
        {/* Sliding highlight */}
        <div
          className={`absolute top-0.5 bottom-0.5 rounded-md bg-card border border-border/60 shadow-sm transition-all duration-200 ease-out ${
            value === 'house' ? 'left-0.5 right-1/2 mr-0.5' : 'left-1/2 right-0.5 ml-0.5'
          }`}
        />

        {/* House button */}
        <button
          onClick={() => onChange('house')}
          className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors duration-150 ${
            value === 'house' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none" className="shrink-0">
            {/* Simple chamber icon — rows of seats */}
            <rect x="0" y="8" width="14" height="1.5" rx="0.75" fill="currentColor" opacity="0.6" />
            <rect x="1" y="5" width="12" height="1.5" rx="0.75" fill="currentColor" opacity="0.8" />
            <rect x="2" y="2" width="10" height="1.5" rx="0.75" fill="currentColor" />
          </svg>
          <span>House of Reps</span>
          <span className="text-[10px] font-normal text-muted-foreground">150</span>
        </button>

        {/* Senate button */}
        <button
          onClick={() => onChange('senate')}
          className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors duration-150 ${
            value === 'senate' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none" className="shrink-0">
            {/* Columns icon — 6 equal blocks */}
            {[0, 2, 4, 6, 8, 10].map(x => (
              <rect key={x} x={x} y="1" width="1.5" height="10" rx="0.75" fill="currentColor" opacity={value === 'senate' ? 1 : 0.6} />
            ))}
          </svg>
          <span>Senate</span>
          <span className="text-[10px] font-normal text-muted-foreground">76</span>
        </button>
      </div>
    </div>
  )
}
