'use client'

import { useMemo } from 'react'
import {
  SENATE_SEAT_COUNTS,
  SENATE_PARTY_COLORS,
  SENATE_PARTY_ORDER,
  SENATE_MAJORITY,
} from '@/lib/mock-senate-data'
import { TOTAL_SENATE_SEATS } from '@/lib/au-senate-states'
import { useLiveParliamentMembers } from '@/hooks/useLiveParliamentMembers'
import { LIVE_PARTY_SHORT } from '@/lib/live-parliament'
import { AustraliaSenateMap } from '@/components/AustraliaSenateMap'
import type { LiveElectionSnapshot } from '@/lib/aec-election-types'

function shortName(party: string) {
  if (party === 'Independent') return 'Ind.'
  if (party === 'One Nation') return 'One Nation'
  return LIVE_PARTY_SHORT[party] ?? party
}

// ─── National composition — always explicitly national, never shown as a
//     state's own breakdown. Real data only (SENATE_SEAT_COUNTS / live
//     countsByParty) — same source the previous party bar used, reused here
//     rather than duplicated. ──────────────────────────────────────────────

function NationalCompositionSection() {
  const { data } = useLiveParliamentMembers()
  const countsByParty = data?.senate.countsByParty ?? SENATE_SEAT_COUNTS
  const total = data?.senate.total ?? TOTAL_SENATE_SEATS

  const partiesInOrder = useMemo(() => {
    const base = SENATE_PARTY_ORDER.filter(party => (countsByParty[party] ?? 0) > 0)
    const extras = Object.keys(countsByParty)
      .filter(party => !SENATE_PARTY_ORDER.includes(party as typeof SENATE_PARTY_ORDER[number]) && countsByParty[party] > 0)
      .sort((a, b) => a.localeCompare(b))
    return [...base, ...extras]
  }, [countsByParty])

  return (
    <div className="pt-4 border-t border-border/40">
      <p className="text-micro-label mb-3">Senate composition — nationally</p>
      <ul className="space-y-1.5">
        {partiesInOrder.map(party => {
          const seats = countsByParty[party] ?? 0
          const color = SENATE_PARTY_COLORS[party] ?? '#999'
          const pct = total > 0 ? Math.round((seats / total) * 100) : 0
          return (
            <li key={party} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 border" style={{ backgroundColor: color, borderColor: color }} aria-hidden="true" />
              <span className="flex-1 text-foreground">{shortName(party)}</span>
              <span className="font-mono text-xs text-muted-foreground">{seats} · {pct}%</span>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground/60 mt-3">
        This is the Senate&apos;s overall composition, not any individual state&apos;s — no verified
        senator-to-state dataset exists yet (see the map above).
      </p>
    </div>
  )
}

// ─── Senate division result — MajorityResult previously rendered numbers
//     computed entirely from senateBillVoteRows, a hand-authored dataset
//     (fabricated vote splits attached to real senator names). No real
//     Senate division reaches this component through any wired path today
//     (confirmed: ChamberSummaryCard only ever passes selectedBillId, never
//     real bills/voteMatrix, into <SenateView>). Show the truthful gap
//     instead of a number that looks verified but isn't. ───────────────────

function SenateDivisionResult({ hasBillSelected }: { hasBillSelected: boolean }) {
  if (!hasBillSelected) return null
  return (
    <div className="pt-4 border-t border-border/40">
      <p className="text-xs font-semibold text-muted-foreground mb-1">Senate result</p>
      <p className="text-sm text-muted-foreground">
        No verified Senate division data is available for this item.
      </p>
    </div>
  )
}

// ─── SenateView ───────────────────────────────────────────────────────────────

interface SenateViewProps {
  selectedBillId: string | null
  showLiveResults?: boolean
  liveElection?: LiveElectionSnapshot | null
}

export function SenateView({ selectedBillId, showLiveResults = false, liveElection = null }: SenateViewProps) {
  const { data } = useLiveParliamentMembers()
  const totalSeats = data?.senate.total ?? TOTAL_SENATE_SEATS

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-card overflow-hidden select-none shadow-xl">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-white/[0.06]">
        <p className="text-sm font-semibold text-foreground tracking-tight">Senate</p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5">
          {totalSeats} senators · {SENATE_MAJORITY} for majority
          {data?.syncedAt ? ` · updated ${new Date(data.syncedAt).toLocaleDateString('en-AU')}` : ''}
        </p>
      </div>

      <div className="p-5 space-y-5">
        <AustraliaSenateMap liveElection={liveElection} showLiveResults={showLiveResults} />

        <NationalCompositionSection />

        <SenateDivisionResult hasBillSelected={!!selectedBillId} />
      </div>
    </div>
  )
}
