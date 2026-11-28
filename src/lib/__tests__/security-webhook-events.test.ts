import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))

type Row = { id: string; status: string; stripe_payment_intent_id?: string }

function memoryAdmin(rows: Row[]) {
  const patches: Record<string, unknown>[] = []
  return {
    patches,
    admin: {
      from(table: string) {
        if (table !== 'donation_records') throw new Error(`unexpected table ${table}`)
        return {
          update(patch: Record<string, unknown>) {
            patches.push(patch)
            const filters: Array<(r: Row) => boolean> = []
            const q = {
              eq(col: string, val: unknown) {
                filters.push(r => (r as unknown as Record<string, unknown>)[col] === val)
                return q
              },
              then(resolve: (v: { error: null }) => unknown) {
                for (const r of rows.filter(r => filters.every(f => f(r)))) Object.assign(r, patch)
                return Promise.resolve({ error: null }).then(resolve)
              },
            }
            return q
          },
        }
      },
    },
  }
}

describe('Stripe webhook: refund and subscription events', () => {
  let logs: unknown[][]
  const originalInfo = console.info

  beforeEach(() => {
    vi.resetModules()
    vi.mocked(createClient).mockReset()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.test')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role')
    logs = []
    console.info = (...args: unknown[]) => { logs.push(args) }
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    console.info = originalInfo
  })

  it('charge.refunded (full) moves a paid donation to refunded via its payment intent', async () => {
    const rows: Row[] = [{ id: 'r1', status: 'paid', stripe_payment_intent_id: 'pi_1' }]
    vi.mocked(createClient).mockReturnValue(memoryAdmin(rows).admin as never)
    const { processStripeDonationWebhook } = await import('@/lib/stripe/webhook-handler')
    const result = await processStripeDonationWebhook({
      id: 'evt_1',
      type: 'charge.refunded',
      data: { object: { id: 'ch_1', payment_intent: 'pi_1', refunded: true } as never },
    })
    expect(result).toEqual({ ok: true })
    expect(rows[0].status).toBe('refunded')
  })

  it('charge.refunded does not touch started, failed, or already-refunded rows, or partial refunds', async () => {
    const rows: Row[] = [
      { id: 'a', status: 'started', stripe_payment_intent_id: 'pi_a' },
      { id: 'b', status: 'failed', stripe_payment_intent_id: 'pi_b' },
      { id: 'c', status: 'paid', stripe_payment_intent_id: 'pi_c' },
    ]
    const mem = memoryAdmin(rows)
    vi.mocked(createClient).mockReturnValue(mem.admin as never)
    const { processStripeDonationWebhook } = await import('@/lib/stripe/webhook-handler')

    for (const pi of ['pi_a', 'pi_b']) {
      await processStripeDonationWebhook({ id: 'e', type: 'charge.refunded', data: { object: { id: 'ch', payment_intent: pi, refunded: true } as never } })
    }
    await processStripeDonationWebhook({ id: 'e', type: 'charge.refunded', data: { object: { id: 'ch', payment_intent: 'pi_c', refunded: false } as never } })
    await processStripeDonationWebhook({ id: 'e', type: 'charge.refunded', data: { object: { id: 'ch', payment_intent: null, refunded: true } as never } })

    expect(rows.map(r => r.status)).toEqual(['started', 'failed', 'paid'])
  })

  it.each([
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.paid',
    'invoice.payment_failed',
    'refund.created',
  ])('%s is explicitly ignored: 2xx, no DB access, logs id and type only', async type => {
    const { processStripeDonationWebhook } = await import('@/lib/stripe/webhook-handler')
    const result = await processStripeDonationWebhook({
      id: 'evt_ign',
      type,
      data: { object: { id: 'sub_secret_like', customer: 'cus_private', payment_intent: 'pi_private' } as never },
    })
    expect(result).toEqual({ ok: true })
    expect(createClient).not.toHaveBeenCalled()

    const ignoredLog = logs.find(l => l[0] === 'stripe.webhook.ignored')
    expect(ignoredLog?.[1]).toEqual({ eventId: 'evt_ign', eventType: type })
    expect(JSON.stringify(logs)).not.toContain('cus_private')
    expect(JSON.stringify(logs)).not.toContain('pi_private')
  })

  it('unknown event types still return ok without DB access', async () => {
    const { processStripeDonationWebhook } = await import('@/lib/stripe/webhook-handler')
    expect(await processStripeDonationWebhook({ id: 'e', type: 'something.else', data: { object: { id: 'x' } as never } })).toEqual({ ok: true })
    expect(createClient).not.toHaveBeenCalled()
  })
})
