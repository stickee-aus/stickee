import 'server-only'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isAppAdmin } from '@/lib/admin-auth'
import { isSupabaseConfigured } from '@/lib/supabase-config'

/**
 * Resolves the current user. Redirects to sign-in if not authenticated.
 */
export async function requireSignedIn() {
  if (!isSupabaseConfigured) redirect('/auth/sign-in')

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')
  return user
}

/**
 * Resolves the current user and asserts they are in app_admins.
 * Returns the user and a boolean. The /admin/* layout uses the boolean
 * to render an "access required" panel instead of a hard redirect.
 */
export async function getAdminUser() {
  if (!isSupabaseConfigured) return { user: null, isAdmin: false as const }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, isAdmin: false as const }

  return { user, isAdmin: await isAppAdmin(user) }
}

/**
 * For server actions: throws if the caller isn't an admin. Returns the admin's user id.
 */
export async function requireAdminUserId() {
  const { user, isAdmin } = await getAdminUser()
  if (!user) throw new Error('Authentication required.')
  if (!isAdmin) throw new Error('Admin access required.')
  return user.id
}
