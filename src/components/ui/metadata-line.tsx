import { cn } from '@/lib/utils'

export type VerificationState = 'verified' | 'unverified' | 'demo' | 'forecast'

export interface MetadataLineProps {
  source?: string
  publishedDate?: string
  retrievedDate?: string
  updatedDate?: string
  verification?: VerificationState
  className?: string
}

const VERIFICATION_LABEL: Record<VerificationState, string> = {
  verified: 'Verified',
  unverified: 'Unverified',
  demo: 'Demo data',
  forecast: 'Forecast',
}

/**
 * Canonical byline format: SOURCE · PUBLISHED · RETRIEVED · UPDATED · VERIFICATION.
 * Every part is optional so a page only states what it actually has evidence for.
 */
export function MetadataLine({
  source,
  publishedDate,
  retrievedDate,
  updatedDate,
  verification,
  className,
}: MetadataLineProps) {
  const parts: string[] = []
  if (source) parts.push(source)
  if (publishedDate) parts.push(`Published ${publishedDate}`)
  if (retrievedDate) parts.push(`Retrieved ${retrievedDate}`)
  if (updatedDate) parts.push(`Updated ${updatedDate}`)
  if (verification) parts.push(VERIFICATION_LABEL[verification])

  if (parts.length === 0) return null

  return (
    <p className={cn('text-metadata', className)}>
      {parts.map((part, i) => (
        <span key={part}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          {part}
        </span>
      ))}
    </p>
  )
}
