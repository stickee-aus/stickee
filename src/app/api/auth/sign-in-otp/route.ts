import { createClient } from '@supabase/supabase-js'

interface SignInOtpBody {
  email?: string
  emailRedirectTo?: string
}

function createOtpClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Supabase auth is not configured on the server.')
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as SignInOtpBody
    const email = body.email?.trim() ?? ''
    const emailRedirectTo = body.emailRedirectTo?.trim() ?? ''

    if (!email || !isValidEmail(email)) {
      return Response.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    if (!emailRedirectTo) {
      return Response.json({ error: 'Missing email redirect target.' }, { status: 400 })
    }

    const supabase = createOtpClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    })

    if (error) {
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to send magic link.'
    return Response.json({ error: message }, { status: 500 })
  }
}
