'use client'

import { useState, useEffect } from 'react'

interface CountdownResult {
  /** Human-readable label e.g. "2d 4h", "3h 12m", "45m", "closing now" */
  label: string
  /** Total seconds remaining (0 when expired) */
  secondsLeft: number
  /** True when ≤ 72 hours remain */
  isClosingSoon: boolean
  /** True when ≤ 24 hours remain */
  isUrgent: boolean
  /** True when time has expired */
  isExpired: boolean
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'closing now'
  const totalSeconds = Math.floor(ms / 1000)
  const days    = Math.floor(totalSeconds / 86400)
  const hours   = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

/**
 * Live countdown to a target date string (ISO or parseable).
 * Updates every second when < 1 hour, every minute otherwise.
 */
export function useCountdown(targetDate: string | Date | null | undefined): CountdownResult {
  const [now, setNow] = useState<number>(() => Date.now())

  const target = targetDate ? new Date(targetDate).getTime() : null
  const msLeft = target ? Math.max(0, target - now) : 0
  const secondsLeft = Math.floor(msLeft / 1000)
  const isExpired     = target !== null && msLeft <= 0
  const isUrgent      = !isExpired && msLeft <= 24 * 60 * 60 * 1000   // ≤ 24 h
  const isClosingSoon = !isExpired && msLeft <= 72 * 60 * 60 * 1000   // ≤ 72 h

  useEffect(() => {
    if (!target) return
    // Fast tick when under 1 h, slow tick otherwise
    const interval = msLeft < 3600_000 ? 1000 : 60_000
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [target, msLeft < 3600_000]) // re-establish when we cross the 1-h threshold

  return {
    label: target ? formatCountdown(msLeft) : '—',
    secondsLeft,
    isClosingSoon,
    isUrgent,
    isExpired,
  }
}
