import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// Regression tests for PEOPLE_V1_SIMPLIFICATION_REPORT.md — People V1:
// directory, representation, and accountability simplification, governed by
// docs/philosophy/STICKEE_CHARTER.md. See the report for full before/after
// evidence and the classification of every value removed or preserved.

describe('People page — directory-first, not chamber-first', () => {
  const source = read('src/app/leaders/page.tsx')

  it('does not embed the full interactive chamber visualisation', () => {
    expect(source).not.toContain('HouseChamber')
    expect(source).not.toContain('SenateView')
  })

  it('does not embed the live-election-results toggle', () => {
    expect(source).not.toContain('useLiveElection')
    expect(source).not.toContain('LiveResultsExplainer')
    expect(source).not.toContain('Live Election Results')
  })

  it('uses shared Civic Design System primitives', () => {
    expect(source).toContain('PageShell')
    expect(source).toContain('PageHeader')
    expect(source).toContain('SectionHeader')
    expect(source).toContain('RecordRow')
    expect(source).toContain('EmptyState')
    expect(source).toContain('UnderlineTabs')
  })

  it('renders real MP names, parties, and electorates', () => {
    expect(source).toContain('mp.name')
    expect(source).toContain('mp.party')
    expect(source).toContain('mp.electorate')
  })

  it('has a search control for the directory', () => {
    expect(source).toContain('type="search"')
  })

  it('links to Government/Parliament for full chamber exploration instead of duplicating it', () => {
    expect(source).toContain('href="/parliament"')
    expect(source).toContain('Explore Parliament')
  })

  it('does not render fabricated score, grade, approval, or trust content', () => {
    expect(source).not.toContain('approval')
    expect(source).not.toContain('trust')
    expect(source).not.toContain('civicScore')
    expect(source).not.toContain('generateScores')
    expect(source).not.toContain('POLITICIAN_SCORECARDS')
  })

  it('does not render Rising Leaders / community-nominated content', () => {
    expect(source).not.toContain('Rising Leaders')
    expect(source).not.toContain('Nominate')
    expect(source).not.toContain('mock-leaders-data')
  })
})

describe('People page — representative-lookup requires confirmation when approximate', () => {
  const source = read('src/app/leaders/page.tsx')

  it('reuses the shared useElectorate hook rather than inventing a new lookup', () => {
    expect(source).toContain('useElectorate')
  })

  it('renders the Find your representative section', () => {
    expect(source).toContain('Find your representative')
    expect(source).toContain('FindYourRepresentative')
  })
})

describe('FindYourRepresentative — approximate detection, never presented as verified', () => {
  const source = read('src/components/FindYourRepresentative.tsx')

  it('labels automatic detection as approximate', () => {
    expect(source).toMatch(/approximate/i)
  })

  it('does not build or claim to perform address, electoral-roll, or Digital ID verification', () => {
    // The component's own comment explicitly disclaims these — check no
    // feature/import actually implements one, not that the words never appear.
    expect(source).not.toContain('DigitalID')
    expect(source).not.toContain('electoral-roll-lookup')
    expect(source).not.toMatch(/placeholder="[^"]*address/i)
  })

  it('requires explicit confirmation before showing a resolved representative', () => {
    expect(source).toContain('suggestedElectorate')
    expect(source).toContain('onConfirmSuggested')
    expect(source).toMatch(/if \(!mp \|\| !electorate\)/)
  })

  it('supports manual electorate entry', () => {
    expect(source).toContain('onManual')
    expect(source).toContain('Enter manually')
  })
})

describe('Directory rows — canonical-ID guard, no silently broken links', () => {
  const source = read('src/app/leaders/page.tsx')

  it('only renders a profile link when the id is resolvable against MPIndex', () => {
    expect(source).toContain('isResolvableProfileId')
    expect(source).toContain("id.startsWith('mp-')")
  })

  it('shows a truthful unavailable label instead of a dead link for unresolvable ids', () => {
    // Updated by PEOPLE_V1_REFINEMENT_REPORT.md to the exact phrase named in
    // the People V1 refinement brief ("Profile not yet available" — a plain
    // status, never a clickable control).
    expect(source).toContain('Profile not yet available')
  })

  it('does not render scores, grades, campaign points, or popularity metrics per row', () => {
    expect(source).not.toContain('campaignCount')
    expect(source).not.toContain('popularity')
    expect(source).not.toContain('alignmentPct')
  })
})

describe('MP profile — safe, aligned with People, no fabricated content', () => {
  const source = read('src/app/mp/[id]/page.tsx')

  it('retains real identity fields', () => {
    expect(source).toContain('mp.name')
    expect(source).toContain('mp.party')
    expect(source).toContain('mp.electorate')
  })

  it('shows the truthful unavailable state for voting analysis, per the canonical-ID problem', () => {
    expect(source).toContain('Individual voting analysis is not yet available for this representative.')
  })

  it('does not substitute party-level inference for individual voting history', () => {
    // Only the historical removal is documented in a comment (mentions the
    // name); check there's no live import/usage, matching the established
    // pattern in people-truthfulness.test.ts.
    expect(source).not.toContain('import { MPIndex, getVotesForMP')
    expect(source).not.toContain('const mpVotes')
    expect(source).not.toContain("from '@/lib/mock-data'\nimport { PARTY_VOTE_MAP")
  })

  it('does not render a score, grade, approval, or trust value', () => {
    expect(source).not.toContain('calculateStickeeScore')
    expect(source).not.toContain('stickeeScore}')
    expect(source).not.toMatch(/approval|trust score/i)
  })

  it('renders a generic, role-based responsibility block, not a per-MP claim', () => {
    expect(source).toContain('FEDERAL_MP_RESPONSIBILITIES')
    expect(source).toContain('What a Federal MP can and cannot do')
  })

  it('does not imply an individual MP controls a department or sets executive policy', () => {
    expect(source).toContain('cannot unilaterally pass or block legislation')
    expect(source).toContain('does not yet verify or display that role')
  })

  it('links back to People, the canonical representative surface', () => {
    expect(source).toContain('href="/leaders"')
    expect(source).toContain('Back to People')
  })

  it('uses the shared PageShell/MetadataLine primitives', () => {
    expect(source).toContain('PageShell')
    expect(source).toContain('MetadataLine')
  })
})

describe('Community section — confirmed hidden, not rebuilt', () => {
  it('/leaders/[id] still shows the truthful "not available" notice for every id', () => {
    const source = read('src/app/leaders/[id]/page.tsx')
    expect(source).toContain('Not available yet')
    expect(source).toContain('generateStaticParams')
  })

  it('the People directory does not reference the community-leader route or components', () => {
    const source = read('src/app/leaders/page.tsx')
    expect(source).not.toContain('LeaderProfileDetail')
    expect(source).not.toContain('NominationModal')
    expect(source).not.toContain('useApproval')
  })

  it('layout metadata no longer promises community-nominated leaders alongside MPs', () => {
    const source = read('src/app/leaders/layout.tsx')
    expect(source).not.toMatch(/community-nominated/i)
    expect(source).not.toMatch(/rising community leaders/i)
  })
})

describe('Source/sync metadata remains visible', () => {
  it('People header carries a MetadataLine with source and verification state', () => {
    const source = read('src/app/leaders/page.tsx')
    expect(source).toContain('metadata={{')
    expect(source).toContain('verification:')
  })
})
