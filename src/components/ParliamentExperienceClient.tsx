'use client'

import { useState, useEffect, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { PriorityBillFocus } from '@/components/PriorityBillFocus'
import { MPActionStrip } from '@/components/MPActionStrip'
import { ChamberSummaryCard } from '@/components/ChamberSummaryCard'
import { TwoHousesExplainer } from '@/components/TwoHousesExplainer'
import { SectionHeader } from '@/components/ui/section-header'
import { RecordRow } from '@/components/ui/record-row'
import { StatusLabel } from '@/components/ui/status-label'
import { LinkButton } from '@/components/LinkButton'
import { EmptyState } from '@/components/ui/empty-state'
import { useElectorate } from '@/hooks/useElectorate'
import {
  billVoteRows as mockBillRows,
  selectTodaysAction,
  parliamentSupportPct,
  ELECTORATE_MP_MAP as mockElectorateMPMap,
} from '@/lib/mock-parliament-data'
import { MPIndex as mockMPIndex } from '@/lib/mock-data'
import type { MP } from '@/types'
import type { BillVoteRow } from '@/lib/mock-parliament-data'
import type { PressureSummary } from '@/app/api/bills/pressure-summary/route'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParliamentExperienceClientProps {
  hasVerifiedData: boolean
  members?:         MP[]
  memberIndex?:     Record<string, MP>
  memberStates?:    Record<string, string>
  electorateMPMap?: Record<string, string>
  bills?:           BillVoteRow[]
  voteMatrix?:      Record<string, Record<string, 'for' | 'against' | 'absent'>>
}

// ─── Education accordion ──────────────────────────────────────────────────────

function EducationAccordion() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="transition-calm flex w-full items-center gap-2 border border-border px-5 py-4 text-left hover:bg-muted/40"
      >
        <div className="flex-1 min-w-0">
          <p className="text-micro-label">How Parliament works</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">
            How a bill becomes law · House vs Senate explained
          </p>
        </div>
        <ChevronDown size={14} className={open ? 'rotate-180 shrink-0 text-muted-foreground/40' : 'shrink-0 text-muted-foreground/40'} aria-hidden="true" />
      </button>

      {open && (
        <div className="border border-t-0 border-border">
          <TwoHousesExplainer />
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ParliamentExperienceClient({
  hasVerifiedData,
  members,
  memberIndex,
  memberStates,
  electorateMPMap,
  bills,
  voteMatrix,
}: ParliamentExperienceClientProps) {
  const [pressureSummaries, setPressureSummaries] = useState<PressureSummary[]>([])
  const [allCampaigns, setAllCampaigns] = useState<Record<string, 'support' | 'oppose'>>({})

  const {
    electorate,
    mp: electorateMP,
    detectState,
    suggestedElectorate,
    setElectorate,
    clearElectorate,
    detectByLocation,
    confirmSuggestedElectorate,
    rejectSuggestedElectorate,
  } = useElectorate()

  // Data source classification — surfaced to the reader via MetadataLine/StatusLabel
  // wherever a claim on this page depends on it. Never silently treated as equivalent.
  const source: 'database' | 'mock' = bills && bills.length > 0 ? 'database' : 'mock'

  const houseBills = bills ?? mockBillRows
  const MPIndex = memberIndex ?? mockMPIndex
  const ELECTORATE_MP_MAP = electorateMPMap ?? mockElectorateMPMap

  const legacyElectorateMP = electorateMP ?? (
    electorate ? (MPIndex[ELECTORATE_MP_MAP[electorate] ?? ''] ?? null) : null
  )

  const priorityBill = useMemo(() => selectTodaysAction(houseBills, allCampaigns), [houseBills, allCampaigns])
  const otherBills = useMemo(
    () => houseBills.filter(b => b.id !== priorityBill?.id).slice(0, 3),
    [houseBills, priorityBill]
  )

  // Read campaigns from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('stickee:campaigns')
      if (stored) setAllCampaigns(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  // Fetch pressure summaries only when the page has verified parliamentary
  // records to attach them to. Demo/offline mode must not imply a live tally.
  useEffect(() => {
    if (!hasVerifiedData) return

    fetch('/api/bills/pressure-summary')
      .then(r => r.ok ? r.json() as Promise<PressureSummary[]> : Promise.resolve([]))
      .then(setPressureSummaries)
      .catch(() => { /* real count unavailable — components fall back to an honest zero */ })
  }, [hasVerifiedData])

  function getPressureSummary(billId: string): PressureSummary | null {
    return pressureSummaries.find(s => s.billId === billId) ?? null
  }

  // Single source of truth for stance updates
  function handleStanceTaken(billId: string, stance: 'support' | 'oppose') {
    const next = { ...allCampaigns, [billId]: stance }
    setAllCampaigns(next)
    try { localStorage.setItem('stickee:campaigns', JSON.stringify(next)) } catch { /* ignore */ }
  }

  return (
    <div className="space-y-10">

      {/* ── 1. CURRENT PARLIAMENTARY ACTIVITY ──────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader title="Current parliamentary activity" />

        {!hasVerifiedData ? (
          <EmptyState
            variant="no-data"
            title="No verified parliamentary activity is available."
            description="Stickee will show bills and recorded votes here once the parliamentary data source is connected and verified."
          />
        ) : priorityBill ? (
          <PriorityBillFocus
            bill={priorityBill}
            pressureSummary={getPressureSummary(priorityBill.id)}
            mp={legacyElectorateMP}
            electorate={electorate}
            userStance={allCampaigns[priorityBill.id] ?? null}
            source={source}
            onTakeStance={handleStanceTaken}
          />
        ) : (
          <EmptyState
            variant="no-data"
            title="No active parliamentary item right now"
            description="Check back once a new bill is before the House."
          />
        )}

        {hasVerifiedData && otherBills.length > 0 && (
          <div role="list">
            {otherBills.map(bill => {
              const parlPct = parliamentSupportPct(bill)
              return (
                <div role="listitem" key={bill.id}>
                  <RecordRow
                    label={bill.name}
                    meta={`${bill.totalFor} for · ${bill.totalAgainst} against`}
                    value={<span className="font-mono text-sm text-foreground">{parlPct}%</span>}
                    status={bill.status !== 'ongoing' ? (
                      <StatusLabel status={bill.status === 'passed' ? 'passed' : 'voided'} label={bill.status === 'passed' ? 'Passed' : 'Failed'} />
                    ) : undefined}
                  />
                </div>
              )
            })}
          </div>
        )}

        <LinkButton href="/issues" variant="outline" size="sm">
          View all issues →
        </LinkButton>
      </section>

      {/* ── 2. YOUR REPRESENTATIVE ──────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader title="Your representative" />
        {hasVerifiedData ? (
          <MPActionStrip
            mp={legacyElectorateMP}
            electorate={electorate}
            detectState={detectState}
            suggestedElectorate={suggestedElectorate}
            onDetectByLocation={detectByLocation}
            onManualSetElectorate={setElectorate}
            onClearElectorate={clearElectorate}
            onConfirmSuggested={confirmSuggestedElectorate}
            onRejectSuggested={rejectSuggestedElectorate}
          />
        ) : (
          <EmptyState
            variant="no-data"
            title="Representative lookup is temporarily unavailable."
            description="No verified representative data is connected in this preview."
          />
        )}
      </section>

      {/* ── 3. PARLIAMENT (CHAMBER) ─────────────────────────────────────────── */}
      <section className="space-y-4" id="chamber-section">
        <SectionHeader title="Parliament" />
        {hasVerifiedData ? (
          <ChamberSummaryCard
            selectedBillId={priorityBill?.id ?? null}
            members={members}
            memberStates={memberStates}
            bills={houseBills}
            voteMatrix={voteMatrix}
          />
        ) : (
          <EmptyState
            variant="no-data"
            title="No verified chamber data is available."
            description="The chamber view will return when member and division records can be verified."
          />
        )}
      </section>

      {/* ── 4. RELATED ───────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionHeader title="Related" />
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/issues" variant="outline">Full issue &amp; bill catalogue</LinkButton>
          <LinkButton href="/leaders" variant="outline">All representatives</LinkButton>
        </div>
      </section>

      {/* ── 5. EDUCATION (collapsed) ────────────────────────────────────────── */}
      <EducationAccordion />

    </div>
  )
}
