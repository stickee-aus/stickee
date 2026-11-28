import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createStripeMemoryAdmin } from './helpers/stripe-memory-admin'

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))

type Row = Record<string, unknown>

const RECORD_ID = '11111111-1111-4111-8111-111111111111'
const USER = '77777777-7777-4777-8777-777777777777'

function completed(id = 'evt_c1') {
  return {
    id,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_1',
        amount_total: 1000,
        currency: 'aud',
        payment_status: 'paid',
        subscription: 'sub_1',
        metadata: { donation_record_id: RECORD_ID },
      },
    },
  }
}

function renewal(overrides: Record<string, unknown> = {}, id = 'evt_inv1') {
  return {
    id,
    type: 'invoice.paid',
    data: {
      object: {
        id: 'in_1',
        amount_paid: 1000,
        currency: 'aud',
        customer: 'cus_1',
        status: 'paid',
        billing_reason: 'subscription_cycle',
        parent: { subscription_details: { subscription: 'sub_1' } },
        ...overrides,
      },
    },
  }
}

describe('Stripe webhook: event-id idempotency and renewals', () => {
  const originalInfo = console.info
  beforeEach(() => {
    vi.resetModules()
    vi.mocked(createClient).mockReset()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.test')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role')
    console.info = () => {}
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    console.info = originalInfo
  })

  async function setup(donations: Row[], opts: Parameters<typeof createStripeMemoryAdmin>[1] = {}) {
    const mem = createStripeMemoryAdmin(donations, opts)
    vi.mocked(createClient).mockReturnValue(mem.admin as never)
    const { processStripeDonationWebhook } = await import('@/lib/stripe/webhook-handler')
    return { mem, process: processStripeDonationWebhook }
  }

  const started = (): Row => ({ id: RECORD_ID, status: 'started', stripe_checkout_session_id: 'cs_test_1' })

  it('processes an event once and skips a second delivery of the same event id', async () => {
    const { mem, process } = await setup([started()])
    expect(await process(completed())).toEqual({ ok: true })
    expect(await process(completed())).toEqual({ ok: true })
    expect(mem.updateCalls).toHaveLength(1)
    expect(mem.events).toHaveLength(1)
    expect(mem.events[0]).toMatchObject({ event_id: 'evt_c1', type: 'checkout.session.completed' })
    expect(mem.events[0].processed_at).toBeTruthy()
  })

  it('retries an event whose earlier attempt failed (processed_at stays null)', async () => {
    const donations = [started()]
    const failing = await setup(donations, { failUpdate: true })
    expect(await failing.process(completed())).toEqual({ ok: false, reason: 'db_error' })
    expect(failing.mem.events[0].processed_at).toBeNull()

    vi.resetModules()
    const ok = await setup(donations, { events: failing.mem.events })
    expect(await ok.process(completed())).toEqual({ ok: true })
    expect(donations[0].status).toBe('paid')
    expect(ok.mem.events[0].processed_at).toBeTruthy()
  })

  it('returns an error (so Stripe retries) when the event claim itself fails', async () => {
    const { mem, process } = await setup([started()], { failEventClaim: true })
    expect(await process(completed())).toEqual({ ok: false, reason: 'db_error' })
    expect(mem.updateCalls).toHaveLength(0)
  })

  it('refuses to act on an event without an id', async () => {
    const { mem, process } = await setup([started()])
    const noId = { ...completed(), id: undefined }
    expect(await process(noId)).toEqual({ ok: false, reason: 'malformed' })
    expect(mem.updateCalls).toHaveLength(0)
    expect(mem.events).toHaveLength(0)
  })

  it('does not touch the database for ignored event types', async () => {
    const { process } = await setup([started()])
    await process({ id: 'evt_x', type: 'customer.subscription.updated', data: { object: { id: 'sub_1' } as never } })
    expect(createClient).not.toHaveBeenCalled()
  })

  it('records a subscription_cycle invoice.paid as a new paid monthly row for the same user', async () => {
    const donations: Row[] = [{ id: 'r0', user_id: USER, status: 'paid', stripe_subscription_id: 'sub_1' }]
    const { mem, process } = await setup(donations)
    expect(await process(renewal() as never)).toEqual({ ok: true })
    expect(donations).toHaveLength(2)
    expect(donations[1]).toMatchObject({
      user_id: USER,
      amount_cents: 1000,
      cadence: 'monthly',
      status: 'paid',
      stripe_invoice_id: 'in_1',
      stripe_subscription_id: 'sub_1',
      source: 'stripe_renewal',
    })
    expect(mem.events[0].processed_at).toBeTruthy()
  })

  it('does not double-record the same invoice, even under a different event id', async () => {
    const donations: Row[] = [{ id: 'r0', user_id: USER, status: 'paid', stripe_subscription_id: 'sub_1' }]
    const { process } = await setup(donations)
    await process(renewal() as never)
    await process(renewal({}, 'evt_inv_other') as never)
    await process(renewal() as never)
    expect(donations).toHaveLength(2)
  })

  it('ignores first invoices, unpaid invoices, zero amounts and unknown subscriptions', async () => {
    const donations: Row[] = [{ id: 'r0', user_id: USER, status: 'paid', stripe_subscription_id: 'sub_1' }]
    const { process } = await setup(donations)
    await process(renewal({ billing_reason: 'subscription_create' }, 'e1') as never)
    await process(renewal({ status: 'open' }, 'e2') as never)
    await process(renewal({ amount_paid: 0 }, 'e3') as never)
    await process(renewal({ parent: { subscription_details: { subscription: 'sub_unknown' } } }, 'e4') as never)
    await process(renewal({ parent: null, subscription: null }, 'e5') as never)
    expect(donations).toHaveLength(1)
  })

  it('reads the legacy invoice.subscription field too', async () => {
    const donations: Row[] = [{ id: 'r0', user_id: USER, status: 'paid', stripe_subscription_id: 'sub_1' }]
    const { process } = await setup(donations)
    await process(renewal({ parent: null, subscription: 'sub_1' }, 'e_legacy') as never)
    expect(donations).toHaveLength(2)
  })
})
