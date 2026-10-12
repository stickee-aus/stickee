import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// Regression tests for GOVERNMENT_V1_SIMPLIFICATION_REPORT.md — Government/
// Parliament V1: truthfulness and simplification, governed by
// docs/philosophy/STICKEE_CHARTER.md. See the report for full before/after
// evidence and the classification of every value removed or preserved.

describe('Parliament page header — fabricated stats are absent', () => {
  const source = read('src/app/parliament/page.tsx')

  it('does not render the hardcoded Campaigns stat', () => {
    expect(source).not.toContain('14,351')
    expect(source).not.toContain('Campaigns')
  })

  it('does not render the hardcoded Predict Acc. stat', () => {
    expect(source).not.toContain('74%')
    expect(source).not.toContain('Predict Acc')
  })

  it('does not render the hardcoded Live Bills stat', () => {
    expect(source).not.toMatch(/value:\s*'3'/)
    expect(source).not.toContain('Live Bills')
  })

  it('uses PageShell and PageHeader shared primitives', () => {
    expect(source).toContain('PageShell')
    expect(source).toContain('PageHeader')
  })

  it('states the Government-versus-Parliament distinction', () => {
    expect(source).toContain('Government is broader than Parliament')
    expect(source).toMatch(/Executive government/)
  })

  it('only carries a real, computed metric when verified records exist', () => {
    expect(source).toContain("metric={dbData ? { value: dbData.members.length, label: 'Verified MPs tracked' } : undefined}")
    expect(source).not.toContain('?? 150')
  })

  it('labels a disconnected source as unverified rather than demo data', () => {
    expect(source).toContain("'No verified data available'")
    expect(source).toContain("'unverified'")
  })
})

describe('Priority bill module — gamification and unsupported claims removed', () => {
  const source = read('src/components/PriorityBillFocus.tsx')

  it('does not render a streak mechanic', () => {
    expect(source).not.toContain('StreakBadge')
    expect(source).not.toContain('useStreak')
    expect(source).not.toContain('streak')
  })

  it('does not render an urgency countdown', () => {
    expect(source).not.toContain('daysUntilVote')
    expect(source).not.toContain('InlineCountdown')
    expect(source).not.toContain('Vote in')
  })

  it('does not render a fabricated public-support percentage or gap bar', () => {
    expect(source).not.toContain('publicSupport')
    expect(source).not.toContain('PublicVsParliamentBar')
  })

  it('does not render an MP alignment score', () => {
    expect(source).not.toContain('alignment')
    expect(source).not.toContain('aligned')
    expect(source).not.toContain('misaligned')
    expect(source).not.toContain('AlignmentDial')
  })

  it('does not render the fabricated swing-vote panel', () => {
    expect(source).not.toContain('SwingVotePanel')
    expect(source).not.toContain('swingMPIds')
  })

  it('renders a real, source-classified pressure count instead', () => {
    expect(source).toContain('pressureSummary')
    expect(source).toContain('MetadataLine')
  })
})

describe('MPActionStrip — truthful representative resolution', () => {
  const source = read('src/components/MPActionStrip.tsx')

  it('does not render an alignment dial or score', () => {
    expect(source).not.toContain('AlignmentDial')
    expect(source).not.toContain('alignmentPct')
  })

  it('links to the canonical MP profile route', () => {
    expect(source).toMatch(/href=\{`\/mp\/\$\{mp\.id\}`\}/)
  })

  it('never labels an unconfirmed location suggestion as the representative', () => {
    expect(source).toContain('suggestedElectorate')
    expect(source).toContain('not a precise electorate boundary match')
    expect(source).toMatch(/if \(!mp \|\| !electorate\)/)
  })
})

describe('useElectorate — location detection requires explicit confirmation', () => {
  const source = read('src/hooks/useElectorate.ts')

  it('does not auto-commit a detected location as the electorate', () => {
    expect(source).not.toMatch(/setElectorate\(detected\)/)
  })

  it('exposes a distinct suggestion + confirm/reject flow', () => {
    expect(source).toContain('suggestedElectorate')
    expect(source).toContain('confirmSuggestedElectorate')
    expect(source).toContain('rejectSuggestedElectorate')
  })
})

