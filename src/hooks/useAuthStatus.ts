'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/supabase-config'

export interface AuthStatus {
  authenticated: boolean
  isAdmin: boolean
  email: string | null
  hydrated: boolean
}

const INITIAL_STATUS: AuthStatus = {
  authenticated: false,
  isAdmin: false,
  email: null,
  hydrated: false,
}

const configured = isSupabaseConfigured

export function useAuthStatus() {
  const pathname = usePathname()
  const [status, setStatus] = useState<AuthStatus>(INITIAL_STATUS)

  const loadStatus = useCallback(async () => {
    if (!configured) {
      setStatus({ ...INITIAL_STATUS, hydrated: true })
      return
    }

    try {
      const res = await fetch('/api/auth/status', {
        cache: 'no-store',
        credentials: 'same-origin',
      })
      if (!res.ok) throw new Error('Unable to load auth status.')
      const data = await res.json() as Omit<AuthStatus, 'hydrated'>
      setStatus({
        authenticated: Boolean(data.authenticated),
        isAdmin: Boolean(data.isAdmin),
        email: data.email ?? null,
        hydrated: true,
      })
    } catch {
      setStatus({ ...INITIAL_STATUS, hydrated: true })
    }
  }, [])

  useEffect(() => {
    if (!configured) {
      setStatus({ ...INITIAL_STATUS, hydrated: true })
      return
    }

    let cancelled = false
    const supabase = createClient()

    async function safeLoadStatus() {
      if (cancelled) return
      await loadStatus()
    }

    void safeLoadStatus()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void safeLoadStatus()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [loadStatus, pathname])

  return { ...status, refresh: loadStatus }
}
