import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MPIndex, getVotesForMP, issueIndex, PARTY_COLORS } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { MPAvatar } from '@/components/MPAvatar'
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, ShieldQuestion } from 'lucide-react'
import { SimulateThisButton } from '@/components/simulator/SimulateThisButton'

const voteIcon = {
  yes: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  no: <XCircle className="h-4 w-4 text-red-500" />,
  abstain: <MinusCircle className="h-4 w-4 text-yellow-500" />,
}

// A per-MP "Stickee Score" used to be shown here, described as reflecting
// how consistently the MP votes with the majority. It has been removed: the
// underlying calculation used a fixed per-party assumption applied to a
// small set of illustrative issues, not this MP's actual recorded votes,
// even though real vote data is already synced from TheyVoteForYou into
// member_votes. See docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md for what a
// legitimate replacement needs before this is reintroduced (behind
// NEXT_PUBLIC_MP_SCORE_ENABLED).

export default async function MPPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const mp = MPIndex[id]
  if (!mp) notFound()

  const mpVotes = getVotesForMP(id)
  const partyColor = PARTY_COLORS[mp.party] ?? '#999'

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <Link
        href="/parliament"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Parliament
      </Link>

      {/* Profile header */}
      <div className="mb-8 flex items-start gap-5">
        {/* Avatar */}
        <MPAvatar id={mp.id} name={mp.name} partyColor={partyColor} />

        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{mp.name}</h1>
              <p className="text-muted-foreground">{mp.electorate}</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge
              className="text-white font-medium"
              style={{ backgroundColor: partyColor }}
            >
              {mp.party}
            </Badge>
          </div>
        </div>
      </div>

      {/* Simulate this MP's stance */}
      <div className="mb-6">
        <SimulateThisButton
          size="lg"
          entity={{
            type: 'leader',
            id: mp.id,
            title: `${mp.name} · ${mp.electorate}`,
            summary: `${mp.party} MP. Rehearse ${mp.name}'s stance against the opposition and a compromise.`,
          }}
          label={`Rehearse ${mp.name}'s voting stance`}
        />
      </div>

      {/* Individual-voting-record score: not shown until it's real */}
      <section className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <ShieldQuestion className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Individual voting analysis</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Individual voting analysis is being verified.
        </p>
      </section>

      {/* Voting history */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">
            Voting History{' '}
            <span className="font-normal text-sm text-muted-foreground">
              ({mpVotes.length} recorded votes)
            </span>
          </h2>
        </div>

        {mpVotes.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No recorded votes yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {mpVotes.map(vote => {
              const issue = issueIndex[vote.issueId]
              if (!issue) return null
              return (
                <Link
                  key={vote.issueId}
                  href={`/issue/${issue.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 pr-4">
                    <p className="text-sm font-medium text-foreground">{issue.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{issue.summary}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium capitalize shrink-0">
                    {voteIcon[vote.vote]}
                    {vote.vote}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
