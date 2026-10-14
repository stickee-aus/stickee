'use client'

import { useState, useEffect } from 'react'
import { MapPin } from 'lucide-react'

type LookupResult = {
  postcode: string
  electorate: string
  state: string
}

export function PostcodeLookup() {
  const [postcode, setPostcode] = useState('')
  const [result, setResult] = useState<LookupResult | null>(null)
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

  async function lookup(e: React.FormEvent) {
    e.preventDefault()
    const digits = postcode.replace(/\D/g, '')
    if (digits.length !== 4) {
      setError('Enter a 4-digit postcode')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/electorate-lookup?postcode=${digits}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Lookup failed')
        setResult(null)
        return
      }

      setResult(data)
      localStorage.setItem('stickee_electorate', JSON.stringify(data))
      setPostcode('')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  function clear() {
    setResult(null)
    localStorage.removeItem('stickee_electorate')
  }

  if (result) {
    return (
      <div className="mt-8 flex items-center justify-center gap-3 text-sm">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-foreground">
          Your seat: <strong>{result.electorate}</strong> ({result.state})
        </span>
        <button
          type="button"
          onClick={clear}
          className="text-muted-foreground underline-offset-2 hover:underline"
        >
          Change
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
