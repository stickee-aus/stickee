'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, TrendingUp, TrendingDown, Coins } from 'lucide-react'
import type { PredictionMarket } from '@/lib/mock-market-data'
import { getMarketEligibility, nonTradeableLabel } from '@/lib/market-eligibility'

// ─── Quick-amount presets ─────────────────────────────────────────────────────

const PRESETS = [50, 100, 250, 500]

// ─── Category labels ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  bill:      'BILL',
  civic:     'CIVIC',
  election:  'ELECTION',
  'mp-vote': 'MP VOTE',
}

// ─── Main component ───────────────────────────────────────────────────────────

interface StakeModalProps {
  market: PredictionMarket
  direction: 'yes' | 'no'
  balance: number
  onConfirm: (amount: number) => void
  onClose: () => void
}

export function StakeModal({ market, direction, balance, onConfirm, onClose }: StakeModalProps) {
  const [amount, setAmount] = useState(100)
  const [inputValue, setInputValue] = useState('100')
  const [confirming, setConfirming] = useState(false)

  const price    = direction === 'yes' ? market.probability : (100 - market.probability)
  const shares   = price > 0 ? Math.round((amount / price) * 100 * 10) / 10 : 0
  const payout   = shares          // 1 share = 1 pt if correct
  const profit   = payout - amount
  const profitPct = amount > 0 ? Math.round((profit / amount) * 100) : 0
  const isYes    = direction === 'yes'
  const accent   = isYes ? 'var(--status-positive)' : 'var(--status-negative)'
  const hasSufficientAmount = amount > 0 && amount <= balance
  // Defense in depth only — the boards that open this modal already filter
  // to eligible markets (see market-eligibility.ts), and is_market_open()
  // server-side is the real authority. This just stops a future regression
  // from letting the modal submit for a market it shouldn't have opened for.
  const marketEligibility = getMarketEligibility(market)
  const canStake = hasSufficientAmount && marketEligibility.canStake

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleInputChange = useCallback((raw: string) => {
    setInputValue(raw)
    const parsed = parseInt(raw.replace(/\D/g, ''), 10)
    if (!isNaN(parsed)) setAmount(Math.min(parsed, balance))
  }, [balance])

  const handlePreset = useCallback((val: number) => {
    const clamped = Math.min(val, balance)
    setAmount(clamped)
    setInputValue(String(clamped))
  }, [balance])

  const handleConfirm = useCallback(() => {
    if (!canStake) return
    setConfirming(true)
    setTimeout(() => {
      onConfirm(amount)
      onClose()
    }, 420)
  }, [canStake, amount, onConfirm, onClose])

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-sm rounded-2xl border overflow-hidden shadow-2xl"
        style={{ background: 'var(--paper-raised)', borderColor: 'var(--line)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
          style={{ color: 'var(--ink-muted)' }}
          aria-label="Close"
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5"
              style={{ color: 'var(--ink-muted)', border: '1px solid var(--line)' }}
            >
              {CATEGORY_LABELS[market.category] ?? market.category}
            </span>
            <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: accent }}>
              {isYes ? '▲ YES' : '▼ NO'}
            </span>
          </div>
          <p className="text-sm text-foreground leading-snug pr-6">{market.question}</p>
          <p className="font-mono text-[10px] mt-1.5" style={{ color: 'var(--ink-muted)' }}>
            Resolves {market.resolvesBy}
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Current price */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--ink-muted)' }}>
              {isYes ? 'Yes' : 'No'} price
            </span>
            <span className="font-mono text-lg font-normal" style={{ color: accent }}>
              {price}¢
            </span>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: 'var(--ink-muted)' }}>
                Stake (pts)
              </span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--ink-muted)' }}>
                Balance: {balance.toLocaleString()} pts
              </span>
            </div>
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 border"
              style={{ background: 'var(--paper)', borderColor: 'var(--line)' }}
            >
              <Coins size={13} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
              <input
                type="text"
                inputMode="numeric"
                value={inputValue}
                onChange={e => handleInputChange(e.target.value)}
                className="flex-1 bg-transparent font-mono text-sm text-foreground outline-none min-w-0"
                placeholder="0"
              />
              <button
                onClick={() => handlePreset(balance)}
                className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 rounded transition-colors"
                style={{ color: 'var(--ink-muted)', background: 'var(--muted)' }}
              >
                Max
              </button>
            </div>

            {/* Quick presets */}
            <div className="flex gap-1.5 mt-2">
              {PRESETS.map(p => (
                <button
                  key={p}
                  onClick={() => handlePreset(p)}
                  disabled={p > balance}
                  className="flex-1 font-mono text-[10px] py-1 rounded transition-colors disabled:opacity-30"
                  style={{
                    background: amount === p ? 'var(--ink)' : 'transparent',
                    color: amount === p ? 'var(--paper)' : 'var(--ink-muted)',
                    border: `1px solid ${amount === p ? 'var(--ink)' : 'var(--line)'}`,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Payout breakdown */}
          <div className="rounded-lg p-3 space-y-2" style={{ background: 'var(--paper)', border: '1px solid var(--line)' }}>
            <div className="flex justify-between">
              <span className="font-mono text-[10px]" style={{ color: 'var(--ink-muted)' }}>Shares</span>
              <span className="font-mono text-[10px] text-foreground">{shares.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[10px]" style={{ color: 'var(--ink-muted)' }}>If correct</span>
              <span className="font-mono text-[10px]" style={{ color: accent }}>+{payout.toLocaleString()} pts</span>
            </div>
            <div className="flex justify-between border-t pt-2" style={{ borderColor: 'var(--line)' }}>
              <span className="font-mono text-[10px]" style={{ color: 'var(--ink-muted)' }}>Potential profit</span>
              <div className="flex items-center gap-1">
                {profit > 0
                  ? <TrendingUp size={11} style={{ color: 'var(--status-positive)' }} />
                  : <TrendingDown size={11} style={{ color: 'var(--status-negative)' }} />
                }
                <span className="font-mono text-[10px]" style={{ color: profit > 0 ? 'var(--status-positive)' : 'var(--status-negative)' }}>
                  {profit > 0 ? '+' : ''}{profit.toLocaleString()} pts ({profitPct > 0 ? '+' : ''}{profitPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={!canStake || confirming}
            className="w-full py-3 rounded-xl font-mono text-xs tracking-widest uppercase font-medium transition-all disabled:opacity-40"
            style={{
              background: canStake ? accent : 'var(--muted)',
              color: canStake ? 'var(--paper)' : 'var(--ink-muted)',
            }}
          >
            {confirming ? 'Placing...' : `Stake ${amount.toLocaleString()} pts on ${isYes ? 'YES' : 'NO'}`}
          </button>

          {!marketEligibility.canStake && (
            <p className="font-mono text-[10px] text-center" style={{ color: 'var(--status-negative)' }}>
              {nonTradeableLabel(market.status)} — this market cannot be staked
            </p>
          )}
          {marketEligibility.canStake && !hasSufficientAmount && amount > balance && (
            <p className="font-mono text-[10px] text-center" style={{ color: 'var(--status-negative)' }}>
              Insufficient balance
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
