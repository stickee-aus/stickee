"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { getVotesForIssue, MPs, PARTY_COLORS } from '@/lib/mock-data'
import { mpExtendedIndex } from '@/lib/mock-market-data'
import { ChevronUp, ChevronDown, Search, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'party' | 'electorate' | 'vote' | 'stickeeScore'
type SortDir = 'asc' | 'desc'

interface MPRow {
  mpId: string
  name: string
  party: string
  electorate: string
  vote: 'yes' | 'no' | 'abstain'
  stickeeScore: number
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

function VoteBadge({ vote }: { vote: 'yes' | 'no' | 'abstain' }) {
  if (vote === 'yes') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
      <CheckCircle2 className="h-3 w-3" /> Yes
    </span>
  )
  if (vote === 'no') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
      <XCircle className="h-3 w-3" /> No
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <MinusCircle className="h-3 w-3" /> Abstain
    </span>
  )
}

function AccuracyBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-400' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{score}%</span>
    </div>
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

export function MPVoteGrid({ issueId }: { issueId: string }) {
  const [search, setSearch] = useState('')
  const [partyFilter, setPartyFilter] = useState('All')
  const [sortKey, setSortKey] = useState<SortKey>('vote')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [userPicks, setUserPicks] = useState<Record<string, 'yes' | 'no' | null>>({})

  const issueVotes = useMemo(() => getVotesForIssue(issueId), [issueId])
  const voteMap = useMemo(() => Object.fromEntries(issueVotes.map(v => [v.mpId, v.vote])), [issueVotes])

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
      vote: (voteMap[mp.id] ?? 'abstain') as 'yes' | 'no' | 'abstain',
      stickeeScore: mpExtendedIndex[mp.id]?.stickeeScore ?? 50,
      userPick: userPicks[mp.id] ?? null,
    }))

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r => r.name.toLowerCase().includes(q) || r.electorate.toLowerCase().includes(q))
    }
    if (partyFilter !== 'All') {
      result = result.filter(r => r.party === partyFilter)
    }

    const voteOrder = { yes: 0, no: 1, abstain: 2 }
    result.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'vote') cmp = voteOrder[a.vote] - voteOrder[b.vote]
      else if (sortKey === 'stickeeScore') cmp = a.stickeeScore - b.stickeeScore
      else cmp = (a[sortKey] as string).localeCompare(b[sortKey] as string)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [search, partyFilter, sortKey, sortDir, voteMap, userPicks])

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
          <h2 className="font-semibold text-foreground">MP Votes & Your Predictions</h2>
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
                <SortTh col="vote" label="MP Vote" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="stickeeScore" label="Accuracy" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
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
                          <p className="text-xs opacity-80">Accuracy: {row.stickeeScore}%</p>
                          <p className="text-xs opacity-80">
                            Votes with majority {row.stickeeScore}% of the time
                          </p>
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
                    <VoteBadge vote={row.vote} />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <AccuracyBar score={row.stickeeScore} />
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
