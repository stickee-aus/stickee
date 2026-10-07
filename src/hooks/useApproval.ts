'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApprovalDirection = 'approve' | 'disapprove'
type Ratings = Record<string, ApprovalDirection>

const STORAGE_KEY = 'stickee_approvals_v1'

// ─── Deterministic community baseline ────────────────────────────────────────
// Seeded per-MP so the community approval feels real but is stable across renders.

function mpHash(mpId: string): number {
  let h = 0
  for (let i = 0; i < mpId.length; i++) h = (h * 31 + mpId.charCodeAt(i)) >>> 0
  return h
}

/** Seeded community approval % (45–88) for a given MP id */
export function communityApprovalPct(mpId: string): number {
  const h = mpHash(mpId)
  return 45 + (h % 44)
}

/** Seeded community disapproval count (base voters) */
export function communityVoteCount(mpId: string): number {
  const h = mpHash(mpId)
  return 280 + (h % 1200)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApproval() {
  const [ratings, setRatings] = useState<Ratings>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setRatings(JSON.parse(raw) as Ratings)
    } catch { /* ignore */ }
  }, [])

  /** Toggle approve/disapprove — clicking the active one removes it */
  const rate = useCallback((mpId: string, direction: ApprovalDirection) => {
    setRatings(prev => {
      const next: Ratings =
        prev[mpId] === direction
          ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== mpId))
          : { ...prev, [mpId]: direction }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const approveCount  = Object.values(ratings).filter(v => v === 'approve').length
  const disapproveCount = Object.values(ratings).filter(v => v === 'disapprove').length

  return { ratings, rate, approveCount, disapproveCount }
}
