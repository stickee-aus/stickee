'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, ArrowRight, ChevronRight, ExternalLink } from 'lucide-react'
import {
  ELECTORATE_MP_MAP as mockElectorateMPMap,
  billVoteRows as mockBillVoteRows,
  getMPVoteForBill,
  PARTY_COLORS,
} from '@/lib/mock-parliament-data'
import { MPIndex as mockMPIndex } from '@/lib/mock-data'
import type { MP } from '@/types'
import type { BillVoteRow } from '@/lib/mock-parliament-data'

const FLOW_STEPS = [
  {
    num: 1,
    label: 'You vote in your electorate',
    detail: 'On election day you choose your local representative from the candidates standing in your seat',
  },
  {
    num: 2,
    label: 'Your MP is elected',
    detail: 'The winner takes a seat in the House of Representatives and becomes your voice in Canberra',
  },
  {
    num: 3,
    label: 'Your MP votes on bills',
    detail: 'Bills are debated and voted on — your representative decides how your community\'s interests are represented',
  },
  {
    num: 4,
    label: 'Bills shape national outcomes',
    detail: 'Passed legislation directly affects tax, housing, healthcare, climate policy and every Australian',
  },
]

const VOTE_STYLES: Record<'for' | 'against' | 'absent', { label: string; cls: string }> = {
  for:     { label: 'For',     cls: 'text-emerald-400' },
  against: { label: 'Against', cls: 'text-red-400' },
  absent:  { label: 'Absent',  cls: 'text-muted-foreground' },
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CivicPanelProps {
  electorateMPMap?: Record<string, string>
  memberIndex?: Record<string, MP>
  bills?: BillVoteRow[]
  /** Pre-computed vote map: billId → mpId → 'for'|'against'|'absent' */
  voteMatrix?: Record<string, Record<string, 'for' | 'against' | 'absent'>>
  /** Controlled electorate value (lifted state) */
  selectedElectorate?: string
  onElectorateChange?: (electorate: string) => void
}

export function CivicPanel({
  electorateMPMap,
  memberIndex,
  bills,
  voteMatrix,
  selectedElectorate,
  onElectorateChange,
}: CivicPanelProps) {
  const ELECTORATE_MP_MAP = electorateMPMap ?? mockElectorateMPMap
  const MPIndex = memberIndex ?? mockMPIndex
  const billVoteRows = bills ?? mockBillVoteRows

  const ELECTORATES = Object.keys(ELECTORATE_MP_MAP).sort()

  // Support both controlled and uncontrolled modes
  const [localElectorate, setLocalElectorate] = useState('')
  const electorate = selectedElectorate !== undefined ? selectedElectorate : localElectorate
  function setElectorate(val: string) {
    setLocalElectorate(val)
    onElectorateChange?.(val)
  }

  const mpId = electorate ? ELECTORATE_MP_MAP[electorate] : null
  const mp   = mpId ? MPIndex[mpId] : null
  const partyColor = mp ? (PARTY_COLORS[mp.party] ?? '#999') : '#999'

  const recentVotes = mpId
    ? billVoteRows.map(bill => ({
        bill,
        vote: voteMatrix
          ? (voteMatrix[bill.id]?.[mpId] ?? 'absent')
          : getMPVoteForBill(mpId, bill.id),
      }))
    : []

  const forCount   = recentVotes.filter(v => v.vote === 'for').length
  const totalVotes = recentVotes.filter(v => v.vote !== 'absent').length

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/60 bg-gradient-to-r from-primary/5 to-transparent">
        <h2 className="text-sm font-semibold text-foreground mb-1">How Your Vote Shapes This</h2>
        <p className="text-[11px] text-muted-foreground">
          Follow the chain from ballot box to legislation
        </p>
      </div>

      {/* Flow */}
      <div className="px-5 pt-4 pb-2 border-b border-border/40">
        <div className="space-y-0">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.num} className="flex gap-3">
              {/* Step indicator + connector */}
              <div className="flex flex-col items-center">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary ring-1 ring-primary/30">
                  {step.num}
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <div className="w-px flex-1 bg-gradient-to-b from-primary/20 to-border/20 my-1" style={{ minHeight: 12 }} />
                )}
              </div>
              {/* Text */}
              <div className={i < FLOW_STEPS.length - 1 ? 'pb-3' : 'pb-1'}>
                <p className="text-[11px] font-semibold text-foreground leading-tight">{step.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Electorate selector */}
      <div className="px-5 py-3 border-b border-border/40">
        <label
          htmlFor="electorate-select"
          className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2"
        >
          Find your electorate
        </label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <select
            id="electorate-select"
            className="w-full rounded-md border border-border/60 bg-background pl-8 pr-3 py-2 text-xs text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50"
            value={electorate}
            onChange={e => setElectorate(e.target.value)}
          >
            <option value="">Select electorate…</option>
            {ELECTORATES.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MP card */}
      {mp ? (
        <div className="px-5 py-3 border-b border-border/40 bg-muted/5">
          {/* MP identity */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-foreground">{mp.name}</p>
              <span
                className="inline-block text-[10px] font-bold rounded px-1.5 py-0.5 mt-1"
                style={{ backgroundColor: `${partyColor}1a`, color: partyColor }}
              >
                {mp.party}
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{mp.electorate}</p>
            </div>
            <Link
              href={`/mp/${mp.id}`}
              className="flex items-center gap-0.5 text-[11px] text-primary hover:text-primary/80 transition-colors shrink-0"
            >
              Profile <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Alignment stat */}
          {totalVotes > 0 && (
            <div className="mb-3 rounded-lg bg-muted/20 px-3 py-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-muted-foreground">Prediction alignment</span>
                <span className="text-xs font-bold text-foreground">
                  {Math.round((forCount / totalVotes) * 100)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.round((forCount / totalVotes) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Recent votes */}
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Recent votes
          </p>
          <div className="space-y-1.5">
            {recentVotes.map(({ bill, vote }) => {
              const vStyle = VOTE_STYLES[vote]
              return (
                <div key={bill.id} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-foreground truncate flex-1 leading-snug">
                    {bill.name}
                  </span>
                  <span className={`text-[11px] font-bold shrink-0 ${vStyle.cls}`}>
                    {vStyle.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="px-5 py-6 border-b border-border/40 flex flex-col items-center justify-center text-center">
          <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center mb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Select your electorate above to see<br />your MP and their voting record
          </p>
        </div>
      )}

      {/* CTAs */}
      <div className="px-5 py-3 space-y-2 mt-auto">
        <a
          href="https://www.aec.gov.au/Enrolling_to_vote/Enrolment_stats/electorate/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Find your electorate
          <ExternalLink className="h-3 w-3" />
        </a>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
          onClick={() => {
            document.getElementById('impact-simulator')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          See impact simulator below
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
