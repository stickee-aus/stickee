'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, FileText, Users, Bell } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

const NAV_ITEMS = [
  { href: '/',               label: 'Home',     icon: Home },
  { href: '/predictions',    label: 'Markets',  icon: TrendingUp },
  { href: '/issues',         label: 'Issues',   icon: FileText },
  { href: '/leaders',        label: 'Leaders',  icon: Users },
  { href: '/notifications',  label: 'Alerts',   icon: Bell },
]

export function BottomNav() {
  const pathname = usePathname()
  const { unreadCount } = useNotifications()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          const isAlerts = href === '/notifications'
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-3 py-1 min-w-[48px] relative"
            >
              <div className="relative">
                <Icon
                  className="h-4.5 w-4.5"
                  style={{ color: active ? '#e8e8e6' : '#5a5a5e' }}
                />
                {isAlerts && unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 h-3 w-3 flex items-center justify-center font-mono text-[7px] rounded-full"
                    style={{ background: '#f04747', color: '#fff' }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span
                className="font-mono text-[9px] tracking-widest uppercase"
                style={{ color: active ? '#e8e8e6' : '#5a5a5e' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
