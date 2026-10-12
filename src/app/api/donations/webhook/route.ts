import { createClient } from '@supabase/supabase-js'
import { isStripeTestSecret, verifyStripeSignature } from '@/lib/stripe-security'

export const runtime = 'nodejs'

interface StripeCheckoutSession {
  id: string
  amount_total?: number
  currency?: string
  customer?: string
  payment_intent?: string
  payment_status?: 'paid' | 'unpaid' | 'no_payment_required'
  subscription?: string
  metadata?: { donation_record_id?: string; cadence?: string }
}

interface StripeEvent {
  id: string
  type: string
  livemode: boolean
  data: { object: StripeCheckoutSession }
}

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function updateDonation(
  admin: NonNullable<ReturnType<typeof createServiceClient>>,
  session: StripeCheckoutSession,
  status: 'paid' | 'failed',
  failureReason?: string,
) {
  const patch = {
    status,
    amount_cents: session.amount_total ?? null,
    currency: session.currency ?? 'aud',
    stripe_customer_id: session.customer ?? null,
    stripe_payment_intent_id: session.payment_intent ?? null,
    stripe_subscription_id: session.subscription ?? null,
    failure_reason: failureReason ?? null,
    updated_at: new Date().toISOString(),
  }

  const query = admin
    .from('donation_records')
    .update(patch)
    .eq('stripe_checkout_session_id', session.id)
  if (session.metadata?.donation_record_id) query.eq('id', session.metadata.donation_record_id)
  const { data, error } = await query.select('id').maybeSingle()
  if (error || !data) throw new Error('Donation record update failed.')
}

async function claimEvent(
  admin: NonNullable<ReturnType<typeof createServiceClient>>,
  event: StripeEvent,
) {
  const { data, error } = await admin.rpc('claim_stripe_webhook_event', {
    p_event_id: event.id,
    p_event_type: event.type,
    p_object_id: event.data.object.id,
    p_livemode: event.livemode,
  })
  if (error) throw new Error('Webhook event claim failed.')
  return data === true
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const stripeSecret = process.env.STRIPE_SECRET_KEY
  if (!webhookSecret || !stripeSecret) {
    return Response.json({ error: 'Stripe webhook secret is not configured.' }, { status: 500 })
  }

  const payload = await request.text()
  if (!verifyStripeSignature(payload, request.headers.get('stripe-signature'), webhookSecret)) {
    return Response.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  let event: StripeEvent
  try {
    event = JSON.parse(payload) as StripeEvent
  } catch {
    return Response.json({ error: 'Invalid payload.' }, { status: 400 })
  }

  if (!event.id || !event.type || !event.data?.object?.id || typeof event.livemode !== 'boolean') {
    return Response.json({ error: 'Invalid event.' }, { status: 400 })
  }
  if (event.livemode !== !isStripeTestSecret(stripeSecret)) {
    return Response.json({ error: 'Stripe environment mismatch.' }, { status: 400 })
  }

  const admin = createServiceClient()
  if (!admin) return Response.json({ error: 'Webhook persistence is not configured.' }, { status: 503 })

  try {
    const claimed = await claimEvent(admin, event)
    if (!claimed) return Response.json({ received: true, duplicate: true })

    const session = event.data.object
    if (
      event.type === 'checkout.session.async_payment_succeeded' ||
      (event.type === 'checkout.session.completed' && session.payment_status === 'paid')
    ) {
      await updateDonation(admin, session, 'paid')
    } else if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      await updateDonation(admin, session, 'failed', event.type)
    }

    const { error } = await admin
      .from('stripe_webhook_events')
      .update({ status: 'processed', processed_at: new Date().toISOString(), last_error: null })
      .eq('event_id', event.id)
    if (error) throw new Error('Webhook completion could not be recorded.')

    return Response.json({ received: true })
  } catch (error) {
    await admin
      .from('stripe_webhook_events')
      .update({
        status: 'failed',
        last_error: error instanceof Error ? error.message.slice(0, 500) : 'Webhook processing failed.',
      })
      .eq('event_id', event.id)
    return Response.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
