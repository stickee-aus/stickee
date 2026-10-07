import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(here, '../../..')

function read(relativePath: string) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

// Regression tests for PAGE_REFACTOR_BATCH_1_REPORT.md — Batch 1 removed
// misleading/non-functional experiences across the app without changing
// route structure. Each test below pins the specific bug that was fixed so
// a future edit can't silently reintroduce it.

describe('Home page — pillar card links resolve to a real destination', () => {
  const source = read('src/app/page.tsx')

  it('no longer links pillar cards to the mismatched /issue/{pillarId} namespace', () => {
    expect(source).not.toContain('/issue/${pillar.id}')
  })

  // Superseded by DESIGN_SYSTEM_PHASE_3A_HOME_REPORT.md: the homepage no
  // longer renders a pillar grid at all — CIVIC_PILLARS is unverified mock
  // data with no real pillar_metrics/pillar_scores source behind it (see
  // STICKEE_SYSTEM_ARCHITECTURE.md's Civic Indicator System finding), so
  // the "National snapshot" section now shows a truthful empty state
  // instead of a mismatched-or-matched pillar link either way.
  it('no longer renders the mock CIVIC_PILLARS grid, matched-anchor or not', () => {
    expect(source).not.toContain('CIVIC_PILLARS')
    expect(source).not.toContain('/impact#${pillar.id}')
    expect(source).toContain('Verified national indicators are being prepared.')
  })

  it('PillarCard (used elsewhere, e.g. /impact) still renders a real anchor target for each pillar id', () => {
    const pillarCard = read('src/components/PillarCard.tsx')
    expect(pillarCard).toContain('id={pillar.id}')
  })
})

describe('Profile page — real auth gate, no fake identity', () => {
  const source = read('src/app/profile/page.tsx')

  it('no longer hardcodes a fake logged-in demo user', () => {
    expect(source).not.toContain('DEMO_USER')
    expect(source).not.toContain('isLoggedIn: true')
  })

  it('gates the logged-in view behind real auth status', () => {
    expect(source).toContain('useAuthStatus')
    expect(source).toContain('auth.authenticated')
  })

  it('shows a distinct loading state before auth is known', () => {
    expect(source).toContain('auth.hydrated')
  })

  it('no longer fabricates a civic score, weekly report, or random crowd percentage', () => {
    expect(source).not.toContain('SCORE_BREAKDOWN')
    expect(source).not.toContain('WeeklyReportCard')
    expect(source).not.toContain('Math.random()')
  })

  it('labels the local wallet balance as device-local, not account balance', () => {
    expect(source).toContain('not your account')
  })
})

describe('Notifications page — real empty state, no demo masking', () => {
  const hookSource = read('src/hooks/useNotifications.ts')
  const pageSource = read('src/app/notifications/page.tsx')

  it('the hook tracks a distinct error state separate from an empty result', () => {
    expect(hookSource).toContain('const [error, setError] = useState(false)')
    expect(hookSource).toMatch(/return\s*\{[\s\S]*error,/)
  })

  it('the page no longer seeds fake notifications when the real list is empty', () => {
    expect(pageSource).not.toContain('DEMO_NOTIFICATIONS')
    expect(pageSource).not.toContain('displayList')
  })

  it('loading, error and empty states are each distinctly reachable', () => {
    expect(pageSource).toContain('data-state="loading"')
    expect(pageSource).toContain('data-state="error"')
    expect(pageSource).toContain('data-state="empty"')
    expect(pageSource).toContain('data-state="populated"')
  })
})

describe('Leaderboard — no fake predictor rankings on any public surface', () => {
  // FORECASTS_V1_SIMPLIFICATION_REPORT.md went one step further than this
  // batch: an always-empty "not available yet" placeholder is still a
  // decorative block competing for space on a page this brief explicitly
  // asked to de-clutter, so the section is suppressed entirely rather than
  // shown as an honest-but-empty box. This assertion previously pinned the
  // placeholder text; it's updated to pin full suppression instead.
  it('PredictionsPageClient no longer embeds the hardcoded top-6 leaderboard, or any leaderboard placeholder', () => {
    const source = read('src/components/PredictionsPageClient.tsx')
    expect(source).not.toContain('leaderboard.slice(0, 6)')
    expect(source).not.toContain('LeaderCard')
    expect(source).not.toMatch(/Leaderboard/i)
  })

  it('LeaderboardGrid no longer renders the shared mock leaderboard array', () => {
    const source = read('src/components/LeaderboardGrid.tsx')
    expect(source).not.toContain("from '@/lib/mock-market-data'")
    expect(source).toContain('available yet')
  })

  it('/leaderboard no longer shows a fabricated "your rank" number', () => {
    const source = read('src/app/leaderboard/page.tsx')
    expect(source).not.toContain('MOCK_RANK')
    expect(source).not.toContain('your rank')
  })
})

describe('DecisionCard — no non-functional CTA button', () => {
  const source = read('src/components/DecisionCard.tsx')

  it('no longer renders the dead-click Predict Outcome / Agree-Disagree / Track Impact button', () => {
    expect(source).not.toContain('function ctaLabel')
    expect(source).not.toContain('onClick={e => { e.stopPropagation() }}')
  })

  it('the inline prediction pick no longer claims to be saved to the account', () => {
    expect(source).not.toContain('Prediction saved:')
  })
})

describe('PredictionMarketGrid — no inert Buy Yes/No buttons on the issue page', () => {
  const source = read('src/components/PredictionMarketGrid.tsx')

  it('no longer renders a Buy button with no onClick handler', () => {
    expect(source).not.toContain('Buy {outcome.outcome}')
    expect(source).not.toContain('>Trade</th>')
  })

  it('links out to the real staking flow on Forecasts instead', () => {
    expect(source).toContain('/predictions')
    expect(source).toContain('real stake')
  })
})

describe('Campaigns page — fake join/propose mechanics are disabled and labeled', () => {
  const source = read('src/app/campaigns/page.tsx')

  it('no longer lets a visitor "join" a campaign with a fake point reward', () => {
    expect(source).not.toContain('Join campaign')
    expect(source).not.toContain('setJoined')
    expect(source).not.toContain('+50 pts')
  })

  it('no longer claims proposals are ready for a review pipeline that does not exist', () => {
    expect(source).not.toContain('ready for the review flow')
    expect(source).not.toContain('100 upvotes from the community')
  })

  it('clearly labels the campaigns as example content and points to the real action system', () => {
    expect(source).toContain('example')
    expect(source).toContain('/parliament')
  })
})

describe('Wallet audit — no page shows two conflicting point balances at once', () => {
  it('the global daily-bonus banner (localStorage balance) hides itself on /predictions (real Supabase balance)', () => {
    const source = read('src/components/DailyBonusBanner.tsx')
    expect(source).toContain("HIDDEN_ON_PREFIXES = ['/predictions']")
    expect(source).toContain('hiddenHere')
  })

  it('/leaderboard no longer displays the localStorage wallet balance', () => {
    const source = read('src/app/leaderboard/page.tsx')
    expect(source).not.toContain('useWallet')
  })
})
