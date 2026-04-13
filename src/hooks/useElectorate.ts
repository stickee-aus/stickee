'use client'

import { useState, useEffect, useCallback } from 'react'
import { ELECTORATE_MP_MAP } from '@/lib/mock-parliament-data'
import { MPIndex } from '@/lib/mock-data'
import type { MP } from '@/types'

const STORAGE_KEY = 'stickee:electorate'
const DISMISSED_KEY = 'stickee:electorate-dismissed'

export type ElectorateDetectState = 'idle' | 'detecting' | 'detected' | 'prompted' | 'dismissed'

export function useElectorate() {
  const [electorate, setElectorateState] = useState<string | null>(null)
  const [detectState, setDetectState] = useState<ElectorateDetectState>('idle')
  const [mp, setMp] = useState<MP | null>(null)

  // Derive MP from electorate
  function resolveMp(e: string): MP | null {
    const mpId = ELECTORATE_MP_MAP[e]
    if (!mpId) return null
    return MPIndex[mpId] ?? null
  }

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setElectorateState(stored)
        setMp(resolveMp(stored))
        setDetectState('detected')
        return
      }
      const dismissed = localStorage.getItem(DISMISSED_KEY)
      if (dismissed) {
        setDetectState('dismissed')
      } else {
        setDetectState('prompted')
      }
    } catch {
      setDetectState('prompted')
    }
  }, [])

  const setElectorate = useCallback((e: string) => {
    setElectorateState(e)
    setMp(resolveMp(e))
    setDetectState('detected')
    try { localStorage.setItem(STORAGE_KEY, e) } catch { /* ignore */ }
  }, [])

  const dismissPrompt = useCallback(() => {
    setDetectState('dismissed')
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch { /* ignore */ }
  }, [])

  const clearElectorate = useCallback(() => {
    setElectorateState(null)
    setMp(null)
    setDetectState('prompted')
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(DISMISSED_KEY)
    } catch { /* ignore */ }
  }, [])

  const detectByLocation = useCallback(async () => {
    if (!navigator.geolocation) return
    setDetectState('detecting')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/electorate-lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          })
          if (res.ok) {
            const { electorate: detected } = await res.json() as { electorate: string }
            if (detected) setElectorate(detected)
          } else {
            setDetectState('prompted')
          }
        } catch {
          setDetectState('prompted')
        }
      },
      () => { setDetectState('prompted') },
      { timeout: 8000 }
    )
  }, [setElectorate])

  return {
    electorate,
    mp,
    detectState,
    setElectorate,
    dismissPrompt,
    clearElectorate,
    detectByLocation,
  }
}
