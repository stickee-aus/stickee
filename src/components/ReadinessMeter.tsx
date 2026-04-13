import type { ReadinessLevel } from '@/types/leaders'

interface ReadinessMeterProps {
  level: ReadinessLevel
  size?: 'sm' | 'md'
}

const CONFIG: Record<ReadinessLevel, { dot: string; badge: string; label: string }> = {
  'Ready':     { dot: 'bg-emerald-500', badge: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25', label: 'Ready' },
  'Developing':{ dot: 'bg-amber-400',   badge: 'bg-amber-400/15  text-amber-400   ring-1 ring-amber-400/25',   label: 'Developing' },
  'Not Ready': { dot: 'bg-red-500',     badge: 'bg-red-500/15    text-red-400     ring-1 ring-red-500/25',     label: 'Not Ready' },
}

export function ReadinessMeter({ level, size = 'md' }: ReadinessMeterProps) {
  const { dot, badge, label } = CONFIG[level]

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot} shrink-0`} />
        {label}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>
      <span className={`h-2 w-2 rounded-full ${dot} shrink-0`} />
      {label}
    </span>
  )
}
