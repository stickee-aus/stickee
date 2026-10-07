import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// Regression tests for DESIGN_SYSTEM_FOUNDATION_BATCH_REPORT.md — Phase 1
// (token foundation) and Phase 2 (shared primitives). These are grep-style
// source assertions (matching this repo's existing test convention — see
// navigation.test.ts) rather than DOM-rendering tests, since there is no
// jsdom/testing-library in this project.

const NEW_PRIMITIVES = [
  'src/components/ui/page-shell.tsx',
  'src/components/ui/page-header.tsx',
  'src/components/ui/section-header.tsx',
  'src/components/ui/article-card.tsx',
  'src/components/ui/record-row.tsx',
  'src/components/ui/status-label.tsx',
  'src/components/ui/metadata-line.tsx',
  'src/components/ui/underline-tabs.tsx',
  'src/components/ui/evidence-block.tsx',
  'src/components/ui/empty-state.tsx',
]

describe('Phase 1 — serif heading font is loaded and wired to --font-heading', () => {
  const layout = read('src/app/layout.tsx')
  const css = read('src/app/globals.css')

  it('loads IBM Plex Serif via next/font/google as --font-serif', () => {
    expect(layout).toMatch(/IBM_Plex_Serif/)
    expect(layout).toMatch(/variable:\s*['"]--font-serif['"]/)
  })

  it('applies the serif variable class on the root html element', () => {
    expect(layout).toMatch(/ibmPlexSerif\.variable/)
  })

  it('points --font-heading at var(--font-serif), not var(--font-sans)', () => {
    expect(css).toMatch(/--font-heading:\s*var\(--font-serif\)/)
    expect(css).not.toMatch(/--font-heading:\s*var\(--font-sans\)/)
  })
})

describe('Phase 1 — one canonical colour/radius token system', () => {
  const css = read('src/app/globals.css')

  it('defines the civic semantic palette exactly once, shared by :root and .dark', () => {
    const rootTokens = ['--paper:', '--paper-raised:', '--ink:', '--civic-accent:', '--status-positive:', '--status-negative:']
    for (const token of rootTokens) {
      const occurrences = css.split(token).length - 1
      // exactly two: one in :root, one in .dark (which intentionally mirrors :root — no dark theme shipped this batch)
      expect(occurrences).toBe(2)
    }
  })

  it('does not default to the old dark trading-terminal background', () => {
    expect(css).not.toMatch(/--background:\s*#0a0a0b/)
  })

  it('removes the off-palette Kalshi accent theme tokens', () => {
    expect(css).not.toMatch(/--color-k-green/)
    expect(css).not.toMatch(/--color-k-red/)
    expect(css).not.toMatch(/--color-k-amber/)
  })

  it('sets a small modern corner radius (4-6px), not the old 0rem flat system', () => {
    expect(css).toMatch(/--radius:\s*0\.375rem/)
    expect(css).not.toMatch(/--radius:\s*0rem/)
  })

  it('defines an overlay-only elevation token', () => {
    expect(css).toMatch(/--shadow-overlay:/)
  })
})

describe('Phase 1 — obsolete dead classes removed from the foundation', () => {
  const css = read('src/app/globals.css')

  it('removes the unused k-grade/impact/sentiment/trending/decision-* classes', () => {
    for (const selector of ['.k-grade-a', '.impact-high', '.impact-medium', '.impact-low', '.sentiment-positive', '.sentiment-negative', '.trending-pill', '.decision-title', '.decision-meta', '.decision-summary']) {
      expect(css).not.toContain(selector)
    }
  })

  it('removes the neutered gradient/glow utility classes', () => {
    for (const selector of ['.gradient-text', '.glow-primary', '.glow-sm', '.hero-gradient']) {
      expect(css).not.toContain(selector)
    }
  })

  it('keeps .simple-* (still consumed by Home/Navbar/BottomNav) but drops every banned pattern from it', () => {
    const simpleBlockStart = css.indexOf('.simple-nav {')
    expect(simpleBlockStart).toBeGreaterThan(-1)
    const simpleBlock = css.slice(simpleBlockStart)
    expect(simpleBlock).not.toMatch(/box-shadow:\s*(?!none)/)
    expect(simpleBlock).not.toMatch(/linear-gradient|radial-gradient/)
    expect(simpleBlock).not.toMatch(/border-radius:\s*999px/)
    expect(simpleBlock).not.toMatch(/transform:\s*translateY/)
    expect(simpleBlock).not.toMatch(/backdrop-filter/)
    expect(simpleBlock).not.toMatch(/#d85f36/)
  })
})

describe('Phase 2 — shared primitives exist and render with approved tokens', () => {
  for (const file of NEW_PRIMITIVES) {
    it(`${file} exists and is a real component (not a stub)`, () => {
      const source = read(file)
      expect(source.length).toBeGreaterThan(100)
      expect(source).toMatch(/export function|export const/)
    })
  }
})

describe('Phase 2 — no primitive uses pill radius', () => {
  for (const file of NEW_PRIMITIVES) {
    it(`${file} does not use rounded-full or a 999px pill radius`, () => {
      const source = read(file)
      expect(source).not.toMatch(/rounded-full/)
      expect(source).not.toMatch(/999px/)
    })
  }
})

describe('Phase 2 — no primitive uses glow, gradient, or a hover transform', () => {
  for (const file of NEW_PRIMITIVES) {
    it(`${file} has no gradient/glow/transform-on-hover`, () => {
      const source = read(file)
      expect(source).not.toMatch(/linear-gradient|radial-gradient/)
      expect(source).not.toMatch(/hover:scale|hover:-translate|hover:translate/)
      expect(source).not.toMatch(/boxShadow/)
    })
  }

  it('the one permitted shadow (overlay elevation) is scoped to the Dialog popup, not a card', () => {
    const dialog = read('src/components/ui/dialog.tsx')
    expect(dialog).toMatch(/shadow-\[var\(--shadow-overlay\)\]/)
    for (const file of NEW_PRIMITIVES) {
      const source = read(file)
      expect(source).not.toMatch(/shadow-/)
    }
  })
})

describe('Phase 2 — StatusLabel communicates status through text, not colour alone', () => {
  const source = read('src/components/ui/status-label.tsx')

  it('every status has a text label, and the label always renders', () => {
    for (const status of ['active', 'proposed', 'passed', 'resolved', 'voided', 'unavailable', 'demo']) {
      expect(source).toMatch(new RegExp(`${status}:\\s*\\{\\s*label:`))
    }
    expect(source).toMatch(/\{label \?\? config\.label\}/)
  })

  it('is not implemented as a filled colour pill', () => {
    expect(source).not.toMatch(/rounded-full/)
    expect(source).not.toMatch(/background:\s*config\.color/)
  })
})

describe('Phase 2 — MetadataLine and EvidenceBlock render source/freshness as accessible text', () => {
  it('MetadataLine renders its parts as visible text content, not only via aria/title attributes', () => {
    const source = read('src/components/ui/metadata-line.tsx')
    expect(source).toMatch(/\{part\}/)
    expect(source).not.toMatch(/aria-hidden="true">\s*\{part\}/)
  })

  it('EvidenceBlock renders source/methodology/freshness/confidence as visible <dd> text', () => {
    const source = read('src/components/ui/evidence-block.tsx')
    expect(source).toMatch(/row\.value/)
    expect(source).toMatch(/No verified data available/)
  })
})

describe('Phase 2 — Dialog/overlay shell is re-themed onto the civic tokens', () => {
  it('Dialog popup uses bg-popover/text-popover-foreground (token-driven), not a hardcoded dark colour', () => {
    const source = read('src/components/ui/dialog.tsx')
    expect(source).toMatch(/bg-popover/)
    expect(source).toMatch(/text-popover-foreground/)
    expect(source).not.toMatch(/#0a0a0b|#111113/)
  })
})

describe('Accessibility — keyboard focus stays visible and motion respects user preference', () => {
  const css = read('src/app/globals.css')

  it('defines a visible :focus-visible outline using the accent token', () => {
    expect(css).toMatch(/:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--civic-accent\)/)
  })

  it('honours prefers-reduced-motion by collapsing animation/transition duration', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
    expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/)
    expect(css).toMatch(/transition-duration:\s*0\.01ms\s*!important/)
  })
})

describe('Design system showcase fixture composes every primitive (dev-only, not a route)', () => {
  it('is not reachable as a public route', () => {
    // Fixture must live under a component directory, never under src/app (routable).
    expect(() => read('src/app/design-system/page.tsx')).toThrow()
  })

  it('imports and renders every Phase 2 primitive', () => {
    const source = read('src/components/ui/__dev__/design-system-showcase.tsx')
    const expectedImports = [
      'page-shell', 'page-header', 'section-header', 'article-card',
      'record-row', 'status-label', 'metadata-line', 'evidence-block',
      'empty-state',
    ]
    for (const name of expectedImports) {
      expect(source).toContain(name)
    }
  })
})
