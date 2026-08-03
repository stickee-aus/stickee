import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  ChevronRight,
  CircleDollarSign,
  FlaskConical,
  Landmark,
  Megaphone,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { CIVIC_PILLARS } from '@/lib/mock-civic-data'
import { nationalCivicScore } from '@/lib/civic-utils'
import { DECISIONS } from '@/lib/mock-government-data'

export const metadata: Metadata = {
  title: 'Stickee — Australian politics, made clear',
  description: 'See what is changing, why it matters, and what you can do about it — without the political noise.',
}

const score = nationalCivicScore(CIVIC_PILLARS)
const focusPillars = CIVIC_PILLARS.slice(0, 4)
const latestDecisions = [...DECISIONS]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, 3)

const quickActions = [
  { href: '/decisions', icon: Landmark, label: 'See decisions', detail: 'Bills, policy and spending' },
  { href: '/simulator', icon: FlaskConical, label: 'Test an idea', detail: 'Compare possible outcomes' },
  { href: '/campaigns', icon: Megaphone, label: 'Take action', detail: 'Support a local campaign' },
]

export default function HomePage() {
  return (
    <div className="simple-home">
      <section className="simple-hero">
        <div className="simple-shell simple-hero-grid">
          <div className="simple-hero-copy">
            <p className="simple-eyebrow"><span /> Australia, in plain English</p>
            <h1>Know what’s changing.<br />Know what to do.</h1>
            <p className="simple-lede">
              Stickee turns Australian politics into a clear weekly picture — the issues, the decisions,
              and the actions that affect your life.
            </p>
            <div className="simple-hero-actions">
              <Link href="/issues" className="simple-button simple-button-primary">
                Explore the issues <ArrowRight size={17} />
              </Link>
              <Link href="/onboarding" className="simple-button simple-button-secondary">Personalise my brief</Link>
            </div>
          </div>

          <div className="simple-score-card" aria-label={`Australia's civic score is ${score} out of 100`}>
            <div className="simple-score-topline">
              <span>Australia today</span>
              <span className="simple-live"><i /> Updated monthly</span>
            </div>
            <div className="simple-score-main">
              <div>
                <strong>{score}</strong><span>/100</span>
                <p>National civic score</p>
              </div>
              <div className="simple-score-summary">
                <span>Mixed</span>
                <p>Some progress, but housing and household costs remain under pressure.</p>
              </div>
            </div>
            <Link href="/impact" className="simple-card-link">How this score works <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <section className="simple-quick-section">
        <div className="simple-shell simple-quick-grid">
          {quickActions.map(({ href, icon: Icon, label, detail }) => (
            <Link key={href} href={href} className="simple-quick-card">
              <span className="simple-icon-box"><Icon size={20} /></span>
              <span><strong>{label}</strong><small>{detail}</small></span>
              <ChevronRight size={18} />
            </Link>
          ))}
        </div>
      </section>

      <section className="simple-section simple-shell">
        <div className="simple-section-heading">
          <div>
            <p className="simple-kicker">The national picture</p>
            <h2>What’s getting better — and worse</h2>
          </div>
          <Link href="/issues">View all five issues <ArrowRight size={16} /></Link>
        </div>

        <div className="simple-issue-grid">
          {focusPillars.map((pillar) => {
            const improving = pillar.trendDirection === 'improving'
            return (
              <Link href={`/issue/${pillar.id}`} className="simple-issue-card" key={pillar.id}>
                <div className="simple-issue-head">
                  <span className={`simple-trend ${improving ? 'up' : 'down'}`}>
                    {improving ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                    {improving ? 'Improving' : pillar.trendDirection === 'stable' ? 'Stable' : 'Under pressure'}
                  </span>
                  <strong>{pillar.civicScore}</strong>
                </div>
                <h3>{pillar.label}</h3>
                <p>{pillar.summary}</p>
                <span className="simple-read-more">See the evidence <ChevronRight size={15} /></span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="simple-section simple-decisions-wrap">
        <div className="simple-shell">
          <div className="simple-section-heading">
            <div>
              <p className="simple-kicker">What government is doing</p>
              <h2>Recent decisions, decoded</h2>
            </div>
            <Link href="/decisions">All decisions <ArrowRight size={16} /></Link>
          </div>
          <div className="simple-decision-list">
            {latestDecisions.map((decision) => (
              <Link href="/decisions" className="simple-decision-row" key={decision.id}>
                <span className="simple-decision-icon"><CircleDollarSign size={20} /></span>
                <span className="simple-decision-copy">
                  <small>{decision.level} · {decision.status}</small>
                  <strong>{decision.title}</strong>
                  <p>{decision.summary}</p>
                </span>
                <span className="simple-impact">{decision.impactLevel} impact</span>
                <ChevronRight size={19} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="simple-cta simple-shell">
        <div>
          <p className="simple-kicker">Make it yours</p>
          <h2>Your electorate. Your issues.<br />One useful weekly brief.</h2>
        </div>
        <Link href="/onboarding" className="simple-button simple-button-light">Build my brief <ArrowRight size={17} /></Link>
      </section>
    </div>
  )
}
