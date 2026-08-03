'use client'

import { Sparkles, RotateCw } from 'lucide-react'
import type { Alternative, SimulationResult } from '@/types/simulator'

interface Props {
  result: SimulationResult
  alternatives: Alternative[]
  onRerun: () => void
}

export function RecommendationCard({ result, alternatives, onRerun }: Props) {
  const winner = alternatives.find(a => a.id === result.recommendedAlternativeId)
  const winnerOutcome = result.outcomes.find(o => o.alternativeId === result.recommendedAlternativeId)
  if (!winner || !winnerOutcome) return null

  return (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{
        background: 'linear-gradient(180deg, #0a1410 0%, #0a0a0b 100%)',
        borderColor: '#0e3020',
        boxShadow: '0 0 0 1px #2ec26630',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-md flex items-center justify-center"
            style={{ background: '#2ec26618', color: '#2ec266' }}
          >
            <Sparkles size={14} />
          </div>
          <div>
            <span className="font-mono text-[10px] tracking-widest uppercase block" style={{ color: '#2ec266' }}>
              Best decision for the country
            </span>
            <p className="text-base font-medium text-foreground mt-0.5">{winner.label}</p>
          </div>
        </div>
        <button
          onClick={onRerun}
          className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase px-2.5 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
        >
          <RotateCw size={11} />
          Re-run
        </button>
      </div>

      <p className="text-sm text-foreground/80 leading-relaxed">
        {result.recommendationRationale}
      </p>

      <div className="grid gap-3 sm:grid-cols-3 pt-2 border-t" style={{ borderColor: '#1e1e20' }}>
        <div>
          <span className="font-mono text-[10px] tracking-widest uppercase block" style={{ color: '#3a3a3e' }}>
            Country score
          </span>
          <p className="font-mono text-2xl mt-0.5" style={{ color: '#2ec266' }}>
            {winnerOutcome.countryScore}<span className="text-xs text-muted-foreground/60 ml-1">/100</span>
          </p>
        </div>
        <div>
          <span className="font-mono text-[10px] tracking-widest uppercase block" style={{ color: '#3a3a3e' }}>
            Confidence
          </span>
          <p className="font-mono text-2xl mt-0.5 text-foreground">
            {winnerOutcome.confidence}<span className="text-xs text-muted-foreground/60 ml-1">%</span>
          </p>
        </div>
        <div>
          <span className="font-mono text-[10px] tracking-widest uppercase block" style={{ color: '#3a3a3e' }}>
            Population simulated
          </span>
          <p className="font-mono text-2xl mt-0.5 text-foreground">
            {(result.populationSize / 1_000_000).toFixed(1)}<span className="text-xs text-muted-foreground/60 ml-1">M</span>
          </p>
        </div>
      </div>

      <p className="font-mono text-[9px] pt-2 border-t" style={{ color: '#3a3a3e', borderColor: '#1e1e20' }}>
        Run · seed {result.seed.toString(36)} · {new Date(result.ranAt).toLocaleString('en-AU')} · This is a stylised
        prediction sandbox; real outcomes depend on factors not modelled here.
      </p>
    </div>
  )
}
