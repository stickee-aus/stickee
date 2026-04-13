import { CheckCircle2 } from 'lucide-react'

interface StreakBadgeProps {
  count: number
  isActiveToday: boolean
  size?: 'sm' | 'md'
}

export function StreakBadge({ count, isActiveToday, size = 'md' }: StreakBadgeProps) {
  const isSm = size === 'sm'

  if (count === 0) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400 ${isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}>
        Start your streak
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400 font-medium ${isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}`}>
      🔥 <span className="font-bold">{count}</span>-day streak
      {isActiveToday && (
        <CheckCircle2 className={isSm ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      )}
    </span>
  )
}
