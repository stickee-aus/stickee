'use client'

import { useActionState, useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import {
  sendMagicLink,
  signInWithPassword,
  signInWithGoogle,
} from './actions'
import { initialSignInState, initialPasswordSignInState } from './types'

type Tab = 'magic' | 'password'

// ─── Inner component (uses searchParams) ──────────────────────────────────────

function SignInInner() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')
  const next = searchParams.get('next') ?? searchParams.get('redirect') ?? ''

  const [tab, setTab] = useState<Tab>('magic')
  const [email, setEmail] = useState('')

  const [magicState, magicAction, magicPending] = useActionState(
    sendMagicLink,
    initialSignInState
  )
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInWithPassword,
    initialPasswordSignInState
  )

  useEffect(() => {
    if (magicState.email) setEmail(magicState.email)
  }, [magicState.email])

  useEffect(() => {
    if (passwordState.email) setEmail(passwordState.email)
  }, [passwordState.email])

  const BENEFITS = [
    'Keep verified account activity together',
    'Participate in forecasts when a verified question is open',
    'Receive updates from issues you choose to follow',
  ]

  if (magicState.sent) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div
            className="mx-auto h-14 w-14 flex items-center justify-center"
            style={{ background: '#041008', border: '1px solid #0e3020' }}
          >
            <CheckCircle2 className="h-7 w-7" style={{ color: '#2ec266' }} />
          </div>
          <div className="space-y-2">
            <h2 className="font-mono text-lg text-foreground">Check your email</h2>
            <p className="font-mono text-xs text-muted-foreground leading-relaxed">
              We sent a magic link to <span className="text-foreground">{magicState.email}</span>.
              Click it to sign in — no password needed.
            </p>
          </div>
          <Link
            href="/"
            className="inline-block font-mono text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to overview
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="space-y-2">
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Australia · Civic Intelligence
          </p>
          <h1
            className="font-mono font-normal text-foreground leading-tight"
            style={{ fontSize: 'clamp(28px, 6vw, 40px)', letterSpacing: '-0.02em' }}
          >
            Sign in to Stickee
          </h1>
          <p className="font-mono text-xs text-muted-foreground">
            Your civic identity. Your impact. Your voice.
          </p>
        </div>

        {/* Referral callout */}
        {ref && (
          <div
            className="border px-4 py-3 font-mono text-xs"
            style={{ borderColor: '#0e3020', background: '#041008', color: '#2ec266' }}
          >
            A friend referred you to Stickee.
          </div>
        )}

        {/* Benefits */}
        <ul className="space-y-2">
          {BENEFITS.map(b => (
            <li key={b} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: '#2ec266' }} />
              <span className="font-mono text-xs text-muted-foreground">{b}</span>
            </li>
          ))}
        </ul>

        {/* Google OAuth */}
        <form action={signInWithGoogle}>
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="w-full py-3 font-mono text-[10px] tracking-widest uppercase border border-border bg-background text-foreground hover:bg-foreground hover:text-background transition-colors flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Tabs */}
        <div className="flex border border-border">
          <button
            type="button"
            onClick={() => setTab('magic')}
            className={`flex-1 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors ${
              tab === 'magic' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Magic link
          </button>
          <button
            type="button"
            onClick={() => setTab('password')}
            className={`flex-1 py-2 font-mono text-[10px] tracking-widest uppercase transition-colors ${
              tab === 'password' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Password
          </button>
        </div>

        {/* Magic link form */}
        {tab === 'magic' && (
          <form action={magicAction} className="space-y-3">
            <input
              type="email"
              required
              name="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20 transition-colors"
            />
            <input type="hidden" name="ref" value={ref ?? ''} />
            <input type="hidden" name="next" value={next} />
            {magicState.error && (
              <div
                className="border px-4 py-3 font-mono text-[10px] leading-relaxed"
                style={{ borderColor: '#3a1414', background: '#1e0a0a', color: '#f04747' }}
              >
                {magicState.error}
              </div>
            )}
            <button
              type="submit"
              disabled={magicPending}
              className="w-full py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#e8e8e6', color: '#0a0a0b' }}
            >
              {magicPending ? 'Sending magic link…' : 'Send magic link →'}
            </button>
            <p className="font-mono text-[10px] text-muted-foreground text-center">
              No password needed · Magic link expires in 1 hour
            </p>
          </form>
        )}

        {/* Password form */}
        {tab === 'password' && (
          <form action={passwordAction} className="space-y-3">
            <input
              type="email"
              required
              name="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20 transition-colors"
            />
            <input
              type="password"
              required
              name="password"
              placeholder="Password"
              minLength={6}
              className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20 transition-colors"
            />
            <input type="hidden" name="next" value={next} />
            {passwordState.error && (
              <div
                className="border px-4 py-3 font-mono text-[10px] leading-relaxed"
                style={{ borderColor: '#3a1414', background: '#1e0a0a', color: '#f04747' }}
              >
                {passwordState.error}
              </div>
            )}
            <button
              type="submit"
              disabled={passwordPending}
              className="w-full py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#e8e8e6', color: '#0a0a0b' }}
            >
              {passwordPending ? 'Signing in…' : 'Sign in →'}
            </button>
            <div className="flex items-center justify-between font-mono text-[10px] tracking-wider uppercase">
              <Link href="/auth/forgot-password" className="text-muted-foreground hover:text-foreground transition-colors">
                Forgot password?
              </Link>
              <Link href={`/auth/sign-up${next ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-muted-foreground hover:text-foreground transition-colors">
                Create account →
              </Link>
            </div>
          </form>
        )}

        {/* Back */}
        <div className="text-center">
          <Link
            href="/"
            className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Continue without signing in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <span className="font-mono text-xs text-muted-foreground">Loading…</span>
      </div>
    }>
      <SignInInner />
    </Suspense>
  )
}
