'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/supabase-config'

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
const configured = isSupabaseConfigured

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
  const [error, setError] = useState(false)

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
    const channelInstanceId = crypto.randomUUID()
    let channelUserId: string | null = null

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
            setError(false)
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
          setError(false)
          setHydrated(true)
        }
      } catch (err) {
        console.warn('Failed to load notifications:', err)
        if (!cancelled) {
          setError(true)
          setNotifications([])
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
        // A hook instance can mount before the previous instance's async
        // channel removal completes (notably in React Strict Mode). A unique
        // topic avoids asking Realtime to mutate an already-subscribed channel.
        .channel(`notifications:${uid}:${channelInstanceId}`)
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

    async function replaceChannel(uid: string | null) {
      if (channel && channelUserId === uid) return

      if (channel) {
        const previousChannel = channel
        channel = null
        channelUserId = null
        await supabase.removeChannel(previousChannel)
      }

      if (!cancelled && uid) {
        channel = subscribeForUser(uid)
        channelUserId = uid
      }
    }

    // Initial load — subscribe to realtime only after we know the userId.
    void (async () => {
      await loadRemote()
      await replaceChannel(userIdRef.current)
    })()

    const authSubscription = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        userIdRef.current = null
        setAuthenticated(false)
        setNotifications(load())
        void replaceChannel(null)
        return
      }
      void (async () => {
        await loadRemote()
        await replaceChannel(userIdRef.current)
      })()
    })

    return () => {
      cancelled = true
      authSubscription.data.subscription.unsubscribe()
      if (channel) void supabase.removeChannel(channel)
    }
  }, [])

  const push = useCallback((
    type: NotificationType,
    title: string,
    body: string,
    href?: string,
  ): void => {
    // Client-generated feedback is local-only. Persisted account notifications
    // are trusted server/agent output and cannot be forged by a browser.
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
    error,
    push,
    markRead,
    markAllRead,
    clearAll,
  }
}
