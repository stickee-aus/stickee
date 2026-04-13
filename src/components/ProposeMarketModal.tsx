'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Send } from 'lucide-react'
import type { MarketCategory } from '@/lib/mock-market-data'

// ─── Proposal type ────────────────────────────────────────────────────────────

export interface MarketProposal {
  id: string
  question: string
  category: MarketCategory | 'custom'
  resolvesBy: string
  description: string
  submittedAt: number
  status: 'pending' | 'approved' | 'rejected'
}

const STORAGE_KEY = 'stickee_proposals_v1'

export function loadProposals(): MarketProposal[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MarketProposal[]) : []
  } catch { return [] }
}

export function saveProposal(p: MarketProposal) {
  const existing = loadProposals()
  const next = [p, ...existing]
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
}

// ─── Category options ─────────────────────────────────────────────────────────

const CATEGORIES: { key: MarketCategory | 'custom'; label: string; description: string }[] = [
  { key: 'bill',     label: 'Bill / Policy',  description: 'Will a specific bill pass or have a certain outcome?' },
  { key: 'election', label: 'Election',        description: 'Who wins an electorate, election, or leadership vote?' },
  { key: 'mp-vote',  label: 'MP Vote',         description: 'Will a specific MP vote a certain way on a bill?' },
  { key: 'civic',    label: 'Civic Score',     description: 'Will a civic metric hit a target by a deadline?' },
  { key: 'custom',   label: 'Other',           description: 'Any question about Australian politics or governance' },
]

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ProposeMarketModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmitted: (proposal: MarketProposal) => void
}

export function ProposeMarketModal({ open, onOpenChange, onSubmitted }: ProposeMarketModalProps) {
  const [category,    setCategory]    = useState<MarketCategory | 'custom'>('bill')
  const [question,    setQuestion]    = useState('')
  const [resolvesBy,  setResolvesBy]  = useState('')
  const [description, setDescription] = useState('')
  const [submitted,   setSubmitted]   = useState(false)

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setCategory('bill')
      setQuestion('')
      setResolvesBy('')
      setDescription('')
      setSubmitted(false)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onOpenChange])

  const canSubmit = question.trim().length >= 20 && resolvesBy.trim().length > 0

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return
    const proposal: MarketProposal = {
      id: `proposal-${Date.now()}`,
      question:    question.trim(),
      category,
      resolvesBy:  resolvesBy.trim(),
      description: description.trim(),
      submittedAt: Date.now(),
      status:      'pending',
    }
    saveProposal(proposal)
    onSubmitted(proposal)
    setSubmitted(true)
    setTimeout(() => onOpenChange(false), 1800)
  }, [canSubmit, question, category, resolvesBy, description, onSubmitted, onOpenChange])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border overflow-hidden shadow-2xl"
        style={{ background: '#111113', borderColor: '#1e1e20' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
          style={{ color: '#5a5a5e' }}
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: '#1e1e20' }}>
          <p className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: '#5a5a5e' }}>
            Community Proposal
          </p>
          <p className="text-sm font-medium text-foreground">Propose a new market</p>
          <p className="font-mono text-[10px] mt-1" style={{ color: '#3a3a3e' }}>
            Proposals are reviewed before going live · Usually within 24–48h
          </p>
        </div>

        {submitted ? (
          <div className="px-6 py-10 text-center">
            <p className="font-mono text-[10px] tracking-widest uppercase mb-2" style={{ color: '#2ec266' }}>
              ✓ Submitted
            </p>
            <p className="text-sm text-foreground">Your proposal is pending review.</p>
            <p className="font-mono text-[10px] mt-1" style={{ color: '#3a3a3e' }}>
              It will appear as &ldquo;Pending&rdquo; in the markets table.
            </p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-4">
            {/* Category */}
            <div>
              <p className="font-mono text-[9px] tracking-widest uppercase mb-2" style={{ color: '#3a3a3e' }}>Category</p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {CATEGORIES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className="font-mono text-[10px] tracking-wide uppercase px-2.5 py-1.5 rounded-lg text-left transition-all"
                    style={{
                      background:  category === key ? '#1e1e20' : 'transparent',
                      color:       category === key ? '#e8e8e6' : '#5a5a5e',
                      border:      `1px solid ${category === key ? '#2a2a2e' : '#1e1e20'}`,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="font-mono text-[9px] mt-1.5" style={{ color: '#3a3a3e' }}>
                {CATEGORIES.find(c => c.key === category)?.description}
              </p>
            </div>

            {/* Question */}
            <div>
              <p className="font-mono text-[9px] tracking-widest uppercase mb-1.5" style={{ color: '#3a3a3e' }}>
                Market question <span style={{ color: '#2a2a2e' }}>(min 20 chars)</span>
              </p>
              <textarea
                rows={2}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="Will the government…? Who will…? By what date will…?"
                className="w-full font-mono text-xs text-foreground px-3 py-2.5 rounded-lg border resize-none outline-none transition-colors"
                style={{ background: '#0a0a0b', borderColor: '#1e1e20', color: '#e8e8e6' }}
              />
              <p className="font-mono text-[9px] mt-0.5 text-right" style={{ color: question.length >= 20 ? '#2ec266' : '#3a3a3e' }}>
                {question.length}/20 min
              </p>
            </div>

            {/* Resolves by */}
            <div>
              <p className="font-mono text-[9px] tracking-widest uppercase mb-1.5" style={{ color: '#3a3a3e' }}>
                Resolves by
              </p>
              <input
                type="text"
                value={resolvesBy}
                onChange={e => setResolvesBy(e.target.value)}
                placeholder="e.g. Dec 2025, Q1 2026, End of 48th Parliament"
                className="w-full font-mono text-xs text-foreground px-3 py-2.5 rounded-lg border outline-none transition-colors"
                style={{ background: '#0a0a0b', borderColor: '#1e1e20', color: '#e8e8e6' }}
              />
            </div>

            {/* Description (optional) */}
            <div>
              <p className="font-mono text-[9px] tracking-widest uppercase mb-1.5" style={{ color: '#3a3a3e' }}>
                Why should this market exist? <span style={{ color: '#2a2a2e' }}>(optional)</span>
              </p>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Explain the resolution criteria or why this is important…"
                className="w-full font-mono text-xs text-foreground px-3 py-2.5 rounded-lg border resize-none outline-none transition-colors"
                style={{ background: '#0a0a0b', borderColor: '#1e1e20', color: '#e8e8e6' }}
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full py-3 rounded-xl font-mono text-xs tracking-widest uppercase font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              style={{ background: canSubmit ? '#e8e8e6' : '#1e1e20', color: canSubmit ? '#0a0a0b' : '#5a5a5e' }}
            >
              <Send size={12} />
              Submit for review
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
