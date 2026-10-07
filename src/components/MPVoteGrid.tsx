"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { MPs, PARTY_COLORS } from '@/lib/mock-data'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

// ─── Types ────────────────────────────────────────────────────────────────────
//
// This grid used to show each MP's actual vote on the current issue, sourced
// from getVotesForIssue()/PARTY_VOTE_MAP in mock-data.ts. That map assigns
// every MP of a party the same yes/no/abstain vote on a handful of
// illustrative mock issues — not this MP's actual recorded division vote —
// and rendered it as if it were the real Hansard record: the same defect
// already removed from /mp/[id] (see PEOPLE_TRUTHFULNESS_BATCH_REPORT.md)
// and from calculateStickeeScore() (see
// docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md). Removed per
// STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md. Real per-MP votes exist in
// member_votes/divisions (synced via /api/sync/divisions) but are not yet
// wired to this grid — that requires the MP id-scheme reconciliation scoped
// in PAGE_REFACTOR_ROADMAP.md's Batch 4/13.
//
// Sorting now covers name/party/electorate only. The crowd "implied
// probability" readout is unaffected — it's computed purely from other
// users' own predictions, never from a fabricated ground-truth vote.

type SortKey = 'name' | 'party' | 'electorate'
type SortDir = 'asc' | 'desc'

interface MPRow {
  mpId: string
  name: string
  party: string
  electorate: string
  userPick: 'yes' | 'no' | null
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PartyDot({ party }: { party: string }) {
  const color = PARTY_COLORS[party] ?? '#9ca3af'
  return (
    <span
      className="inline-block h-2 w-2 rounded-full shrink-0"
      style={{ backgroundColor: color }}
      title={party}
    />
  )
}

function PickButtons({
  userPick,
  onPick,
}: {
  userPick: 'yes' | 'no' | null
  onPick: (v: 'yes' | 'no' | null) => void
}) {
  return (
    <div className="flex gap-1">
      <button
        onClick={e => { e.preventDefault(); onPick(userPick === 'yes' ? null : 'yes') }}
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all ${
          userPick === 'yes'
            ? 'bg-green-500 text-white'
            : 'bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/40 dark:hover:text-green-300'
        }`}
      >
        Yes
      </button>
      <button
        onClick={e => { e.preventDefault(); onPick(userPick === 'no' ? null : 'no') }}
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all ${
          userPick === 'no'
            ? 'bg-red-500 text-white'
            : 'bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/40 dark:hover:text-red-300'
        }`}
      >
        No
      </button>
    </div>
  )
}

function SortTh({
  col, label, sortKey, sortDir, onSort, className = '',
}: {
  col: SortKey; label: string; sortKey: SortKey; sortDir: SortDir
  onSort: (c: SortKey) => void; className?: string
}) {
  return (
    <th
      className={`cursor-pointer select-none px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap ${className}`}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {col === sortKey
          ? sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-primary" />
          : <ChevronUp className="h-3.5 w-3.5 opacity-20" />}
      </span>
    </th>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MPVoteGrid({ issueId: _issueId }: { issueId: string }) {
  const [search, setSearch] = useState('')
  const [partyFilter, setPartyFilter] = useState('All')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [userPicks, setUserPicks] = useState<Record<string, 'yes' | 'no' | null>>({})

  const parties = useMemo(() => {
    const set = new Set(MPs.map(mp => mp.party))
    return ['All', ...Array.from(set)]
  }, [])

  const rows: MPRow[] = useMemo(() => {
    let result = MPs.map(mp => ({
      mpId: mp.id,
      name: mp.name,
      party: mp.party,
      electorate: mp.electorate,
      userPick: userPicks[mp.id] ?? null,
    }))

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r => r.name.toLowerCase().includes(q) || r.electorate.toLowerCase().includes(q))
    }
    if (partyFilter !== 'All') {
      result = result.filter(r => r.party === partyFilter)
    }

    result.sort((a, b) => {
      const cmp = a[sortKey].localeCompare(b[sortKey])
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [search, partyFilter, sortKey, sortDir, userPicks])

  function handleSort(col: SortKey) {
    if (col === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(col); setSortDir('asc') }
  }

  function setPick(mpId: string, v: 'yes' | 'no' | null) {
    setUserPicks(prev => ({ ...prev, [mpId]: v }))
  }

  // Live probability update from user picks
  const totalPicks = Object.values(userPicks).filter(v => v !== null).length
  const yesPicks = Object.values(userPicks).filter(v => v === 'yes').length
  const liveProbability = totalPicks > 0 ? Math.round((yesPicks / totalPicks) * 100) : null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">MP Predictions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click Yes/No to predict how each MP will vote. Predictions update probability in real time.
          </p>
        </div>
        {liveProbability !== null && (
          <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-accent px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Your implied probability:</span>
            <span className={`text-sm font-bold ${liveProbability >= 50 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {liveProbability}%
            </span>
          </div>
        )}
      </div>

      {/* Truthfulness note — real per-MP vote data isn't wired in yet */}
      <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/20 px-3 py-2">
        Individual voting analysis is being verified against the real parliamentary record. This list shows
        MP name, party and electorate only.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search MP or electorate…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {parties.map(p => (
            <button
              key={p}
              onClick={() => setPartyFilter(p)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                partyFilter === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {p === "Katter's Australian Party" ? "KAP" : p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <SortTh col="name" label="MP" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-40" />
                <SortTh col="party" label="Party" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                <SortTh col="electorate" label="Electorate" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                  Predict
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(row => (
                <tr key={row.mpId} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <Tooltip>
                      <TooltipTrigger>
                        <Link
                          href={`/mp/${row.mpId}`}
                          className="inline-flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: PARTY_COLORS[row.party] ?? '#9ca3af' }}
                          >
                            {row.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <span className="font-medium text-foreground">{row.name}</span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-48">
                        <div className="space-y-1">
                          <p className="font-semibold">{row.name}</p>
                          <p className="text-xs opacity-80">{row.party} · {row.electorate}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <PartyDot party={row.party} />
                      {row.party === "Katter's Australian Party" ? 'KAP' : row.party}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">{row.electorate}</span>
                  </td>
                  <td className="px-4 py-3">
                    <PickButtons userPick={row.userPick} onPick={v => setPick(row.mpId, v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-4 py-2.5 bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {rows.length} MPs shown · {Object.values(userPicks).filter(v => v === 'yes').length} predicted Yes · {Object.values(userPicks).filter(v => v === 'no').length} predicted No
          </p>
        </div>
      </div>
    </div>
  )
}
