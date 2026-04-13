'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Badge definitions ────────────────────────────────────────────────────────

export type BadgeId =
  | 'early-adopter'
  | 'first-action'
  | 'streak-7'
  | 'streak-30'
  | 'streak-100'
  | 'first-prediction'
  | 'prediction-5'
  | 'prediction-10'
  | 'first-reaction'
  | 'civic-voter'
  | 'referral-1'
  | 'score-b'
  | 'perfect-week'
  | 'top-10'
  | 'weekly-reporter'

export interface BadgeDef {
  id: BadgeId
  label: string
  description: string
  icon: string        // emoji
  color: string       // hex colour for glow / border
  points: number      // bonus pts awarded on earn
  category: 'streak' | 'engagement' | 'prediction' | 'community' | 'milestone'
}

export const BADGE_DEFS: BadgeDef[] = [
  {
    id:          'early-adopter',
    label:       'Early Adopter',
    description: 'Joined Stickee in its first wave of civic intelligence.',
    icon:        '🚀',
    color:       '#a855f7',
    points:      500,
    category:    'milestone',
  },
  {
    id:          'first-action',
    label:       'First Action',
    description: 'Logged your very first daily check-in.',
    icon:        '⚡',
    color:       '#f5a623',
    points:      50,
    category:    'streak',
  },
  {
    id:          'streak-7',
    label:       'Week Warrior',
    description: 'Maintained a 7-day civic streak.',
    icon:        '🔥',
    color:       '#f5a623',
    points:      250,
    category:    'streak',
  },
  {
    id:          'streak-30',
    label:       'Monthly Activist',
    description: 'Hit a 30-day streak — democracy runs on consistency.',
    icon:        '🏆',
    color:       '#f5a623',
    points:      1000,
    category:    'streak',
  },
  {
    id:          'streak-100',
    label:       'Civic Legend',
    description: '100 days straight. You are the benchmark.',
    icon:        '👑',
    color:       '#f5a623',
    points:      5000,
    category:    'streak',
  },
  {
    id:          'first-prediction',
    label:       'First Stake',
    description: 'Made your first market prediction.',
    icon:        '🎯',
    color:       '#3b82f6',
    points:      100,
    category:    'prediction',
  },
  {
    id:          'prediction-5',
    label:       'Five for Five',
    description: 'Placed predictions on 5 different markets.',
    icon:        '📈',
    color:       '#3b82f6',
    points:      200,
    category:    'prediction',
  },
  {
    id:          'prediction-10',
    label:       'Market Mover',
    description: 'Active across 10+ prediction markets.',
    icon:        '💹',
    color:       '#3b82f6',
    points:      400,
    category:    'prediction',
  },
  {
    id:          'first-reaction',
    label:       'Voice Heard',
    description: 'Reacted to your first Feed post.',
    icon:        '❤️',
    color:       '#f04747',
    points:      50,
    category:    'engagement',
  },
  {
    id:          'civic-voter',
    label:       'Civic Voter',
    description: 'Cast your opinion on 5 government decisions.',
    icon:        '🗳️',
    color:       '#2ec266',
    points:      300,
    category:    'engagement',
  },
  {
    id:          'referral-1',
    label:       'Recruiter',
    description: 'Referred your first friend to Stickee.',
    icon:        '🤝',
    color:       '#2ec266',
    points:      250,
    category:    'community',
  },
  {
    id:          'score-b',
    label:       'Grade B Citizen',
    description: 'Reached a civic score of 75 or above.',
    icon:        '🎓',
    color:       '#2ec266',
    points:      500,
    category:    'milestone',
  },
  {
    id:          'perfect-week',
    label:       'Perfect Week',
    description: 'Completed civic actions every day for a full 7-day week.',
    icon:        '✅',
    color:       '#2ec266',
    points:      350,
    category:    'streak',
  },
  {
    id:          'top-10',
    label:       'Top 10',
    description: 'Ranked in the top 10 on the prediction leaderboard.',
    icon:        '🏅',
    color:       '#f5a623',
    points:      750,
    category:    'prediction',
  },
  {
    id:          'weekly-reporter',
    label:       'Weekly Briefed',
    description: 'Checked your weekly civic report for the first time.',
    icon:        '📋',
    color:       '#5a5a5e',
    points:      75,
    category:    'engagement',
  },
]

// ─── State ────────────────────────────────────────────────────────────────────

export interface EarnedBadge {
  id: BadgeId
  earnedAt: string // ISO
}

interface BadgeState {
  earned: EarnedBadge[]
  newlyEarned: BadgeId | null  // briefly set after earning, then cleared
}

const STORAGE_KEY = 'stickee:badges_v1'

function load(): EarnedBadge[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as EarnedBadge[]
  } catch { /* ignore */ }
  // Seed early-adopter for all existing users
  return [{ id: 'early-adopter', earnedAt: new Date().toISOString() }]
}

function persist(earned: EarnedBadge[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(earned)) } catch { /* ignore */ }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBadges() {
  const [state, setState] = useState<BadgeState>({ earned: [], newlyEarned: null })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setState({ earned: load(), newlyEarned: null })
    setHydrated(true)
  }, [])

  /** Award a badge if not already earned. Returns pts bonus (0 if already had it). */
  const awardBadge = useCallback((id: BadgeId): number => {
    let bonus = 0
    setState(prev => {
      if (prev.earned.some(e => e.id === id)) return prev
      const def = BADGE_DEFS.find(d => d.id === id)
      if (!def) return prev
      bonus = def.points
      const next = [...prev.earned, { id, earnedAt: new Date().toISOString() }]
      persist(next)
      return { earned: next, newlyEarned: id }
    })
    return bonus
  }, [])

  /** Call after showing the "new badge" toast to clear the newlyEarned flag. */
  const clearNewlyEarned = useCallback(() => {
    setState(prev => ({ ...prev, newlyEarned: null }))
  }, [])

  const hasBadge = useCallback((id: BadgeId) =>
    state.earned.some(e => e.id === id),
  [state.earned])

  const earnedDefs = BADGE_DEFS.filter(d => state.earned.some(e => e.id === d.id))
  const lockedDefs = BADGE_DEFS.filter(d => !state.earned.some(e => e.id === d.id))

  return {
    earned: state.earned,
    earnedDefs,
    lockedDefs,
    newlyEarned: state.newlyEarned,
    hydrated,
    awardBadge,
    clearNewlyEarned,
    hasBadge,
  }
}
