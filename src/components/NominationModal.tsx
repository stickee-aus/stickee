'use client'

// TODO: Rate limiting — max 3 nominations per IP per 24h (implement server-side in /api/nominations)

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import type { AustralianState } from '@/types/government'
import type { LeaderField } from '@/types/leaders'

interface NominationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type NomStep = 1 | 2 | 3

const STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']

const FIELDS: LeaderField[] = [
  'Environment', 'Housing', 'Healthcare', 'Education', 'Economy',
  'Indigenous Affairs', 'Technology', 'Infrastructure', 'Social Services', 'Foreign Policy',
]

const EVIDENCE_CATEGORIES = [
  { value: 'experience'   as const, label: 'Experience' },
  { value: 'achievement'  as const, label: 'Achievement' },
  { value: 'community'    as const, label: 'Community' },
]

interface EvidenceState {
  category: 'experience' | 'achievement' | 'community'
  description: string
  verifiable: boolean
  sourceUrl: string
}

const emptyEvidence = (): EvidenceState => ({
  category: 'experience',
  description: '',
  verifiable: false,
  sourceUrl: '',
})

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: NomStep }) {
  const steps = [
    { n: 1 as NomStep, label: 'Details' },
    { n: 2 as NomStep, label: 'Evidence' },
    { n: 3 as NomStep, label: 'Consent' },
  ]
  return (
    <div className="flex items-center">
      {steps.map(({ n, label }, i) => {
        const done    = current > n
        const active  = current === n
        const isLast  = i === steps.length - 1
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={[
                'h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors',
                done   ? 'bg-primary text-primary-foreground' :
                active ? 'bg-primary/20 text-primary ring-2 ring-primary/40' :
                         'bg-muted text-muted-foreground',
              ].join(' ')}>
                {done ? '✓' : n}
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground/60'}`}>
                {label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full ${done ? 'bg-primary/60' : 'bg-border/40'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function NominationModal({ open, onOpenChange }: NominationModalProps) {
  const { toast } = useToast()
  const [step, setStep]         = useState<NomStep>(1)
  const [name, setName]         = useState('')
  const [state, setState]       = useState<AustralianState | ''>('')
  const [field, setField]       = useState<LeaderField | ''>('')
  const [justification, setJustification] = useState('')
  const [evidence, setEvidence] = useState<EvidenceState[]>([emptyEvidence(), emptyEvidence(), emptyEvidence()])
  const [consent, setConsent]   = useState(false)

  const JUST_MIN = 120
  const EVI_MIN  = 60

  const step1Valid = name.trim().length > 0 && state !== '' && field !== '' && justification.trim().length >= JUST_MIN
  const validEviCount = evidence.filter(e => e.description.trim().length >= EVI_MIN).length
  const step2Valid = validEviCount >= 2
  const step3Valid = consent

  function updateEvidence(i: number, patch: Partial<EvidenceState>) {
    setEvidence(prev => prev.map((e, idx) => idx === i ? { ...e, ...patch } : e))
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(() => {
      setStep(1); setName(''); setState(''); setField('')
      setJustification(''); setEvidence([emptyEvidence(), emptyEvidence(), emptyEvidence()])
      setConsent(false)
    }, 300)
  }

  function handleSubmit() {
    if (!step3Valid) return
    toast('Nomination submitted — it will be reviewed within 48 hours.', 'success')
    handleClose()
  }

  const inputClass = 'w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors'
  const labelClass = 'block text-xs font-semibold text-foreground/80 mb-1.5'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nominate a Future Leader</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Nominations require structured evidence. Profiles enter a moderation queue before going public.
          </p>
        </DialogHeader>

        <div className="space-y-5">
          <StepIndicator current={step} />

          {/* ── Step 1: Basic details ──────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nominee full name *</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>State / Territory *</label>
                  <select
                    value={state}
                    onChange={e => setState(e.target.value as AustralianState)}
                    className={inputClass}
                  >
                    <option value="">Select…</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Field / Industry *</label>
                  <select
                    value={field}
                    onChange={e => setField(e.target.value as LeaderField)}
                    className={inputClass}
                  >
                    <option value="">Select…</option>
                    {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Why should they be a leader? *</label>
                <p className="text-[11px] text-muted-foreground/60 mb-1.5">
                  Minimum {JUST_MIN} characters. Be specific about their qualities and track record.
                </p>
                <textarea
                  rows={5}
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  placeholder="Describe why this person should enter public leadership — their qualities, track record, and what makes them credible…"
                  className={`${inputClass} resize-none`}
                />
                <p className={`mt-1 text-[11px] tabular-nums ${justification.trim().length >= JUST_MIN ? 'text-emerald-400' : 'text-muted-foreground/50'}`}>
                  {justification.trim().length >= JUST_MIN
                    ? `${justification.trim().length} chars ✓`
                    : `${JUST_MIN - justification.trim().length} more chars needed`}
                </p>
              </div>
            </div>
          )}

          {/* ── Step 2: Evidence ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Provide at least 2 of 3 evidence items. Each description must be at least {EVI_MIN} characters. Verifiable claims carry more weight.
              </p>

              {evidence.map((evi, i) => (
                <div key={i} className="rounded-xl border border-border/50 bg-muted/20 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground/70">Evidence {i + 1}</p>
                    <div className="flex gap-1">
                      {EVIDENCE_CATEGORIES.map(c => (
                        <button
                          key={c.value}
                          onClick={() => updateEvidence(i, { category: c.value })}
                          className={[
                            'rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all',
                            evi.category === c.value
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : 'bg-muted text-muted-foreground hover:text-foreground',
                          ].join(' ')}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    value={evi.description}
                    onChange={e => updateEvidence(i, { description: e.target.value })}
                    placeholder={
                      evi.category === 'experience' ? 'Describe relevant professional experience (role, organisation, years)…' :
                      evi.category === 'achievement' ? 'Describe a verifiable achievement with measurable outcomes…' :
                      'Describe community involvement and its impact…'
                    }
                    className={`${inputClass} resize-none text-xs`}
                  />
                  <p className={`text-[11px] tabular-nums ${evi.description.trim().length >= EVI_MIN ? 'text-emerald-400' : 'text-muted-foreground/40'}`}>
                    {evi.description.trim().length >= EVI_MIN
                      ? `${evi.description.trim().length} chars ✓`
                      : evi.description.trim().length > 0
                        ? `${EVI_MIN - evi.description.trim().length} more needed`
                        : `Min ${EVI_MIN} chars`}
                  </p>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={evi.verifiable}
                        onChange={e => updateEvidence(i, { verifiable: e.target.checked })}
                        className="h-3.5 w-3.5 rounded accent-primary"
                      />
                      Publicly verifiable
                    </label>
                    {evi.verifiable && (
                      <input
                        type="url"
                        value={evi.sourceUrl}
                        onChange={e => updateEvidence(i, { sourceUrl: e.target.value })}
                        placeholder="Source URL (optional)"
                        className="flex-1 rounded-md border border-border/50 bg-background/60 px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                    )}
                  </div>
                </div>
              ))}

              <p className={`text-xs tabular-nums ${step2Valid ? 'text-emerald-400' : 'text-muted-foreground/50'}`}>
                {validEviCount}/2 minimum evidence items complete
              </p>
            </div>
          )}

          {/* ── Step 3: Consent + preview ─────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5 space-y-2">
                <p className="text-xs font-semibold text-foreground/70">Nomination summary</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground/60">Nominee</span>
                  <span className="font-medium text-foreground/80">{name}</span>
                  <span className="text-muted-foreground/60">State</span>
                  <span className="font-medium text-foreground/80">{state}</span>
                  <span className="text-muted-foreground/60">Field</span>
                  <span className="font-medium text-foreground/80">{field}</span>
                  <span className="text-muted-foreground/60">Evidence items</span>
                  <span className="font-medium text-foreground/80">{validEviCount} provided</span>
                </div>
              </div>

              {/* Moderation warning */}
              <div className="flex gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/8 p-3.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-amber-400">Moderation notice</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This nomination will enter a moderation queue. The nominee will be contacted for consent before their profile goes public. Nominations that cannot be verified or that violate our guidelines will be rejected.
                  </p>
                </div>
              </div>

              {/* Consent checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded accent-primary shrink-0"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I confirm this nomination is made in good faith, to the best of my knowledge. I understand that false or malicious nominations may result in account restrictions.
                </span>
              </label>
            </div>
          )}

          {/* ── Navigation ────────────────────────────────────────── */}
          <div className="flex justify-between items-center pt-2 border-t border-border/30">
            <button
              onClick={() => step === 1 ? handleClose() : setStep(s => (s - 1) as NomStep)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              {step === 1 ? 'Cancel' : '← Back'}
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(s => (s + 1) as NomStep)}
                disabled={step === 1 ? !step1Valid : !step2Valid}
                className={[
                  'rounded-full px-5 py-1.5 text-xs font-semibold transition-all',
                  (step === 1 ? step1Valid : step2Valid)
                    ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                    : 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground',
                ].join(' ')}
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!step3Valid}
                className={[
                  'rounded-full px-5 py-1.5 text-xs font-semibold transition-all',
                  step3Valid
                    ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                    : 'opacity-40 cursor-not-allowed bg-muted text-muted-foreground',
                ].join(' ')}
              >
                Submit nomination
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
