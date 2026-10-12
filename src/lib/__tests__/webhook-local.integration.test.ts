import { readFileSync } from 'node:fs'
import { randomUUID, createHmac } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { POST } from '@/app/api/donations/webhook/route'

// Explicit opt-in: never load saved application credentials or call a hosted DB.
const enabled = process.env.STICKEE_LOCAL_WEBHOOK_QA === '1'
describe.skipIf(!enabled)('synthetic webhook handler against real local PostgREST', () => {
  let db: SupabaseClient
  const prefix = `evt_qaP4${randomUUID().replaceAll('-', '')}`
  const secret = `whsec_local_simulation_${randomUUID()}`
  const donationIds: string[] = []
  beforeAll(() => {
    const local = JSON.parse(readFileSync('/private/tmp/stickee-qa-env.json', 'utf8'))
    expect(new URL(local.api).hostname).toBe('127.0.0.1')
    db = createClient(local.api, local.service, { auth: { persistSession: false, autoRefreshToken: false } })
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', local.api)
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', local.service)
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_local_simulation_only')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', secret)
  })
  afterAll(async () => {
    if (donationIds.length) expect((await db.from('donation_records').delete().in('id', donationIds)).error).toBeNull()
    expect((await db.from('stripe_webhook_events').delete().like('event_id', `${prefix}%`)).error).toBeNull()
    expect((await db.from('stripe_webhook_events').select('event_id').like('event_id', `${prefix}%`)).data).toEqual([])
    vi.unstubAllEnvs()
  })
  async function fixture(session: string, id = randomUUID()) {
    const result = await db.from('donation_records').insert({ id, amount_cents: 100, currency: 'aud', cadence: 'one_time', status: 'started', stripe_checkout_session_id: session, source: 'local_qa_simulation' })
    expect(result.error).toBeNull()
    donationIds.push(id)
    return id
  }
  function event(type: string, session: string, id: string, label: string) {
    return { id: `${prefix}${label.replace(/[^A-Za-z0-9]/g, "")}`, type, livemode: false, data: { object: { id: session, amount_total: 100, currency: 'aud', payment_status: 'paid', metadata: { donation_record_id: id } } } }
  }
  async function deliver(value: ReturnType<typeof event>, seconds = Math.floor(Date.now() / 1000), bad = false) {
    const body = JSON.stringify(value)
    const signature = createHmac('sha256', bad ? 'wrong-secret' : secret).update(`${seconds}.${body}`).digest('hex')
    return POST(new Request('http://127.0.0.1/api/donations/webhook', { method: 'POST', body, headers: { 'stripe-signature': `t=${seconds},v1=${signature}` } }))
  }
  async function record(id: string) { return (await db.from('donation_records').select('status').eq('id', id).single()).data }
  it('rejects stale replay, forged signatures and live-mode events before database claims', async () => {
    const value = event('checkout.session.completed', 'cs_test_fake', randomUUID(), 'replay')
    expect((await deliver(value, Math.floor(Date.now()/1000)-301)).status).toBe(400)
    expect((await deliver(value, undefined, true)).status).toBe(400)
    value.livemode = true
    expect((await deliver(value)).status).toBe(400)
    expect((await db.from('stripe_webhook_events').select('event_id').eq('event_id', value.id)).data).toEqual([])
  })
  it('persists paid completion once and deduplicates concurrent redelivery', async () => {
    const session = `${prefix}_paid`, id = await fixture(session)
    const value = event('checkout.session.completed', session, id, 'paid')
    expect((await deliver(value)).status).toBe(200)
    expect(await record(id)).toEqual({ status: 'paid' })
    const responses = await Promise.all([deliver(value), deliver(value)])
    for (const response of responses) expect(await response.json()).toEqual({ received: true, duplicate: true })
    const stored = await db.from('stripe_webhook_events').select('attempts,status').eq('event_id', value.id).single()
    expect(stored.data).toEqual({ attempts: 1, status: 'processed' })
  })
  it('returns 500 on missing donation then retries the same event successfully after repair', async () => {
    const session = `${prefix}_retry`, id = randomUUID()
    const value = event('checkout.session.completed', session, id, 'retry')
    expect((await deliver(value)).status).toBe(500)
    expect((await db.from('stripe_webhook_events').select('status').eq('event_id', value.id).single()).data?.status).toBe('failed')
    await fixture(session, id)
    expect((await deliver(value)).status).toBe(200)
    expect(await record(id)).toEqual({ status: 'paid' })
    expect((await db.from('stripe_webhook_events').select('attempts,status').eq('event_id', value.id).single()).data).toEqual({ attempts: 2, status: 'processed' })
  })
  it.each(['checkout.session.expired', 'checkout.session.async_payment_failed'])('persists failed status for %s', async type => {
    const session = `${prefix}_${type}`, id = await fixture(session)
    expect((await deliver(event(type, session, id, type))).status).toBe(200)
    expect(await record(id)).toEqual({ status: 'failed' })
  })
  it('leaves unpaid completion started until asynchronous payment success', async () => {
    const session = `${prefix}_async`, id = await fixture(session)
    const value = event('checkout.session.completed', session, id, 'unpaid')
    value.data.object.payment_status = 'unpaid'
    expect((await deliver(value)).status).toBe(200)
    expect(await record(id)).toEqual({ status: 'started' })
    expect((await deliver(event('checkout.session.async_payment_succeeded', session, id, 'async'))).status).toBe(200)
    expect(await record(id)).toEqual({ status: 'paid' })
  })
})
