import { createHmac } from 'crypto'
import { describe, expect, it } from 'vitest'
import {
  STRIPE_WEBHOOK_TOLERANCE_SECONDS,
  verifyStripeSignature,
} from '@/lib/stripe/webhook-signature'

const SECRET = 'test-fixture-key'
const PAYLOAD = '{"id":"evt_test_1","type":"checkout.session.completed"}'
const NOW_MS = 1_700_000_000_000
const NOW_S = Math.floor(NOW_MS / 1000)

function sign(payload: string, secret: string, timestamp: number, extraV1: string[] = []) {
  const v1 = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest('hex')
  const parts = [`t=${timestamp}`, ...extraV1.map(v => `v1=${v}`), `v1=${v1}`]
  return { header: parts.join(','), v1 }
}

describe('verifyStripeSignature', () => {
  it('accepts a fresh valid signature', () => {
    const { header } = sign(PAYLOAD, SECRET, NOW_S)
    expect(verifyStripeSignature(PAYLOAD, header, SECRET, { now: NOW_MS })).toBe(true)
  })

  it('accepts a timestamp exactly at the 300s tolerance boundary', () => {
    const timestamp = NOW_S - STRIPE_WEBHOOK_TOLERANCE_SECONDS
    const { header } = sign(PAYLOAD, SECRET, timestamp)
    expect(verifyStripeSignature(PAYLOAD, header, SECRET, { now: NOW_MS })).toBe(true)
  })

  it('rejects a validly signed event older than 300s', () => {
    const timestamp = NOW_S - STRIPE_WEBHOOK_TOLERANCE_SECONDS - 1
    const { header } = sign(PAYLOAD, SECRET, timestamp)
    expect(verifyStripeSignature(PAYLOAD, header, SECRET, { now: NOW_MS })).toBe(false)
  })

  it('rejects a validly signed event timestamped more than 300s in the future', () => {
    const timestamp = NOW_S + STRIPE_WEBHOOK_TOLERANCE_SECONDS + 1
    const { header } = sign(PAYLOAD, SECRET, timestamp)
    expect(verifyStripeSignature(PAYLOAD, header, SECRET, { now: NOW_MS })).toBe(false)
  })

  it('rejects a tampered payload with an otherwise valid header', () => {
    const { header } = sign(PAYLOAD, SECRET, NOW_S)
    expect(verifyStripeSignature(`${PAYLOAD} `, header, SECRET, { now: NOW_MS })).toBe(false)
  })

  it('rejects a missing or empty signature header', () => {
    expect(verifyStripeSignature(PAYLOAD, null, SECRET, { now: NOW_MS })).toBe(false)
    expect(verifyStripeSignature(PAYLOAD, '', SECRET, { now: NOW_MS })).toBe(false)
  })

  it('rejects a non-numeric timestamp', () => {
    const { v1 } = sign(PAYLOAD, SECRET, NOW_S)
    expect(
      verifyStripeSignature(PAYLOAD, `t=not-a-number,v1=${v1}`, SECRET, { now: NOW_MS }),
    ).toBe(false)
  })

  it('rejects an odd-length or non-hex v1 value', () => {
    expect(
      verifyStripeSignature(PAYLOAD, `t=${NOW_S},v1=abc`, SECRET, { now: NOW_MS }),
    ).toBe(false)
    expect(
      verifyStripeSignature(PAYLOAD, `t=${NOW_S},v1=zz`, SECRET, { now: NOW_MS }),
    ).toBe(false)
  })

  it('accepts the event when any one of several v1 signatures matches', () => {
    const { header } = sign(PAYLOAD, SECRET, NOW_S, ['00'.repeat(32)])
    expect(verifyStripeSignature(PAYLOAD, header, SECRET, { now: NOW_MS })).toBe(true)
  })

  it('ignores an unknown scheme such as v0', () => {
    const { header, v1 } = sign(PAYLOAD, SECRET, NOW_S)
    const withV0 = `${header},v0=${v1}`
    expect(verifyStripeSignature(PAYLOAD, withV0, SECRET, { now: NOW_MS })).toBe(true)
  })
})
