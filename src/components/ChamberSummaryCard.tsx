'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, ChevronRight, Zap, BarChart3 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { UnderlineTabs, type UnderlineTabItem } from '@/components/ui/underline-tabs'
import { StatusLabel } from '@/components/ui/status-label'

type Chamber = 'house' | 'senate'

const CHAMBER_TABS: UnderlineTabItem[] = [
  { id: 'house', label: 'House of Reps (150)' },
  { id: 'senate', label: 'Senate (76)' },
]

const HouseChamber = dynamic(
  () => import('@/components/HouseChamber').then(mod => mod.HouseChamber),
  { ssr: false }
)
const SenateView = dynamic(
  () => import('@/components/SenateView').then(mod => mod.SenateView),
  { ssr: false }
)
import { MPDrilldownTable } from '@/components/MPDrilldownTable'
import { ImpactSimulator } from '@/components/ImpactSimulator'
import { ParliamentMap } from '@/components/ParliamentMap'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { BillVoteRow } from '@/lib/mock-parliament-data'
import type { MP } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChamberSummaryCardProps {
  selectedBillId: string | null
  defaultChamber?: Chamber
  members?: MP[]
  memberStates?: Record<string, string>
  bills?: BillVoteRow[]
  voteMatrix?: Record<string, Record<string, 'for' | 'against' | 'absent'>>
}

// ─── Summary text ─────────────────────────────────────────────────────────────

function buildSummary(bill: BillVoteRow | null): string {
  if (!bill) return '150 MPs tracked — select a bill to see votes'
  const margin = bill.totalFor - bill.totalAgainst
  const likely = margin > 0 ? 'likely passes' : 'likely fails'
  const leadParty = Object.values(bill.parties)
    .sort((a, b) => b.forCount - a.forCount)[0]?.party ?? 'Labor'
  return `House: ${leadParty} ${likely} · ${bill.totalFor} for, ${bill.totalAgainst} against`
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ChamberSummaryCard({
  selectedBillId,
  defaultChamber = 'house',
  members,
  memberStates,
  bills,
  voteMatrix,
}: ChamberSummaryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [chamber, setChamber] = useState<Chamber>(defaultChamber)
  const [showMPBreakdown, setShowMPBreakdown] = useState(false)
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)

  const selectedBill = bills?.find(b => b.id === selectedBillId) ?? null
  const isLiveBill = selectedBill?.status === 'ongoing'
  const summaryText = buildSummary(selectedBill)

  return (
    <div className="border border-border overflow-hidden">
      {/* Collapsed header */}
      <button
        className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-card/30 transition-colors"
        onClick={() => setExpanded(v => !v)}
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <p className="text-body-copy truncate font-medium text-foreground">{summaryText}</p>
          <p className="text-metadata mt-0.5 normal-case tracking-normal text-muted-foreground">
            {expanded ? 'Click to collapse' : 'Explore Chamber →'}
          </p>
        </div>
        {isLiveBill && (
          <span className="inline-flex shrink-0 items-center gap-1">
            <Zap size={9} className="text-[var(--status-positive)]" aria-hidden="true" />
            <StatusLabel status="active" label="Live" />
          </span>
        )}
        {expanded
          ? <ChevronUp size={14} className="text-muted-foreground/60 shrink-0" />
          : <ChevronDown size={14} className="text-muted-foreground/60 shrink-0" />
        }
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-border/30 animate-in fade-in duration-200">
          {/* Controls row */}
          <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3 flex-wrap">
            <UnderlineTabs items={CHAMBER_TABS} value={chamber} onChange={value => setChamber(value as Chamber)} />
            <div className="flex items-center gap-2">
              {selectedBillId && (
                <button
                  onClick={() => setSimulatorOpen(true)}
                  className="transition-calm flex items-center gap-1.5 border border-border px-3 py-1.5 text-micro-label text-muted-foreground hover:text-foreground hover:border-foreground/30"
                >
                  <BarChart3 size={11} />
                  Simulate
                </button>
              )}
              <button
                onClick={() => setMapOpen(true)}
                className="transition-calm text-micro-label text-muted-foreground/60 hover:text-muted-foreground"
              >
                Map
              </button>
            </div>
          </div>

          {/* Chamber visualisation */}
          <div className="px-4 pb-4">
            <div className="transition-all duration-200">
              {chamber === 'house' ? (
                <HouseChamber selectedBillId={selectedBillId} />
              ) : (
                <SenateView selectedBillId={selectedBillId} />
              )}
            </div>

            {/* MP breakdown — House only */}
            {selectedBillId && chamber === 'house' && (
              <div className="mt-3">
                <button
                  onClick={() => setShowMPBreakdown(v => !v)}
                  aria-expanded={showMPBreakdown}
                  className="transition-calm flex items-center gap-2 py-1 text-micro-label text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight
                    size={13}
                    className={showMPBreakdown ? 'rotate-90' : ''}
                    aria-hidden="true"
                  />
                  {showMPBreakdown ? 'Hide' : 'View'} individual MP breakdown
                </button>

                {showMPBreakdown && (
                  <div className="mt-2 animate-in fade-in duration-200">
                    <MPDrilldownTable
                      billId={selectedBillId}
                      onClose={() => setShowMPBreakdown(false)}
                      members={members}
                      bills={bills}
                      memberStates={memberStates}
                      voteMap={voteMatrix?.[selectedBillId]}
                    />
                  </div>
                )}
              </div>
            )}

            {chamber === 'senate' && (
              <p className="text-metadata mt-2 normal-case tracking-normal text-muted-foreground/60">
                Switch to House to see individual MP breakdown
              </p>
            )}
          </div>
        </div>
      )}

      {/* Impact simulator dialog */}
      <Dialog open={simulatorOpen} onOpenChange={setSimulatorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Impact Simulator</DialogTitle>
          </DialogHeader>
          <ImpactSimulator />
        </DialogContent>
      </Dialog>

      {/* Parliament map dialog */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Parliament Seat Map</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <ParliamentMap />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
