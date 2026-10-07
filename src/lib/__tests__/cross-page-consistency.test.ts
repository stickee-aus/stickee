import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function exists(relativePath: string) {
  return existsSync(path.join(repoRoot, relativePath))
}

// Regression tests for STICKEE_V1_CROSS_PAGE_CONSISTENCY_REPORT.md — the
// cross-page consistency sprint across Today, Issues, Issue Detail,
// Government/Parliament, Forecasts, People, MP Profile, and Political Pulse.
// See that report for the full before/after audit matrix. This file follows
// the repo's existing source-string regression convention (no jsdom/
// testing-library), matching every other *-v1*.test.ts file.

const CORE_PAGE_FILES: Record<string, string> = {
  Today: 'src/app/page.tsx',
  Issues: 'src/components/IssuesPageClient.tsx',
  'Issue Detail': 'src/app/issue/[id]/page.tsx',
  'Government/Parliament': 'src/app/parliament/page.tsx',
  Forecasts: 'src/components/PredictionsPageClient.tsx',
  People: 'src/app/leaders/page.tsx',
  'Political Pulse': 'src/components/PoliticalPulseClient.tsx',
}

describe('Every applicable core page uses PageShell', () => {
  for (const [page, file] of Object.entries(CORE_PAGE_FILES)) {
    it(`${page} imports and renders PageShell`, () => {
      const source = read(file)
      expect(source).toContain("from '@/components/ui/page-shell'")
      expect(source).toContain('<PageShell')
    })
  }
})

describe('Every list/detail core page uses PageHeader with the canonical "Australia · {Section}" eyebrow', () => {
  const cases: Array<[string, string, string]> = [
    ['Issues', 'src/components/IssuesPageClient.tsx', 'Australia · Issues'],
    ['Government/Parliament', 'src/app/parliament/page.tsx', 'Australia · Government'],
    ['Forecasts', 'src/components/PredictionsPageClient.tsx', 'Australia · Forecasts'],
    ['People', 'src/app/leaders/page.tsx', 'Australia · People'],
    ['Political Pulse', 'src/components/PoliticalPulseClient.tsx', 'Australia · Civic record'],
  ]

  for (const [page, file, eyebrow] of cases) {
    it(`${page} uses PageHeader and the eyebrow "${eyebrow}"`, () => {
      const source = read(file)
      expect(source).toContain("from '@/components/ui/page-header'")
      expect(source).toContain(eyebrow)
    })
  }

  it('Government/Parliament no longer uses the page-unique "Government · Federal Parliament" eyebrow arrangement', () => {
    const source = read('src/app/parliament/page.tsx')
    expect(source).not.toContain('eyebrow="Government · Federal Parliament"')
  })
})

describe('MP Profile and Issue Detail are single-column detail pages at the narrow PageShell width', () => {
  it('Issue Detail uses PageShell width="narrow"', () => {
    const source = read('src/app/issue/[id]/page.tsx')
    expect(source).toContain('width="narrow"')
  })

  it('MP Profile uses PageShell width="narrow", matching the Issue Detail precedent', () => {
    const source = read('src/app/mp/[id]/page.tsx')
    expect(source).toContain('width="narrow"')
  })
})

describe('StatusLabel replaces bespoke status pills — no raw shadcn Badge on public pages', () => {
  it('MP Profile no longer imports the pill-radius shadcn Badge for the party tag', () => {
    const source = read('src/app/mp/[id]/page.tsx')
    expect(source).not.toContain("from '@/components/ui/badge'")
    expect(source).not.toContain('<Badge')
  })

  it('MP Profile renders the party using the same swatch-plus-text pattern already used on the People directory', () => {
    const source = read('src/app/mp/[id]/page.tsx')
    expect(source).toMatch(/h-2\.5 w-2\.5 shrink-0 border/)
  })

  it('ChamberSummaryCard\'s "Live" indicator uses StatusLabel instead of a hardcoded amber hex pill', () => {
    const source = read('src/components/ChamberSummaryCard.tsx')
    expect(source).toContain("from '@/components/ui/status-label'")
    expect(source).toContain('label="Live"')
    expect(source).not.toContain("color: '#f5a623'")
  })
})

