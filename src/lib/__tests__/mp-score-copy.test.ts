import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// These assert against the exact copy the audit flagged in
// docs/audits/DATA_AND_CONTENT_AUDIT.md / docs/audits/PRODUCTION_BLOCKERS.md (P0-4): a "Stickee
// Score" shown on real MPs' profiles that claimed to reflect individual
// voting consistency while actually being computed from a fixed per-party
// assumption. If any of these strings reappear, someone has reintroduced
// the misleading claim — these tests exist specifically to catch that.

describe('MP score misleading copy is not present', () => {
  it('mp/[id]/page.tsx no longer claims the score reflects individual voting consistency', () => {
    const source = read('src/app/mp/[id]/page.tsx')
    expect(source).not.toContain('reflects how consistently')
    expect(source).not.toContain('calculateStickeeScore')
  })

  it('mp/[id]/page.tsx shows the neutral placeholder instead', () => {
    const source = read('src/app/mp/[id]/page.tsx')
    expect(source).toContain('Individual voting analysis is not yet available for this representative.')
  })

  it('MPVoteGrid no longer shows the "votes with majority" accuracy claim', () => {
    const source = read('src/components/MPVoteGrid.tsx')
    expect(source).not.toContain('Votes with majority')
    expect(source).not.toContain('stickeeScore')
  })

  it('leaders/page.tsx no longer sorts MPs by the fabricated score', () => {
    const source = read('src/app/leaders/page.tsx')
    expect(source).not.toMatch(/sortBy === 'voting'/)
    expect(source).not.toContain('stickeeScore')
  })

  it('the scoring function itself is preserved (not deleted) and gated behind a flag', () => {
    const source = read('src/lib/mock-market-data.ts')
    expect(source).toContain('calculateStickeeScore')
    expect(source).toContain('NEXT_PUBLIC_MP_SCORE_ENABLED')
  })
})

describe('genuinely sourced political data is untouched by this batch', () => {
  it('the AEC live-election disclosure text is still present', () => {
    const source = read('src/lib/aec-election.ts')
    expect(source).toMatch(/not an AEC declaration/i)
  })

  it('TheyVoteForYou sync routes are unmodified by this batch', () => {
    // These should still exist and still hit the real TVFY API — this
    // batch did not touch real data pipelines, only the fabricated display
    // layer built on top of one of them.
    const membersSync = read('src/app/api/sync/members/route.ts')
    const divisionsSync = read('src/app/api/sync/divisions/route.ts')
    expect(membersSync.length).toBeGreaterThan(0)
    expect(divisionsSync.length).toBeGreaterThan(0)
  })
})
