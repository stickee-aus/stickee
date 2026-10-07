'use client'

import { useState, useEffect } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  TrendingDown,
  BookOpen,
  BarChart3,
  MapPin,
  Clock,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { PublicVsParliamentBar } from '@/components/PublicVsParliamentBar'
import { BillUrgencyBadge } from '@/components/BillUrgencyBadge'
import type { BillVoteRow } from '@/lib/mock-parliament-data'
import type { PressureSummary } from '@/app/api/bills/pressure-summary/route'
import type { ActionChoice } from '@/components/CampaignModal'

const CampaignModal = dynamic(
  () => import('@/components/CampaignModal').then(mod => mod.CampaignModal),
  { ssr: false }
)
const HouseChamber = dynamic(
  () => import('@/components/HouseChamber').then(mod => mod.HouseChamber),
  { ssr: false }
)

// ─── Types ────────────────────────────────────────────────────────────────────

interface BillCampaignCardProps {
  bill: BillVoteRow
  isSelected: boolean
  onSelect: (id: string | null) => void
  pressureSummary?: PressureSummary | null
  electorate?: string | null
  mpName?: string | null
  onAction?: () => void
}

// ─── Momentum framing ─────────────────────────────────────────────────────────

interface MomentumFrame {
  primary: string
  secondary?: string
  color: 'neutral' | 'rising' | 'falling'
  arrow: 'up' | 'down' | null
}

export function getMomentumFrame(
  total: number,
  weeklyGrowth: number,
  electorate: string | null
): MomentumFrame {
  if (total === 0) {
    return {
      primary: `Be the first in ${electorate ?? 'your area'} to pressure your MP`,
      color: 'neutral',
      arrow: null,
    }
  }
  if (total < 10) {
    return {
      primary: `Rising fast · ${weeklyGrowth} people this week`,
      color: 'rising',
      arrow: 'up',
    }
  }
  return {
    primary: `${weeklyGrowth > 0 ? '+' : ''}${weeklyGrowth} this week`,
    secondary: `${total.toLocaleString()} total`,
    color: weeklyGrowth > 0 ? 'rising' : 'falling',
    arrow: weeklyGrowth > 0 ? 'up' : 'down',
  }
}

const MOMENTUM_COLOR = {
  rising: 'text-emerald-400',
  falling: 'text-red-400',
  neutral: 'text-muted-foreground',
}

// ─── Countdown display ────────────────────────────────────────────────────────

