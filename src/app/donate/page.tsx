import type { Metadata } from 'next'
import Link from 'next/link'
import { BarChart3, HeartHandshake, ReceiptText, ShieldCheck } from 'lucide-react'
import { DonateAmountForm } from '@/components/DonateAmountForm'

export const metadata: Metadata = {
  title: 'Donate — Stickee',
  description: 'Help keep Stickee operational and fund civic tools for more Australians.',
}

const donationUrl = process.env.NEXT_PUBLIC_DONATION_URL || process.env.NEXT_PUBLIC_STRIPE_DONATION_LINK || ''

const areas = [
  { title: '$5 / month', body: 'Keeps basic hosting covered so the site stays online.' },
  { title: '$10 one-time', body: 'Helps maintain data updates across issues, MPs, and electorates.' },
  { title: '$25 one-time', body: 'Funds better onboarding, clearer issue pages, and electorate guidance.' },
  { title: '$50 one-time', body: 'Supports moderation tools, reporting, and safer community features.' },
  { title: '$100 one-time', body: 'Helps expand Stickee into more seats and public data sources.' },
  { title: '$100 / month', body: 'Creates reliable runway for independent national expansion.' },
]

export default function DonatePage() {
  return (
    <div className="px-6 py-10 md:py-14">
      <div className="mx-auto max-w-5xl space-y-16">

        {/* Story (left) + Form (right) */}
        <section className="grid gap-10 border-b border-border pb-12 lg:grid-cols-2 lg:items-start">
          <div className="space-y-7">
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
              Support the mission
            </p>
            <h1 className="font-mono text-4xl font-normal leading-tight text-foreground md:text-6xl">
              Keep this information free for everyone.
            </h1>
            <div className="space-y-4 font-mono text-sm leading-8 text-muted-foreground md:text-base">
              <p>I am an Aboriginal Australian building Stickee alone — no team, no funding, no agendas.</p>
              <p>Australians deserve to know how our politicians are really performing so we can hold them accountable.</p>
              <p>Our unique heritage is under pressure, and it is time we put everyday Aussies first again.</p>
              <p>Your support keeps the data free and helps me expand this across the whole country.</p>
              <p className="text-foreground">Thank you — every donation makes a difference.</p>
            </div>
          </div>

          <div className="lg:pt-16">
            <DonateAmountForm donationUrl={donationUrl} />
          </div>
        </section>

        {/* Impact areas */}
        <section>
          <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Your impact
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {areas.map(area => (
              <div key={area.title} className="border border-border p-5">
                <h2 className="font-mono text-lg text-foreground">{area.title}</h2>
                <p className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">{area.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust strip */}
        <section className="grid gap-3 md:grid-cols-3">
          {[
            { label: 'Transparent reporting', icon: ReceiptText },
            { label: 'Secure payments', icon: ShieldCheck },
            { label: 'Impact tracking', icon: BarChart3 },
          ].map(({ label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 border border-border px-4 py-3">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs text-foreground">{label}</span>
            </div>
          ))}
        </section>

        <section className="border-t border-border pt-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <HeartHandshake className="mt-1 h-5 w-5 shrink-0" style={{ color: '#2ec266' }} />
              <p className="max-w-xl font-mono text-xs leading-relaxed text-muted-foreground">
                Inspired by public fundraising platforms like UNITED24: clear mission, direct support, and visible reporting on where funds go.
              </p>
            </div>
            <Link
              href="/admin"
              className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Admin reporting
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
