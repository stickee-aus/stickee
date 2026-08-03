'use client'

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  X,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { signInWithGoogle } from '../sign-in/actions'
import {
  checkHandleAvailable,
  signUpWithPassword,
} from './actions'
import { initialSignUpState } from './types'

type Step = 0 | 1 | 2 | 3

const HANDLE_RE = /^[a-z0-9_]{3,20}$/

function suggestHandleFrom(input: string) {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20)
  return slug.length >= 3 ? slug : ''
}

function passwordStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(4, score)
}

const STRENGTH_LABEL = ['Too short', 'Weak', 'OK', 'Strong', 'Very strong']
const STRENGTH_COLOR = ['#3a3a3e', '#f04747', '#f5a623', '#2ec266', '#2ec266']

export default function SignUpStepper() {
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? searchParams.get('redirect') ?? ''
  const [state, formAction, pending] = useActionState(
    signUpWithPassword,
    initialSignUpState,
  )

  const [step, setStep] = useState<Step>(0)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [handle, setHandle] = useState('')
  const [handleTouched, setHandleTouched] = useState(false)

  const [availability, setAvailability] = useState<
    | { state: 'idle' | 'checking' }
    | { state: 'available'; handle: string }
    | { state: 'taken'; error: string }
  >({ state: 'idle' })

  const [, startCheck] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  // ── Suggest a handle from the user's name once we have one ─────────────
  useEffect(() => {
    if (!handleTouched && displayName) {
      setHandle(suggestHandleFrom(displayName))
    }
  }, [displayName, handleTouched])

  // ── Debounced handle availability lookup ───────────────────────────────
  useEffect(() => {
    if (step !== 3) return
    if (!handle) {
      setAvailability({ state: 'idle' })
      return
    }
    if (!HANDLE_RE.test(handle)) {
      setAvailability({
        state: 'taken',
        error: '3–20 chars · letters, numbers, underscore.',
      })
      return
    }
    setAvailability({ state: 'checking' })
    const t = setTimeout(() => {
      startCheck(async () => {
        const result = await checkHandleAvailable(handle)
        if (result.available) {
          setAvailability({ state: 'available', handle: result.handle })
        } else {
          setAvailability({
            state: 'taken',
            error: result.error ?? 'Username unavailable.',
          })
        }
      })
    }, 350)
    return () => clearTimeout(t)
  }, [handle, step])

  const strength = useMemo(() => passwordStrength(password), [password])

  // Reset to the first failing step if the server action returns an error.
  useEffect(() => {
    if (!state.error) return
    if (state.error.toLowerCase().includes('username')) setStep(3)
    else if (state.error.toLowerCase().includes('password')) setStep(2)
    else if (state.error.toLowerCase().includes('email')) setStep(1)
  }, [state.error])

  // ── Confirmation screen (only if Supabase email confirm is enabled) ────
  if (state.needsConfirmation) {
    return (
      <SignUpShell>
        <div className="space-y-6 text-center">
          <div className="mx-auto h-14 w-14 rounded-full flex items-center justify-center"
               style={{ background: '#041008', border: '1px solid #0e3020' }}>
            <CheckCircle2 className="h-7 w-7" style={{ color: '#2ec266' }} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Almost there.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We sent a verification email to{' '}
              <span className="text-foreground">{state.email}</span>.<br />
              Click the link in it to finish signing up.
            </p>
          </div>
          <Link
            href={`/auth/sign-in${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
            className="inline-block text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Already verified? Sign in →
          </Link>
        </div>
      </SignUpShell>
    )
  }

  const canAdvance =
    (step === 0 && displayName.trim().length >= 1) ||
    (step === 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
    (step === 2 && password.length >= 8) ||
    (step === 3 && availability.state === 'available')

  function next() {
    if (!canAdvance) return
    if (step < 3) setStep((s) => (s + 1) as Step)
  }

  function back() {
    if (step > 0) setStep((s) => (s - 1) as Step)
  }

  return (
    <SignUpShell>
      <ProgressBar step={step} />

      {/* Hidden form mirrors all four fields so the server action gets
          everything when we submit on the final step. */}
      <form ref={formRef} action={formAction} className="space-y-6">
        <input type="hidden" name="displayName" value={displayName} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="password" value={password} />
        <input type="hidden" name="handle" value={handle} />
        <input type="hidden" name="next" value={nextPath} />

        {step === 0 && (
          <Step
            title="What's your name?"
            subtitle="This is how you'll show up across Stickee. You can change it later."
          >
            <Field
              autoFocus
              type="text"
              placeholder="Your name"
              value={displayName}
              maxLength={50}
              onChange={setDisplayName}
              onEnter={next}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {displayName.length}/50
            </p>
          </Step>
        )}

        {step === 1 && (
          <Step
            title="Use your email"
            subtitle="We'll use this for sign-in and security alerts. No spam."
          >
            <Field
              autoFocus
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(v) => setEmail(v.trim())}
              onEnter={next}
            />
          </Step>
        )}

        {step === 2 && (
          <Step
            title="Create a password"
            subtitle="At least 8 characters. Mix in a number and a symbol for a stronger one."
          >
            <div className="relative">
              <Field
                autoFocus
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={setPassword}
                onEnter={next}
                paddingRight
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 grid grid-cols-4 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-1 rounded-full"
                    style={{
                      background: i < strength ? STRENGTH_COLOR[strength] : '#1e1e20',
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {STRENGTH_LABEL[strength]}
              </span>
            </div>
          </Step>
        )}

        {step === 3 && (
          <Step
            title="Pick a username"
            subtitle="This is your @ on Stickee. Letters, numbers and underscores only."
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Field
                autoFocus
                type="text"
                placeholder="username"
                value={handle}
                onChange={(v) => {
                  setHandleTouched(true)
                  setHandle(
                    v
                      .toLowerCase()
                      .replace(/^@/, '')
                      .replace(/[^a-z0-9_]/g, '')
                      .slice(0, 20),
                  )
                }}
                onEnter={() => {
                  if (canAdvance) formRef.current?.requestSubmit()
                }}
                paddingLeft
                paddingRight
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {availability.state === 'checking' && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {availability.state === 'available' && (
                  <Check className="h-4 w-4" style={{ color: '#2ec266' }} />
                )}
                {availability.state === 'taken' && (
                  <X className="h-4 w-4" style={{ color: '#f04747' }} />
                )}
              </span>
            </div>
            <p
              className="mt-2 text-xs"
              style={{
                color:
                  availability.state === 'available'
                    ? '#2ec266'
                    : availability.state === 'taken'
                    ? '#f04747'
                    : 'var(--muted-foreground)',
              }}
            >
              {availability.state === 'available' && `@${handle} is available.`}
              {availability.state === 'taken' && availability.error}
              {availability.state === 'checking' && 'Checking availability…'}
              {availability.state === 'idle' && '3–20 characters.'}
            </p>
          </Step>
        )}

        {state.error && (
          <div
            className="border px-4 py-3 text-xs leading-relaxed"
            style={{
              borderColor: '#3a1414',
              background: '#1e0a0a',
              color: '#f04747',
            }}
          >
            {state.error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          {step > 0 ? (
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : (
            <span />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              disabled={!canAdvance}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#e8e8e6', color: '#0a0a0b' }}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canAdvance || pending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#e8e8e6', color: '#0a0a0b' }}
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {/* Show OAuth + sign-in link only on step 0 — this is where new users
          land cold and might pick a different option. */}
      {step === 0 && (
        <div className="space-y-5 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              or
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={nextPath || '/onboarding'} />
            <button
              type="submit"
              className="w-full py-3 rounded-full text-sm border border-border bg-background text-foreground hover:bg-foreground hover:text-background transition-colors flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Sign up with Google
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href={`/auth/sign-in${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ''}`} className="text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      )}
    </SignUpShell>
  )
}

// ─── Layout primitives ────────────────────────────────────────────────────

function SignUpShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-2">
          <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
            Stickee · Civic Intelligence
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Join Stickee
          </h1>
        </div>
        {children}
      </div>
    </div>
  )
}

function ProgressBar({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-1 flex-1 rounded-full transition-colors"
          style={{ background: i <= step ? '#e8e8e6' : '#1e1e20' }}
        />
      ))}
    </div>
  )
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      </div>
      <div>{children}</div>
    </div>
  )
}

function Field({
  autoFocus,
  type,
  placeholder,
  value,
  maxLength,
  onChange,
  onEnter,
  paddingLeft,
  paddingRight,
}: {
  autoFocus?: boolean
  type: string
  placeholder: string
  value: string
  maxLength?: number
  onChange: (v: string) => void
  onEnter?: () => void
  paddingLeft?: boolean
  paddingRight?: boolean
}) {
  return (
    <input
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={autoFocus}
      type={type}
      value={value}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onEnter) {
          e.preventDefault()
          onEnter()
        }
      }}
      placeholder={placeholder}
      className={`w-full rounded-md border border-border bg-background py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors ${
        paddingLeft ? 'pl-8' : 'pl-4'
      } ${paddingRight ? 'pr-10' : 'pr-4'}`}
    />
  )
}
