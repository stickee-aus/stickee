import type { Metadata } from 'next'
import { PageShell } from '@/components/ui/page-shell'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = {
  title: 'Civic indicators — Stickee',
  description: 'Sourced indicators of Australian civic outcomes.',
}

export default function ImpactPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Australia · Civic indicators"
        title="Civic indicators"
        summary="How is Australia changing, and what evidence would show whether public policy is working?"
        metadata={{ source: 'No verified data available', verification: 'unverified' }}
      />

      <div className="mt-8">
        <EmptyState
          variant="no-data"
          title="Verified national indicators are being prepared."
          description="Stickee will publish this report card once every indicator has a current source, retrieval date and documented scoring method. Placeholder scores are not shown."
        />
      </div>
    </PageShell>
  )
}
