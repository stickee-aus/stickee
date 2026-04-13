'use client'

import { useState } from 'react'
import { ThumbsUp, AlertTriangle, ChevronDown, ChevronUp, BadgeCheck } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import type { FutureLeader, Endorsement } from '@/types/leaders'

// TODO: Rate limiting — max 5 endorsements per user per 24h (implement server-side in /api/endorsements)

const MIN_CHARS = 80

interface EndorsementPanelProps {
  leader: FutureLeader
}

function EndorsementItem({ item }: { item: Endorsement }) {
  const [expanded, setExpanded] = useState(false)
  const isEndorse = item.type === 'endorse'

  return (
    <div className="py-3 border-b border-border/30 last:border-0">
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${isEndorse ? 'bg-emerald-500/15' : 'bg-amber-400/15'}`}>
          {isEndorse
            ? <ThumbsUp className="h-2.5 w-2.5 text-emerald-400" />
            : <AlertTriangle className="h-2.5 w-2.5 text-amber-400" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-xs font-semibold text-foreground/80">{item.authorHandle}</span>
            {item.authorCredential && (
              <span className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary/80 ring-1 ring-primary/20">
                <BadgeCheck className="h-2.5 w-2.5" />
                {item.authorCredential}
              </span>
            )}
            {item.weight > 1 && (
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary/70">
                Weighted
              </span>
            )}
          </div>
          <p className={`text-xs text-muted-foreground leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
            {item.reason}
          </p>
          {item.reason.length > 140 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-1 text-[11px] text-primary/70 hover:text-primary transition-colors flex items-center gap-0.5"
            >
              {expanded ? <><ChevronUp className="h-3 w-3" /> Less</> : <><ChevronDown className="h-3 w-3" /> More</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

type ActiveForm = 'endorse' | 'concern' | null

export function EndorsementPanel({ leader }: EndorsementPanelProps) {
  const { toast } = useToast()
  const [activeForm, setActiveForm] = useState<ActiveForm>(null)
  const [reason, setReason]         = useState('')

  const isValid    = reason.trim().length >= MIN_CHARS
  const charsLeft  = MIN_CHARS - reason.trim().length
  const topEndorse = leader.endorsements.slice(0, 3)
  const topConcern = leader.concerns.slice(0, 3)

  function handleSubmit() {
    if (!isValid || !activeForm) return
    const msg = activeForm === 'endorse'
      ? 'Endorsement submitted for review.'
      : 'Concern submitted for review.'
    toast(msg, 'success')
    setReason('')
    setActiveForm(null)
  }

  function toggleForm(type: ActiveForm) {
    if (activeForm === type) {
      setActiveForm(null)
      setReason('')
    } else {
      setActiveForm(type)
      setReason('')
    }
  }

  return (
    <div className="space-y-5">

      {/* Stats row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400 tabular-nums">{leader.endorsements.length}</span>
          <span className="text-xs text-muted-foreground">endorsements</span>
        </div>
        <div className="h-3 w-px bg-border/40" />
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400 tabular-nums">{leader.concerns.length}</span>
          <span className="text-xs text-muted-foreground">concerns</span>
        </div>
      </div>

      {/* Endorsements list */}
      {topEndorse.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
            Endorsements
          </p>
          <div>
            {topEndorse.map(e => <EndorsementItem key={e.id} item={e} />)}
          </div>
        </div>
      )}

      {/* Concerns list */}
      {topConcern.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
            Concerns
          </p>
          <div>
            {topConcern.map(e => <EndorsementItem key={e.id} item={e} />)}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => toggleForm('endorse')}
          aria-pressed={activeForm === 'endorse'}
          className={[
            'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
            activeForm === 'endorse'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20',
          ].join(' ')}
        >
          <ThumbsUp className="h-3 w-3" />
          Endorse
        </button>
        <button
          onClick={() => toggleForm('concern')}
          aria-pressed={activeForm === 'concern'}
          className={[
            'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
            activeForm === 'concern'
              ? 'bg-amber-400 text-black shadow-sm'
              : 'bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/30 hover:bg-amber-400/20',
          ].join(' ')}
        >
          <AlertTriangle className="h-3 w-3" />
          Raise Concern
        </button>
      </div>

      {/* Inline form */}
      {activeForm && (
        <div className="rounded-xl border border-border/60 bg-card/60 p-4 space-y-3">
          <p className="text-xs font-medium text-foreground/80">
            {activeForm === 'endorse'
              ? `Why do you endorse ${leader.name}?`
              : `What concern do you have about ${leader.name}?`}
          </p>
          <p className="text-[11px] text-muted-foreground/60">
            Be specific and evidence-based. Minimum {MIN_CHARS} characters. Submissions go to a moderation queue.
          </p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={activeForm === 'endorse'
              ? 'Describe specific evidence, achievements, or qualities that support this endorsement…'
              : 'Describe a specific concern with evidence or context…'
            }
            rows={4}
            className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none transition-colors"
          />
          <div className="flex items-center justify-between gap-3">
            <span className={`text-[11px] tabular-nums transition-colors ${isValid ? 'text-emerald-400' : 'text-muted-foreground/50'}`}>
              {isValid ? `${reason.trim().length} chars ✓` : `${charsLeft} more chars needed`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setActiveForm(null); setReason('') }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid}
                className={[
                  'rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
                  isValid
                    ? activeForm === 'endorse'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
                      : 'bg-amber-400 text-black hover:bg-amber-500 shadow-sm'
                    : 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground',
                ].join(' ')}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
