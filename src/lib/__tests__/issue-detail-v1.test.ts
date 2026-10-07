import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { mapIssueMarketRecordToPredictionMarket } from '@/lib/issues-data'
import type { IssueMarketRecord } from '@/lib/issues-data'
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

// Regression tests for ISSUE_DETAIL_V1_REPORT.md. Verified against current
// source, not assumed from the historical page audits alone.

describe('Issue detail — competing prediction mechanisms removed', () => {
  const source = read('src/app/issue/[id]/page.tsx')

  it('does not import or render PredictionWidget (the "will this pass" poll with a fabricated points claim)', () => {
    expect(source).not.toContain('PredictionWidget')
    expect(source).not.toContain('getPredictionCounts')
    expect(source).not.toContain('You earn points')
  })

  it('does not import or render MPVoteGrid (the 151-row "guess the vote" mini-game)', () => {
    expect(source).not.toContain('MPVoteGrid')
    expect(source).not.toContain('implied probability')
    expect(source).not.toContain('Your implied probability')
  })

  it('does not import or render PredictionMarketGrid (the duplicate order-book market widget)', () => {
    expect(source).not.toContain('PredictionMarketGrid')
  })

  it('does not import the banned shadcn Badge (pill radius) — uses StatusLabel instead', () => {
    expect(source).not.toContain("from '@/components/ui/badge'")
    expect(source).toContain('StatusLabel')
  })
})

describe('Issue detail — no unsupported MP vote totals', () => {
  const source = read('src/app/issue/[id]/page.tsx')

  it('never renders mp_yes_count/mp_no_count/mp_abstain_count as a public figure', () => {
    expect(source).not.toContain('Voted Yes')
    expect(source).not.toContain('Voted No')
    expect(source).not.toContain('Recorded division')
    expect(source).not.toContain('voteSummary')
  })
})

describe('Issue detail — forecast section uses the canonical pipeline, no mock fallback', () => {
  it('getIssueDetailData maps a real market through mapIssueMarketRecordToPredictionMarket, carrying resolution_source', () => {
    const dbSource = read('src/lib/issues-db.ts')
    expect(dbSource).toContain('mapIssueMarketRecordToPredictionMarket')
    expect(dbSource).toMatch(/select\([^)]*resolution_source/)
  })

  it('the mock/demo fallback path never populates a market (no mock forecast can render)', () => {
    const dbSource = read('src/lib/issues-db.ts')
    expect(dbSource).toMatch(/market:\s*null,\s*\n\s*source:\s*'mock'/)
  })

  it('a real, resolved market carries its resolution source through the mapper', () => {
    const market = mapIssueMarketRecordToPredictionMarket(
      recordWith({ status: 'resolved-yes', resolution_source: 'Parliament of Australia' })
    )
    expect(market.resolutionSource).toBe('Parliament of Australia')
    expect(getMarketEligibility(market).canStake).toBe(false)
  })

  it('the page renders a real forecast summary, or the honest unavailable line — never fake activity metrics', () => {
    const source = read('src/app/issue/[id]/page.tsx')
    expect(source).toContain('No verified forecast is linked to this issue yet.')
    expect(source).not.toContain('.participants')
    expect(source).not.toContain('.priceChange')
  })

  it('does not open a stake modal or wallet flow on this page (no inline staking)', () => {
    const source = read('src/app/issue/[id]/page.tsx')
    expect(source).not.toContain('StakeModal')
    expect(source).not.toContain('usePredictionWallet')
  })
})

describe('Issue detail — Responsibility never invents an issue-specific relationship', () => {
  const source = read('src/app/issue/[id]/page.tsx')

  it('shows the exact approved unavailable copy, not an issue-attributed role table', () => {
    expect(source).toContain('We haven&apos;t yet verified who has primary responsibility for this issue.')
    expect(source).toContain('Stickee will identify the relevant minister, department, committee or institution')
  })

  it('the generic civics block is explicitly labelled as general, not issue-specific', () => {
    expect(source).toContain('General civics — not specific to this issue')
    expect(source).toContain('How responsibility usually works')
  })

  it('never states a specific Minister, Department, or Committee name as responsible for this issue', () => {
    expect(source).not.toMatch(/Responsible Minister:/)
    expect(source).not.toMatch(/Department:\s*[A-Z]/)
  })
})

