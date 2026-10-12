import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

export const STRIPE_API_VERSION = '2026-02-25.clover'
export const STRIPE_SIGNATURE_TOLERANCE_SECONDS = 300

export function verifyStripeSignature(
  payload: string,
  signature: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!signature || !secret) return false

  const values = signature.split(',').reduce<Record<string, string[]>>((result, part) => {
    const separator = part.indexOf('=')
    if (separator < 1) return result
    const key = part.slice(0, separator).trim()
    const value = part.slice(separator + 1).trim()
    if (key && value) (result[key] ??= []).push(value)
    return result
  }, {})

  const timestampText = values.t?.[0]
  const timestamp = Number(timestampText)
  if (!timestampText || !Number.isSafeInteger(timestamp)) return false
  if (Math.abs(nowSeconds - timestamp) > STRIPE_SIGNATURE_TOLERANCE_SECONDS) return false

  const digest = createHmac('sha256', secret)
    .update(`${timestampText}.${payload}`, 'utf8')
    .digest()

  return (values.v1 ?? []).some(candidate => {
    if (!/^[a-f\d]{64}$/i.test(candidate)) return false
    const supplied = Buffer.from(candidate, 'hex')
    return supplied.length === digest.length && timingSafeEqual(supplied, digest)
  })
}

export function isStripeTestSecret(secret: string) {
  return secret.startsWith('sk_test_')
}

export async function retrieveCheckoutSession(sessionId: string, secret: string) {
  if (!/^cs_(?:test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) return null

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    {
      headers: {
        Authorization: `Bearer ${secret}`,
        'Stripe-Version': STRIPE_API_VERSION,
      },
      cache: 'no-store',
    },
  )

  if (!response.ok) return null
  return response.json() as Promise<{
    id: string
    livemode: boolean
    payment_status: 'paid' | 'unpaid' | 'no_payment_required'
    status: 'open' | 'complete' | 'expired' | null
  }>
}
