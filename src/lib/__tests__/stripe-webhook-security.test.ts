import { createHmac } from 'crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

type DonationRow = {
  id: string
  stripe_checkout_session_id: string
  status: 'started' | 'paid' | 'failed' | 'refunded'
  amount_cents: number | null
  currency: string
  stripe_customer_id?: string
  stripe_payment_intent_id?: string
  stripe_subscription_id?: string
  updated_at?: string
}

const SIGNING_SECRET = 'test-fixture-key'
const SUPABASE_URL = 'https://example.supabase.test'
const SERVICE_KEY = 'test-service-role'

const RECORD_ID = '11111111-1111-4111-8111-111111111111'
const SESSION_ID = 'cs_test_session_1'
const EVENT_ID = 'evt_test_completed_1'

function sign(payload: string, timestamp = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac('sha256', SIGNING_SECRET)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest('hex')
  return { header: `t=${timestamp},v1=${v1}`, timestamp }
}

function checkoutEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: EVENT_ID,
    type: 'checkout.session.completed',
    data: {
      object: {
        id: SESSION_ID,
        amount_total: 2500,
        currency: 'aud',
        customer: 'cus_test_1',
        payment_intent: 'pi_test_1',
        payment_status: 'paid',
        metadata: { donation_record_id: RECORD_ID },
      },
    },
    ...overrides,
  }
}

function createMemoryAdmin(
  rows: DonationRow[],
  options: { failUpdate?: boolean; failMessage?: string } = {},
) {
  const updateCalls: Record<string, unknown>[] = []

  const admin = {
    from(table: string) {
      if (table !== 'donation_records') {
        throw new Error(`unexpected table ${table}`)
      }
      return {
        update(patch: Record<string, unknown>) {
          updateCalls.push(patch)
          const filters: Array<(row: DonationRow) => boolean> = []
          const query = {
            eq(column: string, value: unknown) {
              filters.push(row => (row as unknown as Record<string, unknown>)[column] === value)
              return query
            },
            in(column: string, values: unknown[]) {
              filters.push(row =>
                values.includes((row as unknown as Record<string, unknown>)[column]),
              )
              return query
            },
            then(
              resolve: (value: { data: DonationRow[] | null; error: { message: string } | null }) => unknown,
              reject?: (reason: unknown) => unknown,
            ) {
              return Promise.resolve(execute()).then(resolve, reject)
            },
          }
          function execute() {
            if (options.failUpdate) {
              return { data: null, error: { message: options.failMessage ?? 'simulated-db-failure' } }
            }
            const matches = rows.filter(row => filters.every(filter => filter(row)))
            for (const row of matches) Object.assign(row, patch)
            return { data: matches, error: null }
          }
          return query
        },
      }
    },
  }

  return { admin, updateCalls, rows }
}

async function postWebhook(payload: string, signature: string | null) {
  const { POST } = await import('@/app/api/donations/webhook/route')
  const headers = new Headers()
  if (signature !== null) headers.set('stripe-signature', signature)
  const request = new Request('http://stickee.test/api/donations/webhook', {
    method: 'POST',
    headers,
    body: payload,
  })
  return POST(request)
}

