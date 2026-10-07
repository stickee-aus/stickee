import { createClient } from '@supabase/supabase-js'

/**
 * Service-role client for server-side writes (sync routes only).
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createAdminSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