describe('No banned shadow/pill-radius/gradient/hardcoded-hex classes on touched consistency-sprint files', () => {
  const files = [
    'src/app/page.tsx',
    'src/app/issues/loading.tsx',
    'src/app/parliament/page.tsx',
    'src/app/parliament/loading.tsx',
    'src/components/ChamberSummaryCard.tsx',
    'src/components/ParliamentExperienceClient.tsx',
    'src/app/predictions/loading.tsx',
    'src/components/PredictionsPageClient.tsx',
    'src/app/leaders/loading.tsx',
    'src/app/mp/[id]/page.tsx',
    'src/app/mp/[id]/loading.tsx',
    'src/app/feed/loading.tsx',
  ]

  for (const file of files) {
    it(`${file} has no box-shadow/rounded-xl/rounded-2xl/rounded-3xl/rounded-4xl/gradient classes`, () => {
      const source = read(file)
      expect(source).not.toMatch(/rounded-(xl|2xl|3xl|4xl)/)
      expect(source).not.toMatch(/shadow-(?!overlay)/)
      expect(source).not.toContain('linear-gradient')
      expect(source).not.toContain('radial-gradient')
    })
  }

  it('rounded-full is only used for a genuine avatar photo placeholder (MP loading skeleton), nowhere else in this file set', () => {
    for (const file of files) {
      if (file === 'src/app/mp/[id]/loading.tsx') continue
      const source = read(file)
      expect(source).not.toContain('rounded-full')
    }
    expect(read('src/app/mp/[id]/loading.tsx')).toContain('rounded-full')
  })
})

describe('Loading skeletons match current page structure, not a retired layout', () => {
  it('/issues has a loading skeleton (previously missing entirely)', () => {
    expect(exists('src/app/issues/loading.tsx')).toBe(true)
  })

  it('Parliament loading skeleton no longer promises the retired dashboard grid/bills-table layout', () => {
    const source = read('src/app/parliament/loading.tsx')
    expect(source).not.toContain('grid-cols-1 lg:grid-cols-3')
    expect(source).not.toMatch(/rounded-(xl|lg|full)/)
  })

  it('Predictions loading skeleton no longer contains a hidden-on-mobile probability bar', () => {
    const source = read('src/app/predictions/loading.tsx')
    expect(source).not.toContain('hidden sm:')
  })

  it('MP Profile loading skeleton no longer shows a 4-tile stats row or a 6-row voting table that do not exist on the real page', () => {
    const source = read('src/app/mp/[id]/loading.tsx')
    expect(source).not.toContain('grid-cols-2 gap-3 sm:grid-cols-4')
    expect(source).not.toMatch(/Array\.from\(\{ length: 6 \}\)/)
  })

  for (const [page, file] of [
    ['Issues', 'src/app/issues/loading.tsx'],
    ['Issue Detail', 'src/app/issue/[id]/loading.tsx'],
    ['Government/Parliament', 'src/app/parliament/loading.tsx'],
    ['Forecasts', 'src/app/predictions/loading.tsx'],
    ['People', 'src/app/leaders/loading.tsx'],
    ['MP Profile', 'src/app/mp/[id]/loading.tsx'],
    ['Political Pulse', 'src/app/feed/loading.tsx'],
  ] as const) {
    it(`${page}'s loading skeleton uses the shared Skeleton primitive, not one-off raw divs`, () => {
      const source = read(file)
      expect(source).toContain("from '@/components/ui/skeleton'")
      expect(source).toContain('<Skeleton')
    })
  }
})

describe('No hidden-sm-only wrapper hides a functional control without a mobile equivalent', () => {
  const files = [
    'src/app/parliament/loading.tsx',
    'src/app/predictions/loading.tsx',
    'src/app/mp/[id]/loading.tsx',
    'src/app/issues/loading.tsx',
    'src/components/ChamberSummaryCard.tsx',
    'src/components/ParliamentExperienceClient.tsx',
  ]
  for (const file of files) {
    it(`${file} has no "hidden sm:*" wrapper`, () => {
      expect(read(file)).not.toMatch(/hidden sm:(flex|block)/)
    })
  }
})

