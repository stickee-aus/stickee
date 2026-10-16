import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, FlaskConical, Megaphone } from 'lucide-react'
import { getLiveBillMarkets } from '@/lib/predictions-db'
import { getMarketEligibility } from '@/lib/market-eligibility'
import { CATEGORY_LABELS } from '@/components/MarketCard'
import { LinkButton } from '@/components/LinkButton'
import { PageShell } from '@/components/ui/page-shell'
import { SectionHeader } from '@/components/ui/section-header'
import { ArticleCard } from '@/components/ui/article-card'
import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = {
  title: 'Stickee — Australian politics, made clear',
  description: 'See what is changing, why it matters, and what you can do about it — without the political noise.',
}

// Canonical primary destinations — same three sections and hrefs as
// src/lib/navigation.ts's PRIMARY_NAV (Issues/Government/Forecasts), so this
// page never invents a fourth label for something already named elsewhere.
const PRIMARY_DESTINATIONS = [
  {
    href: '/issues',
    title: 'Issues',
    summary: 'The issues Stickee is tracking across Australian politics.',
    cta: 'Explore Issues',
  },
  {
    href: '/parliament',
    title: 'Government',
    summary: 'Bills, policy and decisions moving through Parliament.',
    cta: 'Explore Government',
  },
  {
    href: '/predictions',
    title: 'Forecasts',
    summary: 'What the crowd expects to happen next.',
    cta: 'Explore Forecasts',
  },
]

const SECONDARY_ACTIONS = [
  { href: '/simulator', icon: FlaskConical, label: 'Explore scenarios' },
  { href: '/campaigns', icon: Megaphone, label: 'Take action' },
]

export default async function HomePage() {
  // /predictions' own canonical, database-backed source — never the static
  // mock-market-data fallback. On a Supabase error or empty table this
  // resolves to demo-status rows, which getMarketEligibility().canStake
  // filters out below, so the homepage never shows fabricated forecasts.
  const liveMarkets = await getLiveBillMarkets()
  const activeForecasts = liveMarkets
    .filter(market => getMarketEligibility(market).canStake)
    .slice(0, 2)

  return (
    <div className="bg-background">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center md:px-8 md:py-24">
          <p className="text-micro-label mb-4">Australia, in plain English</p>
          <h1 className="font-heading text-[clamp(2.25rem,5vw,5vw,3.75rem)] leading-[1.02] font-semibold tracking-tight text-foreground">
            Know what&rsquo;s changing.<br />Know what to do.
          </h1>
          <p className="text-body-copy mx-auto mt-6 max-w-xl text-muted-foreground">
            Stickee turns Australian politics into a clear weekly picture — the issues, the decisions,
            and the actions that affect your life.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/issues">
              Explore the issues <ArrowRight className="ml-1 h-4 w-4" />
            </LinkButton>
            <LinkButton href="/onboarding" variant="outline">
              How Stickee works
            </LinkButton>
          </div>
        </div>
      </section>

      <PageShell>
        <div className="space-y-16">

          {/* ── Primary product destinations ──────────────────────────────── */}
          <section>
            <SectionHeader title="Where to start" description="Three ways into what Stickee covers." />
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {PRIMARY_DESTINATIONS.map(destination => (
                <ArticleCard
                  key={destination.href}
                  href={destination.href}
                  title={destination.title}
                  summary={destination.title}
                  action={
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                      {destination.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  }
                />
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-6">
              {SECONDARY_ACTIONS.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="transition-calm inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              ))}
            </div>
          </section>

          {/* ── National snapshot ─────────────────────────────────────────── */}
          <section>
            <SectionHeader
              title="National snapshot"
              description="Stickee's civic indicator scorecard."
              action={
                <Link href="/issues" className="inline-flex items-center gap-1 font-medium text-foreground">
                  See issues <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="mt-6">
              <EmptyState
                variant="no-data"
                title="No sourced indicators yet"
                description="A civic scorecard needs a defined methodology before it earns a number. Issues and bills are the evidence it's built from."
                action={
                  <Link href="/issues" className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                    Browse tracked issues <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />
            </div>
          </section>

          {/* ── Government activity ───────────────────────────────────────── */}
          <section>
            <SectionHeader
              title="Government activity"
              description="What Parliament has recently decided."
              action={
                <Link href="/parliament" className="inline-flex items-center gap-1 font-medium text-foreground">
                  See Parliament <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="mt-6">
              <EmptyState
                variant="no-data"
                title="No sourced decisions yet"
                description="Decision records publish only when they carry a real source and status — same standard as every other page."
                action={
                  <Link href="/parliament" className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                    Open the Parliament record <ArrowRight className="h-3 w-3" />
                  </Link>
                }
              />
            </div>
          </section>

          {/* ── Forecasts ──────────────────────────────────────────────────── */}
          <section>
            <SectionHeader
              title="Forecasts"
              description="What's likely to happen next."
              action={
                <Link href="/predictions" className="inline-flex items-center gap-1 font-medium text-foreground">
                  See all forecasts <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
            />
            <div className="mt-6">
              {activeForecasts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeForecasts.map(forecast => (
                    <ArticleCard
                      key={forecast.id}
                      href="/predictions"
                      category={CATEGORY_LABELS[forecast.category] ?? forecast.category}
                      title={forecast.question}
                      action={
                        <span className="text-metadata normal-case tracking-normal">
                          {forecast.probability}% likely · Closes {forecast.resolvesBy}
                        </span>
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  variant="no-forecasts"
                  title="No verified forecasts are currently open."
                  action={
                    <Link href="/predictions" className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                      See all forecasts <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  }
                />
              )}
            </div>
          </section>

          {/* ── Getting-started guide CTA ────────────────────────────────────
              /onboarding is a short guide to Stickee's three core workflows —
              it does not itself collect an electorate or issue preferences,
              so this CTA must not promise a personalised "brief" it can't
              yet deliver. See STICKEE_V1_CROSS_PAGE_CONSISTENCY_REPORT.md
              §"Today CTA truthfulness". */}
          <section className="flex flex-col items-start justify-between gap-6 rounded-[var(--radius-lg)] border border-border bg-card p-8 md:flex-row md:items-center md:p-12">
            <div>
              <p className="text-micro-label mb-2">New here?</p>
              <h2 className="text-section-title">A short guide to tracking your seat,<br />your issues, and what happens next.</h2>
            </div>
            <LinkButton href="/onboarding">
              See how it works <ArrowRight className="ml-1 h-4 w-4" />
            </LinkButton>
          </section>

        </div>
      </PageShell>
    </div>
  )
}
