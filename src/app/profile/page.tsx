import type { Metadata } from 'next'
import { PageShell } from '@/components/ui/page-shell'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/LinkButton'

export const metadata: Metadata = {
  title: 'Your account — Stickee',
  description: 'Your verified Stickee account activity.',
}

export default function ProfilePage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Your account"
        title="Account activity"
        summary="Activity tied to your verified Stickee account."
        metadata={{ source: 'No verified account activity available', verification: 'unverified' }}
      />

      <div className="mt-8 space-y-5">
        <EmptyState
          variant="unavailable"
          title="Account activity is not available in this preview."
          description="Local streaks, badges, points and mock civic grades are not shown as account records."
        />
        <LinkButton href="/issues" variant="outline" size="sm">
          Explore issues →
        </LinkButton>
      </div>
    </PageShell>
  )
}