function CountdownDisplay({ daysUntilVote }: { daysUntilVote: number }) {
  const [hoursLeft, setHoursLeft] = useState(daysUntilVote * 24)

  useEffect(() => {
    const interval = setInterval(() => {
      setHoursLeft(h => Math.max(0, h - 1 / 60))
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  const days = Math.floor(hoursLeft / 24)
  const hours = Math.floor(hoursLeft % 24)

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
      </span>
      <Clock size={9} />
      Vote in {days}d {hours}h
    </span>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const W = 56
  const H = 20
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W
    const y = H - ((v - min) / range) * H
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BillVoteRow['status'] }) {
  if (status === 'ongoing') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 border border-amber-400/20">
        <Zap size={8} />
        Live
      </span>
    )
  }
  if (status === 'passed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 size={8} />
        Passed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400 border border-red-500/20">
      <XCircle size={8} />
      Failed
    </span>
  )
}

// ─── Parliament support % helper ──────────────────────────────────────────────

function parliamentSupportPct(bill: BillVoteRow): number {
  const total = bill.totalFor + bill.totalAgainst + bill.totalAbstain
  return total > 0 ? Math.round((bill.totalFor / total) * 100) : 0
}

// ─── Pressure threshold bar ───────────────────────────────────────────────────

function PressureThresholdBar({ current, target }: { current: number; target: number }) {
  const pct = Math.min(100, Math.round((current / target) * 100))
  const daysLabel = pct < 50 ? '~8 days at this rate' : pct < 80 ? '~3 days at this rate' : 'nearly there'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-medium text-foreground">{current.toLocaleString()}</span>
        <span>of {target.toLocaleString()} needed · {daysLabel}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/70 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Real-world impact section ────────────────────────────────────────────────

function RealWorldImpactSection({ impact }: { impact: NonNullable<BillVoteRow['realWorldImpact']> }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 space-y-2">
      <button
        className="w-full flex items-center justify-between gap-2 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <BarChart3 size={10} />
          What this means for you
        </p>
        {expanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
      </button>
      <p className="text-sm font-semibold text-foreground leading-snug">{impact.headline}</p>
      {expanded && (
        <div className="space-y-1.5 animate-in fade-in duration-150">
          <ul className="space-y-1">
            {impact.details.map((d, i) => (
              <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-0.5 shrink-0">·</span>
                {d}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 pt-1 border-t border-primary/10">
            <Users size={9} />
            Affects {impact.affectedCount}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function BillCampaignCard({
  bill,
  isSelected,
  onSelect,
  pressureSummary,
  electorate,
  onAction,
}: BillCampaignCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [campaignModal, setCampaignModal] = useState<{ open: boolean; stance: 'support' | 'oppose' }>({
    open: false,
    stance: 'support',
  })
  const [userStance, setUserStance] = useState<'support' | 'oppose' | null>(null)

  // Read persisted campaign stance on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('stickee:campaigns')
      if (stored) {
        const campaigns = JSON.parse(stored) as Record<string, 'support' | 'oppose'>
        setUserStance(campaigns[bill.id] ?? null)
      }
    } catch {
      // ignore
    }
  }, [bill.id])

  function openCampaign(stance: 'support' | 'oppose') {
    setCampaignModal({ open: true, stance })
  }

  function handleCampaignConfirm(stance: 'support' | 'oppose', _action: ActionChoice) {
    setUserStance(stance)
    try {
      const stored = localStorage.getItem('stickee:campaigns')
      const campaigns = stored ? (JSON.parse(stored) as Record<string, 'support' | 'oppose'>) : {}
      campaigns[bill.id] = stance
      localStorage.setItem('stickee:campaigns', JSON.stringify(campaigns))
    } catch {
      // ignore
    }
    onAction?.()
  }

  const parlPct = parliamentSupportPct(bill)
  const priceChange = bill.change
  const changeColor = priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'
  const sparklineColor = priceChange >= 0 ? '#22c55e' : '#ef4444'

  // Live pressure counts: use API data if available, fall back to mock
  const liveTotal = pressureSummary ? pressureSummary.total + bill.campaignCount : bill.campaignCount
  const liveToday = pressureSummary ? pressureSummary.today + bill.campaignDailyGrowth : bill.campaignDailyGrowth

  // Local count for user's electorate
  const localCount = electorate
    ? (pressureSummary?.byElectorate.find(e => e.electorate.toLowerCase() === electorate.toLowerCase())?.count ?? 0)
    : 0

  // Pressure threshold: target is 10,000 total or 3x total parliament seats (150)
  const pressureTarget = Math.max(10000, bill.totalFor + bill.totalAgainst)

  return (
    <div style={{ perspective: '1200px' }}>
      <div
        style={{
          transformStyle: 'preserve-3d',
          transform: isSelected ? 'rotateY(180deg)' : 'rotateY(0deg)',
          transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
          position: 'relative',
          minHeight: isSelected ? '520px' : undefined,
        }}
      >

      {/* ── Back face: chamber view ── */}
      <div
        className="rounded-2xl border border-primary/50 bg-card/80 backdrop-blur-sm absolute inset-0 overflow-auto"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/40">
          <h3 className="text-sm font-semibold text-foreground truncate min-w-0">{bill.name}</h3>
          <button
            className="shrink-0 flex items-center gap-1 rounded-full border border-border/50 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
            onClick={() => onSelect(null)}
          >
            ← Back
          </button>
        </div>
        {isSelected && <HouseChamber selectedBillId={bill.id} />}
      </div>

    <article
      className={`rounded-2xl border bg-card/80 backdrop-blur-sm transition-colors duration-200 ${
        isSelected
          ? 'border-primary/50 shadow-sm ring-1 ring-primary/20'
          : 'border-border/50 hover:border-border'
      }`}
      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
    >
      {/* ── Collapsed header (always visible) ── */}
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v) } }}
      >
        {/* Row 1: tags + status + urgency + countdown + sparkline */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <StatusBadge status={bill.status} />
            {bill.urgency && (
              <BillUrgencyBadge urgency={bill.urgency} countdown={bill.voteCountdown} />
            )}
            {bill.urgency === 'closing-soon' && bill.daysUntilVote !== undefined && (
              <CountdownDisplay daysUntilVote={bill.daysUntilVote} />
            )}
            {bill.tags.map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground font-medium">
                {tag}
              </span>
            ))}
            {bill.controversy >= 65 && !bill.urgency && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-medium border border-amber-400/20">
                Controversial
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Sparkline data={bill.sparkline} color={sparklineColor} />
            <span className={`text-[11px] font-semibold ${changeColor} flex items-center gap-0.5`}>
              {priceChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {priceChange > 0 ? '+' : ''}{priceChange}pp
            </span>
          </div>
        </div>

        {/* Row 2: Bill title */}
        <h3 className="text-base font-bold leading-snug tracking-tight text-foreground mb-2 line-clamp-2">
          {bill.name}
        </h3>

        {/* Row 3: Public vs Parliament bar */}
        <div className="mb-3" onClick={e => e.stopPropagation()}>
          <PublicVsParliamentBar
            publicSupport={bill.publicSupport ?? 0}
            parliamentSupport={parlPct}
          />
        </div>

        {/* Row 4: Momentum framing + prediction + CTAs */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Momentum / social proof */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <Users size={11} className="text-primary shrink-0" />
            {(() => {
              const frame = getMomentumFrame(liveTotal, bill.campaignWeeklyGrowth ?? liveToday * 7, electorate ?? null)
              const colorClass = MOMENTUM_COLOR[frame.color]
              return (
                <span className={`flex items-center gap-1 ${colorClass}`}>
                  {frame.arrow === 'up' && <TrendingUp size={10} />}
                  {frame.arrow === 'down' && <TrendingDown size={10} />}
                  <span>{frame.primary}</span>
                  {frame.secondary && (
                    <span className="text-muted-foreground ml-1">· {frame.secondary}</span>
                  )}
                </span>
              )
            })()}
          </div>

          {/* Local social proof (only when we have a real local count) */}
          {electorate && localCount > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin size={10} className="text-primary" />
              <span><strong className="text-foreground">{localCount}</strong> in {electorate}</span>
            </div>
          )}

          {/* Prediction % */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-muted-foreground">Prediction:</span>
            <span className="font-bold text-foreground">{bill.publicPrediction}%</span>
            <span className="text-muted-foreground">pass</span>
          </div>

          {/* Expand toggle */}
          <button
            className="ml-auto text-muted-foreground/60 hover:text-foreground transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
            onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Row 5: Pressure threshold bar (ongoing bills) */}
        {bill.status === 'ongoing' && (
          <div className="mt-3" onClick={e => e.stopPropagation()}>
            <p className="text-[10px] text-muted-foreground mb-1 font-medium">Public pressure needed to tip the scales</p>
            <PressureThresholdBar current={liveTotal} target={pressureTarget} />
          </div>
        )}

        {/* Row 6: User stance + action CTAs */}
        <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()}>
          {userStance ? (
            <div className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${
              userStance === 'support'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {userStance === 'support' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
              You: {userStance === 'support' ? 'Supporting' : 'Opposing'}
              <button
                className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                onClick={() => openCampaign(userStance === 'support' ? 'oppose' : 'support')}
              >
                ·
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => openCampaign('support')}
                className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                <CheckCircle2 size={11} />
                Support
              </button>
              <button
                onClick={() => openCampaign('oppose')}
                className="flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <XCircle size={11} />
                Oppose
              </button>
            </>
          )}

          <button
            className={`ml-auto flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              isSelected
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary'
            }`}
            onClick={() => onSelect(isSelected ? null : bill.id)}
          >
            {isSelected ? 'Viewing in chamber' : 'View in chamber →'}
          </button>
        </div>
      </div>

      {/* ── Expanded detail section ── */}
      {expanded && (
        <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* ELI15 */}
          <div className="rounded-lg bg-muted/20 border border-border/30 p-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <BookOpen size={10} />
              Plain English
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed">{bill.eli15}</p>
          </div>

          {/* Real-world impact */}
          {bill.realWorldImpact && (
            <RealWorldImpactSection impact={bill.realWorldImpact} />
          )}

          {/* Who it affects */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Who this affects
            </p>
            <div className="flex flex-wrap gap-1.5">
              {bill.affectedGroups.map(group => (
                <span
                  key={group}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary/8 border border-primary/15 text-primary/80 font-medium"
                >
                  {group}
                </span>
              ))}
            </div>
          </div>

          {/* Vote breakdown */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/15 py-2 px-1">
              <p className="text-lg font-bold text-emerald-400">{bill.totalFor}</p>
              <p className="text-[10px] text-muted-foreground">For</p>
            </div>
            <div className="rounded-lg bg-red-500/8 border border-red-500/15 py-2 px-1">
              <p className="text-lg font-bold text-red-400">{bill.totalAgainst}</p>
              <p className="text-[10px] text-muted-foreground">Against</p>
            </div>
            <div className="rounded-lg bg-muted/30 border border-border/30 py-2 px-1">
              <p className="text-lg font-bold text-muted-foreground">{bill.totalAbstain}</p>
              <p className="text-[10px] text-muted-foreground">Abstain</p>
            </div>
          </div>

          {/* Majority indicator */}
          <div className="relative h-2.5 rounded-full bg-muted/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/70 transition-all duration-500"
              style={{ width: `${parlPct}%` }}
            />
            {/* Majority line at 50.67% (76/150) */}
            <div
              className="absolute top-0 bottom-0 w-px bg-white/40"
              style={{ left: '50.67%' }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground -mt-2 text-center">
            Majority threshold: 76 seats · Current support: {parlPct}%
          </p>
        </div>
      )}

      {/* Campaign modal */}
      <CampaignModal
        bill={bill}
        initialStance={campaignModal.stance}
        open={campaignModal.open}
        onOpenChange={open => setCampaignModal(prev => ({ ...prev, open }))}
        onConfirm={handleCampaignConfirm}
        electorate={electorate}
        pressureSummary={null}
      />
    </article>

    </div>
    </div>
  )
}
