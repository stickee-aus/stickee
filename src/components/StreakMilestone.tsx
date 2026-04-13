'use client'

import { useEffect } from 'react'
import { Flame, X } from 'lucide-react'
import { STREAK_MILESTONES } from '@/hooks/useStreak'

interface StreakMilestoneProps {
  count: number
  onDismiss: () => void
}

const MILESTONE_CONFIG: Record<number, { emoji: string; title: string; body: string; bonus: number }> = {
  7:   { emoji: '🔥', title: '7-day streak!',   body: "A full week of civic action. You're building a habit.",   bonus: 250 },
  30:  { emoji: '⚡', title: '30-day streak!',  body: 'A month of consistent civic engagement. You\'re elite.',  bonus: 1000 },
  100: { emoji: '🏆', title: '100-day streak!', body: "100 days. You're in the top 0.1% of civic participants.", bonus: 5000 },
}

export function StreakMilestone({ count, onDismiss }: StreakMilestoneProps) {
  const cfg = MILESTONE_CONFIG[count]
  if (!cfg) return null

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 border border-border px-6 py-4 w-80 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300"
      style={{ background: '#0a0a0b' }}
    >
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 flex items-center justify-center shrink-0"
          style={{ background: '#1e1800', border: '1px solid #f5a62330' }}
        >
          <Flame className="h-5 w-5" style={{ color: '#f5a623' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm font-medium text-foreground">
            {cfg.emoji} {cfg.title}
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-1 leading-relaxed">
            {cfg.body}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5"
              style={{ color: '#2ec266', border: '1px solid #2ec26630', background: '#041008' }}
            >
              +{cfg.bonus.toLocaleString()} pts
            </span>
            <span className="font-mono text-[9px] text-muted-foreground">
              Added to your wallet
            </span>
          </div>
        </div>
      </div>

      {/* Progress to next milestone */}
      {(() => {
        const next = STREAK_MILESTONES.find(m => m > count)
        if (!next) return null
        return (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="font-mono text-[9px] text-muted-foreground">
              Next milestone: {next}-day streak ({next - count} days away)
            </p>
          </div>
        )
      })()}
    </div>
  )
}
