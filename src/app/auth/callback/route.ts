import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPostAuthRedirectPath, normalizeReturnPath } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'
import { getTrustedSiteOrigin } from '@/lib/site-url'

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url)
  // Redirect only to the configured site origin; fall back to the request
  // URL's own origin when none is configured (local development).
  const origin = getTrustedSiteOrigin(new URL(request.url).host) ?? requestOrigin
  const code = searchParams.get('code')
  const next = normalizeReturnPath(searchParams.get('next') ?? '/', '/')
  let redirectPath = next

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
    redirectPath = await getPostAuthRedirectPath(supabase, next)
  }

  return NextResponse.redirect(`${origin}${redirectPath}`)
}
