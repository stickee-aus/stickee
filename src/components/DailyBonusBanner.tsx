'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Gift, X, TrendingUp } from 'lucide-react'
import { useWallet, DAILY_BONUS_PTS } from '@/hooks/useWallet'
import { usePredictionWallet } from '@/hooks/usePredictionWallet'
import { useToast } from '@/components/ui/toast'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/supabase-config'
import Link from 'next/link'

const DISMISS_KEY = 'stickee:daily-banner-dismissed'

// Hidden on routes that show the real (Supabase-backed) wallet balance —
// this banner's points are a separate, localStorage-only balance, and
// showing both in the same journey would present two different numbers
// as if they were one account. See PAGE_REFACTOR_BATCH_1_REPORT.md.
const HIDDEN_ON_PREFIXES = ['/predictions']

export function DailyBonusBanner() {
  const pathname = usePathname()
  const { canClaimDaily, claimDailyBonus, hydrated } = useWallet()
  // The claim itself writes to the localStorage wallet above, not a real
  // account — so a signed-out visitor has nothing genuine to claim. Gate
  // the claimable state on real Supabase auth and show a sign-in prompt
  // instead, rather than letting anyone "claim" a bonus with no account.
  const { authenticated, hydrated: authHydrated } = usePredictionWallet()
  const { toast } = useToast()
  const [visible, setVisible] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const hiddenHere = HIDDEN_ON_PREFIXES.some(prefix => pathname?.startsWith(prefix))

  useEffect(() => {
    if (!isSupabaseConfigured) return
    if (!hydrated || !authHydrated) return
    try {
      const today = new Date().toISOString().slice(0, 10)
      const dismissed = localStorage.getItem(DISMISS_KEY)
      if (dismissed === today) return
      if (!authenticated) { setVisible(true); return }
      if (canClaimDaily) setVisible(true)
    } catch { /* ignore */ }
  }, [hydrated, authHydrated, authenticated, canClaimDaily])

  function handleClaim() {
    const pts = claimDailyBonus()
    if (pts > 0) {
      setClaimed(true)
      toast(`+${pts} daily bonus claimed! Come back tomorrow for more.`, 'success')
      setTimeout(() => setVisible(false), 3000)
    }
  }

  function handleDismiss() {
    try {
      const today = new Date().toISOString().slice(0, 10)
      localStorage.setItem(DISMISS_KEY, today)
    } catch { /* ignore */ }
    setVisible(false)
  }

  if (!isSupabaseConfigured || !visible || !hydrated || !authHydrated || hiddenHere) return null

  return (
    <div className="border-b border-border bg-card px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Gift className="h-4 w-4 shrink-0 text-[var(--civic-accent)]" />
          {!authenticated ? (
            <p className="text-metadata normal-case tracking-normal text-foreground">
              Sign in to claim your daily forecasting bonus —{' '}
              <span className="font-medium">+{DAILY_BONUS_PTS} free forecast points</span>
            </p>
          ) : claimed ? (
            <p className="text-metadata normal-case tracking-normal text-foreground">
              ✓ +{DAILY_BONUS_PTS} pts claimed! Make a forecast to start earning more.
            </p>
          ) : (
            <p className="text-metadata normal-case tracking-normal text-foreground">
              Your daily bonus is ready —{' '}
              <span className="font-medium">+{DAILY_BONUS_PTS} free forecast points</span>
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!authenticated ? (
            <Link href="/auth/sign-in" className={cn(buttonVariants({ size: 'sm' }))}>
              Sign in
            </Link>
          ) : !claimed && (
            <>
              <button onClick={handleClaim} className={cn(buttonVariants({ size: 'sm' }))}>
                Claim
              </button>
              <Link
                href="/predictions"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'hidden items-center gap-1 sm:inline-flex')}
              >
                <TrendingUp className="h-3 w-3" /> Forecasts
              </Link>
            </>
          )}
          <button
            onClick={handleDismiss}
            className="transition-calm text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
