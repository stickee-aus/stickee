import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  STRIPE_SIGNATURE_TOLERANCE_SECONDS,
  verifyStripeSignature,
} from '@/lib/stripe-security'

const root = path.resolve(import.meta.dirname, '../../..')
const read = (file: string) => readFileSync(path.join(root, file), 'utf8')

function signature(payload: string, secret: string, timestamp: number) {
  const digest = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
  return `t=${timestamp},v1=${digest}`
}

describe('Stripe webhook signature verification', () => {
  const payload = JSON.stringify({ id: 'evt_test', type: 'checkout.session.completed' })
  const secret = 'whsec_unit_test_only'
  const now = 2_000_000_000

  it('accepts a valid signature inside the replay window', () => {
    expect(verifyStripeSignature(payload, signature(payload, secret, now), secret, now)).toBe(true)
  })

  it('rejects stale and future signatures outside the tolerance', () => {
    const delta = STRIPE_SIGNATURE_TOLERANCE_SECONDS + 1
    expect(verifyStripeSignature(payload, signature(payload, secret, now - delta), secret, now)).toBe(false)
    expect(verifyStripeSignature(payload, signature(payload, secret, now + delta), secret, now)).toBe(false)
  })

  it('rejects malformed, absent, and wrong signatures', () => {
    expect(verifyStripeSignature(payload, null, secret, now)).toBe(false)
    expect(verifyStripeSignature(payload, 't=bad,v1=nope', secret, now)).toBe(false)
    expect(verifyStripeSignature(payload, signature(`${payload}x`, secret, now), secret, now)).toBe(false)
  })

  it('accepts any matching v1 signature during secret rotation', () => {
    const valid = signature(payload, secret, now).split('v1=')[1]
    expect(verifyStripeSignature(payload, `t=${now},v1=${'0'.repeat(64)},v1=${valid}`, secret, now)).toBe(true)
  })
})

describe('Stripe route security contracts', () => {
  it('persists a client retry id and sends it as Stripe idempotency key', () => {
    const form = read('src/components/DonateAmountForm.tsx')
    const checkout = read('src/app/api/donations/checkout/route.ts')
    expect(form).toContain('crypto.randomUUID()')
    expect(form).toContain('attemptId: checkoutAttempt.current.id')
    expect(checkout).toContain("'Idempotency-Key': attemptId")
    expect(checkout).toContain("onConflict: 'checkout_attempt_id'")
    expect(checkout).toContain('Unable to record this checkout safely.')
  })

  it('claims webhook events persistently and returns failures for Stripe retry', () => {
    const webhook = read('src/app/api/donations/webhook/route.ts')
    expect(webhook).toContain("admin.rpc('claim_stripe_webhook_event'")
    expect(webhook).toContain("status: 'failed'")
    expect(webhook).toContain("{ status: 500 }")
    expect(webhook).toContain("event.type === 'checkout.session.async_payment_succeeded'")
    expect(webhook).toContain("session.payment_status === 'paid'")
  })

  it('does not render a success claim without provider verification', () => {
    const success = read('src/app/donate/success/page.tsx')
    expect(success).toContain('retrieveCheckoutSession')
    expect(success).toContain("session.payment_status === 'paid'")
    expect(success).toContain('Payment not verified')
    expect(success).not.toContain('Donation received')
  })
})

