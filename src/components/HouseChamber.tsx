'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { X, ThumbsUp, ThumbsDown, TrendingUp, Mail } from 'lucide-react'
import { MPs, PARTY_COLORS } from '@/lib/mock-data'
import { getMPVoteForBill, billVoteRows, SWING_MPS_DATA } from '@/lib/mock-parliament-data'
import { useLiveParliamentMembers } from '@/hooks/useLiveParliamentMembers'
import { EmailMPModal } from '@/components/EmailMPModal'
import type { MP, Issue } from '@/types'
import { getElectionKeyForElectorate, getElectionPartyColor, getElectionStatusColor } from '@/lib/aec-election'
import type { ElectionHouseSeat, LiveElectionSnapshot } from '@/lib/aec-election-types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MPScores {
  approvalRating: number      // 0–100
  publicPressureScore: number // –100 to +100
  trustScore: number          // 0–100
}

interface TooltipState {
  x: number
  y: number
  seatIndex: number
}

type ViewMode = 'real' | 'sentiment' | 'swing'

// ─── Deterministic mock score generation ─────────────────────────────────────

function generateScores(mpId: string): MPScores {
  let h = 0
  for (let i = 0; i < mpId.length; i++) h = (h * 31 + mpId.charCodeAt(i)) >>> 0
  return {
    approvalRating:      30 + (h % 61),
    publicPressureScore: -55 + ((h * 7) % 111),
    trustScore:          40 + ((h * 13) % 51),
  }
}

