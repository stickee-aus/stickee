'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Zap, CheckCircle, XCircle, Clock, ChevronRight, Users, ThumbsUp, ThumbsDown } from 'lucide-react'
import { billVoteRows, type BillVoteRow } from '@/lib/mock-parliament-data'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Sparkline({ data, rising }: { data: number[]; rising: boolean }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const W = 56
  const H = 22
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 2) + 1}`)
    .join(' ')
  const color = rising ? '#22c55e' : '#ef4444'
  return (
    <svg width={W} height={H} className="overflow-visible shrink-0">
      <defs>
        <linearGradient id={`sg-${rising}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function StatusIcon({ status }: { status: BillVoteRow['status'] }) {
  if (status === 'passed')  return <CheckCircle size={13} className="text-emerald-400 shrink-0" />
  if (status === 'failed')  return <XCircle size={13} className="text-red-400 shrink-0" />
  return <Clock size={13} className="text-amber-400 shrink-0" />
}

const STATUS_LABEL: Record<BillVoteRow['status'], string> = {
  passed:  'Passed',
  failed:  'Failed',
  ongoing: 'Active',
}

// ─── Bill vote breakdown bar ──────────────────────────────────────────────────

function VoteBar({ bill }: { bill: BillVoteRow }) {
  const total = bill.totalFor + bill.totalAgainst + bill.totalAbstain || 1
  const forPct     = (bill.totalFor     / total) * 100
  const againstPct = (bill.totalAgainst / total) * 100
  const abstainPct = (bill.totalAbstain / total) * 100

  return (
    <div>
      <div className="flex rounded-full overflow-hidden h-1.5 gap-px">
        <div className="bg-emerald-500 transition-all duration-500 shrink-0" style={{ width: `${forPct}%` }} />
        <div className="bg-gray-600  transition-all duration-500 shrink-0" style={{ width: `${abstainPct}%` }} />
        <div className="bg-red-500   transition-all duration-500 shrink-0" style={{ width: `${againstPct}%` }} />
      </div>
      <div className="flex gap-3 mt-1.5">
        <span className="text-[10px] text-emerald-400">{bill.totalFor} for</span>
        <span className="text-[10px] text-red-400">{bill.totalAgainst} against</span>
        {bill.totalAbstain > 0 && (
          <span className="text-[10px] text-muted-foreground">{bill.totalAbstain} absent</span>
        )}
      </div>
    </div>
  )
}

// ─── Party support chips ──────────────────────────────────────────────────────

const PARTY_CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  'Labor':       { bg: '#E5393520', text: '#ff6b6b' },
  'Coalition':   { bg: '#1565C020', text: '#60a5fa' },
  'Greens':      { bg: '#2E7D3220', text: '#4ade80' },
  'Independent': { bg: '#EC407A20', text: '#f472b6' },
  'Centre Alliance': { bg: '#F9A82520', text: '#fbbf24' },
  "Katter's Australian Party": { bg: '#4E342E20', text: '#a78bfa' },
  'One Nation':  { bg: '#FF6F0020', text: '#fb923c' },
}

