'use client'

import { cn } from '@/lib/utils'

export interface UnderlineTabItem {
  id: string
  label: string
}

export interface UnderlineTabsProps {
  items: UnderlineTabItem[]
  value: string
  onChange: (id: string) => void
  className?: string
}

/**
 * The one shared filter/tab pattern in the app. Underline only — never a
 * pill/segmented control with a sliding shadowed thumb.
 */
export function UnderlineTabs({ items, value, onChange, className }: UnderlineTabsProps) {
  return (
    <div role="tablist" className={cn('flex items-center gap-6 border-b border-border', className)}>
      {items.map(item => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'transition-calm relative -mb-px border-b-2 border-transparent pb-3 text-sm font-medium',
              active ? 'border-[var(--line-strong)] text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
