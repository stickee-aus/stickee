'use client'

import { useEffect, useState } from 'react'
import { buildInactiveElectionSnapshot, type LiveElectionSnapshot } from '@/lib/aec-election-types'

let cachedSnapshot: LiveElectionSnapshot | null = null
let inflightRequest: Promise<LiveElectionSnapshot> | null = null

async function fetchLiveElectionSnapshot() {
  if (!inflightRequest) {
    inflightRequest = fetch('/api/election/live', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error(`Failed to load election data: ${response.status}`)
        const payload = await response.json() as LiveElectionSnapshot
        cachedSnapshot = payload
        return payload
      })
      .finally(() => {
        inflightRequest = null
      })
  }

  return inflightRequest
}

export function useLiveElection() {
  const [data, setData] = useState<LiveElectionSnapshot>(cachedSnapshot ?? buildInactiveElectionSnapshot(null))
  const [loading, setLoading] = useState(!cachedSnapshot)

  useEffect(() => {
    let cancelled = false
    let intervalId: number | null = null

    async function load() {
      try {
        const snapshot = await fetchLiveElectionSnapshot()
        if (!cancelled) setData(snapshot)
      } catch {
        if (!cancelled && cachedSnapshot) {
          setData(cachedSnapshot)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    function schedule(active: boolean) {
      if (intervalId !== null) {
        window.clearInterval(intervalId)
      }
      intervalId = window.setInterval(() => {
        void load()
      }, active ? 90_000 : 900_000)
    }

    schedule((cachedSnapshot ?? data).active)

    return () => {
      cancelled = true
      if (intervalId !== null) {
        window.clearInterval(intervalId)
      }
    }
  }, [data])

  return { data, loading }
}