describe('Disclosure controls use one calm, instant-flip chevron pattern', () => {
  it('ParliamentExperienceClient\'s "How Parliament works" accordion has aria-expanded and a ChevronDown icon, not an unlabelled arrow glyph', () => {
    const source = read('src/components/ParliamentExperienceClient.tsx')
    expect(source).toContain('aria-expanded={open}')
    expect(source).toContain('ChevronDown')
    expect(source).not.toContain("{open ? '↑' : '↓'}")
  })

  it('ChamberSummaryCard\'s MP-breakdown toggle has aria-expanded and no animated transition-transform spin', () => {
    const source = read('src/components/ChamberSummaryCard.tsx')
    expect(source).toContain('aria-expanded={showMPBreakdown}')
    expect(source).not.toContain('transition-transform duration-200')
  })

  it('ChamberSummaryCard\'s expand animation is opacity-only (fade-in), not a translateY slide-in', () => {
    const source = read('src/components/ChamberSummaryCard.tsx')
    expect(source).not.toContain('slide-in-from-top')
  })

  it('Forecasts\' "How forecasting works" chevron no longer animates via transition-transform', () => {
    const source = read('src/components/PredictionsPageClient.tsx')
    expect(source).not.toContain('transition-transform')
  })
})

describe('Typography — no arbitrary page-specific font sizes on the standardised chamber controls', () => {
  it('ChamberSummaryCard uses the shared text-micro-label/text-metadata tokens instead of font-mono text-[Npx]', () => {
    const source = read('src/components/ChamberSummaryCard.tsx')
    expect(source).not.toMatch(/font-mono text-\[(9|10|11)px\]/)
    expect(source).not.toContain('text-[11px]')
  })
})

describe('Today CTA truthfulness — no misleading "brief"/"personalise" promise for a page that performs neither', () => {
  const source = read('src/app/page.tsx')

  it('does not promise to "personalise" or "build" a brief that /onboarding cannot deliver', () => {
    expect(source).not.toContain('Personalise my brief')
    expect(source).not.toContain('Build my brief')
    expect(source).not.toContain('One useful weekly brief')
  })

  it('both CTAs pointing at /onboarding use truthful "guide" framing instead', () => {
    expect(source).toContain('How Stickee works')
    expect(source).toContain('See how it works')
    const onboardingLinks = (source.match(/href="\/onboarding"/g) ?? []).length
    expect(onboardingLinks).toBe(2)
  })
})

describe('Political Pulse stays engagement-free (unaffected by this sprint)', () => {
  const source = read('src/components/PoliticalPulseClient.tsx')
  it('renders no reactions, comments, share-for-points, or boosted badges', () => {
    expect(source).not.toContain('handleReact')
    expect(source).not.toContain('CommentPanel')
    expect(source).not.toContain('ShareButton')
    expect(source).not.toContain('BOOSTED')
  })
})

describe('Issue Detail stays single-column (unaffected by this sprint)', () => {
  it('has no lg:grid-cols-3 dashboard layout', () => {
    const source = read('src/app/issue/[id]/page.tsx')
    expect(source).not.toContain('lg:grid-cols-3')
  })
})

describe('People stays directory-first (unaffected by this sprint)', () => {
  it('has no embedded chamber visualisation', () => {
    const source = read('src/app/leaders/page.tsx')
    expect(source).not.toContain('HouseChamber')
    expect(source).not.toContain('SenateView')
  })
})

describe('Forecasts stays a flat list (unaffected by this sprint)', () => {
  it('has no featured-market slot or proposal modal', () => {
    const source = read('src/components/PredictionsPageClient.tsx')
    expect(source).not.toContain('FeaturedMarketCard')
    expect(source).not.toContain('ProposeMarketModal')
  })
})

describe('Government/Parliament keeps the Parliament-is-not-all-of-Government distinction (unaffected by this sprint)', () => {
  it('still renders the Government-vs-Parliament explainer block', () => {
    const source = read('src/app/parliament/page.tsx')
    expect(source).toContain('Government is broader than Parliament.')
  })
})
