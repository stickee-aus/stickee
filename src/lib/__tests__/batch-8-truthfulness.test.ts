import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { PRIMARY_NAV, activePrimaryNavId } from '@/lib/navigation'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// Regression tests for STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md — the two
// independent P0 truthfulness fixes: (1) Government's primary-nav
// destination no longer leads to the fictional /decisions page, and (2) no
// fabricated politician score/approval/trust rating remains publicly
// visible. See the report for the full before/after evidence.

describe('Fix 1 — Government navigation destination', () => {
  it('Government points at the real parliamentary record, not the mock decisions page', () => {
    const government = PRIMARY_NAV.find(item => item.id === 'government')
    expect(government?.href).toBe('/parliament')
  })

  it('desktop, mobile and command palette all resolve Government from the one shared config', () => {
    const navbar = read('src/components/Navbar.tsx')
    const bottomNav = read('src/components/BottomNav.tsx')
    const commandPalette = read('src/components/CommandPalette.tsx')
    for (const source of [navbar, bottomNav, commandPalette]) {
      expect(source).toContain("from '@/lib/navigation'")
    }
  })

  it('/parliament and /decisions both activate the Government nav state', () => {
    expect(activePrimaryNavId('/parliament')).toBe('government')
    expect(activePrimaryNavId('/decisions')).toBe('government')
  })

  it('the bare /government route redirects to /parliament, not /decisions', () => {
    const source = read('src/app/government/page.tsx')
    expect(source).toContain("redirect('/parliament')")
    expect(source).not.toContain("redirect('/decisions')")
  })

  it('homepage Government links point at /parliament', () => {
    const source = read('src/app/page.tsx')
    expect(source).not.toContain("href: '/decisions'")
    expect(source).not.toContain('href="/decisions"')
    expect(source).toContain("href: '/parliament'")
    expect(source).toContain('href="/parliament"')
  })
})

describe('Fix 1 — /decisions no longer renders the fictional decision list', () => {
  const source = read('src/app/decisions/page.tsx')

  it('no longer imports the mock government data', () => {
    expect(source).not.toContain("from '@/lib/mock-government-data'")
    expect(source).not.toContain('<DecisionCard')
    expect(source).not.toMatch(/\bDECISIONS\.map/)
  })

  it('no longer renders mock decision titles, agreement percentages, or Trending/Controversial filters', () => {
    expect(source).not.toContain('decision.isTrending')
    expect(source).not.toContain('decision.isControversial')
    expect(source).not.toContain('% agree')
    expect(source).not.toContain("value: 'trending'")
    expect(source).not.toContain("value: 'controversial'")
    expect(source).not.toContain('High Impact')
  })

  it('presents a truthful transitional state with a link to Parliament', () => {
    expect(source).toContain('EmptyState')
    expect(source).toContain('/parliament')
  })
})

describe('Fix 2 — fabricated politician scoring is not publicly rendered', () => {
  it('HouseChamber no longer generates or renders Approval/Trust/Public Pressure scores', () => {
    const source = read('src/components/HouseChamber.tsx')
    expect(source).not.toContain('generateScores')
    expect(source).not.toContain('approvalRating')
    expect(source).not.toContain('trustScore')
    expect(source).not.toContain('publicPressureScore')
    expect(source).not.toContain('"Approval"')
    expect(source).not.toContain('"Trust"')
  })

  it('DecisionMaker no longer carries fabricated approval/trust fields', () => {
    const typeSource = read('src/types/government.ts')
    expect(typeSource).not.toContain('approvalRating')
    expect(typeSource).not.toContain('trustScore')
    expect(typeSource).not.toContain('totalRatings')

    const dataSource = read('src/lib/mock-government-data.ts')
    expect(dataSource).not.toContain('approvalRating')
    expect(dataSource).not.toContain('trustScore')
  })

  it('/impact no longer renders POLITICIAN_SCORECARDS civic scores', () => {
    const source = read('src/app/impact/page.tsx')
    expect(source).not.toContain("import { POLITICIAN_SCORECARDS")
    expect(source).not.toContain('<CivicScorecard')
    expect(source).toContain('Verified national indicators are being prepared')
    expect(source).toContain('Placeholder scores are not shown')
  })

  it('MPVoteGrid no longer presents a party-wide mock vote as an individual MP\'s vote', () => {
    const source = read('src/components/MPVoteGrid.tsx')
    expect(source).not.toContain("import { getVotesForIssue")
    expect(source).not.toContain('<VoteBadge')
    expect(source).not.toContain('label="MP Vote"')
    expect(source).toContain('being verified')
  })

  it('/mp/[id] still shows the truthful placeholder instead of a fabricated score (unchanged by this batch)', () => {
    const source = read('src/app/mp/[id]/page.tsx')
    expect(source).toContain('Individual voting analysis is not yet available for this representative.')
  })
})

describe('Fix 2 — real information is preserved', () => {
  it('DecisionMaker retains real identity fields', () => {
    const typeSource = read('src/types/government.ts')
    expect(typeSource).toContain('name: string')
    expect(typeSource).toContain('party: string')
    expect(typeSource).toContain('electorate: string')
  })

  it('HouseChamber still renders real party-coloured chamber composition and bill vote counts', () => {
    const source = read('src/components/HouseChamber.tsx')
    expect(source).toContain('PARTY_COLORS')
    expect(source).toContain('totalFor')
    expect(source).toContain('totalAgainst')
  })

  it('MPVoteGrid still links each row to the real MP profile', () => {
    const source = read('src/components/MPVoteGrid.tsx')
    expect(source).toContain('href={`/mp/${row.mpId}`}')
  })

  it('mock-government-data.ts and CivicScorecard.tsx are kept, not deleted, as non-public fixtures', () => {
    const dataSource = read('src/lib/mock-government-data.ts')
    expect(dataSource).toContain('export const DECISIONS')
    const scorecard = read('src/components/CivicScorecard.tsx')
    expect(scorecard).toContain('export function CivicScorecard')
  })
})
