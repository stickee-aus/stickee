'use client'

import { useState } from 'react'
import {
  SENATE_STATES,
  STATE_SHAPES,
  STATE_LABEL_POSITIONS,
  ACT_MARKER,
  MAP_VIEWBOX,
  SENATE_STATE_INDEX,
  type SenateStateId,
} from '@/lib/au-senate-states'
import { SenateStateDetailPanel } from '@/components/SenateStateDetailPanel'
import type { LiveElectionSnapshot } from '@/lib/aec-election-types'

interface AustraliaSenateMapProps {
  liveElection?: LiveElectionSnapshot | null
  showLiveResults?: boolean
}

const REGION_FILL_IDLE = 'var(--line-strong, #5a5a5e)'
const REGION_FILL_ACTIVE = 'var(--ink, #e8e8e6)'
const REGION_STROKE = 'var(--paper, #0a0a0b)'

export function AustraliaSenateMap({ liveElection = null, showLiveResults = false }: AustraliaSenateMapProps) {
  const [hoveredState, setHoveredState] = useState<SenateStateId | null>(null)
  const [selectedState, setSelectedState] = useState<SenateStateId | null>(null)

  const activeState = hoveredState ?? selectedState

  function toggleSelect(id: SenateStateId) {
    setSelectedState(prev => (prev === id ? null : id))
  }

  function handleKeyDown(e: React.KeyboardEvent, id: SenateStateId) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleSelect(id)
    }
  }

  const liveElectionForState = (id: SenateStateId) => {
    if (!showLiveResults || !liveElection?.active) return null
    const info = SENATE_STATE_INDEX[id]
    return liveElection.chambers.senate.states.find(s => s.state === info.aecStateKey) ?? null
  }

  return (
    <div className="space-y-4">
      {/* Education strip — exactly two sentences, per spec */}
      <div className="space-y-1">
        <p className="text-sm text-foreground">
          The Senate gives every Australian state equal representation regardless of population.
        </p>
        <p className="text-xs text-muted-foreground">
          Hover over a state to see who represents it.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        {/* ── Map ── */}
        <div className="border border-border p-4">
          <svg
            viewBox={MAP_VIEWBOX}
            className="w-full"
            style={{ maxHeight: 480 }}
            role="group"
            aria-label="Map of Australia's states and territories, by Senate representation"
          >
            {(Object.keys(STATE_SHAPES) as Array<Exclude<SenateStateId, 'ACT'>>).map(id => {
              const info = SENATE_STATE_INDEX[id]
              const isActive = activeState === id
              const isDimmed = activeState !== null && !isActive
              const label = STATE_LABEL_POSITIONS[id]

              return (
                <g key={id}>
                  <path
                    d={STATE_SHAPES[id]}
                    fill={isActive ? REGION_FILL_ACTIVE : REGION_FILL_IDLE}
                    stroke={REGION_STROKE}
                    strokeWidth={2}
                    opacity={isDimmed ? 0.35 : 1}
                    tabIndex={0}
                    role="button"
                    aria-label={`${info.name}, ${info.senatorCount} senators`}
                    aria-pressed={selectedState === id}
                    style={{ cursor: 'pointer', outline: 'none', transition: 'opacity 150ms ease, fill 150ms ease' }}
                    onMouseEnter={() => setHoveredState(id)}
                    onMouseLeave={() => setHoveredState(null)}
                    onFocus={() => setHoveredState(id)}
                    onBlur={() => setHoveredState(null)}
                    onClick={() => toggleSelect(id)}
                    onKeyDown={e => handleKeyDown(e, id)}
                  />
                  <text
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    style={{ fill: isActive ? 'var(--paper, #0a0a0b)' : 'var(--ink-muted, #9c9c96)', fontSize: 15, fontWeight: 600 }}
                  >
                    {info.abbreviation}
                  </text>
                  <text
                    x={label.x}
                    y={label.y + 18}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    style={{ fill: isActive ? 'var(--paper, #0a0a0b)' : 'var(--ink-muted, #9c9c96)', fontSize: 10 }}
                  >
                    {info.senatorCount} senators
                  </text>
                </g>
              )
            })}

            {/* ACT — too small to be a filled region at this scale; marker + leader line + callout label */}
            {(() => {
              const info = SENATE_STATE_INDEX.ACT
              const isActive = activeState === 'ACT'
              const isDimmed = activeState !== null && !isActive
              return (
                <g opacity={isDimmed ? 0.35 : 1} style={{ transition: 'opacity 150ms ease' }}>
                  <line
                    x1={ACT_MARKER.point.x}
                    y1={ACT_MARKER.point.y}
                    x2={ACT_MARKER.labelAnchor.x}
                    y2={ACT_MARKER.labelAnchor.y}
                    stroke="var(--line-strong, #5a5a5e)"
                    strokeWidth={1}
                  />
                  <circle cx={ACT_MARKER.point.x} cy={ACT_MARKER.point.y} r={4} fill="var(--line-strong, #5a5a5e)" aria-hidden="true" />
                  <circle
                    cx={ACT_MARKER.labelAnchor.x}
                    cy={ACT_MARKER.labelAnchor.y}
                    r={22}
                    fill={isActive ? REGION_FILL_ACTIVE : 'var(--paper-raised, #171716)'}
                    stroke={REGION_STROKE}
                    strokeWidth={2}
                    tabIndex={0}
                    role="button"
                    aria-label={`${info.name}, ${info.senatorCount} senators`}
                    aria-pressed={selectedState === 'ACT'}
                    style={{ cursor: 'pointer', outline: 'none', transition: 'fill 150ms ease' }}
                    onMouseEnter={() => setHoveredState('ACT')}
                    onMouseLeave={() => setHoveredState(null)}
                    onFocus={() => setHoveredState('ACT')}
                    onBlur={() => setHoveredState(null)}
                    onClick={() => toggleSelect('ACT')}
                    onKeyDown={e => handleKeyDown(e, 'ACT')}
                  />
                  <text
                    x={ACT_MARKER.labelAnchor.x}
                    y={ACT_MARKER.labelAnchor.y - 2}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    style={{ fill: isActive ? 'var(--paper, #0a0a0b)' : 'var(--ink-muted, #9c9c96)', fontSize: 12, fontWeight: 600 }}
                  >
                    ACT
                  </text>
                  <text
                    x={ACT_MARKER.labelAnchor.x}
                    y={ACT_MARKER.labelAnchor.y + 11}
                    textAnchor="middle"
                    className="pointer-events-none select-none"
                    style={{ fill: isActive ? 'var(--paper, #0a0a0b)' : 'var(--ink-muted, #9c9c96)', fontSize: 8 }}
                  >
                    {info.senatorCount} sen.
                  </text>
                </g>
              )
            })()}
          </svg>
        </div>

        {/* ── Sidebar ── */}
        <div>
          <p className="text-micro-label mb-2">States and territories</p>
          <ul role="list" className="divide-y divide-border border-t border-b border-border">
            {SENATE_STATES.map(info => {
              const isActive = activeState === info.id
              return (
                <li key={info.id} role="listitem">
                  <button
                    type="button"
                    onMouseEnter={() => setHoveredState(info.id)}
                    onMouseLeave={() => setHoveredState(null)}
                    onFocus={() => setHoveredState(info.id)}
                    onBlur={() => setHoveredState(null)}
                    onClick={() => toggleSelect(info.id)}
                    aria-pressed={selectedState === info.id}
                    aria-label={`${info.name}, ${info.senatorCount} senators`}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left transition-calm"
                    style={{ background: isActive ? 'var(--paper-raised, rgba(255,255,255,0.04))' : 'transparent' }}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">{info.abbreviation}</span>
                      <span className="block text-xs text-muted-foreground">{info.senatorCount} senators</span>
                    </span>
                    <span className="text-muted-foreground/60" aria-hidden="true">›</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {selectedState && (
        <SenateStateDetailPanel
          state={SENATE_STATE_INDEX[selectedState]}
          liveElectionState={liveElectionForState(selectedState)}
        />
      )}
    </div>
  )
}
