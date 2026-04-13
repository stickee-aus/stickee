'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, Trash2, TrendingUp, Flame, Star, Trophy, Megaphone, Users, Landmark } from 'lucide-react'
import { useNotifications, type NotificationType } from '@/hooks/useNotifications'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; label: string }> = {
  streak:      { icon: Flame,       color: '#f5a623', label: 'Streak' },
  prediction:  { icon: TrendingUp,  color: '#3b82f6', label: 'Prediction' },
  market:      { icon: TrendingUp,  color: '#a855f7', label: 'Market' },
  score:       { icon: Star,        color: '#f5a623', label: 'Score' },
  bonus:       { icon: Trophy,      color: '#2ec266', label: 'Bonus' },
  campaign:    { icon: Megaphone,   color: '#f04747', label: 'Campaign' },
  mp:          { icon: Landmark,    color: '#5a5a5e', label: 'MP' },
  leaderboard: { icon: Users,       color: '#f5a623', label: 'Leaderboard' },
}

// ─── Demo notifications seeded if empty ──────────────────────────────────────

type DemoNotif = { id: string; type: NotificationType; title: string; body: string; href: string; read: boolean; createdAt: string }

const DEMO_NOTIFICATIONS: DemoNotif[] = [
  {
    id: 'demo-1',
    type: 'bonus' as NotificationType,
    title: '🎉 Daily bonus claimed',
    body: '+100 pts added to your wallet. Come back tomorrow for another bonus.',
    href: '/predictions',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'demo-2',
    type: 'streak' as NotificationType,
    title: '🔥 7-day streak milestone!',
    body: "You've kept your civic streak going for 7 days. +250 bonus points awarded.",
    href: '/profile',
    read: false,
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'demo-3',
    type: 'market' as NotificationType,
    title: '⏰ Market closing in 24h',
    body: '"Will the Housing Bill pass?" resolves tomorrow. You have an open stake.',
    href: '/predictions',
    read: true,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
  {
    id: 'demo-4',
    type: 'leaderboard' as NotificationType,
    title: '↑ You moved up 3 spots',
    body: "You're now ranked #14 on the predictions leaderboard. Keep predicting to climb.",
    href: '/leaderboard',
    read: true,
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'demo-5',
    type: 'campaign' as NotificationType,
    title: '🏆 Housing campaign milestone',
    body: '10,000 Australians have emailed their MP on the housing bill. You were one of them.',
    href: '/campaigns',
    read: true,
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
  {
    id: 'demo-6',
    type: 'mp' as NotificationType,
    title: 'Your MP voted on the NDIS Bill',
    body: 'Anthony Albanese (Grayndler) voted YES on the NDIS Reform Bill.',
    href: '/leaders',
    read: true,
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
  },
]

// ─── Notification row ─────────────────────────────────────────────────────────

function NotifRow({
  notif,
  onRead,
}: {
  notif: typeof DEMO_NOTIFICATIONS[number]
  onRead: (id: string) => void
}) {
  const cfg = TYPE_CONFIG[notif.type]
  const Icon = cfg.icon

  const inner = (
    <div
      className={`flex items-start gap-3 px-4 py-4 border-b border-border transition-colors hover:bg-card/30 ${!notif.read ? 'bg-card/10' : ''}`}
      onClick={() => !notif.read && onRead(notif.id)}
    >
      {/* Unread dot */}
      <div className="relative shrink-0 mt-0.5">
        <div
          className="h-8 w-8 flex items-center justify-center"
          style={{ background: `${cfg.color}15` }}
        >
          <Icon className="h-4 w-4" style={{ color: cfg.color }} />
        </div>
        {!notif.read && (
          <span
            className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full"
            style={{ background: cfg.color }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notif.read ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
          {notif.title}
        </p>
        <p className="font-mono text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {notif.body}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/60">
            {relativeTime(notif.createdAt)}
          </span>
        </div>
      </div>
    </div>
  )

  if (notif.href) {
    return <Link href={notif.href}>{inner}</Link>
  }
  return <div>{inner}</div>
}

// ─── Notifications page ───────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications()

  // Seed demo notifications if empty
  const displayList: DemoNotif[] = notifications.length > 0
    ? notifications.map(n => ({ ...n, href: n.href ?? '' }))
    : DEMO_NOTIFICATIONS

  const unread = displayList.filter(n => !n.read).length

  return (
    <div className="mx-auto max-w-2xl px-6">

      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-6 py-10 border-b border-border">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Your Account · Activity
          </p>
          <div className="flex items-baseline gap-3">
            <span
              className="font-mono font-normal leading-none text-foreground"
              style={{ fontSize: 'clamp(40px, 8vw, 56px)', letterSpacing: '-0.02em' }}
            >
              {unread}
            </span>
            <span className="font-mono text-xl text-muted-foreground/40">unread</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-2">
            {displayList.length} total notifications
          </p>
        </div>

        <div className="flex items-center gap-2 pb-1">
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border border-border transition-colors hover:bg-card/50"
            >
              <CheckCheck className="h-3 w-3" /> Mark all read
            </button>
          )}
          {displayList.length > 0 && notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border border-border transition-colors hover:bg-card/50"
            >
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Notification list ── */}
      {displayList.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 flex items-center justify-center" style={{ background: '#1e1e20' }}>
            <Bell className="h-5 w-5" style={{ color: '#3a3a3e' }} />
          </div>
          <p className="font-mono text-xs text-muted-foreground">No notifications yet</p>
          <p className="font-mono text-[10px] text-muted-foreground/60 max-w-xs">
            Take actions — make predictions, email MPs, build streaks — and you&apos;ll get updates here.
          </p>
          <Link
            href="/predictions"
            className="font-mono text-[10px] tracking-widest uppercase px-4 py-2 mt-2"
            style={{ background: '#e8e8e6', color: '#0a0a0b' }}
          >
            Make a prediction →
          </Link>
        </div>
      ) : (
        <div className="mt-0">
          {displayList.map(notif => (
            <NotifRow
              key={notif.id}
              notif={notif}
              onRead={markRead}
            />
          ))}
        </div>
      )}

      {/* ── Footer ── */}
      <p className="font-mono text-[10px] text-muted-foreground text-center py-8">
        Notifications are stored locally · Clear anytime
      </p>
    </div>
  )
}
