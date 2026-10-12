import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react'
import { isStripeTestSecret, retrieveCheckoutSession } from '@/lib/stripe-security'

export const metadata: Metadata = {
  title: 'Donation status — Stickee',
  description: 'Check the provider-confirmed status of a Stickee donation.',
}

type SearchParams = Promise<{ session_id?: string }>

export default async function DonateSuccessPage({ searchParams }: { searchParams: SearchParams }) {
  const { session_id: sessionId } = await searchParams
  const secret = process.env.STRIPE_SECRET_KEY ?? ''
  const session = sessionId && secret ? await retrieveCheckoutSession(sessionId, secret) : null
  const environmentMatches = session ? session.livemode !== isStripeTestSecret(secret) : false
  const paid = Boolean(session && environmentMatches && session.payment_status === 'paid')
  const pending = Boolean(session && environmentMatches && session.status === 'complete' && !paid)

  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-xl border border-border p-6">
        {paid ? (
          <CheckCircle2 className="h-7 w-7" style={{ color: '#2ec266' }} />
        ) : pending ? (
          <Clock3 className="h-7 w-7 text-muted-foreground" />
        ) : (
          <AlertCircle className="h-7 w-7 text-muted-foreground" />
        )}
        <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {paid ? 'Payment confirmed' : pending ? 'Payment processing' : 'Payment not verified'}
        </p>
        <h1 className="mt-3 font-mono text-3xl text-foreground">
          {paid ? 'Thank you for backing Stickee.' : pending ? 'Your payment is still processing.' : 'We could not confirm a donation.'}
        </h1>
        <p className="mt-4 font-mono text-sm leading-relaxed text-muted-foreground">
          {paid
            ? 'Stripe has confirmed your payment. Your support helps keep Stickee free and useful.'
            : pending
              ? 'Some payment methods take longer to confirm. This page does not claim success until Stripe reports the payment as paid.'
              : 'No verified paid Stripe Checkout Session was found. You have not been shown a donation receipt.'}
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
