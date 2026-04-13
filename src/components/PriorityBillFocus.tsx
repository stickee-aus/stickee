'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, Users, ChevronDown, ChevronUp, Mail } from 'lucide-react'
import { BillUrgencyBadge } from '@/components/BillUrgencyBadge'
import { StreakBadge } from '@/components/StreakBadge'
import dynamic from 'next/dynamic'
import { SwingVotePanel } from '@/components/SwingVotePanel'

const CampaignModal = dynamic(
  () => import('@/components/CampaignModal').then(mod => mod.CampaignModal),
  { ssr: false }
)
const EmailMPModal = dynamic(
  () => import('@/components/EmailMPModal').then(mod => mod.EmailMPModal),
  { ssr: false }
)
import { PublicVsParliamentBar } from '@/components/PublicVsParliamentBar'
import { parliamentSupportPct } from '@/lib/mock-parliament-data'
import { computeAlignmentScore } from '@/lib/alignment'
import type { BillVoteRow } from '@/lib/mock-parliament-data'
import type { PressureSummary } from '@/app/api/bills/pressure-summary/route'
import type { ActionChoice } from '@/components/CampaignModal'
import type { MP, Issue } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriorityBillFocusProps {
  bill: BillVoteRow
  pressureSummary: PressureSummary | null
  mp: MP | null
  electorate: string | null
  userStance: 'support' | 'oppose' | null
  streakCount: number
  isActiveToday: boolean
  allCampaigns: Record<string, 'support' | 'oppose'>
  voteMatrix?: Record<string, Record<string, 'for' | 'against' | 'absent'>>
  onTakeStance: (billId: string, stance: 'support' | 'oppose') => void
}

// ─── Countdown display ────────────────────────────────────────────────────────