describe('Stripe donation webhook security', () => {
  let logs: Array<{ level: string; args: unknown[] }>
  const originalInfo = console.info
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error

  beforeEach(() => {
    vi.resetModules()
    vi.mocked(createClient).mockReset()
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', SIGNING_SECRET)
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL)
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', SERVICE_KEY)

    logs = []
    const capture =
      (level: string) =>
      (...args: unknown[]) => {
        logs.push({ level, args })
      }
    console.info = capture('info')
    console.log = capture('log')
    console.warn = capture('warn')
    console.error = capture('error')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    console.info = originalInfo
    console.log = originalLog
    console.warn = originalWarn
    console.error = originalError
  })

  function seed(rowOverrides: Partial<DonationRow> = {}, adminOptions?: { failUpdate?: boolean; failMessage?: string }) {
    const rows: DonationRow[] = [
      {
        id: RECORD_ID,
        stripe_checkout_session_id: SESSION_ID,
        status: 'started',
        amount_cents: 2500,
        currency: 'aud',
        ...rowOverrides,
      },
    ]
    const memory = createMemoryAdmin(rows, adminOptions)
    vi.mocked(createClient).mockReturnValue(memory.admin as never)
    return memory
  }

  it('rejects a request with no stripe-signature header', async () => {
    const memory = seed()
    const payload = JSON.stringify(checkoutEvent())
    const response = await postWebhook(payload, null)
    expect(response.status).toBe(400)
    expect(memory.updateCalls).toHaveLength(0)
  })

  it('rejects a tampered payload with an otherwise valid header', async () => {
    const memory = seed()
    const payload = JSON.stringify(checkoutEvent())
    const { header } = sign(payload)
    const response = await postWebhook(`${payload} `, header)
    expect(response.status).toBe(400)
    expect(memory.updateCalls).toHaveLength(0)
  })

  it('rejects a validly signed event older than 300s', async () => {
    const memory = seed()
    const payload = JSON.stringify(checkoutEvent())
    const { header } = sign(payload, Math.floor(Date.now() / 1000) - 301)
    const response = await postWebhook(payload, header)
    expect(response.status).toBe(400)
    expect(memory.updateCalls).toHaveLength(0)
  })

  it('rejects a validly signed event timestamped more than 300s in the future', async () => {
    const memory = seed()
    const payload = JSON.stringify(checkoutEvent())
    const { header } = sign(payload, Math.floor(Date.now() / 1000) + 301)
    const response = await postWebhook(payload, header)
    expect(response.status).toBe(400)
    expect(memory.updateCalls).toHaveLength(0)
  })

  it('accepts a fresh valid signature and applies a guarded paid update', async () => {
    const memory = seed()
    const payload = JSON.stringify(checkoutEvent())
    const { header } = sign(payload)
    const response = await postWebhook(payload, header)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ received: true })
    expect(memory.rows[0].status).toBe('paid')
    expect(memory.updateCalls).toHaveLength(1)
    expect(memory.updateCalls[0].status).toBe('paid')
  })

  it('accepts when any one of multiple v1 signatures matches', async () => {
    const memory = seed()
    const payload = JSON.stringify(checkoutEvent())
    const timestamp = Math.floor(Date.now() / 1000)
    const valid = createHmac('sha256', SIGNING_SECRET)
      .update(`${timestamp}.${payload}`, 'utf8')
      .digest('hex')
    const header = `t=${timestamp},v1=${'11'.repeat(8)},v1=${valid}`
    const response = await postWebhook(payload, header)
    expect(response.status).toBe(200)
    expect(memory.rows[0].status).toBe('paid')
  })

  it('returns 400, not 500, on malformed JSON after a valid signature', async () => {
    const memory = seed()
    const payload = '{"id":'
    const { header } = sign(payload)
    const response = await postWebhook(payload, header)
    expect(response.status).toBe(400)
    expect(memory.updateCalls).toHaveLength(0)
  })

  it('returns 500 when STRIPE_WEBHOOK_SECRET is unset', async () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', '')
    const payload = JSON.stringify(checkoutEvent())
    const { header } = sign(payload)
    const response = await postWebhook(payload, header)
    expect(response.status).toBe(500)
  })

  it('returns 5xx when the service client is unavailable so Stripe retries', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
    const payload = JSON.stringify(checkoutEvent())
    const { header } = sign(payload)
    const response = await postWebhook(payload, header)
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(JSON.stringify(body)).not.toContain(SERVICE_KEY)
  })

  it('returns 5xx when the donation update errors so Stripe retries', async () => {
    const memory = seed({}, { failUpdate: true, failMessage: 'simulated-db-failure' })
    const payload = JSON.stringify(checkoutEvent())
    const { header } = sign(payload)
    const response = await postWebhook(payload, header)
    expect(response.status).toBe(500)
    const body = await response.text()
    expect(body).not.toContain('simulated-db-failure')
    expect(memory.rows[0].status).toBe('started')
  })

  it('does not double-process a duplicate delivery of the same event', async () => {
    const memory = seed()
    const payload = JSON.stringify(checkoutEvent())
    const { header } = sign(payload)

    const first = await postWebhook(payload, header)
    expect(first.status).toBe(200)
    expect(memory.rows[0].status).toBe('paid')
    expect(memory.rows[0].amount_cents).toBe(2500)

    const second = await postWebhook(payload, header)
    expect(second.status).toBe(200)
    expect(memory.rows[0].status).toBe('paid')
    expect(memory.rows[0].amount_cents).toBe(2500)
    // Second delivery still issues a guarded update, but it matches no rows
    // because status is no longer 'started', so the paid amount is not reapplied
    // as a second donation.
    expect(memory.updateCalls).toHaveLength(2)
  })

  it('does not mark paid when checkout.session.completed has payment_status unpaid', async () => {
    const memory = seed()
    const event = checkoutEvent()
    ;(event.data.object as { payment_status: string }).payment_status = 'unpaid'
    const payload = JSON.stringify(event)
    const { header } = sign(payload)
    const response = await postWebhook(payload, header)
    expect(response.status).toBe(200)
    expect(memory.rows[0].status).toBe('started')
    expect(memory.updateCalls).toHaveLength(0)
  })

  it('marks paid on async_payment_succeeded and failed only from started', async () => {
    const memory = seed()
    const succeeded = checkoutEvent({
      id: 'evt_test_async_ok',
      type: 'checkout.session.async_payment_succeeded',
    })
    const payload = JSON.stringify(succeeded)
    const { header } = sign(payload)
    const response = await postWebhook(payload, header)
    expect(response.status).toBe(200)
    expect(memory.rows[0].status).toBe('paid')

    const failed = checkoutEvent({
      id: 'evt_test_async_fail',
      type: 'checkout.session.async_payment_failed',
    })
    const failedPayload = JSON.stringify(failed)
    const failedSign = sign(failedPayload)
    const failedResponse = await postWebhook(failedPayload, failedSign.header)
    expect(failedResponse.status).toBe(200)
    expect(memory.rows[0].status).toBe('paid')
  })

  it('does not revert a refunded or failed donation when a completed event is replayed', async () => {
    for (const status of ['refunded', 'failed'] as const) {
      vi.resetModules()
      const memory = seed({ status })
      const payload = JSON.stringify(checkoutEvent())
      const { header } = sign(payload)
      const response = await postWebhook(payload, header)
      expect(response.status).toBe(200)
      expect(memory.rows[0].status).toBe(status)
    }
  })

  it('does not null amount_cents when amount_total is missing', async () => {
    const memory = seed({ amount_cents: 2500 })
    const event = checkoutEvent()
    delete (event.data.object as { amount_total?: number }).amount_total
    const payload = JSON.stringify(event)
    const { header } = sign(payload)
    const response = await postWebhook(payload, header)
    expect(response.status).toBe(200)
    expect(memory.rows[0].amount_cents).toBe(2500)
    expect(memory.updateCalls[0]).not.toHaveProperty('amount_cents')
  })

  it('logs only the event id and type, never the payload, signature or secret', async () => {
    seed()
    const payload = JSON.stringify(checkoutEvent())
    const { header } = sign(payload)
    await postWebhook(payload, header)

    const rendered = logs.map(entry =>
      entry.args
        .map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' '),
    )
    expect(rendered.some(line => line.includes(EVENT_ID))).toBe(true)
    expect(rendered.some(line => line.includes('checkout.session.completed'))).toBe(true)
    const joined = rendered.join('\n')
    expect(joined).not.toContain(payload)
    expect(joined).not.toContain(header)
    expect(joined).not.toContain(SIGNING_SECRET)
    expect(joined).not.toContain(SERVICE_KEY)
  })
})
