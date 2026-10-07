'use client'

import { CheckCircle2, Clock, XCircle, Minus, AlarmClock, X } from 'lucide-react'
import { BILL_PROGRESS, type StageStatus } from '@/lib/mock-senate-data'
import type { BillVoteRow } from '@/lib/mock-parliament-data'
import { useState } from 'react'

// ─── Stage definitions ────────────────────────────────────────────────────────

interface StageDefinition {
  key: string
  label: string
  sublabel: string
  estimated?: string
}

const STAGE_DEFS: StageDefinition[] = [
  { key: 'house',  label: 'House of Reps', sublabel: 'Reading & debate' },
  { key: 'senate', label: 'Senate',        sublabel: 'Committee & vote' },
  { key: 'assent', label: 'Royal Assent',  sublabel: 'Governor-General'  },
]

// ─── Status helpers ────────────────────────────────────────────────────────────

function stageIcon(status: StageStatus) {
  if (status === 'passed')  return <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
  if (status === 'ongoing') return <Clock        size={14} className="text-amber-400  shrink-0 animate-pulse" />
  if (status === 'failed')  return <XCircle      size={14} className="text-red-400    shrink-0" />
  return <Minus size={14} className="text-muted-foreground/30 shrink-0" />
}

function stageBg(status: StageStatus) {
  if (status === 'passed')  return 'border-emerald-500/40 bg-emerald-500/8'
  if (status === 'ongoing') return 'border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/20'
  if (status === 'failed')  return 'border-red-500/40 bg-red-500/8'
  return 'border-border/30 bg-muted/10'
}

function stageTextColor(status: StageStatus) {
  if (status === 'passed')  return 'text-emerald-400'
  if (status === 'ongoing') return 'text-amber-400'
  if (status === 'failed')  return 'text-red-400'
  return 'text-muted-foreground/40'
}

// ─── Countdown banner ──────────────────────────────────────────────────────────

interface VoteCountdownBannerProps {
  countdown: string
  billId: string
}

export function VoteCountdownBanner({ countdown, billId }: VoteCountdownBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem(`stickee:countdown-dismissed:${billId}`) } catch { return false }
  })

  if (dismissed) return null

  function handleDismiss() {
    setDismissed(true)
    try { localStorage.setItem(`stickee:countdown-dismissed:${billId}`, '1') } catch { /* ignore */ }
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-400/25 bg-amber-400/8 px-3 py-2">
      <div className="flex items-center gap-2">
        <AlarmClock size={13} className="text-amber-400 shrink-0" />
        <p className="text-xs text-foreground">
          <span className="font-semibold text-amber-400">Vote expected in {countdown}</span>
          {' '}— your window to act is closing
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="text-muted-foreground/40 hover:text-muted-foreground p-0.5 rounded transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X size={11} />
      </button>
    </div>
  )
}

// ─── Main timeline ─────────────────────────────────────────────────────────────

interface BillStageTimelineProps {
  billId: string
  bill: BillVoteRow
}

export function BillStageTimeline({ billId, bill }: BillStageTimelineProps) {
  const progress = BILL_PROGRESS[billId]
  if (!progress) return null

  const stages: { def: StageDefinition; status: StageStatus }[] = [
    { def: STAGE_DEFS[0], status: progress.house       },
    { def: STAGE_DEFS[1], status: progress.senate      },
    { def: STAGE_DEFS[2], status: progress.royalAssent },
  ]

  const currentIndex = stages.findIndex(s => s.status === 'ongoing')
  const nextStage = currentIndex >= 0 ? stages[currentIndex + 1] : null

  return (
    <div className="space-y-3">
      {/* Countdown banner */}
      {bill.voteCountdown && bill.status === 'ongoing' && (
        <VoteCountdownBanner countdown={bill.voteCountdown} billId={billId} />
      )}

      {/* Stage track */}
      <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
        {stages.map((s, i) => (
          <div key={s.def.key} className="flex items-center min-w-0">
            {/* Stage pill */}
            <div className={`rounded-lg border px-3 py-2 flex items-center gap-2 shrink-0 ${stageBg(s.status)}`}>
              {stageIcon(s.status)}
              <div>
                <p className={`text-[11px] font-semibold leading-tight ${stageTextColor(s.status)}`}>
                  {s.def.label}
                </p>
                <p className="text-[9px] text-muted-foreground/60 leading-tight mt-0.5">{s.def.sublabel}</p>
              </div>
            </div>
            {/* Connector arrow */}
            {i < stages.length - 1 && (
              <div className="flex items-center px-1 shrink-0">
                <div className={`h-px w-4 ${s.status === 'passed' ? 'bg-emerald-500/40' : 'bg-border/30'}`} />
                <div className={`w-0 h-0 border-y-2 border-y-transparent border-l-4 ${s.status === 'passed' ? 'border-l-emerald-500/40' : 'border-l-border/30'}`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Next stage estimate */}
      {nextStage && bill.voteCountdown && (
        <p className="text-[10px] text-muted-foreground">
          Next: <span className="text-foreground font-medium">{nextStage.def.label}</span>
          {' '}— Est. {bill.voteCountdown}
        </p>
      )}
    </div>
  )
}
