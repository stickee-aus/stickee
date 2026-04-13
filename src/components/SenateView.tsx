'use client'

import { useState, useMemo } from 'react'
import {
  SENATE_SEAT_COUNTS,
  SENATE_PARTY_COLORS,
  SENATE_PARTY_ORDER,
  SENATE_MAJORITY,
  senateBillVoteRows,
} from '@/lib/mock-senate-data'
import type { BillVoteRow, VoteDirection } from '@/lib/mock-parliament-data'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_SEATS = 76

const VOTE_COLORS = {
  for:    '#22c55e',
  against:'#ef4444',
  absent: '#6b7280',
} as const

const DIR_LABELS: Partial<Record<VoteDirection, string>> = {
  for:     'For',
  against: 'Against',
  abstain: 'Abstain',
  split:   'Split',
}

const DIR_STATUS: Partial<Record<VoteDirection, 'green' | 'red' | 'yellow' | 'gray'>> = {
  for:     'green',
  against: 'red',
  abstain: 'gray',
  split:   'yellow',
}

const GROUPS = [
  { key: 'Government',  parties: ['Labor'],                             label: 'Government' },
  { key: 'Crossbench',  parties: ['Greens', 'Independent', 'Jacqui Lambie', 'UAP'], label: 'Crossbench' },
  { key: 'Opposition',  parties: ['Coalition', 'One Nation'],           label: 'Opposition' },
] as const

const SHORT: Record<string, string> = {
  'Jacqui Lambie': 'JLN',
  'Independent':   'Ind.',
  'One Nation':    'One Nation',
}

function shortName(party: string) {
  return SHORT[party] ?? party
}

// ─── Seat Composition Bar ─────────────────────────────────────────────────────

function SeatCompositionBar({ billRow, showPartyColors }: {
  billRow: BillVoteRow | null
  showPartyColors: boolean
}) {
  // Build segments: each party in order, colored by vote (if bill selected) or party color
  const segments = SENATE_PARTY_ORDER.map(party => {
    const seats = SENATE_SEAT_COUNTS[party] ?? 0
    const partyColor = SENATE_PARTY_COLORS[party] ?? '#999'

    if (showPartyColors || !billRow) {
      return { party, seats, color: partyColor }
    }

    const vote = billRow.parties[party]
    const color = vote
      ? (vote.direction === 'for' ? VOTE_COLORS.for : vote.direction === 'against' ? VOTE_COLORS.against : VOTE_COLORS.absent)
      : VOTE_COLORS.absent

    return { party, seats, color }
  })

  const majPct = (SENATE_MAJORITY / TOTAL_SEATS) * 100

  return (
    <div className="space-y-1.5">
      {/* Bar */}
      <div className="relative h-5 rounded-lg overflow-hidden flex bg-muted/20">
        {segments.map(({ party, seats, color }) => (
          <div
            key={party}
            className="h-full transition-colors duration-300 first:rounded-l-lg last:rounded-r-lg"
            style={{
              width: `${(seats / TOTAL_SEATS) * 100}%`,
              backgroundColor: color,
            }}
            title={`${shortName(party)}: ${seats}`}
          />
        ))}
        {/* Majority line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/80 z-10"
          style={{ left: `${majPct}%` }}
        >
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-white/60 uppercase tracking-wide">
            {SENATE_MAJORITY}
          </div>
        </div>
      </div>
      {/* Labels */}
      <div className="flex items-center justify-between text-[9.5px] text-muted-foreground/45 tracking-wide">
        <span>Labor 25</span>
        <span>← {SENATE_MAJORITY} for majority →</span>
        <span>Coalition 28</span>
      </div>
    </div>
  )
}

// ─── Party Row ────────────────────────────────────────────────────────────────

function PartyRow({ party, billRow, showPartyColors }: {
  party: string
  billRow: BillVoteRow | null
  showPartyColors: boolean
}) {
  const seats = SENATE_SEAT_COUNTS[party] ?? 0
  const color = SENATE_PARTY_COLORS[party] ?? '#999'

  const vote = !showPartyColors && billRow ? billRow.parties[party] : null
  const dir = vote?.direction
  const status = dir ? (DIR_STATUS[dir] ?? 'gray') : null

  return (
    <div className="flex items-center gap-2.5 py-1.5 border-b border-white/[0.05] last:border-0">
      {/* Party colour dot */}
      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-foreground/80">{shortName(party)}</span>
      </div>
      <span className="text-xs tabular-nums text-muted-foreground/60 font-medium">{seats}</span>

      {/* Vote badge */}
      {vote && dir && (
        <span className={cn(
          'text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full',
          status === 'green'  && 'bg-emerald-500/15 text-emerald-400',
          status === 'red'    && 'bg-red-500/15 text-red-400',
          status === 'yellow' && 'bg-amber-400/15 text-amber-400',
          status === 'gray'   && 'bg-white/[0.06] text-muted-foreground',
        )}>
          {DIR_LABELS[dir]}
        </span>
      )}
    </div>
  )
}

// ─── Group Column ─────────────────────────────────────────────────────────────

