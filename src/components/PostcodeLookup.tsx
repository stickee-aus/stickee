'use client'

import { useState, useEffect } from 'react'
import { syncElectorateToLegacy } from '@/hooks/useElectorateStorage'

type LookupResult = {
  postcode: string
  electorate: string
  state: string
  locality?: string
}

type LocalityOption = {
  locality: string
  electorate: string
}

type MultiResult = {
  postcode: string
  state: string
  electorates: string[]
  localities: LocalityOption[]
  multiple: true
}

// Merge localities that share a name across electorates (e.g. North Maclean
// appearing under both Forde and Wright) into one button listing both seats.
function dedupeLocalities(localities: LocalityOption[]): LocalityOption[] {
  const map = new Map<string, Set<string>>()
  for (const loc of localities) {
    const set = map.get(loc.locality) ?? new Set<string>()
    set.add(loc.electorate)
    map.set(loc.locality, set)
  }
  return Array.from(map.entries()).map(([locality, electorates]) => ({
    locality,
    electorate: Array.from(electorates).join(' / '),
  }))
}

// Electorates that show up for only one locality in this postcode are almost
// certainly the default for everyone else — group them instead of listing
// every suburb individually.
function groupElectorates(
  localities: LocalityOption[],
  electorates: string[],
): { grouped: string; individual: LocalityOption[] } | null {
  const counts = new Map<string, number>()
  for (const loc of localities) {
    for (const e of loc.electorate.split(' / ')) {
      counts.set(e, (counts.get(e) ?? 0) + 1)
    }
  }
  const singles = electorates.filter(e => (counts.get(e) ?? 0) <= 1)
  if (singles.length === 0) return null
  const grouped = singles.join(' / ')
  const individual = localities.filter(
    loc => !loc.electorate.split(' / ').some(e => singles.includes(e)),
  )
  return { grouped, individual }
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
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? `Lookup failed (${res.status})`)
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
    } catch (err) {
      console.error(err)
      setError('Network error — check the console or your connection')
    } finally {
      setLoading(false)
      }
  }

  function pickLocality(loc: LocalityOption) {
    if (!multi) return
    // If the merged label lists multiple seats, the user still needs to choose.
    const seats = loc.electorate.split(' / ')
    if (seats.length > 1) {
      const chosen = window.confirm(
        `${loc.locality} sits in both ${seats.join(' and ')}. Which is yours?`,
      )
        ? seats[0]
        : seats[1]
      const result: LookupResult = {
        postcode: multi.postcode,
        electorate: chosen,
        state: multi.state,
        locality: loc.locality,
      }
      saveAndSync(result)
      setMulti(null)
      setPostcode('')
      return
    }
    const chosen: LookupResult = {
      postcode: multi.postcode,
      electorate: loc.electorate,
      state: multi.state,
      locality: loc.locality,
    }
    saveAndSync(chosen)
    setMulti(null)
    setPostcode('')
  }

  function pickElectorate(electorate: string) {
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
    setError(null)
    localStorage.removeItem('stickee_electorate')
    localStorage.removeItem('stickee:electorate')
    window.dispatchEvent(new Event('storage'))
  }

  if (result) {
    return (
      <div className="mt-6 text-sm text-muted-foreground">
        Seat set{result.locality ? ` (${result.locality})` : ''} — see details below.
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
    const deduped = dedupeLocalities(multi.localities)
    const grouped = groupElectorates(deduped, multi.electorates)
    const display = grouped ? grouped.individual : deduped
    const hasLocalities = display.length > 0

    return (
      <div className="mx-auto mt-8 max-w-xs rounded-lg border border-border bg-card p-4 text-left">
        <p className="mb-3 text-sm font-medium text-foreground">
          {multi.postcode} spans multiple seats in {multi.state}.
          {hasLocalities ? ' Which suburb?' : ' Which seat?'}
        </p>

        {hasLocalities ? (
          <div className="flex flex-col gap-2">
            {display.map(loc => (
              <button
                key={loc.locality}
                type="button"
                onClick={() => pickLocality(loc)}
                className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                <span>{loc.locality}</span>
                <span className="text-xs text-muted-foreground">{loc.electorate}</span>
              </button>
            ))}
            {grouped && (
              <button
                type="button"
                onClick={() => pickElectorate(grouped.grouped)}
                className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                <span>Mostly {grouped.grouped}</span>
                <span className="text-xs text-muted-foreground">
                  {multi.postcode} default
                </span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {multi.electorates.map(e => (
              <button
                key={e}
        type="button"
                onClick={() => pickElectorate(e)}
                className="h-10 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent"
              >
                {e}
              </button>
            ))}
          </div>
        )}

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
    <form onSubmit={lookup} classClassName="mx-auto mt-8 flex max-w-xs flex-col gap-2">
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
