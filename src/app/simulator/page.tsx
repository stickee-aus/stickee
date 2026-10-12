import type { Metadata } from 'next'
import { PageShell } from '@/components/ui/page-shell'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'

export const metadata: Metadata = {
  title: 'Scenario analysis — Stickee',
  description: 'Evidence-backed Australian public-policy scenario analysis.',
}

export default function SimulatorPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Australia · Scenario analysis"
        title="Scenario analysis"
        summary="Compare possible policy responses without presenting synthetic output as a real forecast."
        metadata={{ source: 'No verified model available', verification: 'unverified' }}
      />

      <div className="mt-8">
        <EmptyState
          variant="unavailable"
          title="The scenario model is not ready for public use."
          description="Stickee will restore this tool once its assumptions, input evidence, uncertainty and methodology can be inspected. Previous synthetic recommendations are not shown."
        />
      </div>
    </PageShell>
  )
}
