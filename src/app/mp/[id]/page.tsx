import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MPIndex, getVotesForMP, issueIndex, PARTY_COLORS, calculateStickeeScore } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { MPAvatar } from '@/components/MPAvatar'
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Star } from 'lucide-react'

const voteIcon = {
  yes: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  no: <XCircle className="h-4 w-4 text-red-500" />,
  abstain: <MinusCircle className="h-4 w-4 text-yellow-500" />,
}


function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30' :
    score >= 60 ? 'text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30' :
    'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${color}`}>
      <Star className="h-3.5 w-3.5" />
      {score}
    </span>
  )
}

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
  const stickeeScore = calculateStickeeScore(id)

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
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
            <ScoreBadge score={stickeeScore} />
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

      {/* Stickee Score explanation */}
      <section className="mb-6 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-1 font-semibold text-foreground">Stickee Score</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Stickee Score reflects how consistently this MP votes with the majority position on recorded issues.
          A score of <strong className="text-foreground">{stickeeScore}/100</strong> means they align with
          the majority {stickeeScore}% of the time. Higher isn&apos;t always better — it depends on
          whether you agree with the majority!
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
