'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

// ─── Inner component (uses searchParams) ──────────────────────────────────────

function SignInInner() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') // referral tracking

  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback${ref ? `?ref=${ref}` : ''}` },
    })
    setSent(true)
    setLoading(false)
  }

  const BENEFITS = [
    'Track your personalised civic score (A–F grade)',
    'Compete on prediction markets — earn real points',
    'Build daily streaks by taking action on issues',
    'Email your MP directly from the app',
    'Get boosted in the Feed as your impact grows',
    ref ? '🎉 Earn 250 bonus points (referral bonus)' : 'Earn bonus points for referring friends',
  ]

  if (sent) {
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
              We sent a magic link to <span className="text-foreground">{email}</span>.
              Click it to sign in — no password needed.
            </p>
          </div>
          {ref && (
            <p className="font-mono text-[10px]" style={{ color: '#2ec266' }}>
              Your 250 referral bonus will be credited on first sign-in.
            </p>
          )}
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
            🎉 A friend referred you — you&apos;ll both earn <strong>250 bonus points</strong> on sign-up.
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

        {/* Sign in form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#e8e8e6', color: '#0a0a0b' }}
          >
            {loading ? 'Sending magic link…' : 'Send magic link →'}
          </button>
          <p className="font-mono text-[10px] text-muted-foreground text-center">
            No password needed · Magic link expires in 1 hour
          </p>
        </form>

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

// ─── Page ─────────────────────────────────────────────────────────────────────

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
