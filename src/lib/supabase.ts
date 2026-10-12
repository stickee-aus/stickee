import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '@/lib/supabase-config'

// Database types have not been generated yet; the client is intentionally
// schema-agnostic until a canonical generated Database type is introduced.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BrowserClient = SupabaseClient<any, any, any>

// Cached on `globalThis` (not a module-level `let`) so Fast Refresh reloading
// this module doesn't spawn duplicate auth refresh and subscription work.
declare global {
  var __supabaseBrowserClient: BrowserClient | undefined
}

export function createClient(): BrowserClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!isSupabaseConfigured || !url || !anonKey) {
    throw new Error('Supabase auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  if (globalThis.__supabaseBrowserClient) return globalThis.__supabaseBrowserClient

  // supabase-js 2.107+ coordinates refreshes without navigator locks by
  // default. Do not opt back into its deprecated legacy lock path here.
  const client = createBrowserClient(url, anonKey)

  globalThis.__supabaseBrowserClient = client
  return client
}
