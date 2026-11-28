import { createHash } from 'node:crypto'
import { STRIPE_API_VERSION } from '@/lib/stripe/config'

export type DonationCadence = 'once' | 'monthly'

/** Requests inside the same window with the same inputs are one request. */
export const IDEMPOTENCY_WINDOW_MS = 2 * 60 * 1000

export type CheckoutIdentity = {
  /** Supabase user id, when signed in. */
  userId?: string | null
  /** Coarse key for anonymous donors (e.g. client IP). Only used for dedupe. */
  anonymousKey?: string | null
}

function uuidFromHash(hex: string) {
  // Format 32 hex chars as a v4-shaped UUID so it fits a uuid column.
  const h = hex.slice(0, 32).split('')
  h[12] = '4'
  h[16] = ['8', '9', 'a', 'b'][parseInt(h[16], 16) % 4]
  const s = h.join('')
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`
}

/**
 * Deterministic per user + request: the same user donating the same amount
 * and cadence inside one window gets the same Idempotency-Key and the same
 * donation record id, so a double click or retry returns the same Checkout
 * Session instead of creating a second one.
 */
export function buildCheckoutIdempotency(input: CheckoutIdentity & {
  amountCents: number
  cadence: DonationCadence
  now?: number
}) {
  const subject = input.userId ? `user:${input.userId}` : `anon:${input.anonymousKey || 'unknown'}`
  const bucket = Math.floor((input.now ?? Date.now()) / IDEMPOTENCY_WINDOW_MS)
  const digest = createHash('sha256')
    .update(`stickee:donate:v1:${subject}:${input.cadence}:${input.amountCents}:${bucket}`)
    .digest('hex')

  return {
    idempotencyKey: `stickee-donate-${digest.slice(0, 48)}`,
    donationRecordId: uuidFromHash(digest.slice(48) + digest.slice(0, 16)),
  }
}

const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{8,200}$/

export type RetrievedCheckoutSession = {
  id: string
  payment_status?: string
  status?: string
  client_reference_id?: string | null
  mode?: string
}

/** GET the Checkout Session from Stripe (direct fetch, no stripe library). */
export async function retrieveCheckoutSession(
  sessionId: string,
  secretKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RetrievedCheckoutSession | null> {
  if (!SESSION_ID_RE.test(sessionId)) return null

  let response: Response
  try {
    response = await fetchImpl(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Stripe-Version': STRIPE_API_VERSION,
        },
        cache: 'no-store',
      },
    )
  } catch {
    return null
  }

  if (!response.ok) return null
  const session = (await response.json()) as RetrievedCheckoutSession
  if (!session || session.id !== sessionId) return null
  return session
}

export type DonationVerification =
  | { state: 'paid' }
  | { state: 'pending' }
  | { state: 'unverified' }

/**
 * Success is shown only when Stripe says the session is paid AND it was
 * created for this signed-in user (client_reference_id). Anything else,
 * including every anonymous visitor, is `unverified`. This never writes.
 */
export function verifyDonationSession(
  session: RetrievedCheckoutSession | null,
  userId: string | null | undefined,
): DonationVerification {
  if (!session || !userId) return { state: 'unverified' }
  if (!session.client_reference_id || session.client_reference_id !== userId) {
    return { state: 'unverified' }
  }
  if (session.payment_status === 'paid') return { state: 'paid' }
  if (session.status === 'complete') return { state: 'pending' }
  return { state: 'unverified' }
}
