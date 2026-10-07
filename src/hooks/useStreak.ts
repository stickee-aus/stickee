'use client'

import { useState, useEffect, useCallback } from 'react'

export interface StreakState {
  count: number
  lastActionDate: string | null // 'YYYY-MM-DD'
  isActiveToday: boolean
  longestStreak: number
  freezesAvailable: number
  milestoneReached: number | null // set briefly after milestone hit, then cleared
}

const KEY_COUNT    = 'stickee:streak-count'
const KEY_DATE     = 'stickee:streak-last-action'
const KEY_LONGEST  = 'stickee:streak-longest'
const KEY_FREEZES  = 'stickee:streak-freezes'

export const STREAK_MILESTONES = [7, 30, 100]
export const FREEZE_COST_PTS   = 500 // points to buy a streak freeze

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayString(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function isMilestone(count: number): boolean {
  return STREAK_MILESTONES.includes(count)
}

export function useStreak(): {
  streak: StreakState
  recordAction: () => { newCount: number; isMilestone: boolean }
  buyFreeze: (deductPoints: () => boolean) => boolean
  clearMilestone: () => void
} {
  const [streak, setStreak] = useState<StreakState>({
    count: 0,
    lastActionDate: null,
    isActiveToday: false,
    longestStreak: 0,
    freezesAvailable: 0,
    milestoneReached: null,
  })

  useEffect(() => {
    try {
      const count            = parseInt(localStorage.getItem(KEY_COUNT)   ?? '0', 10) || 0
      const lastActionDate   = localStorage.getItem(KEY_DATE)
      const longestStreak    = parseInt(localStorage.getItem(KEY_LONGEST) ?? '0', 10) || 0
      const freezesAvailable = parseInt(localStorage.getItem(KEY_FREEZES) ?? '0', 10) || 0
      const today            = todayString()

      // Check if streak is broken (missed yesterday and no freeze)
      const yesterday = yesterdayString()
      let finalCount = count
      let finalFreezes = freezesAvailable

      if (lastActionDate && lastActionDate !== today && lastActionDate !== yesterday) {
        // Streak potentially broken — use a freeze if available
        if (freezesAvailable > 0) {
          finalFreezes = freezesAvailable - 1
          localStorage.setItem(KEY_FREEZES, String(finalFreezes))
          // Keep streak count intact
        } else {
          // Reset streak
          finalCount = 0
          localStorage.setItem(KEY_COUNT, '0')
        }
      }

      setStreak({
        count: finalCount,
        lastActionDate,
        isActiveToday: lastActionDate === today,
        longestStreak,
        freezesAvailable: finalFreezes,
        milestoneReached: null,
      })
    } catch {
      // localStorage unavailable
    }
  }, [])

  const recordAction = useCallback((): { newCount: number; isMilestone: boolean } => {
    let result = { newCount: 0, isMilestone: false }
    try {
      const today     = todayString()
      const yesterday = yesterdayString()
      const lastDate  = localStorage.getItem(KEY_DATE)

      if (lastDate === today) return result // already recorded

      const prevCount     = parseInt(localStorage.getItem(KEY_COUNT)   ?? '0', 10) || 0
      const prevLongest   = parseInt(localStorage.getItem(KEY_LONGEST) ?? '0', 10) || 0
      const newCount      = (lastDate === yesterday) ? prevCount + 1 : 1
      const newLongest    = Math.max(prevLongest, newCount)
      const hitMilestone  = isMilestone(newCount)

      localStorage.setItem(KEY_COUNT,   String(newCount))
      localStorage.setItem(KEY_DATE,    today)
      localStorage.setItem(KEY_LONGEST, String(newLongest))

      setStreak(prev => ({
        ...prev,
        count: newCount,
        lastActionDate: today,
        isActiveToday: true,
        longestStreak: newLongest,
        milestoneReached: hitMilestone ? newCount : null,
      }))

      result = { newCount, isMilestone: hitMilestone }
    } catch { /* ignore */ }
    return result
  }, [])

  const buyFreeze = useCallback((deductPoints: () => boolean): boolean => {
    const ok = deductPoints()
    if (!ok) return false
    try {
      const prev = parseInt(localStorage.getItem(KEY_FREEZES) ?? '0', 10) || 0
      const next = prev + 1
      localStorage.setItem(KEY_FREEZES, String(next))
      setStreak(s => ({ ...s, freezesAvailable: next }))
      return true
    } catch {
      return false
    }
  }, [])

  const clearMilestone = useCallback(() => {
    setStreak(s => ({ ...s, milestoneReached: null }))
  }, [])

  return { streak, recordAction, buyFreeze, clearMilestone }
}
