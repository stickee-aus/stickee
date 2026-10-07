'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Minus, Plus, RotateCcw, Info, ChevronDown, Copy, CheckCheck } from 'lucide-react'
import {
  billVoteRows,
  simulateBillOutcomes,
  BASE_SEAT_COUNTS,
  MAJORITY_THRESHOLD,
  type SimOutcome,
} from '@/lib/mock-parliament-data'

// ─── Constants ────────────────────────────────────────────────────────────────

const PARTY_COLORS: Record<string, string> = {
  'Labor':                    '#E53935',
  'Coalition':                '#1565C0',
  'Greens':                   '#2E7D32',
  'Independent':              '#EC407A',
  'Centre Alliance':          '#F9A825',
  "Katter's Australian Party":'#4E342E',
}

const PARTY_SHORT: Record<string, string> = {
  'Labor':                    'ALP',
  'Coalition':                'LNP',
  'Greens':                   'GRN',
  'Independent':              'IND',
  'Centre Alliance':          'CA',
  "Katter's Australian Party":'KAP',
}

const TOTAL_SEATS = 149

const ADJUSTABLE = ['Labor', 'Coalition'] as const

// ─── Preset scenarios ──────────────────────────────────────────────────────────

interface Scenario {
  label: string
  seats: Partial<Record<string, number>>
}

const PRESET_SCENARIOS: Scenario[] = [
  {
    label: '2025 Election Result (baseline)',
    seats: { Labor: 94, Coalition: 42, Greens: 1, Independent: 10, 'Centre Alliance': 1, "Katter's Australian Party": 1 },
  },
  {
    label: 'What if Greens gain 5 seats?',
    seats: { Labor: 91, Coalition: 42, Greens: 6, Independent: 10, 'Centre Alliance': 1, "Katter's Australian Party": 1 },
  },
  {
    label: 'Teal wave: Independents +8',
    seats: { Labor: 90, Coalition: 40, Greens: 1, Independent: 18, 'Centre Alliance': 1, "Katter's Australian Party": 1 },
  },
  {
    label: 'Coalition majority',
    seats: { Labor: 68, Coalition: 76, Greens: 1, Independent: 4, 'Centre Alliance': 1, "Katter's Australian Party": 1 },
  },
]

// ─── URL encoding helpers ──────────────────────────────────────────────────────

function encodeSeats(seats: Record<string, number>): string {
  const params = new URLSearchParams()
  if (seats.Labor    !== BASE_SEAT_COUNTS.Labor)    params.set('labor', String(seats.Labor))
  if (seats.Coalition !== BASE_SEAT_COUNTS.Coalition) params.set('coalition', String(seats.Coalition))
  return params.toString()
}

