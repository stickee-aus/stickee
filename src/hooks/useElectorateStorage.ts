'use client'

import { useState, useEffect } from 'react'

export type StoredElectorate = {
  postcode: string
  electorate: string
  state: string
}

const STORAGE_KEY = 'stickee_electorate'

export function useElectorateStorage() {
  const [electorate, setElectorate] = useState<StoredElectorate | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setElectorate(JSON.parse(stored))
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    setLoaded(true)
  }, [])

  function clear() {
    localStorage.removeItem(STORAGE_KEY)
    setElectorate(null)
  }

  return { electorate, loaded, clear }
}
