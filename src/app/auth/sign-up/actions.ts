'use server'

import 'server-only'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { getPostAuthRedirectPath, normalizeReturnPath } from '@/lib/admin-auth'
import type { SignUpState } from './types'

const HANDLE_RE = /^[a-z0-9_]{3,20}$/
const RESERVED = new Set([
  'admin', 'root', 'support', 'help', 'staff', 'system', 'about',
  'login', 'signup', 'signin', 'sign-in', 'sign-up', 'auth',
  'stickee', 'official', 'api', 'www', 'mail', 'me',
])

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function normalizeHandle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9_]/g, '')
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

/**
 * Cheap, non-blocking handle availability check used by the stepper between
 * steps. Returns `available: true` for handles that match the format and are
 * not currently taken in `user_profiles`. Reserved/disallowed names return
 * `available: false` with an explanatory error.
 */
export async function checkHandleAvailable(rawHandle: string): Promise<{
  handle: string
  available: boolean
  error: string | null
}> {
  const handle = normalizeHandle(rawHandle)

  if (!handle) {
    return { handle, available: false, error: 'Pick a username.' }
  }
  if (!HANDLE_RE.test(handle)) {
    return {
      handle,
      available: false,
      error: '3–20 characters · letters, numbers, underscore.',
    }
  }
  if (RESERVED.has(handle)) {
    return { handle, available: false, error: 'That username is reserved.' }
  }

  // Use the service-role client so we bypass RLS noise for an existence check.
  const admin = createAdminSupabaseClient()
  const { data, error } = await admin
    .from('user_profiles')
    .select('user_id')
    .eq('handle', handle)
    .maybeSingle()

  if (error) {
    return { handle, available: false, error: 'Could not verify availability.' }
  }
  if (data) {
    return { handle, available: false, error: 'Username already taken.' }
  }
  return { handle, available: true, error: null }
}

export async function signUpWithPassword(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const displayName = String(formData.get('displayName') ?? '').trim().slice(0, 50)
  const handle = normalizeHandle(String(formData.get('handle') ?? ''))
  const next = normalizeReturnPath(String(formData.get('next') ?? ''), '')

  // ── Validation ─────────────────────────────────────────────────────────
  if (!displayName) {
    return {
      email, displayName, handle,
      error: 'What should we call you?',
      needsConfirmation: false,
    }
  }
  if (!email || !isValidEmail(email)) {
    return {
      email, displayName, handle,
      error: 'Enter a valid email address.',
      needsConfirmation: false,
    }
  }
  if (!password || password.length < 8) {
    return {
      email, displayName, handle,
      error: 'Password must be at least 8 characters.',
      needsConfirmation: false,
    }
  }
  if (!HANDLE_RE.test(handle) || RESERVED.has(handle)) {
    return {
      email, displayName, handle,
      error: 'Pick a valid username — 3–20 chars, letters/numbers/underscore.',
      needsConfirmation: false,
    }
  }

  // ── Final uniqueness check (someone might have grabbed it mid-flow) ────
  const availability = await checkHandleAvailable(handle)
  if (!availability.available) {
    return {
      email, displayName, handle,
      error: availability.error ?? 'That username is no longer available.',
      needsConfirmation: false,
    }
  }

  const origin = await getRequestOrigin()
  if (!origin) {
    return {
      email, displayName, handle,
      error: 'Unable to determine origin.',
      needsConfirmation: false,
    }
  }

  // ── Create the account ─────────────────────────────────────────────────
  // We pass display_name + handle into raw_user_meta_data so the
  // handle_new_user() trigger uses them when creating the profile row.
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next || '/onboarding')}`,
      data: {
        display_name: displayName,
        full_name: displayName, // some providers expect this key
        handle,
      },
    },
  })

  if (error) {
    return { email, displayName, handle, error: error.message, needsConfirmation: false }
  }

  // If "Confirm email" is enabled in Supabase, the session will be null and
  // the user will need to click an email link before they can sign in.
  if (!data.session) {
    return { email, displayName, handle, error: null, needsConfirmation: true }
  }

  // Account created and session active.
  redirect(await getPostAuthRedirectPath(supabase, next || '/onboarding'))
}
