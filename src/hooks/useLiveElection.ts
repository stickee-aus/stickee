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
    let timeoutId: number | null = null

    async function load() {
      let active = cachedSnapshot?.active ?? false

      try {
        const snapshot = await fetchLiveElectionSnapshot()
        active = snapshot.active
        if (!cancelled) setData(snapshot)
      } catch {
        if (!cancelled && cachedSnapshot) {
          setData(cachedSnapshot)
          active = cachedSnapshot.active
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          timeoutId = window.setTimeout(() => {
            void load()
          }, active ? 90_000 : 900_000)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  return { data, loading }
}
