'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { updatePassword } from './actions'
import { initialResetPasswordState } from './types'

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, initialResetPasswordState)

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <h1 className="font-mono text-2xl text-foreground">Set a new password</h1>
          <p className="font-mono text-xs text-muted-foreground">
            Choose a password with at least 8 characters.
          </p>
        </div>
        <form action={action} className="space-y-3">
          <input
            type="password"
            required
            name="password"
            placeholder="New password"
            minLength={8}
            className="w-full border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20 transition-colors"
          />
          <input
            type="password"
            required
            name="confirmPassword"
            placeholder="Confirm new password"
            minLength={8}
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
            {pending ? 'Saving…' : 'Update password →'}
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
