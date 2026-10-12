'use server'

import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPostAuthRedirectPath, normalizeReturnPath } from '@/lib/admin-auth'
import type { SignInState, PasswordSignInState } from './types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function getRequestedPath(formData: FormData) {
  return normalizeReturnPath(
    String(formData.get('next') ?? formData.get('redirect') ?? ''),
    ''
  )
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

// ─── Magic link ──────────────────────────────────────────────────────────────

export async function sendMagicLink(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get('email') ?? '').trim()
  const ref = String(formData.get('ref') ?? '').trim()
  const next = getRequestedPath(formData)

  if (!email || !isValidEmail(email)) {
    return { email, error: 'Enter a valid email address.', sent: false }
  }

  try {
    const origin = await getRequestOrigin()
    if (!origin) {
      return { email, error: 'Unable to determine the sign-in origin.', sent: false }
    }

    const callbackUrl = new URL('/auth/callback', origin)
    if (ref) callbackUrl.searchParams.set('ref', ref)
    if (next) callbackUrl.searchParams.set('next', next)

    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl.toString() },
    })

    if (error) return { email, error: error.message, sent: false }

    return { email, error: null, sent: true }
  } catch (error) {
    return {
      email,
      error: error instanceof Error ? error.message : 'Unable to send magic link.',
      sent: false,
    }
  }
}

// ─── Password sign-in ────────────────────────────────────────────────────────

export async function signInWithPassword(
  _prevState: PasswordSignInState,
  formData: FormData
): Promise<PasswordSignInState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = getRequestedPath(formData)

  if (!email || !isValidEmail(email)) {
    return { email, error: 'Enter a valid email address.' }
  }
  if (!password || password.length < 6) {
    return { email, error: 'Password must be at least 6 characters.' }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { email, error: error.message }
  }

  redirect(await getPostAuthRedirectPath(supabase, next))
}

// ─── Google OAuth ────────────────────────────────────────────────────────────

export async function signInWithGoogle(formData?: FormData) {
  const origin = await getRequestOrigin()
  if (!origin) throw new Error('Unable to determine origin for OAuth redirect.')

  const next = formData ? getRequestedPath(formData) : ''
  const callbackUrl = new URL('/auth/callback', origin)
  if (next) callbackUrl.searchParams.set('next', next)

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
    },
  })

  if (error) throw new Error(error.message)
  if (!data?.url) throw new Error('Supabase did not return an OAuth URL.')

  redirect(data.url)
}

// ─── Sign out ────────────────────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/')
}
