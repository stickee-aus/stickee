import { cn } from '@/lib/utils'
import { StatusLabel, type Status } from '@/components/ui/status-label'

export interface EvidenceBlockProps {
  source?: string
  methodology?: string
  freshness?: string
  confidence?: string
  verificationStatus?: Status
  className?: string
}

/**
 * Compact, honest disclosure of where a claim/number came from — pairs with
 * AGENTS.md's rule that no probability, score, or grade appears without a
 * source/methodology line nearby.
 */
export function EvidenceBlock({
  source,
  methodology,
  freshness,
  confidence,
  verificationStatus,
  className,
}: EvidenceBlockProps) {
  const rows: { label: string; value: string }[] = []
  if (source) rows.push({ label: 'Source', value: source })
  if (methodology) rows.push({ label: 'Methodology', value: methodology })
  if (freshness) rows.push({ label: 'Freshness', value: freshness })
  if (confidence) rows.push({ label: 'Confidence', value: confidence })

  return (
    <div
      className={cn(
        'rounded-[var(--radius)] border border-border bg-card p-4 text-sm',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-micro-label">Evidence</p>
        {verificationStatus && <StatusLabel status={verificationStatus} />}
      </div>
      <dl className="space-y-1.5">
        {rows.map(row => (
          <div key={row.label} className="flex gap-2">
            <dt className="text-metadata shrink-0 normal-case tracking-normal">{row.label}:</dt>
            <dd className="text-body-copy text-muted-foreground">{row.value}</dd>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-body-copy text-muted-foreground">No verified data available.</p>
        )}
      </dl>
    </div>
  )
}
