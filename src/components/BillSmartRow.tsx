'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react'
import { BillStageTimeline } from '@/components/BillStageTimeline'
import { SwingVotePanel } from '@/components/SwingVotePanel'
import { GapExplainerPanel } from '@/components/GapExplainerPanel'
import dynamic from 'next/dynamic'
import { computeGap, parliamentSupportPct } from '@/lib/mock-parliament-data'
import type { BillVoteRow } from '@/lib/mock-parliament-data'
import type { PressureSummary } from '@/app/api/bills/pressure-summary/route'
import type { ActionChoice } from '@/components/CampaignModal'

const CampaignModal = dynamic(
  () => import('@/components/CampaignModal').then(mod => mod.CampaignModal),
  { ssr: false }
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillSmartRowProps {
  bill: BillVoteRow
  pressureSummary: PressureSummary | null
  electorate: string | null
  mpName: string | null
  isExpanded: boolean
  userStance: 'support' | 'oppose' | null
  onToggleExpand: (id: string) => void
  onStanceTaken: (billId: string, stance: 'support' | 'oppose') => void
  onViewChamber: (id: string) => void
}

// ─── Urgency dot ──────────────────────────────────────────────────────────────

const URGENCY_DOT_COLOR: Record<string, string> = {
  'swing-vote':       'bg-red-500',
  'highly-contested': 'bg-orange-500',
  'closing-soon':     'bg-amber-400',
  'just-moved':       'bg-primary',
}

function UrgencyDot({ urgency }: { urgency?: string }) {
  const color = urgency ? URGENCY_DOT_COLOR[urgency] : 'bg-muted-foreground/30'
  return <span className={`inline-block h-1.5 w-1.5 shrink-0 ${color}`} />
}

// ─── Mini gap bar ─────────────────────────────────────────────────────────────

function MiniGapBar({ bill }: { bill: BillVoteRow }) {
  const parlPct = parliamentSupportPct(bill)
  return (
    <div className="w-20 shrink-0 space-y-0.5">
      <div className="h-1 bg-muted/30 overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: `${bill.publicSupport ?? 0}%` }} />
      </div>
      <div className="h-1 bg-muted/30 overflow-hidden">
        <div className="h-full bg-blue-500" style={{ width: `${parlPct}%` }} />
      </div>
    </div>
  )
}

// ─── Gap label ────────────────────────────────────────────────────────────────

function GapLabel({ bill }: { bill: BillVoteRow }) {
  const gap = computeGap(bill)
  if (gap === null) return null
  const abs = Math.abs(gap)

  if (abs <= 5) {
    return <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">~aligned</span>
  }
  if (gap > 0) {
    return (
      <span className="text-[10px] font-medium text-red-400 shrink-0">
        <span className="hidden sm:inline">−{abs}pts misaligned</span>
        <span className="sm:hidden">−{abs}pts</span>
      </span>
    )
  }
  return (
    <span className="text-[10px] font-medium text-emerald-400 shrink-0">
      <span className="hidden sm:inline">+{abs}pts aligned</span>
      <span className="sm:hidden">+{abs}pts</span>
    </span>
  )
}

// ─── Status pill for passed/failed ───────────────────────────────────────────

function StatusPill({ status }: { status: BillVoteRow['status'] }) {
  if (status === 'passed') return (
    <span className="font-mono text-[9px] uppercase tracking-widest border px-1.5 py-0.5 shrink-0" style={{ color: '#2ec266', borderColor: '#0e3020' }}>
      Passed
    </span>
  )
  if (status === 'failed') return (
    <span className="font-mono text-[9px] uppercase tracking-widest border px-1.5 py-0.5 shrink-0" style={{ color: '#f04747', borderColor: '#3a1414' }}>
      Failed
    </span>
  )
  return null
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BillSmartRow({
  bill,
  pressureSummary,
  electorate,
  isExpanded,
  userStance,
  onToggleExpand,
  onStanceTaken,
  onViewChamber,
}: BillSmartRowProps) {
  const [campaignOpen, setCampaignOpen] = useState(false)
  const [swingOpen, setSwingOpen] = useState(false)
  const [initialCampaignStance, setInitialCampaignStance] = useState<'support' | 'oppose'>('support')

  const truncatedName = bill.name.length > 40
    ? bill.name.slice(0, 40) + '…'
    : bill.name

  const parlPct = parliamentSupportPct(bill)

  function openCampaign(stance: 'support' | 'oppose') {
    setInitialCampaignStance(stance)
    setCampaignOpen(true)
  }

  function handleCampaignConfirm(stance: 'support' | 'oppose', _action: ActionChoice) {
    onStanceTaken(bill.id, stance)
    setCampaignOpen(false)
  }

  return (
    <div>
      {/* ── Collapsed row ──────────────────────────────────────────────────────
          A div, not a button: it contains its own interactive children (the
          "Stance" button below), and nested <button>s are invalid HTML and
          trigger a hydration error. role="button" + onKeyDown restores
          button semantics/keyboard activation without the nesting. */}
      <div
        role="button"
        tabIndex={0}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-card/30 transition-colors cursor-pointer"
        onClick={() => onToggleExpand(bill.id)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggleExpand(bill.id)
          }
        }}
        aria-expanded={isExpanded}
      >
        <UrgencyDot urgency={bill.urgency} />

        <span
          className="flex-1 min-w-0 font-mono text-xs text-foreground truncate"
          title={bill.name}
        >
          {truncatedName}
        </span>

        {bill.status !== 'ongoing' && <StatusPill status={bill.status} />}

        <MiniGapBar bill={bill} />
        <GapLabel bill={bill} />

        {/* CTA / stance pill */}
        {userStance ? (
          <span
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest border px-2 py-0.5 shrink-0"
            style={{
              color: userStance === 'support' ? '#2ec266' : '#f04747',
              borderColor: userStance === 'support' ? '#0e3020' : '#3a1414',
            }}
            onClick={e => e.stopPropagation()}
          >
            {userStance === 'support' ? <CheckCircle2 size={9} /> : <XCircle size={9} />}
            <span className="hidden sm:inline">{userStance === 'support' ? 'Supporting' : 'Opposing'}</span>
          </span>
        ) : bill.status === 'ongoing' ? (
          <button
            className="shrink-0 border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors hover:opacity-70"
            style={{ borderColor: '#2ec266', color: '#2ec266' }}
            onClick={e => { e.stopPropagation(); openCampaign('support') }}
          >
            Stance
          </button>
        ) : null}

        {isExpanded ? <ChevronUp size={12} className="text-muted-foreground/60 shrink-0" /> : <ChevronDown size={12} className="text-muted-foreground/60 shrink-0" />}
      </div>

      {/* ── Expanded content ──────────────────────────────────────────────────── */}
      {isExpanded && (
        <div className="border-t border-border px-4 py-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200" style={{ background: '#0d0d0e' }}>
          {/* Full title */}
          <h3 className="font-mono text-sm text-foreground leading-snug">{bill.name}</h3>

          {/* Plain English */}
          <blockquote className="font-mono text-xs text-muted-foreground leading-relaxed border border-border/50 px-4 py-3">
            {bill.eli15}
          </blockquote>

          {/* Stage timeline */}
          <BillStageTimeline billId={bill.id} bill={bill} />

          {/* Swing MPs disclosure */}
          {bill.swingMPIds.length > 0 && (
            <div>
              <button
                onClick={() => setSwingOpen(v => !v)}
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {swingOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {bill.swingMPIds.length} swing MPs could decide this
              </button>
              {swingOpen && (
                <div className="mt-3 animate-in fade-in duration-200">
                  <SwingVotePanel
                    billId={bill.id}
                    billName={bill.name}
                    totalFor={bill.totalFor}
                    totalAgainst={bill.totalAgainst}
                  />
                </div>
              )}
            </div>
          )}

          {/* Gap explainer */}
          <GapExplainerPanel bill={bill} parliamentSupport={parlPct} />

          {/* Footer actions */}
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            {bill.status === 'ongoing' && !userStance && (
              <div className="flex gap-2">
                <button
                  onClick={() => openCampaign('support')}
                  className="flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors hover:opacity-70"
                  style={{ borderColor: '#0e3020', color: '#2ec266' }}
                >
                  <CheckCircle2 size={10} /> Support
                </button>
                <button
                  onClick={() => openCampaign('oppose')}
                  className="flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors hover:opacity-70"
                  style={{ borderColor: '#3a1414', color: '#f04747' }}
                >
                  <XCircle size={10} /> Oppose
                </button>
              </div>
            )}
            <button
              onClick={() => onViewChamber(bill.id)}
              className="ml-auto font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors tracking-widest"
            >
              View Chamber →
            </button>
          </div>
        </div>
      )}

      {/* Campaign modal */}
      <CampaignModal
        bill={bill}
        initialStance={initialCampaignStance}
        open={campaignOpen}
        onOpenChange={open => { if (!open) setCampaignOpen(false) }}
        onConfirm={handleCampaignConfirm}
        electorate={electorate}
        pressureSummary={pressureSummary}
      />
    </div>
  )
}
