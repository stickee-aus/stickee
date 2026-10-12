'use server'

import 'server-only'

import { headers } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { ForgotPasswordState } from './types'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function getRequestOrigin() {
  const headerStore = await headers()
  const origin = headerStore.get('origin')
  if (origin) return origin
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host')
  if (!host) return null
  const protocol =
    headerStore.get('x-forwarded-proto') ??
    (process.env.NODE_ENV === 'development' ? 'http' : 'https')
  return `${protocol}://${host}`
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
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  })

  if (error) {
    return { email, error: error.message, sent: false }
  }

  return { email, error: null, sent: true }
}