describe('CampaignModal — real contact mechanism only, no fabricated claims', () => {
  const source = read('src/components/CampaignModal.tsx')

  it('does not render a non-mailto "Contact MP" clipboard action', () => {
    expect(source).not.toContain('handleCopyEmail')
    expect(source).not.toContain('buildEmailSnippet')
  })

  it('does not claim the MP is "watching their inbox"', () => {
    expect(source).not.toContain('watching their inbox')
  })

  it('does not render the fabricated swing-MP claim', () => {
    expect(source).not.toContain('MPs are undecided on this bill')
  })

  it('reads the real pressure-summary count instead of the mock campaignCount', () => {
    expect(source).not.toContain('bill.campaignCount')
    expect(source).not.toContain('bill.campaignDailyGrowth')
    expect(source).toContain('pressureSummary')
  })
})

describe('parliament-db.ts — no fabricated public-support proxy in the real data path', () => {
  const source = read('src/lib/parliament-db.ts')

  it('does not derive a publicPrediction number from the passed flag', () => {
    expect(source).not.toMatch(/d\.passed === true \? 75/)
  })

  it('sets publicPrediction/publicSupport to null rather than a fabricated proxy', () => {
    expect(source).toContain('publicPrediction: null')
    expect(source).toContain('publicSupport: null')
  })
})

describe('MPDrilldownTable — no fabricated "Public align" column', () => {
  const source = read('src/components/MPDrilldownTable.tsx')

  it('does not compute or render a public-alignment score', () => {
    expect(source).not.toContain('publicAlign')
    expect(source).not.toContain('Public align')
    expect(source).not.toContain('getPublicAlignment')
  })
})

describe('HouseChamber — no fabricated swing/sentiment modes or false vote claims', () => {
  const source = read('src/components/HouseChamber.tsx')

  it('does not render the fabricated swing-vote view mode', () => {
    expect(source).not.toContain('SWING_MPS_DATA')
    expect(source).not.toContain('Swing Votes (')
  })

  it('does not render the local-only fake "pressure" Agree/Disagree buttons', () => {
    expect(source).not.toContain('ThumbsUp')
    expect(source).not.toContain('ThumbsDown')
    expect(source).not.toContain('onPressure')
  })

  it('does not claim every seat reflects a real, individually recorded vote', () => {
    expect(source).not.toContain('These are real votes on laws')
  })
})

describe('ParliamentExperienceClient — duplicate bill catalogue removed', () => {
  const source = read('src/components/ParliamentExperienceClient.tsx')

  it('does not render BillSmartRow or an independent bill filter model', () => {
    expect(source).not.toContain('BillSmartRow')
    expect(source).not.toContain('FILTER_LABELS')
    expect(source).not.toContain("activeBillFilter")
  })

  it('links to Issues as the canonical catalogue', () => {
    expect(source).toContain("href=\"/issues\"")
    expect(source).toContain('View all issues')
  })

  it('links to People/leaders for the full representative directory', () => {
    expect(source).toContain("href=\"/leaders\"")
  })

  it('uses shared Civic Design System primitives', () => {
    expect(source).toContain('SectionHeader')
    expect(source).toContain('RecordRow')
    expect(source).toContain('EmptyState')
  })

  it('does not render the streak mechanic', () => {
    expect(source).not.toContain('useStreak')
    expect(source).not.toContain('StreakBadge')
  })

  it('does not render mock activity, representative, or chamber claims without verified data', () => {
    expect(source).toContain('hasVerifiedData && otherBills.length > 0')
    expect(source).toContain('No verified parliamentary activity is available.')
    expect(source).toContain('Representative lookup is temporarily unavailable.')
    expect(source).toContain('No verified chamber data is available.')
  })
})

describe('ChamberToggle replaced by the shared UnderlineTabs pattern', () => {
  it('ChamberSummaryCard no longer uses the banned pill/sliding-thumb toggle', () => {
    const source = read('src/components/ChamberSummaryCard.tsx')
    expect(source).not.toContain('ChamberToggle')
    expect(source).toContain('UnderlineTabs')
  })
})
