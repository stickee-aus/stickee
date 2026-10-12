import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPostAuthRedirectPath, normalizeReturnPath } from '@/lib/admin-auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = normalizeReturnPath(searchParams.get('next') ?? '/', '/')
  let redirectPath = next

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
    redirectPath = await getPostAuthRedirectPath(supabase, next)
  }

  // Keep the browser on the host that received the session cookie. The
  // development server's internal request origin can differ from that host.
  return new NextResponse(null, { status: 303, headers: { Location: redirectPath } })
}
