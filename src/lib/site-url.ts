/**
 * Trusted site origin for building absolute URLs (auth redirects, Stripe
 * success/cancel URLs).
 *
 * Never derive the origin from request headers such as `x-forwarded-host`,
 * `host` or `origin`: any client can set those, which allows poisoned
 * password-reset / magic-link / checkout return URLs.
 *
 * Resolution order:
 *   1. NEXT_PUBLIC_SITE_URL or SITE_URL (a full http(s) URL; path ignored)
 *   2. VERCEL_PROJECT_PRODUCTION_URL (hostname, https assumed) in production
 *   3. Outside production only: http://localhost:3000, or the request host
 *      when (and only when) it is localhost / 127.0.0.1
 *
 * Returns null when nothing trustworthy is configured; callers must fail
 * closed instead of guessing.
 */

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]'])

function isProductionRuntime(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV !== 'production') return false
  return !env.VERCEL_ENV || env.VERCEL_ENV === 'production'
}

function parseOrigin(value: string | undefined | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.origin
  } catch {
    return null
  }
}

export function getTrustedSiteOrigin(
  requestHost?: string | null,
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const configured = parseOrigin(env.NEXT_PUBLIC_SITE_URL) ?? parseOrigin(env.SITE_URL)
  if (configured) return configured

  const production = isProductionRuntime(env)

  if (env.VERCEL_PROJECT_PRODUCTION_URL && production) {
    const fromVercel = parseOrigin(`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`)
    if (fromVercel) return fromVercel
  }

  if (production) return null

  if (requestHost) {
    const parsed = parseOrigin(`http://${requestHost}`)
    if (parsed && LOCAL_HOSTNAMES.has(new URL(parsed).hostname)) return parsed
  }
  return 'http://localhost:3000'
}

/** True only when `candidate` is exactly the trusted site origin. */
export function isTrustedOrigin(
  candidate: string | null | undefined,
  requestHost?: string | null,
  env: NodeJS.ProcessEnv = process.env,
) {
  const trusted = getTrustedSiteOrigin(requestHost, env)
  const parsed = parseOrigin(candidate)
  return Boolean(trusted && parsed && parsed === trusted)
}