function formatElectionUpdatedAt(value: string | null) {
  if (!value) return 'Awaiting AEC update'
  return new Date(value).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// ─── Chamber seat layout ──────────────────────────────────────────────────────
// 150 seats ordered as: Labor (0–93) | Greens (94) | Ind (95–104) | CA (105)
//                       | KAP (106) | One Nation (107) | Coalition (108–149)
//
// SVG viewBox: 0 0 900 560
//   Government (left):  seat indices 0–93  (94 Labor seats)
//   Crossbench (centre): seat indices 94–107 (14 seats)
//   Opposition (right): seat indices 108–149 (42 Coalition seats)
//   Speaker's chair:    bottom centre (450, 530)

interface SeatPos {
  x: number
  y: number
  seatIndex: number
  section: 'govt' | 'cross' | 'opp'
}

// Arc-based hemicycle layout matching BBC/parliament horseshoe style.
// Arc centre is at (CX, CY) below the SVG; seats fan upward in concentric arcs.
// Positions are sorted left→right by angle so that:
//   - Labor (seatIndex 0–93)   maps to the LEFT side of the arc  (government)
//   - Crossbench (94–107)      maps to the CENTRE
//   - Coalition (108–149)      maps to the RIGHT side            (opposition)
function buildChamberPositions(): SeatPos[] {
  const CX       = 450
  const CY       = 560           // arc centre, below SVG bottom edge
  const HALF_ARC = (72 * Math.PI) / 180  // ±72° from vertical

  // 8 concentric arcs — innermost (r=135) to outermost (r=415), total = 150 seats
  const rows: Array<{ r: number; count: number }> = [
    { r: 135, count: 10 },
    { r: 175, count: 13 },
    { r: 215, count: 15 },
    { r: 255, count: 18 },
    { r: 295, count: 20 },
    { r: 335, count: 22 },
    { r: 375, count: 25 },
    { r: 415, count: 27 },
  ] // 10+13+15+18+20+22+25+27 = 150 ✓

  // Generate all 150 positions with their angles
  const allPos: Array<{ x: number; y: number; angle: number; rowIdx: number }> = []
  rows.forEach(({ r, count }, rowIdx) => {
    for (let i = 0; i < count; i++) {
      const t     = count === 1 ? 0.5 : i / (count - 1)
      const angle = -HALF_ARC + t * 2 * HALF_ARC
      allPos.push({
        x: CX + r * Math.sin(angle),
        y: CY - r * Math.cos(angle),
        angle,
        rowIdx,
      })
    }
  })

  // Sort left → right by angle; ties broken by row (inner arc first)
  allPos.sort((a, b) => (a.angle !== b.angle ? a.angle - b.angle : a.rowIdx - b.rowIdx))

  return allPos.map((p, idx) => ({
    x: Math.round(p.x * 100) / 100,
    y: Math.round(p.y * 100) / 100,
    seatIndex: idx,
    section: idx < 94 ? 'govt' : idx >= 108 ? 'opp' : 'cross',
  }))
}

const CHAMBER_POSITIONS = buildChamberPositions()

// ─── Vote colour helpers ──────────────────────────────────────────────────────

const VOTE_COLORS = {
  for:    '#22c55e',
  against:'#ef4444',
  absent: '#6b7280',
} as const

function getSeatFill(
  mpId: string,
  party: string,
  selectedBillId: string | null,
  viewMode: ViewMode,
  userPressure: Record<string, 1 | -1 | 0>,
  swingMPIds: Set<string>,
): string {
  if (selectedBillId) {
    if (viewMode === 'real') {
      const v = getMPVoteForBill(mpId, selectedBillId)
      return VOTE_COLORS[v]
    } else if (viewMode === 'swing') {
      // Swing mode: highlight undecided swing MPs in amber, grey everyone else
      if (swingMPIds.has(mpId)) return '#f59e0b'
      return '#4b5563' // muted grey for non-swing
    } else {
      // sentiment mode: show user pressure override
      const u = userPressure[mpId]
      const v = getMPVoteForBill(mpId, selectedBillId)
      if (u === 1)  return '#a3e635' // user-pushed to support
      if (u === -1) return '#f97316' // user-pushed to oppose
      return VOTE_COLORS[v]
    }
  }
  return PARTY_COLORS[party] ?? '#999'
}


// ─── MPSeat (inner circle) ────────────────────────────────────────────────────

interface MPSeatProps {
  pos: SeatPos
  mp: MP | undefined
  fill: string
  opacity?: number
  isActive: boolean
  onMouseEnter: (pos: SeatPos) => void
  onMouseLeave: () => void
  onClick: (mp: MP) => void
}

function MPSeatCircle({ pos, mp, fill, opacity, isActive, onMouseEnter, onMouseLeave, onClick }: MPSeatProps) {
  return (
    <circle
      cx={pos.x}
      cy={pos.y}
      r={isActive ? 9 : 7.5}
      fill={fill}
      opacity={isActive ? 1 : opacity ?? 0.92}
      stroke={isActive ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.28)'}
      strokeWidth={isActive ? 1.5 : 0.8}
      style={{
        cursor: mp ? 'pointer' : 'default',
        transition: 'r 0.1s ease, opacity 0.1s ease',
      }}
      role={mp ? 'button' : undefined}
      aria-label={mp ? `${mp.name}, ${mp.party}, ${mp.electorate}. This is a local MP elected by voters in their area.` : undefined}
      tabIndex={mp ? 0 : -1}
      onMouseEnter={() => onMouseEnter(pos)}
      onMouseLeave={onMouseLeave}
      onClick={() => mp && onClick(mp)}
      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && mp) { e.preventDefault(); onClick(mp) } }}
    />
  )
}

// ─── MP Info Panel ────────────────────────────────────────────────────────────

interface InfoPanelProps {
  mp: MP
  scores: MPScores
  selectedBillId: string | null
  userPressure: Record<string, 1 | -1 | 0>
  onPressure: (mpId: string, dir: 1 | -1) => void
  onClose: () => void
  isSwingMP?: boolean
  swingReason?: string
}

