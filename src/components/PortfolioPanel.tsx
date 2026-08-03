'use client'

import { useState } from 'react'
import { Coins, TrendingUp, TrendingDown, RefreshCw, ChevronDown } from 'lucide-react'
import type { Position } from '@/hooks/useWallet'
import { STARTING_BALANCE } from '@/hooks/useWallet'

// ─── Category pill ────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  bill:      '#5a5a5e',
  civic:     '#f5a623',
  election:  '#3b82f6',
  'mp-vote': '#a855f7',
}

function CategoryPill({ category }: { category: string }) {
  return (
    <span
      className="font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm"
      style={{ color: CAT_COLORS[category] ?? '#5a5a5e', border: `1px solid ${CAT_COLORS[category] ?? '#5a5a5e'}30` }}
    >
      {category === 'mp-vote' ? 'MP' : category}
    </span>
  )
}

// ─── Position card ────────────────────────────────────────────────────────────

function PositionCard({ position }: { position: Position }) {
  const isYes   = position.direction === 'yes'
  const accent  = isYes ? '#2ec266' : '#f04747'
  const profit  = position.shares - position.amount
  const isOpen  = position.status === 'open'

  return (
    <div
      className="rounded-xl p-3 border space-y-2"
      style={{
        background: '#0a0a0b',
        borderColor: isOpen ? '#1e1e20' : position.status === 'won' ? '#2ec26618' : '#f0474718',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <CategoryPill category={position.category} />
            <span
              className="font-mono text-[9px] tracking-widest uppercase"
              style={{ color: accent }}
            >
              {isYes ? '▲ YES' : '▼ NO'}
            </span>
            {!isOpen && (
              <span
                className="font-mono text-[9px] tracking-widest uppercase"
                style={{ color: position.status === 'won' ? '#2ec266' : '#f04747' }}
              >
                {position.status === 'won' ? '✓ WON' : '✗ LOST'}
              </span>
            )}
          </div>
          <p className="text-xs text-foreground/80 leading-snug line-clamp-2">{position.marketQuestion}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: '#1e1e20' }}>
        <div className="space-y-0.5">
          <p className="font-mono text-[9px]" style={{ color: '#5a5a5e' }}>
            Staked · Bought @ {position.price}¢
          </p>
          <p className="font-mono text-xs text-foreground">{position.amount.toLocaleString()} pts</p>
        </div>
        <div className="text-right space-y-0.5">
          <p className="font-mono text-[9px]" style={{ color: '#5a5a5e' }}>
            {isOpen ? 'If correct' : 'Profit'}
          </p>
          <div className="flex items-center justify-end gap-1">
            {profit > 0
              ? <TrendingUp size={10} style={{ color: '#2ec266' }} />
              : <TrendingDown size={10} style={{ color: '#f04747' }} />
            }
            <p className="font-mono text-xs" style={{ color: profit > 0 ? '#2ec266' : '#f04747' }}>
              {profit > 0 ? '+' : ''}{profit.toLocaleString()} pts
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyPositions() {
  return (
    <div className="py-10 text-center">
      <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
        No open positions
      </p>
      <p className="font-mono text-[10px] mt-1" style={{ color: '#2a2a2e' }}>
        Stake on a market below to get started
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface PortfolioPanelProps {
  balance: number
  openPositions: Position[]
  closedPositions: Position[]
  totalStaked: number
  totalPotential: number
  onReset?: () => void
}

export function PortfolioPanel({
  balance,
  openPositions,
  closedPositions,
  totalStaked,
  totalPotential,
  onReset,
}: PortfolioPanelProps) {
  const [showClosed, setShowClosed] = useState(false)

  const pnlRealized = closedPositions.reduce((sum, p) => {
    if (p.status === 'won') return sum + (p.shares - p.amount)
    return sum - p.amount
  }, 0)

  const netChange = balance - STARTING_BALANCE + totalStaked
  const netColor  = netChange >= 0 ? '#2ec266' : '#f04747'

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: '#111113', borderColor: '#1e1e20' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: '#1e1e20' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coins size={14} style={{ color: '#5a5a5e' }} />
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#5a5a5e' }}>
              Your Wallet
            </span>
          </div>
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 font-mono text-[9px] tracking-widest uppercase px-2 py-1 rounded transition-colors"
              style={{ color: '#3a3a3e', background: '#1e1e20' }}
              title="Reset wallet"
            >
              <RefreshCw size={9} />
              Reset
            </button>
          )}
        </div>

        {/* Balance strip */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="font-mono text-[9px] tracking-widest uppercase mb-1" style={{ color: '#3a3a3e' }}>Balance</p>
            <p className="font-mono text-xl font-normal text-foreground">{balance.toLocaleString()}</p>
            <p className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>pts available</p>
          </div>
          <div>
            <p className="font-mono text-[9px] tracking-widest uppercase mb-1" style={{ color: '#3a3a3e' }}>In markets</p>
            <p className="font-mono text-xl font-normal text-foreground">{totalStaked.toLocaleString()}</p>
            <p className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>pts staked</p>
          </div>
          <div>
            <p className="font-mono text-[9px] tracking-widest uppercase mb-1" style={{ color: '#3a3a3e' }}>If all win</p>
            <p className="font-mono text-xl font-normal" style={{ color: '#2ec266' }}>{Math.round(totalPotential).toLocaleString()}</p>
            <p className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>pts payout</p>
          </div>
        </div>

        {/* Net P&L bar */}
        {(netChange !== 0 || pnlRealized !== 0) && (
          <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: '#1e1e20' }}>
            <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Net P&amp;L</span>
            <span className="font-mono text-xs" style={{ color: netColor }}>
              {netChange >= 0 ? '+' : ''}{netChange.toLocaleString()} pts
            </span>
          </div>
        )}
      </div>

      {/* Open positions */}
      <div className="px-5 py-4">
        <p className="font-mono text-[9px] tracking-widest uppercase mb-3" style={{ color: '#3a3a3e' }}>
          Open positions ({openPositions.length})
        </p>
        {openPositions.length === 0 ? (
          <EmptyPositions />
        ) : (
          <div className="space-y-2">
            {openPositions.map(p => <PositionCard key={p.id} position={p} />)}
          </div>
        )}
      </div>

      {/* Closed positions (collapsible) */}
      {closedPositions.length > 0 && (
        <div className="px-5 pb-4 border-t" style={{ borderColor: '#1e1e20' }}>
          <button
            onClick={() => setShowClosed(v => !v)}
            className="flex items-center gap-1.5 py-3 w-full text-left"
          >
            <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
              Resolved ({closedPositions.length})
            </span>
            <ChevronDown
              size={11}
              style={{ color: '#3a3a3e', transform: showClosed ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
            />
          </button>
          {showClosed && (
            <div className="space-y-2">
              {closedPositions.map(p => <PositionCard key={p.id} position={p} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
