'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'
import { PARTY_COLORS } from '@/lib/mock-parliament-data'
import type { BillVoteRow } from '@/lib/mock-parliament-data'

// ─── Gap explanation generator ────────────────────────────────────────────────

function generateGapExplanation(bill: BillVoteRow, gap: number): string {
  const absGap = Math.abs(gap)
  // Identify majority party
  const forParties = Object.values(bill.parties).filter(p => p.direction === 'for' || (p.direction === 'split' && p.forCount > p.againstCount))
  const biggestForParty = forParties.sort((a, b) => b.forCount - a.forCount)[0]?.party ?? 'major parties'

  const againstParties = Object.values(bill.parties).filter(p => p.direction === 'against' || (p.direction === 'split' && p.againstCount > p.forCount))
  const biggestAgainstParty = againstParties.sort((a, b) => b.againstCount - a.forCount)[0]?.party

  if (gap < -20) {
    return `Parliament is well ahead of public opinion. ${biggestForParty} party discipline is driving strong parliamentary support, while many Australians remain uncertain about the detail.`
  }
  if (gap < -10) {
    return `Parliament leads public support by ${absGap}pts. ${biggestForParty} backing is firm, but public hesitation — often around implementation costs or fairness — is keeping the gap wide.`
  }
  if (gap < -5) {
    return `A modest gap exists — parliament is slightly more supportive than the public. This often reflects party commitments made before constituents fully engaged with the issue.`
  }
  if (absGap <= 5) {
    return `Parliament and public opinion are closely aligned on this bill. This rare convergence suggests strong democratic legitimacy if it passes.`
  }
  if (gap > 20) {
    return `The public is far more supportive than parliament. ${biggestAgainstParty ? `${biggestAgainstParty} bloc resistance` : 'Opposition bloc resistance'} is the main driver of this gap — MPs may be out of step with constituents.`
  }
  if (gap > 10) {
    return `Public support outpaces parliament by ${absGap}pts. ${biggestAgainstParty ? `${biggestAgainstParty} opposition` : 'Parliamentary opposition'} is weighing against what many Australians want to see passed.`
  }
  return `Public support is slightly ahead of parliament. The crossbench is the key swing factor here — their positions will determine whether this gap closes.`
}

// ─── Main component ───────────────────────────────────────────────────────────

interface GapExplainerPanelProps {
  bill: BillVoteRow
  parliamentSupport: number
  className?: string
}

export function GapExplainerPanel({ bill, parliamentSupport, className = '' }: GapExplainerPanelProps) {
  const [expanded, setExpanded] = useState(false)

  const gap = bill.publicSupport - parliamentSupport
  const absGap = Math.abs(gap)
  const isSignificant = absGap > 10

  // Crossbench summary
  const crossbenchParties = ['Independent', 'Greens', 'Centre Alliance', "Katter's Australian Party", 'One Nation']
  const crossbench = crossbenchParties
    .map(p => bill.parties[p])
    .filter(Boolean)
    .filter(p => p.totalSeats > 0)

  const crossbenchFor = crossbench.reduce((s, p) => s + p.forCount, 0)
  const crossbenchAgainst = crossbench.reduce((s, p) => s + p.againstCount, 0)
  const crossbenchTotal = crossbenchFor + crossbenchAgainst + crossbench.reduce((s, p) => s + p.abstainCount, 0)

  const explanation = generateGapExplanation(bill, gap)

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Always-visible bars */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground shrink-0 w-20 text-right">Public</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${bill.publicSupport}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-foreground w-7 shrink-0">{bill.publicSupport}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground shrink-0 w-20 text-right">Parliament</span>
          <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${parliamentSupport}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-foreground w-7 shrink-0">{parliamentSupport}%</span>
        </div>
      </div>

      {/* Gap callout + expand */}
      {absGap > 3 && (
        <button
          className="w-full flex items-center justify-between gap-2 text-left"
          onClick={() => setExpanded(v => !v)}
        >
          <p className={`text-[10px] flex items-center gap-1 ${isSignificant ? 'text-amber-400' : 'text-muted-foreground/70'}`}>
            <Info size={9} />
            {gap > 0
              ? `Parliament is ${absGap}pt${absGap !== 1 ? 's' : ''} below public support`
              : `Parliament is ${absGap}pt${absGap !== 1 ? 's' : ''} ahead of public support`}
            {isSignificant && ' ⚡'}
            <span className="text-primary underline decoration-dotted ml-1">Why?</span>
          </p>
          {expanded ? <ChevronUp size={11} className="text-muted-foreground shrink-0" /> : <ChevronDown size={11} className="text-muted-foreground shrink-0" />}
        </button>
      )}

      {/* Expanded explanation */}
      {expanded && (
        <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-3 animate-in fade-in duration-150">
          {/* Party breakdown */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Party breakdown
            </p>
            <div className="space-y-1.5">
              {Object.values(bill.parties)
                .filter(p => p.totalSeats > 0)
                .sort((a, b) => b.totalSeats - a.totalSeats)
                .map(p => {
                  const partyPct = p.totalSeats > 0 ? Math.round((p.forCount / p.totalSeats) * 100) : 0
                  const color = PARTY_COLORS[p.party as keyof typeof PARTY_COLORS] ?? '#6b7280'
                  const dirLabel = p.direction === 'for' ? '100% For'
                    : p.direction === 'against' ? '0% For'
                    : p.direction === 'abstain' ? 'Abstaining'
                    : `${partyPct}% For (split)`
                  return (
                    <div key={p.party} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-28 truncate shrink-0">{p.party}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${partyPct}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-20 shrink-0 text-right">{dirLabel}</span>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Crossbench summary */}
          {crossbenchTotal > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Crossbench influence ({crossbenchTotal} seats)
              </p>
              <p className="text-[11px] text-muted-foreground">
                {crossbenchFor} For · {crossbenchAgainst} Against · {crossbenchTotal - crossbenchFor - crossbenchAgainst} Abstain
                {bill.swingMPIds.length > 0 && (
                  <span className="text-amber-400 ml-2">· {bill.swingMPIds.length} still undecided</span>
                )}
              </p>
            </div>
          )}

          {/* Explanation */}
          <div className="border-t border-border/30 pt-2">
            <p className="text-[11px] text-muted-foreground leading-relaxed italic">
              &ldquo;{explanation}&rdquo;
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
