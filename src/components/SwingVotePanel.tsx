'use client'

import { useState } from 'react'
import { Target, Mail, Flame, ChevronDown, ChevronUp, Users, TrendingUp, TrendingDown } from 'lucide-react'
import { PARTY_COLORS } from '@/lib/mock-data'
import { SWING_MPS_DATA, type SwingMP, type SwingLean } from '@/lib/mock-parliament-data'
import { getMomentumFrame } from '@/components/BillCampaignCard'
import { EmailMPModal } from '@/components/EmailMPModal'
import type { Issue } from '@/types'

// ─── Lean badge ────────────────────────────────────────────────────────────────

function LeanBadge({ lean }: { lean: SwingLean }) {
  if (lean === 'leaning-for') return (
    <span className="font-mono text-[9px] uppercase tracking-widest border px-1.5 py-0.5" style={{ color: '#2ec266', borderColor: '#0e3020' }}>
      For
    </span>
  )
  if (lean === 'leaning-against') return (
    <span className="font-mono text-[9px] uppercase tracking-widest border px-1.5 py-0.5" style={{ color: '#f04747', borderColor: '#3a1414' }}>
      Against
    </span>
  )
  return (
    <span className="font-mono text-[9px] uppercase tracking-widest border px-1.5 py-0.5" style={{ color: '#f5a623', borderColor: '#3a2e10' }}>
      Undecided
    </span>
  )
}

// ─── Strategic impact badge ────────────────────────────────────────────────────

function StrategicBadge({ impact }: { impact: SwingMP['strategicImpact'] }) {
  if (impact === 'decisive') return (
    <span className="flex items-center gap-0.5 font-mono text-[9px] uppercase tracking-widest border px-1.5 py-0.5" style={{ color: '#f04747', borderColor: '#3a1414' }}>
      <Flame size={7} /> Decisive
    </span>
  )
  if (impact === 'significant') return (
    <span className="font-mono text-[9px] uppercase tracking-widest border px-1.5 py-0.5" style={{ color: '#f5a623', borderColor: '#3a2e10' }}>
      Significant
    </span>
  )
  return (
    <span className="font-mono text-[9px] uppercase tracking-widest border px-1.5 py-0.5" style={{ color: '#5a5a5e', borderColor: '#1e1e20' }}>
      Symbolic
    </span>
  )
}

// ─── Pressure bar ──────────────────────────────────────────────────────────────

function PressureBar({ value }: { value: number }) {
  const color = value >= 60 ? '#f97316' : value >= 40 ? '#f5a623' : '#3a3a3e'
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-px bg-border overflow-hidden" style={{ height: '3px' }}>
        <div className="h-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="font-mono text-[9px] text-muted-foreground shrink-0 w-5 text-right">{value}</span>
    </div>
  )
}

// ─── Single MP card ────────────────────────────────────────────────────────────

