'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-5xl px-6 py-24">
      <div className="border border-border p-8">
        <p className="font-mono text-[10px] tracking-widest uppercase mb-4" style={{ color: '#f04747' }}>
          Error · Something went wrong
        </p>
        <h2
          className="font-mono font-normal text-foreground mb-3"
          style={{ fontSize: 'clamp(28px, 5vw, 40px)', letterSpacing: '-0.02em', lineHeight: 1 }}
        >
          Unexpected error
        </h2>
        <p className="font-mono text-xs text-muted-foreground mb-8 leading-relaxed">
          {error.message || 'An unexpected error occurred. Please try again or return to the overview.'}
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={reset}
            className="border px-5 py-2.5 font-mono text-[10px] uppercase tracking-widest transition-colors hover:opacity-70"
            style={{ borderColor: '#0e3020', color: '#2ec266' }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Overview
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 font-mono text-[9px] text-muted-foreground/40">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