function GroupColumn({ group, billRow, showPartyColors }: {
  group: typeof GROUPS[number]
  billRow: BillVoteRow | null
  showPartyColors: boolean
}) {
  const totalSeats = group.parties.reduce((s, p) => s + (SENATE_SEAT_COUNTS[p] ?? 0), 0)

  // Determine group-level vote status from bill
  const forSeats    = !showPartyColors && billRow ? group.parties.reduce((s, p) => s + (billRow.parties[p]?.forCount ?? 0), 0) : 0
  const againstSeats = !showPartyColors && billRow ? group.parties.reduce((s, p) => s + (billRow.parties[p]?.againstCount ?? 0), 0) : 0

  const groupLabel =
    !showPartyColors && billRow && forSeats > 0 && againstSeats === 0 ? 'For' :
    !showPartyColors && billRow && againstSeats > 0 && forSeats === 0 ? 'Against' :
    !showPartyColors && billRow && forSeats > 0 && againstSeats > 0   ? 'Split' :
    null

  return (
    <div className="flex-1 min-w-0 px-1 first:pl-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40">
          {group.label}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums font-semibold text-foreground/80">{totalSeats}</span>
          {groupLabel && (
            <span className={cn(
              'text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full',
              groupLabel === 'For'     && 'bg-emerald-500/15 text-emerald-400',
              groupLabel === 'Against' && 'bg-red-500/15 text-red-400',
              groupLabel === 'Split'   && 'bg-amber-400/15 text-amber-400',
            )}>
              {groupLabel}
            </span>
          )}
        </div>
      </div>

      {/* Party rows */}
      <div>
        {group.parties.map(party => (
          <PartyRow
            key={party}
            party={party}
            billRow={billRow}
            showPartyColors={showPartyColors}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Majority Bar ─────────────────────────────────────────────────────────────

function MajorityResult({ billRow }: { billRow: BillVoteRow }) {
  const forPct     = (billRow.totalFor     / TOTAL_SEATS) * 100
  const againstPct = (billRow.totalAgainst / TOTAL_SEATS) * 100
  const majPct     = (SENATE_MAJORITY      / TOTAL_SEATS) * 100
  const passes     = billRow.totalFor >= SENATE_MAJORITY

  return (
    <div className="pt-4 border-t border-border/40 space-y-3">
      {/* Result badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">Senate result</span>
        <span className={cn(
          'text-xs font-bold px-2.5 py-1 rounded-full',
          passes ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400',
        )}>
          {passes ? `Passes (${billRow.totalFor}/${SENATE_MAJORITY})` : `Fails (${billRow.totalFor}/${SENATE_MAJORITY})`}
        </span>
      </div>

      {/* Bar */}
      <div className="relative h-2 rounded-full overflow-hidden bg-muted/30 flex">
        <div className="bg-emerald-500 rounded-l-full transition-all duration-500" style={{ width: `${forPct}%` }} />
        <div className="bg-red-500 transition-all duration-500"                    style={{ width: `${againstPct}%` }} />
        {/* Majority threshold */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/60 z-10"
          style={{ left: `${majPct}%` }}
          title={`Majority: ${SENATE_MAJORITY}`}
        />
      </div>

      {/* Counts */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          For: <strong className="text-foreground">{billRow.totalFor}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Against: <strong className="text-foreground">{billRow.totalAgainst}</strong>
        </span>
        {billRow.totalAbstain > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            Abstain: <strong className="text-foreground">{billRow.totalAbstain}</strong>
          </span>
        )}
        <span className="ml-auto text-muted-foreground/60">Need {SENATE_MAJORITY} of {TOTAL_SEATS}</span>
      </div>
    </div>
  )
}

// ─── SenateView ───────────────────────────────────────────────────────────────

interface SenateViewProps {
  selectedBillId: string | null
}

export function SenateView({ selectedBillId }: SenateViewProps) {
  const [showPartyColors, setShowPartyColors] = useState(false)

  const billRow = useMemo(
    () => selectedBillId ? senateBillVoteRows.find(b => b.id === selectedBillId) ?? null : null,
    [selectedBillId],
  )

  const activeBillRow = showPartyColors ? null : billRow

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-card overflow-hidden select-none shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
        <div>
          <p className="text-sm font-semibold text-foreground tracking-tight">Senate</p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">{TOTAL_SEATS} senators · {SENATE_MAJORITY} for majority</p>
        </div>
        {/* Tab toggle */}
        <div className="flex items-center gap-0.5 rounded-lg border border-white/[0.08] bg-white/[0.04] p-0.5">
          {([
            { key: false, label: 'Votes' },
            { key: true,  label: 'Parties' },
          ] as const).map(({ key, label }) => (
            <button
              key={String(key)}
              onClick={() => setShowPartyColors(key)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-all',
                showPartyColors === key
                  ? 'bg-white/[0.08] shadow-sm text-foreground'
                  : 'text-muted-foreground/60 hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Seat composition bar */}
        <SeatCompositionBar billRow={activeBillRow} showPartyColors={showPartyColors} />

        {/* 3-column group breakdown */}
        <div className="grid grid-cols-3 gap-5 divide-x divide-white/[0.06]">
          {GROUPS.map(group => (
            <GroupColumn
              key={group.key}
              group={group}
              billRow={activeBillRow}
              showPartyColors={showPartyColors}
            />
          ))}
        </div>

        {/* Result bar — only when bill selected + has vote data */}
        {billRow && !showPartyColors && (
          <MajorityResult billRow={billRow} />
        )}

        {/* No data state */}
        {!billRow && selectedBillId && !showPartyColors && (
          <p className="text-center text-xs text-muted-foreground/50 py-2">
            This bill has not yet reached the Senate.
          </p>
        )}
      </div>
    </div>
  )
}
