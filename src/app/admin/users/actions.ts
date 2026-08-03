'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { requireAdminUserId } from '../_lib/guard'

async function logModeration(
  adminUserId: string,
  targetUserId: string,
  action: string,
  notes?: string | null
) {
  const admin = createAdminSupabaseClient()
  await admin.from('moderation_actions').insert({
    admin_id: adminUserId,
    target_type: 'user',
    target_id: targetUserId,
    action,
    notes: notes ?? null,
  })
}

/**
 * Ban a user for a duration. Default: ~114 years ('999999h').
 * Setting `ban_duration: 'none'` lifts the ban.
 */
export async function banUserAction(formData: FormData) {
  const adminId = await requireAdminUserId()
  const targetUserId = String(formData.get('userId') ?? '')
  const durationHours = String(formData.get('durationHours') ?? '999999')
  const reason = String(formData.get('reason') ?? '').trim().slice(0, 500)

  if (!targetUserId) return

  const admin = createAdminSupabaseClient()
  const { error } = await admin.auth.admin.updateUserById(targetUserId, {
    ban_duration: `${durationHours}h`,
  })

  if (error) throw new Error(`Ban failed: ${error.message}`)

  await logModeration(adminId, targetUserId, `ban:${durationHours}h`, reason || null)
  revalidatePath('/admin/users')
}

export async function unbanUserAction(formData: FormData) {
  const adminId = await requireAdminUserId()
  const targetUserId = String(formData.get('userId') ?? '')
  if (!targetUserId) return

  const admin = createAdminSupabaseClient()
  const { error } = await admin.auth.admin.updateUserById(targetUserId, {
    ban_duration: 'none',
  })

  if (error) throw new Error(`Unban failed: ${error.message}`)

  await logModeration(adminId, targetUserId, 'unban', null)
  revalidatePath('/admin/users')
}

export async function promoteToAdminAction(formData: FormData) {
  const adminId = await requireAdminUserId()
  const targetUserId = String(formData.get('userId') ?? '')
  if (!targetUserId) return

  const admin = createAdminSupabaseClient()
  await admin.from('app_admins').upsert({ user_id: targetUserId })

  await logModeration(adminId, targetUserId, 'promote_admin', null)
  revalidatePath('/admin/users')
}

export async function demoteAdminAction(formData: FormData) {
  const adminId = await requireAdminUserId()
  const targetUserId = String(formData.get('userId') ?? '')
  if (!targetUserId) return

  // Don't allow demoting yourself — would lock you out.
  if (targetUserId === adminId) {
    throw new Error('You cannot demote yourself.')
  }

  const admin = createAdminSupabaseClient()
  await admin.from('app_admins').delete().eq('user_id', targetUserId)

  await logModeration(adminId, targetUserId, 'demote_admin', null)
  revalidatePath('/admin/users')
}

export async function deleteUserAction(formData: FormData) {
  const adminId = await requireAdminUserId()
  const targetUserId = String(formData.get('userId') ?? '')
  if (!targetUserId) return

  if (targetUserId === adminId) {
    throw new Error('You cannot delete yourself.')
  }

  const admin = createAdminSupabaseClient()
  // Log first — after delete, the user_id won't have an FK target anymore,
  // but moderation_actions.target_id is plain text so it's still fine.
  await logModeration(adminId, targetUserId, 'delete_user', null)

  const { error } = await admin.auth.admin.deleteUser(targetUserId)
  if (error) throw new Error(`Delete failed: ${error.message}`)

  revalidatePath('/admin/users')
}
