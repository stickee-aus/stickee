import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type StripeCheckoutSession = {
  id: string
  amount_total?: number | null
  currency?: string
  customer?: string
  payment_intent?: string
  subscription?: string
  payment_status?: string
  metadata?: {
    donation_record_id?: string
    cadence?: string
  }
}

export type StripeEvent = {
  id?: string
  type: string
  data?: {
    object?: StripeCheckoutSession
  }
}

export type ProcessWebhookResult =
  | { ok: true }
  | { ok: false; reason: 'no_admin' | 'db_error' | 'malformed' }

const TERMINAL_FROM = ['started'] as const

function createServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function donationPatch(
  session: StripeCheckoutSession,
  status: 'paid' | 'failed',
): Record<string, string | number> {
  const patch: Record<string, string | number> = {
    status,
    currency: session.currency ?? 'aud',
    updated_at: new Date().toISOString(),
  }

  // Never overwrite a stored amount with null when Stripe omits amount_total.
  if (typeof session.amount_total === 'number') {
    patch.amount_cents = session.amount_total
  }
  if (session.customer) patch.stripe_customer_id = session.customer
  if (session.payment_intent) patch.stripe_payment_intent_id = session.payment_intent
  if (session.subscription) patch.stripe_subscription_id = session.subscription

  return patch
}

/**
 * Apply a paid/failed transition only from `started`. A retry or replay
 * against an already paid, failed or refunded row is a no-op (0 rows
 * updated, no error), which is how we stay idempotent without an
 * event-id table. See docs/proposals/NOT-APPLIED-processed-stripe-events.md.
 */
export async function updateDonation(
  session: StripeCheckoutSession,
  status: 'paid' | 'failed',
  admin: SupabaseClient,
): Promise<ProcessWebhookResult> {
  if (!session?.id && !session?.metadata?.donation_record_id) {
    return { ok: false, reason: 'malformed' }
  }

  const patch = donationPatch(session, status)
  let query = admin.from('donation_records').update(patch)

  const recordId = session.metadata?.donation_record_id
  if (recordId) {
    query = query.eq('id', recordId)
  } else {
    query = query.eq('stripe_checkout_session_id', session.id)
  }

  const { error } = await query.in('status', [...TERMINAL_FROM])
  if (error) return { ok: false, reason: 'db_error' }
  return { ok: true }
}

/**
 * Handle a verified Stripe event. Callers must already have checked the
 * signature. Logs only event.id and event.type — never the payload.
 */
export async function processStripeDonationWebhook(
  event: StripeEvent,
): Promise<ProcessWebhookResult> {
  const eventId = typeof event.id === 'string' ? event.id : undefined
  const eventType = event.type
  console.info('stripe.webhook', { eventId, eventType })

  const session = event.data?.object
  if (!session || typeof session !== 'object') {
    return { ok: false, reason: 'malformed' }
  }

  const isPaidEvent =
    eventType === 'checkout.session.completed' ||
    eventType === 'checkout.session.async_payment_succeeded'
  const isFailedEvent =
    eventType === 'checkout.session.expired' ||
    eventType === 'checkout.session.async_payment_failed'

  if (!isPaidEvent && !isFailedEvent) {
    return { ok: true }
  }

  // checkout.session.completed can arrive for async methods (e.g. BECS)
  // while payment_status is still 'unpaid'. Only record paid when Stripe
  // confirms it. Unknown event types already returned above.
  if (isPaidEvent && session.payment_status !== 'paid') {
    return { ok: true }
  }

  const admin = createServiceClient()
  if (!admin) return { ok: false, reason: 'no_admin' }

  return updateDonation(session, isPaidEvent ? 'paid' : 'failed', admin)
}
