import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

interface StripeCheckoutSession {
  id: string
  amount_total?: number
  currency?: string
  customer?: string
  payment_intent?: string
  subscription?: string
  metadata?: {
    donation_record_id?: string
    cadence?: string
  }
}

interface StripeEvent {
  type: string
  data: {
    object: StripeCheckoutSession
  }
}

function createServiceClient() {
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

function verifySignature(payload: string, signature: string | null, secret: string) {
  if (!signature) return false

  const parts = Object.fromEntries(
    signature.split(',').map(part => {
      const [key, value] = part.split('=')
      return [key, value]
    })
  )

  const timestamp = parts.t
  const expected = parts.v1
  if (!timestamp || !expected) return false

  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest('hex')

  const expectedBuffer = Buffer.from(expected, 'hex')
  const digestBuffer = Buffer.from(digest, 'hex')
  if (expectedBuffer.length !== digestBuffer.length) return false

  return timingSafeEqual(expectedBuffer, digestBuffer)
}

async function updateDonation(session: StripeCheckoutSession, status: 'paid' | 'failed') {
  const admin = createServiceClient()
  if (!admin) return

  const patch = {
    status,
    amount_cents: session.amount_total ?? null,
    currency: session.currency ?? 'aud',
    stripe_customer_id: session.customer ?? null,
    stripe_payment_intent_id: session.payment_intent ?? null,
    stripe_subscription_id: session.subscription ?? null,
    updated_at: new Date().toISOString(),
  }

  const recordId = session.metadata?.donation_record_id
  if (recordId) {
    await admin.from('donation_records').update(patch).eq('id', recordId)
    return
  }

  await admin
    .from('donation_records')
    .update(patch)
    .eq('stripe_checkout_session_id', session.id)
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return Response.json({ error: 'Stripe webhook secret is not configured.' }, { status: 500 })
  }

  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!verifySignature(payload, signature, webhookSecret)) {
    return Response.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  const event = JSON.parse(payload) as StripeEvent
  const session = event.data.object

  if (event.type === 'checkout.session.completed') {
    await updateDonation(session, 'paid')
  }

  if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    await updateDonation(session, 'failed')
  }

  return Response.json({ received: true })
}
