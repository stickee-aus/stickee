'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, X, MapPin, Layers, Mail, ChevronRight } from 'lucide-react'
import { CIVIC_PILLARS } from '@/lib/mock-civic-data'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3

const STORAGE_KEY = 'stickee:onboarding-complete'
const PREFS_KEY   = 'stickee:user-prefs'

export interface UserPrefs {
  electorate: string
  topIssues: string[]
}

// ─── Known electorates (sample) ──────────────────────────────────────────────

const ELECTORATES = [
  'Grayndler', 'Wentworth', 'North Sydney', 'Sydney', 'Warringah',
  'Melbourne', 'Kooyong', 'Goldstein', 'Macnamara', 'Chisholm',
  'Higgins', 'Richmond', 'Ryan', 'Brisbane', 'Griffith',
  'Dickson', 'Longman', 'Moreton', 'Rankin', 'Oxley',
  'Adelaide', 'Boothby', 'Hindmarsh', 'Sturt', 'Kingston',
  'Curtin', 'Perth', 'Fremantle', 'Cowan', 'Brand',
  'Franklin', 'Clark', 'Lyons', 'Bass',
  'Solomon', 'Lingiari',
  'Bean', 'Canberra', 'Fenner',
]

// ─── Step components ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: Step; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className="h-px transition-all duration-300"
          style={{
            width: i + 1 === current ? '24px' : '12px',
            background: i + 1 <= current ? '#e8e8e6' : '#2a2a2e',
          }}
        />
      ))}
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface OnboardingModalProps {
  onComplete: (prefs: UserPrefs) => void
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep]           = useState<Step>(1)
  const [electorate, setElectorate] = useState('')
  const [search, setSearch]       = useState('')
  const [topIssues, setTopIssues] = useState<string[]>([])

  const filteredEls = search.length >= 2
    ? ELECTORATES.filter(e => e.toLowerCase().includes(search.toLowerCase()))
    : ELECTORATES.slice(0, 8)

  function toggleIssue(id: string) {
    setTopIssues(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  function handleComplete() {
    const prefs: UserPrefs = { electorate, topIssues }
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
      localStorage.setItem(STORAGE_KEY, '1')
    } catch { /* ignore */ }
    onComplete(prefs)
  }

  const PILLAR_DISPLAY = [
    { id: 'housing',        label: 'Housing',         color: '#f04747', emoji: '🏠' },
    { id: 'cost-of-living', label: 'Cost of Living',  color: '#f04747', emoji: '💸' },
    { id: 'jobs-economy',   label: 'Jobs & Economy',  color: '#f5a623', emoji: '📊' },
    { id: 'crime-safety',   label: 'Crime & Safety',  color: '#f5a623', emoji: '🛡️' },
    { id: 'future',         label: 'Environment',     color: '#2ec266', emoji: '🌱' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-sm border border-border"
        style={{ background: '#0a0a0b' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Setup · {step}/3
            </p>
            <StepIndicator current={step} total={3} />
          </div>
          <button
            onClick={() => {
              try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
              onComplete({ electorate: '', topIssues: [] })
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step 1: Electorate */}
        {step === 1 && (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 flex items-center justify-center shrink-0" style={{ background: '#1e1e20' }}>
                <MapPin className="h-4 w-4" style={{ color: '#f5a623' }} />
              </div>
              <div>
                <h2 className="font-mono text-sm font-medium text-foreground">Where do you vote?</h2>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  We&apos;ll personalise your feed and tell you exactly how your MP voted.
                </p>
              </div>
            </div>

            <input
              type="text"
              placeholder="Search electorate…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-border bg-background px-3 py-2.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-white/20 transition-colors"
              autoFocus
            />

            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
              {filteredEls.map(el => (
                <button
                  key={el}
                  onClick={() => setElectorate(el)}
                  className="text-left font-mono text-[10px] px-2.5 py-2 border transition-colors"
                  style={{
                    borderColor: electorate === el ? '#e8e8e6' : '#1e1e20',
                    background:  electorate === el ? '#1e1e20' : 'transparent',
                    color:       electorate === el ? '#e8e8e6' : '#5a5a5e',
                  }}
                >
                  {electorate === el && <CheckCircle2 className="h-2.5 w-2.5 inline mr-1" style={{ color: '#2ec266' }} />}
                  {el}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setStep(2)}
                disabled={!electorate}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#e8e8e6', color: '#0a0a0b' }}
              >
                Continue <ChevronRight className="h-3 w-3" />
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase border border-border text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Issue preferences */}
        {step === 2 && (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 flex items-center justify-center shrink-0" style={{ background: '#1e1e20' }}>
                <Layers className="h-4 w-4" style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <h2 className="font-mono text-sm font-medium text-foreground">Pick your top 3 issues</h2>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  We&apos;ll prioritise these in your feed and alert you to relevant votes.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              {PILLAR_DISPLAY.map(p => {
                const selected = topIssues.includes(p.id)
                const disabled = !selected && topIssues.length >= 3
                return (
                  <button
                    key={p.id}
                    onClick={() => !disabled && toggleIssue(p.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 border transition-colors"
                    style={{
                      borderColor: selected ? p.color : '#1e1e20',
                      background:  selected ? `${p.color}08` : 'transparent',
                      opacity:     disabled ? 0.4 : 1,
                      cursor:      disabled ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span className="text-base">{p.emoji}</span>
                    <span className="font-mono text-xs" style={{ color: selected ? p.color : '#5a5a5e' }}>
                      {p.label}
                    </span>
                    {selected && (
                      <CheckCircle2 className="h-3.5 w-3.5 ml-auto" style={{ color: p.color }} />
                    )}
                  </button>
                )
              })}
            </div>

            <p className="font-mono text-[9px] text-muted-foreground">
              {topIssues.length}/3 selected
            </p>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 font-mono text-[10px] tracking-widest uppercase border border-border text-muted-foreground hover:text-foreground transition-colors">
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all"
                style={{ background: '#e8e8e6', color: '#0a0a0b' }}
              >
                Continue <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: First action */}
        {step === 3 && (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 flex items-center justify-center shrink-0" style={{ background: '#1e1e20' }}>
                <Mail className="h-4 w-4" style={{ color: '#2ec266' }} />
              </div>
              <div>
                <h2 className="font-mono text-sm font-medium text-foreground">Take your first action</h2>
                <p className="font-mono text-xs text-muted-foreground mt-1">
                  {electorate
                    ? `You're in ${electorate}. Email your MP directly — it takes 30 seconds.`
                    : 'Email your MP directly — it takes 30 seconds and builds your civic score.'}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="border border-border p-3 space-y-2" style={{ background: '#0e0e10' }}>
              <p className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground">Your setup</p>
              {electorate && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 shrink-0" style={{ color: '#5a5a5e' }} />
                  <span className="font-mono text-xs text-foreground">{electorate}</span>
                </div>
              )}
              {topIssues.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {topIssues.map(id => {
                    const p = PILLAR_DISPLAY.find(x => x.id === id)
                    return p ? (
                      <span key={id} className="font-mono text-[9px] px-1.5 py-0.5 border" style={{ color: p.color, borderColor: `${p.color}30` }}>
                        {p.label}
                      </span>
                    ) : null
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Link
                href="/issues"
                onClick={handleComplete}
                className="flex items-center justify-center gap-2 w-full py-2.5 font-mono text-[10px] tracking-widest uppercase transition-all"
                style={{ background: '#e8e8e6', color: '#0a0a0b' }}
              >
                <Mail className="h-3 w-3" /> Email my MP (+150 pts)
              </Link>
              <Link
                href="/predictions"
                onClick={handleComplete}
                className="flex items-center justify-center gap-2 w-full py-2.5 font-mono text-[10px] tracking-widest uppercase border border-border transition-colors hover:bg-card/50"
              >
                Make a prediction (+50 pts)
              </Link>
              <button
                onClick={handleComplete}
                className="w-full py-2.5 font-mono text-[10px] tracking-widest uppercase transition-colors"
                style={{ color: '#3a3a3e' }}
              >
                Explore first →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Controller: shows modal on first visit ───────────────────────────────────

export function OnboardingController() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY)
      if (!done) setShow(true)
    } catch { /* ignore */ }
  }, [])

  if (!show) return null

  return (
    <OnboardingModal
      onComplete={() => setShow(false)}
    />
  )
}
