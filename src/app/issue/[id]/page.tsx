import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getIssueDetailData, getIssuesPageData } from '@/lib/issues-db'
import { EmailMPButton } from '@/components/EmailMPButton'
import { PageShell } from '@/components/ui/page-shell'
import { PageHeader } from '@/components/ui/page-header'
import { SectionHeader } from '@/components/ui/section-header'
import { RecordRow } from '@/components/ui/record-row'
import { StatusLabel, type Status } from '@/components/ui/status-label'
import { EvidenceBlock } from '@/components/ui/evidence-block'
import { LinkButton } from '@/components/LinkButton'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { SimulateThisButton } from '@/components/simulator/SimulateThisButton'
import { CATEGORY_LABELS } from '@/components/MarketCard'
import { getMarketEligibility } from '@/lib/market-eligibility'
import { getIssueResponsibilityGraph, selectVerifiedEntries, type IssueResponsibilityGraph } from '@/lib/responsibility-db'
import { IssueResponsibilitySection } from '@/components/IssueResponsibilitySection'

const STATUS_MAP: Record<string, Status> = {
  active: 'active',
  passed: 'passed',
  rejected: 'voided',
}

const STATUS_TEXT: Record<string, string> = {
  active: 'Active',
  passed: 'Passed',
  rejected: 'Rejected',
}

