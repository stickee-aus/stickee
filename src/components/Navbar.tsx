'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AuthButton } from '@/components/AuthButton'
import { useNotifications } from '@/hooks/useNotifications'

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 50"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect x="0" y="0" width="28" height="22" rx="0" />
      <circle cx="14" cy="11" r="5" className="fill-background" />
      <rect x="11" y="22" width="6" height="16" />
      <rect x="17" y="26" width="5" height="3.5" rx="0" />
      <rect x="17" y="31.5" width="3.5" height="3" rx="0" />
      <path d="M11 38 Q11 46 14 49 Q17 46 17 38 Z" />
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/',             label: 'Overview' },
  { href: '/predictions',  label: 'Markets' },
  { href: '/issues',       label: 'Issues' },
  { href: '/leaders',      label: 'Leaders' },
  { href: '/campaigns',    label: 'Campaigns' },
  { href: '/feed',         label: 'Feed' },
]

const now = new Date()
const MONTH_LABEL = now.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }).toUpperCase()

export function Navbar() {
  const pathname = usePathname()
  const { unreadCount } = useNotifications()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 hover:opacity-70 transition-opacity"
        >
          <KeyIcon className="h-5 w-auto text-foreground" />
          <span
            className="font-mono text-sm font-medium tracking-widest uppercase text-foreground"
          >
            Stickee
          </span>
        </Link>

        {/* Primary nav */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'font-mono text-xs font-medium tracking-widest uppercase transition-colors',
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4 font-mono text-xs text-muted-foreground tracking-wider">
          <span className="hidden sm:inline">{MONTH_LABEL} &nbsp;|&nbsp; AU</span>

          {/* Notifications bell */}
          <Link
            href="/notifications"
            className="relative hover:text-foreground transition-colors"
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
