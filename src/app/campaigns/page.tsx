import type { Metadata } from 'next'
import { PageShell } from '@/components/ui/page-shell'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/LinkButton'

export const metadata: Metadata = {
  title: 'Civic action — Stickee',
  description: 'Verified opportunities to participate in Australian civic life.',
}

export default function CampaignsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Australia · Civic action"
        title="Civic action"
        summary="Find actions with a real recipient, a clear purpose and an outcome Stickee can honestly confirm."
        metadata={{ source: 'No verified campaigns available', verification: 'unverified' }}
      />

      <div className="mt-8 space-y-5">
        <EmptyState
          variant="no-data"
          title="No verified campaigns are open."
          description="Example participant counts, deadlines and promised outcomes have been removed. Stickee will list an action only when its recipient, current stage and confirmation method are clear."
        />
        <LinkButton href="/issues" variant="outline" size="sm">
          Explore issues →
        </LinkButton>
      </div>
    </PageShell>
  )
}