function InlineCountdown({ days }: { days: number }) {
  const d = Math.floor(days)
  const h = Math.floor((days - d) * 24)
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
      </span>
      Vote in {d}d {h > 0 ? `${h}h` : ''}
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PriorityBillFocus({
  bill,
  pressureSummary,
  mp,
  electorate,
  userStance,
  streakCount,
  isActiveToday,
  allCampaigns,
  voteMatrix,
  onTakeStance,
}: PriorityBillFocusProps) {
  const [campaignOpen, setCampaignOpen] = useState(false)
  const [swingExpanded, setSwingExpanded] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)

  const parlPct = parliamentSupportPct(bill)
  const liveTotal = (pressureSummary?.total ?? 0) + bill.campaignCount
  const hasSwingMPs = bill.swingMPIds.length > 0

  // MP alignment for post-stance feedback
  const alignment = mp ? computeAlignmentScore(mp, [bill], allCampaigns, voteMatrix) : null
  const mpAligned = alignment?.pct !== null && (alignment?.pct ?? 0) >= 50

  const emailIssue: Issue | null = mp ? {
    id: 'priority-bill-contact',
    title: bill.name,
    summary: `I am contacting you as a constituent regarding the ${bill.name}. ${bill.eli15}`,
    content: '',
    whatIsHappening: bill.eli15,
    whoSupports: '',
    whoOpposes: '',
    status: 'active',
  } : null

  function handleCampaignConfirm(stance: 'support' | 'oppose', _action: ActionChoice) {
    onTakeStance(bill.id, stance)
    setCampaignOpen(false)
  }

  return (
    <div className="border border-border border-l-4 overflow-hidden" style={{ borderLeftColor: '#2ec266' }}>
      <div className="p-5 sm:p-6">
        {/* Header: label + streak + countdown */}
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#2ec266' }}>
              Priority Bill
            </span>
            <StreakBadge count={streakCount} isActiveToday={isActiveToday} size="sm" />
          </div>
          {bill.daysUntilVote !== undefined && (
            <InlineCountdown days={bill.daysUntilVote} />
          )}
        </div>

        {/* Urgency badge */}
        {bill.urgency && (
          <div className="mb-3">
            <BillUrgencyBadge urgency={bill.urgency} countdown={bill.voteCountdown} />
          </div>
        )}

        {/* Bill title */}
        <h2 className="font-mono text-lg sm:text-xl font-normal text-foreground leading-tight mb-2">
          {bill.name}
        </h2>

        {/* Plain English summary */}
        <p className="font-mono text-xs text-muted-foreground leading-relaxed mb-5 line-clamp-2">
          {bill.eli15}
        </p>

        {/* Big numbers gap display */}
        <div className="mb-4 border border-border p-4">
          <div className="flex items-baseline gap-4 mb-3 flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl tabular-nums" style={{ color: '#2ec266' }}>{bill.publicSupport}%</span>
              <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">public</span>
            </div>
            <span className="text-muted-foreground/30">·</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl tabular-nums" style={{ color: '#5a9ef5' }}>{parlPct}%</span>
              <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">parliament</span>
            </div>
          </div>
          <PublicVsParliamentBar
            publicSupport={bill.publicSupport}
            parliamentSupport={parlPct}
          />
        </div>

        {/* Post-stance feedback OR primary CTA */}
        {userStance ? (
          <div className="space-y-2">
            {/* Feedback line */}
            <div
              className="flex items-center gap-2 border px-4 py-3 flex-wrap gap-y-2"
              style={{ borderColor: userStance === 'support' ? '#0e3020' : '#3a1414' }}
            >
              <div
                className="flex items-center gap-1.5 font-mono text-xs"
                style={{ color: userStance === 'support' ? '#2ec266' : '#f04747' }}
              >
                {userStance === 'support' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                You&apos;re {userStance === 'support' ? 'supporting' : 'opposing'} this
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground ml-auto">
                <Users size={10} />
                {(liveTotal - 1).toLocaleString()} others too
              </div>
            </div>

            {/* MP alignment row */}
            {mp && alignment?.pct !== null && (
              <div className="flex items-center justify-between gap-2 border border-border px-4 py-2.5">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-muted-foreground">Your MP: <span className="text-foreground">{mp.name.split(' ')[0]}</span></span>
                  <span style={{ color: mpAligned ? '#2ec266' : '#f04747' }}>
                    {mpAligned ? '✓ aligned' : '✗ misaligned'}
                  </span>
                </div>
                {emailIssue && (
                  <button
                    onClick={() => setEmailOpen(true)}
                    className="flex items-center gap-1 font-mono text-[10px] tracking-widest uppercase transition-colors hover:opacity-70 shrink-0"
                    style={{ color: '#5a5a5e' }}
                  >
                    <Mail size={10} />
                    Contact MP
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Primary CTA */
          <button
            onClick={() => setCampaignOpen(true)}
            className="flex w-full items-center justify-center gap-2 border px-5 py-3 font-mono text-xs tracking-widest uppercase transition-colors hover:opacity-80 active:translate-y-px"
            style={{ borderColor: '#2ec266', color: '#2ec266', background: '#041008' }}
          >
            Take a Stance →
          </button>
        )}

        {/* Secondary: See who decides */}
        {hasSwingMPs && (
          <button
            onClick={() => setSwingExpanded(v => !v)}
            className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {swingExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            See who decides ({bill.swingMPIds.length} swing votes)
          </button>
        )}
      </div>

      {/* Swing MPs panel */}
      {swingExpanded && hasSwingMPs && (
        <div className="border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4">
            <SwingVotePanel
              billId={bill.id}
              billName={bill.name}
              totalFor={bill.totalFor}
              totalAgainst={bill.totalAgainst}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <CampaignModal
        bill={bill}
        initialStance="support"
        open={campaignOpen}
        onOpenChange={open => { if (!open) setCampaignOpen(false) }}
        onConfirm={handleCampaignConfirm}
        electorate={electorate}
        mpName={mp?.name ?? null}
        localCount={0}
      />

      {emailIssue && mp && (
        <EmailMPModal
          issue={emailIssue}
          open={emailOpen}
          onOpenChange={setEmailOpen}
        />
      )}
    </div>
  )
}
