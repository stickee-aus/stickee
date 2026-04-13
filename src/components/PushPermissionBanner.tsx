'use client'

import { useState, useEffect } from 'react'
import { Bell, X, BellOff } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useToast } from '@/components/ui/toast'

const DISMISS_KEY = 'stickee:push-banner-dismissed'

export function PushPermissionBanner() {
  const { permission, isSubscribed, isLoading, requestPermission, sendTestNotification } = usePushNotifications()
  const { toast } = useToast()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Show banner only if:
    // - Permission not yet decided (default)
    // - Not already subscribed
    // - User hasn't dismissed before
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (permission === 'default' && !isSubscribed && !dismissed) {
      // Delay 5s so it doesn't immediately compete with onboarding
      const t = setTimeout(() => setVisible(true), 5000)
      return () => clearTimeout(t)
    }
  }, [permission, isSubscribed])

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
    setVisible(false)
  }

  async function handleEnable() {
    const granted = await requestPermission()
    if (granted) {
      toast('Push notifications enabled! We\'ll alert you about your MP and predictions.', 'success')
      // Send a welcome push notification
      await sendTestNotification(
        '🔔 Stickee notifications active',
        'You\'ll now get alerts about your MP, prediction markets, and streak reminders.',
        '/notifications'
      )
      setVisible(false)
    } else {
      toast('Notifications blocked — you can enable them in browser settings.', 'info')
      dismiss()
    }
  }

  if (!visible || isSubscribed || permission === 'denied' || permission === 'unsupported') {
    return null
  }

  return (
    <div
      className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm mx-4 border border-border shadow-2xl"
      style={{ background: '#0a0a0b' }}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className="h-9 w-9 flex items-center justify-center shrink-0"
          style={{ background: '#1e1e20' }}
        >
          <Bell className="h-4 w-4" style={{ color: '#2ec266' }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs font-medium text-foreground">
            Stay in the loop
          </p>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
            Get push alerts when your MP votes, predictions resolve, or your streak is at risk.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all disabled:opacity-50"
              style={{ background: '#2ec266', color: '#041008' }}
            >
              {isLoading ? (
                <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Bell className="h-3 w-3" />
              )}
              Enable alerts
            </button>
            <button
              onClick={dismiss}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <BellOff className="h-3 w-3" /> Not now
            </button>
          </div>
        </div>

        <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
