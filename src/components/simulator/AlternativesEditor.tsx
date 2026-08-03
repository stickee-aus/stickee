'use client'

import { Plus, X } from 'lucide-react'
import type { Alternative } from '@/types/simulator'

interface Props {
  alternatives: Alternative[]
  onChange: (next: Alternative[]) => void
  scenarioContext: string
}

const BIAS_LABELS: { value: number; label: string; tone: string }[] = [
  { value: -1, label: 'Relief',     tone: '#2ec266' },
  { value:  0, label: 'Neutral',    tone: '#f5a623' },
  { value:  1, label: 'Restrict',   tone: '#f04747' },
]

export function AlternativesEditor({ alternatives, onChange, scenarioContext }: Props) {
  function update(id: string, patch: Partial<Alternative>) {
    onChange(alternatives.map(a => (a.id === id ? { ...a, ...patch } : a)))
  }

  function remove(id: string) {
    if (alternatives.length <= 2) return
    onChange(alternatives.filter(a => a.id !== id))
  }

  function add() {
    if (alternatives.length >= 4) return
    const id = `custom-${Date.now()}`
    onChange([
      ...alternatives,
      {
        id,
        label: 'New alternative',
        description: 'Describe what this option does…',
        bias: 0,
        costLabel: 'Budget neutral',
      },
    ])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          Step 2 · Define 2–4 alternatives to compare
        </span>
        <button
          onClick={add}
          disabled={alternatives.length >= 4}
          className="flex items-center gap-1 font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={11} /> Add
        </button>
      </div>

      {scenarioContext && (
        <div
          className="rounded-lg border p-3 text-xs leading-relaxed text-muted-foreground"
          style={{ background: '#0a0a0b', borderColor: '#1e1e20' }}
        >
          <span className="font-mono text-[9px] tracking-widest uppercase block mb-1.5" style={{ color: '#3a3a3e' }}>
            Context
          </span>
          {scenarioContext}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {alternatives.map((a, idx) => (
          <div
            key={a.id}
            className="rounded-xl border p-3 space-y-3"
            style={{ background: '#0a0a0b', borderColor: '#1e1e20' }}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
                Option {String.fromCharCode(65 + idx)}
              </span>
              {alternatives.length > 2 && (
                <button
                  onClick={() => remove(a.id)}
                  className="p-0.5 text-muted-foreground/60 hover:text-foreground transition-colors"
                  aria-label="Remove alternative"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <input
              value={a.label}
              onChange={e => update(a.id, { label: e.target.value })}
              className="w-full bg-transparent border-b border-border/40 pb-1 text-sm font-medium text-foreground focus:outline-none focus:border-foreground/40"
              aria-label="Alternative label"
            />

            <textarea
              value={a.description}
              onChange={e => update(a.id, { description: e.target.value })}
              rows={3}
              className="w-full bg-transparent text-xs text-muted-foreground resize-none focus:outline-none"
              aria-label="Alternative description"
            />

            <div className="flex items-center gap-1 rounded-md p-0.5" style={{ background: '#111113' }}>
              {BIAS_LABELS.map(b => (
                <button
                  key={b.value}
                  onClick={() => update(a.id, { bias: b.value })}
                  className="flex-1 font-mono text-[9px] tracking-widest uppercase py-1 rounded transition-colors"
                  style={{
                    color:      a.bias === b.value ? b.tone : '#5a5a5e',
                    background: a.bias === b.value ? `${b.tone}18` : 'transparent',
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <input
              value={a.costLabel}
              onChange={e => update(a.id, { costLabel: e.target.value })}
              className="w-full bg-transparent font-mono text-[10px] text-muted-foreground border-b border-border/30 pb-0.5 focus:outline-none focus:border-foreground/30"
              aria-label="Cost label"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
