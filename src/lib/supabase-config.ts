const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Public Supabase capability flag shared by browser and server code.
 *
 * `NEXT_PUBLIC_SUPABASE_DISABLED=true` is intended for local/demo environments
 * whose saved project is unavailable. It prevents background auth retries while
 * retaining the configured credentials for later recovery.
 */
export const isSupabaseConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_DISABLED !== 'true' &&
  Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'))
