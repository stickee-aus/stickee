import { describe, expect, it, vi } from 'vitest'
import { getStripeSecretKey } from '@/lib/stripe/config'
import {
  buildCheckoutIdempotency,
  IDEMPOTENCY_WINDOW_MS,
  retrieveCheckoutSession,
  verifyDonationSession,
} from '@/lib/stripe/checkout'

const env = (e: Record<string, string>) => e as unknown as NodeJS.ProcessEnv
const USER = '44444444-4444-4444-8444-444444444444'
const OTHER = '55555555-5555-4555-8555-555555555555'
const T0 = 1_800_000_000_000 - (1_800_000_000_000 % IDEMPOTENCY_WINDOW_MS)

describe('checkout idempotency key', () => {
  it('is deterministic for the same user and request', () => {
    const a = buildCheckoutIdempotency({ userId: USER, amountCents: 2500, cadence: 'once', now: T0 })
    const b = buildCheckoutIdempotency({ userId: USER, amountCents: 2500, cadence: 'once', now: T0 + 1000 })
    expect(a).toEqual(b)
    expect(a.idempotencyKey).toMatch(/^stickee-donate-[0-9a-f]{48}$/)
    expect(a.donationRecordId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('differs by user, amount, cadence and time window', () => {
    const base = buildCheckoutIdempotency({ userId: USER, amountCents: 2500, cadence: 'once', now: T0 })
    const keys = new Set([
      buildCheckoutIdempotency({ userId: OTHER, amountCents: 2500, cadence: 'once', now: T0 }).idempotencyKey,
      buildCheckoutIdempotency({ userId: USER, amountCents: 2600, cadence: 'once', now: T0 }).idempotencyKey,
      buildCheckoutIdempotency({ userId: USER, amountCents: 2500, cadence: 'monthly', now: T0 }).idempotencyKey,
      buildCheckoutIdempotency({ userId: USER, amountCents: 2500, cadence: 'once', now: T0 + IDEMPOTENCY_WINDOW_MS }).idempotencyKey,
      base.idempotencyKey,
    ])
    expect(keys.size).toBe(5)
  })

  it('separates anonymous donors by their coarse key', () => {
    const a = buildCheckoutIdempotency({ anonymousKey: '203.0.113.1', amountCents: 1000, cadence: 'once', now: T0 })
    const b = buildCheckoutIdempotency({ anonymousKey: '203.0.113.2', amountCents: 1000, cadence: 'once', now: T0 })
    expect(a.idempotencyKey).not.toBe(b.idempotencyKey)
  })
})

describe('checkout route sends the Idempotency-Key header', () => {
  it('passes a deterministic key to Stripe and a trusted success URL', async () => {
    vi.resetModules()
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fixture')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://stickee.example.test')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')

    vi.doMock('@/lib/supabase-server', () => ({
      createServerSupabaseClient: async () => ({
        auth: { getUser: async () => ({ data: { user: { id: USER } } }) },
      }),
    }))
    vi.doMock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))

    const calls: { url: string; init: RequestInit }[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init })
      return new Response(JSON.stringify({ id: 'cs_test_abc12345', url: 'https://checkout.stripe.test/x' }), { status: 200 })
    }))

    const { POST } = await import('@/app/api/donations/checkout/route')
    const make = () =>
      new Request('https://stickee.example.test/api/donations/checkout', {
        method: 'POST',
        headers: { 'x-forwarded-host': 'evil.test', host: 'evil.test', origin: 'https://evil.test' },
        body: JSON.stringify({ amount: 25, cadence: 'once' }),
      })

    const r1 = await POST(make())
    const r2 = await POST(make())
    expect(r1.status).toBe(200)
    expect(r2.status).toBe(200)
    expect(calls).toHaveLength(2)

    const h1 = calls[0].init.headers as Record<string, string>
    const h2 = calls[1].init.headers as Record<string, string>
    expect(h1['Idempotency-Key']).toMatch(/^stickee-donate-/)
    expect(h1['Idempotency-Key']).toBe(h2['Idempotency-Key'])

    const body = new URLSearchParams(String(calls[0].init.body))
    expect(body.get('success_url')).toBe('https://stickee.example.test/donate/success?session_id={CHECKOUT_SESSION_ID}')
    expect(body.get('cancel_url')).toBe('https://stickee.example.test/donate/cancel')
    expect(String(calls[0].init.body)).not.toContain('evil.test')

    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.doUnmock('@/lib/supabase-server')
    vi.doUnmock('@supabase/supabase-js')
  })

  it('fails closed (503) when no trusted site URL exists in production', async () => {
    vi.resetModules()
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fixture')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    vi.stubEnv('SITE_URL', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '')
    vi.doMock('@/lib/supabase-server', () => ({
      createServerSupabaseClient: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
    }))
    vi.doMock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { POST } = await import('@/app/api/donations/checkout/route')
    const res = await POST(new Request('https://x.test/api/donations/checkout', {
      method: 'POST',
      headers: { 'x-forwarded-host': 'evil.test' },
      body: JSON.stringify({ amount: 25 }),
    }))
    expect(res.status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()

    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.doUnmock('@/lib/supabase-server')
    vi.doUnmock('@supabase/supabase-js')
  })
})

