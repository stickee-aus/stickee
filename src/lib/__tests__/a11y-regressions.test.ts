import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const src = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

function hexLum(hex: string) {
  const n = hex.replace('#', '')
  const c = [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16) / 255)
  const l = c.map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]
}
const contrast = (a: string, b: string) => {
  const [x, y] = [hexLum(a), hexLum(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
const token = (name: string) => {
  const m = src('src/app/globals.css').match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`token ${name} missing`)
  return m[1]
}

describe('accessibility regressions', () => {
  it('layout renders a skip link targeting the main landmark', () => {
    const layout = src('src/app/layout.tsx')
    expect(layout).toMatch(/href="#main-content"/)
    expect(layout).toMatch(/<main id="main-content"/)
    expect(src('src/app/globals.css')).toMatch(/\.skip-link:focus/)
  })

  it('toast container is a labelled region landmark', () => {
    const toast = src('src/components/ui/toast.tsx')
    expect(toast).toMatch(/role="region"\s+aria-label="Notifications"/)
  })

  it('bottom nav inactive colour meets 4.5:1 on its background', () => {
    const nav = src('src/components/BottomNav.tsx')
    expect(nav).not.toMatch(/#7a817c/i)
    expect(nav).toMatch(/var\(--ink-muted\)/)
    expect(contrast(token('ink-muted'), token('paper-raised'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(token('ink-muted'), token('paper'))).toBeGreaterThanOrEqual(4.5)
  })

  it('cookie banner and onboarding modal drop legacy low-contrast hexes', () => {
    for (const f of ['src/components/CookieBanner.tsx', 'src/components/OnboardingModal.tsx']) {
      const s = src(f)
      expect(s).not.toMatch(/style=\{\{[^}]*color:\s*'#(5a5a5e|3a3a3e|2ec266)'/i)
      expect(s).not.toMatch(/(^|[\s{])color:[^\n]*\? '#e8e8e6'/im)
    }
    expect(contrast(token('status-positive'), token('paper'))).toBeGreaterThanOrEqual(4.5)
  })

  it('homepage section links have at least 44px tap height', () => {
    const page = src('src/app/page.tsx')
    const links = page.match(/<Link href="\/(parliament|predictions)" className="[^"]*"/g) ?? []
    expect(links.length).toBeGreaterThanOrEqual(3)
    for (const l of links) expect(l).toMatch(/min-h-11/)
  })

  it('onboarding modal is a light-surface dialog', () => {
    const s = src('src/components/OnboardingModal.tsx')
    expect(s).toMatch(/role="dialog"\s+aria-modal="true"\s+aria-label=/)
    expect(s).not.toMatch(/background: '#0a0a0b'/)
  })

  it('daily bonus banner is a landmark with a named dismiss button', () => {
    const s = src('src/components/DailyBonusBanner.tsx')
    expect(s).toMatch(/role="region" aria-label="Daily bonus"/)
    expect(s).toMatch(/aria-label="Dismiss daily bonus banner"/)
  })
})
