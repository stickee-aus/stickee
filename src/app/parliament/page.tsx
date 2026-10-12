import type { Metadata } from 'next'
import { ParliamentExperienceClient } from '@/components/ParliamentExperienceClient'
import { getParliamentDBData } from '@/lib/parliament-db'
import { PageShell } from '@/components/ui/page-shell'
import { PageHeader } from '@/components/ui/page-header'
import { isSupabaseConfigured } from '@/lib/supabase-config'

export const metadata: Metadata = {
  title: 'Parliament — Stickee',
  description: 'What Federal Parliament is doing right now — real bills, real votes, and who represents you.',
  openGraph: {
    title: 'Australian Parliament — Stickee',
    description: 'What Federal Parliament is doing right now — real bills, real votes, and who represents you.',
    type: 'website',
  },
}

export default async function ParliamentPage() {
  // Try to load real data from Supabase; fall back to mock data if DB is empty.
  const dbData = isSupabaseConfigured
    ? await getParliamentDBData().catch(() => null)
    : null
  const isLive = !!dbData

  return (
    <PageShell>
      <PageHeader
        eyebrow="Australia · Government"
        title="Parliament"
        summary="What is Federal Parliament doing right now, and who represents you there?"
        metadata={{
          source: isLive ? 'TheyVoteForYou · Parliament of Australia' : 'No verified data available',
          verification: isLive ? 'verified' : 'unverified',
        }}
        metric={dbData ? { value: dbData.members.length, label: 'Verified MPs tracked' } : undefined}
      />

      {/* Government vs Parliament — always visible, never collapsed */}
      <div className="mt-8 border border-border bg-muted/30 px-5 py-4">
        <p className="text-body-copy text-foreground">
          <strong>Government is broader than Parliament.</strong> This page currently covers Federal
          Parliament — the House of Representatives, the Senate, bills, votes, and representation.
        </p>
        <p className="text-body-copy text-muted-foreground mt-2">
          Executive government — the Prime Minister, Cabinet, ministers, departments, and agencies —
          is a separate part of government that Stickee does not yet cover here. Nothing on this page
          should be read as a record of executive decisions.
        </p>
      </div>

      <div className="mt-8">
        <ParliamentExperienceClient
          hasVerifiedData={isLive}
          members={dbData?.members}
          memberIndex={dbData?.memberIndex}
          memberStates={dbData?.memberStates}
          electorateMPMap={dbData?.electorateMPMap}
          bills={dbData?.bills}
          voteMatrix={dbData?.voteMatrix}
        />
      </div>
    </PageShell>
  )
}
