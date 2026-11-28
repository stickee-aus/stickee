/**
 * Stripe secret-key access with a live-key guard.
 *
 * A live secret key (sk_live_ / rk_live_) is refused outside production
 * unless STICKEE_ALLOW_LIVE_STRIPE_KEYS=true is set explicitly. This stops a
 * contributor's local or preview environment from creating real charges by
 * accident. "Production" means NODE_ENV=production and, on Vercel,
 * VERCEL_ENV=production.
 */

export const STRIPE_API_VERSION = '2026-02-25.clover'

const LIVE_KEY_PREFIXES = ['sk_live_', 'rk_live_']

function isProductionRuntime(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV !== 'production') return false
  return !env.VERCEL_ENV || env.VERCEL_ENV === 'production'
}

export type StripeKeyResult =
  | { ok: true; key: string }
  | { ok: false; reason: 'missing' | 'live_key_blocked' }

export function getStripeSecretKey(env: NodeJS.ProcessEnv = process.env): StripeKeyResult {
  const key = env.STRIPE_SECRET_KEY?.trim()
  if (!key) return { ok: false, reason: 'missing' }

  const isLive = LIVE_KEY_PREFIXES.some(prefix => key.startsWith(prefix))
  if (isLive && !isProductionRuntime(env) && env.STICKEE_ALLOW_LIVE_STRIPE_KEYS !== 'true') {
    return { ok: false, reason: 'live_key_blocked' }
  }

  return { ok: true, key }
}