function MPInfoPanel({ mp, scores, selectedBillId, userPressure, onPressure, onClose, isSwingMP, swingReason }: InfoPanelProps) {
  const [emailOpen, setEmailOpen] = useState(false)
  const emailIssue: Issue | null = selectedBillId ? {
    id: selectedBillId,
    title: billVoteRows.find(b => b.id === selectedBillId)?.name ?? 'this bill',
    summary: swingReason ?? `I am writing regarding ${mp.name}'s position on this bill.`,
    content: '', whatIsHappening: '', whoSupports: '', whoOpposes: '', status: 'active',
  } : null
  const partyColor = PARTY_COLORS[mp.party] ?? '#999'
  const vote = selectedBillId ? getMPVoteForBill(mp.id, selectedBillId) : null
  const bill = selectedBillId ? billVoteRows.find(b => b.id === selectedBillId) : null
  const pressure = userPressure[mp.id] ?? 0

  const voteLabel = vote === 'for' ? 'Supporting' : vote === 'against' ? 'Opposing' : 'Absent'
  const voteColor = vote === 'for' ? '#22c55e' : vote === 'against' ? '#ef4444' : '#6b7280'

  return (
    <div className="absolute inset-y-0 right-0 w-72 rounded-r-xl border-l border-border/60 bg-card/95 backdrop-blur-sm shadow-2xl z-20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border/40" style={{ borderLeftColor: partyColor, borderLeftWidth: 3 }}>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.pravatar.cc/80?u=${mp.id}`}
            alt={mp.name}
            width={44}
            height={44}
            className="rounded-full border-2 border-border/60 object-cover shrink-0"
            style={{ borderColor: partyColor }}
          />
          <div>
            <p className="font-semibold text-sm text-foreground leading-tight">{mp.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{mp.electorate}</p>
            <span
              className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${partyColor}25`, color: partyColor }}
            >
              {mp.party}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted/60 text-muted-foreground transition-colors shrink-0"
          aria-label="Close panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Scores */}
      <div className="p-4 space-y-3">
        <ScoreBar label="Approval" value={scores.approvalRating} color="#22c55e" />
        <ScoreBar label="Trust" value={scores.trustScore} color="#3b82f6" />
        <PressureBar label="Public Pressure" value={scores.publicPressureScore} />
      </div>

      {/* Bill vote status */}
      {bill && vote && (
        <div className="mx-4 mb-3 p-3 rounded-lg border border-border/40 bg-muted/30">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">On: {bill.name}</p>
          <p className="text-sm font-semibold" style={{ color: voteColor }}>{voteLabel}</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => onPressure(mp.id, 1)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-all ${
                pressure === 1 ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40' : 'bg-muted/40 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-400'
              }`}
            >
              <ThumbsUp size={11} />
              Agree
            </button>
            <button
              onClick={() => onPressure(mp.id, -1)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-all ${
                pressure === -1 ? 'bg-red-500/20 text-red-400 ring-1 ring-red-400/40' : 'bg-muted/40 text-muted-foreground hover:bg-red-500/10 hover:text-red-400'
              }`}
            >
              <ThumbsDown size={11} />
              Disagree
            </button>
          </div>
        </div>
      )}

      {/* Swing MP indicator */}
      {isSwingMP && (
        <div className="mx-4 mb-3 rounded-lg border border-amber-400/30 bg-amber-400/5 p-3">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">⚡ Swing Vote</p>
          <p className="text-[11px] text-muted-foreground leading-snug">{swingReason}</p>
          {emailIssue && (
            <button
              onClick={() => setEmailOpen(true)}
              className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Mail size={10} />
              Contact now →
            </button>
          )}
        </div>
      )}

      {/* Recent votes summary */}
      <div className="mx-4 mb-4">
        <p className="mb-2 text-[11px] text-muted-foreground/80 leading-snug">
          These are real votes on laws — this shows how this MP acts in Parliament.
        </p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Recent Votes</p>
        <div className="space-y-1.5">
          {billVoteRows.slice(0, 4).map(b => {
            const v = getMPVoteForBill(mp.id, b.id)
            return (
              <div key={b.id} className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground truncate max-w-[150px]">{b.name}</p>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    backgroundColor: v === 'for' ? '#22c55e20' : v === 'against' ? '#ef444420' : '#6b728020',
                    color: v === 'for' ? '#22c55e' : v === 'against' ? '#ef4444' : '#6b7280',
                  }}
                >
                  {v === 'for' ? 'For' : v === 'against' ? 'Against' : 'Absent'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Email modal for swing MP contact */}
      {emailIssue && (
        <EmailMPModal
          issue={emailIssue}
          open={emailOpen}
          onOpenChange={setEmailOpen}
        />
      )}
    </div>
  )
}