function PartyChips({ bill }: { bill: BillVoteRow }) {
  const forParties     = Object.values(bill.parties).filter(p => p.direction === 'for')
  const againstParties = Object.values(bill.parties).filter(p => p.direction === 'against')

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {forParties.map(p => {
          const c = PARTY_CHIP_COLORS[p.party] ?? { bg: '#99999920', text: '#999' }
          return (
            <span
              key={p.party}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ backgroundColor: c.bg, color: c.text }}
            >
              ✓ {p.party.replace("Katter's Australian Party", 'KAP').replace('Centre Alliance', 'CA')}
            </span>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-1">
        {againstParties.map(p => {
          const c = PARTY_CHIP_COLORS[p.party] ?? { bg: '#99999920', text: '#999' }
          return (
            <span
              key={p.party}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded opacity-60"
              style={{ backgroundColor: c.bg, color: c.text }}
            >
              ✗ {p.party.replace("Katter's Australian Party", 'KAP').replace('Centre Alliance', 'CA')}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─── Probability meter ────────────────────────────────────────────────────────

function ProbabilityMeter({ value, change }: { value: number; change: number }) {
  const rising = change >= 0
  const color = value >= 60 ? '#22c55e' : value >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <div
        className="text-xl font-bold tabular-nums leading-none"
        style={{ color }}
      >
        {value}%
      </div>
      <div className={`flex items-center gap-0.5 text-[10px] font-medium ${rising ? 'text-emerald-400' : 'text-red-400'}`}>
        {rising ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {change > 0 ? '+' : ''}{change.toFixed(1)} pp
      </div>
      <div className="text-[9px] text-muted-foreground/60">probability</div>
    </div>
  )
}

// ─── Bill Card ────────────────────────────────────────────────────────────────

interface BillCardProps {
  bill: BillVoteRow
  isSelected: boolean
  onSelect: (id: string | null) => void
  userVote: 'yes' | 'no' | null
  onUserVote: (billId: string, v: 'yes' | 'no') => void
}

function BillCard({ bill, isSelected, onSelect, userVote, onUserVote }: BillCardProps) {
  const rising = bill.change >= 0
  const isOngoing = bill.status === 'ongoing'

  return (
    <div
      className={`group rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        isSelected
          ? 'border-primary/60 bg-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/20'
          : 'border-border/50 bg-card/60 hover:border-border hover:bg-card/80'
      }`}
      onClick={() => onSelect(isSelected ? null : bill.id)}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <StatusIcon status={bill.status} />
              <span
                className={`text-[10px] font-medium ${
                  bill.status === 'passed'  ? 'text-emerald-400' :
                  bill.status === 'failed'  ? 'text-red-400' :
                  'text-amber-400'
                }`}
              >
                {STATUS_LABEL[bill.status]}
              </span>
              {isOngoing && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Zap size={9} className="text-primary" />
                  Live
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
              {bill.name}
            </h3>
          </div>

          {/* Probability + sparkline */}
          <div className="flex items-center gap-3 shrink-0">
            <Sparkline data={bill.sparkline} rising={rising} />
            <ProbabilityMeter value={bill.publicPrediction} change={bill.change} />
          </div>
        </div>

        {/* Vote breakdown bar */}
        <VoteBar bill={bill} />

        {/* Volume row */}
        <div className="flex items-center gap-1 mt-2">
          <Users size={10} className="text-muted-foreground/60" />
          <span className="text-[10px] text-muted-foreground/60">
            {bill.volume.toLocaleString()} predictions
          </span>
          <ChevronRight size={10} className={`ml-auto transition-transform ${isSelected ? 'rotate-90 text-primary' : 'text-muted-foreground/40'}`} />
        </div>
      </div>

      {/* Expanded section */}
      {isSelected && (
        <div className="border-t border-border/40 bg-muted/20 p-4 space-y-4">
          <PartyChips bill={bill} />

          {/* User prediction row (only for ongoing bills) */}
          {isOngoing && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Your Prediction</p>
              <div className="flex gap-2">
                <button
                  onClick={e => { e.stopPropagation(); onUserVote(bill.id, 'yes') }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    userVote === 'yes'
                      ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40 shadow-sm shadow-emerald-500/10'
                      : 'bg-muted/40 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-400'
                  }`}
                >
                  <ThumbsUp size={12} />
                  Will Pass
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onUserVote(bill.id, 'no') }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    userVote === 'no'
                      ? 'bg-red-500/20 text-red-400 ring-1 ring-red-400/40 shadow-sm shadow-red-500/10'
                      : 'bg-muted/40 text-muted-foreground hover:bg-red-500/10 hover:text-red-400'
                  }`}
                >
                  <ThumbsDown size={12} />
                  Will Fail
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── BillTracker component ────────────────────────────────────────────────────

interface BillTrackerProps {
  selectedBillId: string | null
  onSelectBill: (id: string | null) => void
}

export function BillTracker({ selectedBillId, onSelectBill }: BillTrackerProps) {
  const [userVotes, setUserVotes] = useState<Record<string, 'yes' | 'no'>>({})
  const [filter, setFilter] = useState<'all' | 'ongoing' | 'passed'>('all')

  const filteredBills = billVoteRows.filter(b => {
    if (filter === 'ongoing') return b.status === 'ongoing'
    if (filter === 'passed')  return b.status === 'passed'
    return true
  })

  function handleUserVote(billId: string, v: 'yes' | 'no') {
    setUserVotes(prev => ({
      ...prev,
      [billId]: prev[billId] === v ? undefined! : v,
    }))
  }

  const ongoingCount = billVoteRows.filter(b => b.status === 'ongoing').length

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Active Bills</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ongoingCount} live · Predict outcomes &amp; see how your MPs vote
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex rounded-lg border border-border/50 overflow-hidden text-xs">
          {(['all', 'ongoing', 'passed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 capitalize font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/30 text-muted-foreground hover:bg-muted/60'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Bill cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredBills.map(bill => (
          <BillCard
            key={bill.id}
            bill={bill}
            isSelected={selectedBillId === bill.id}
            onSelect={onSelectBill}
            userVote={userVotes[bill.id] ?? null}
            onUserVote={handleUserVote}
          />
        ))}
      </div>

      {selectedBillId && (
        <p className="mt-3 text-center text-[11px] text-primary/70 font-medium">
          ↓ Seat colours in the chamber below show how each MP is expected to vote
        </p>
      )}
    </div>
  )
}
