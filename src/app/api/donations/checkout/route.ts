import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getTrustedSiteOrigin } from '@/lib/site-url'
import { getStripeSecretKey, STRIPE_API_VERSION } from '@/lib/stripe/config'
import { buildCheckoutIdempotency } from '@/lib/stripe/checkout'

type Cadence = 'once' | 'monthly'

interface CheckoutBody {
  amount?: unknown
  cadence?: unknown
}

const MIN_AMOUNT_CENTS = 100
const MAX_AMOUNT_CENTS = 500000

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

function anonymousKey(request: Request) {
  // Only used to dedupe anonymous double-submits; spoofing it gains nothing.
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('x-real-ip') || 'unknown'
}

function cleanCadence(value: unknown): Cadence {
  return value === 'monthly' ? 'monthly' : 'once'
}

function cleanAmountCents(value: unknown) {
  const amount = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(amount)) return null
  const cents = Math.round(amount * 100)
  if (cents < MIN_AMOUNT_CENTS || cents > MAX_AMOUNT_CENTS) return null
  return cents
}

function appendLineItem(params: URLSearchParams, amountCents: number, cadence: Cadence) {
  params.append('line_items[0][quantity]', '1')
  params.append('line_items[0][price_data][currency]', 'aud')
  params.append('line_items[0][price_data][unit_amount]', String(amountCents))
  params.append('line_items[0][price_data][product_data][name]', 'Stickee operational support')
  params.append(
    'line_items[0][price_data][product_data][description]',
    'Keeps Stickee data free and helps expand civic intelligence across Australia.'
  )

  if (cadence === 'monthly') {
    params.append('line_items[0][price_data][recurring][interval]', 'month')
  }
}

export async function POST(request: Request) {
  let body: CheckoutBody

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid donation request.' }, { status: 400 })
  }

  const amountCents = cleanAmountCents(body.amount)
  const cadence = cleanCadence(body.cadence)

  if (!amountCents) {
    return Response.json({ error: 'Enter a donation amount between $1 and $5,000 AUD.' }, { status: 400 })
  }

  const stripeKey = getStripeSecretKey()
  if (!stripeKey.ok) {
    console.error('stripe.checkout.config', { reason: stripeKey.reason })
    return Response.json({ error: 'Stripe is not configured.' }, { status: 503 })
  }
  const stripeSecretKey = stripeKey.key

  const origin = getTrustedSiteOrigin(request.headers.get('host'))
  if (!origin) {
    console.error('stripe.checkout.config', { reason: 'site_url_missing' })
    return Response.json({ error: 'Stripe is not configured.' }, { status: 503 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()
  let donationRecordId: string | null = null

  const { idempotencyKey, donationRecordId: derivedRecordId } = buildCheckoutIdempotency({
    userId: user?.id ?? null,
    anonymousKey: anonymousKey(request),
    amountCents,
    cadence,
  })

  if (admin) {
    // Deterministic id + ignoreDuplicates: a retry of the same request reuses
    // the same row instead of inserting another, and sends identical params
    // to Stripe (required for Idempotency-Key replays).
    const { error } = await admin
      .from('donation_records')
      .upsert({
        id: derivedRecordId,
        user_id: user?.id ?? null,
        amount_cents: amountCents,
        currency: 'aud',
        cadence: cadence === 'monthly' ? 'monthly' : 'one_time',
        status: 'started',
        source: 'donate_page',
      }, { onConflict: 'id', ignoreDuplicates: true })

    donationRecordId = error ? null : derivedRecordId
  }

  const params = new URLSearchParams()
  params.append('mode', cadence === 'monthly' ? 'subscription' : 'payment')
  params.append('success_url', `${origin}/donate/success?session_id={CHECKOUT_SESSION_ID}`)
  params.append('cancel_url', `${origin}/donate/cancel`)
  params.append('billing_address_collection', 'auto')
  params.append('allow_promotion_codes', 'false')
  params.append('metadata[cadence]', cadence)
  params.append('metadata[amount_cents]', String(amountCents))
  if (donationRecordId) params.append('metadata[donation_record_id]', donationRecordId)
  if (user?.id) params.append('client_reference_id', user.id)
  appendLineItem(params, amountCents, cadence)

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION,
      'Idempotency-Key': idempotencyKey,
    },
    body: params,
  })

  const session = await stripeResponse.json()

  if (!stripeResponse.ok) {
    return Response.json(
      { error: session?.error?.message || 'Unable to start Stripe Checkout.' },
      { status: 502 }
    )
  }

  if (admin && donationRecordId) {
    await admin
      .from('donation_records')
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', donationRecordId)
  }

  return Response.json({ url: session.url })
}
