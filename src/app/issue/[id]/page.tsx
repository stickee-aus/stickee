import { notFound } from 'next/navigation'
import Link from 'next/link'
import { issueIndex, getVoteSummary } from '@/lib/mock-data'
import { issueMarkets } from '@/lib/mock-market-data'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PredictionWidget } from '@/components/PredictionWidget'
import { EmailMPButton } from '@/components/EmailMPButton'
import { MPVoteGrid } from '@/components/MPVoteGrid'
import { PredictionMarketGrid } from '@/components/PredictionMarketGrid'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'

const statusConfig = {
  active:   { label: 'Active',   className: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/25' },
  passed:   { label: 'Passed',   className: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25' },
  rejected: { label: 'Rejected', className: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/25' },
}

const SEED_PREDICTIONS: Record<string, { yes: number; no: number }> = {
  'housing-affordability': { yes: 312, no: 198 },
  'climate-safeguard':     { yes: 445, no: 221 },
  'ndis-reform':           { yes: 187, no: 290 },
  'tax-cuts':              { yes: 380, no: 145 },
  'misinformation-bill':   { yes: 201, no: 388 },
}

async function getPredictionCounts(issueId: string): Promise<{ yes: number; no: number }> {
  const seed = SEED_PREDICTIONS[issueId] ?? { yes: 50, no: 50 }
  try {
    const supabase = await createServerSupabaseClient()
    const [{ count: yesCount }, { count: noCount }] = await Promise.all([
      supabase.from('predictions').select('*', { count: 'exact', head: true }).eq('issue_id', issueId).eq('prediction', 'yes'),
      supabase.from('predictions').select('*', { count: 'exact', head: true }).eq('issue_id', issueId).eq('prediction', 'no'),
    ])
    return { yes: seed.yes + (yesCount ?? 0), no: seed.no + (noCount ?? 0) }
  } catch {
    return seed
  }
}

export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const issue = issueIndex[id]
  if (!issue) notFound()

  const summary = getVoteSummary(id)
  const market = issueMarkets[id]
  const predictions = await getPredictionCounts(id)
  const status = statusConfig[issue.status]
  const total = summary.yes + summary.no + summary.abstain

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className={`text-xs font-medium ${status.className}`} variant="outline">
            {status.label}
          </Badge>
          {market && (
            <span className="rounded-full bg-white/5 border border-border/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {market.probability}% probability · {market.totalParticipants.toLocaleString()} participants
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{issue.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{issue.summary}</p>
      </div>

      {/* Summary stats */}
      {total > 0 && (
        <div className="mb-10 grid grid-cols-3 gap-4">
          {[
            { label: 'Voted Yes', value: summary.yes, color: 'text-green-600 dark:text-green-400' },
            { label: 'Voted No',  value: summary.no,  color: 'text-red-500 dark:text-red-400' },
            { label: 'Abstained', value: summary.abstain, color: 'text-muted-foreground' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Two-column layout on large screens */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: context */}
        <div className="lg:col-span-1 space-y-6">
          <section className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-5">
            <h2 className="mb-2 font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">What&apos;s happening</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{issue.whatIsHappening}</p>
          </section>

          <div className="space-y-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-4">
              <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Who supports it
              </h3>
              <p className="text-xs text-emerald-400/70 leading-relaxed">{issue.whoSupports}</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/8 p-4">
              <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-red-400">
                <XCircle className="h-3.5 w-3.5" /> Who opposes it
              </h3>
              <p className="text-xs text-red-400/70 leading-relaxed">{issue.whoOpposes}</p>
            </div>
          </div>

          <PredictionWidget issueId={id} initialCounts={predictions} />

          <section className="rounded-xl border border-primary/25 bg-primary/8 p-5">
            <h2 className="mb-1 font-semibold text-foreground text-sm">Take Action</h2>
            <p className="mb-3 text-xs text-muted-foreground">Let your MP know where you stand.</p>
            <EmailMPButton issue={issue} />
          </section>
        </div>

        {/* Right: interactive grids */}
        <div className="lg:col-span-2 space-y-10">
          <PredictionMarketGrid issueId={id} />
          <MPVoteGrid issueId={id} />
        </div>
      </div>
    </div>
  )
}
