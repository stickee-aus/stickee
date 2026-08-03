'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Landmark, Users, Sparkles } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',            label: 'Home',    icon: Home },
  { href: '/issues', label: 'Issues', icon: FileText },
  { href: '/decisions', label: 'Decisions', icon: Landmark },
  { href: '/leaders', label: 'People', icon: Users },
  { href: '/simulator', label: 'Test', icon: Sparkles, accent: true },
]

export function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav
      className="simple-bottom-nav md:hidden fixed bottom-0 inset-x-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => {
          const active = isActive(href)
          const color = accent ? '#d85f36' : active ? '#17231c' : '#7a817c'
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-2 py-1 min-w-[44px] relative"
            >
              <div className="relative">
                <Icon
                  className="h-4.5 w-4.5"
                  style={{ color }}
                />
              </div>
              <span
                className="text-[10px] font-semibold"
                style={{ color }}
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
