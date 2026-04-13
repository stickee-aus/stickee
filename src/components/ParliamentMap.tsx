'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { SEAT_LAYOUT, PARTY_COLORS, MPIndex } from '@/lib/mock-data'

interface TooltipState {
  x: number
  y: number
  mpId: string | null
  party: string
  seatIndex: number
}

// Generate arc positions for 149 seats in a semi-circle
// Rows from innermost to outermost, each row holds progressively more seats
const ROW_COUNTS = [11, 14, 17, 20, 23, 27, 20, 12, 6] // total = 150
const ROW_RADII = [120, 150, 180, 210, 240, 270, 300, 330, 360]
const ARC_START = Math.PI // 180° (left)
const ARC_END = 0         // 0° (right)

function generateSeatPositions(cx: number, cy: number) {
  const positions: Array<{ x: number; y: number; seatIndex: number }> = []
  let seatIndex = 0

  for (let row = 0; row < ROW_COUNTS.length; row++) {
    const count = ROW_COUNTS[row]
    const radius = ROW_RADII[row]

    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1)
      const angle = ARC_START + t * (ARC_END - ARC_START)
      const x = Math.round((cx + radius * Math.cos(angle)) * 1e4) / 1e4
      const y = Math.round((cy - radius * Math.sin(angle)) * 1e4) / 1e4 // subtract because SVG y is inverted

      positions.push({ x, y, seatIndex })
      seatIndex++
    }
  }

  return positions
}

export function ParliamentMap() {
  const router = useRouter()
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  const SVG_WIDTH = 800
  const SVG_HEIGHT = 420
  const CX = SVG_WIDTH / 2
  const CY = SVG_HEIGHT - 20

  const seatPositions = generateSeatPositions(CX, CY)
  const SEAT_RADIUS = 9

  function showTooltip(pos: { x: number; y: number; seatIndex: number }, seat: { party: string; mpId: string | null }) {
    setTooltip({ x: pos.x, y: pos.y, mpId: seat.mpId, party: seat.party, seatIndex: pos.seatIndex })
  }

  function handleClick(seat: { party: string; mpId: string | null }) {
    if (seat.mpId) router.push(`/mp/${seat.mpId}`)
  }

  function handleKeyDown(e: React.KeyboardEvent, seat: { party: string; mpId: string | null }) {
    if ((e.key === 'Enter' || e.key === ' ') && seat.mpId) {
      e.preventDefault()
      router.push(`/mp/${seat.mpId}`)
    }
  }

  const tooltipMP = tooltip?.mpId ? MPIndex[tooltip.mpId] : null
  const focusMP = focusedIndex !== null && SEAT_LAYOUT[focusedIndex]?.mpId
    ? MPIndex[SEAT_LAYOUT[focusedIndex].mpId!]
    : null

  return (
    <div className="relative w-full">
      {/* Keyboard hint */}
      <p className="sr-only">
        Use Tab to navigate seats. Press Enter or Space to view an MP profile.
      </p>

      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full"
        style={{ maxHeight: 460 }}
        role="img"
        aria-label="Australian Parliament seat map — 149 seats in a semicircle, coloured by party"
      >
        {seatPositions.map((pos) => {
          const seat = SEAT_LAYOUT[pos.seatIndex]
          if (!seat) return null
          const color = PARTY_COLORS[seat.party] ?? '#999'
          const hasMP = !!seat.mpId
          const isActive =
            tooltip?.seatIndex === pos.seatIndex ||
            focusedIndex === pos.seatIndex

          return (
            <circle
              key={pos.seatIndex}
              cx={pos.x}
              cy={pos.y}
              r={isActive ? SEAT_RADIUS + 2 : SEAT_RADIUS}
              fill={color}
              opacity={isActive ? 1 : 0.85}
              stroke={isActive ? '#fff' : 'transparent'}
              strokeWidth={2}
              tabIndex={hasMP ? 0 : -1}
              role={hasMP ? 'button' : undefined}
              aria-label={
                hasMP
                  ? `${MPIndex[seat.mpId!]?.name ?? 'MP'}, ${seat.party}, ${MPIndex[seat.mpId!]?.electorate ?? ''}`
                  : `${seat.party} seat`
              }
              style={{
                cursor: hasMP ? 'pointer' : 'default',
                transition: 'r 0.1s ease, opacity 0.1s ease',
                outline: 'none',
              }}
              onMouseEnter={() => showTooltip(pos, seat)}
              onMouseLeave={() => setTooltip(null)}
              onFocus={() => { setFocusedIndex(pos.seatIndex); showTooltip(pos, seat) }}
              onBlur={() => { setFocusedIndex(null); setTooltip(null) }}
              onClick={() => handleClick(seat)}
              onKeyDown={e => handleKeyDown(e, seat)}
            />
          )
        })}

        {/* Tooltip rendered inside SVG as foreignObject for rich HTML */}
        {tooltip && (
          <foreignObject
            x={Math.min(tooltip.x - 100, SVG_WIDTH - 220)}
            y={Math.max(tooltip.y - 120, 5)}
            width={210}
            height={tooltipMP ? 115 : 70}
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-popover-foreground"
              style={{ fontSize: 12, position: 'relative' }}
            >
              {tooltipMP ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://i.pravatar.cc/80?u=${tooltipMP.id}`}
                    alt={tooltipMP.name}
                    width={40}
                    height={40}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      borderRadius: '50%',
                      border: '2px solid var(--border)',
                      objectFit: 'cover',
                    }}
                  />
                  <p className="font-semibold leading-tight" style={{ paddingRight: 48 }}>{tooltipMP.name}</p>
                  <p className="mt-0.5 text-muted-foreground">{tooltipMP.party}</p>
                  <p className="text-muted-foreground">{tooltipMP.electorate}</p>
                  <p className="mt-1 text-primary font-medium">Enter to view profile →</p>
                </>
              ) : (
                <>
                  <p className="font-semibold">{tooltip.party}</p>
                  <p className="text-muted-foreground">Seat {tooltip.seatIndex + 1}</p>
                </>
              )}
            </div>
          </foreignObject>
        )}
      </svg>

      {/* Keyboard-focused MP info (visible outside the SVG for screen readers) */}
      {focusMP && (
        <p aria-live="polite" className="sr-only">
          {focusMP.name}, {focusMP.party}, {focusMP.electorate}. Press Enter to view profile.
        </p>
      )}

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-2">
        {Object.entries(PARTY_COLORS).map(([party, color]) => (
          <div key={party} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-muted-foreground">{party}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