function decodeSeatsFromParams(search: string): Partial<Record<string, number>> {
  const params = new URLSearchParams(search)
  const result: Partial<Record<string, number>> = {}
  const labor = params.get('labor')
  const coalition = params.get('coalition')
  if (labor && !isNaN(Number(labor))) result.Labor = Number(labor)
  if (coalition && !isNaN(Number(coalition))) result.Coalition = Number(coalition)
  return result
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeatBar({ seats }: { seats: Record<string, number> }) {
  const total = Object.values(seats).reduce((a, b) => a + b, 0) || TOTAL_SEATS
  return (
    <div className="relative">
      <div className="flex h-5 rounded-full overflow-hidden gap-px">
        {Object.entries(seats).map(([party, count]) =>
          count > 0 ? (
            <div
              key={party}
              className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(count / total) * 100}%`, backgroundColor: PARTY_COLORS[party] ?? '#999' }}
              title={`${party}: ${count} seats`}
            />
          ) : null
        )}
      </div>
      {/* Majority line */}
      <div
        className="absolute top-0 h-full w-px bg-white/60 z-10"
        style={{ left: `${(MAJORITY_THRESHOLD / total) * 100}%` }}
        title={`Majority: ${MAJORITY_THRESHOLD} seats`}
      />
      <div
        className="absolute -bottom-4 text-[9px] text-muted-foreground"
        style={{ left: `${(MAJORITY_THRESHOLD / total) * 100}%`, transform: 'translateX(-50%)' }}
      >
        {MAJORITY_THRESHOLD}
      </div>
    </div>
  )
}

function OutcomeRow({
  bill,
  outcome,
  baseOutcome,
}: {
  bill: typeof billVoteRows[number]
  outcome: SimOutcome
  baseOutcome: SimOutcome
}) {
  const flipped = outcome.passes !== baseOutcome.passes
  const probDiff = outcome.probability - baseOutcome.probability

  return (
    <div className={`rounded-lg p-3 transition-all duration-300 ${
      flipped
        ? 'bg-amber-400/8 border border-amber-400/25'
        : 'bg-muted/15'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[11px] font-semibold text-foreground leading-snug flex-1">
          {bill.name}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          {flipped && (
            <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 rounded px-1 py-0.5 uppercase tracking-wider">
              Flipped!
            </span>
          )}
          <span className={`text-xs font-bold ${outcome.passes ? 'text-emerald-400' : 'text-red-400'}`}>
            {outcome.passes ? 'Passes' : 'Fails'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${outcome.passes ? 'bg-emerald-500' : 'bg-red-500'}`}
            style={{ width: `${outcome.probability}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-muted-foreground w-8 text-right">
          {outcome.probability}%
        </span>
        {probDiff !== 0 && (
          <span className={`text-[10px] font-semibold tabular-nums w-10 text-right ${probDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {probDiff > 0 ? '+' : ''}{probDiff}pp
          </span>
        )}
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-emerald-400/70">{outcome.for} For</span>
        <span className="text-[10px] text-red-400/70">{outcome.against} Against</span>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ImpactSimulator() {
  const [seats, setSeats] = useState<Record<string, number>>({ ...BASE_SEAT_COUNTS })
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Initialise from URL params on mount
  useEffect(() => {
    const override = decodeSeatsFromParams(window.location.search)
    if (Object.keys(override).length > 0) {
      setSeats(prev => {
        const next = { ...prev }
        if (override.Labor !== undefined) next.Labor = override.Labor
        if (override.Coalition !== undefined) next.Coalition = override.Coalition
        return next
      })
    }
  }, [])

  // Sync URL params whenever seats change (replace state, don't push)
  const updateUrl = useCallback((s: Record<string, number>) => {
    const encoded = encodeSeats(s)
    const url = encoded
      ? `${window.location.pathname}?${encoded}${window.location.hash}`
      : `${window.location.pathname}${window.location.hash}`
    window.history.replaceState(null, '', url)
  }, [])

  const hasChanged = ADJUSTABLE.some(p => seats[p] !== BASE_SEAT_COUNTS[p])

  function adjust(party: 'Labor' | 'Coalition', delta: number) {
    setSeats(prev => {
      const current  = prev[party]
      const newCount = Math.max(0, current + delta)
      const actualDiff = newCount - current
      if (actualDiff === 0) return prev
      const other    = party === 'Labor' ? 'Coalition' : 'Labor'
      const otherNew = Math.max(0, prev[other] - actualDiff)
      const realDiff = prev[other] - otherNew
      const next = { ...prev, [party]: current + realDiff, [other]: otherNew }
      updateUrl(next)
      return next
    })
  }

  function loadScenario(scenario: Scenario) {
    const next: Record<string, number> = { ...BASE_SEAT_COUNTS }
    for (const [k, v] of Object.entries(scenario.seats)) {
      if (v !== undefined) next[k] = v
    }
    setSeats(next)
    updateUrl(next)
    setScenarioOpen(false)
  }

  function reset() {
    setSeats({ ...BASE_SEAT_COUNTS })
    updateUrl(BASE_SEAT_COUNTS)
  }

  function handleShare() {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const baseOutcomes = useMemo(() => simulateBillOutcomes(BASE_SEAT_COUNTS), [])
  const outcomes     = useMemo(() => simulateBillOutcomes(seats), [seats])

  const flippedCount = billVoteRows.filter(
    b => outcomes[b.id]?.passes !== baseOutcomes[b.id]?.passes
  ).length

  return (
    <div id="impact-simulator" className="rounded-xl border border-border/60 bg-card/80 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Impact Simulator</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            What if your electorate flipped? Shift seats to see how bill outcomes change in real time.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {flippedCount > 0 && (
            <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 rounded-md px-2 py-1">
              {flippedCount} bill{flippedCount !== 1 ? 's' : ''} flipped!
            </span>
          )}
          {hasChanged && (
            <>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md px-2.5 py-1.5 border border-border/60 hover:bg-accent transition-colors"
              >
                {copied ? <CheckCheck className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied!' : 'Share'}
              </button>
              <button
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-md px-2.5 py-1.5 border border-border/60 hover:bg-accent transition-colors"
                onClick={reset}
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/40">
        {/* ── Left: Seat Adjustors ── */}
        <div className="px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Seat composition
            </p>

            {/* Scenario picker */}
            <div className="relative">
              <button
                onClick={() => setScenarioOpen(v => !v)}
                className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 border border-primary/20 bg-primary/5 rounded-md px-2 py-1 transition-colors"
              >
                Load scenario
                <ChevronDown size={10} className={`transition-transform ${scenarioOpen ? 'rotate-180' : ''}`} />
              </button>
              {scenarioOpen && (
                <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-lg border border-border/60 bg-card shadow-lg overflow-hidden">
                  {PRESET_SCENARIOS.map(s => (
                    <button
                      key={s.label}
                      onClick={() => loadScenario(s)}
                      className="w-full text-left px-3 py-2 text-[11px] text-foreground hover:bg-muted/40 transition-colors border-b border-border/30 last:border-0"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Seat composition bar */}
          <div className="mb-6">
            <SeatBar seats={seats} />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-5">
            {Object.entries(seats).map(([party, count]) => (
              <div key={party} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: PARTY_COLORS[party] ?? '#999' }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {PARTY_SHORT[party] ?? party} {count}
                </span>
              </div>
            ))}
          </div>

          {/* Adjustable party controls */}
          <div className="space-y-4">
            {ADJUSTABLE.map(party => {
              const count   = seats[party]
              const base    = BASE_SEAT_COUNTS[party]
              const changed = count !== base
              const diff    = count - base
              const color   = PARTY_COLORS[party]

              return (
                <div key={party}>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-semibold text-foreground w-20 shrink-0">
                      {party}
                    </span>

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        aria-label={`Remove a ${party} seat`}
                        disabled={count <= 0}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        onClick={() => adjust(party, -1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <span
                        className={`w-10 text-center text-base font-bold tabular-nums ${
                          changed ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {count}
                      </span>

                      <button
                        aria-label={`Add a ${party} seat`}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        onClick={() => adjust(party, +1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {changed ? (
                      <span
                        className={`text-xs font-bold tabular-nums w-8 text-right ${
                          diff > 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    ) : (
                      <span className="w-8" />
                    )}
                  </div>

                  <div className="ml-7 mt-1.5">
                    <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${(count / TOTAL_SEATS) * 100}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="flex items-start gap-1.5 mt-4 text-[10px] text-muted-foreground leading-snug">
            <Info className="h-3 w-3 shrink-0 mt-0.5" />
            Adjusting one party transfers seats to or from the other.
            Greens, Independents and minor parties remain fixed.
          </p>
        </div>

        {/* ── Right: Bill Outcomes ── */}
        <div className="px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Bill outcomes
          </p>
          <div className="space-y-2.5">
            {billVoteRows.map(bill => (
              <OutcomeRow
                key={bill.id}
                bill={bill}
                outcome={outcomes[bill.id] ?? { for: 0, against: 0, passes: false, probability: 0 }}
                baseOutcome={baseOutcomes[bill.id] ?? { for: 0, against: 0, passes: false, probability: 0 }}
              />
            ))}
          </div>

          {flippedCount > 0 && (
            <p className="mt-3 text-[10px] text-amber-400/80 leading-snug">
              Bills marked &ldquo;Flipped!&rdquo; would change outcome from the current real-world result
              based on your adjusted seat counts.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
