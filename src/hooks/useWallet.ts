'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Position {
  id: string
  marketId: string
  marketQuestion: string
  category: string
  direction: 'yes' | 'no'
  amount: number       // points spent
  price: number        // price at stake time (0–100)
  shares: number       // amount / price * 100
  status: 'open' | 'won' | 'lost'
  payout?: number
  timestamp: number
}

interface WalletState {
  balance: number
  positions: Position[]
  lastDailyBonusDate: string | null // 'YYYY-MM-DD'
  totalEarned: number
  totalStakedAllTime: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const STARTING_BALANCE  = 5_000
export const DAILY_BONUS_PTS   = 100
export const REFERRAL_BONUS    = 250
const STORAGE_KEY              = 'stickee_wallet_v2'

// ─── Persistence helpers ──────────────────────────────────────────────────────

function load(): WalletState {
  if (typeof window === 'undefined') return { balance: STARTING_BALANCE, positions: [], lastDailyBonusDate: null, totalEarned: 0, totalStakedAllTime: 0 }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WalletState>
      return {
        balance:             parsed.balance              ?? STARTING_BALANCE,
        positions:           parsed.positions            ?? [],
        lastDailyBonusDate:  parsed.lastDailyBonusDate  ?? null,
        totalEarned:         parsed.totalEarned          ?? 0,
        totalStakedAllTime:  parsed.totalStakedAllTime   ?? 0,
      }
    }
    // Migrate from v1
    const oldRaw = localStorage.getItem('stickee_wallet_v1')
    if (oldRaw) {
      const old = JSON.parse(oldRaw) as { balance?: number; positions?: Position[] }
      return {
        balance:            old.balance    ?? STARTING_BALANCE,
        positions:          old.positions  ?? [],
        lastDailyBonusDate: null,
        totalEarned:        0,
        totalStakedAllTime: 0,
      }
    }
  } catch { /* ignore */ }
  return { balance: STARTING_BALANCE, positions: [], lastDailyBonusDate: null, totalEarned: 0, totalStakedAllTime: 0 }
}

function persist(state: WalletState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    balance: STARTING_BALANCE,
    positions: [],
    lastDailyBonusDate: null,
    totalEarned: 0,
    totalStakedAllTime: 0,
  })
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    setWallet(load())
    setHydrated(true)
  }, [])

  /** Claim daily bonus (100 pts). Returns pts awarded or 0 if already claimed today. */
  const claimDailyBonus = useCallback((): number => {
    const today = todayStr()
    let awarded = 0
    setWallet(prev => {
      if (prev.lastDailyBonusDate === today) return prev // already claimed
      const next: WalletState = {
        ...prev,
        balance:            prev.balance + DAILY_BONUS_PTS,
        lastDailyBonusDate: today,
        totalEarned:        prev.totalEarned + DAILY_BONUS_PTS,
      }
      persist(next)
      awarded = DAILY_BONUS_PTS
      return next
    })
    return awarded
  }, [])

  /** Check if daily bonus is available today */
  const canClaimDaily = wallet.lastDailyBonusDate !== todayStr()

  /** Add arbitrary points (referrals, milestones, etc.) */
  const addPoints = useCallback((amount: number): void => {
    setWallet(prev => {
      const next: WalletState = {
        ...prev,
        balance:     prev.balance + amount,
        totalEarned: prev.totalEarned + amount,
      }
      persist(next)
      return next
    })
  }, [])

  /** Deduct points (e.g. for streak freeze purchase). Returns false if insufficient. */
  const deductPoints = useCallback((amount: number): boolean => {
    let ok = false
    setWallet(prev => {
      if (prev.balance < amount) return prev
      const next: WalletState = { ...prev, balance: prev.balance - amount }
      persist(next)
      ok = true
      return next
    })
    return ok
  }, [])

  /** Place a stake. Returns false if insufficient balance. */
  const placeStake = useCallback((params: {
    marketId: string
    marketQuestion: string
    category: string
    direction: 'yes' | 'no'
    amount: number
    price: number
  }): boolean => {
    let succeeded = false
    setWallet(prev => {
      if (prev.balance < params.amount || params.amount <= 0) return prev
      const shares = Math.round((params.amount / params.price) * 100 * 10) / 10
      const position: Position = {
        id: `${params.marketId}-${params.direction}-${Date.now()}`,
        marketId: params.marketId,
        marketQuestion: params.marketQuestion,
        category: params.category,
        direction: params.direction,
        amount: params.amount,
        price: params.price,
        shares,
        status: 'open',
        timestamp: Date.now(),
      }
      const next: WalletState = {
        ...prev,
        balance:            prev.balance - params.amount,
        positions:          [position, ...prev.positions],
        totalStakedAllTime: prev.totalStakedAllTime + params.amount,
      }
      persist(next)
      succeeded = true
      return next
    })
    return succeeded
  }, [])

  /** Reset wallet back to starting balance (for demo purposes) */
  const resetWallet = useCallback(() => {
    const fresh: WalletState = {
      balance: STARTING_BALANCE,
      positions: [],
      lastDailyBonusDate: null,
      totalEarned: 0,
      totalStakedAllTime: 0,
    }
    persist(fresh)
    setWallet(fresh)
  }, [])

  const openPositions   = wallet.positions.filter(p => p.status === 'open')
  const closedPositions = wallet.positions.filter(p => p.status !== 'open')
  const totalStaked     = openPositions.reduce((sum, p) => sum + p.amount, 0)
  const totalPotential  = openPositions.reduce((sum, p) => sum + p.shares, 0)

  return {
    balance: wallet.balance,
    positions: wallet.positions,
    openPositions,
    closedPositions,
    totalStaked,
    totalPotential,
    totalEarned: wallet.totalEarned,
    totalStakedAllTime: wallet.totalStakedAllTime,
    canClaimDaily,
    hydrated,
    claimDailyBonus,
    addPoints,
    deductPoints,
    placeStake,
    resetWallet,
  }
}
