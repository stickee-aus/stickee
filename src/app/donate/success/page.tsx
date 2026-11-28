import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle2, Clock } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getStripeSecretKey } from '@/lib/stripe/config'
import {
  retrieveCheckoutSession,
  verifyDonationSession,
  type DonationVerification,
} from '@/lib/stripe/checkout'

export const metadata: Metadata = {
  title: 'Donation received — Stickee',
  description: 'Thank you for supporting Stickee.',
}

export const dynamic = 'force-dynamic'

/**
 * Read-only. The page never writes a paid status: only the signed Stripe
 * webhook does that. It asks Stripe directly whether the session in the URL
 * is paid and was created for the signed-in visitor, and shows the matching
 * message. Anyone else (including anonymous visitors and guessed or foreign
 * session ids) sees a neutral message and no claim of payment.
 */
async function verifyVisitor(sessionId: string | undefined): Promise<DonationVerification> {
  if (!sessionId) return { state: 'unverified' }

  const key = getStripeSecretKey()
  if (!key.ok) return { state: 'unverified' }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { state: 'unverified' }

  const session = await retrieveCheckoutSession(sessionId, key.key)
  return verifyDonationSession(session, user.id)
}

export default async function DonateSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>
}) {
  const params = await searchParams
  const sessionId = Array.isArray(params.session_id) ? params.session_id[0] : params.session_id
  const verification = await verifyVisitor(sessionId)

  const paid = verification.state === 'paid'
  const pending = verification.state === 'pending'
  const heading = paid
    ? 'Thank you for backing Stickee.'
    : pending
      ? 'Your donation is processing.'
      : 'Thanks for checking in.'
  const label = paid ? 'Donation received' : pending ? 'Payment processing' : 'Donation status'
  const body = paid
    ? 'Your support helps keep the data free, independent, and useful for Australians who want clearer accountability.'
    : pending
      ? 'Stripe has your payment details and is still confirming it. This can take a little while for some payment methods.'
      : 'We could not confirm a donation for this visit. If you just donated, Stripe will email you a receipt. Sign in with the account you donated from to see its status here.'

  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-xl border border-border p-6">
        {paid ? (
          <CheckCircle2 className="h-7 w-7" style={{ color: '#2ec266' }} />
        ) : (
          <Clock className="h-7 w-7 text-muted-foreground" />
        )}
        <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <h1 className="mt-3 font-mono text-3xl text-foreground">{heading}</h1>
        <p className="mt-4 font-mono text-sm leading-relaxed text-muted-foreground">
          {body}
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
