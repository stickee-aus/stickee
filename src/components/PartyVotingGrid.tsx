'use client'

import { useState } from 'react'
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  billVoteRows as mockBillVoteRows,
  type BillVoteRow,
  type PartyBillVote,
  type VoteDirection,
} from '@/lib/mock-parliament-data'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PARTIES = ['Labor', 'Coalition', 'Greens', 'Independent']

const VOTE_STYLES: Record<VoteDirection, { label: string; cls: string; dot: string }> = {
  for:     { label: 'For',     cls: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20', dot: 'bg-emerald-400' },
  against: { label: 'Against', cls: 'text-red-400    bg-red-400/10    border border-red-400/20',     dot: 'bg-red-400' },
  split:   { label: 'Split',   cls: 'text-amber-400  bg-amber-400/10  border border-amber-400/20',   dot: 'bg-amber-400' },
  abstain: { label: 'Abstain', cls: 'text-muted-foreground bg-muted/20 border border-border/40',     dot: 'bg-muted-foreground' },
}

type SortKey = 'controversy' | 'closeness' | 'publicPrediction' | 'change' | 'name'

// ─── Sub-components ───────────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const W = 48
  const H = 20
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`)
    .join(' ')
  const rising = data[data.length - 1] >= data[0]
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke={rising ? '#34d399' : '#f87171'}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function StatusBadge({ status }: { status: BillVoteRow['status'] }) {
  const map: Record<BillVoteRow['status'], string> = {
    passed:  'text-emerald-400 bg-emerald-400/10',
    failed:  'text-red-400    bg-red-400/10',
    ongoing: 'text-amber-400  bg-amber-400/10',
  }
  const labels: Record<BillVoteRow['status'], string> = {
    passed: 'Passed', failed: 'Failed', ongoing: 'Live',
  }
  return (
    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[status]}`}>
      {labels[status]}
    </span>
  )
}

