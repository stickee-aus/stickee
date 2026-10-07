import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// Regression tests for ISSUES_V1_SIMPLIFICATION_REPORT.md — Issues V1:
// truthfulness and list-page simplification, governed by
// docs/philosophy/STICKEE_CHARTER.md. See the report for full before/after
// evidence and the classification of every value removed or preserved.

describe('Issues list — banned content is absent', () => {
  const source = read('src/components/IssuesPageClient.tsx')

  it('does not render MP Yes percentages', () => {
    expect(source).not.toContain('MP Yes')
    expect(source).not.toContain('yesPct')
  })

  it('does not render a public-support percentage', () => {
    expect(source).not.toMatch(/%\s*Australians agree/i)
    expect(source).not.toContain('agree')
  })

  it('does not render market probability, participant counts, or trend arrows unconditionally', () => {
    expect(source).not.toContain('totalParticipants')
    expect(source).not.toContain('TrendingUp')
    expect(source).not.toContain('TrendingDown')
    expect(source).not.toContain('probColor')
  })

  it('does not render a Yes/No/Abstain vote bar or totals', () => {
    expect(source).not.toContain('voteSummary.yes')
    expect(source).not.toContain('voteSummary.no')
    expect(source).not.toContain('voteSummary.abstain')
    expect(source).not.toContain('CheckCircle')
    expect(source).not.toContain('MinusCircle')
  })

  it('does not render supports/opposes narrative text', () => {
    expect(source).not.toContain('whoSupports')
    expect(source).not.toContain('whoOpposes')
  })

  it('does not render an "Email your MP" action', () => {
    expect(source).not.toContain('Email your MP')
    expect(source).not.toContain('EmailMPModal')
    expect(source).not.toContain('Mail')
  })

  it('does not render prediction controls', () => {
    expect(source).not.toContain('Predict outcome')
    expect(source).not.toContain('/predictions?market=')
  })

  it('does not use expand-in-place row state (list-page expansion removed)', () => {
    expect(source).not.toContain('useState(false)')
    expect(source).not.toContain('setExpanded')
  })

  it('does not use "Bills & Issues" / "bills tracked" terminology', () => {
    expect(source).not.toContain('Bills & Issues')
    expect(source).not.toContain('bills tracked')
    expect(source).not.toMatch(/\bbills\b/i)
  })

  it('does not repeat the headline count in a second stat-tile block', () => {
    // The old header rendered activeCount/passedCount a second time in a
    // `hidden sm:flex` stat-tile block alongside the hero number and tabs.
    expect(source).not.toContain('activeCount')
    expect(source).not.toContain('passedCount')
    expect(source).not.toContain('rejectedCount')
  })
})

describe('Issues list — required content is present', () => {
  const source = read('src/components/IssuesPageClient.tsx')

  it('renders real titles and summaries', () => {
    expect(source).toContain('issue.title')
    expect(source).toContain('issue.summary')
  })

  it('states the page purpose in one sentence', () => {
    expect(source).toContain('What major problems is Australia dealing with, and why do they matter?')
  })

  it('shows exactly one headline metric', () => {
    expect(source).toContain("label: 'Issues tracked'")
  })

  it('renders one dominant "View issue" action per row', () => {
    expect(source).toContain('View issue')
    expect(source).toContain('href={`/issue/${issue.id}`}')
  })

  it('uses the shared RecordRow, UnderlineTabs, and EmptyState primitives', () => {
    expect(source).toContain("from '@/components/ui/record-row'")
    expect(source).toContain("from '@/components/ui/underline-tabs'")
    expect(source).toContain("from '@/components/ui/empty-state'")
    expect(source).toContain("from '@/components/ui/page-shell'")
    expect(source).toContain("from '@/components/ui/page-header'")
  })

  it('does not introduce a page-scoped visual dialect (no bespoke hex colours or shadows)', () => {
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,6}/)
    expect(source).not.toContain('shadow')
    expect(source).not.toContain('rounded-full')
  })

  it('labels demo/mock content honestly and gates the forecast link on real data', () => {
    expect(source).toContain("source === 'mock'")
    expect(source).toContain('status="demo"')
    expect(source).toContain("source === 'database' && hasForecast")
  })

  it('renders a truthful empty state, not a fabricated fallback list', () => {
    expect(source).toContain('<EmptyState')
    expect(source).toContain('No issues match this filter')
  })
})

