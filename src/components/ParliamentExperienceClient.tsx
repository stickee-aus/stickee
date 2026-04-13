'use client'

import { useState, useEffect, useMemo } from 'react'
import { PriorityBillFocus } from '@/components/PriorityBillFocus'
import { BillSmartRow } from '@/components/BillSmartRow'
import { MPActionStrip } from '@/components/MPActionStrip'
import { ChamberSummaryCard } from '@/components/ChamberSummaryCard'
import { TwoHousesExplainer } from '@/components/TwoHousesExplainer'
import { useElectorate } from '@/hooks/useElectorate'
import { useStreak } from '@/hooks/useStreak'
import {
  billVoteRows as mockBillRows,
  selectTodaysAction,
  ELECTORATE_MP_MAP as mockElectorateMPMap,
  type BillUrgency,
} from '@/lib/mock-parliament-data'
import { MPIndex as mockMPIndex } from '@/lib/mock-data'
import type { MP } from '@/types'
import type { BillVoteRow } from '@/lib/mock-parliament-data'
import type { PressureSummary } from '@/app/api/bills/pressure-summary/route'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParliamentExperienceClientProps {
  members?:         MP[]
  memberIndex?:     Record<string, MP>
  memberStates?:    Record<string, string>
  electorateMPMap?: Record<string, string>
  bills?:           BillVoteRow[]
  voteMatrix?:      Record<string, Record<string, 'for' | 'against' | 'absent'>>
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 w-px" style={{ background: '#2ec266' }} />
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

// ─── Bill sorting ─────────────────────────────────────────────────────────────

const URGENCY_SORT_SCORE: Record<BillUrgency, number> = {
  'swing-vote': 4,
  'highly-contested': 3,
  'closing-soon': 2,
  'just-moved': 1,
}

function sortBills(bills: BillVoteRow[]): BillVoteRow[] {
  return [...bills].sort((a, b) => {
    if (a.status === 'ongoing' && b.status !== 'ongoing') return -1
    if (b.status === 'ongoing' && a.status !== 'ongoing') return 1
    const au = a.urgency ? URGENCY_SORT_SCORE[a.urgency] : 0
    const bu = b.urgency ? URGENCY_SORT_SCORE[b.urgency] : 0
    if (au !== bu) return bu - au
    if (a.daysUntilVote !== undefined && b.daysUntilVote !== undefined) return a.daysUntilVote - b.daysUntilVote
    if (a.daysUntilVote !== undefined) return -1
    if (b.daysUntilVote !== undefined) return 1
    return b.controversy - a.controversy
  })
}

// ─── Education accordion ──────────────────────────────────────────────────────

function EducationAccordion() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 w-full border border-border px-5 py-4 text-left hover:bg-card/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Learn how parliament works
          </p>
          <p className="font-mono text-[9px] text-muted-foreground/50 mt-0.5">
            How a bill becomes law · House vs Senate explained
          </p>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/40 shrink-0">{open ? '↑' : '↓'}</span>
      </button>

      {open && (
        <div className="border border-t-0 border-border animate-in fade-in slide-in-from-top-2 duration-200">
          <TwoHousesExplainer />
        </div>
      )}
    </div>
  )
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type BillFilter = 'all' | 'ongoing' | 'passed' | 'most-urgent'

