import { ArrowRight } from 'lucide-react'
import { PageShell } from '@/components/ui/page-shell'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { LinkButton } from '@/components/LinkButton'

// This page used to render DECISIONS from mock-government-data.ts — 100%
// fictional decision records with fabricated engagement fields (likes,
// dislikes, isTrending, isControversial), a decorative Yes/No poll that
// discarded the user's input, and no source field anywhere in its own type
// definition. It has been replaced with a truthful transitional state.
// Government's primary navigation destination now points at /parliament,
// the real, Supabase-backed parliamentary record.
// See STICKEE_V1_BATCH_8_TRUTHFULNESS_REPORT.md.

export default function DecisionsPage() {
  return (
    <PageShell width="narrow">
      <PageHeader
        eyebrow="Government"
        title="Verified executive-decision records are being prepared"
      />
      <div className="mt-6">
        <EmptyState
          variant="unavailable"
          title="This page previously showed fictional decision records"
          description="Stickee doesn't yet have a verified source for federal, state and local government decisions, so this page won't show a decision list until it does. For real parliamentary composition, bills and votes, see Parliament."
          action={
            <LinkButton href="/parliament">
              Go to Parliament <ArrowRight className="ml-1 h-4 w-4" />
            </LinkButton>
          }
        />
      </div>
    </PageShell>
  )
}