export default async function IssuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getIssueDetailData(id)
  if (!data) notFound()

  const { issue, market, source } = data
  const isVerified = source === 'database'

  const { issues: allIssues } = await getIssuesPageData()
  const relatedIssues = allIssues.filter(other => other.id !== id).slice(0, 3)

  const marketEligibility = market ? getMarketEligibility(market) : null

  // Only ever queried when the Issue record itself is real/DB-sourced — the
  // Responsibility Engine's own FK (issue_portfolios.issue_id → issues.id)
  // already makes it impossible for a real relationship row to exist
  // against an id with no real issues row, but this is an additional,
  // cheap guard against ever presenting real-looking responsibility data
  // underneath a demo issue. Wrapped defensively: these tables may not
  // exist yet in every environment this page renders in (see
  // RESPONSIBILITY_ENGINE_V1_FIRST_REAL_SLICE_REPORT.md §12), and a missing
  // table must never break this page for every other issue.
  let responsibilityGraph: IssueResponsibilityGraph = { issueId: issue.id, entries: [] }
  if (isVerified) {
    try {
      responsibilityGraph = await getIssueResponsibilityGraph(issue.id)
    } catch {
      // Fall through to the empty graph — the page below already renders
      // the honest "not yet verified" state for an empty graph.
    }
  }

  return (
    <PageShell width="narrow">
      <Link
        href="/issues"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Issues
      </Link>

      {!isVerified && (
        <div className="mb-8 flex items-start gap-3 rounded-[var(--radius)] border border-border bg-muted/40 p-4">
          <StatusLabel status="demo" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Demo content — this issue is not yet backed by a real parliamentary record. The title, summary,
            positions, and figures shown below are illustrative, not verified.
          </p>
        </div>
      )}

      {/* 1. Overview */}
      <PageHeader
        title={issue.title}
        summary={issue.summary}
        metadata={{ verification: isVerified ? 'verified' : 'demo' }}
        actions={<StatusLabel status={STATUS_MAP[issue.status] ?? 'unavailable'} label={STATUS_TEXT[issue.status]} />}
      />

      {/* 2. What is happening? */}
      {issue.whatIsHappening && (
        <section className="mt-8">
          <SectionHeader title="What is happening?" />
          <p className="mt-4 text-body-copy text-muted-foreground leading-relaxed">{issue.whatIsHappening}</p>
        </section>
      )}

      {/* 3. Why this matters */}
      {issue.content && (
        <section className="mt-8">
          <SectionHeader title="Why this matters" />
          <p className="mt-4 text-body-copy text-muted-foreground leading-relaxed">{issue.content}</p>
        </section>
      )}

      {/* 4. Latest recorded update */}
      <section className="mt-8">
        <SectionHeader title="Latest recorded update" />
        <div className="mt-4 space-y-2">
          {issue.updatedAt ? (
            <p className="text-body-copy text-foreground">
              Updated {new Date(issue.updatedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
              {issue.sourceUrl && (
                <>
                  {' · '}
                  <a href={issue.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
                    Source
                  </a>
                </>
              )}
            </p>
          ) : (
            <p className="text-body-copy text-muted-foreground">No verified update date is available for this issue.</p>
          )}
          <p className="text-body-copy text-muted-foreground">
            What specifically changed in this update is not yet recorded, and a full, event-by-event history is
            not yet available. A real timeline would need a dated record of each event, its source, and who acted
            — that data model does not exist yet.
          </p>
        </div>
      </section>

      {/* 5. Evidence */}
      <section className="mt-8">
        <SectionHeader title="Evidence" />
        <div className="mt-4 space-y-4">
          <EvidenceBlock
            source={issue.sourceUrl ?? undefined}
            freshness={issue.updatedAt ? new Date(issue.updatedAt).toLocaleDateString('en-AU') : undefined}
            verificationStatus={isVerified ? undefined : 'demo'}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[var(--radius)] border border-border p-4">
              <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" /> Who supports it
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{issue.whoSupports || 'Not yet documented.'}</p>
            </div>
            <div className="rounded-[var(--radius)] border border-border p-4">
              <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <XCircle className="h-3.5 w-3.5" /> Who opposes it
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{issue.whoOpposes || 'Not yet documented.'}</p>
            </div>
          </div>
          <p className="text-metadata normal-case tracking-normal text-muted-foreground">
            {isVerified
              ? (issue.sourceUrl
                  ? 'Sourced analysis, citation above.'
                  : 'Sourced analysis — a specific citation for these positions has not yet been added.')
              : 'Demo content — not sourced.'}
          </p>
        </div>
      </section>

      {/* 6. What has government done? */}
      <section className="mt-8">
        <SectionHeader title="What has government done?" />
        <div className="mt-4 space-y-2">
          <p className="text-body-copy text-foreground">
            Currently: <span className="font-medium">{STATUS_TEXT[issue.status] ?? issue.status}</span>
          </p>
          <p className="text-body-copy text-muted-foreground">
            No verified, sourced record of the individual actions behind this status (e.g. a bill introduced,
            a committee inquiry, a vote scheduled) is available yet. Stickee does not yet have a real,
            per-event government-action data model — see the owner decisions in{' '}
            <span className="font-mono text-xs">ISSUE_DETAIL_V1_REPORT.md</span>.
          </p>
        </div>
      </section>

      {/* 7. Who is responsible? */}
      <section className="mt-8">
        <SectionHeader title="Who is responsible?" />
        <div className="mt-4 space-y-6">
          {selectVerifiedEntries(responsibilityGraph).length > 0 ? (
            <IssueResponsibilitySection graph={responsibilityGraph} />
          ) : (
            <p className="text-body-copy text-muted-foreground leading-relaxed">
              We haven&apos;t yet verified who has primary responsibility for this issue. As that work is completed,
              Stickee will identify the relevant minister, department, committee or institution together with the
              evidence supporting that relationship.
            </p>
          )}

          <div className="rounded-[var(--radius)] border border-dashed border-border p-4">
            <p className="text-micro-label mb-2">General civics — not specific to this issue</p>
            <p className="mb-2 text-sm font-medium text-foreground">How responsibility usually works</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground leading-relaxed list-disc pl-4">
              <li>Federal Parliament makes and reviews national laws.</li>
              <li>Ministers lead a portfolio and are responsible for its policy direction.</li>
              <li>Departments administer and implement policy day-to-day.</li>
              <li>Parliamentary committees investigate and scrutinise specific issues.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 8. Forecasts */}
      <section className="mt-8">
        <SectionHeader title="Forecasts" />
        <div className="mt-4">
          {market && marketEligibility ? (
            <RecordRow
              label={market.question}
              meta={[
                CATEGORY_LABELS[market.category] ?? market.category,
                `Resolves ${market.resolvesBy}`,
                marketEligibility.isResolved && market.resolutionSource ? `Resolution source: ${market.resolutionSource}` : null,
              ].filter(Boolean).join(' · ')}
              value={`${market.probability}%`}
              status={
                <div className="flex flex-col items-end gap-2">
                  <StatusLabel
                    status={marketEligibility.isDemo ? 'demo' : marketEligibility.isVoided ? 'voided' : marketEligibility.isResolved ? 'resolved' : 'active'}
                    label={marketEligibility.isResolvedYes ? 'Resolved Yes' : marketEligibility.isResolvedNo ? 'Resolved No' : undefined}
                  />
                  <Link href="/predictions" className="text-micro-label text-muted-foreground hover:text-foreground">
                    View forecast →
                  </Link>
                </div>
              }
            />
          ) : (
            <p className="text-body-copy text-muted-foreground">No verified forecast is linked to this issue yet.</p>
          )}
        </div>
      </section>

      {/* 9. How can I influence this? */}
      <section className="mt-8 rounded-[var(--radius)] border border-border p-5">
        <SectionHeader title="How can I influence this?" />
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Contact your representative</p>
            <p className="mb-3 text-sm text-muted-foreground leading-relaxed">
              Emailing your MP is one real, working action — Stickee can confirm your email client opens with a
              drafted message, but not that your MP&apos;s office reads or responds to it.
            </p>
            <EmailMPButton issue={issue} />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-foreground">See who represents Australians in Parliament</p>
            <LinkButton href="/parliament" variant="outline" size="sm">View parliamentary activity</LinkButton>
          </div>

          {market && marketEligibility?.canStake && (
            <div>
              <p className="mb-1 text-sm font-medium text-foreground">Share your view on the outcome</p>
              <LinkButton href="/predictions" variant="outline" size="sm">Participate in the forecast</LinkButton>
            </div>
          )}
        </div>
      </section>

      {/* 10. Related */}
      <section className="mt-8 mb-4">
        <SectionHeader title="Related" />
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/parliament" variant="outline" size="sm">Government</LinkButton>
            <LinkButton href="/leaders" variant="outline" size="sm">People</LinkButton>
            <LinkButton href="/predictions" variant="outline" size="sm">Forecasts</LinkButton>
          </div>

          {relatedIssues.length > 0 && (
            <div>
              <p className="text-micro-label mb-2">Other issues</p>
              {relatedIssues.map(other => (
                <RecordRow key={other.id} label={other.title} summary={other.summary} href={`/issue/${other.id}`} />
              ))}
            </div>
          )}

          <div>
            <SimulateThisButton
              size="sm"
              entity={{
                type: 'issue',
                id: issue.id,
                title: issue.title,
                summary: issue.summary,
              }}
            />
          </div>
        </div>
      </section>
    </PageShell>
  )
}
