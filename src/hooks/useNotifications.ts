'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType = 'streak' | 'prediction' | 'market' | 'score' | 'bonus' | 'campaign' | 'mp' | 'leaderboard'

export interface AppNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  href?: string
  read: boolean
  createdAt: string // ISO
}

interface NotificationRow {
  id: string
  type: NotificationType
  title: string
  body: string
  href: string | null
  read: boolean
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'stickee:notifications_v1'
const MAX_STORED  = 50
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const configured = !!(SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http'))

// ─── Helpers ─────────────────────────────────────────────────────────────────

function load(): AppNotification[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppNotification[]
  } catch { /* ignore */ }
  return []
}

function persist(notifications: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_STORED)))
  } catch { /* ignore */ }
}

function makeId() {
  return `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function mapNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    href: row.href ?? undefined,
    read: row.read,
    createdAt: row.created_at,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)

  const supabaseRef = useRef(configured ? createClient() : null)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!configured) {
      setNotifications(load())
      setHydrated(true)
      return
    }

    let cancelled = false
    const supabase = supabaseRef.current!
    let loading = false
    let reloadRequested = false

    async function loadRemote() {
      if (loading) {
        reloadRequested = true
        return
      }

      loading = true

      try {
        const { data: { session } } = await supabase.auth.getSession()
        userIdRef.current = session?.user?.id ?? null

        if (!userIdRef.current) {
          if (!cancelled) {
            setAuthenticated(false)
            setNotifications(load())
            setHydrated(true)
          }
          return
        }

        const { data } = await supabase
          .from('notifications')
          .select('id, type, title, body, href, read, created_at')
          .eq('user_id', userIdRef.current)
          .order('created_at', { ascending: false })
          .limit(MAX_STORED)
          .returns<NotificationRow[]>()

        if (!cancelled) {
          setAuthenticated(true)
          setNotifications(data?.map(mapNotification) ?? [])
          setHydrated(true)
        }
      } catch (error) {
        console.warn('Failed to load notifications:', error)
        if (!cancelled) {
          setAuthenticated(false)
          setNotifications(load())
          setHydrated(true)
        }
      } finally {
        loading = false
        if (reloadRequested && !cancelled) {
          reloadRequested = false
          void loadRemote()
        }
      }
    }

    // Filter to current user's rows so we don't receive other users' events.
    // Channel name includes userId to avoid stale subscriptions across sign-ins.
    function subscribeForUser(uid: string) {
      return supabase
        .channel(`notifications:${uid}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${uid}`,
          },
          () => { void loadRemote() }
        )
        .subscribe()
    }

    let channel: ReturnType<typeof subscribeForUser> | null = null

    // Initial load — subscribe to realtime only after we know the userId.
    void (async () => {
      await loadRemote()
      if (!cancelled && userIdRef.current) {
        channel = subscribeForUser(userIdRef.current)
      }
    })()

    const authSubscription = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        userIdRef.current = null
        setAuthenticated(false)
        setNotifications(load())
        return
      }
      void loadRemote()
    })

    return () => {
      cancelled = true
      authSubscription.data.subscription.unsubscribe()
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const push = useCallback((
    type: NotificationType,
    title: string,
    body: string,
    href?: string,
  ): void => {
    if (configured) {
      const supabase = supabaseRef.current!
      void supabase.auth.getSession().then(({ data }) => {
        if (!data.session?.user) return
        void supabase.from('notifications').insert({
          user_id: data.session.user.id,
          type,
          title,
          body,
          href: href ?? null,
        })
      })
      return
    }

    const notif: AppNotification = {
      id: makeId(),
      type,
      title,
      body,
      href,
      read: false,
      createdAt: new Date().toISOString(),
    }
    setNotifications(prev => {
      const next = [notif, ...prev].slice(0, MAX_STORED)
      persist(next)
      return next
    })
  }, [])

  const markRead = useCallback((id: string) => {
    if (configured && authenticated && userIdRef.current) {
      void supabaseRef.current!
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', userIdRef.current)
    }

    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n)
      persist(next)
      return next
    })
  }, [authenticated])

  const markAllRead = useCallback(() => {
    if (configured && authenticated && userIdRef.current) {
      void supabaseRef.current!
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userIdRef.current)
        .eq('read', false)
    }

    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }))
      persist(next)
      return next
    })
  }, [authenticated])

  const clearAll = useCallback(() => {
    persist([])
    setNotifications([])
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications],
  )

  return {
    notifications,
    unreadCount,
    hydrated,
    authenticated,
    push,
    markRead,
    markAllRead,
    clearAll,
  }
}