describe('Issue detail — truthful unavailable states', () => {
  const source = read('src/app/issue/[id]/page.tsx')

  it('"What has government done?" states only the real status, and an honest gap note — no fabricated action log', () => {
    expect(source).toContain('What has government done?')
    expect(source).toContain('No verified, sourced record of the individual actions')
  })

  it('there is no "Timeline" heading — "Latest recorded update" replaces it, with no invented event list', () => {
    expect(source).not.toContain('>Timeline<')
    expect(source).toContain('Latest recorded update')
    expect(source).toContain('a full, event-by-event history is')
  })
})

describe('Issue detail — Evidence section', () => {
  const source = read('src/app/issue/[id]/page.tsx')

  it('renders EvidenceBlock with real source/freshness data', () => {
    expect(source).toContain('EvidenceBlock')
    expect(source).toContain('issue.sourceUrl')
  })

  it('who-supports/who-opposes are re-styled without colour-fill backgrounds', () => {
    expect(source).not.toContain('bg-emerald-500/8')
    expect(source).not.toContain('bg-red-500/8')
  })
})

describe('Issue detail — civic action framing never implies guaranteed influence', () => {
  const source = read('src/app/issue/[id]/page.tsx')

  it('states what Stickee can and cannot confirm about the email action', () => {
    expect(source).toContain('not that your MP')
  })

  it('never claims Stickee delivered the message or that the MP will respond', () => {
    expect(source).not.toContain('has been notified')
    expect(source).not.toContain('your MP will respond')
    expect(source).not.toContain('Your MP has been notified')
  })

  it('does not present a "Follow this issue" control (no real watchlist system exists)', () => {
    expect(source).not.toContain('Follow this issue')
  })
})

describe('Issue detail — single-column investigative layout', () => {
  const source = read('src/app/issue/[id]/page.tsx')

  it('does not use the old two-column dashboard grid', () => {
    expect(source).not.toContain('lg:grid-cols-3')
    expect(source).not.toContain('lg:col-span')
  })

  it('Simulator is demoted to Related, not shown directly under the header', () => {
    const headerIdx = source.indexOf('<PageHeader')
    const whatIsHappeningIdx = source.indexOf('What is happening?')
    const simulateIdx = source.indexOf('<SimulateThisButton')
    expect(whatIsHappeningIdx).toBeGreaterThan(headerIdx)
    expect(simulateIdx).toBeGreaterThan(whatIsHappeningIdx)
    expect(source).not.toContain('RecentRehearsalsStrip')
  })

  it('sections render in the approved order', () => {
    const order = [
      'title="What is happening?"',
      'title="Why this matters"',
      'title="Latest recorded update"',
      'title="Evidence"',
      'title="What has government done?"',
      'title="Who is responsible?"',
      'title="Forecasts"',
      'title="How can I influence this?"',
      'title="Related"',
    ]
    const positions = order.map(label => source.indexOf(label))
    for (const pos of positions) expect(pos).toBeGreaterThan(-1)
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1])
    }
  })
})

describe('Issue detail — Related links are real, canonical routes', () => {
  const source = read('src/app/issue/[id]/page.tsx')

  it('links to Government, People, and Forecasts', () => {
    expect(source).toContain('href="/parliament"')
    expect(source).toContain('href="/leaders"')
    expect(source).toContain('href="/predictions"')
  })

  it('links back to the Issues list, not the homepage', () => {
    expect(source).toContain('href="/issues"')
  })

  it('other-issues links use the real /issue/[id] route', () => {
    expect(source).toContain('href={`/issue/${other.id}`}')
  })
})
