import type { MarketStatus, PredictionMarket } from '@/lib/mock-market-data'

// Single source of truth for "can this market be shown as tradeable right
// now." Both MarketCard and FeaturedMarketCard must derive their stake-button
// gating from this, not reimplement it — see docs/audits/FEATURED_MARKET_DUPLICATION_AUDIT.md
// for why FeaturedMarketCard previously diverged. This mirrors, but does not
// replace, the server-side authority: is_market_open()/place_wallet_stake()
// (migration 017) is what actually enforces eligibility — this helper only
// controls what the client renders and offers.
export interface MarketEligibility {
  isActive: boolean
  isDemo: boolean
  isVoided: boolean
  isResolved: boolean
  isResolvedYes: boolean
  isResolvedNo: boolean
  canStake: boolean
}

export function getMarketEligibility(market: Pick<PredictionMarket, 'status'>): MarketEligibility {
  const isActive = market.status === 'active'

  return {
    isActive,
    isDemo: market.status === 'demo',
    isVoided: market.status === 'voided',
    isResolved: !isActive,
    isResolvedYes: market.status === 'resolved-yes',
    isResolvedNo: market.status === 'resolved-no',
    canStake: isActive,
  }
}

export function nonTradeableLabel(status: MarketStatus): string {
  switch (status) {
    case 'demo':
      return 'Demo — not tradeable'
    case 'voided':
      return 'Voided — refunded'
    case 'resolved-yes':
      return 'Resolved Yes'
    case 'resolved-no':
      return 'Resolved No'
    default:
      return 'Closed'
  }
}

// Featured-slot selection rule for Batch A: the first genuinely active,
// tradeable market in the canonical array, or none at all. Deliberately does
// not fall back to a hardcoded id, a demo market, or markets[0] — see
// docs/audits/FEATURED_MARKET_DUPLICATION_AUDIT.md, "Root cause: 0 markets while a
// featured market renders." Editorial pinning of a specific real market is
// out of scope for this batch.
export function selectFeaturedMarket(markets: PredictionMarket[]): PredictionMarket | null {
  return markets.find(market => getMarketEligibility(market).canStake) ?? null
}
