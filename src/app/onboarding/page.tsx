import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Bell, Mail, MapPin, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'

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
    body: 'Review verified forecast questions, compare the evidence and record uncertainty when participation is available.',
    href: '/predictions',
    icon: TrendingUp,
    accent: '#3b82f6',
  },
]

const habits = [
  { label: 'Read the score before the argument', icon: Sparkles },
  { label: 'Watch one vote or bill each week', icon: Bell },
  { label: 'Email your MP when an issue matters', icon: Mail },
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

        <section className="grid gap-6 border-t border-border pt-8 md:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Weekly rhythm
            </p>
            <h2 className="mt-3 font-mono text-xl text-foreground">Three habits make the site useful.</h2>
          </div>
          <div className="grid gap-2">
            {habits.map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 border border-border px-4 py-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-xs text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
