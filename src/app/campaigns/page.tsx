'use client'

import Link from 'next/link'
import { Megaphone, Mail, FileText, ArrowRight } from 'lucide-react'
import { PageShell } from '@/components/ui/page-shell'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * Campaigns page — conversion stage.
 *
 * Previous version was four illustrative campaigns with disclaimers stacked on
 * top ("example content, not a live tally", "not connected to a real join
 * system", "proposals aren't connected to a review pipeline"). That made the
 * conversion page tell visitors nothing here counts.
 *
 * New approach: no fake tallies. The page's one job is to route people to the
 * real, counted actions Stickee already supports — emailing an MP, watching a
 * live bill, and writing a committee submission when an inquiry is open.
 */

const REAL_ACTIONS = [
  {
    step: '01',
    title: 'Email your MP',
    body: 'Every electorate page has a direct email flow. One message, counted, attributed to your seat.',
    href: '/parliament',
    icon: Mail,
  },
  {
    step: '02',
    title: 'Watch a live bill',
    body: 'Follow a bill from introduction to assent. The Universities Accord bill passed both Houses on 13 October 2026 after 43 Senate amendments — see how each gate worked.',
    href: '/onboarding',
    icon: FileText,
  },
  {
    step: '03',
    title: 'Write a submission',
    body: 'When a Senate or House committee inquiry is open, anyone can submit. Stickee will surface open inquiries with deadlines and templates as that data comes online.',
    href: '/issues',
    icon: Megaphone,
  },
]

export default function CampaignsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Australia · Collective Action"
        title="Campaigns"
        summary="How collective pressure actually reaches parliament — and where Stickee helps you apply it."
      />

      <section className="mt-10 space-y-3">
        {REAL_ACTIONS.map(({ step, title, body, href, icon: Icon }) => (
          <Link
            key={step}
            href={href}
            className="group flex items-start gap-5 border border-border p-5 transition-colors hover:bg-card/60"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-border bg-secondary">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                {step}
              </p>
              <h2 className="mt-1 font-mono text-sm text-foreground">{title}</h2>
              <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          </Link>
        ))}
      </section>

      <section className="mt-10">
        <EmptyState
          variant="unavailable"
          title="Campaign tallies aren't live yet"
          description="We're not showing fake participant counts. When a real join-and-count system is wired up, this page becomes the place to track it."
          action={
            <Link
              href="/predictions"
              className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-foreground transition-colors hover:text-muted-foreground"
            >
              Browse open forecasts <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />
      </section>
    </PageShell>
  )
}
