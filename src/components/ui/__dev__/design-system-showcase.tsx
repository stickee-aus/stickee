import { Search } from 'lucide-react'
import { PageShell } from '@/components/ui/page-shell'
import { PageHeader } from '@/components/ui/page-header'
import { SectionHeader } from '@/components/ui/section-header'
import { ArticleCard } from '@/components/ui/article-card'
import { RecordRow } from '@/components/ui/record-row'
import { StatusLabel } from '@/components/ui/status-label'
import { MetadataLine } from '@/components/ui/metadata-line'
import { EvidenceBlock } from '@/components/ui/evidence-block'
import { UnderlineTabsDemo } from '@/components/ui/__dev__/underline-tabs-demo'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * Development-only fixture, not a routed page. Exercises every Phase 2
 * shared primitive with realistic (clearly non-published) copy so the
 * design-system regression tests have something concrete to check against.
 * Do not import this from a public route — it is a component fixture, not
 * a page, per DESIGN_SYSTEM_MIGRATION_ROADMAP.md's Phase 2 scope.
 */
export function DesignSystemShowcase() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Design system"
        title="Component showcase"
        summary="Internal fixture for the Civic Design System's shared primitives — not published to any route."
        metadata={{ source: 'Internal fixture', updatedDate: 'N/A', verification: 'demo' }}
        metric={{ value: '12', label: 'Primitives' }}
        actions={
          <>
            <Button variant="outline">Secondary</Button>
            <Button>Primary</Button>
          </>
        }
      />

      <div className="mt-10 space-y-10">
        <section>
          <SectionHeader title="Article cards" description="The canonical card pattern." />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ArticleCard
              category="Demo"
              title="Sample article headline"
              summary="A short, one-to-two line summary of the underlying claim, written like a dek."
              metadata={{ source: 'Fixture', publishedDate: '2026-08-01', verification: 'demo' }}
              action={<Button variant="link" size="sm">Read more</Button>}
            />
            <ArticleCard
              category="Demo"
              title="A second card, for spacing"
              summary="Confirms the grid and card padding read consistently side by side."
              metadata={{ source: 'Fixture', verification: 'demo' }}
            />
          </div>
        </section>

        <section>
          <SectionHeader title="Record rows" description="Dense list pattern for register-like content." />
          <div className="mt-4">
            <RecordRow label="Sample bill title" meta="House · In debate" status={<StatusLabel status="proposed" />} />
            <RecordRow label="Another record" meta="Senate · Resolved" value="62%" status={<StatusLabel status="passed" />} />
          </div>
        </section>

        <section>
          <SectionHeader title="Status labels" description="Every supported state." />
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusLabel status="active" />
            <StatusLabel status="proposed" />
            <StatusLabel status="passed" />
            <StatusLabel status="resolved" />
            <StatusLabel status="voided" />
            <StatusLabel status="unavailable" />
            <StatusLabel status="demo" />
          </div>
        </section>

        <section>
          <SectionHeader title="Metadata line" />
          <div className="mt-4">
            <MetadataLine
              source="Fixture"
              publishedDate="2026-08-01"
              retrievedDate="2026-08-05"
              verification="demo"
            />
          </div>
        </section>

        <section>
          <SectionHeader title="Underline tabs" />
          <div className="mt-4">
            <UnderlineTabsDemo />
          </div>
        </section>

        <section>
          <SectionHeader title="Evidence block" />
          <div className="mt-4 max-w-md">
            <EvidenceBlock
              source="Fixture data"
              methodology="Static showcase content, not a real claim."
              freshness="N/A"
              confidence="N/A"
              verificationStatus="demo"
            />
          </div>
        </section>

        <section>
          <SectionHeader title="Empty states" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <EmptyState variant="no-data" />
            <EmptyState variant="no-forecasts" icon={Search} />
          </div>
        </section>
      </div>
    </PageShell>
  )
}
