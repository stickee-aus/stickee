'use client'

import { useState, useEffect } from 'react'
import { LeaderboardGrid } from '@/components/LeaderboardGrid'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'
import { useStreak } from '@/hooks/useStreak'

const RANK_KEY    = 'stickee:last-known-rank'
const MOCK_RANK   = 14 // Demo: user is rank 14

function RankDelta() {
  const [delta, setDelta] = useState<number | null>(null)

  useEffect(() => {
    try {
      const last = localStorage.getItem(RANK_KEY)
      if (last) {
        const prev = parseInt(last, 10)
        setDelta(prev - MOCK_RANK) // positive = moved up
      }
      localStorage.setItem(RANK_KEY, String(MOCK_RANK))
    } catch { /* ignore */ }
  }, [])

  if (delta === null) return null

  return (
    <div className="flex items-center gap-1 font-mono text-xs">
      {delta > 0 ? (
        <>
          <TrendingUp className="h-3.5 w-3.5" style={{ color: '#2ec266' }} />
          <span style={{ color: '#2ec266' }}>↑ {delta} spot{delta !== 1 ? 's' : ''}</span>
        </>
      ) : delta < 0 ? (
        <>
          <TrendingDown className="h-3.5 w-3.5" style={{ color: '#f04747' }} />
          <span style={{ color: '#f04747' }}>↓ {Math.abs(delta)} spot{Math.abs(delta) !== 1 ? 's' : ''}</span>
        </>
      ) : (
        <>
          <Minus className="h-3.5 w-3.5" style={{ color: '#5a5a5e' }} />
          <span style={{ color: '#5a5a5e' }}>No change</span>
        </>
      )}
    </div>
  )
}

export default function LeaderboardPage() {
  const { balance, openPositions, hydrated } = useWallet()
  const { streak } = useStreak()

  return (
    <div className="mx-auto max-w-5xl px-6">

      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-6 py-10 border-b border-border">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Australia · Prediction Leaderboard
          </p>
          <div className="flex items-baseline gap-3">
            <span
              className="font-mono font-normal leading-none text-foreground"
              style={{ fontSize: 'clamp(40px, 8vw, 56px)', letterSpacing: '-0.02em' }}
            >
              #{MOCK_RANK}
            </span>
            <span className="font-mono text-xl text-muted-foreground/40">your rank</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <p className="font-mono text-xs text-muted-foreground">Make predictions on bills to climb</p>
            <RankDelta />
          </div>
        </div>

        {/* Your stats */}
        <div className="hidden sm:flex items-end gap-6 pb-1">
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1 text-foreground">
              {hydrated ? balance.toLocaleString() : '—'}
            </p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>pts balance</p>
          </div>
          <div className="w-px h-8 bg-border mb-1" />
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1" style={{ color: '#f5a623' }}>
              {streak.count}d
            </p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>streak</p>
          </div>
          <div className="w-px h-8 bg-border mb-1" />
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1 text-foreground">{openPositions.length}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>open stakes</p>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="py-8">
        <LeaderboardGrid />
      </div>
    </div>
  )
}
