import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../..')
const read = (file: string) => readFileSync(path.join(root, file), 'utf8')

describe('public truthfulness fallbacks', () => {
  it('does not publish the mock national civic score or simulated indicators', () => {
    const source = read('src/app/impact/page.tsx')
    expect(source).toContain('No verified data available')
    expect(source).toContain('Placeholder scores are not shown')
    expect(source).not.toContain('CIVIC_PILLARS')
    expect(source).not.toContain('PillarScoreboard')
  })

  it('does not publish fabricated campaign participation and outcomes', () => {
    const source = read('src/app/campaigns/page.tsx')
    expect(source).toContain('No verified campaigns are open')
    expect(source).toContain('participant counts, deadlines and promised outcomes have been removed')
    expect(source).not.toContain('CAMPAIGNS')
  })

  it('does not publish synthetic scenario recommendations as civic guidance', () => {
    const source = read('src/app/simulator/page.tsx')
    expect(source).toContain('No verified model available')
    expect(source).toContain('Previous synthetic recommendations are not shown')
    expect(source).not.toContain('SimulatorClient')
  })

  it('does not publish demo community identities or engagement as real profiles', () => {
    const source = read('src/app/u/[handle]/page.tsx')
    expect(source).toContain('does not have a verified public profile')
    expect(source).toContain('Demo identities, scores, follower counts and activity are not shown')
    expect(source).not.toContain('MOCK_PROFILES')
  })

  it('does not present local gamification as verified account activity', () => {
    const source = read('src/app/profile/page.tsx')
    expect(source).toContain('Local streaks, badges, points and mock civic grades are not shown')
    expect(source).not.toContain('useStreak')
    expect(source).not.toContain('CIVIC_PILLARS')
  })

  it('does not promise unsupported account rewards on sign-in', () => {
    const source = read('src/app/auth/sign-in/page.tsx')
    expect(source).not.toContain('personalised civic score')
    expect(source).not.toContain('earn real points')
    expect(source).not.toContain('250 referral bonus')
  })
})

describe('unavailable-data navigation and feedback', () => {
  it('renders Political Pulse immediately when Supabase is disabled', () => {
    const dataSource = read('src/lib/feed/pulse-data.ts')
    const client = read('src/components/PoliticalPulseClient.tsx')
    expect(dataSource).toContain("if (!isSupabaseConfigured) return { events: [], source: 'empty' }")
    expect(client).toContain("source === 'database' ? { value: events.length")
  })

  it('gives the notifications route a page heading and a truthful empty-state next step', () => {
    const source = read('src/app/notifications/page.tsx')
    expect(source).toContain('>\n            Notifications\n          </h1>')
    expect(source).toContain('Verified updates from followed issues')
    expect(source).toContain('href="/issues"')
    expect(source).not.toContain('build streaks')
  })

  it('short-circuits anonymous admin guards when the local backend is disabled', () => {
    const source = read('src/app/admin/_lib/guard.ts')
    expect(source).toContain("if (!isSupabaseConfigured) return { user: null, isAdmin: false as const }")
    expect(source).toContain("if (!isSupabaseConfigured) redirect('/auth/sign-in')")
  })

  it('preserves the global keyboard focus indicator on shared buttons', () => {
    const source = read('src/components/ui/button.tsx')
    expect(source).not.toMatch(/transition-all outline-none select-none/)
  })
})
