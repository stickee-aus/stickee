'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Heart,
  MapPin,
  Wrench,
  MessageSquare,
  Share2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import type { FutureLeader, SupportType, SkillTag, AvailabilityLevel } from '@/types/leaders'
import type { AustralianState } from '@/types/government'

interface SupportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leader: FutureLeader
}

type SupportStep = 1 | 2 | 3

const STATES: AustralianState[] = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']

const SUPPORT_TYPES: { type: SupportType; Icon: React.ElementType; subText: string }[] = [
  { type: 'General Support',   Icon: Heart,          subText: 'Show this leader they have your backing.' },
  { type: 'Volunteer Locally', Icon: MapPin,          subText: 'Help with on-the-ground activity in your area.' },
  { type: 'Offer Skills',      Icon: Wrench,          subText: 'Contribute professional expertise to their work.' },
  { type: 'Join Discussions',  Icon: MessageSquare,   subText: 'Engage in policy and community conversations.' },
  { type: 'Advocate / Share',  Icon: Share2,          subText: 'Help spread the word in your networks.' },
]

const SKILL_TAGS: SkillTag[] = [
  'Legal', 'Marketing', 'Technology', 'Operations',
  'Communications', 'Fundraising', 'Data', 'Policy',
]

const AVAILABILITY_LEVELS: AvailabilityLevel[] = [
  'Weekend warrior',
  'Few hours/week',
  'Full-time',
]

