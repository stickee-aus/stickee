'use client'

import { useState, useEffect } from 'react'

export type StoredElectorate = {
  postcode: string
  electorate: string
  state: string
}

const STORAGE_KEY = 'stickee_electorate'

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

    // Listen for both cross-tab and same-tab updates (we dispatch 'storage' after writes)
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function clear() {
    localStorage.removeItem(STORAGE_KEY)
    setElectorate(null)
    window.dispatchEvent(new Event('storage'))
  }

  return { electorate, loaded, clear }
}
