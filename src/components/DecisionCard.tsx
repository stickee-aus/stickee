'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin, TrendingUp, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import type { Decision, DecisionMaker, DecisionStatus, ImpactLevel } from '@/types/government'
import type { IssueMarket } from '@/lib/mock-market-data'
import { useToast } from '@/components/ui/toast'
import { EmailMPButton } from '@/components/EmailMPButton'
import type { Issue } from '@/types'

// ─── Impact badge ─────────────────────────────────────────────────────────────

const IMPACT_CONFIG: Record<ImpactLevel, { label: string; className: string }> = {
  High:   { label: 'High Impact',   className: 'bg-red-500/15 text-red-400 ring-1 ring-red-500/25' },
  Medium: { label: 'Medium Impact', className: 'bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/25' },
  Low:    { label: 'Low Impact',    className: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/25' },
}

function ImpactBadge({ level }: { level: ImpactLevel }) {
  const { label, className } = IMPACT_CONFIG[level]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ${className}`}>
      {label}
    </span>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<DecisionStatus, string> = {
  Proposed:     'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/25',
  'In Debate':  'bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/25',
  Passed:       'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25',
  Rejected:     'bg-red-500/15 text-red-400 ring-1 ring-red-500/25',
  Implemented:  'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25',
}

function StatusBadge({ status }: { status: DecisionStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CONFIG[status]}`}>
      {status}
    </span>
  )
}

// ─── Sentiment bar ────────────────────────────────────────────────────────────

function SentimentBar({ likes, dislikes }: { likes: number; dislikes: number }) {
  const total = likes + dislikes
  if (total === 0) return null
  const agreePercent = Math.round((likes / total) * 100)
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-20 h-1.5 rounded-full overflow-hidden flex bg-border/40 shrink-0">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${agreePercent}%` }}
        />
        <div className="h-full bg-red-500 flex-1" />
      </div>
      <span className="text-xs font-medium text-emerald-400 tabular-nums whitespace-nowrap">
        {agreePercent}% agree
      </span>
    </div>
  )
}

// ─── Timeline stepper ────────────────────────────────────────────────────────

const STATUS_ORDER: DecisionStatus[] = ['Proposed', 'In Debate', 'Passed', 'Implemented']