function SwingMPCard({ mp, billName, onEmail }: { mp: SwingMP; billName: string; onEmail: (mp: SwingMP) => void }) {
  const [expanded, setExpanded] = useState(false)
  const partyColor = PARTY_COLORS[mp.party] ?? '#999'
  const partyShort = mp.party === "Katter's Australian Party" ? 'KAP'
    : mp.party === 'Centre Alliance' ? 'CA'
    : mp.party

  const borderColor = mp.strategicImpact === 'decisive' ? '#3a1414'
    : mp.strategicImpact === 'significant' ? '#3a2e10'
    : '#1e1e20'

  return (
    <div className="border flex flex-col" style={{ borderColor }}>
      <div className="p-3 space-y-2 flex-1">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 flex items-center justify-center font-mono text-[9px] font-medium shrink-0"
            style={{ background: `${partyColor}20`, color: partyColor }}
          >
            {mp.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] text-foreground truncate leading-tight">{mp.name}</p>
            <p className="font-mono text-[9px] text-muted-foreground truncate">{mp.electorate}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1 flex-wrap">
          <span
            className="font-mono text-[9px] uppercase tracking-widest border px-1 py-0.5"
            style={{ borderColor: `${partyColor}40`, color: partyColor }}
          >
            {partyShort}
          </span>
          <LeanBadge lean={mp.lean} />
          <StrategicBadge impact={mp.strategicImpact} />
        </div>

        {/* Recent change */}
        {mp.recentStanceChange && (
          <p className="font-mono text-[9px]" style={{ color: '#f5a623' }}>
            ⚡ {mp.recentStanceChange}
          </p>
        )}

        {/* Reason */}
        <p className="font-mono text-[10px] text-muted-foreground leading-snug">{mp.reason}</p>

        {/* Pressure */}
        <div>
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/50">Pressure</span>
          <PressureBar value={mp.pressureReceived} />
        </div>

        {/* Momentum */}
        {(() => {
          const frame = getMomentumFrame(mp.contactCount, mp.weeklyContactGrowth ?? 0, null)
          const color = frame.color === 'rising' ? '#2ec266' : frame.color === 'falling' ? '#f04747' : '#5a5a5e'
          return (
            <div className="flex items-center gap-1 font-mono text-[9px]" style={{ color }}>
              <Users size={8} className="shrink-0" />
              {frame.arrow === 'up' && <TrendingUp size={8} />}
              {frame.arrow === 'down' && <TrendingDown size={8} />}
              <span>{frame.primary}</span>
              {frame.secondary && <span className="text-muted-foreground ml-0.5">· {frame.secondary}</span>}
            </div>
          )
        })()}

        {/* Expanded detail */}
        {expanded && (
          <div className="pt-2 border-t border-border space-y-1 animate-in fade-in duration-150">
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Why this MP matters</p>
            <p className="font-mono text-[10px] text-muted-foreground leading-snug">
              {mp.strategicImpact === 'decisive'
                ? `This vote may hinge on ${mp.name.split(' ')[0]}. A flip here changes the outcome.`
                : mp.strategicImpact === 'significant'
                ? `${mp.name.split(' ')[0]}'s vote adds weight. Changing their position strengthens the margin.`
                : `${mp.name.split(' ')[0]}'s vote won't change the outcome, but shapes the message parliament sends.`}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-1 px-3 pb-3">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center justify-center gap-1 border border-border px-2 py-1.5 font-mono text-[10px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
        <button
          onClick={() => onEmail(mp)}
          className="flex-1 flex items-center justify-center gap-1.5 border px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors hover:opacity-70"
          style={{ borderColor: '#0e3020', color: '#2ec266' }}
        >
          <Mail size={10} />
          Contact
        </button>
      </div>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface SwingVotePanelProps {
  billId: string
  billName: string
  totalFor: number
  totalAgainst: number
}

function makeIssue(billName: string, swingMp: SwingMP): Issue {
  return {
    id: 'swing-vote',
    title: billName,
    summary: `${swingMp.name} (${swingMp.electorate}) is currently ${swingMp.lean === 'undecided' ? 'undecided' : swingMp.lean === 'leaning-for' ? 'leaning in favour of' : 'leaning against'} this bill. ${swingMp.reason}.`,
    content: '',
    whatIsHappening: '',
    whoSupports: '',
    whoOpposes: '',
    status: 'active',
  }
}

export function SwingVotePanel({ billId, billName, totalFor, totalAgainst }: SwingVotePanelProps) {
  const swingMPs = SWING_MPS_DATA[billId] ?? []
  const [emailTarget, setEmailTarget] = useState<SwingMP | null>(null)

  if (swingMPs.length === 0) return null

  const undecidedCount = swingMPs.filter(m => m.lean === 'undecided').length
  const decisive = swingMPs.filter(m => m.strategicImpact === 'decisive')
  const margin = Math.abs(totalFor - totalAgainst)
  const isClose = margin <= 10

  return (
    <div className="border p-4" style={{ borderColor: '#3a2e10' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-2">
          <Target size={13} className="mt-0.5 shrink-0" style={{ color: '#f5a623' }} />
          <div>
            <p className="font-mono text-xs text-foreground font-medium leading-tight">Deciding Votes</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
              {swingMPs.length} MPs could swing this · {undecidedCount} undecided
              {isClose && <span className="ml-2" style={{ color: '#f04747' }}>· Margin: {margin} seats</span>}
            </p>
          </div>
        </div>
        {decisive.length > 0 && (
          <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest border px-2 py-0.5 shrink-0" style={{ color: '#f04747', borderColor: '#3a1414' }}>
            <Flame size={9} /> {decisive.length} decisive
          </span>
        )}
      </div>

      {/* Tight margin alert */}
      {isClose && (
        <div className="mb-3 border-l-2 border-red-500 pl-3 py-1">
          <p className="font-mono text-[10px]" style={{ color: '#f04747' }}>Knife-edge vote</p>
          <p className="font-mono text-[10px] text-muted-foreground mt-0.5">
            Margin: {margin} seat{margin !== 1 ? 's' : ''}. One decisive MP flips the outcome.
          </p>
        </div>
      )}

      {/* MP grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {swingMPs.map(mp => (
          <SwingMPCard key={mp.id} mp={mp} billName={billName} onEmail={setEmailTarget} />
        ))}
      </div>

      {emailTarget && (
        <EmailMPModal
          issue={makeIssue(billName, emailTarget)}
          open={!!emailTarget}
          onOpenChange={open => { if (!open) setEmailTarget(null) }}
        />
      )}
    </div>
  )
}
