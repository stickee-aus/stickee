import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mapIssueMarketRecordToPredictionMarket, type IssueMarketRecord } from '@/lib/issues-data'
import { getMarketEligibility } from '@/lib/market-eligibility'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function recordWith(overrides: Partial<IssueMarketRecord> = {}): IssueMarketRecord {
  return {
    issue_id: 'test-issue',
    question: 'Will this pass?',
    category: 'bill',
    status: 'active',
    probability: 50,
    total_participants: 0,
    resolves_by: 'Dec 2026',
    yes_change: 0,
    yes_volume: 0,
    no_volume: 0,
    yes_history: null,
    resolution_source: null,
    ...overrides,
  }
}

// Regression tests for FORECASTS_V1_SIMPLIFICATION_REPORT.md. Every finding
// below was verified against the current source before this batch, not
// assumed from the prior FORECASTS_PAGE_AUDIT.md alone.

describe('DB status mapping — voided/cancelled never become active', () => {
  it('a real voided market maps to the client "voided" status, not "active"', () => {
    const market = mapIssueMarketRecordToPredictionMarket(recordWith({ status: 'voided' }))
    expect(market.status).toBe('voided')
    expect(getMarketEligibility(market).canStake).toBe(false)
  })

  it('a real cancelled market also maps to "voided", not "active"', () => {
    const market = mapIssueMarketRecordToPredictionMarket(recordWith({ status: 'cancelled' }))
    expect(market.status).toBe('voided')
    expect(getMarketEligibility(market).canStake).toBe(false)
  })

  it('a real active market still maps to "active" and can be staked', () => {
    const market = mapIssueMarketRecordToPredictionMarket(recordWith({ status: 'active' }))
    expect(market.status).toBe('active')
    expect(getMarketEligibility(market).canStake).toBe(true)
  })
})

describe('resolution_source is read and surfaced', () => {
  it('getLiveBillMarkets selects resolution_source from issue_markets', () => {
    const source = read('src/lib/predictions-db.ts')
    expect(source).toMatch(/select\([^)]*resolution_source/)
  })

  it('mapIssueMarketRecordToPredictionMarket carries resolution_source through as resolutionSource', () => {
    const market = mapIssueMarketRecordToPredictionMarket(
      recordWith({ status: 'resolved-yes', resolution_source: 'Parliament of Australia' })
    )
    expect(market.resolutionSource).toBe('Parliament of Australia')
  })

  it('MarketCard renders a resolution source line for resolved markets', () => {
    const source = read('src/components/MarketCard.tsx')
    expect(source).toContain('market.resolutionSource')
    expect(source).toContain('Resolution source:')
  })
})

describe('PredictionsPageClient — no fake activity metrics', () => {
  const source = read('src/components/PredictionsPageClient.tsx')

  it('never reads market.participants or market.priceChange (static, never-updated DB columns)', () => {
    expect(source).not.toContain('.participants')
    expect(source).not.toContain('.priceChange')
    expect(source).not.toMatch(/24h/i)
    expect(source).not.toMatch(/volume/i)
  })

  it('does not import the fabricated-content subcomponents (thumbnail, bull/bear, news timeline, history chart, simulator comparison)', () => {
    expect(source).not.toContain('MarketThumbnail')
    expect(source).not.toContain('BullBearCase')
    expect(source).not.toContain('MarketNewsTimeline')
    expect(source).not.toContain('ProbabilityHistoryChart')
    expect(source).not.toContain('SimulatorComparison')
    expect(source).not.toContain('SimulateThisButton')
  })
})

describe('PredictionsPageClient — no featured slot', () => {
  const source = read('src/components/PredictionsPageClient.tsx')

  it('renders one flat forecast list — no FeaturedMarketCard import or selectFeaturedMarket call', () => {
    expect(source).not.toContain('FeaturedMarketCard')
    expect(source).not.toContain('selectFeaturedMarket')
  })
})

describe('PredictionsPageClient — proposal flow removed', () => {
  const source = read('src/components/PredictionsPageClient.tsx')

  it('has no "+Propose" entry point, ProposeMarketModal mount, or "Pending Review" copy', () => {
    expect(source).not.toContain('ProposeMarketModal')
    expect(source).not.toContain('loadProposals')
    expect(source).not.toContain('Pending Review')
    expect(source).not.toContain('+ Propose')
  })

  it('the category filter list has no "custom"/"Proposed" entry', () => {
    expect(source).not.toContain("'custom'")
    expect(source).not.toContain('Proposed')
  })
})

