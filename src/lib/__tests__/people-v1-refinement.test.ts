import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// Regression tests for PEOPLE_V1_REFINEMENT_REPORT.md — a focused refinement
// batch on top of the already-shipped PEOPLE_V1_SIMPLIFICATION_REPORT.md and
// PEOPLE_TRUTHFULNESS_BATCH_REPORT.md work. Scope: header-metric wording
// accuracy, progressive disclosure on the representation summary, a generic
// role/responsibility explainer, exact "Profile not yet available" copy, and
// a chamber label on the MP profile. See the report for full before/after.

describe('People header — metric label matches what the number actually counts', () => {
  const source = read('src/app/leaders/page.tsx')

  it('does not label the House-only count as if it covered every chamber', () => {
    // totalMPs is always houseMembers.length — "MPs tracked" implied full
    // parliamentary coverage once the Senate tab exists. Never re-introduce
    // that ambiguity, and never invent a fabricated combined total instead.
    expect(source).not.toContain("label: 'MPs tracked'")
  })

  it('states the metric scope truthfully', () => {
    expect(source).toContain("label: 'House members tracked'")
  })
})

describe('Representation summary — progressive disclosure, no invented "Other" bucket', () => {
  const source = read('src/app/leaders/page.tsx')

  it('collapses the full party breakdown behind an explicit toggle', () => {
    expect(source).toContain('compositionExpanded')
    expect(source).toContain('View full composition')
    expect(source).toContain('aria-expanded={compositionExpanded}')
  })

  it('is collapsed by default', () => {
    expect(source).toMatch(/compositionExpanded\s*,\s*setCompositionExpanded\]\s*=\s*useState\(false\)/)
  })

  it('never merges real party counts into a fabricated "Other" aggregate', () => {
    // No code path relabels or sums parties into an invented "Other" row —
    // the only place "Other" may appear at all is this file's own comment
    // explaining that constraint.
    expect(source).not.toMatch(/party\s*[:=]\s*['"]Other['"]/)
    expect(source).not.toMatch(/label:\s*['"]Other['"]/)
  })

  it('every real party keeps its own row; only visibility, not grouping, changes when collapsed', () => {
    expect(source).toContain('COMPOSITION_COLLAPSED_COUNT')
    expect(source).toContain('more party')
  })
})

describe('Role explainer — plain-language, generic, never a per-person or scored claim', () => {
  const source = read('src/app/leaders/page.tsx')

  it('is collapsed by default, matching the collapsed-representation-summary mobile priority', () => {
    expect(source).toMatch(/rolesExpanded\s*,\s*setRolesExpanded\]\s*=\s*useState\(false\)/)
  })

  it('covers Federal MP, Senator, and Minister as generic roles, not named individuals', () => {
    expect(source).toContain('Federal MP')
    expect(source).toContain('Senator')
    expect(source).toContain('Minister')
    expect(source).toContain('Represents an electorate in the House of Representatives')
    expect(source).toContain('Represents a state or territory')
    expect(source).toContain('executive responsibility for a portfolio')
  })

  it('states plainly that no single role can act alone', () => {
    expect(source).toContain('can act alone')
  })

  it('does not carry a numeric score, percentage, or ranking for any role', () => {
    // The whole role-explainer block should read as plain-language bullets,
    // never a computed weight — this directly extends RESPONSIBILITY_MAP_SPEC.md's
    // "no numeric influence/power score" rule to the generic role copy too.
    const rolesBlockStart = source.indexOf('What can these roles actually do?')
    const rolesBlockEnd = source.indexOf('</section>', rolesBlockStart)
    const rolesBlock = source.slice(rolesBlockStart, rolesBlockEnd)
    expect(rolesBlock).not.toMatch(/\d+%/)
  })

  it('does not use the banned "trust" or "approval" vocabulary anywhere on the page', () => {
    expect(source.toLowerCase()).not.toContain('trust')
    expect(source.toLowerCase()).not.toContain('approval')
  })
})

describe('Profile-link safety — exact "Profile not yet available" phrasing', () => {
  it('unresolvable directory rows show the exact brief-specified phrase, not a clickable control', () => {
    const source = read('src/app/leaders/page.tsx')
    expect(source).toContain('Profile not yet available')
    // The status branch must not also carry an href on the same row.
    expect(source).toMatch(/href=\{resolvable \? `\/mp\/\$\{mp\.id\}` : undefined\}/)
  })
})

describe('MP profile — chamber is stated, not just electorate', () => {
  const source = read('src/app/mp/[id]/page.tsx')

  it('renders a chamber label alongside the electorate', () => {
    expect(source).toContain('House of Representatives')
  })

  it('the chamber label is accurate because MPIndex is confirmed House-only', () => {
    // MPIndex is built entirely from MPs (src/lib/mock-data.ts), which has no
    // Senate entries — see PEOPLE_V1_SIMPLIFICATION_REPORT.md §6. This test
    // guards the premise the hardcoded label depends on: if MPIndex is ever
    // widened to include senators, this label must become conditional.
    const mockData = read('src/lib/mock-data.ts')
    expect(mockData).toContain('export const MPIndex: Record<string, MP> = Object.fromEntries(MPs.map(mp => [mp.id, mp]))')
  })
})
