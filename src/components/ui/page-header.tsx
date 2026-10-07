import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { MetadataLine, type MetadataLineProps } from '@/components/ui/metadata-line'

export interface PageHeaderProps {
  eyebrow?: string
  title: string
  summary?: string
  metadata?: MetadataLineProps
  actions?: ReactNode
  metric?: { value: ReactNode; label: string }
  className?: string
}

/**
 * Canonical page header: eyebrow, serif title, one-line summary, source/
 * update metadata, optional actions and a headline metric. Every major
 * page should converge on this shape rather than a bespoke hero block.
 */
export function PageHeader({
  eyebrow,
  title,
  summary,
  metadata,
  actions,
  metric,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between',
        className
      )}
    >
      <div className="max-w-2xl">
        {eyebrow && <p className="text-micro-label mb-2">{eyebrow}</p>}
        <h1 className="text-page-title">{title}</h1>
        {summary && <p className="text-body-copy mt-2 text-muted-foreground">{summary}</p>}
        {metadata && (
          <div className="mt-4">
            <MetadataLine {...metadata} />
          </div>
        )}
      </div>

      {(metric || actions) && (
        <div className="flex shrink-0 items-end gap-6">
          {metric && (
            <div className="text-right">
              <div className="font-heading text-4xl font-semibold text-foreground">{metric.value}</div>
              <p className="text-micro-label mt-1">{metric.label}</p>
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
    </header>
  )
}
