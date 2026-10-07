import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface RecordRowProps {
  label: string
  /** One-line plain-English description, rendered in body copy — not metadata styling. */
  summary?: string
  meta?: string
  value?: ReactNode
  status?: ReactNode
  href?: string
  className?: string
}

/**
 * Dense, database-like list row for issues/decisions/MPs/forecasts/bills —
 * readable density without turning into a dashboard card grid. Prefer this
 * over ArticleCard wherever a list is really a register, not a set of
 * distinct stories.
 */
export function RecordRow({ label, summary, meta, value, status, href, className }: RecordRowProps) {
  const content = (
    <div
      className={cn(
        'transition-calm flex items-center justify-between gap-4 border-b border-border py-3 hover:bg-muted/60',
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-body-copy truncate font-medium text-foreground">{label}</p>
        {summary && <p className="text-body-copy mt-0.5 line-clamp-2 text-muted-foreground">{summary}</p>}
        {meta && <p className="text-metadata mt-0.5 normal-case tracking-normal">{meta}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {value && <span className="font-mono text-sm text-foreground">{value}</span>}
        {status}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}
