'use client'

import { useState, useEffect, useCallback } from 'react'

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

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'stickee:notifications_v1'
const MAX_STORED  = 50

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setNotifications(load())
    setHydrated(true)
  }, [])

  const push = useCallback((
    type: NotificationType,
    title: string,
    body: string,
    href?: string,
  ): void => {
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
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n)
      persist(next)
      return next
    })
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }))
      persist(next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    persist([])
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    hydrated,
    push,
    markRead,
    markAllRead,
    clearAll,
  }
}
