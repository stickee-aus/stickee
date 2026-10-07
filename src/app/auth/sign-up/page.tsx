import type { Metadata } from 'next'
import { Suspense } from 'react'
import SignUpStepper from './SignUpStepper'

export const metadata: Metadata = {
  title: 'Sign up — Stickee',
  description: 'Create your Stickee account in a few quick steps.',
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <span className="font-mono text-xs text-muted-foreground">Loading...</span>
      </div>
    }>
      <SignUpStepper />
    </Suspense>
  )
}
