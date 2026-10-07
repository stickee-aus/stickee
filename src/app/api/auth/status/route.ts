import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { isAppAdmin } from '@/lib/admin-auth'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  return NextResponse.json({
    authenticated: Boolean(user),
    isAdmin: await isAppAdmin(user),
    email: user?.email ?? null,
  })
}
