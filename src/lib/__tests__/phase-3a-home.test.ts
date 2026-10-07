import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { PRIMARY_NAV } from '@/lib/navigation'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// Regression tests for DESIGN_SYSTEM_PHASE_3A_HOME_REPORT.md — the homepage
// is now the reference implementation of the Civic Design System. These
// tests pin the specific requirements from that batch's Phase K checklist,
// following this repo's existing source-string regression convention (see
// design-system-foundation.test.ts) rather than DOM-rendered tests, since
// there is no jsdom/testing-library in this project.

describe('Homepage uses shared primitives, not a page-scoped dialect', () => {
  const source = read('src/app/page.tsx')

  it('uses PageShell for its below-hero content', () => {
    expect(source).toContain("from '@/components/ui/page-shell'")
    expect(source).toContain('<PageShell>')
  })

  it('uses SectionHeader as the canonical section-heading equivalent', () => {
    expect(source).toContain("from '@/components/ui/section-header'")
    expect(source).toContain('<SectionHeader')
  })

  it('uses ArticleCard for its card patterns (destinations and forecasts)', () => {
    expect(source).toContain("from '@/components/ui/article-card'")
    expect(source).toContain('<ArticleCard')
  })

  it('uses the canonical EmptyState for every truthful-absence message', () => {
    expect(source).toContain("from '@/components/ui/empty-state'")
    expect(source).toContain('<EmptyState')
  })

  it('no longer imports any homepage-only mock data source removed by this batch', () => {
    expect(source).not.toContain('mock-civic-data')
    expect(source).not.toContain('mock-government-data')
  })
})

describe('Homepage typography uses the serif heading token', () => {
  const source = read('src/app/page.tsx')

  it('the hero headline is bound to the civic heading font, not the sans body font', () => {
    expect(source).toMatch(/font-heading[^"]*"[^>]*>\s*Know what/)
  })
})

describe('No homepage gradient classes, hover-lift transforms, or orange accent remain', () => {
  const pageSource = read('src/app/page.tsx')
  const cssSource = read('src/app/globals.css')

  it('page.tsx contains no gradient, transform, or off-palette orange', () => {
    expect(pageSource).not.toMatch(/linear-gradient|radial-gradient/)
    expect(pageSource).not.toMatch(/translateY|hover:scale|hover:-translate/)
    expect(pageSource).not.toContain('#d85f36')
  })

  it('globals.css no longer defines the removed homepage-only .simple-hero/.simple-issue-card/.simple-forecast-card rules', () => {
    for (const selector of ['.simple-hero {', '.simple-hero-grid', '.simple-issue-card', '.simple-forecast-card', '.simple-score-card', '.simple-cta {']) {
      expect(cssSource).not.toContain(selector)
    }
  })

  it('Navbar/BottomNav-only .simple-* selectors are still present (not blindly deleted)', () => {
    for (const selector of ['.simple-nav {', '.simple-brand {', '.simple-nav-link {', '.simple-support-link {', '.simple-bottom-nav {']) {
      expect(cssSource).toContain(selector)
    }
  })
})

describe('No fabricated National Civic Score or agreement percentages render', () => {
  const source = read('src/app/page.tsx')

  it('does not compute or render a composite national civic score', () => {
    expect(source).not.toContain('CIVIC_PILLARS')
    expect(source).not.toContain('nationalCivicScore')
    expect(source).not.toMatch(/\/100/)
  })

  it('shows the truthful "indicators being prepared" empty state instead', () => {
    expect(source).toContain('Verified national indicators are being prepared.')
  })

  it('does not render an "improving"/"under pressure" trend label with no verified source behind it', () => {
    expect(source).not.toContain('Under pressure')
    expect(source).not.toContain('simple-trend')
  })
})

describe('No mock decision cards or fake engagement figures render', () => {
  const source = read('src/app/page.tsx')

  it('does not import or render the mock DECISIONS array', () => {
    expect(source).not.toContain('DECISIONS')
    expect(source).not.toContain("from '@/lib/mock-government-data'")
  })

  it('shows the truthful "decisions being prepared" empty state instead', () => {
    expect(source).toContain('Verified government decisions are being prepared.')
  })

  it('still links out to the Government section from that empty state, pointing at the real parliamentary record', () => {
    const govIdx = source.indexOf('Government activity')
    const linkIdx = source.indexOf('href="/parliament"', govIdx)
    expect(govIdx).toBeGreaterThan(-1)
    expect(linkIdx).toBeGreaterThan(govIdx)
  })
})

describe('Forecasts truthful empty state and primary actions', () => {
  const source = read('src/app/page.tsx')

  it('uses the canonical no-forecasts empty state when nothing is active', () => {
    expect(source).toContain('variant="no-forecasts"')
    expect(source).toContain('No verified forecasts are currently open.')
  })

  it('keeps exactly the two approved hero primary actions', () => {
    expect(source).toContain('Explore the issues')
    expect(source).toContain('How Stickee works')
    expect(source).toContain('href="/issues"')
    expect(source).toContain('href="/onboarding"')
  })

  it('does not add a third or fourth primary hero action', () => {
    const heroMatch = source.match(/<section className="border-b border-border">([\s\S]*?)<\/section>/)
    expect(heroMatch).not.toBeNull()
    const linkButtonCount = (heroMatch?.[1].match(/<LinkButton/g) ?? []).length
    expect(linkButtonCount).toBe(2)
  })
})

describe('Public navigation terminology stays consistent with src/lib/navigation.ts', () => {
  const source = read('src/app/page.tsx')

  it('uses the same Issues/Government/Forecasts labels PRIMARY_NAV uses, not a homepage-only synonym', () => {
    const navLabels = PRIMARY_NAV.map(item => item.label)
    expect(navLabels).toEqual(['Today', 'Issues', 'Government', 'Forecasts', 'People'])
    expect(source).toContain("'Issues'")
    expect(source).toContain("'Government'")
    expect(source).toContain("'Forecasts'")
  })

  it('never reintroduces the retired "Markets"/"Predictions" public labels', () => {
    expect(source).not.toMatch(/title=["']Markets["']/)
    expect(source).not.toMatch(/title=["']Predictions["']/)
  })
})

describe('No pill-shaped homepage actions are introduced', () => {
  const source = read('src/app/page.tsx')

  it('contains no rounded-full or 999px radius on any homepage element', () => {
    expect(source).not.toMatch(/rounded-full/)
    expect(source).not.toMatch(/999px/)
  })

  it('primary hero actions render through the shared LinkButton (buttonVariants-driven, non-pill)', () => {
    expect(source).toContain("from '@/components/LinkButton'")
    expect(source).toContain('<LinkButton')
  })
})