function LiveSeatInfoPanel({ seat, onClose }: { seat: ElectionHouseSeat; onClose: () => void }) {
  const partyColor = getElectionPartyColor(seat.leadingCandidate?.party ?? null)

  return (
    <div className="absolute inset-y-0 right-0 z-20 flex w-72 flex-col overflow-hidden rounded-r-xl border-l border-border/60 bg-card/95 shadow-2xl backdrop-blur-sm">
      <div className="flex items-start justify-between border-b border-border/40 p-4" style={{ borderLeftColor: partyColor, borderLeftWidth: 3 }}>
        <div>
          <p className="font-semibold text-sm text-foreground leading-tight">{seat.electorate}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{seat.state} electorate</p>
          <span
            className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: `${partyColor}25`, color: partyColor }}
          >
            {seat.status === 'called' ? 'Called' : seat.status === 'leading' ? 'Leading' : seat.status === 'too-close' ? 'Too close' : 'Not enough data'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted/60"
          aria-label="Close panel"
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3 p-4">
        <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Live result</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {seat.leadingCandidate ? `${seat.leadingCandidate.candidate} · ${seat.leadingCandidate.party}` : 'No leader yet'}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            {seat.tcpPct !== null
              ? `TCP ${seat.tcpPct}%`
              : seat.leadingCandidate?.pct !== null && seat.leadingCandidate?.pct !== undefined
              ? `First preference ${seat.leadingCandidate.pct}%`
              : 'Vote share not available yet'}
            {seat.marginPct !== null ? ` · margin ${seat.marginPct.toFixed(2)}pp` : ''}
          </p>
          {seat.leadingCandidate?.swing !== null && seat.leadingCandidate?.swing !== undefined && (
            <p className="mt-1 text-[11px] text-muted-foreground">Swing {seat.leadingCandidate.swing > 0 ? '+' : ''}{seat.leadingCandidate.swing.toFixed(2)}pp</p>
          )}
        </div>

        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          <p>Electorate: <span className="text-foreground">{seat.electorate}</span></p>
          <p>Leading candidate/party: <span className="text-foreground">{seat.leadingCandidate ? `${seat.leadingCandidate.candidate} · ${seat.leadingCandidate.party}` : 'No data'}</span></p>
          <p>Vote share: <span className="text-foreground">{seat.tcpPct !== null ? `${seat.tcpPct}% TCP` : seat.leadingCandidate?.pct !== null && seat.leadingCandidate?.pct !== undefined ? `${seat.leadingCandidate.pct}% first preference` : 'No data'}</span></p>
          <p>Reporting progress: <span className="text-foreground">{seat.reportingProgressPct !== null ? `${seat.reportingProgressPct}% counted` : 'No data'}</span></p>
          <p>AEC timestamp: <span className="text-foreground">{formatElectionUpdatedAt(seat.updatedAt)}</span></p>
        </div>

        <p className="text-[11px] leading-snug text-muted-foreground/80">
          These numbers come from official AEC counting updates.
        </p>
      </div>
    </div>
  )
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-semibold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function PressureBar({ label, value }: { label: string; value: number }) {
  const pct = ((value + 100) / 200) * 100
  const color = value > 0 ? '#22c55e' : value < 0 ? '#ef4444' : '#6b7280'
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-semibold" style={{ color }}>{value > 0 ? '+' : ''}{value}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted/50">
        <div className="absolute left-1/2 top-0 w-px h-full bg-border/60" />
        <div
          className="absolute top-0 h-full rounded-full transition-all duration-500"
          style={{
            left: value < 0 ? `${pct}%` : '50%',
            width: `${Math.abs(value) / 2}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  )
}

// ─── Main HouseChamber component ──────────────────────────────────────────────

interface HouseChamberProps {
  selectedBillId: string | null
  /** Externally highlighted MP — seat is activated and info panel opens */
  highlightedMPId?: string | null
  showLiveResults?: boolean
  liveElection?: LiveElectionSnapshot | null
}

export function HouseChamber({ selectedBillId, highlightedMPId, showLiveResults = false, liveElection = null }: HouseChamberProps) {
  const { data } = useLiveParliamentMembers()
  const houseMembers = data?.house.members.length ? data.house.members : MPs
  const liveSeats = liveElection?.chambers.house.seats ?? []
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [selectedMP, setSelectedMP] = useState<MP | null>(null)
  const [selectedLiveSeatKey, setSelectedLiveSeatKey] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('real')
  const [userPressure, setUserPressure] = useState<Record<string, 1 | -1 | 0>>({})
  const liveSeatMap = useMemo(
    () => new Map(liveSeats.map(seat => [getElectionKeyForElectorate(seat.electorate), seat])),
    [liveSeats]
  )

  // Sync external highlighted MP → internal selected MP
  useEffect(() => {
    if (showLiveResults) return
    if (highlightedMPId) {
      const mp = houseMembers.find(m => m.id === highlightedMPId) ?? null
      setSelectedMP(mp)
    } else if (highlightedMPId === null) {
      setSelectedMP(null)
    }
  }, [highlightedMPId, houseMembers, showLiveResults])

  useEffect(() => {
    if (showLiveResults) {
      setSelectedMP(null)
    } else {
      setSelectedLiveSeatKey(null)
    }
  }, [showLiveResults])

  const SVG_W = 900
  const SVG_H = 520

  // Swing MP set for current bill
  const swingMPSet = useMemo<Set<string>>(() => {
    if (!selectedBillId) return new Set()
    const swingMPs = SWING_MPS_DATA[selectedBillId] ?? []
    return new Set(swingMPs.map(m => m.id))
  }, [selectedBillId])

  // Swing MP lookup by id
  const swingMPMap = useMemo<Record<string, (typeof SWING_MPS_DATA)[string][number]>>(() => {
    if (!selectedBillId) return {}
    const swingMPs = SWING_MPS_DATA[selectedBillId] ?? []
    return Object.fromEntries(swingMPs.map(m => [m.id, m]))
  }, [selectedBillId])

  const handlePressure = useCallback((mpId: string, dir: 1 | -1) => {
    setUserPressure(prev => ({
      ...prev,
      [mpId]: prev[mpId] === dir ? 0 : dir,
    }))
  }, [])

  const seatColors = useMemo(() => {
    const out: Record<number, string> = {}
    CHAMBER_POSITIONS.forEach(pos => {
      const mp = houseMembers[pos.seatIndex]
      if (!mp) return
      if (showLiveResults) {
        const seat = liveSeatMap.get(getElectionKeyForElectorate(mp.electorate))
        out[pos.seatIndex] = getElectionStatusColor(seat?.leadingCandidate?.party ?? null, seat?.status ?? 'no-data')
        return
      }
      out[pos.seatIndex] = getSeatFill(mp.id, mp.party, selectedBillId, viewMode, userPressure, swingMPSet)
    })
    return out
  }, [houseMembers, liveSeatMap, selectedBillId, showLiveResults, viewMode, userPressure, swingMPSet])

  const tooltipMP = tooltip != null ? houseMembers[tooltip.seatIndex] : null
  const tooltipSeat = tooltipMP ? liveSeatMap.get(getElectionKeyForElectorate(tooltipMP.electorate)) ?? null : null
  const selectedLiveSeat = selectedLiveSeatKey ? liveSeatMap.get(selectedLiveSeatKey) ?? null : null

  // Legend for current view
  const legendItems = showLiveResults
    ? [
        { color: '#e8e8e6', label: 'Called' },
        { color: '#5a5a5e', label: 'Leading' },
        { color: '#f5a623', label: 'Too close' },
        { color: '#3a3a3e', label: 'Not enough data' },
      ]
    : selectedBillId
    ? viewMode === 'swing'
      ? [
          { color: '#f59e0b', label: 'Swing / Undecided' },
          { color: '#4b5563', label: 'Committed' },
        ]
      : [
          { color: VOTE_COLORS.for,    label: 'For' },
          { color: VOTE_COLORS.against, label: 'Against' },
          { color: VOTE_COLORS.absent,  label: 'Absent / Abstain' },
        ]
    : [...new Set(houseMembers.map(member => member.party))]
        .map(party => ({ color: PARTY_COLORS[party] ?? '#999', label: party }))

  return (
    <div className="relative w-full select-none">
      {/* Controls row */}
      <div className="flex items-start justify-between mb-3 px-1 gap-4">
        <div className="space-y-1.5">
          {showLiveResults ? (
            <div className="rounded-lg border border-border/50 bg-muted/40 px-3 py-2">
              <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Live election results</p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground/70">
                Seat colours show called, leading, too close, or not enough data from official AEC updates.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/40 p-0.5 flex-wrap">
              {([
                { key: 'real',      label: 'How They Voted' },
                { key: 'sentiment', label: 'My Campaign' },
                ...(selectedBillId && swingMPSet.size > 0 ? [{ key: 'swing', label: `Swing Votes (${swingMPSet.size})` }] : []),
              ] as { key: ViewMode; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  title={label === 'How They Voted' ? 'Shows how MPs voted on real laws.' : undefined}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all whitespace-nowrap ${
                    viewMode === key
                      ? key === 'swing'
                        ? 'bg-amber-400/15 text-amber-400 shadow-sm'
                        : 'bg-card shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground/50 leading-snug">
            {showLiveResults
              ? 'You’re looking at the House of Representatives — where government is formed.'
              : viewMode === 'real'
              ? 'Seats coloured by each MP\'s actual parliamentary vote on the selected bill'
              : viewMode === 'swing'
              ? 'Amber seats are undecided — click to contact them and focus your pressure'
              : 'Click a seat, then Agree/Disagree to track which MPs you\'ve lobbied'}
          </p>
        </div>
        <span className="text-[11px] text-muted-foreground/50 hidden sm:inline shrink-0 mt-1">
          {showLiveResults ? 'Hover or click a seat for live electorate details' : 'Click a seat for MP details'}
        </span>
      </div>

      {/* Chamber SVG + info panel overlay */}
      <div className="relative rounded-2xl border border-white/[0.07] bg-card overflow-hidden shadow-xl">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full"
          style={{ maxHeight: 460 }}
          aria-label="Australian House of Representatives — 150 seats in a parliamentary horseshoe arc"
        >
          <defs>
            <radialGradient id="chamberFloor" cx="50%" cy="100%" r="60%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>

          {/* Subtle floor wash */}
          <ellipse cx={450} cy={520} rx={440} ry={120} fill="url(#chamberFloor)" />

          {/* Outer arc guide line */}
          <path
            d="M 50 430 A 420 420 0 0 1 850 430"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={1}
          />

          {/* Section labels */}
          <text x={72} y={44} textAnchor="middle" fontSize={8.5} fill="rgba(255,255,255,0.32)" fontFamily="Inter,ui-sans-serif,sans-serif" fontWeight={600} letterSpacing={2.5}>
            GOVERNMENT
          </text>
          <text x={828} y={44} textAnchor="middle" fontSize={8.5} fill="rgba(255,255,255,0.32)" fontFamily="Inter,ui-sans-serif,sans-serif" fontWeight={600} letterSpacing={2.5}>
            OPPOSITION
          </text>

          {/* Speaker's chair */}
          <ellipse cx={450} cy={508} rx={28} ry={10} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
          <text x={450} y={511} textAnchor="middle" fontSize={7} fill="rgba(255,255,255,0.28)" fontFamily="Inter,ui-sans-serif,sans-serif" fontWeight={600} letterSpacing={1}>
            SPEAKER
          </text>

          {/* Seats */}
          {CHAMBER_POSITIONS.map(pos => {
            const mp = houseMembers[pos.seatIndex]
            if (!mp) return null
            const seat = liveSeatMap.get(getElectionKeyForElectorate(mp.electorate))
            const isActive = tooltip?.seatIndex === pos.seatIndex || selectedMP?.id === mp.id || selectedLiveSeat?.divisionId === seat?.divisionId
            const fill = seatColors[pos.seatIndex] ?? (PARTY_COLORS[mp.party] ?? '#999')

            return (
              <MPSeatCircle
                key={pos.seatIndex}
                pos={pos}
                mp={mp}
                fill={fill}
                opacity={showLiveResults ? seat?.status === 'called' ? 1 : seat?.status === 'leading' ? 0.62 : 0.92 : undefined}
                isActive={isActive}
                onMouseEnter={p => setTooltip({ x: p.x, y: p.y, seatIndex: p.seatIndex })}
                onMouseLeave={() => setTooltip(null)}
                onClick={m => {
                  if (showLiveResults) {
                    const nextSeat = liveSeatMap.get(getElectionKeyForElectorate(m.electorate))
                    setSelectedLiveSeatKey(prev => prev === getElectionKeyForElectorate(m.electorate) ? null : getElectionKeyForElectorate(m.electorate))
                    if (!nextSeat) setSelectedLiveSeatKey(null)
                    return
                  }
                  setSelectedMP(prev => prev?.id === m.id ? null : m)
                }}
              />
            )
          })}

          {/* Tooltip (SVG foreignObject) */}
          {tooltip && tooltipMP && !selectedMP && !selectedLiveSeat && (
            <foreignObject
              x={Math.min(Math.max(tooltip.x - 94, 4), SVG_W - 196)}
              y={Math.max(tooltip.y - 110, 4)}
              width={188}
              height={showLiveResults ? 132 : 96}
              style={{ pointerEvents: 'none' }}
            >
              <div className="rounded-xl border border-white/10 bg-black/70 backdrop-blur-md px-3 py-2.5 shadow-2xl">
                {showLiveResults && tooltipSeat ? (
                  <div>
                    <p className="text-xs font-semibold text-white/90 truncate leading-tight">{tooltipSeat.electorate}</p>
                    <p className="mt-1 text-[10px] text-white/55">
                      {tooltipSeat.leadingCandidate ? `${tooltipSeat.leadingCandidate.candidate} · ${tooltipSeat.leadingCandidate.party}` : 'No leader yet'}
                    </p>
                    <p className="mt-1 text-[10px] text-white/45">
                      {tooltipSeat.tcpPct !== null
                        ? `TCP ${tooltipSeat.tcpPct}%`
                        : tooltipSeat.leadingCandidate?.pct !== null && tooltipSeat.leadingCandidate?.pct !== undefined
                        ? `First preference ${tooltipSeat.leadingCandidate.pct}%`
                        : 'Vote share unavailable'}
                    </p>
                    <p className="mt-1 text-[10px] text-white/45">
                      {tooltipSeat.reportingProgressPct !== null ? `${tooltipSeat.reportingProgressPct}% counted` : 'Reporting progress unavailable'}
                    </p>
                    <p className="mt-2 text-[9.5px] text-white/35 font-medium tracking-wide">Official AEC update · click for more</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.pravatar.cc/60?u=${tooltipMP.id}`}
                      alt={tooltipMP.name}
                      width={30}
                      height={30}
                      className="rounded-full shrink-0"
                      style={{ border: `2px solid ${PARTY_COLORS[tooltipMP.party] ?? '#999'}` }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white/90 truncate leading-tight">{tooltipMP.name}</p>
                      <p className="text-[10px] text-white/45 mt-0.5">{tooltipMP.electorate}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: PARTY_COLORS[tooltipMP.party] ?? '#999' }}
                        />
                        <span className="text-[10px] text-white/50">{tooltipMP.party}</span>
                      </div>
                      <p className="mt-2 text-[9.5px] text-white/35 font-medium tracking-wide">This is a local MP elected by voters in their area.</p>
                    </div>
                  </div>
                )}
              </div>
            </foreignObject>
          )}
        </svg>

        {/* MP Info Panel (absolute overlay on right) */}
        {selectedMP && !showLiveResults && (
          <MPInfoPanel
            mp={selectedMP}
            scores={generateScores(selectedMP.id)}
            selectedBillId={selectedBillId}
            userPressure={userPressure}
            onPressure={handlePressure}
            onClose={() => setSelectedMP(null)}
            isSwingMP={swingMPSet.has(selectedMP.id)}
            swingReason={swingMPMap[selectedMP.id]?.reason}
          />
        )}
        {selectedLiveSeat && showLiveResults && (
          <LiveSeatInfoPanel
            seat={selectedLiveSeat}
            onClose={() => setSelectedLiveSeatKey(null)}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-3 px-2">
        {legendItems.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[11px] text-muted-foreground/70 tracking-wide">
              {label.replace("Katter's Australian Party", 'KAP').replace('Centre Alliance', 'CA')}
            </span>
          </div>
        ))}
      </div>

      {/* Summary row */}
      {selectedBillId && (() => {
        const bill = billVoteRows.find(b => b.id === selectedBillId)
        if (!bill) return null
        return (
          <div className="mt-3 flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-muted-foreground">For: <strong className="text-foreground">{bill.totalFor}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-muted-foreground">Against: <strong className="text-foreground">{bill.totalAgainst}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-500 shrink-0" />
              <span className="text-muted-foreground">Absent: <strong className="text-foreground">{bill.totalAbstain}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border/40">
              <TrendingUp size={12} className="text-emerald-400" />
              <span className="text-muted-foreground">Majority needed: <strong className="text-foreground">76</strong></span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
