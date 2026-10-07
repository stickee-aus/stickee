'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PRIMARY_NAV, isPrimaryNavItemActive } from '@/lib/navigation'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="simple-bottom-nav md:hidden fixed bottom-0 inset-x-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-3">
        {PRIMARY_NAV.map(item => {
          const active = isPrimaryNavItemActive(item, pathname)
          const color = active ? '#17231c' : '#7a817c'
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center gap-1 px-2 py-1 min-w-[44px] relative"
            >
              <div className="relative">
                <item.icon
                  className="h-4.5 w-4.5"
                  style={{ color }}
                />
              </div>
              <span
                className="text-[10px] font-semibold"
                style={{ color }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
