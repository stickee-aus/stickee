'use server'

import 'server-only'

import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { requireAdminUserId } from '../_lib/guard'

/**
 * Resolves a market yes/no/void. All authorization, idempotency, and the
 * actual settlement math live in the resolve_market() SQL function
 * (migration 017) — this action is just a thin, admin-gated wrapper that
 * calls it and re-renders the page. requireAdminUserId() here is a second,
 * redundant check on top of resolve_market()'s own is_app_admin() check —
 * deliberately so: a non-admin should never even reach the RPC call.
 */
export async function resolveMarketAction(formData: FormData) {
  await requireAdminUserId()

  const issueId = String(formData.get('issueId') ?? '')
  const outcome = String(formData.get('outcome') ?? '')
  const resolutionSource = String(formData.get('resolutionSource') ?? '').trim().slice(0, 500)

  if (!issueId) throw new Error('Missing market id.')
  if (!['yes', 'no', 'void'].includes(outcome)) throw new Error('Invalid outcome.')
  if (!resolutionSource) throw new Error('A resolution source is required (what evidence supports this outcome?).')

  const admin = createAdminSupabaseClient()
  const { error } = await admin.rpc('resolve_market', {
    p_issue_id: issueId,
    p_outcome: outcome,
    p_resolution_source: resolutionSource,
  })

  if (error) throw new Error(`Resolution failed: ${error.message}`)

  revalidatePath('/admin/markets')
}
