import { BallotBuilder } from '@/components/BallotBuilder'
import { getIssuesPageData } from '@/lib/issues-db'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PageShell } from '@/components/ui/page-shell'
import { PageHeader } from '@/components/ui/page-header'
import { SectionHeader } from '@/components/ui/section-header'
import { getPublicBallots, getMyBallots } from '@/lib/ballots-db'

export default async function BallotsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [issuesPageData, publicBallots, myBallots] = await Promise.all([
    getIssuesPageData(),
    getPublicBallots(12),
    user ? getMyBallots(user.id) : Promise.resolve([]),
  ])

  const issues = issuesPageData.issues.map(issue => ({
    id: issue.id,
    title: issue.title,
  }))

  return (
    <PageShell width="default">
      <PageHeader
        eyebrow="Australia · Ballots"
        title="Build your ballot"
        summary="Rank the issues that matter to you, state your position on each, and Stickee turns your top pick into a live forecast."
        metric={{ value: publicBallots.length, label: 'public ballots' }
        metadata={{ source: 'User-built · Virtual points, no real-world value' }
      />

      <div className="mt-8">
        <SectionHeader title="Your ballot" />
        <div className="mt-4">
          <BallotBuilder issues={issues} authenticated={!!user} />
        </div>
      </div>

      {myBallots.length > 0 && (
        <div className="mt-10">
          <SectionHeader title="Your ballots" />
          <div className="mt-4 space-y-3">
            {myBallots.map(ballot => (
              <div key={ballot.id} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">{ballot.title}</p>
                <p className="mt-1 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  {ballot.items.length} item{ballot.items.length === 1 ? '' : 's'} · {ballot.is_public ? 'Public' : 'Private'} · {new Date(ballot.created_at).toLocaleDateString('en-AU')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {publicBallots.length > 0 && (
        <div className="mt-10">
          <SectionHeader title="Community ballots" />
          <div className="mt-4 space-y-3">
            {publicBallots.map(ballot => (
              <div key={ballot.id} className="rounded-lg border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">{ballot.title}</p>
                <p className="mt-1 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                  {ballot.items.length} item{ballot.items.length === 1 ? '' : 's'} · {new Date(ballot.created_at).toLocaleDateString('en-AU')}
                </p>
                {ballot.items[0] && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Top pick: {ballot.items[0].position_text}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  )
}