describe('PredictionsPageClient — no inline leaderboard, no wallet dashboard', () => {
  const source = read('src/components/PredictionsPageClient.tsx')

  it('does not render a Leaderboard section', () => {
    expect(source).not.toMatch(/Leaderboard/i)
    expect(source).not.toContain('Top predictors')
  })

  it('does not mount PortfolioPanel or a wallet show/hide toggle', () => {
    expect(source).not.toContain('PortfolioPanel')
    expect(source).not.toContain('Show wallet')
    expect(source).not.toContain('Hide wallet')
  })

  it('renders the exact minimal participation copy for signed-out and signed-in states', () => {
    expect(source).toContain('Sign in to participate')
    expect(source).toContain('open position')
  })
})

describe('PredictionsPageClient — Live Election Pulse is contextual, not permanent', () => {
  it('only mounts LiveElectionPulse when liveElection.active is true', () => {
    const source = read('src/components/PredictionsPageClient.tsx')
    expect(source).toContain('liveElection.active && (')
    expect(source).toContain('<LiveElectionPulse')
  })
})

describe('PredictionsPageClient — RecentRehearsalsStrip removed from this page', () => {
  it('no longer imports or renders the simulator rehearsal strip', () => {
    const source = read('src/components/PredictionsPageClient.tsx')
    expect(source).not.toContain('RecentRehearsalsStrip')
  })
})

describe('PredictionsPageClient — terminology', () => {
  const source = read('src/components/PredictionsPageClient.tsx')
  const marketCardSource = read('src/components/MarketCard.tsx')

  it('the forecast board section is titled "Current forecasts", not "Forecast board"', () => {
    expect(source).toContain('Current forecasts')
    expect(source).not.toContain('Forecast board')
  })

  it('list-page surfaces avoid trading-grammar language (shares/payout/¢/buy/sell)', () => {
    for (const banned of ['shares', 'Shares', 'payout', 'Payout', '¢', 'Buy Yes', 'Buy No']) {
      expect(source).not.toContain(banned)
      expect(marketCardSource).not.toContain(banned)
    }
  })
})

describe('PredictionsPageClient — "Why this matters" is sourced, never generated', () => {
  it('page.tsx builds issueSummaries only from real, non-empty issue.summary values', () => {
    const source = read('src/app/predictions/page.tsx')
    expect(source).toContain('getIssuesPageData')
    expect(source).toContain('issue.summary')
    expect(source).toMatch(/summary\s*&&\s*issue\.summary\.trim\(\)\.length > 0/)
  })

  it('MarketCard only ever receives whyThisMatters for bill-category markets', () => {
    const source = read('src/components/PredictionsPageClient.tsx')
    expect(source).toMatch(/whyThisMatters=\{market\.category === 'bill' \? issueSummaries\[market\.id\] : undefined\}/)
  })

  it('MarketCard never fabricates the line — no default/fallback text when whyThisMatters is absent', () => {
    const source = read('src/components/MarketCard.tsx')
    expect(source).toContain('whyThisMatters ?')
    expect(source).toContain(': undefined')
  })
})

describe('PredictionsPageClient — "How forecasting works" is collapsed by default', () => {
  it('starts collapsed and exposes aria-expanded', () => {
    const source = read('src/components/PredictionsPageClient.tsx')
    expect(source).toContain('useState(false)')
    expect(source).toContain('aria-expanded={howItWorksOpen}')
    expect(source).toContain('How forecasting works')
  })
})

describe('PredictionsPageClient — demo markets stay labelled and non-stakeable', () => {
  it('MarketCard derives status from getMarketEligibility, never renders stake controls for a non-canStake market', () => {
    const source = read('src/components/MarketCard.tsx')
    expect(source).toContain('getMarketEligibility(market)')
    expect(source).toContain('canStake && (')
  })
})

describe('PredictionsPageClient — shared Civic Design System primitives', () => {
  it('composes PageShell/PageHeader/SectionHeader/EmptyState/UnderlineTabs', () => {
    const source = read('src/components/PredictionsPageClient.tsx')
    for (const primitive of ['PageShell', 'PageHeader', 'SectionHeader', 'EmptyState', 'UnderlineTabs']) {
      expect(source).toContain(primitive)
    }
  })

  it('MarketCard composes RecordRow and StatusLabel', () => {
    const source = read('src/components/MarketCard.tsx')
    expect(source).toContain('RecordRow')
    expect(source).toContain('StatusLabel')
  })
})

describe('StakeModal terminology stays behind the Product + Legal gate — unchanged by this batch', () => {
  it('still uses shares/¢/profit copy (DESIGN_SYSTEM_MIGRATION_ROADMAP.md Phase 4b, not resolved here)', () => {
    const source = read('src/components/StakeModal.tsx')
    expect(source).toContain('Shares')
    expect(source).toContain('¢')
  })
})
