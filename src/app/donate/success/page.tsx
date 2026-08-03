import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Donation received — Stickee',
  description: 'Thank you for supporting Stickee.',
}

export default function DonateSuccessPage() {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-xl border border-border p-6">
        <CheckCircle2 className="h-7 w-7" style={{ color: '#2ec266' }} />
        <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Donation received
        </p>
        <h1 className="mt-3 font-mono text-3xl text-foreground">Thank you for backing Stickee.</h1>
        <p className="mt-4 font-mono text-sm leading-relaxed text-muted-foreground">
          Your support helps keep the data free, independent, and useful for Australians who want clearer accountability.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex h-11 items-center justify-center px-4 font-mono text-[10px] uppercase tracking-widest"
            style={{ background: '#e8e8e6', color: '#0a0a0b' }}
          >
            Back to overview
          </Link>
          <Link
            href="/onboarding"
            className="flex h-11 items-center justify-center border border-border px-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            Share the mission
          </Link>
        </div>
      </div>
    </div>
  )
}
