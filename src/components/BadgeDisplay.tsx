'use client'

import { useEffect } from 'react'
import { useBadges, type BadgeDef } from '@/hooks/useBadges'
import { useToast } from '@/components/ui/toast'

// ─── Single badge chip ────────────────────────────────────────────────────────

interface BadgeChipProps {
  def: BadgeDef
  earned: boolean
  earnedAt?: string
  size?: 'sm' | 'md'
}

export function BadgeChip({ def, earned, earnedAt, size = 'md' }: BadgeChipProps) {
  const isSmall = size === 'sm'

  return (
    <div
      className={[
        'relative flex flex-col items-center gap-1.5 rounded border transition-all select-none',
        isSmall ? 'p-2' : 'p-3',
        earned
          ? 'border-[var(--badge-color)] bg-[color-mix(in_srgb,var(--badge-color)_8%,transparent)]'
          : 'border-border/40 bg-card/40 opacity-40 grayscale',
      ].join(' ')}
      style={{ '--badge-color': def.color } as React.CSSProperties}
      title={def.description}
    >
      {/* Earned glow ring */}
      {earned && (
        <span
          className="pointer-events-none absolute inset-0 rounded"
          style={{ boxShadow: `0 0 8px 0 ${def.color}40` }}
        />
      )}

      {/* Icon */}
      <span className={isSmall ? 'text-lg' : 'text-2xl leading-none'}>{def.icon}</span>

      {/* Label */}
      <span
        className="font-mono text-center leading-tight"
        style={{
          fontSize: isSmall ? '8px' : '9px',
          color: earned ? def.color : '#5a5a5e',
          letterSpacing: '0.06em',
        }}
      >
        {def.label}
      </span>

      {/* Earned date */}
      {earned && earnedAt && !isSmall && (
        <span
          className="font-mono"
          style={{ fontSize: '7px', color: '#3a3a3e' }}
        >
          {new Date(earnedAt).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })}
        </span>
      )}

      {/* Lock icon for unearned */}
      {!earned && (
        <span style={{ fontSize: '8px', color: '#3a3a3e' }}>🔒</span>
      )}
    </div>
  )
}

// ─── Full badge grid ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<BadgeDef['category'], string> = {
  streak:      'Streak',
  prediction:  'Prediction',
  engagement:  'Engagement',
  community:   'Community',
  milestone:   'Milestone',
}

interface BadgeGridProps {
  /** If true, show all badges (earned + locked). Default: true */
  showLocked?: boolean
}

export function BadgeGrid({ showLocked = true }: BadgeGridProps) {
  const { earned, earnedDefs, lockedDefs } = useBadges()

  // Group defs by category
  const categories: BadgeDef['category'][] = ['streak', 'prediction', 'engagement', 'community', 'milestone']

  function getEarnedAt(id: string) {
    return earned.find(e => e.id === id)?.earnedAt
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#1e1e20' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.round((earnedDefs.length / (earnedDefs.length + lockedDefs.length)) * 100)}%`,
              background: 'linear-gradient(to right, #f5a623, #2ec266)',
            }}
          />
        </div>
        <span className="font-mono text-[10px] shrink-0" style={{ color: '#3a3a3e' }}>
          {earnedDefs.length}/{earnedDefs.length + lockedDefs.length} earned
        </span>
      </div>

      {/* Badges by category */}
      {categories.map(cat => {
        const allInCat = [...earnedDefs, ...(showLocked ? lockedDefs : [])].filter(d => d.category === cat)
        if (allInCat.length === 0) return null

        return (
          <div key={cat} className="space-y-2">
            <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {allInCat.map(def => (
                <BadgeChip
                  key={def.id}
                  def={def}
                  earned={earnedDefs.some(e => e.id === def.id)}
                  earnedAt={getEarnedAt(def.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── New-badge toast watcher ──────────────────────────────────────────────────
// Mount this once (e.g. in layout or profile) to automatically show a toast
// whenever a badge is freshly awarded.

export function BadgeToastWatcher() {
  const { newlyEarned, clearNewlyEarned, earnedDefs } = useBadges()
  const { toast } = useToast()

  useEffect(() => {
    if (!newlyEarned) return
    const def = earnedDefs.find(d => d.id === newlyEarned)
    if (def) {
      toast(`${def.icon} Badge unlocked: ${def.label} (+${def.points.toLocaleString()} pts)`, 'success')
    }
    clearNewlyEarned()
  }, [newlyEarned, earnedDefs, toast, clearNewlyEarned])

  return null
}

// ─── Compact earned-badge strip (for profile card) ───────────────────────────

export function BadgeStrip({ max = 5 }: { max?: number }) {
  const { earnedDefs } = useBadges()
  const visible = earnedDefs.slice(0, max)
  const overflow = earnedDefs.length - visible.length

  if (visible.length === 0) return null

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map(def => (
        <span
          key={def.id}
          title={`${def.label}: ${def.description}`}
          className="inline-flex items-center justify-center h-6 w-6 rounded text-sm border"
          style={{ borderColor: `${def.color}50`, background: `${def.color}15` }}
        >
          {def.icon}
        </span>
      ))}
      {overflow > 0 && (
        <span className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>
          +{overflow}
        </span>
      )}
    </div>
  )
}
