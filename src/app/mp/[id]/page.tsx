import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MPIndex, PARTY_COLORS } from '@/lib/mock-data'
import { MPAvatar } from '@/components/MPAvatar'
import { PageShell } from '@/components/ui/page-shell'
import { MetadataLine } from '@/components/ui/metadata-line'
import { ArrowLeft, ShieldQuestion, Users } from 'lucide-react'
import { SimulateThisButton } from '@/components/simulator/SimulateThisButton'

// A per-MP "Stickee Score" used to be shown here, described as reflecting
// how consistently the MP votes with the majority. It has been removed: the
// underlying calculation used a fixed per-party assumption applied to a
// small set of illustrative issues, not this MP's actual recorded votes,
// even though real vote data is already synced from TheyVoteForYou into
// member_votes. See docs/MP_SCORE_METHODOLOGY_REQUIREMENTS.md for what a
// legitimate replacement needs before this is reintroduced (behind
// NEXT_PUBLIC_MP_SCORE_ENABLED).
//
// The "Voting History" list that used to sit below it had the same problem
// one level down: getVotesForMP() assigns every MP of a party the same
// yes/no/abstain vote on a handful of illustrative mock issues
// (PARTY_VOTE_MAP in mock-data.ts) — not this MP's actual recorded division
// votes — and rendered it as "(n recorded votes)" as if it were the real
// Hansard record. Removed for the same reason, per
// PEOPLE_TRUTHFULNESS_BATCH_REPORT.md. Real per-MP votes exist in the
// member_votes/divisions tables (synced via /api/sync/divisions) but are
// not yet wired to this page — the MP canonical-ID reconciliation this
// requires is documented, not attempted, in
// PEOPLE_V1_SIMPLIFICATION_REPORT.md's canonical-ID findings.

// Generic, role-based responsibility statement — never a claim about what
// this specific MP does beyond their identity fields. No portfolio,
// ministerial, or department responsibility is implied unless verified from
// a real source (none exists for any MP today).
const FEDERAL_MP_RESPONSIBILITIES = [
  'Represents an electorate in the House of Representatives',
  'Votes on legislation',
  'May sit on committees',
  'May ask questions in Parliament',
  'May introduce a private member’s bill',
]

export default async function MPPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const mp = MPIndex[id]
  if (!mp) notFound()

  const partyColor = PARTY_COLORS[mp.party] ?? '#999'

  return (
    <PageShell width="narrow">
      <Link
        href="/leaders"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to People
      </Link>

      {/* Profile header */}
      <div className="mb-4 flex items-start gap-5">
        {/* Avatar */}
        <MPAvatar id={mp.id} name={mp.name} partyColor={partyColor} />

        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{mp.name}</h1>
              <p className="text-muted-foreground">{mp.electorate} · House of Representatives</p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 border" style={{ backgroundColor: partyColor, borderColor: partyColor }} aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">{mp.party}</span>
          </div>
        </div>
      </div>

      <MetadataLine
        source="Static reference snapshot (mock-data.ts) — not yet live-synced to this profile"
        verification="unverified"
        className="mb-8"
      />

      {/* What this MP can and cannot do — generic, role-based, not a per-MP claim */}
      <section className="mb-6 rounded-[var(--radius)] border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">What a Federal MP can and cannot do</h2>
        </div>
        <ul className="space-y-1.5 text-sm text-muted-foreground mb-3">
          {FEDERAL_MP_RESPONSIBILITIES.map(item => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
          On their own, an MP cannot unilaterally pass or block legislation, direct a government
          department, or decide executive policy. Some MPs also hold a ministerial or shadow
          portfolio — Stickee does not yet verify or display that role for individual MPs.
        </p>
      </section>

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
      <section className="mb-6 rounded-[var(--radius)] border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <ShieldQuestion className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Individual voting analysis</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Individual voting analysis is not yet available for this representative.
        </p>
      </section>

      {/* Voting history: not shown until it reflects this MP's real record */}
      <section className="rounded-[var(--radius)] border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-foreground">Voting History</h2>
        </div>
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          Recorded votes for this MP are being verified against the real parliamentary record.
        </div>
      </section>
    </PageShell>
  )
}
