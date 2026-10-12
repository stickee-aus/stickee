import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { STRIPE_API_VERSION } from '@/lib/stripe-security'

type Cadence = 'once' | 'monthly'

interface CheckoutBody {
  amount?: unknown
  cadence?: unknown
  attemptId?: unknown
}

const MIN_AMOUNT_CENTS = 100
const MAX_AMOUNT_CENTS = 500000
const ATTEMPT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

function getOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) {
    const origin = new URL(configured).origin
    if (origin.startsWith('https://') || origin.startsWith('http://localhost:')) return origin
  }
  return new URL(request.url).origin
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
  const attemptId = typeof body.attemptId === 'string' ? body.attemptId : ''

  if (!amountCents) {
    return Response.json({ error: 'Enter a donation amount between $1 and $5,000 AUD.' }, { status: 400 })
  }

  if (!ATTEMPT_ID_PATTERN.test(attemptId)) {
    return Response.json({ error: 'Invalid checkout attempt.' }, { status: 400 })
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    return Response.json({ error: 'Stripe is not configured.' }, { status: 503 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()
  let donationRecordId: string
  if (!admin) {
    return Response.json({ error: 'Donation records are not configured.' }, { status: 503 })
  }

  const { data: donationRecord, error: donationError } = await admin
      .from('donation_records')
      .upsert({
        user_id: user?.id ?? null,
        amount_cents: amountCents,
        currency: 'aud',
        cadence: cadence === 'monthly' ? 'monthly' : 'one_time',
        status: 'started',
        source: 'donate_page',
        checkout_attempt_id: attemptId,
      }, { onConflict: 'checkout_attempt_id', ignoreDuplicates: true })
      .select('id')
      .single()

  if (donationError || !donationRecord?.id) {
    const { data: existing, error: existingError } = await admin
      .from('donation_records')
      .select('id')
      .eq('checkout_attempt_id', attemptId)
      .maybeSingle()

    if (existingError || !existing?.id) {
      return Response.json({ error: 'Unable to record this checkout safely.' }, { status: 503 })
    }
    donationRecordId = existing.id
  } else {
    donationRecordId = donationRecord.id
  }

  const origin = getOrigin(request)
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
      'Idempotency-Key': attemptId,
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

  if (donationRecordId) {
    const { error: updateError } = await admin
      .from('donation_records')
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', donationRecordId)

    if (updateError) {
      return Response.json({ error: 'Checkout was created but could not be recorded safely.' }, { status: 503 })
    }
  }

  return Response.json({ url: session.url })
}
