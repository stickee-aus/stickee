'use client'

import { useState } from 'react'
import { Mail, MapPin, RotateCcw, CheckCircle2, XCircle, Minus } from 'lucide-react'
import { EmailMPModal } from '@/components/EmailMPModal'
import { getMPVoteForBill, PARTY_COLORS } from '@/lib/mock-parliament-data'
import type { BillVoteRow } from '@/lib/mock-parliament-data'
import type { MP, Issue } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MPActionStripProps {
  mp: MP | null
  electorate: string | null
  bills: BillVoteRow[]
  voteMatrix?: Record<string, Record<string, 'for' | 'against' | 'absent'>>
  allCampaigns: Record<string, 'support' | 'oppose'>
  onDetectByLocation: () => void
  onManualSetElectorate: (e: string) => void
  onClearElectorate: () => void
}

// ─── Alignment dial ───────────────────────────────────────────────────────────

function AlignmentDial({ pct }: { pct: number }) {
  const color = pct >= 60 ? '#2ec266' : pct >= 40 ? '#f5a623' : '#f04747'
  const label = pct >= 60 ? 'Strong' : pct >= 40 ? 'Moderate' : 'Low'
  return (
    <div className="flex flex-col items-end gap-0.5 shrink-0">
      <span className="font-mono text-xl tabular-nums" style={{ color }}>{pct}%</span>
      <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#5a5a5e' }}>{label} align</span>
    </div>
  )
}

// ─── Electorate prompt ────────────────────────────────────────────────────────

function ElectoratePrompt({
  onDetect,
  onManual,
}: {
  onDetect: () => void
  onManual: (e: string) => void
}) {
  const [manualMode, setManualMode] = useState(false)
  const [input, setInput] = useState('')

  function handleManualSubmit() {
    if (input.trim()) onManual(input.trim())
  }

  return (
    <div className="border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={12} className="shrink-0" style={{ color: '#2ec266' }} />
        <p className="font-mono text-xs uppercase tracking-widest text-foreground">Find Your MP</p>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground mb-4 leading-relaxed">
        See how your representative votes on these bills and whether they align with your positions.
      </p>

      {manualMode ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
            placeholder="e.g. Kooyong, Warringah"
            className="flex-1 border border-border bg-background px-3 py-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-foreground/40 focus:outline-none transition-colors"
            autoFocus
          />
          <button
            onClick={handleManualSubmit}
            className="border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-foreground hover:border-foreground/50 transition-colors"
          >
            Go
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onDetect}
            className="flex-1 flex items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors hover:opacity-70"
            style={{ borderColor: '#0e3020', color: '#2ec266' }}
          >
            <MapPin size={10} />
            Detect
          </button>
          <button
            onClick={() => setManualMode(true)}
            className="flex-1 border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            Manual
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MPActionStrip({
  mp,
  electorate,
  bills,
  voteMatrix,
  allCampaigns,
  onDetectByLocation,
  onManualSetElectorate,
  onClearElectorate,
}: MPActionStripProps) {
  const [emailOpen, setEmailOpen] = useState(false)

  if (!mp || !electorate) {
    return (
      <ElectoratePrompt
        onDetect={onDetectByLocation}
        onManual={onManualSetElectorate}
      />
    )
  }

  const partyColor = PARTY_COLORS[mp.party] ?? '#999'

  // Build comparisons (same logic as MPAlignmentPanel)
  const comparisons = bills.map(bill => {
    const mpVote = voteMatrix?.[bill.id]?.[mp.id] ?? getMPVoteForBill(mp.id, bill.id)
    const userStance = allCampaigns[bill.id] ?? null
    let match: 'agree' | 'disagree' | 'unknown' = 'unknown'
    if (userStance && mpVote !== 'absent') {
      match = (userStance === 'support') === (mpVote === 'for') ? 'agree' : 'disagree'
    }
    return { bill, mpVote, userStance, match }
  })

  const votedComparisons = comparisons.filter(c => c.match !== 'unknown')
  const agreeCount = votedComparisons.filter(c => c.match === 'agree').length
  const alignmentPct = votedComparisons.length > 0
    ? Math.round((agreeCount / votedComparisons.length) * 100)
    : null

  // Top 2 disagreements
  const disagreements = comparisons
    .filter(c => c.match === 'disagree')
    .slice(0, 2)

  const emailIssue: Issue = {
    id: 'mp-alignment',
    title: `Your voting record in ${mp.electorate}`,
    summary: `I have been tracking your votes on key legislation. Based on recent bills, I agree with your position ${alignmentPct ?? 0}% of the time. I would like to discuss the areas where our views differ.`,
    content: '',
    whatIsHappening: '',
    whoSupports: '',
    whoOpposes: '',
    status: 'active',
  }

  return (
    <div className="border border-border overflow-hidden">
      {/* MP header */}
      <div
        className="px-4 py-3 border-b border-border border-l-2"
        style={{ borderLeftColor: partyColor }}
      >
        <div className="flex items-center gap-3">
          {/* Initials square instead of avatar */}
          <div
            className="h-9 w-9 flex items-center justify-center font-mono text-[11px] font-medium shrink-0"
            style={{ background: `${partyColor}18`, color: partyColor }}
          >
            {mp.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs text-foreground font-medium truncate">{mp.name}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{mp.electorate}</p>
            <span
              className="inline-block font-mono text-[9px] tracking-widest uppercase border px-1.5 py-0.5 mt-0.5"
              style={{ borderColor: `${partyColor}40`, color: partyColor }}
            >
              {mp.party}
            </span>
          </div>
          {alignmentPct !== null && <AlignmentDial pct={alignmentPct} />}
        </div>
      </div>

      {/* Disagreements */}
      {disagreements.length > 0 ? (
        <div className="px-4 py-3 space-y-1.5 border-b border-border/30">
          {disagreements.map(({ bill, mpVote }) => {
            const mpLabel = mpVote === 'for' ? 'voted FOR' : 'voted AGAINST'
            const userLabel = allCampaigns[bill.id] === 'support' ? 'you supported' : 'you opposed'
            return (
              <div key={bill.id} className="flex items-start gap-2">
                <XCircle size={11} className="text-red-400 shrink-0 mt-0.5" />
                <p className="font-mono text-[10px] text-muted-foreground leading-snug">
                  MP <span className={mpVote === 'for' ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>{mpLabel}</span> {bill.name.length > 30 ? bill.name.slice(0, 30) + '…' : bill.name} — {userLabel}
                </p>
              </div>
            )
          })}
        </div>
      ) : votedComparisons.length === 0 ? (
        <div className="px-4 py-3 border-b border-border/30">
          <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
            <Minus size={11} />
            Take positions on bills to see alignment
          </p>
        </div>
      ) : (
        <div className="px-4 py-3 border-b border-border/30">
          <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
            <CheckCircle2 size={11} className="text-emerald-400" />
            Your MP aligns with all your positions
          </p>
        </div>
      )}

      {/* Footer actions */}
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setEmailOpen(true)}
          className="flex flex-1 items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors hover:opacity-70"
          style={{ borderColor: '#0e3020', color: '#2ec266' }}
        >
          <Mail size={10} />
          Contact {mp.name.split(' ')[0]}
        </button>
        <button
          onClick={onClearElectorate}
          className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors shrink-0"
        >
          <RotateCcw size={10} />
          Change
        </button>
      </div>

      <EmailMPModal
        issue={emailIssue}
        open={emailOpen}
        onOpenChange={setEmailOpen}
      />
    </div>
  )
}
