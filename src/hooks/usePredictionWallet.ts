'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Position } from '@/hooks/useWallet'
import { isSupabaseConfigured } from '@/lib/supabase-config'

interface DBWalletRow {
  balance: number
}

interface DBWalletPosition {
  id: string
  market_id: string
  market_question: string
  category: string
  direction: 'yes' | 'no'
  amount: number
  price: number
  shares: number | string
  status: 'open' | 'won' | 'lost'
  payout: number | null
  created_at: string
}

interface PredictionWalletState {
  authenticated: boolean
  hydrated: boolean
  balance: number
  positions: Position[]
}

const INITIAL_STATE: PredictionWalletState = {
  authenticated: false,
  hydrated: false,
  balance: 0,
  positions: [],
}

const configured = isSupabaseConfigured

function mapPosition(row: DBWalletPosition): Position {
  return {
    id: row.id,
    marketId: row.market_id,
    marketQuestion: row.market_question,
    category: row.category,
    direction: row.direction,
    amount: row.amount,
    price: row.price,
    shares: Number(row.shares),
    status: row.status,
    payout: row.payout ?? undefined,
    timestamp: new Date(row.created_at).getTime(),
  }
}

export function usePredictionWallet() {
  const [state, setState] = useState<PredictionWalletState>(INITIAL_STATE)

  useEffect(() => {
    if (!configured) {
      setState({
        authenticated: false,
        hydrated: true,
        balance: 0,
        positions: [],
      })
      return
    }

    let cancelled = false
    const supabase = createClient()
    let loadVersion = 0
    let walletChannelCleanup: (() => Promise<void>) | undefined
    let positionsChannelCleanup: (() => Promise<void>) | undefined

    async function loadWallet() {
      const version = ++loadVersion
      await Promise.all([
        walletChannelCleanup?.(),
        positionsChannelCleanup?.(),
      ])
      walletChannelCleanup = undefined
      positionsChannelCleanup = undefined

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!cancelled && version === loadVersion) {
          setState({
            authenticated: false,
            hydrated: true,
            balance: 0,
            positions: [],
          })
        }
        return
      }

      const walletLookup = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle()
      const walletRow = walletLookup.data as DBWalletRow | null

      if (!walletRow) {
        await supabase.from('user_wallets').insert({ user_id: user.id })
      }

      const [nextWalletRes, positionsRes] = await Promise.all([
        supabase
          .from('user_wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('wallet_positions')
          .select('id, market_id, market_question, category, direction, amount, price, shares, status, payout, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .returns<DBWalletPosition[]>(),
      ])
      const nextWallet = nextWalletRes.data as DBWalletRow | null
      const positions = positionsRes.data ?? []

      // getUser(), the initial data fetch and an auth-state notification can
      // overlap. Only the newest load may publish state or subscribe.
      if (cancelled || version !== loadVersion) return

      setState({
        authenticated: true,
        hydrated: true,
        balance: nextWallet?.balance ?? 0,
        positions: positions.map(mapPosition),
      })

      const refresh = async () => {
        const [updatedWalletRes, updatedPositionsRes] = await Promise.all([
          supabase
            .from('user_wallets')
            .select('balance')
            .eq('user_id', user.id)
            .single(),
          supabase
            .from('wallet_positions')
            .select('id, market_id, market_question, category, direction, amount, price, shares, status, payout, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .returns<DBWalletPosition[]>(),
        ])
        const updatedWallet = updatedWalletRes.data as DBWalletRow | null
        const updatedPositions = updatedPositionsRes.data ?? []

        if (!cancelled) {
          setState({
            authenticated: true,
            hydrated: true,
            balance: updatedWallet?.balance ?? 0,
            positions: updatedPositions.map(mapPosition),
          })
        }
      }

      const walletChannel = supabase
        .channel(`wallet:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_wallets',
            filter: `user_id=eq.${user.id}`,
          },
          () => { void refresh() }
        )
        .subscribe()

      const positionsChannel = supabase
        .channel(`wallet-positions:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallet_positions',
            filter: `user_id=eq.${user.id}`,
          },
          () => { void refresh() }
        )
        .subscribe()

      walletChannelCleanup = async () => {
        await supabase.removeChannel(walletChannel)
      }
      positionsChannelCleanup = async () => {
        await supabase.removeChannel(positionsChannel)
      }
    }

    void loadWallet()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void loadWallet()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
      void walletChannelCleanup?.()
      void positionsChannelCleanup?.()
    }
  }, [])

  const placeStake = useCallback(async (params: {
    marketId: string
    marketQuestion: string
    category: string
    direction: 'yes' | 'no'
    amount: number
    price: number
  }) => {
    const supabase = createClient()

    // Optimistic, non-authoritative check purely for a clearer error message.
    // place_wallet_stake's own is_market_open() check (see migration 017) is
    // what actually enforces this — this call can't be relied on for
    // security since a client could skip it and call the RPC directly.
    const { data: isOpen, error: eligibilityError } = await supabase.rpc('is_market_open', {
      p_issue_id: params.marketId,
    })
    if (!eligibilityError && isOpen === false) {
      throw new Error('This market is not open for staking.')
    }

    const { error } = await supabase.rpc('place_wallet_stake', {
      p_market_id: params.marketId,
      p_market_question: params.marketQuestion,
      p_category: params.category,
      p_direction: params.direction,
      p_amount: params.amount,
      p_price: Math.round(params.price),
    })

    if (error) {
      throw new Error(error.message)
    }

    return true
  }, [])

  const openPositions = useMemo(
    () => state.positions.filter(position => position.status === 'open'),
    [state.positions]
  )
  const closedPositions = useMemo(
    () => state.positions.filter(position => position.status !== 'open'),
    [state.positions]
  )
  const totalStaked = useMemo(
    () => openPositions.reduce((sum, position) => sum + position.amount, 0),
    [openPositions]
  )
  const totalPotential = useMemo(
    () => openPositions.reduce((sum, position) => sum + position.shares, 0),
    [openPositions]
  )

  return {
    authenticated: state.authenticated,
    hydrated: state.hydrated,
    balance: state.balance,
    positions: state.positions,
    openPositions,
    closedPositions,
    totalStaked,
    totalPotential,
    placeStake,
  }
}
