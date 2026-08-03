'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  allMarkets,
  leaderboard,
  type PredictionMarket,
  type MarketCategory,
} from '@/lib/mock-market-data'
import { type IssueMarketRecord, mapIssueMarketRecordToPredictionMarket } from '@/lib/issues-data'
import { usePredictionWallet } from '@/hooks/usePredictionWallet'
import { StakeModal } from '@/components/StakeModal'
import { PortfolioPanel } from '@/components/PortfolioPanel'
import { ProposeMarketModal, loadProposals, type MarketProposal } from '@/components/ProposeMarketModal'
import { useToast } from '@/components/ui/toast'
import { useLiveElection } from '@/hooks/useLiveElection'
import { LiveElectionPulse } from '@/components/LiveElectionPulse'
import { RecentRehearsalsStrip } from '@/components/simulator/RecentRehearsalsStrip'
import { FeaturedMarketCard } from '@/components/FeaturedMarketCard'
import { CATEGORY_COLORS, CATEGORY_LABELS, MarketCard } from '@/components/MarketCard'
import { getMarketEligibility, selectFeaturedMarket } from '@/lib/market-eligibility'

type CategoryFilter = 'all' | MarketCategory | 'custom'
type StatusFilter = 'active' | 'resolved' | 'all'

interface StakeTarget {
  market: PredictionMarket
  direction: 'yes' | 'no'
}

