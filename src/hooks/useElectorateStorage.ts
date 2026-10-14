'use client'

import { useState, useEffect } from 'react'

export type StoredElectorate = {
  postcode: string
  electorate: string
  state: string
}

const STORAGE_KEY = 'stickee_electorate'
const LEGACY_KEY = 'stickee:electorate' // used by existing useElectorate hook

function readStored(): StoredElectorate | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function useElectorateStorage() {
  const [electorate, setElectorate] = useState<StoredElectorate | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setElectorate(readStored())
    setLoaded(true)

    function onStorage() {
      setElectorate(readStored())
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function clear() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(LEGACY_KEY)
    setElectorate(null)
    window.dispatchEvent(new Event('storage'))
  }

  return { electorate, loaded, clear }
}

/** Call this whenever the postcode lookup saves a new electorate. */
export function syncElectorateToLegacy(electorateName: string) {
  try {
    localStorage.setItem(LEGACY_KEY, electorateName)
  } catch {
    /* ignore */
  }
}
