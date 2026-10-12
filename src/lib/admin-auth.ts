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

export function normalizeReturnPath(value: unknown, fallback = '/') {
  if (typeof value !== 'string') return fallback

  const path = value.trim()
  if (!path || !path.startsWith('/') || path.startsWith('//')) return fallback
  if (path.startsWith('/auth/sign-in') || path.startsWith('/auth/sign-up')) return fallback

  return path
}

export async function isAppAdmin(user: User | null | undefined) {
  if (!user) return false

  const email = user.email?.toLowerCase() ?? ''
  const isConfiguredAdmin =
    configuredAdminUserIds().has(user.id.toLowerCase()) ||
    (email ? configuredAdminEmails().has(email) : false)

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return isConfiguredAdmin
  }

  const admin = createAdminSupabaseClient()

  if (isConfiguredAdmin) {
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