const STATIC_NON_BILL_MARKETS = allMarkets.filter(market => market.category !== 'bill')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const configured = !!(SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http'))

function LeaderCard({ user }: { user: typeof leaderboard[number] }) {
  const isTop3 = user.rank <= 3
  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-center gap-3">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs"
          style={{ color: isTop3 ? '#f5a623' : '#5a5a5e', background: '#1e1e20' }}
        >
          {user.rank}
        </span>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-medium"
          style={{ background: '#1e1e20', color: '#e8e8e6' }}
        >
          {user.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            {user.points.toLocaleString()} pts
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3">
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Accuracy</p>
          <p className="font-mono text-sm text-[#2ec266]">{user.accuracy}%</p>
        </div>
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Markets</p>
          <p className="font-mono text-sm text-foreground">{user.predictions}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Streak</p>
          <p className="font-mono text-sm text-foreground">{user.streak}d</p>
        </div>
      </div>
    </div>
  )
}

function ProposalCard({ proposal }: { proposal: MarketProposal }) {
  const catKey = proposal.category === 'custom' ? null : (proposal.category as MarketCategory)
  const catColor = catKey ? CATEGORY_COLORS[catKey] : '#f5a623'
  const catLabel = catKey ? CATEGORY_LABELS[catKey] : 'CUSTOM'

  return (
    <article className="rounded-lg border border-dashed border-[#f5a62340] bg-[#f5a62308] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span
          className="rounded-full px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase"
          style={{ color: catColor, border: `1px solid ${catColor}40`, background: '#0a0a0b70' }}
        >
          {catLabel}
        </span>
        <span className="rounded-full border border-[#f5a62330] px-2.5 py-1 font-mono text-[9px] tracking-widest uppercase text-[#f5a623]">
          Pending Review
        </span>
      </div>
      <h3 className="text-base font-medium leading-snug text-foreground/80">{proposal.question}</h3>
      <p className="mt-2 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
        Resolves {proposal.resolvesBy}
      </p>
      {proposal.description && (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {proposal.description}
        </p>
      )}
    </article>
  )
}

export function PredictionsPageClient({ initialBillMarkets }: { initialBillMarkets: PredictionMarket[] }) {
  const [billMarkets, setBillMarkets] = useState(initialBillMarkets)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [stakeTarget, setStakeTarget] = useState<StakeTarget | null>(null)
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [proposeOpen, setProposeOpen] = useState(false)
  const [proposals, setProposals] = useState<MarketProposal[]>([])
  const { data: liveElection } = useLiveElection()

  useEffect(() => {
    setBillMarkets(initialBillMarkets)
  }, [initialBillMarkets])

  useEffect(() => {
    setProposals(loadProposals())
  }, [])

  useEffect(() => {
    if (!configured) return

    let channelCleanup: (() => void) | undefined

    async function subscribe() {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()

      const channel = supabase
        .channel('prediction-bill-markets')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'issue_markets',
          },
          payload => {
            const row = payload.new as IssueMarketRecord | undefined
            if (!row?.issue_id) return

            setBillMarkets(prev => {
              const next = prev.filter(market => market.id !== row.issue_id)
              next.unshift(mapIssueMarketRecordToPredictionMarket(row))
              return next
            })
          }
        )
        .subscribe()

      channelCleanup = () => {
        supabase.removeChannel(channel)
      }
    }

    void subscribe()

    return () => {
      channelCleanup?.()
    }
  }, [])

  const { toast } = useToast()
  const wallet = usePredictionWallet()
  const markets = useMemo(
    () => [...billMarkets, ...STATIC_NON_BILL_MARKETS],
    [billMarkets]
  )

  function handleStake(market: PredictionMarket, direction: 'yes' | 'no') {
    // Defense in depth: the market boards already hide stake controls for
    // ineligible markets (see market-eligibility.ts), but this is the single
    // choke point both MarketCard and FeaturedMarketCard call through, so it
    // guards against a future regression reintroducing an ungated button.
    // The server-side is_market_open() check remains the real authority.
    if (!getMarketEligibility(market).canStake) {
      toast('This market is not open for staking.', 'error')
      return
    }
    if (!wallet.authenticated) {
      toast('Sign in to place a stake and track real wallet positions.', 'error')
      return
    }
    setStakeTarget({ market, direction })
  }

  async function handleConfirmStake(amount: number) {
    if (!stakeTarget) return
    const { market, direction } = stakeTarget
    const price = direction === 'yes' ? market.probability : 100 - market.probability

    try {
      await wallet.placeStake({
        marketId: market.id,
        marketQuestion: market.question,
        category: market.category,
        direction,
        amount,
        price,
      })
      toast(`Staked ${amount.toLocaleString()} pts on ${direction.toUpperCase()} · ${market.question.slice(0, 40)}…`, 'success')
      setShowPortfolio(true)
      setStakeTarget(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to place stake'
      toast(message, 'error')
    }
  }

  const stakedMarketIds = useMemo(
    () => new Set(wallet.openPositions.map(position => position.marketId)),
    [wallet.openPositions]
  )

  const filtered = useMemo<(PredictionMarket | MarketProposal)[]>(() => {
    if (categoryFilter === 'custom') return proposals

    return markets.filter(market => {
      const catOk = categoryFilter === 'all' || market.category === categoryFilter
      const statusOk =
        statusFilter === 'all' ||
        (statusFilter === 'active' && market.status === 'active') ||
        (statusFilter === 'resolved' && market.status !== 'active')
      return catOk && statusOk
    })
  }, [categoryFilter, statusFilter, markets, proposals])

  const activeCount = markets.filter(market => market.status === 'active').length
  const featuredMarket = useMemo(() => selectFeaturedMarket(markets), [markets])
  const visibleMarkets = useMemo(
    () => categoryFilter === 'custom'
      ? []
      : (filtered as PredictionMarket[]).filter(market => market.id !== featuredMarket?.id),
    [categoryFilter, filtered, featuredMarket?.id]
  )

  const categoryFilters: Array<{ key: CategoryFilter; label: string }> = [
    { key: 'all', label: 'All Markets' },
    { key: 'bill', label: 'Bills' },
    { key: 'election', label: 'Elections' },
    { key: 'mp-vote', label: 'MP Votes' },
    { key: 'civic', label: 'Civic' },
    { key: 'custom', label: `Proposed${proposals.length > 0 ? ` (${proposals.length})` : ''}` },
  ]

  const statusFilters: Array<{ key: StatusFilter; label: string }> = [
    { key: 'active', label: 'Active' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex items-end justify-between gap-6 py-10 border-b border-border">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Australia · Prediction Markets
          </p>
          <div className="flex items-baseline gap-3">
            <span
              className="font-mono font-normal leading-none text-foreground"
              style={{ fontSize: 'clamp(40px, 8vw, 56px)', letterSpacing: '-0.02em' }}
            >
              {activeCount}
            </span>
            <span className="font-mono text-xl text-muted-foreground/40">markets</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-2" style={{ letterSpacing: '0.03em' }}>
            Community-forecasted · Virtual points · Entertainment only
          </p>
        </div>

        <div className="hidden sm:flex items-end gap-6 pb-1">
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1 text-foreground">
              {wallet.authenticated && wallet.hydrated ? wallet.balance.toLocaleString() : '—'}
            </p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
              {wallet.authenticated ? 'pts balance' : 'sign in for wallet'}
            </p>
          </div>
          <div className="w-px h-8 bg-border mb-1" />
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1 text-foreground">
              {wallet.authenticated ? wallet.openPositions.length : 0}
            </p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Open</p>
          </div>
          {!wallet.authenticated && (
            <>
              <div className="w-px h-8 bg-border mb-1" />
              <Link
                href="/auth/sign-in"
                className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded transition-all mb-1"
                style={{ background: '#e8e8e6', color: '#0a0a0b' }}
              >
                Sign in
              </Link>
            </>
          )}
          <div className="w-px h-8 bg-border mb-1" />
          <button
            onClick={() => setProposeOpen(true)}
            className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded transition-all mb-1"
            style={{ background: '#e8e8e6', color: '#0a0a0b' }}
          >
            + Propose
          </button>
          <button
            onClick={() => setShowPortfolio(value => !value)}
            className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded transition-all mb-1"
            style={{
              background: showPortfolio ? '#1e1e20' : 'transparent',
              color: showPortfolio ? '#e8e8e6' : '#5a5a5e',
              border: '1px solid #1e1e20',
            }}
          >
            {showPortfolio ? 'Hide wallet' : 'Show wallet'}
          </button>
        </div>
      </div>

      <LiveElectionPulse snapshot={liveElection} />

      <div className="mt-6">
        <RecentRehearsalsStrip variant="compact" limit={3} />
      </div>

      {featuredMarket && (
        <div className="mt-6">
          <FeaturedMarketCard
            market={featuredMarket}
            hasPosition={stakedMarketIds.has(featuredMarket.id)}
            onStake={handleStake}
          />
        </div>
      )}

      {showPortfolio && (
        <div className="mt-6">
          {wallet.authenticated && wallet.hydrated ? (
            <PortfolioPanel
              balance={wallet.balance}
              openPositions={wallet.openPositions}
              closedPositions={wallet.closedPositions}
              totalStaked={wallet.totalStaked}
              totalPotential={wallet.totalPotential}
            />
          ) : (
            <div className="rounded-2xl border p-6" style={{ background: '#111113', borderColor: '#1e1e20' }}>
              <p className="font-mono text-xs text-muted-foreground">
                Sign in to see your real wallet balance and open positions.
              </p>
              <Link
                href="/auth/sign-in"
                className="inline-block mt-4 font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded"
                style={{ background: '#e8e8e6', color: '#0a0a0b' }}
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between py-4 border-b border-border gap-4 flex-wrap mt-6">
        <div className="flex items-center gap-0 flex-wrap">
          {categoryFilters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className="font-mono text-[10px] tracking-widest uppercase px-4 py-2 transition-colors border-b-2"
              style={{
                color: categoryFilter === key ? '#e8e8e6' : '#5a5a5e',
                borderColor: categoryFilter === key ? '#e8e8e6' : 'transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {statusFilters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className="font-mono text-[10px] tracking-widest uppercase transition-colors"
              style={{ color: statusFilter === key ? '#e8e8e6' : '#5a5a5e' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Market board
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              Fast-scanning civic forecasts
            </h2>
          </div>
          <p className="hidden font-mono text-[10px] tracking-widest uppercase text-muted-foreground sm:block">
            Yes probability · 24h move · volume
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-card py-16 text-center font-mono text-xs text-muted-foreground">
            {categoryFilter === 'custom'
              ? 'No proposals yet - click "+ Propose" to submit one'
              : 'No markets match this filter'}
          </div>
        ) : categoryFilter === 'custom' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(filtered as MarketProposal[]).map(proposal => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleMarkets.map(market => (
              <MarketCard
                key={market.id}
                market={market}
                hasPosition={stakedMarketIds.has(market.id)}
                onStake={handleStake}
                liveElection={liveElection}
              />
            ))}
          </div>
        )}

        <p className="font-mono text-[10px] text-muted-foreground mt-4">
          {filtered.length} market{filtered.length !== 1 ? 's' : ''} · Points are virtual and for entertainment only
        </p>
      </div>

      <div className="pb-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Leaderboard
            </p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">Top predictors this week</h2>
          </div>
          <Link
            href="/leaderboard"
            className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {leaderboard.slice(0, 6).map(user => (
            <LeaderCard key={user.id} user={user} />
          ))}
        </div>
      </div>

      {stakeTarget && (
        <StakeModal
          market={stakeTarget.market}
          direction={stakeTarget.direction}
          balance={wallet.balance}
          onConfirm={amount => { void handleConfirmStake(amount) }}
          onClose={() => setStakeTarget(null)}
        />
      )}

      <ProposeMarketModal
        open={proposeOpen}
        onOpenChange={setProposeOpen}
        onSubmitted={proposal => {
          setProposals(prev => [proposal, ...prev])
          setCategoryFilter('custom')
          toast('Market proposed! Pending community review.', 'success')
        }}
      />
    </div>
  )
}
