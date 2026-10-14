'use client'

import { useState, useEffect } from 'react'
import { syncElectorateToLegacy } from '@/hooks/useElectorateStorage'

type LookupResult = {
  postcode: string
  electorate: string
  state: string
}

type MultiResult = {
  postcode: string
  state: string
  electorates: string[]
  multiple: true
}

export function PostcodeLookup() {
  const [postcode, setPostcode] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)
  const [multi, setMulti] = useState<MultiResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('stickee_electorate')
    if (stored) {
      try {
        setResult(JSON.parse(stored))
      } catch {
        localStorage.removeItem('stickee_electorate')
      }
    }
  }, [])

  function saveAndSync(data: LookupResult) {
    setResult(data)
    localStorage.setItem('stickee_electorate', JSON.stringify(data))
    syncElectorateToLegacy(data.electorate)
    window.dispatchEvent(new Event('storage'))
  }

  async function lookup(e: React.FormEvent) {
    e.preventDefault()
    const digits = postcode.replace(/\D/g, '')
    if (digits.length !== 4) {
      setError('Enter a 4-digit postcode')
      return
    }

    setLoading(true)
    setError(null)
    setMulti(null)

    try {
      const res = await fetch(`/api/electorate-lookup?postcode=${digits}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Lookup failed')
        setResult(null)
        return
      }

      if (data.multiple) {
        setMulti(data as MultiResult)
        setResult(null)
        return
      }

      saveAndSync(data)
      setPostcode('')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  function pick(electorate: string) {
    if (!multi) return
    const chosen: LookupResult = {
      postcode: multi.postcode,
      electorate,
      state: multi.state,
    }
    saveAndSync(chosen)
    setMulti(null)
    setPostcode('')
  }

  function clear() {
    setResult(null)
    setMulti(null)
    localStorage.removeItem('stickee_electorate')
    localStorage.removeItem('stickee:electorate')
    window.dispatchEvent(new Event('storage'))
  }

  if (result) {
    return (
      <div className="mt-6 text-sm text-muted-foreground">
        Seat set — see details below.
        {' '}
        <button
          type="button"
          onClick={clear}
          className="underline-offset-2 hover:underline"
        >
          Change
        </button>
      </div>
    )
  }

  if (multi) {
    return (
      <div className="mx-auto mt-8 max-w-xs">
        <p className="mb-3 text-sm text-muted-foreground">
          {multi.postcode} spans multiple seats. Which one?
        </p>
        <div className="flex flex-col gap-2">
          {multi.electorates.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => pick(e)}
              className="h-10 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
            >
              {e}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={clear}
          className="mt-3 text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={lookup} className="mx-auto mt-8 flex max-w-xs flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="Postcode"
          value={postcode}
          onChange={e => setPostcode(e.target.value)}
          className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Postcode"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-10 rounded-md bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
        >
          {loading ? '…' : 'Find my seat'}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  )
}