describe('Issues list — accessibility and mobile', () => {
  const source = read('src/components/IssuesPageClient.tsx')

  it('does not hide an interactive control behind a responsive utility with no mobile equivalent', () => {
    expect(source).not.toContain('hidden sm:flex')
    expect(source).not.toContain('hidden sm:table-cell')
  })

  it('uses list/listitem semantics for the row collection', () => {
    expect(source).toContain('role="list"')
    expect(source).toContain('role="listitem"')
  })

  it('does not nest a second interactive control inside the row link (no nested-button regression)', () => {
    expect(source).not.toContain('<button')
    expect(source).not.toContain('<a ')
  })
})

describe('RecordRow — extended, not duplicated', () => {
  const source = read('src/components/ui/record-row.tsx')

  it('gained an optional summary line rather than a new Issues-specific component', () => {
    expect(source).toContain('summary?: string')
    expect(source).toContain('text-body-copy')
  })

  it('still renders as a single link when href is provided (no nested interactive controls)', () => {
    expect(source).toContain('if (href)')
    expect(source).toContain('<Link href={href}')
  })
})

describe('issues-db — truthful data-source classification', () => {
  const source = read('src/lib/issues-db.ts')

  it('getIssuesPageData reports whether the response is real or mock data', () => {
    expect(source).toContain("source: 'database'")
    expect(source).toContain("source: 'mock'")
  })

  it('getIssueDetailData reports whether the response is real or mock data', () => {
    const detailFn = source.slice(source.indexOf('export async function getIssueDetailData'))
    expect(detailFn).toContain("source: 'database'")
    expect(detailFn).toContain("source: 'mock'")
  })

  it('fetches source_url and updated_at so real citations and dates can be shown', () => {
    expect(source).toContain('source_url')
    expect(source).toContain('updated_at')
  })
})

describe('Issue detail — immediately visible fabricated content is gated on real data', () => {
  const source = read('src/app/issue/[id]/page.tsx')

  it('shows a demo-content banner when the data source is not the database', () => {
    expect(source).toContain('!isVerified')
    expect(source).toContain('Demo content')
  })

  // ISSUE_DETAIL_V1_REPORT.md went further than this batch: mp_yes_count/
  // mp_no_count/mp_abstain_count have no confirmed sync from a real division
  // record even on the "verified" path (only a mock-fallback party-line
  // inference was gated before), so this batch removed the vote-count tiles
  // entirely rather than merely gating them on source==='database'. This
  // assertion is updated to pin that stronger removal, not a regression.
  it('never renders mp_yes_count/mp_no_count/mp_abstain_count as a public vote-count figure', () => {
    expect(source).not.toContain('isVerified && total > 0')
    expect(source).not.toContain('Voted Yes')
    expect(source).not.toContain('Voted No')
  })

  it('only renders a real forecast summary for verified, real market data — using the canonical Forecasts mapper, not the old IssueMarket grid', () => {
    expect(source).toContain('No verified forecast is linked to this issue yet.')
    expect(source).not.toContain('PredictionMarketGrid')
  })

  it('no longer shows a bare probability/participants badge sourced from possibly-mock market data', () => {
    expect(source).not.toContain('{market.probability}% probability')
  })

  it('frames the MP-contact action as "How can I influence this?", not "Take Action"', () => {
    expect(source).toContain('How can I influence this?')
    expect(source).not.toContain('>Take Action<')
  })

  it('states what Stickee can and cannot confirm about the email action', () => {
    expect(source).toContain('but not that your MP')
  })

  it('shows a citation or an explicit unsourced label for who-supports/opposes text on real data', () => {
    expect(source).toContain('issue.sourceUrl')
    expect(source).toContain('Sourced analysis — a specific citation for these positions has not yet been added.')
  })
})

describe('Civic action paths — audited, not modified', () => {
  it('EmailMPButton/EmailMPModal still resolve a real mailto link (the one working contact mechanism)', () => {
    const source = read('src/components/EmailMPModal.tsx')
    expect(source).toContain('mailto:')
  })

  it("CampaignModal's broken clipboard-copy contact action was retired in GOVERNMENT_V1_SIMPLIFICATION_REPORT.md — EmailMPModal's real mailto flow is the one contact mechanism now", () => {
    const source = read('src/components/CampaignModal.tsx')
    expect(source).not.toContain('handleCopyEmail')
  })

  it("CampaignModal's participant counter now reads the real pressure-summary endpoint, not mock data (fixed in GOVERNMENT_V1_SIMPLIFICATION_REPORT.md)", () => {
    const source = read('src/components/CampaignModal.tsx')
    expect(source).not.toContain('bill.campaignCount')
    expect(source).toContain('pressureSummary')
  })

  it('the real pressure-summary endpoint exists independently of CampaignModal (confirmed unchanged)', () => {
    const source = read('src/app/api/bills/pressure-summary/route.ts')
    expect(source).toContain("from('bill_pressures')")
  })
})