describe('live Stripe key guard', () => {
  it('refuses sk_live outside production without the flag', () => {
    expect(getStripeSecretKey(env({ NODE_ENV: 'development', STRIPE_SECRET_KEY: 'sk_live_fixture' }))).toEqual({ ok: false, reason: 'live_key_blocked' })
    expect(getStripeSecretKey(env({ NODE_ENV: 'test', STRIPE_SECRET_KEY: 'rk_live_fixture' }))).toEqual({ ok: false, reason: 'live_key_blocked' })
    expect(getStripeSecretKey(env({ NODE_ENV: 'production', VERCEL_ENV: 'preview', STRIPE_SECRET_KEY: 'sk_live_fixture' }))).toEqual({ ok: false, reason: 'live_key_blocked' })
  })

  it('allows sk_live outside production only with the explicit flag', () => {
    expect(getStripeSecretKey(env({ NODE_ENV: 'development', STRIPE_SECRET_KEY: 'sk_live_fixture', STICKEE_ALLOW_LIVE_STRIPE_KEYS: 'true' }))).toEqual({ ok: true, key: 'sk_live_fixture' })
    expect(getStripeSecretKey(env({ NODE_ENV: 'development', STRIPE_SECRET_KEY: 'sk_live_fixture', STICKEE_ALLOW_LIVE_STRIPE_KEYS: '1' })).ok).toBe(false)
  })

  it('allows sk_live in real production and sk_test anywhere', () => {
    expect(getStripeSecretKey(env({ NODE_ENV: 'production', VERCEL_ENV: 'production', STRIPE_SECRET_KEY: 'sk_live_fixture' })).ok).toBe(true)
    expect(getStripeSecretKey(env({ NODE_ENV: 'development', STRIPE_SECRET_KEY: 'sk_test_fixture' })).ok).toBe(true)
  })

  it('reports a missing key', () => {
    expect(getStripeSecretKey(env({ NODE_ENV: 'development' }))).toEqual({ ok: false, reason: 'missing' })
    expect(getStripeSecretKey(env({ NODE_ENV: 'development', STRIPE_SECRET_KEY: '  ' }))).toEqual({ ok: false, reason: 'missing' })
  })
})

describe('donation success verification (read-only)', () => {
  const paid = { id: 'cs_test_abc12345', payment_status: 'paid', status: 'complete', client_reference_id: USER }

  it('is paid only when Stripe says paid and the session belongs to the user', () => {
    expect(verifyDonationSession(paid, USER)).toEqual({ state: 'paid' })
  })

  it('treats another user, an anonymous visitor, and a session without owner as unverified', () => {
    expect(verifyDonationSession(paid, OTHER)).toEqual({ state: 'unverified' })
    expect(verifyDonationSession(paid, null)).toEqual({ state: 'unverified' })
    expect(verifyDonationSession({ ...paid, client_reference_id: null }, USER)).toEqual({ state: 'unverified' })
    expect(verifyDonationSession(null, USER)).toEqual({ state: 'unverified' })
  })

  it('shows pending for a completed but unpaid (async) session, unverified for open ones', () => {
    expect(verifyDonationSession({ ...paid, payment_status: 'unpaid' }, USER)).toEqual({ state: 'pending' })
    expect(verifyDonationSession({ ...paid, payment_status: 'unpaid', status: 'open' }, USER)).toEqual({ state: 'unverified' })
  })

  it('retrieves the session with a direct authenticated GET', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(paid), { status: 200 }))
    const session = await retrieveCheckoutSession('cs_test_abc12345', 'sk_test_fixture', fetchImpl as unknown as typeof fetch)
    expect(session?.id).toBe('cs_test_abc12345')
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.stripe.com/v1/checkout/sessions/cs_test_abc12345')
    expect(init.method).toBe('GET')
  })

  it('rejects malformed ids without calling Stripe, and rejects mismatched or failed responses', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(paid), { status: 200 }))
    for (const id of ['', '../x', 'cs_test_', 'pi_123', 'cs_test_abc12345/../../v1/charges', 'cs_test_abc 12345']) {
      expect(await retrieveCheckoutSession(id, 'k', fetchImpl as unknown as typeof fetch)).toBeNull()
    }
    expect(fetchImpl).not.toHaveBeenCalled()

    const wrongId = vi.fn(async () => new Response(JSON.stringify({ ...paid, id: 'cs_test_other9999' }), { status: 200 }))
    expect(await retrieveCheckoutSession('cs_test_abc12345', 'k', wrongId as unknown as typeof fetch)).toBeNull()
    const notFound = vi.fn(async () => new Response('{}', { status: 404 }))
    expect(await retrieveCheckoutSession('cs_test_abc12345', 'k', notFound as unknown as typeof fetch)).toBeNull()
    const boom = vi.fn(async () => { throw new Error('network') })
    expect(await retrieveCheckoutSession('cs_test_abc12345', 'k', boom as unknown as typeof fetch)).toBeNull()
  })
})
