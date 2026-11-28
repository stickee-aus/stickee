import 'server-only'

import type { SupabaseClient, User } from '@supabase/supabase-js'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

function listFromEnv(...names: string[]) {
  return names.flatMap(name =>
    (process.env[name] ?? '')
      .split(',')
      .map(value => value.trim().toLowerCase())
      .filter(Boolean)
  )
}

function configuredAdminEmails() {
  return new Set(listFromEnv('STICKEE_ADMIN_EMAILS', 'ADMIN_EMAILS'))
}

function configuredAdminUserIds() {
  return new Set(listFromEnv('STICKEE_ADMIN_USER_IDS', 'ADMIN_USER_IDS'))
}

const RETURN_PATH_BASE = 'http://stickee.invalid'

/**
 * Accept only a same-origin, path-only return target. Rejects absolute URLs,
 * protocol-relative URLs, backslash tricks (`/\\evil.com`), control
 * characters and anything that resolves to a different origin.
 */
export function normalizeReturnPath(value: unknown, fallback = '/') {
  if (typeof value !== 'string') return fallback

  const path = value.trim()
  if (!path || !path.startsWith('/') || path.startsWith('//')) return fallback
  if (/[\\\u0000-\u001f\u007f]/.test(path)) return fallback
  if (path.startsWith('/auth/sign-in') || path.startsWith('/auth/sign-up')) return fallback

  try {
    const resolved = new URL(path, RETURN_PATH_BASE)
    if (resolved.origin !== RETURN_PATH_BASE) return fallback
  } catch {
    return fallback
  }

  return path
}

/**
 * Env allowlist match, exact (case-insensitive) only. An email address is
 * only honoured when Supabase reports it as confirmed: otherwise anyone
 * could sign up with an admin's address and be treated as admin. User-id
 * matches do not depend on email.
 */
export function isConfiguredAdminUser(user: User | null | undefined) {
  if (!user) return false

  if (configuredAdminUserIds().has(user.id.toLowerCase())) return true

  const email = user.email?.trim().toLowerCase() ?? ''
  if (!email || !user.email_confirmed_at) return false

  return configuredAdminEmails().has(email)
}

export async function isAppAdmin(user: User | null | undefined) {
  if (!user) return false

  const isConfiguredAdmin = isConfiguredAdminUser(user)

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return isConfiguredAdmin
  }

  const admin = createAdminSupabaseClient()

  if (isConfiguredAdmin) {
    await admin.from('app_admins').upsert({ user_id: user.id })
    return true
  }

  const { data } = await admin
    .from('app_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return Boolean(data)
}

export async function getPostAuthRedirectPath(
  supabase: SupabaseClient,
  requestedPath: string | null | undefined,
) {
  const { data: { user } } = await supabase.auth.getUser()
  const requested = normalizeReturnPath(requestedPath ?? '', '')

  if (requested) return requested
  if (await isAppAdmin(user)) return '/admin'

  return '/'
}