// ─── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: SupportStep }) {
  const steps = [
    { n: 1 as SupportStep, label: 'Support' },
    { n: 2 as SupportStep, label: 'Details' },
    { n: 3 as SupportStep, label: 'Confirm' },
  ]
  return (
    <div className="flex items-center">
      {steps.map(({ n, label }, i) => {
        const done   = current > n
        const active = current === n
        const isLast = i === steps.length - 1
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

// ─── Main modal ────────────────────────────────────────────────────────────────

export function SupportModal({ open, onOpenChange, leader }: SupportModalProps) {
  const { toast } = useToast()
  const [step, setStep] = useState<SupportStep>(1)

  // Step 1
  const [selectedTypes, setSelectedTypes] = useState<SupportType[]>([])

  // Step 2
  const [selectedSkills, setSelectedSkills] = useState<SkillTag[]>([])
  const [availability, setAvailability]     = useState<AvailabilityLevel | null>(null)
  const [locationState, setLocationState]   = useState<AustralianState | ''>('')
  const [postcode, setPostcode]             = useState('')
  const [isPublic, setIsPublic]             = useState(true)

  // Step 3
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [submitting, setSubmitting]                 = useState(false)

  const consentGiven = leader.nomination.consentGiven
  const isApproved   = leader.nomination.moderationStatus === 'approved'

  const step1Valid = selectedTypes.length > 0 && consentGiven && isApproved
  const step2Valid = selectedTypes.includes('Offer Skills') ? selectedSkills.length > 0 : true
  const step3Valid = disclaimerAccepted

  const inputClass = 'w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors'
  const labelClass = 'block text-xs font-semibold text-foreground/80 mb-1.5'

  function toggleType(type: SupportType) {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  function toggleSkill(skill: SkillTag) {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  function handleClose() {
    onOpenChange(false)
    setTimeout(() => {
      setStep(1)
      setSelectedTypes([])
      setSelectedSkills([])
      setAvailability(null)
      setLocationState('')
      setPostcode('')
      setIsPublic(true)
      setDisclaimerAccepted(false)
    }, 300)
  }

  async function handleSubmit() {
    if (!step3Valid || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/leaders/${leader.id}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supportTypes: selectedTypes,
          skills:       selectedSkills,
          availability: availability ?? null,
          postcode:     postcode.trim() || null,
          state:        locationState || null,
          isPublic,
        }),
      })
      if (res.status === 201) {
        toast('Your support has been recorded. Thank you.', 'success')
        handleClose()
      } else if (res.status === 409) {
        toast('You have already registered your support for this leader.', 'info')
        handleClose()
      } else if (res.status === 401) {
        toast('You need to sign in to support a leader.', 'error')
      } else {
        toast('Something went wrong. Please try again.', 'error')
      }
    } catch {
      toast('Something went wrong. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Support {leader.name}</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Civic support, not an official vote. Your input builds real-world momentum.
          </p>
        </DialogHeader>

        <div className="space-y-5">
          <StepIndicator current={step} />

          {/* ── Step 1: Support type ──────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Disclaimer banner */}
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-400/10 ring-1 ring-amber-400/25 p-3.5">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  Supporting a leader is a public expression of civic intent. This platform is independent and not affiliated with any political party.
                </p>
              </div>

              {/* Consent gate */}
              {(!consentGiven || !isApproved) ? (
                <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-center">
                  <p className="text-sm text-muted-foreground/70">
                    This leader has not yet opened their profile for support.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground/70 mb-2">
                    How would you like to support this leader? <span className="text-muted-foreground/50 font-normal">(select all that apply)</span>
                  </p>
                  {SUPPORT_TYPES.map(({ type, Icon, subText }) => {
                    const selected = selectedTypes.includes(type)
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleType(type)}
                        className={[
                          'w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                          selected
                            ? 'bg-primary/10 ring-1 ring-primary/40 border-primary/30 text-primary'
                            : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground/80',
                        ].join(' ')}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">{type}</p>
                          <p className={`text-[11px] mt-0.5 ${selected ? 'text-primary/60' : 'text-muted-foreground/50'}`}>
                            {subText}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Details ───────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Skills grid — only if Offer Skills selected */}
              {selectedTypes.includes('Offer Skills') && (
                <div>
                  <label className={labelClass}>
                    Skills you can offer *
                    <span className="ml-1 font-normal text-muted-foreground/50">(select at least one)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {SKILL_TAGS.map(skill => {
                      const selected = selectedSkills.includes(skill)
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className={[
                            'rounded-full px-3 py-1 text-xs font-medium border transition-all',
                            selected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border/50 text-muted-foreground hover:border-border',
                          ].join(' ')}
                        >
                          {skill}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Availability */}
              <div>
                <label className={labelClass}>
                  Availability <span className="font-normal text-muted-foreground/50">(optional)</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {AVAILABILITY_LEVELS.map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setAvailability(prev => prev === level ? null : level)}
                      className={[
                        'rounded-full px-3 py-1.5 text-xs font-medium border transition-all',
                        availability === level
                          ? 'bg-primary/10 ring-1 ring-primary/40 border-primary/30 text-primary'
                          : 'border-border/50 text-muted-foreground hover:border-border',
                      ].join(' ')}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className={labelClass}>
                  Your location <span className="font-normal text-muted-foreground/50">(optional — helps show local momentum)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={locationState}
                    onChange={e => setLocationState(e.target.value as AustralianState)}
                    className={inputClass}
                  >
                    <option value="">State / Territory</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Postcode"
                    value={postcode}
                    onChange={e => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setPostcode(v)
                    }}
                    maxLength={4}
                    className={inputClass}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground/50">
                  Only your state is shown publicly. Postcode is never disclosed.
                </p>
              </div>

              {/* isPublic */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border/60 accent-primary"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Show me in the public supporter count
                </span>
              </label>
            </div>
          )}

          {/* ── Step 3: Confirm ───────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
                <p className="text-xs font-semibold text-foreground/70 mb-3">Your support summary</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <div>
                    <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wide mb-0.5">Support type</p>
                    <p className="text-xs text-foreground/80">{selectedTypes.join(', ')}</p>
                  </div>
                  {selectedSkills.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wide mb-0.5">Skills offered</p>
                      <p className="text-xs text-foreground/80">{selectedSkills.join(', ')}</p>
                    </div>
                  )}
                  {locationState && (
                    <div>
                      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wide mb-0.5">Location</p>
                      <p className="text-xs text-foreground/80">{locationState}</p>
                    </div>
                  )}
                  {availability && (
                    <div>
                      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wide mb-0.5">Availability</p>
                      <p className="text-xs text-foreground/80">{availability}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wide mb-0.5">Visibility</p>
                    <p className="text-xs text-foreground/80">{isPublic ? 'Public count' : 'Private'}</p>
                  </div>
                </div>
              </div>

              {/* Disclaimer checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={disclaimerAccepted}
                  onChange={e => setDisclaimerAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border/60 accent-primary"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I understand this is civic mobilisation, not an official vote or political party affiliation.
                  I am supporting this leader in good faith.
                </span>
              </label>
            </div>
          )}

          {/* ── Nav footer ────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/30">
            <button
              type="button"
              onClick={step === 1 ? handleClose : () => setStep(prev => (prev - 1) as SupportStep)}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {step === 1 ? 'Cancel' : '← Back'}
            </button>

            {step < 3 ? (
              <button
                type="button"
                disabled={step === 1 ? !step1Valid : !step2Valid}
                onClick={() => setStep(prev => (prev + 1) as SupportStep)}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                type="button"
                disabled={!step3Valid || submitting}
                onClick={handleSubmit}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? 'Recording…' : 'Record My Support'}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
