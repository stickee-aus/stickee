'use client'

import { useState, useMemo } from 'react'
import { X, ChevronUp, ChevronDown } from 'lucide-react'
import { MPs as mockMPs, PARTY_COLORS } from '@/lib/mock-data'
import type { MP } from '@/types'
import {
  billVoteRows as mockBillVoteRows,
  MP_STATES as mockMPStates,
  getMPVoteForBill as mockGetMPVoteForBill,
  getPartyAlignment as mockGetPartyAlignment,
} from '@/lib/mock-parliament-data'
import type { BillVoteRow } from '@/lib/mock-parliament-data'

// ─── Types ────────────────────────────────────────────────────────────────────
// Note: this table intentionally has no "public alignment" column — no real
// public-opinion data source exists for any bill (no polling table, no linked
// market), so there is nothing truthful to compute it from. Do not reintroduce
// one without a real source behind it.

type VoteValue = 'for' | 'against' | 'absent'
type SortKey = 'name' | 'vote' | 'partyAlign'
type SortDir = 'asc' | 'desc'

interface DrillRow {
  mp: MP
  vote: VoteValue
  partyAlign: number
  isSwing: boolean
  state: string
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const VOTE_STYLES: Record<VoteValue, { label: string; cls: string }> = {
  for:     { label: 'For',     cls: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' },
  against: { label: 'Against', cls: 'text-red-400    bg-red-400/10    border border-red-400/20' },
  absent:  { label: 'Absent',  cls: 'text-muted-foreground bg-muted/20 border border-border/40' },
}

function AlignBar({ value, swing }: { value: number; swing?: boolean }) {
  if (value === 50) return <span className="text-muted-foreground">—</span>
  const color = value === 100 ? 'bg-emerald-400' : swing ? 'bg-amber-400' : 'bg-red-400'
  const textColor = value === 100 ? 'text-emerald-400' : swing ? 'text-amber-400' : 'text-red-400'
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-[11px] font-bold ${textColor}`}>{value}%</span>
      <div className="w-10 h-0.5 rounded-full bg-white/8 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function SortTh({
  label,
  sk,
  sortKey,
  sortDir,
  onSort,
  className = 'text-center',
}: {
  label: string
  sk: SortKey
  sortKey: SortKey
  sortDir: SortDir
  onSort: (k: SortKey) => void
  className?: string
}) {
  const active = sortKey === sk
  return (
    <th
      className={`px-3 py-2.5 cursor-pointer select-none ${className}`}
      onClick={() => onSort(sk)}
    >
      <span
        className={`inline-flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wider transition-colors ${
          active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {label}
        {active ? (
          sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-25" />
        )}
      </span>
    </th>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface MPDrilldownTableProps {
  billId: string
  onClose: () => void
  members?: MP[]
  bills?: BillVoteRow[]
  memberStates?: Record<string, string>
  /** Pre-computed vote matrix for this bill: mpId → 'for'|'against'|'absent' */
  voteMap?: Record<string, 'for' | 'against' | 'absent'>
}

export function MPDrilldownTable({
  billId,
  onClose,
  members,
  bills,
  memberStates,
  voteMap,
}: MPDrilldownTableProps) {
  const useRealData = !!members && !!voteMap
  const billVoteRows = bills ?? mockBillVoteRows
  const MP_STATES = memberStates ?? mockMPStates
  const MPs = members ?? mockMPs

  const bill = billVoteRows.find(b => b.id === billId)

  const [partyFilter, setPartyFilter] = useState('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [swingOnly, setSwingOnly]   = useState(false)
  const [sortKey, setSortKey]       = useState<SortKey>('partyAlign')
  const [sortDir, setSortDir]       = useState<SortDir>('asc')

  // With real data, all fetched members are "named"; with mock, filter by state entry
  const namedMPs = useRealData ? MPs : MPs.filter(mp => mp.id in MP_STATES)
  const allParties = [...new Set(namedMPs.map(m => m.party))].sort()
  const allStates  = [...new Set(namedMPs.map(m => MP_STATES[m.id]).filter(Boolean))].sort()

  const rows = useMemo<DrillRow[]>(() => {
    let list: DrillRow[] = namedMPs.map(mp => {
      let vote: VoteValue
      let partyAlign: number

      if (useRealData && voteMap) {
        vote = voteMap[mp.id] ?? 'absent'
        // Simple alignment: did MP vote with majority direction?
        const partyVote = bill?.parties[mp.party]
        const partyDir = partyVote?.direction
        if (partyDir === 'for')     partyAlign = vote === 'for'     ? 100 : vote === 'absent' ? 50 : 0
        else if (partyDir === 'against') partyAlign = vote === 'against' ? 100 : vote === 'absent' ? 50 : 0
        else if (partyDir === 'abstain') partyAlign = vote === 'absent'  ? 100 : 50
        else partyAlign = 50 // split or unknown
      } else {
        vote = mockGetMPVoteForBill(mp.id, billId)
        partyAlign = mockGetPartyAlignment(mp.id, billId)
      }

      return {
        mp,
        vote,
        partyAlign,
        isSwing: partyAlign < 100,
        state: MP_STATES[mp.id] ?? '—',
      }
    })

    if (partyFilter !== 'all') list = list.filter(r => r.mp.party === partyFilter)
    if (stateFilter !== 'all') list = list.filter(r => r.state === stateFilter)
    if (swingOnly)             list = list.filter(r => r.isSwing)

    list.sort((a, b) => {
      let av: number | string
      let bv: number | string
      switch (sortKey) {
        case 'name':        av = a.mp.name;    bv = b.mp.name;    break
        case 'vote':        av = a.vote;       bv = b.vote;       break
        case 'partyAlign':  av = a.partyAlign; bv = b.partyAlign; break
        default:            av = 0; bv = 0
      }
      if (typeof av === 'string') {
        const cmp = av.localeCompare(bv as string)
        return sortDir === 'asc' ? cmp : -cmp
      }
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })

    return list
  }, [MP_STATES, bill?.parties, billId, namedMPs, partyFilter, sortDir, sortKey, stateFilter, swingOnly, useRealData, voteMap])

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
  }

  const swingCount = useRealData && voteMap
    ? namedMPs.filter(mp => {
        const vote = voteMap![mp.id] ?? 'absent'
        const partyDir = bill?.parties[mp.party]?.direction
        if (!partyDir || partyDir === 'split') return false
        return (partyDir === 'for' && vote !== 'for') || (partyDir === 'against' && vote !== 'against')
      }).length
    : namedMPs.filter(mp => mockGetPartyAlignment(mp.id, billId) < 100).length

  if (!bill) return null

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            MP Votes — {bill.name}
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {namedMPs.length} named MPs · {swingCount} swing vote{swingCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          aria-label="Close drilldown"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-2.5 border-b border-border/40 bg-muted/10">
        <select
          className="text-xs rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-foreground"
          value={partyFilter}
          onChange={e => setPartyFilter(e.target.value)}
        >
          <option value="all">All parties</option>
          {allParties.map(p => (
            <option key={p} value={p}>
              {p.replace("Katter's Australian Party", 'KAP').replace('Centre Alliance', 'CA')}
            </option>
          ))}
        </select>

        <select
          className="text-xs rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-foreground"
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
        >
          <option value="all">All states</option>
          {allStates.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button
          className={`text-xs rounded-md border px-2.5 py-1.5 font-medium transition-colors ${
            swingOnly
              ? 'border-amber-500/60 bg-amber-400/10 text-amber-400'
              : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
          onClick={() => setSwingOnly(v => !v)}
        >
          Swing MPs only {swingOnly && `(${swingCount})`}
        </button>

        <span className="ml-auto text-[11px] text-muted-foreground">{rows.length} shown</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-72">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border/40 bg-muted/20">
              <SortTh
                label="MP"
                sk="name"
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                className="text-left px-5 py-2.5"
              />
              <th className="text-left px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Party
              </th>
              <th className="text-left px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                State
              </th>
              <SortTh label="Vote"         sk="vote"        sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <SortTh label="Party align"  sk="partyAlign"  sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/25">
            {rows.map(({ mp, vote, partyAlign, isSwing, state }) => {
              const vStyle = VOTE_STYLES[vote]
              const partyColor = PARTY_COLORS[mp.party] ?? '#999'
              return (
                <tr
                  key={mp.id}
                  className={`transition-colors hover:bg-accent/20 ${isSwing ? 'bg-amber-500/5' : ''}`}
                >
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {isSwing && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0"
                          title="Voted against party line"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{mp.name}</p>
                        <p className="text-[10px] text-muted-foreground">{mp.electorate}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-2.5">
                    <span
                      className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: `${partyColor}1a`, color: partyColor }}
                    >
                      {mp.party
                        .replace("Katter's Australian Party", 'KAP')
                        .replace('Centre Alliance', 'CA')}
                    </span>
                  </td>

                  <td className="px-3 py-2.5 text-muted-foreground">{state}</td>

                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex rounded px-2 py-0.5 font-semibold ${vStyle.cls}`}>
                      {vStyle.label}
                    </span>
                  </td>

                  <td className="px-3 py-2.5 text-center">
                    <AlignBar value={partyAlign} swing={isSwing} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No MPs match the current filters.
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-5 py-2 border-t border-border/40 bg-muted/10">
        <p className="text-[10px] text-muted-foreground">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 mr-1" />
          Amber dot indicates a swing MP who voted against their party&apos;s position.
          {!useRealData && ' Demo data — individual votes are inferred from party position, not individually recorded.'}
        </p>
      </div>
    </div>
  )
}
