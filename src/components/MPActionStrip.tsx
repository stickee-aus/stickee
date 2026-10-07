'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, MapPin, RotateCcw, ArrowRight } from 'lucide-react'
import { EmailMPModal } from '@/components/EmailMPModal'
import { PARTY_COLORS } from '@/lib/mock-parliament-data'
import type { ElectorateDetectState } from '@/hooks/useElectorate'
import type { MP, Issue } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MPActionStripProps {
  mp: MP | null
  electorate: string | null
  detectState: ElectorateDetectState
  suggestedElectorate: string | null
  onDetectByLocation: () => void
  onManualSetElectorate: (e: string) => void
  onClearElectorate: () => void
  onConfirmSuggested: () => void
  onRejectSuggested: () => void
}

// ─── Electorate resolution flow ──────────────────────────────────────────────
// The automatic "detect" path only ever narrows to a state and returns the
// first known electorate there — it is not a real geographic electorate
// boundary lookup. That result is a suggestion, never a fact, until the user
// explicitly confirms it (or enters their electorate manually, which is an
// unambiguous, user-asserted match).

function ElectoratePrompt({
  detectState,
  suggestedElectorate,
  onDetect,
  onManual,
  onConfirmSuggested,
  onRejectSuggested,
}: {
  detectState: ElectorateDetectState
  suggestedElectorate: string | null
  onDetect: () => void
  onManual: (e: string) => void
  onConfirmSuggested: () => void
  onRejectSuggested: () => void
}) {
  const [manualMode, setManualMode] = useState(detectState === 'suggested' || detectState === 'error')
  const [input, setInput] = useState('')

  function handleManualSubmit() {
    if (input.trim()) onManual(input.trim())
  }

  if (detectState === 'suggested' && suggestedElectorate && !manualMode) {
    return (
      <div className="border border-border p-4">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={12} className="shrink-0 text-muted-foreground" />
          <p className="text-xs uppercase tracking-widest text-foreground">Confirm your electorate</p>
        </div>
        <p className="text-body-copy text-muted-foreground mb-4">
          Based on your approximate location, you may be in <strong className="text-foreground">{suggestedElectorate}</strong>.
          This is not a precise electorate boundary match — please confirm it&apos;s correct, or enter your electorate manually.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirmSuggested}
            className="flex-1 border border-foreground px-3 py-2 text-xs uppercase tracking-widest text-foreground hover:opacity-70 transition-calm"
          >
            Yes, that&apos;s correct
          </button>
          <button
            onClick={() => { onRejectSuggested(); setManualMode(true) }}
            className="flex-1 border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-calm"
          >
            Enter manually
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={12} className="shrink-0 text-muted-foreground" />
        <p className="text-xs uppercase tracking-widest text-foreground">Find your representative</p>
      </div>
      <p className="text-body-copy text-muted-foreground mb-4">
        Enter your electorate to see your representative. Automatic location detection can only
        suggest a nearby electorate for you to confirm — it cannot verify it precisely.
      </p>

      {detectState === 'error' && (
        <p className="text-xs text-muted-foreground/80 mb-3">
          Automatic detection didn&apos;t return a confirmed match. Enter your electorate below.
        </p>
      )}

      {manualMode ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
            placeholder="e.g. Kooyong, Warringah"
            className="flex-1 border border-border bg-background px-3 py-2 text-body-copy text-foreground placeholder:text-muted-foreground/40 focus:border-foreground/40 focus:outline-none transition-calm"
            autoFocus
          />
          <button
            onClick={handleManualSubmit}
            className="border border-border px-3 py-2 text-xs uppercase tracking-widest text-foreground hover:border-foreground/50 transition-calm"
          >
            Go
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onDetect}
            disabled={detectState === 'detecting'}
            className="flex-1 flex items-center justify-center gap-1.5 border border-border px-3 py-2 text-xs uppercase tracking-widest text-foreground hover:opacity-70 transition-calm disabled:opacity-50"
          >
            <MapPin size={10} />
            {detectState === 'detecting' ? 'Detecting…' : 'Detect (approximate)'}
          </button>
          <button
            onClick={() => setManualMode(true)}
            className="flex-1 border border-border px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-calm"
          >
            Enter manually
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
  detectState,
  suggestedElectorate,
  onDetectByLocation,
  onManualSetElectorate,
  onClearElectorate,
  onConfirmSuggested,
  onRejectSuggested,
}: MPActionStripProps) {
  const [emailOpen, setEmailOpen] = useState(false)

  // Only ever treat someone as "your representative" once the electorate
  // relationship is genuinely known (manual entry, or an explicitly
  // confirmed location suggestion) — never a bare, unconfirmed detect result.
  if (!mp || !electorate) {
    return (
      <ElectoratePrompt
        detectState={detectState}
        suggestedElectorate={suggestedElectorate}
        onDetect={onDetectByLocation}
        onManual={onManualSetElectorate}
        onConfirmSuggested={onConfirmSuggested}
        onRejectSuggested={onRejectSuggested}
      />
    )
  }

  const partyColor = PARTY_COLORS[mp.party] ?? '#999'

  const emailIssue: Issue = {
    id: 'mp-contact',
    title: `A message for my representative in ${mp.electorate}`,
    content: '',
    summary: '',
    whatIsHappening: '',
    whoSupports: '',
    whoOpposes: '',
    status: 'active',
  }

  return (
    <div className="border border-border overflow-hidden">
      {/* MP header */}
      <div className="px-4 py-3 border-b border-border border-l-2" style={{ borderLeftColor: partyColor }}>
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 flex items-center justify-center text-[11px] font-medium shrink-0"
            style={{ background: `${partyColor}18`, color: partyColor }}
          >
            {mp.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium truncate">{mp.name}</p>
            <p className="text-metadata normal-case tracking-normal text-muted-foreground">
              {mp.electorate} · House of Representatives
            </p>
            <span
              className="inline-block text-[10px] tracking-widest uppercase border px-1.5 py-0.5 mt-1"
              style={{ borderColor: `${partyColor}40`, color: partyColor }}
            >
              {mp.party}
            </span>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
        <Link
          href={`/mp/${mp.id}`}
          className="flex items-center gap-1 text-xs font-medium text-foreground hover:opacity-70 transition-calm"
        >
          View full profile
          <ArrowRight size={11} />
        </Link>
        <button
          onClick={() => setEmailOpen(true)}
          className="flex items-center gap-1.5 border border-border px-3 py-2 text-[10px] uppercase tracking-widest text-foreground hover:opacity-70 transition-calm ml-auto"
        >
          <Mail size={10} />
          Contact {mp.name.split(' ')[0]}
        </button>
        <button
          onClick={onClearElectorate}
          className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-calm shrink-0"
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