function VoteCell({ vote }: { vote: PartyBillVote }) {
  const style = VOTE_STYLES[vote.direction]
  return (
    <Tooltip>
      <TooltipTrigger
        className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold cursor-default select-none ${style.cls}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        {style.label}
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="space-y-1 text-xs">
          <div className="flex gap-3">
            <span className="text-emerald-400">For: {vote.forCount}</span>
            <span className="text-red-400">Against: {vote.againstCount}</span>
            {vote.abstainCount > 0 && (
              <span className="text-muted-foreground">Abstain: {vote.abstainCount}</span>
            )}
          </div>
          {vote.keyMPs.length > 0 && (
            <p className="text-muted-foreground leading-snug max-w-[200px]">
              {vote.keyMPs.join(' · ')}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function SortBtn({
  label,
  sk,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string
  sk: SortKey
  currentSort: SortKey
  currentDir: 'asc' | 'desc'
  onSort: (k: SortKey) => void
}) {
  const active = currentSort === sk
  return (
    <button
      className={`flex items-center gap-0.5 text-[11px] font-medium uppercase tracking-wider transition-colors ${
        active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
      onClick={() => onSort(sk)}
    >
      {label}
      {active ? (
        currentDir === 'asc' ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )
      ) : (
        <ChevronDown className="h-3 w-3 opacity-25" />
      )}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PartyVotingGridProps {
  selectedBillId: string | null
  onSelectBill: (id: string | null) => void
  bills?: BillVoteRow[]
  /** Override which party columns to show (defaults to House parties) */
  parties?: string[]
}

export function PartyVotingGrid({ selectedBillId, onSelectBill, bills, parties }: PartyVotingGridProps) {
  const billVoteRows = bills ?? mockBillVoteRows
  const PARTIES_TO_SHOW = parties ?? DEFAULT_PARTIES
  const [sortKey, setSortKey] = useState<SortKey>('controversy')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...billVoteRows].sort((a, b) => {
    if (sortKey === 'name') {
      return sortDir === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    }
    const vals: Record<SortKey, (r: BillVoteRow) => number> = {
      controversy:      r => r.controversy,
      closeness:        r => -Math.abs(r.publicPrediction - 50),
      publicPrediction: r => r.publicPrediction,
      change:           r => r.change,
      name:             () => 0,
    }
    const av = vals[sortKey](a)
    const bv = vals[sortKey](b)
    return sortDir === 'asc' ? av - bv : bv - av
  })

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-1">Party Voting Grid</h2>
          <p className="text-[11px] text-muted-foreground">
            Hover a cell for exact counts · Click a row to drill down to MP level
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <span className="uppercase tracking-wider mr-1">Sort:</span>
          <SortBtn label="Controversy" sk="controversy" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <span className="text-border/60">·</span>
          <SortBtn label="Closest call" sk="closeness" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <span className="text-border/60">·</span>
          <SortBtn label="% Yes" sk="publicPrediction" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
          <span className="text-border/60">·</span>
          <SortBtn label="Change" sk="change" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20">
              <th className="text-left px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Bill
              </th>
              {PARTIES_TO_SHOW.map(p => (
                <th
                  key={p}
                  className="text-center px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                >
                  {p}
                </th>
              ))}
              <th className="text-center px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="text-center px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                % Yes
              </th>
              <th className="text-center px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                14d
              </th>
              <th className="text-right px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Δ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/25">
            {sorted.map(bill => {
              const selected = selectedBillId === bill.id
              return (
                <tr
                  key={bill.id}
                  className={`cursor-pointer transition-colors group ${
                    selected
                      ? 'bg-primary/8 border-l-2 border-l-primary'
                      : 'hover:bg-accent/20'
                  }`}
                  onClick={() => onSelectBill(selected ? null : bill.id)}
                >
                  {/* Bill name */}
                  <td className="px-5 py-3">
                    <p className={`font-semibold leading-tight mb-0.5 transition-colors ${selected ? 'text-primary' : 'text-foreground group-hover:text-foreground'}`}>
                      {bill.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {bill.totalFor} For · {bill.totalAgainst} Against
                      {bill.totalAbstain > 0 ? ` · ${bill.totalAbstain} Abstain` : ''}
                    </p>
                  </td>

                  {/* Party vote cells */}
                  {PARTIES_TO_SHOW.map(party => (
                    <td key={party} className="px-3 py-3 text-center">
                      {bill.parties[party] ? (
                        <VoteCell vote={bill.parties[party]} />
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  ))}

                  {/* Status */}
                  <td className="px-3 py-3 text-center">
                    <StatusBadge status={bill.status} />
                  </td>

                  {/* Public prediction */}
                  <td className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold tabular-nums text-foreground">{bill.publicPrediction}%</span>
                      <div className="w-14 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${bill.publicPrediction >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${bill.publicPrediction}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Sparkline */}
                  <td className="px-3 py-3 text-center">
                    <div className="flex justify-center">
                      <Sparkline data={bill.sparkline} />
                    </div>
                  </td>

                  {/* Change */}
                  <td className="px-5 py-3 text-right">
                    {bill.change > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-400 font-semibold">
                        <TrendingUp className="h-3 w-3" />
                        +{bill.change.toFixed(1)}
                      </span>
                    ) : bill.change < 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-red-400 font-semibold">
                        <TrendingDown className="h-3 w-3" />
                        {bill.change.toFixed(1)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                        <Minus className="h-3 w-3" />0.0
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 px-5 py-2.5 border-t border-border/40 bg-muted/10">
        {(Object.entries(VOTE_STYLES) as [VoteDirection, typeof VOTE_STYLES[VoteDirection]][]).map(([dir, s]) => (
          <div key={dir} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${s.dot}`} />
            <span className="text-[11px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
        <span className="ml-auto text-[11px] text-muted-foreground/60">
          Volume shows total market participants
        </span>
      </div>
    </div>
  )
}
