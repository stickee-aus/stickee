'use client'

import { useEffect, useState, useMemo } from 'react'
import { AGENT_COHORTS, TOTAL_POPULATION } from '@/lib/mock-simulator-data'

/**
 * Visual representation of the synthetic electorate during a simulation
 * "tick". Each dot represents a cohort; size scales with cohort population
 * and colour reflects political lean. While the simulation is running the
 * dots pulse to suggest agent interaction; once complete they settle.
 */

const LEAN_COLOR: Record<string, string> = {
  progressive: '#7c8cff',
  centrist:    '#f5a623',
  conservative: '#f04747',
}

interface Dot {
  id: string
  cx: number
  cy: number
  r: number
  color: string
  label: string
  size: number
}

function layoutDots(): Dot[] {
  const dots: Dot[] = []
  const cols = 4
  const rows = 3
  const pad = 24
  const gridW = 600 - pad * 2
  const gridH = 200 - pad * 2
  AGENT_COHORTS.forEach((c, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const cx = pad + (col + 0.5) * (gridW / cols)
    const cy = pad + (row + 0.5) * (gridH / rows)
    const r = 6 + (c.size / TOTAL_POPULATION) * 60
    dots.push({
      id: c.id,
      cx, cy, r,
      color: LEAN_COLOR[c.lean] ?? '#5a5a5e',
      label: c.label,
      size: c.size,
    })
  })
  return dots
}

interface Props {
  /** 'idle' before run, 'running' during the animation, 'done' after */
  status: 'idle' | 'running' | 'done'
}

export function AgentSwarmAnimation({ status }: Props) {
  const dots = useMemo(layoutDots, [])
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (status !== 'running') return
    const interval = setInterval(() => setTick(t => t + 1), 220)
    return () => clearInterval(interval)
  }, [status])

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ background: '#0a0a0b', borderColor: '#1e1e20' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          Synthetic electorate · {AGENT_COHORTS.length} cohorts · {(TOTAL_POPULATION / 1_000_000).toFixed(1)}M agents
        </span>
        <span
          className="font-mono text-[10px] tracking-widest uppercase"
          style={{ color: status === 'running' ? '#f5a623' : status === 'done' ? '#2ec266' : '#3a3a3e' }}
        >
          {status === 'running' ? 'Simulating…' : status === 'done' ? 'Settled' : 'Idle'}
        </span>
      </div>

      <svg
        viewBox="0 0 600 200"
        className="w-full h-auto"
        style={{ maxHeight: 220 }}
        role="img"
        aria-label="Synthetic electorate cohort visualisation"
      >
        {dots.map((d, i) => {
          const phase = (tick + i) % 4
          const pulseR = status === 'running' ? d.r * (1 + (phase % 2 === 0 ? 0.08 : 0)) : d.r
          const opacity = status === 'idle' ? 0.4 : status === 'running' ? 0.65 + (phase % 2) * 0.25 : 0.85
          return (
            <g key={d.id}>
              <circle
                cx={d.cx}
                cy={d.cy}
                r={pulseR}
                fill={d.color}
                fillOpacity={opacity * 0.25}
                stroke={d.color}
                strokeOpacity={opacity}
                strokeWidth={1}
                aria-label={`${d.label} · ${(d.size / 1_000_000).toFixed(2)}M`}
                style={{ transition: 'all 0.2s ease-out' }}
              />
            </g>
          )
        })}
      </svg>

      <div className="flex items-center gap-4 font-mono text-[10px]" style={{ color: '#5a5a5e' }}>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: LEAN_COLOR.progressive }} />
          Progressive
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: LEAN_COLOR.centrist }} />
          Centrist
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: LEAN_COLOR.conservative }} />
          Conservative
        </span>
        <span className="ml-auto" style={{ color: '#3a3a3e' }}>Dot size ∝ cohort population</span>
      </div>
    </div>
  )
}
