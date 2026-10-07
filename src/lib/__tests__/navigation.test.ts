import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { PRIMARY_NAV, SECONDARY_NAV, isPrimaryNavItemActive, activePrimaryNavId } from '@/lib/navigation'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// Regression tests for PAGE_REFACTOR_BATCH_2_REPORT.md — navigation consistency
// and terminology cleanup. Routes were not renamed in this batch; these tests
// pin the approved public labels and the shared active-state logic so Navbar,
// BottomNav and CommandPalette can't silently drift apart again.

describe('Primary navigation — approved five labels, in order', () => {
  it('has exactly Today, Issues, Government, Forecasts, People, in that order', () => {
    expect(PRIMARY_NAV.map(item => item.label)).toEqual([
      'Today', 'Issues', 'Government', 'Forecasts', 'People',
    ])
  })

  it('points each temporary destination at the correct legacy route', () => {
    const hrefById = Object.fromEntries(PRIMARY_NAV.map(item => [item.id, item.href]))
    expect(hrefById.today).toBe('/')
    expect(hrefById.issues).toBe('/issues')
    expect(hrefById.government).toBe('/parliament')
    expect(hrefById.forecasts).toBe('/predictions')
    expect(hrefById.people).toBe('/leaders')
  })

  it('Support is secondary, not one of the five primary items', () => {
    expect(PRIMARY_NAV.some(item => item.label === 'Support')).toBe(false)
    expect(SECONDARY_NAV.some(item => item.label === 'Support')).toBe(true)
    expect(SECONDARY_NAV.find(item => item.label === 'Support')?.href).toBe('/donate')
  })
})

describe('Active-state mapping', () => {
  const cases: [string, string | null][] = [
    ['/', 'today'],
    ['/issues', 'issues'],
    ['/issues/housing-affordability', 'issues'],
    ['/issue/housing-affordability', 'issues'], // singular legacy detail route
    ['/decisions', 'government'],
    ['/decisions/anything', 'government'],
    ['/government', 'government'],
    ['/parliament', 'government'],
    ['/parliament/bill-123', 'government'],
    ['/predictions', 'forecasts'],
    ['/predictions/some-market', 'forecasts'],
    ['/leaders', 'people'],
    ['/leaders/leader-123', 'people'],
    ['/mp/mp-labor-1', 'people'],
    ['/campaigns', null],
    ['/profile', null],
  ]

  for (const [pathname, expected] of cases) {
    it(`${pathname} → ${expected ?? 'no primary section'}`, () => {
      expect(activePrimaryNavId(pathname)).toBe(expected)
    })
  }

  it('never marks two different primary items active for the same pathname', () => {
    for (const pathname of cases.map(([p]) => p)) {
      const matches = PRIMARY_NAV.filter(item => isPrimaryNavItemActive(item, pathname))
      expect(matches.length).toBeLessThanOrEqual(1)
    }
  })
})

describe('Desktop, mobile and command palette share one navigation source', () => {
  it('Navbar imports the shared config instead of defining its own array', () => {
    const source = read('src/components/Navbar.tsx')
    expect(source).toContain("from '@/lib/navigation'")
    expect(source).not.toMatch(/const PRIMARY_NAV\s*=\s*\[/)
  })

  it('BottomNav imports the shared config instead of defining its own array', () => {
    const source = read('src/components/BottomNav.tsx')
    expect(source).toContain("from '@/lib/navigation'")
    expect(source).not.toMatch(/const NAV_ITEMS\s*:?\s*=?\s*\[\s*\{\s*href/)
  })

  it('BottomNav no longer uses the inconsistent Home/Decisions/Test labels', () => {
    const source = read('src/components/BottomNav.tsx')
    expect(source).not.toContain("label: 'Home'")
    expect(source).not.toContain("label: 'Test'")
    expect(source).not.toContain("label: 'Decisions'")
    expect(source).not.toContain("label: 'Leaders'")
  })

  it('CommandPalette sources its primary section entries from the shared config', () => {
    const source = read('src/components/CommandPalette.tsx')
    expect(source).toContain("from '@/lib/navigation'")
    expect(source).toContain('PRIMARY_NAV.map')
  })

  it('CommandPalette no longer sends "Decisions" to the bare /government redirect', () => {
    const source = read('src/components/CommandPalette.tsx')
    expect(source).not.toContain("label: 'Decisions',       href: '/government'")
  })
})

describe('Public page titles use the approved terminology', () => {
  it('/predictions is publicly titled Forecasts', () => {
    const source = read('src/app/predictions/layout.tsx')
    expect(source).toContain('Forecasts — Stickee')
    expect(source).not.toContain('Markets — Stickee')
  })

  it('/leaders is publicly titled People', () => {
    const source = read('src/app/leaders/layout.tsx')
    expect(source).toContain('People — Stickee')
    expect(source).not.toContain("title: 'Leaders — Stickee'")
  })

  it('/decisions is publicly titled Government and links to Parliament', () => {
    const source = read('src/app/decisions/layout.tsx')
    expect(source).toContain('Government — Stickee')
    const page = read('src/app/decisions/page.tsx')
    expect(page).toContain('Government')
    expect(page).toContain('/parliament')
  })

  it('/parliament identifies itself as part of Government', () => {
    const source = read('src/app/parliament/page.tsx')
    // Eyebrow standardised to the canonical "Australia · {Section}" pattern
    // (STICKEE_V1_CROSS_PAGE_CONSISTENCY_REPORT.md) — was "Government ·
    // Federal Parliament", a page-unique arrangement no other core page used.
    expect(source).toContain('Australia · Government')
  })
})

describe('Homepage actions use the approved terminology', () => {
  const source = read('src/app/page.tsx')

  it('no longer labels the simulator action "Test an idea"', () => {
    expect(source).not.toContain('Test an idea')
    expect(source).toContain('Explore scenarios')
  })

  it('no longer labels the decisions action ambiguously as just "See decisions"', () => {
    expect(source).not.toContain("label: 'See decisions'")
    expect(source).not.toContain("'See decisions'")
    expect(source).toContain('Government')
  })
})

describe('Contextual links use the approved terminology', () => {
  it('the shared simulate-this button says "Explore scenarios", not "Simulate this"', () => {
    const source = read('src/components/simulator/SimulateThisButton.tsx')
    expect(source).not.toMatch(/return 'Simulate this/)
    expect(source).toContain('Explore scenarios')
  })

  it('the /predictions market board publicly says Forecasts, not Markets', () => {
    const source = read('src/components/PredictionsPageClient.tsx')
    expect(source).not.toContain('Prediction Markets')
    expect(source).not.toContain("label: 'All Markets'")
    expect(source).toContain('Forecasts')
  })

  it('the issue-page market widget says Forecast, not Prediction Market', () => {
    const source = read('src/components/PredictionMarketGrid.tsx')
    expect(source).not.toContain('Prediction Market</h2>')
  })

  it('the community-leader detail page links back to People, not Leaders', () => {
    const source = read('src/components/LeaderProfileDetail.tsx')
    expect(source).not.toContain('← Leaders')
    expect(source).toContain('← People')
  })

  it('/leaderboard header identifies itself under Forecasts', () => {
    const source = read('src/app/leaderboard/page.tsx')
    expect(source).toContain('Forecasts ·')
  })
})
