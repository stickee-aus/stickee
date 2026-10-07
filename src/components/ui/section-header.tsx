import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/**
 * Canonical section heading used to introduce a group of ArticleCards or
 * RecordRows within a page — title, short explanation, optional link.
 */
export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4 border-b border-border pb-4', className)}>
      <div>
        <h2 className="text-section-title">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0 text-sm">{action}</div>}
    </div>
  )
}
