'use client'

import { UserPlus, UserCheck } from 'lucide-react'
import { useFollows } from '@/hooks/useFollows'

interface FollowButtonProps {
  userId: string
  size?: 'sm' | 'md'
  className?: string
}

export function FollowButton({ userId, size = 'md', className = '' }: FollowButtonProps) {
  const { isFollowing, toggle, hydrated } = useFollows()
  const followed = isFollowing(userId)

  if (!hydrated) return null

  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-1 text-[10px] gap-1'
    : 'px-3 py-1.5 text-xs gap-1.5'

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(userId) }}
      className={[
        'inline-flex items-center font-mono tracking-widest uppercase transition-all shrink-0',
        sizeClasses,
        followed
          ? 'border border-border text-muted-foreground hover:border-red-500/50 hover:text-red-400'
          : 'border border-primary/50 text-primary hover:bg-primary/10',
        className,
      ].join(' ')}
      aria-pressed={followed}
      aria-label={followed ? 'Unfollow' : 'Follow'}
    >
      {followed
        ? <><UserCheck className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} /> Following</>
        : <><UserPlus className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} /> Follow</>
      }
    </button>
  )
}
