import { createHmac, timingSafeEqual } from 'crypto'

/** Stripe's default webhook signature tolerance, in seconds. */
export const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300

export type VerifyStripeSignatureOptions = {
  /** Epoch milliseconds. Defaults to Date.now(). Injected by tests. */
  now?: number
}

/**
 * Verify a Stripe-style `Stripe-Signature` header (`t=...,v1=...`) against
 * the raw request body. Rejects timestamps outside a 300s window, and accepts
 * the event if any `v1` value matches (secret rotation can send several).
 *
 * Comparison of each digest uses `timingSafeEqual`. This is a local
 * implementation so we don't add the `stripe` package.
 */
export function verifyStripeSignature(
  payload: string,
  signatureHeader: string | null | undefined,
  secret: string,
  options: VerifyStripeSignatureOptions = {},
): boolean {
  if (!signatureHeader || !secret) return false

  let timestamp: string | undefined
  const v1Signatures: string[] = []

  for (const part of signatureHeader.split(',')) {
    const eq = part.indexOf('=')
    if (eq <= 0) continue
    const key = part.slice(0, eq)
    const value = part.slice(eq + 1)
    if (key === 't') timestamp = value
    else if (key === 'v1' && value) v1Signatures.push(value)
  }

  if (!timestamp || !/^\d+$/.test(timestamp) || v1Signatures.length === 0) {
    return false
  }

  const nowSeconds = Math.floor((options.now ?? Date.now()) / 1000)
  const timestampSeconds = Number(timestamp)
  if (Math.abs(nowSeconds - timestampSeconds) > STRIPE_WEBHOOK_TOLERANCE_SECONDS) {
    return false
  }

  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest()

  let matched = false
  for (const v1 of v1Signatures) {
    const expected = Buffer.from(v1, 'hex')
    if (expected.length !== digest.length) continue
    if (timingSafeEqual(expected, digest)) {
      matched = true
    }
  }

  return matched
}
