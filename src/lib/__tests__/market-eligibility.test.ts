import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { getMarketEligibility, nonTradeableLabel, selectFeaturedMarket } from '@/lib/market-eligibility'
import type { PredictionMarket, MarketStatus } from '@/lib/mock-market-data'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function marketWith(status: MarketStatus, overrides: Partial<PredictionMarket> = {}): PredictionMarket {
  return {
    id: overrides.id ?? `market-${status}`,
    category: 'civic',
    question: 'Test market?',
    status,
    probability: 50,
    priceChange: 0,
    participants: 0,
    resolvesBy: 'Dec 2026',
    topic: 'Test',
    imageUrl: '',
    imageAlt: '',
    history: [],
    newsTimeline: [],
    bullCase: '',
    bearCase: '',
    simulatorComparison: { yes: '', no: '', next: '' },
    ...overrides,
  }
}

describe('getMarketEligibility', () => {
  it('an active market can be staked', () => {
    const eligibility = getMarketEligibility(marketWith('active'))
    expect(eligibility.canStake).toBe(true)
    expect(eligibility.isActive).toBe(true)
    expect(eligibility.isResolved).toBe(false)
  })

  it('a demo market cannot be staked', () => {
    const eligibility = getMarketEligibility(marketWith('demo'))
    expect(eligibility.canStake).toBe(false)
    expect(eligibility.isDemo).toBe(true)
    expect(eligibility.isResolved).toBe(true)
  })

  it('a resolved-yes market cannot be staked', () => {
    const eligibility = getMarketEligibility(marketWith('resolved-yes'))
    expect(eligibility.canStake).toBe(false)
    expect(eligibility.isResolvedYes).toBe(true)
  })

  it('a resolved-no market cannot be staked', () => {
    const eligibility = getMarketEligibility(marketWith('resolved-no'))
    expect(eligibility.canStake).toBe(false)
    expect(eligibility.isResolvedNo).toBe(true)
  })

  it('a voided market cannot be staked', () => {
    const eligibility = getMarketEligibility(marketWith('voided'))
    expect(eligibility.canStake).toBe(false)
    expect(eligibility.isVoided).toBe(true)
  })
})

describe('nonTradeableLabel', () => {
  it('labels every non-active status truthfully', () => {
    expect(nonTradeableLabel('demo')).toBe('Demo — not tradeable')
    expect(nonTradeableLabel('voided')).toBe('Voided — refunded')
    expect(nonTradeableLabel('resolved-yes')).toBe('Resolved Yes')
    expect(nonTradeableLabel('resolved-no')).toBe('Resolved No')
  })
})

describe('selectFeaturedMarket', () => {
  it('selects the first genuinely active market', () => {
    const markets = [marketWith('demo', { id: 'a' }), marketWith('active', { id: 'b' }), marketWith('active', { id: 'c' })]
    expect(selectFeaturedMarket(markets)?.id).toBe('b')
  })

  it('does not select the hardcoded demo RBA market even by id match', () => {
    const markets = [marketWith('demo', { id: 'urgent-rba-rate' })]
    expect(selectFeaturedMarket(markets)).toBeNull()
  })

  it('returns null when zero markets are active, instead of falling back to markets[0]', () => {
    const markets = [marketWith('demo', { id: 'a' }), marketWith('resolved-yes', { id: 'b' }), marketWith('voided', { id: 'c' })]
    expect(selectFeaturedMarket(markets)).toBeNull()
  })

  it('returns null for an empty markets array', () => {
    expect(selectFeaturedMarket([])).toBeNull()
  })
})

describe('the page cannot display a featured market while activeCount is zero', () => {
  it('featured selection and the active-count filter agree on the same activeness rule', () => {
    const markets = [marketWith('demo', { id: 'a' }), marketWith('voided', { id: 'b' })]
    const activeCount = markets.filter(m => m.status === 'active').length
    expect(activeCount).toBe(0)
    expect(selectFeaturedMarket(markets)).toBeNull()
  })
})

describe('featured-market selection wiring is not the old hardcoded lookup', () => {
  it('PredictionsPageClient no longer hardcodes urgent-rba-rate as the featured market', () => {
    const source = read('src/components/PredictionsPageClient.tsx')
    expect(source).not.toContain("market.id === 'urgent-rba-rate'")
    expect(source).not.toMatch(/featuredMarket[^\n]*markets\[0\]/)
    expect(source).toContain('selectFeaturedMarket(markets)')
  })
})

describe('FeaturedMarketCard gates stake controls on eligibility', () => {
  it('uses the shared eligibility helper rather than an unconditional stake block', () => {
    const source = read('src/components/FeaturedMarketCard.tsx')
    expect(source).toContain('getMarketEligibility(market)')
    expect(source).toContain('canStake ?')
  })
})

describe('StakeModal will not submit for an ineligible market', () => {
  it('imports and checks market eligibility before allowing a stake', () => {
    const source = read('src/components/StakeModal.tsx')
    expect(source).toContain('getMarketEligibility(market)')
    expect(source).toContain('marketEligibility.canStake')
  })
})
