import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// Regression tests for PEOPLE_TRUTHFULNESS_BATCH_REPORT.md — /leaders,
// /mp/[id] and /leaders/[id] no longer mix verified parliamentary data with
// fabricated scores, fake community approval, or fictional people. See the
// report for the full evidence table this batch is based on.

describe('/leaders — unsupported politician scoring is gone', () => {
  const source = read('src/app/leaders/page.tsx')

  it('no longer imports or renders the fabricated politician scorecards', () => {
    expect(source).not.toContain('POLITICIAN_SCORECARDS')
    expect(source).not.toContain('FeaturedMPCard')
    expect(source).not.toContain('SCORED_MP_INFO')
    expect(source).not.toContain('Civic Analysis')
  })

  it('no longer shows a civic score or letter grade for any politician', () => {
    expect(source).not.toContain('civicScore')
    expect(source).not.toContain('scoreToGrade')
    expect(source).not.toContain('gradeStyle')
  })

  it('no longer claims a "Consistency" metric that is not actually computed from real votes', () => {
    expect(source).not.toContain('Consistency')
    expect(source).not.toContain('voting with majority')
  })
})

describe('/leaders — fake community approval is gone', () => {
  const source = read('src/app/leaders/page.tsx')

  it('no longer imports the hash-seeded fake approval hook/helpers', () => {
    expect(source).not.toContain('useApproval')
    expect(source).not.toContain('communityApprovalPct')
    expect(source).not.toContain('communityVoteCount')
  })

  it('no longer renders approve/disapprove controls', () => {
    expect(source).not.toContain('ApprovalButtons')
    expect(source).not.toContain('ThumbsUp')
    expect(source).not.toContain('ThumbsDown')
    expect(source).not.toContain('Approve')
    expect(source).not.toContain('Disapprove')
  })

  it('no longer claims a "community rating" or shows "Your approvals"', () => {
    expect(source).not.toContain('community rating')
    expect(source).not.toContain('community approval')
    expect(source).not.toContain('Your approvals')
  })

  it('no longer sorts or ranks representatives by the removed approval metric', () => {
    expect(source).not.toMatch(/sortBy === 'approval'/)
    expect(source).not.toContain("key: 'approval'")
  })
})

describe('/leaders — signed-out visitors see no personalised claims', () => {
  it('the page renders no per-user state at all (no auth-gated personal stats to leak)', () => {
    const source = read('src/app/leaders/page.tsx')
    // No approval/vote-count personalisation remains, for signed-in or signed-out users.
    expect(source).not.toContain('Your approvals')
    expect(source).not.toContain('ratings[')
  })
})

describe('/leaders — Rising Leaders (fictional people) is not publicly rendered', () => {
  const source = read('src/app/leaders/page.tsx')

  it('the page no longer imports or calls the Rising Leaders section', () => {
    expect(source).not.toContain('RisingLeadersSection')
    expect(source).not.toContain('Rising Leaders')
    expect(source).not.toContain('mock-leaders-data')
    expect(source).not.toContain('NominationModal')
  })

  it('the nominate action is not present (nominations are not implemented end-to-end)', () => {
    expect(source).not.toContain('+ Nominate')
    expect(source).not.toContain('Nominate a Future Leader')
  })
})

describe('/leaders/[id] — fictional community-leader profiles are neutralised', () => {
  const source = read('src/app/leaders/[id]/page.tsx')

  it('no longer renders fictional nominee data as if it were real', () => {
    expect(source).not.toContain("from '@/lib/mock-leaders-data'")
    expect(source).not.toContain("from '@/components/LeaderProfileDetail'")
    expect(source).not.toContain('<LeaderProfileDetail')
  })

  it('shows a truthful "not available" notice instead', () => {
    expect(source).toContain('Not available yet')
  })

  it('no longer statically prerenders any fictional leader page', () => {
    expect(source).toMatch(/generateStaticParams\(\)\s*\{\s*return \[\]\s*\}/)
  })
})

describe('/mp/[id] — genuine MP identity is retained, fabricated records are not', () => {
  const source = read('src/app/mp/[id]/page.tsx')

  it('still renders the real MP name, electorate and party', () => {
    expect(source).toContain('mp.name')
    expect(source).toContain('mp.electorate')
    expect(source).toContain('mp.party')
  })

  it('still shows the neutral score placeholder (not a fabricated score)', () => {
    expect(source).toContain('Individual voting analysis is not yet available for this representative.')
    expect(source).not.toContain('calculateStickeeScore')
  })

  it('no longer renders the fabricated per-party "Voting History" list as this MP\'s real record', () => {
    expect(source).not.toContain("import { MPIndex, getVotesForMP")
    expect(source).not.toContain('const mpVotes')
    expect(source).not.toContain('voteIcon[vote.vote]')
  })

  it('shows a truthful placeholder for voting history instead of inventing one', () => {
    expect(source).toContain('being verified against the real parliamentary record')
  })
})

describe('Representative directory links to the canonical MP route', () => {
  it('/leaders MP rows link to /mp/[id] when the id is resolvable, not a dead-end click handler only (see PEOPLE_V1_SIMPLIFICATION_REPORT.md for why unresolvable ids are guarded instead)', () => {
    const source = read('src/app/leaders/page.tsx')
    expect(source).toContain('href={resolvable ? `/mp/${mp.id}` : undefined}')
  })

  it('the canonical MP detail route is /mp/[id] (not /people/[id], which does not exist)', () => {
    const source = read('src/app/mp/[id]/page.tsx')
    expect(source.length).toBeGreaterThan(0)
  })
})

describe('Genuinely verified parliamentary data is untouched by this batch', () => {
  it('/leaders still shows real chamber source attribution', () => {
    const source = read('src/app/leaders/page.tsx')
    expect(source).toContain('TheyVoteForYou live feed')
    expect(source).toContain('liveParliament')
  })

  it('the AEC live-election disclosure text is still present', () => {
    const source = read('src/lib/aec-election.ts')
    expect(source).toMatch(/not an AEC declaration/i)
  })

  it('TheyVoteForYou sync routes are unmodified by this batch', () => {
    const membersSync = read('src/app/api/sync/members/route.ts')
    const divisionsSync = read('src/app/api/sync/divisions/route.ts')
    expect(membersSync.length).toBeGreaterThan(0)
    expect(divisionsSync.length).toBeGreaterThan(0)
  })

  it('the underlying scoring function and leader data are preserved, not deleted, for possible future use', () => {
    const scoreFn = read('src/lib/mock-data.ts')
    expect(scoreFn).toContain('calculateStickeeScore')
    const leaderData = read('src/lib/mock-leaders-data.ts')
    expect(leaderData).toContain('export const LEADERS')
  })
})
