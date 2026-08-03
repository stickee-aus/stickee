import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Cached on `globalThis` (not a module-level `let`) so Fast Refresh reloading
// this module doesn't spawn a second GoTrueClient. Two instances would share
// the same auth-token lock name and steal it from each other mid-refresh,
// producing "Lock broken by another request with the 'steal' option" and
// cascading "Failed to fetch" errors.
declare global {
  // eslint-disable-next-line no-var
  var __supabaseBrowserClient: SupabaseClient<any, any, any> | undefined
}

export function createClient(): SupabaseClient<any, any, any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  if (globalThis.__supabaseBrowserClient) return globalThis.__supabaseBrowserClient

  const client = createBrowserClient(url, anonKey, {
    auth: {
      lockAcquireTimeout: 30000,
    },
  } as unknown as Parameters<typeof createBrowserClient>[2])

  globalThis.__supabaseBrowserClient = client
  return client
}
