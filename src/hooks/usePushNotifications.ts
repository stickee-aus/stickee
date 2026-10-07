'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export interface PushState {
  permission: PushPermission
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
}

// ─── VAPID public key (replace with your real key from Supabase/web-push) ─────
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const arr = Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
  return arr.buffer as ArrayBuffer
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    permission: 'default',
    isSubscribed: false,
    isLoading: false,
    error: null,
  })

  // Check current permission + subscription state on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState(s => ({ ...s, permission: 'unsupported' }))
      return
    }

    setState(s => ({ ...s, permission: Notification.permission as PushPermission }))

    // Register service worker
    navigator.serviceWorker.register('/sw.js').catch(() => { /* fail silently */ })

    // Check if already subscribed
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => {
        if (sub) setState(s => ({ ...s, isSubscribed: true }))
      })
    ).catch(() => { /* ignore */ })
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return false

    setState(s => ({ ...s, isLoading: true, error: null }))

    try {
      const permission = await Notification.requestPermission()
      setState(s => ({ ...s, permission: permission as PushPermission }))

      if (permission !== 'granted') {
        setState(s => ({ ...s, isLoading: false }))
        return false
      }

      // Get service worker registration
      const reg = await navigator.serviceWorker.ready

      // Subscribe to push (only if VAPID key configured)
      if (VAPID_PUBLIC_KEY) {
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        // In production: save subscription to Supabase
        // const supabase = createClient()
        // await supabase.from('push_subscriptions').upsert({ ... subscription.toJSON() ... })
        console.log('[Stickee] Push subscription created:', subscription.endpoint.slice(0, 40) + '…')
      }

      setState(s => ({ ...s, isSubscribed: true, isLoading: false }))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable notifications'
      setState(s => ({ ...s, isLoading: false, error: message }))
      return false
    }
  }, [])

  const unsubscribe = useCallback(async (): Promise<void> => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        // In production: remove from Supabase
      }
      setState(s => ({ ...s, isSubscribed: false }))
    } catch { /* ignore */ }
  }, [])

  /** Send a test notification (dev only) */
  const sendTestNotification = useCallback(async (title: string, body: string, url = '/notifications') => {
    if (!('serviceWorker' in navigator)) return
    const reg = await navigator.serviceWorker.ready
    await reg.showNotification(title, {
      body,
      icon: '/favicon.ico',
      data: { url },
    })
  }, [])

  return { ...state, requestPermission, unsubscribe, sendTestNotification }
}
