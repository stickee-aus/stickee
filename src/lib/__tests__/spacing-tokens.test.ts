import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')
const read = (p: string) => readFileSync(path.join(repoRoot, p), 'utf8')

// Regression tests for the spacing-preview token layer (4px base, 8px rhythm).
// Source-string convention, matching design-system-foundation.test.ts.

describe('Spacing scale tokens', () => {
  const css = read('src/app/globals.css')

  it('defines --space-1…12 and every step is a multiple of 4px', () => {
    for (let i = 1; i <= 12; i++) {
      const m = css.match(new RegExp(`--space-${i}:\\s*([0-9.]+)rem`))
      expect(m, `--space-${i}`).not.toBeNull()
      expect((parseFloat(m![1]) * 16) % 4).toBe(0)
    }
  })

  it('defines responsive layout tokens and a 44px control height', () => {
    for (const token of ['--layout-gutter', '--layout-header-height', '--layout-measure', '--section-gap', '--hero-pad-top', '--hero-pad-bottom', '--card-gap']) {
      expect(css).toContain(`${token}:`)
    }
    expect(css).toMatch(/--control-height:\s*2\.75rem/)
  })

  it('keeps the active nav underline aligned to the header edge via tokens', () => {
    expect(css).toMatch(/\.simple-nav-link\.is-active::after\s*\{[^}]*calc\(\(var\(--layout-header-height\) - var\(--control-height\)\) \/ -2\)/)
  })
})

describe('Homepage and header consume the tokens', () => {
  const home = read('src/app/page.tsx')
  const nav = read('src/components/Navbar.tsx')
  const shell = read('src/components/ui/page-shell.tsx')

  it('hero uses gutter and hero padding tokens', () => {
    expect(home).toContain('px-(--layout-gutter) pt-(--hero-pad-top) pb-(--hero-pad-bottom)')
  })

  it('homepage sections are separated by the section-gap token', () => {
    expect(home).toContain('space-y-(--section-gap)')
  })

  it('every homepage LinkButton meets the 44px control height', () => {
    const buttons = home.match(/<LinkButton[^>]*>/g) ?? []
    expect(buttons.length).toBeGreaterThan(0)
    for (const b of buttons) expect(b).toContain('h-(--control-height)')
  })

  it('header and PageShell share the gutter token', () => {
    expect(nav).toContain('h-(--layout-header-height)')
    expect(nav).toContain('px-(--layout-gutter)')
    expect(shell).toContain('px-(--layout-gutter)')
  })

  it('notifications control has a 44px hit area', () => {
    expect(nav).toMatch(/href="\/notifications"\s*\n\s*className="[^"]*size-\(--control-height\)/)
  })
})