function Timeline({ timeline, currentStatus }: {
  timeline: Decision['timeline']
  currentStatus: DecisionStatus
}) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus)
  // Build display steps — use timeline events or fall back to status order
  const steps = STATUS_ORDER.map((s, i) => {
    const event = timeline.find(e => e.status === s)
    return {
      label: s,
      date: event?.date ?? null,
      note: event?.label ?? null,
      done: i <= currentIdx,
    }
  })

  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-1">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-start flex-1 min-w-0">
          <div className="flex flex-col items-center flex-1 min-w-0">
            {/* dot + connector */}
            <div className="flex items-center w-full">
              {i > 0 && (
                <div className={`h-0.5 flex-1 ${step.done ? 'bg-primary/60' : 'bg-border/40'}`} />
              )}
              <div className={`h-3 w-3 rounded-full shrink-0 border-2 transition-colors ${
                step.done
                  ? 'border-primary bg-primary'
                  : 'border-border/50 bg-background'
              }`} />
              {i < steps.length - 1 && (
                <div className={`h-0.5 flex-1 ${steps[i + 1]?.done ? 'bg-primary/60' : 'bg-border/40'}`} />
              )}
            </div>
            {/* label */}
            <div className="mt-1.5 text-center px-1">
              <p className={`text-[10px] font-semibold leading-tight whitespace-nowrap ${step.done ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                {step.label}
              </p>
              {step.date && (
                <p className="text-[10px] text-muted-foreground/60 tabular-nums mt-0.5">
                  {new Date(step.date).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Post-vote social proof ───────────────────────────────────────────────────

function SocialProofReveal({
  pick,
  prob,
  participants,
}: {
  pick: 'yes' | 'no'
  prob: number
  participants: number
}) {
  const agreedPct   = pick === 'yes' ? prob : 100 - prob
  const isWithMajority = agreedPct >= 50
  const highlight = isWithMajority ? '#2ec266' : '#f5a623'

  return (
    <div
      className="rounded-lg border p-3 space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300"
      style={{ background: `${highlight}08`, borderColor: `${highlight}30` }}
    >
      {/* Headline */}
      <p className="font-mono text-[10px] leading-relaxed" style={{ color: highlight }}>
        {isWithMajority
          ? `✓ You're with the majority — ${agreedPct}% of ${participants.toLocaleString()} Australians agree.`
          : `You're in the minority — only ${agreedPct}% of ${participants.toLocaleString()} Australians agree.`}
      </p>

      {/* Agreement bar */}
      <div className="space-y-0.5">
        <div className="flex items-center justify-between font-mono text-[9px]" style={{ color: '#5a5a5e' }}>
          <span>YES  {prob}%</span>
          <span>NO  {100 - prob}%</span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden flex" style={{ background: '#1e1e20' }}>
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${prob}%`, background: '#2ec266' }}
          />
          <div
            className="h-full flex-1 transition-all duration-700"
            style={{ background: '#f04747' }}
          />
        </div>
        {/* User pick marker */}
        <div
          className="relative h-2 w-full"
          aria-hidden="true"
        >
          <div
            className="absolute top-0 h-3 w-0.5 rounded-full"
            style={{
              left: `${pick === 'yes' ? Math.min(prob, 98) : Math.max(100 - prob, 2)}%`,
              background: highlight,
              transform: 'translateX(-50%)',
            }}
          >
            <span
              className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[7px] whitespace-nowrap"
              style={{ color: highlight }}
            >
              you
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Prediction widget (inline) ───────────────────────────────────────────────

function InlinePrediction({
  question,
  market,
  decisionId,
}: {
  question: string
  market?: IssueMarket
  decisionId: string
}) {
  const { toast } = useToast()
  const [pick, setPick] = useState<'yes' | 'no' | null>(null)
  const [showProof, setShowProof] = useState(false)

  function handlePick(v: 'yes' | 'no') {
    const next = pick === v ? null : v
    setPick(next)
    if (next) {
      toast(`Prediction saved: ${next.toUpperCase()}`, 'success')
      // Short delay before showing social proof for impact
      setTimeout(() => setShowProof(true), 400)
    } else {
      setShowProof(false)
    }
  }

  const prob = market?.probability ?? null
  const participants = market?.totalParticipants ?? null

  return (
    <div className="rounded-xl border border-border/50 bg-background/60 p-3 space-y-2">
      <p className="text-xs font-semibold text-foreground/80">{question}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button
            onClick={e => { e.stopPropagation(); handlePick('yes') }}
            aria-pressed={pick === 'yes'}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              pick === 'yes'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-400'
            }`}
          >
            Yes, likely
          </button>
          <button
            onClick={e => { e.stopPropagation(); handlePick('no') }}
            aria-pressed={pick === 'no'}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              pick === 'no'
                ? 'bg-red-500 text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/40 dark:hover:text-red-400'
            }`}
          >
            No, unlikely
          </button>
        </div>
        <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
          {prob !== null && (
            <span className="tabular-nums font-medium text-foreground/70">{prob}% yes</span>
          )}
          {participants !== null && (
            <span>{participants.toLocaleString()} votes</span>
          )}
        </div>
      </div>

      {/* Social proof — revealed after picking */}
      {pick && showProof && prob !== null && participants !== null && (
        <SocialProofReveal pick={pick} prob={prob} participants={participants} />
      )}
    </div>
  )
}

// ─── CTA button logic ─────────────────────────────────────────────────────────

function ctaLabel(decision: Decision): string {
  if (decision.status === 'Proposed' || decision.status === 'In Debate') return 'Predict Outcome'
  if (decision.isControversial) return 'Agree / Disagree'
  return 'Track Impact'
}

function ctaStyle(decision: Decision): string {
  if (decision.status === 'Proposed' || decision.status === 'In Debate') {
    return 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
  }
  if (decision.isControversial) {
    return 'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25 hover:bg-violet-500/25'
  }
  return 'border border-border/60 text-foreground/70 hover:bg-foreground/5'
}

// ─── DecisionCard ─────────────────────────────────────────────────────────────

export interface DecisionCardProps {
  decision: Decision
  decisionMaker: DecisionMaker
  market?: IssueMarket
  defaultExpanded?: boolean
  showEmailMP?: boolean
}

export function DecisionCard({ decision, decisionMaker, market, defaultExpanded = false, showEmailMP = false }: DecisionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  const label = ctaLabel(decision)
  const btnStyle = ctaStyle(decision)

  return (
    <article className={[
      'rounded-2xl border bg-card/80 backdrop-blur-sm transition-all duration-200',
      expanded ? 'border-border shadow-sm' : 'border-border/50 hover:border-border',
    ].join(' ')}>

      {/* ── Collapsed header (always visible) ─────────────────────────────── */}
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setExpanded(v => !v)}
      >
        {/* Row 1: badges */}
        <div className="flex items-center gap-2 flex-wrap mb-2.5">
          <ImpactBadge level={decision.impactLevel} />
          <StatusBadge status={decision.status} />
          {decision.isTrending && (
            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/25">
              <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" />
              Trending
            </span>
          )}
        </div>

        {/* Row 2: title */}
        <h3 className="text-base font-bold leading-snug tracking-tight text-foreground line-clamp-2 mb-1">
          {decision.title}
        </h3>

        {/* Row 3: decision maker */}
        <p className="text-xs text-muted-foreground mb-2">
          {decisionMaker.name} · {decisionMaker.role} · {decision.level.charAt(0).toUpperCase() + decision.level.slice(1)}
        </p>

        {/* Row 4: summary */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {decision.summary}
        </p>

        {/* Row 5: sentiment + relevance tag + CTA */}
        <div className="flex items-center gap-3 flex-wrap">
          <SentimentBar likes={decision.likes} dislikes={decision.dislikes} />

          {decision.relevanceTags[0] && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              {decision.relevanceTags[0]}
            </span>
          )}

          <button
            onClick={e => { e.stopPropagation() }}
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${btnStyle}`}
          >
            {label}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* ── Expanded detail ───────────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-4">

          {/* Full description */}
          <p className="text-sm text-foreground/80 leading-relaxed">{decision.summary}</p>

          {/* Timeline */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Timeline
            </p>
            <Timeline timeline={decision.timeline} currentStatus={decision.status} />
          </div>

          {/* Short + Long term effects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/50 bg-background/60 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Short-term</p>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{decision.expectedShortTerm}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/60 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Circle className="h-3.5 w-3.5 text-primary/60 shrink-0" aria-hidden="true" />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Long-term</p>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{decision.expectedLongTerm}</p>
            </div>
          </div>

          {/* Second relevance tag if present */}
          {decision.relevanceTags[1] && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
              {decision.relevanceTags[1]}
            </div>
          )}

          {/* Inline prediction */}
          {decision.predictionQuestion && (
            <InlinePrediction
              question={decision.predictionQuestion}
              market={market}
              decisionId={decision.id}
            />
          )}

          {/* Email MP action */}
          {showEmailMP && (
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <p className="text-xs text-muted-foreground">Make your voice heard on this decision</p>
              <EmailMPButton
                variant="inline"
                issue={{
                  id: decision.id,
                  title: decision.title,
                  summary: decision.summary,
                  content: decision.summary,
                  whatIsHappening: decision.expectedShortTerm,
                  whoSupports: '',
                  whoOpposes: '',
                  status: decision.status === 'Passed' ? 'passed'
                    : decision.status === 'Rejected' ? 'rejected'
                    : 'active',
                } satisfies Issue}
              />
            </div>
          )}

          <button
            onClick={() => setExpanded(false)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
            Collapse
          </button>
        </div>
      )}
    </article>
  )
}
