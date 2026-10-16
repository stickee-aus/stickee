import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Bell, Mail, MapPin, ShieldCheck, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Start here — Stickee',
  description: 'A short guide to using Stickee to track representatives, follow issues, and take civic action.',
}

const workflows = [
  {
    title: 'Track your seat',
    body: 'Set your electorate, follow your MP, and use votes instead of slogans to judge what changed.',
    href: '/parliament',
    icon: MapPin,
    accent: '#f5a623',
  },
  {
    title: 'Pick an issue',
    body: 'Follow housing, cost of living, jobs, safety, or the future and see bills, campaigns, and next actions.',
    href: '/issues',
    icon: ShieldCheck,
    accent: '#2ec266',
  },
  {
    title: 'Test the market',
    body: 'Use prediction markets to make a call, compare the crowd, and learn what signals matter.',
    href: '/predictions',
    icon: TrendingUp,
    accent: '#3b82f6',
  },
]

// Real bill journey: Universities Accord (Opening the Doors of Opportunity) Bill 2026.
// Passed both Houses 13 October 2026. Source: Parliament of Australia bill progress.
const billJourney = [
  {
    date: '25 Jun 2026',
    chamber: 'House of Reps',
    event: 'Introduced. First reading and second reading moved same day — the bill now exists.',
  },
  {
    date: '2 Jul 2026',
    chamber: 'House + Senate',
    event: 'Second reading debate begins in the House. Same day, the Senate refers the bill to its Education and Employment Committee — submissions open to anyone.',
  },
  {
    date: '19 Aug 2026',
    chamber: 'House of Reps',
    event: 'Second reading agreed to. The House accepts the principle.',
  },
  {
    date: '20 Aug 2026',
    chamber: 'House of Reps',
    event: 'Consideration in detail. The government moves 17 amendments to its own bill — all pass. Third reading that day. The House is done.',
  },
  {
    date: '31 Jul 2026',
    chamber: 'Senate Committee',
    event: 'Submissions close. Universities, students, unions — anyone could write in. A public hearing ran in Canberra on 24 August.',
  },
  {
    date: '3 Sep 2026',
    chamber: 'Senate Committee',
    event: 'Committee report tabled. This is the gate where public input shapes what senators see before they vote.',
  },
  {
    date: '7 Sep 2026',
    chamber: 'Senate',
    event: 'Introduced in the Senate. Second reading debate runs 15–17 September.',
  },
  {
    date: '12 Oct 2026',
    chamber: 'Senate',
    event: 'Second reading agreed. Then Committee of the Whole — 43 amendments pass: 32 Greens, 6 government, 5 Coalition. The Greens stripped the minister\'s power to cap individual courses and forced the commission to publish its reasoning. Third reading that day.',
  },
  {
    date: '12 Oct 2026',
    chamber: 'House of Reps',
    event: 'House accepts 42 of 43 Senate amendments. Amendment 36 is rejected — not on merit, but because section 53 of the Constitution bars the Senate from amending money provisions. The House issues its own identically worded version.',
  },
  {
    date: '13 Oct 2026',
    chamber: 'Senate + Both Houses',
    event: 'Senate agrees to the House replacement. Finally passed both Houses. Royal assent follows and it becomes law.',
  },
]

const takeaways = [
  {
    n: '01',
    title: 'The committee is where you get in.',
    body: 'Anyone can write a submission before senators vote. Most people never know it exists.',
  },
  {
    n: '02',
    title: 'The Senate genuinely rewrote this bill.',
    body: 'Forty-three amendments from three parties. That is not a formality — it is the house of review doing its job.',
  },
  {
    n: '03',
    title: 'Even a finished bill nearly looped.',
    body: 'A constitutional technicality on one amendment sent it back for a same-word fix. Democracy is gated on purpose.',
  },
]

export default function OnboardingPage() {
  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <section className="border-b border-border pb-8">
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-3">
            Start here
          </p>
          <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:items-end">
            <div className="space-y-4">
              <h1 className="font-mono text-4xl text-foreground md:text-5xl">
                Use Stickee in one clear loop.
              </h1>
              <p className="max-w-2xl font-mono text-sm leading-relaxed text-muted-foreground">
                Choose your electorate, follow the issues that affect your life, then take one action when a vote or campaign needs pressure.
              </p>
            </div>
            <div className="grid grid-cols-3 border border-border">
              {['Setup', 'Track', 'Act'].map((step, index) => (
                <div key={step} className="border-r border-border px-3 py-4 last:border-r-0">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                    0{index + 1}
                  </p>
                  <p className="mt-3 font-mono text-xs text-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {workflows.map(({ title, body, href, icon: Icon, accent }) => (
            <Link
              key={title}
              href={href}
              className="border border-border p-5 transition-colors hover:bg-card/60"
            >
              <div className="mb-5 flex h-9 w-9 items-center justify-center bg-secondary">
                <Icon className="h-4 w-4" style={{ color: accent }} />
              </div>
              <h2 className="font-mono text-sm text-foreground">{title}</h2>
              <p className="mt-3 min-h-20 font-mono text-xs leading-relaxed text-muted-foreground">
                {body}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-foreground">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          ))}
        </section>

        <section className="border-t border-border pt-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                How a bill becomes law
              </p>
              <h2 className="mt-3 font-mono text-xl text-foreground">
                One real example, start to finish.
              </h2>
              <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
                The Universities Accord Opening the Doors of Opportunity Bill. Passed both Houses on 13 October 2026. Source: Parliament of Australia.
              </p>
            </div>
            <div className="space-y-0">
              {billJourney.map((step, i) => (
                <div key={i} className="grid grid-cols-[88px_1fr] gap-4 border-t border-border py-4 first:border-t-0">
                  <div className="shrink-0">
                    <p className="font-mono text-[10px] text-muted-foreground">{step.date}</p>
                    <p className="font-mono text-[9px] tracking-widest uppercase text-foreground mt-1">
                      {step.chamber}
                    </p>
                  </div>
                  <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                    {step.event}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {takeaways.map((t) => (
              <div key={t.n} className="border border-border p-4">
                <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  {t.n}
                </p>
                <h3 className="mt-2 font-mono text-sm text-foreground">{t.title}</h3>
                <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">
                  {t.body}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-6 border-t border-border pt-6">
            {[
              { label: 'Read the score before the argument', icon: Sparkles_unused },
            ].map(() => null)}
            <Link
              href="/parliament"
              className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-foreground hover:text-muted-foreground transition-colors"
            >
              <Bell className="h-4 w-4" /> Watch one vote or bill each week
            </Link>
            <Link
              href="/issues"
              className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-foreground hover:text-muted-foreground transition-colors"
            >
              <Mail className="h-4 w-4" /> Email your MP when an issue matters
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
