'use client'

import { useEffect, useState } from 'react'
import type { LiveParliamentPayload } from '@/lib/live-parliament'

let cachedPayload: LiveParliamentPayload | null = null
let inflightRequest: Promise<LiveParliamentPayload> | null = null

async function fetchLiveParliamentMembers() {
  if (cachedPayload) return cachedPayload

  if (!inflightRequest) {
    inflightRequest = fetch('/api/parliament/members', { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error(`Failed to load parliament members: ${response.status}`)
        const payload = await response.json() as LiveParliamentPayload
        cachedPayload = payload
        return payload
      })
      .finally(() => {
        inflightRequest = null
      })
  }

  return inflightRequest
}

export function useLiveParliamentMembers() {
  const [data, setData] = useState<LiveParliamentPayload | null>(cachedPayload)
  const [loading, setLoading] = useState(!cachedPayload)

  useEffect(() => {
    let cancelled = false

    fetchLiveParliamentMembers()
      .then(payload => {
        if (!cancelled) setData(payload)
      })
      .catch(() => {
        if (!cancelled) setData(cachedPayload)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading }
}
