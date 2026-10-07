import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Donation cancelled — Stickee',
}

export default function DonateCancelPage() {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-xl border border-border p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Donation cancelled
        </p>
        <h1 className="mt-3 font-mono text-3xl text-foreground">No payment was taken.</h1>
        <p className="mt-4 font-mono text-sm leading-relaxed text-muted-foreground">
          You can return to the donation page and choose another amount at any time.
        </p>
        <Link
          href="/donate"
          className="mt-8 inline-flex h-11 items-center justify-center px-4 font-mono text-[10px] uppercase tracking-widest"
          style={{ background: '#e8e8e6', color: '#0a0a0b' }}
        >
          Back to donate
        </Link>
      </div>
    </div>
  )
}
