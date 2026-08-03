'use client'

import type { Alternative, AlternativeOutcome } from '@/types/simulator'
import type { PillarId } from '@/types/civic'
import { CIVIC_PILLARS } from '@/lib/mock-civic-data'
import { SIMULATOR_LEADERS } from '@/lib/mock-simulator-data'

interface Props {
  alternatives: Alternative[]
  outcomes: AlternativeOutcome[]
  recommendedId: string
}

const PILLAR_SHORT: Record<PillarId, string> = {
  'cost-of-living': 'Cost of Living',
  housing: 'Housing',
  'crime-safety': 'Crime & Safety',
  'jobs-economy': 'Jobs & Economy',
  future: 'Future',
}

function deltaColor(d: number): string {
  if (d > 1) return '#2ec266'
  if (d < -1) return '#f04747'
  return '#5a5a5e'
}

function fmt(d: number, suffix = ''): string {
  return `${d > 0 ? '+' : ''}${d}${suffix}`
}

export function OutcomeMatrix({ alternatives, outcomes, recommendedId }: Props) {
  const orderedOutcomes = alternatives
    .map(a => outcomes.find(o => o.alternativeId === a.id))
    .filter((o): o is AlternativeOutcome => Boolean(o))

  return (
    <div className="space-y-6">
      {/* ── Country Score row ─────────────────────────────────────────────── */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${alternatives.length}, minmax(0, 1fr))` }}>
        {alternatives.map((alt, i) => {
          const o = orderedOutcomes[i]
          if (!o) return null
          const isWinner = o.alternativeId === recommendedId
          return (
            <div
              key={alt.id}
              className="rounded-xl border p-4 space-y-2 transition-colors"
              style={{
                background: '#0a0a0b',
                borderColor: isWinner ? '#2ec266' : '#1e1e20',
                boxShadow:   isWinner ? '0 0 0 1px #2ec26640' : undefined,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: isWinner ? '#2ec266' : '#3a3a3e' }}>
                  Option {String.fromCharCode(65 + i)}{isWinner && ' · Recommended'}
                </span>
                <span className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>
                  {alt.costLabel}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground">{alt.label}</p>
              <div className="flex items-baseline gap-2">
                <span
                  className="font-mono text-3xl"
                  style={{ color: o.countryScore >= 60 ? '#2ec266' : o.countryScore >= 40 ? '#f5a623' : '#f04747' }}
                >
                  {o.countryScore}
                </span>
                <span className="font-mono text-xs text-muted-foreground/60">/100 country score</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">{o.headline}</p>
              <div className="flex items-center justify-between pt-1.5 border-t" style={{ borderColor: '#1e1e20' }}>
                <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
                  Confidence
                </span>
                <span className="font-mono text-[10px]" style={{ color: '#5a5a5e' }}>{o.confidence}%</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Pillar impact matrix ──────────────────────────────────────────── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: '#0a0a0b', borderColor: '#1e1e20' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: '#1e1e20' }}>
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Civic Pillar Impact · Δ score per pillar
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#1e1e20' }}>
                <th className="text-left font-mono text-[9px] tracking-widest uppercase px-4 py-2.5" style={{ color: '#2a2a2e' }}>
                  Pillar
                </th>
                {alternatives.map((a, i) => (
                  <th key={a.id} className="text-right font-mono text-[9px] tracking-widest uppercase px-4 py-2.5" style={{ color: '#2a2a2e' }}>
                    {String.fromCharCode(65 + i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CIVIC_PILLARS.map(pillar => (
                <tr key={pillar.id} className="border-b" style={{ borderColor: '#0e0e10' }}>
                  <td className="px-4 py-2.5 text-xs text-foreground/90">{PILLAR_SHORT[pillar.id]}</td>
                  {orderedOutcomes.map(o => {
                    const impact = o.pillarImpacts.find(p => p.pillarId === pillar.id)
                    if (!impact) return <td key={o.alternativeId} className="px-4 py-2.5" />
                    return (
                      <td key={o.alternativeId} className="px-4 py-2.5 text-right">
                        <span className="font-mono text-xs tabular-nums" style={{ color: deltaColor(impact.scoreDelta) }}>
                          {fmt(impact.scoreDelta)}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Markets, Geopolitics ──────────────────────────────────────────── */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div
          className="rounded-xl border p-4 space-y-3"
          style={{ background: '#0a0a0b', borderColor: '#1e1e20' }}
        >
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Market reaction
          </span>
          <div className="space-y-2.5">
            {orderedOutcomes.map((o, i) => (
              <div key={o.alternativeId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#5a5a5e' }}>
                    Option {String.fromCharCode(65 + i)}
                  </span>
                  <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
                    <span style={{ color: deltaColor(o.marketImpact.asx200Pct) }}>
                      ASX {fmt(o.marketImpact.asx200Pct, '%')}
                    </span>
                    <span style={{ color: deltaColor(-o.marketImpact.audUsdBp / 10) }}>
                      AUD {fmt(o.marketImpact.audUsdBp, 'bp')}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  <span style={{ color: '#2ec266' }}>↑ {o.marketImpact.winners.join(', ') || '—'}</span>{' '}·{' '}
                  <span style={{ color: '#f04747' }}>↓ {o.marketImpact.losers.join(', ') || '—'}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl border p-4 space-y-3"
          style={{ background: '#0a0a0b', borderColor: '#1e1e20' }}
        >
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Geopolitical risk · index Δ
          </span>
          <div className="space-y-2.5">
            {orderedOutcomes.map((o, i) => {
              const tense = o.geopoliticalRiskDelta
              return (
                <div key={o.alternativeId} className="flex items-center gap-3">
                  <span className="font-mono text-[10px] tracking-widest uppercase w-16" style={{ color: '#5a5a5e' }}>
                    Option {String.fromCharCode(65 + i)}
                  </span>
                  <div className="flex-1 h-1 relative" style={{ background: '#1e1e20' }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: tense >= 0 ? '50%' : `${50 + tense * 5}%`,
                        width: `${Math.min(50, Math.abs(tense) * 5)}%`,
                        top: 0,
                        height: '100%',
                        background: tense > 0 ? '#f04747' : tense < 0 ? '#2ec266' : '#5a5a5e',
                      }}
                    />
                    <span
                      className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 h-2 w-px"
                      style={{ background: '#3a3a3e' }}
                    />
                  </div>
                  <span className="font-mono text-xs tabular-nums w-12 text-right" style={{ color: deltaColor(-tense) }}>
                    {fmt(tense)}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>
            Negative = calmer, positive = more tense
          </p>
        </div>
      </div>

      {/* ── Leader approval ───────────────────────────────────────────────── */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: '#0a0a0b', borderColor: '#1e1e20' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: '#1e1e20' }}>
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Leader approval Δ · projected percentage points
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#1e1e20' }}>
                <th className="text-left font-mono text-[9px] tracking-widest uppercase px-4 py-2.5" style={{ color: '#2a2a2e' }}>
                  Leader
                </th>
                {alternatives.map((a, i) => (
                  <th key={a.id} className="text-right font-mono text-[9px] tracking-widest uppercase px-4 py-2.5" style={{ color: '#2a2a2e' }}>
                    {String.fromCharCode(65 + i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIMULATOR_LEADERS.map(l => (
                <tr key={l.mpId} className="border-b" style={{ borderColor: '#0e0e10' }}>
                  <td className="px-4 py-2.5">
                    <span className="text-xs text-foreground/90">{l.name}</span>
                    <span className="font-mono text-[9px] ml-2" style={{ color: '#3a3a3e' }}>{l.party}</span>
                  </td>
                  {orderedOutcomes.map(o => {
                    const d = o.leaderImpact.approvalDeltaByMp[l.mpId] ?? 0
                    return (
                      <td key={o.alternativeId} className="px-4 py-2.5 text-right">
                        <span className="font-mono text-xs tabular-nums" style={{ color: deltaColor(d) }}>
                          {fmt(d, 'pp')}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Sentiment + cohort quotes ─────────────────────────────────────── */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${alternatives.length}, minmax(0, 1fr))` }}>
        {orderedOutcomes.map((o, i) => (
          <div
            key={o.alternativeId}
            className="rounded-xl border p-4 space-y-3"
            style={{ background: '#0a0a0b', borderColor: '#1e1e20' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
                Option {String.fromCharCode(65 + i)} · Public sentiment
              </span>
            </div>
            <div className="flex h-1.5 rounded overflow-hidden" style={{ background: '#1e1e20' }}>
              <div style={{ width: `${o.sentiment.approvePct}%`, background: '#2ec266' }} />
              <div style={{ width: `${o.sentiment.disapprovePct}%`, background: '#f04747' }} />
            </div>
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span style={{ color: '#2ec266' }}>{o.sentiment.approvePct}% approve</span>
              <span style={{ color: '#f04747' }}>{o.sentiment.disapprovePct}% disapprove</span>
            </div>
            {o.sentiment.topEndorsements[0] && (
              <p className="text-[11px] leading-snug" style={{ color: '#9aa39a' }}>
                <span className="font-mono text-[9px] tracking-widest uppercase block mb-1" style={{ color: '#2ec266' }}>For</span>
                &ldquo;{o.sentiment.topEndorsements[0]}&rdquo;
              </p>
            )}
            {o.sentiment.topObjections[0] && (
              <p className="text-[11px] leading-snug" style={{ color: '#a39a9a' }}>
                <span className="font-mono text-[9px] tracking-widest uppercase block mb-1" style={{ color: '#f04747' }}>Against</span>
                &ldquo;{o.sentiment.topObjections[0]}&rdquo;
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
