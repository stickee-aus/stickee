'use server'

import 'server-only'

import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getTrustedSiteOrigin } from '@/lib/site-url'
import type { ForgotPasswordState } from './types'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function getRequestOrigin() {
  // Never trust the Origin / X-Forwarded-Host / Host headers here: they are
  // client-controlled. Use the configured site URL (see src/lib/site-url.ts).
  const headerStore = await headers()
  return getTrustedSiteOrigin(headerStore.get('host'))
}

export async function sendPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get('email') ?? '').trim()

  if (!email || !isValidEmail(email)) {
    return { email, error: 'Enter a valid email address.', sent: false }
  }

  const origin = await getRequestOrigin()
  if (!origin) {
    return { email, error: 'Unable to determine origin.', sent: false }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  })

  if (error) {
    return { email, error: error.message, sent: false }
  }

  return { email, error: null, sent: true }
}
