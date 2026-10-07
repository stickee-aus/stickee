'use client'

import { useState, useEffect, useCallback } from 'react'
import { ELECTORATE_MP_MAP } from '@/lib/mock-parliament-data'
import { MPIndex } from '@/lib/mock-data'
import type { MP } from '@/types'

const STORAGE_KEY = 'stickee:electorate'
const DISMISSED_KEY = 'stickee:electorate-dismissed'

export type ElectorateDetectState = 'idle' | 'detecting' | 'detected' | 'prompted' | 'dismissed' | 'suggested' | 'error'

export function useElectorate() {
  const [electorate, setElectorateState] = useState<string | null>(null)
  const [detectState, setDetectState] = useState<ElectorateDetectState>('idle')
  const [mp, setMp] = useState<MP | null>(null)
  // A location-based guess that has NOT been confirmed as the user's actual
  // electorate. /api/electorate-lookup is a coarse state-bounding-box match
  // that returns the first known electorate in that state — never a precise
  // geographic electorate boundary lookup. It must never be presented as
  // "your representative" until the user explicitly confirms it.
  const [suggestedElectorate, setSuggestedElectorate] = useState<string | null>(null)

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
    setSuggestedElectorate(null)
    setDetectState('prompted')
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(DISMISSED_KEY)
    } catch { /* ignore */ }
  }, [])

  // Detection only ever produces a suggestion, never a confirmed electorate —
  // the lookup is a coarse state match, not a real geographic boundary match.
  const detectByLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setDetectState('error')
      return
    }
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
            if (detected) {
              setSuggestedElectorate(detected)
              setDetectState('suggested')
            } else {
              setDetectState('error')
            }
          } else {
            setDetectState('error')
          }
        } catch {
          setDetectState('error')
        }
      },
      () => { setDetectState('error') },
      { timeout: 8000 }
    )
  }, [])

  // Explicit user confirmation that a location-based suggestion is correct —
  // only after this does the electorate/MP relationship become "known."
  const confirmSuggestedElectorate = useCallback(() => {
    if (suggestedElectorate) {
      setElectorate(suggestedElectorate)
      setSuggestedElectorate(null)
    }
  }, [suggestedElectorate, setElectorate])

  const rejectSuggestedElectorate = useCallback(() => {
    setSuggestedElectorate(null)
    setDetectState('prompted')
  }, [])

  return {
    electorate,
    mp,
    detectState,
    suggestedElectorate,
    setElectorate,
    dismissPrompt,
    clearElectorate,
    detectByLocation,
    confirmSuggestedElectorate,
    rejectSuggestedElectorate,
  }
}
