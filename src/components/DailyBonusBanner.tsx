'use client'

import { useState, useEffect } from 'react'
import { Gift, X, TrendingUp } from 'lucide-react'
import { useWallet, DAILY_BONUS_PTS } from '@/hooks/useWallet'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'

const DISMISS_KEY = 'stickee:daily-banner-dismissed'

export function DailyBonusBanner() {
  const { canClaimDaily, claimDailyBonus, hydrated } = useWallet()
  const { toast } = useToast()
  const [visible, setVisible] = useState(false)
  const [claimed, setClaimed] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    // Show if bonus available and not dismissed today
    try {
      const today = new Date().toISOString().slice(0, 10)
      const dismissed = localStorage.getItem(DISMISS_KEY)
      if (canClaimDaily && dismissed !== today) setVisible(true)
    } catch { /* ignore */ }
  }, [hydrated, canClaimDaily])

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

  if (!visible || !hydrated) return null

  return (
    <div
      className="border-b border-border px-6 py-3"
      style={{ background: '#041008', borderColor: '#0e3020' }}
    >
      <div className="mx-auto max-w-5xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Gift className="h-4 w-4 shrink-0" style={{ color: '#2ec266' }} />
          {claimed ? (
            <p className="font-mono text-xs" style={{ color: '#2ec266' }}>
              ✓ +{DAILY_BONUS_PTS} pts claimed! Make a prediction to start earning more.
            </p>
          ) : (
            <p className="font-mono text-xs" style={{ color: '#2ec266' }}>
              Your daily bonus is ready —{' '}
              <span className="font-medium">+{DAILY_BONUS_PTS} free prediction points</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!claimed && (
            <>
              <button
                onClick={handleClaim}
                className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all"
                style={{ background: '#2ec266', color: '#041008' }}
              >
                Claim
              </button>
              <Link
                href="/predictions"
                className="hidden sm:flex items-center gap-1 font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors"
                style={{ borderColor: '#0e3020', color: '#2ec266' }}
              >
                <TrendingUp className="h-3 w-3" /> Markets
              </Link>
            </>
          )}
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