const FILTER_LABELS: Record<BillFilter, string> = {
  'all': 'All',
  'ongoing': 'Ongoing',
  'passed': 'Passed',
  'most-urgent': 'Most Urgent',
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ParliamentExperienceClient({
  members,
  memberIndex,
  memberStates,
  electorateMPMap,
  bills,
  voteMatrix,
}: ParliamentExperienceClientProps) {
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null)
  const [chamberBillId, setChamberBillId] = useState<string | null>(null)
  const [activeBillFilter, setActiveBillFilter] = useState<BillFilter>('all')
  const [pressureSummaries, setPressureSummaries] = useState<PressureSummary[]>([])
  const [allCampaigns, setAllCampaigns] = useState<Record<string, 'support' | 'oppose'>>({})

  const { streak, recordAction } = useStreak()
  const {
    electorate,
    mp: electorateMP,
    setElectorate,
    clearElectorate,
    detectByLocation,
  } = useElectorate()

  const houseBills = bills ?? mockBillRows
  const MPIndex = memberIndex ?? mockMPIndex
  const ELECTORATE_MP_MAP = electorateMPMap ?? mockElectorateMPMap

  const legacyElectorateMP = electorateMP ?? (
    electorate ? (MPIndex[ELECTORATE_MP_MAP[electorate] ?? ''] ?? null) : null
  )

  const sortedBills = useMemo(() => sortBills(houseBills), [houseBills])
  const priorityBill = useMemo(() => selectTodaysAction(houseBills, allCampaigns), [houseBills, allCampaigns])

  const filteredBills = useMemo(() => {
    switch (activeBillFilter) {
      case 'ongoing':     return sortedBills.filter(b => b.status === 'ongoing')
      case 'passed':      return sortedBills.filter(b => b.status === 'passed')
      case 'most-urgent': return sortedBills.filter(b => b.urgency === 'swing-vote' || b.urgency === 'closing-soon')
      default:            return sortedBills
    }
  }, [sortedBills, activeBillFilter])

  // Read campaigns from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('stickee:campaigns')
      if (stored) setAllCampaigns(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  // Fetch pressure summaries once on mount
  useEffect(() => {
    fetch('/api/bills/pressure-summary')
      .then(r => r.ok ? r.json() as Promise<PressureSummary[]> : Promise.resolve([]))
      .then(setPressureSummaries)
      .catch(() => { /* fall back to mock counts */ })
  }, [])

  function getPressureSummary(billId: string): PressureSummary | null {
    return pressureSummaries.find(s => s.billId === billId) ?? null
  }

  // Single source of truth for stance updates
  function handleStanceTaken(billId: string, stance: 'support' | 'oppose') {
    const next = { ...allCampaigns, [billId]: stance }
    setAllCampaigns(next)
    try { localStorage.setItem('stickee:campaigns', JSON.stringify(next)) } catch { /* ignore */ }
    recordAction()
  }

  return (
    <div className="space-y-8">

      {/* ── 1. PRIORITY FOCUS ───────────────────────────────────────────────── */}
      {priorityBill && (
        <PriorityBillFocus
          bill={priorityBill}
          pressureSummary={getPressureSummary(priorityBill.id)}
          mp={legacyElectorateMP}
          electorate={electorate}
          userStance={allCampaigns[priorityBill.id] ?? null}
          streakCount={streak.count}
          isActiveToday={streak.isActiveToday}
          allCampaigns={allCampaigns}
          voteMatrix={voteMatrix}
          onTakeStance={handleStanceTaken}
        />
      )}

      {/* ── 2. BILL FEED ────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <SectionDivider label="Active Bills" />

          {/* Filter tabs */}
          <div className="flex items-center gap-5">
            {(Object.keys(FILTER_LABELS) as BillFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setActiveBillFilter(f)}
                className="relative pb-3 font-mono text-[10px] uppercase tracking-wider transition-colors"
                style={{ color: activeBillFilter === f ? '#e8e8e6' : '#5a5a5e' }}
              >
                {FILTER_LABELS[f]}
                {activeBillFilter === f && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: '#e8e8e6' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {filteredBills.length === 0 ? (
          <div className="border border-border px-4 py-8 text-center">
            <p className="font-mono text-xs text-muted-foreground">No bills match this filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-border border border-border overflow-hidden">
            {filteredBills.map(bill => (
              <BillSmartRow
                key={bill.id}
                bill={bill}
                pressureSummary={getPressureSummary(bill.id)}
                electorate={electorate}
                mpName={legacyElectorateMP?.name ?? null}
                isExpanded={expandedBillId === bill.id}
                userStance={allCampaigns[bill.id] ?? null}
                onToggleExpand={id => setExpandedBillId(prev => prev === id ? null : id)}
                onStanceTaken={handleStanceTaken}
                onViewChamber={id => {
                  setChamberBillId(id)
                  // Scroll to chamber section
                  setTimeout(() => {
                    document.getElementById('chamber-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }, 100)
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 3. YOUR MP ──────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionDivider label="Your Rep" />
        <MPActionStrip
          mp={legacyElectorateMP}
          electorate={electorate}
          bills={houseBills}
          voteMatrix={voteMatrix}
          allCampaigns={allCampaigns}
          onDetectByLocation={detectByLocation}
          onManualSetElectorate={setElectorate}
          onClearElectorate={clearElectorate}
        />
      </section>

      {/* ── 4. CHAMBER ──────────────────────────────────────────────────────── */}
      <section className="space-y-3" id="chamber-section">
        <SectionDivider label="Chamber" />
        <ChamberSummaryCard
          selectedBillId={chamberBillId}
          members={members}
          memberStates={memberStates}
          bills={houseBills}
          voteMatrix={voteMatrix}
        />
      </section>

      {/* ── 5. EDUCATION (collapsed) ────────────────────────────────────────── */}
      <EducationAccordion />

    </div>
  )
}
