'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, ExternalLink } from 'lucide-react'
import { ReadinessMeter } from '@/components/ReadinessMeter'
import { PathwayTracker } from '@/components/PathwayTracker'
import { CredibilityScore } from '@/components/CredibilityScore'
import { EndorsementPanel } from '@/components/EndorsementPanel'
import dynamic from 'next/dynamic'

const SupportModal = dynamic(
  () => import('@/components/SupportModal').then(mod => mod.SupportModal),
  { ssr: false }
)
import { SupportStrengthBar } from '@/components/SupportStrengthBar'
import { LocalMomentumWidget } from '@/components/LocalMomentumWidget'
import { ReadinessProgressTracker } from '@/components/ReadinessProgressTracker'
import { PathwayToRealPolitics } from '@/components/PathwayToRealPolitics'
import { DECISIONS } from '@/lib/mock-government-data'
import { READINESS_THRESHOLDS, PATHWAY_CONTENT } from '@/lib/mock-leaders-data'
import { SimulateThisButton } from '@/components/simulator/SimulateThisButton'
import type { FutureLeader } from '@/types/leaders'

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-4 w-0.5 rounded-full bg-primary/60" />
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
    </div>
  )
}

interface LeaderProfileDetailProps {
  leader: FutureLeader
}

export function LeaderProfileDetail({ leader }: LeaderProfileDetailProps) {
  const [supportOpen, setSupportOpen] = useState(false)
  const pathwayContent = PATHWAY_CONTENT[leader.id] ?? null

  const linkedDecisions = leader.linkedDecisions
    .map(ld => ({
      decision: DECISIONS.find(d => d.id === ld.decisionId),
      relevance: ld.relevance,
    }))
    .filter((x): x is { decision: NonNullable<typeof x.decision>; relevance: string } => x.decision != null)

  return (
    <div className="space-y-8">

      {/* ── Hero header ────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Back link */}
        <Link
          href="/leaders"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          ← People
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 flex-1 min-w-0">
            {/* Name + readiness */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="h-11 w-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                {leader.avatarInitials}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
                  {leader.name}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <ReadinessMeter level={leader.readiness} size="md" />
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted/60 text-muted-foreground ring-1 ring-border/40">
                    {leader.field}
                  </span>
                </div>
              </div>
            </div>

            {/* Location + stage */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{leader.location}</span>
              <span className="mx-1">·</span>
              <span>{leader.currentPathwayStage}</span>
            </div>
          </div>

          {/* Support button + large credibility badge */}
          <div className="shrink-0 flex flex-col items-end gap-3 text-right">
            <div className={`inline-flex flex-col items-center rounded-xl px-4 py-2.5 ${
              leader.credibility.total >= 65 ? 'bg-emerald-500/10 ring-1 ring-emerald-500/25' :
              leader.credibility.total >= 45 ? 'bg-amber-400/10  ring-1 ring-amber-400/25' :
              'bg-red-500/10 ring-1 ring-red-500/25'
            }`}>
              <span className={`text-3xl font-bold tabular-nums ${
                leader.credibility.total >= 65 ? 'text-emerald-400' :
                leader.credibility.total >= 45 ? 'text-amber-400' :
                'text-red-400'
              }`}>
                {leader.credibility.total}
              </span>
              <span className="text-[11px] text-muted-foreground/60 font-medium">Credibility</span>
            </div>

            <button
              onClick={() => setSupportOpen(true)}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
            >
              Support This Leader
            </button>
          </div>
        </div>
      </div>

      <SupportModal open={supportOpen} onOpenChange={setSupportOpen} leader={leader} />

      {/* ── Simulate this leader's stance ───────────────────────────── */}
      <SimulateThisButton
        size="lg"
        entity={{
          type: 'leader',
          id: leader.id,
          title: `${leader.name} · ${leader.field}`,
          summary: leader.fullBio?.slice(0, 240),
        }}
        label={`Rehearse ${leader.name}'s stance vs alternatives`}
      />

      {/* ── Bio ─────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5">
        <p className="text-sm text-muted-foreground leading-relaxed">{leader.fullBio}</p>
      </div>

      {/* ── Community Support ───────────────────────────────────────── */}
      {leader.supportSummary && (
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5">
          <SectionHeader title="Community Support" />
          <SupportStrengthBar summary={leader.supportSummary} size="lg" />
        </div>
      )}

      {/* ── Credibility breakdown ───────────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5">
        <SectionHeader title="Credibility Score" />
        <CredibilityScore breakdown={leader.credibility} size="lg" />
      </div>

      {/* ── Pathway ─────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5">
        <SectionHeader title="Pathway to Leadership" />
        <PathwayTracker
          currentStage={leader.currentPathwayStage}
          completedStages={leader.pathwayHistory}
        />
        <p className="mt-4 text-xs text-muted-foreground/60">
          Stages reflect realistic pathway into Australian governance — from community involvement through to federal representation.
        </p>
      </div>

      {/* ── Local Momentum ──────────────────────────────────────────── */}
      {leader.supportSummary && leader.supportSummary.localBreakdown.length > 0 && (
        <LocalMomentumWidget
          localBreakdown={leader.supportSummary.localBreakdown}
          leaderState={leader.state}
          totalSupporters={leader.supportSummary.totalSupporters}
        />
      )}

      {/* ── Pathway Progress ────────────────────────────────────────── */}
      {leader.supportSummary && (
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5">
          <SectionHeader title="Pathway Progress" />
          <ReadinessProgressTracker
            leader={leader}
            summary={leader.supportSummary}
            thresholds={READINESS_THRESHOLDS}
          />
        </div>
      )}

      {/* ── Pathway to Real Politics ─────────────────────────────────── */}
      {pathwayContent && (
        <PathwayToRealPolitics content={pathwayContent} leaderName={leader.name} />
      )}

      {/* ── Endorsements & Concerns ─────────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5">
        <SectionHeader title="Endorsements &amp; Concerns" />
        <EndorsementPanel leader={leader} />
      </div>

      {/* ── Linked Decisions ────────────────────────────────────────── */}
      {linkedDecisions.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5">
          <SectionHeader title="Linked Decisions" />
          <div className="space-y-3">
            {linkedDecisions.map(({ decision, relevance }) => (
              <div
                key={decision.id}
                className="rounded-xl border border-border/50 bg-muted/30 p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground/90 leading-snug">{decision.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{relevance}</p>
                  </div>
                  <Link
                    href="/decisions"
                    className="shrink-0 flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary transition-colors mt-0.5"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View
                  </Link>
                </div>
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted/60 text-muted-foreground ring-1 ring-border/40">
                    {decision.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">{decision.level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Related issue areas ─────────────────────────────────────── */}
      {leader.linkedIssueAreas.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-5">
          <SectionHeader title="Related Issue Areas" />
          <div className="flex flex-wrap gap-2">
            {leader.linkedIssueAreas.map(area => (
              <span
                key={area}
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border border-border/60 bg-muted/40 text-muted-foreground"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Safety note ─────────────────────────────────────────────── */}
      <p className="text-[11px] text-muted-foreground/40 text-center">
        This profile was nominated by a community member and reviewed by the Stickee moderation team. The nominee has provided consent for public listing. Content is moderated for accuracy and good faith. Supporting a leader on Stickee is a civic expression of intent, not an official vote or party membership.
      </p>
    </div>
  )
}
