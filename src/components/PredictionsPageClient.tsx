'use client'

import { useMemo, useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  allMarkets,
  type PredictionMarket,
  type MarketCategory,
} from '@/lib/mock-market-data'
import { type IssueMarketRecord, mapIssueMarketRecordToPredictionMarket } from '@/lib/issues-data'
import { usePredictionWallet } from '@/hooks/usePredictionWallet'
import { StakeModal } from '@/components/StakeModal'
import { useToast } from '@/components/ui/toast'
import { useLiveElection } from '@/hooks/useLiveElection'
import { LiveElectionPulse } from '@/components/LiveElectionPulse'
import { MarketCard } from '@/components/MarketCard'
import { getMarketEligibility } from '@/lib/market-eligibility'
import { PageShell } from '@/components/ui/page-shell'
import { PageHeader } from '@/components/ui/page-header'
import { SectionHeader } from '@/components/ui/section-header'
import { EmptyState } from '@/components/ui/empty-state'
import { UnderlineTabs } from '@/components/ui/underline-tabs'
import { LinkButton } from '@/components/LinkButton'

type CategoryFilter = 'all' | MarketCategory
type StatusFilter = 'active' | 'resolved' | 'all'

interface StakeTarget {
  market: PredictionMarket
  direction: 'yes' | 'no'
}

const STATIC_NON_BILL_MARKETS = allMarkets.filter(market => market.category !== 'bill')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const configured = !!(SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http'))

const CATEGORY_FILTERS: Array<{ id: CategoryFilter; label: string }> = [
  { id: 'all', label: 'All Forecasts' },
  { id: 'bill', label: 'Bills' },
  { id: 'election', label: 'Elections' },
  { id: 'mp-vote', label: 'MP Votes' },
  { id: 'civic', label: 'Civic' },
]

const STATUS_FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: 'active', label: 'Active' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'all', label: 'All' },
]

export function PredictionsPageClient({
  initialBillMarkets,
  issueSummaries,
}: {
  initialBillMarkets: PredictionMarket[]
  /** issueId → real, sourced editorial summary. Only bill markets ever look this up. */
  issueSummaries: Record<string, string>
}) {
  const [billMarkets, setBillMarkets] = useState(initialBillMarkets)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [stakeTarget, setStakeTarget] = useState<StakeTarget | null>(null)
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)
  const { data: liveElection } = useLiveElection()

  useEffect(() => {
    setBillMarkets(initialBillMarkets)
  }, [initialBillMarkets])

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
    // Defense in depth: the board already hides stake controls for
    // ineligible markets (see market-eligibility.ts), but this is the single
    // choke point MarketCard calls through, so it guards against a future
    // regression reintroducing an ungated button. The server-side
    // is_market_open() check remains the real authority.
    if (!getMarketEligibility(market).canStake) {
      toast('This forecast is not open for staking.', 'error')
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

  const filtered = useMemo(() => {
    return markets.filter(market => {
      const catOk = categoryFilter === 'all' || market.category === categoryFilter
      const statusOk =
        statusFilter === 'all' ||
        (statusFilter === 'active' && market.status === 'active') ||
        (statusFilter === 'resolved' && market.status !== 'active')
      return catOk && statusOk
    })
  }, [categoryFilter, statusFilter, markets])

  const activeCount = markets.filter(market => market.status === 'active').length

  return (
    <PageShell width="default">
      <PageHeader
        eyebrow="Australia · Forecasts"
        title="Forecasts"
        summary="What is likely to happen next, and how confident are participants?"
        metric={{ value: activeCount, label: 'open forecasts' }}
        metadata={{ source: 'Community-forecasted · Virtual points, no real-world value' }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-4">
        {wallet.authenticated && wallet.hydrated ? (
          <p className="text-body-copy text-muted-foreground">
            Balance: <span className="font-medium text-foreground">{wallet.balance.toLocaleString()} pts</span>
            {' · '}
            {wallet.openPositions.length} open position{wallet.openPositions.length === 1 ? '' : 's'}
          </p>
        ) : (
          <p className="text-body-copy text-muted-foreground">
            <LinkButton href="/auth/sign-in" variant="outline" size="sm">Sign in to participate</LinkButton>
          </p>
        )}
      </div>

      {liveElection.active && (
        <div className="mt-6">
          <LiveElectionPulse snapshot={liveElection} />
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <UnderlineTabs
          items={CATEGORY_FILTERS.map(({ id, label }) => ({ id, label }))}
          value={categoryFilter}
          onChange={id => setCategoryFilter(id as CategoryFilter)}
        />
        <UnderlineTabs
          items={STATUS_FILTERS.map(({ id, label }) => ({ id, label }))}
          value={statusFilter}
          onChange={id => setStatusFilter(id as StatusFilter)}
        />
      </div>

      <div className="mt-6">
        <SectionHeader title="Current forecasts" />

        {filtered.length === 0 ? (
          <EmptyState variant="no-forecasts" description="No verified forecasts match this filter yet." />
        ) : (
          <div>
            {filtered.map(market => (
              <MarketCard
                key={market.id}
                market={market}
                hasPosition={stakedMarketIds.has(market.id)}
                onStake={handleStake}
                whyThisMatters={market.category === 'bill' ? issueSummaries[market.id] : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <button
          type="button"
          onClick={() => setHowItWorksOpen(value => !value)}
          aria-expanded={howItWorksOpen}
          className="flex items-center gap-2 text-metadata text-foreground"
        >
          <ChevronDown className={howItWorksOpen ? 'h-3.5 w-3.5 rotate-180' : 'h-3.5 w-3.5'} aria-hidden="true" />
          How forecasting works
        </button>
        {howItWorksOpen && (
          <div className="mt-4 max-w-2xl space-y-3 text-body-copy text-muted-foreground">
            <p>
              A forecast&apos;s probability reflects the current view of everyone who has staked a position on it —
              it is a community signal, not a certainty and not professional advice.
            </p>
            <p>
              Points are virtual and have no real-world or redeemable value. Staking points on a forecast does not
              cost real money and cannot win real money.
            </p>
            <p>
              Each forecast has a stated close date and, once resolved, a named resolution source. A forecast marked
              &ldquo;Demo&rdquo; is shown for browsing only and cannot be staked — it is not backed by a currently
              open market.
            </p>
          </div>
        )}
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
    </PageShell>
  )
}
