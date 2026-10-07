import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { getMarketEligibility } from '@/lib/market-eligibility'
import type { MarketStatus } from '@/lib/mock-market-data'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// Regression tests for HOMEPAGE_FORECASTS_BATCH_REPORT.md and
// DESIGN_SYSTEM_PHASE_3A_HOME_REPORT.md. The homepage Forecasts section
// must keep reusing /predictions' canonical, database-backed market source
// and its existing eligibility gate, never a mock fallback, never staking
// controls, and never present a fake claimable bonus to a signed-out
// visitor — regardless of which shared primitive renders the markup.

describe('Home page — Forecasts section', () => {
  const source = read('src/app/page.tsx')

  it('renders a Forecasts section with the public label "Forecasts"', () => {
    expect(source).toContain('title="Forecasts"')
  })

  it('is placed after the government-activity section and before the personalisation CTA', () => {
    const governmentIdx = source.indexOf('Government activity')
    const forecastsIdx = source.indexOf('title="Forecasts"')
    const ctaIdx = source.indexOf('New here?')
    expect(governmentIdx).toBeGreaterThan(-1)
    expect(forecastsIdx).toBeGreaterThan(governmentIdx)
    expect(ctaIdx).toBeGreaterThan(forecastsIdx)
  })

  it('never labels the homepage section "Markets" or "Predictions"', () => {
    expect(source).not.toContain('>Markets<')
    expect(source).not.toContain('title="Markets"')
    expect(source).not.toContain('title="Predictions"')
  })

  it('sources forecasts from the canonical database-backed function used by /predictions, not the static mock array', () => {
    expect(source).toContain('getLiveBillMarkets')
    expect(source).toContain("from '@/lib/predictions-db'")
    expect(source).not.toContain('allMarkets')
    expect(source).not.toContain('STATIC_NON_BILL_MARKETS')
  })

  it('gates eligibility through the shared market-eligibility helper (single source of truth)', () => {
    expect(source).toContain('getMarketEligibility(market).canStake')
  })

  it('shows at most two active forecast cards', () => {
    expect(source).toContain('.slice(0, 2)')
  })

  it('renders a truthful empty state when there are zero active forecasts', () => {
    expect(source).toContain('No verified forecasts are currently open.')
    expect(source).toContain('activeForecasts.length > 0')
  })

  it('never renders homepage staking controls', () => {
    expect(source).not.toContain('onStake')
    expect(source).not.toContain('StakeModal')
    expect(source).not.toMatch(/>\s*Yes\s*</)
  })

  it('links forecast cards and empty-state CTA to /predictions, not a renamed route', () => {
    expect(source).toContain('href="/predictions"')
  })
})

describe('Home page — primary destinations', () => {
  const source = read('src/app/page.tsx')

  it('gives Forecasts equal billing among the three primary destinations', () => {
    expect(source).toMatch(/href:\s*'\/predictions'/)
  })

  it('keeps the primary destination set to three cards, not four or five', () => {
    const match = source.match(/const PRIMARY_DESTINATIONS = \[([\s\S]*?)\n\]/)
    expect(match).not.toBeNull()
    const entries = (match?.[1].match(/href:/g) ?? []).length
    expect(entries).toBe(3)
  })

  it('uses the same canonical Issues/Government/Forecasts labels as src/lib/navigation.ts', () => {
    expect(source).toContain("title: 'Issues'")
    expect(source).toContain("title: 'Government'")
    expect(source).toContain("title: 'Forecasts'")
  })

  it('demotes scenarios and take-action to secondary links rather than removing them', () => {
    expect(source).toContain('SECONDARY_ACTIONS')
    expect(source).toContain("'/simulator'")
    expect(source).toContain("'/campaigns'")
  })
})

describe('Home page — forecast eligibility composition', () => {
  // Exercises the real getMarketEligibility() helper (not a re-implementation)
  // against every possible market status to prove the homepage's
  // `.filter(...).slice(0, 2)` chain admits only genuinely active markets.
  const statuses: MarketStatus[] = ['active', 'demo', 'voided', 'resolved-yes', 'resolved-no']

  function fakeMarket(id: string, status: MarketStatus) {
    return { id, status }
  }

  it('excludes demo, voided, and resolved markets — only "active" is eligible', () => {
    const markets = statuses.map((status, i) => fakeMarket(`m-${i}`, status))
    const eligible = markets.filter(market => getMarketEligibility(market).canStake)
    expect(eligible).toHaveLength(1)
    expect(eligible[0].status).toBe('active')
  })

  it('caps the visible set at two even when more active markets exist', () => {
    const markets = ['a', 'b', 'c', 'd'].map(id => fakeMarket(id, 'active'))
    const visible = markets.filter(market => getMarketEligibility(market).canStake).slice(0, 2)
    expect(visible).toHaveLength(2)
    expect(visible.map(m => m.id)).toEqual(['a', 'b'])
  })

  it('falls back to an empty list, not a mock market, when nothing is active', () => {
    const markets = [fakeMarket('demo-1', 'demo'), fakeMarket('void-1', 'voided')]
    const visible = markets.filter(market => getMarketEligibility(market).canStake).slice(0, 2)
    expect(visible).toHaveLength(0)
  })
})

describe('Daily bonus banner — Forecasts terminology and signed-out truthfulness', () => {
  const source = read('src/components/DailyBonusBanner.tsx')

  it('no longer labels the link to the forecast board "Markets"', () => {
    expect(source).not.toContain('Markets')
    expect(source).toContain('Forecasts')
  })

  it('gates the claimable bonus state on real Supabase authentication', () => {
    expect(source).toContain('usePredictionWallet')
    expect(source).toContain('authenticated')
  })

  it('shows a sign-in prompt instead of a claim button for signed-out visitors', () => {
    expect(source).toContain('Sign in to claim your daily forecasting bonus')
    expect(source).toContain('href="/auth/sign-in"')
  })

  it('only renders the Claim button/localStorage bonus flow when authenticated', () => {
    const claimBlock = source.match(/\) : !claimed && \(([\s\S]*?)\)\}/)
    expect(claimBlock).not.toBeNull()
    expect(claimBlock?.[1]).toContain('handleClaim')
  })

  it('no longer hardcodes off-palette dark-theme hex colours (re-themed onto civic tokens)', () => {
    expect(source).not.toContain('#041008')
    expect(source).not.toContain('#0e3020')
    expect(source).not.toContain('#2ec266')
  })
})
