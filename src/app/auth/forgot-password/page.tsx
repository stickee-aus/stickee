'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { sendPasswordReset } from './actions'
import { initialForgotPasswordState } from './types'

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(sendPasswordReset, initialForgotPasswordState)

  if (state.sent) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div
            className="mx-auto h-14 w-14 flex items-center justify-center"
            style={{ background: '#041008', border: '1px solid #0e3020' }}
          >
            <CheckCircle2 className="h-7 w-7" style={{ color: '#2ec266' }} />
          </div>
          <h2 className="font-mono text-lg text-foreground">Check your email</h2>
          <p className="font-mono text-xs text-muted-foreground leading-relaxed">
            We sent a password reset link to <span className="text-foreground">{state.email}</span>.
          </p>
          <Link
            href="/auth/sign-in"
            className="inline-block font-mono text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <h1 className="font-mono text-2xl text-foreground">Reset password</h1>
          <p className="font-mono text-xs text-muted-foreground">
            Enter your email and we&apos;ll send you a link to reset it.
          </p>
        </div>
        <form action={action} className="space-y-3">
          <input
            type="email"
            required
            name="email"
            placeholder="your@email.com"
            defaultValue={state.email}
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20 transition-colors"
          />
          {state.error && (
            <div
              className="border px-4 py-3 font-mono text-[10px] leading-relaxed"
              style={{ borderColor: '#3a1414', background: '#1e0a0a', color: '#f04747' }}
            >
              {state.error}
            </div>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 font-mono text-[10px] tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#e8e8e6', color: '#0a0a0b' }}
          >
            {pending ? 'Sending…' : 'Send reset link →'}
          </button>
        </form>
        <div className="text-center">
          <Link
            href="/auth/sign-in"
            className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
