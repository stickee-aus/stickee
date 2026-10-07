import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { MetadataLine, type MetadataLineProps } from '@/components/ui/metadata-line'

export interface ArticleCardProps {
  category?: string
  title: string
  summary?: string
  metadata?: MetadataLineProps
  action?: ReactNode
  href?: string
  className?: string
}

/**
 * The canonical "article" card: category → serif headline → summary →
 * byline metadata → an optional, visually de-emphasised action. Reads
 * top-to-bottom like a clipping, not a dashboard tile.
 */
export function ArticleCard({ category, title, summary, metadata, action, href, className }: ArticleCardProps) {
  const content = (
    <div
      className={cn(
        'transition-calm flex h-full flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-6 hover:border-[var(--line-strong)]',
        className
      )}
    >
      {category && <p className="text-micro-label">{category}</p>}
      <h3 className="text-card-title">{title}</h3>
      {summary && <p className="text-body-copy text-muted-foreground line-clamp-3">{summary}</p>}
      <div className="mt-auto flex items-end justify-between gap-3 pt-2">
        {metadata ? <MetadataLine {...metadata} /> : <span />}
        {action}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    )
  }

  return content
}
