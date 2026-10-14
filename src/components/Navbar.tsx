'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthButton } from '@/components/AuthButton'
import { SeatChip } from '@/components/SeatChip'
import { useNotifications } from '@/hooks/useNotifications'
import { PRIMARY_NAV, SECONDARY_NAV, isPrimaryNavItemActive } from '@/lib/navigation'

export function Navbar() {
  const pathname = usePathname()
  const { unreadCount } = useNotifications()

  return (
    <header className="simple-nav sticky top-0 z-50">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 md:px-8">

        {/* Logo */}
        <Link
          href="/"
          className="simple-brand"
        >
          <span className="simple-brand-mark" aria-hidden="true">S</span>
          <span>stickee</span>
        </Link>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Primary navigation">
          {PRIMARY_NAV.map(item => {
            const active = isPrimaryNavItemActive(item, pathname)
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={[
                  'simple-nav-link',
                  active
                    ? 'is-active' : '',
                ].join(' ')}
              >
                {item.label}
              </Link>
            )
          })}

        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4 text-muted-foreground">
          <SeatChip />
          {SECONDARY_NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="simple-support-link hidden md:inline-flex"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/notifications"
            className="relative transition-colors hover:text-[#17231c]"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
              <path d="M8 1a5 5 0 00-5 5v2.586l-.707.707A1 1 0 003 11h10a1 1 0 00.707-1.707L13 8.586V6a5 5 0 00-5-5z" />
              <path d="M6.5 14a1.5 1.5 0 003 0H6.5z" />
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 h-3.5 w-3.5 flex items-center justify-center font-mono text-[8px] rounded-full"
                style={{ background: '#f04747', color: '#fff' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <AuthButton />
        </div>
      </div>
    </header>
  )
}
