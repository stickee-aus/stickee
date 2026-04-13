'use client'

import { useState, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ThumbsUp, ThumbsDown, ChevronDown } from 'lucide-react'
import { POLITICIAN_SCORECARDS } from '@/lib/mock-civic-data'
import { MPs, PARTY_COLORS } from '@/lib/mock-data'
import { mpExtended } from '@/lib/mock-market-data'
import { LEADERS, computeCredibility } from '@/lib/mock-leaders-data'
import { scoreToGrade } from '@/lib/civic-utils'
import { useApproval, communityApprovalPct, communityVoteCount } from '@/hooks/useApproval'
import { NominationModal } from '@/components/NominationModal'

const HouseChamber = dynamic(
  () => import('@/components/HouseChamber').then(m => m.HouseChamber),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center font-mono text-xs" style={{ color: '#3a3a3e' }}>Loading chamber…</div> },
)

const SenateView = dynamic(
  () => import('@/components/SenateView').then(m => m.SenateView),
  { ssr: false, loading: () => <div className="h-32 flex items-center justify-center font-mono text-xs" style={{ color: '#3a3a3e' }}>Loading senate…</div> },
)

// ─── Static info for scored politicians ───────────────────────────────────────

const SCORED_MP_INFO: Record<string, { name: string; party: string; role: string; electorate: string }> = {
  'mp-albanese': { name: 'Anthony Albanese', party: 'Labor',     role: 'Prime Minister',     electorate: 'Grayndler' },
  'mp-chalmers': { name: 'Jim Chalmers',     party: 'Labor',     role: 'Treasurer',           electorate: 'Rankin' },
  'mp-dutton':   { name: 'Peter Dutton',     party: 'Coalition', role: 'Opposition Leader',   electorate: 'Dickson' },
  'mp-butler':   { name: 'Mark Butler',      party: 'Labor',     role: 'Minister for Health', electorate: 'Hindmarsh' },
  'mp-bandt':    { name: 'Adam Bandt',        party: 'Greens',    role: 'Greens Leader',       electorate: 'Melbourne' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PILLAR_SHORT: Record<string, string> = {
  'cost-of-living': 'CoL',
  housing:          'Hsg',
  'crime-safety':   'C&S',
  'jobs-economy':   'Eco',
  future:           'Fut',
}

const PILLAR_STATUS_COLOR: Record<string, string> = {
  green:  '#2ec266',
  yellow: '#f5a623',
  red:    '#f04747',
}

const PARTY_SHORT: Record<string, string> = {
  'Labor':                        'ALP',
  'Coalition':                    'LIB/NAT',
  'Greens':                       'GRN',
  'Independent':                  'IND',
  'Centre Alliance':              'CA',
  "Katter's Australian Party":   'KAP',
  'One Nation':                   'ONP',
}

function gradeStyle(g: string) {
  if (g === 'A' || g === 'B') return { color: '#2ec266', borderColor: '#0e3020', background: '#041008' }
  if (g === 'C')              return { color: '#f5a623', borderColor: '#3a2e10', background: '#1e1800' }
  return                             { color: '#f04747', borderColor: '#3a1414', background: '#1e0a0a' }
}

const mpExtendedIndex = Object.fromEntries(mpExtended.map(m => [m.id, m]))

type SortKey    = 'approval' | 'voting' | 'party' | 'name'
type PartyFilter = 'all' | string

const PAGE_SIZE = 25

// ─── Approve / Disapprove buttons ─────────────────────────────────────────────

function ApprovalButtons({
  mpId,
  ratings,
  onRate,
  communityPct,
  compact = false,
}: {
  mpId: string
  ratings: Record<string, 'approve' | 'disapprove'>
  onRate: (id: string, dir: 'approve' | 'disapprove') => void
  communityPct: number
  compact?: boolean
}) {
  const mine = ratings[mpId]
  // Shift community pct by ±2 when user has voted
  const displayPct =
    mine === 'approve'    ? Math.min(99, communityPct + 2) :
    mine === 'disapprove' ? Math.max(1,  communityPct - 2) :
    communityPct

  return (
    <div className={`flex items-center gap-${compact ? '2' : '3'}`}>
      {/* Approval bar */}
      {!compact && (
        <div className="w-16 h-px relative" style={{ background: '#1e1e20' }}>
          <div
            style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${displayPct}%`, background: displayPct >= 60 ? '#2ec266' : displayPct >= 40 ? '#f5a623' : '#f04747', transition: 'width 0.3s ease' }}
          />
        </div>
      )}
      <span
        className="font-mono text-xs tabular-nums w-8 text-right"
        style={{ color: displayPct >= 60 ? '#2ec266' : displayPct >= 40 ? '#f5a623' : '#f04747', transition: 'color 0.3s' }}
      >
        {displayPct}%
      </span>

      {/* Thumbs */}
      <button
        onClick={e => { e.stopPropagation(); onRate(mpId, 'approve') }}
        className="p-1 rounded transition-all"
        style={{ color: mine === 'approve' ? '#2ec266' : '#3a3a3e', background: mine === 'approve' ? '#2ec26618' : 'transparent' }}
        title="Approve"
      >
        <ThumbsUp size={compact ? 11 : 13} />
      </button>
      <button
        onClick={e => { e.stopPropagation(); onRate(mpId, 'disapprove') }}
        className="p-1 rounded transition-all"
        style={{ color: mine === 'disapprove' ? '#f04747' : '#3a3a3e', background: mine === 'disapprove' ? '#f0474718' : 'transparent' }}
        title="Disapprove"
      >
        <ThumbsDown size={compact ? 11 : 13} />
      </button>
    </div>
  )
}

// ─── Featured MP card (scored politicians) ────────────────────────────────────

function FeaturedMPCard({
  sc,
  ratings,
  onRate,
}: {
  sc: typeof POLITICIAN_SCORECARDS[number]
  ratings: Record<string, 'approve' | 'disapprove'>
  onRate: (id: string, dir: 'approve' | 'disapprove') => void
}) {
  const info      = SCORED_MP_INFO[sc.mpId]
  if (!info) return null
  const grade     = scoreToGrade(sc.civicScore)
  const gs        = gradeStyle(grade)
  const partyColor = PARTY_COLORS[info.party] ?? '#5a5a5e'
  const commPct   = communityApprovalPct(sc.mpId)
  const mine      = ratings[sc.mpId]
  const displayPct =
    mine === 'approve'    ? Math.min(99, commPct + 2) :
    mine === 'disapprove' ? Math.max(1,  commPct - 2) :
    commPct

  return (
    <div
      className="rounded-xl border p-4 space-y-3 hover:border-white/10 transition-colors"
      style={{ background: '#0a0a0b', borderColor: '#1e1e20' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: partyColor }}
            />
            <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#5a5a5e' }}>
              {PARTY_SHORT[info.party] ?? info.party}
            </span>
          </div>
          <p className="text-sm font-medium text-foreground">{info.name}</p>
          <p className="font-mono text-[10px]" style={{ color: '#3a3a3e' }}>{info.role} · {info.electorate}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-mono text-lg" style={{ color: sc.civicScore >= 60 ? '#2ec266' : sc.civicScore >= 40 ? '#f5a623' : '#f04747' }}>
            {sc.civicScore}
          </span>
          <span className="font-mono text-xs px-1.5 py-0.5 border" style={gs}>{grade}</span>
        </div>
      </div>

      {/* Pillar dots */}
      <div className="flex items-center gap-2">
        {sc.pillarRatings.map(r => (
          <div key={r.pillarId} className="flex items-center gap-1" title={`${PILLAR_SHORT[r.pillarId]}: ${r.score}/100`}>
            <div className="h-2 w-2 rounded-full" style={{ background: PILLAR_STATUS_COLOR[r.status] }} />
            <span className="font-mono text-[8px]" style={{ color: '#3a3a3e' }}>{PILLAR_SHORT[r.pillarId]}</span>
          </div>
        ))}
      </div>

      {/* Key action (top pillar reason) */}
      {sc.pillarRatings[0] && (
        <p className="font-mono text-[10px] leading-snug line-clamp-2" style={{ color: '#5a5a5e' }}>
          &ldquo;{sc.pillarRatings[0].rationale}&rdquo;
        </p>
      )}

      {/* Community approval + vote */}
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#1e1e20' }}>
        <div className="flex items-center gap-2">
          <div className="w-20 h-px relative" style={{ background: '#1e1e20' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${displayPct}%`, background: displayPct >= 60 ? '#2ec266' : '#f5a623', transition: 'width 0.3s ease' }} />
          </div>
          <span className="font-mono text-[10px]" style={{ color: '#5a5a5e' }}>{displayPct}% community approval</span>
        </div>
        <ApprovalButtons mpId={sc.mpId} ratings={ratings} onRate={onRate} communityPct={commPct} compact />
      </div>
    </div>
  )
}

// ─── MP marketplace row ────────────────────────────────────────────────────────

function MPRow({
  mp,
  rank,
  isSelected,
  ratings,
  onRate,
  onClick,
}: {
  mp: typeof MPs[number]
  rank: number
  isSelected: boolean
  ratings: Record<string, 'approve' | 'disapprove'>
  onRate: (id: string, dir: 'approve' | 'disapprove') => void
  onClick: () => void
}) {
  const ext        = mpExtendedIndex[mp.id]
  const commPct    = communityApprovalPct(mp.id)
  const partyShort = PARTY_SHORT[mp.party] ?? mp.party.slice(0, 3).toUpperCase()
  const partyColor = PARTY_COLORS[mp.party] ?? '#5a5a5e'
  const initials   = mp.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')
  const consistency = ext?.stickeeScore ?? 0

  return (
    <div
      onClick={onClick}
      className="grid gap-4 items-center py-3 border-b transition-colors cursor-pointer"
      style={{
        gridTemplateColumns: '1.5rem 1fr auto auto auto',
        borderColor: isSelected ? '#2a2a2e' : '#0e0e10',
        background: isSelected ? '#111113' : 'transparent',
      }}
    >
      {/* Rank */}
      <span className="font-mono text-xs" style={{ color: rank <= 3 ? '#f5a623' : '#2a2a2e' }}>
        {rank}
      </span>

      {/* Name + party + electorate */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="h-7 w-7 flex items-center justify-center font-mono text-[10px] font-medium shrink-0"
          style={{ background: `${partyColor}20`, color: partyColor, border: `1px solid ${partyColor}30` }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-foreground/90 truncate">{mp.name}</p>
          <p className="font-mono text-[9px] truncate" style={{ color: '#3a3a3e' }}>
            {partyShort} · {mp.electorate}
          </p>
        </div>
      </div>

      {/* Voting consistency */}
      <div className="hidden sm:flex items-center gap-2">
        <div className="w-12 h-px relative" style={{ background: '#1e1e20' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${consistency}%`, background: '#3a3a5e' }} />
        </div>
        <span className="font-mono text-[10px] tabular-nums" style={{ color: '#5a5a5e' }}>{consistency}%</span>
      </div>

      {/* Community approval % */}
      <div className="hidden md:block">
        <span
          className="font-mono text-[10px] tabular-nums"
          style={{ color: commPct >= 60 ? '#2ec266' : commPct >= 40 ? '#f5a623' : '#f04747' }}
        >
          {commPct}%
        </span>
      </div>

      {/* Approve / disapprove */}
      <ApprovalButtons mpId={mp.id} ratings={ratings} onRate={onRate} communityPct={commPct} compact />
    </div>
  )
}

// ─── Rising leaders section ────────────────────────────────────────────────────

function RisingLeadersSection() {
  const [nomOpen, setNomOpen] = useState(false)
  const approved = LEADERS.filter(l => l.nomination.moderationStatus === 'approved')
  const sorted   = [...approved].sort((a, b) => {
    const sa = computeCredibility(a.nomination, a.endorsements ?? [], a.concerns ?? []).total
    const sb = computeCredibility(b.nomination, b.endorsements ?? [], b.concerns ?? []).total
    return sb - sa
  })

  return (
    <div className="pb-12">
      <div className="flex items-center justify-between py-5 border-b border-border">
        <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          Rising Leaders · Community Nominated
        </span>
        <button
          onClick={() => setNomOpen(true)}
          className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 bg-foreground text-background hover:opacity-80 transition-opacity"
        >
          + Nominate
        </button>
      </div>

      {sorted.map(leader => {
        const cred     = computeCredibility(leader.nomination, leader.endorsements ?? [], leader.concerns ?? [])
        const credColor = cred.total >= 65 ? '#2ec266' : cred.total >= 45 ? '#f5a623' : '#f04747'
        return (
          <div
            key={leader.id}
            className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center py-3.5 border-b border-border hover:bg-card/30 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 flex items-center justify-center font-mono text-[10px] font-medium shrink-0 relative" style={{ background: '#1e1e20', color: '#5a5a5e' }}>
                {leader.avatarInitials}
                {leader.isRising && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full" style={{ background: '#2ec266' }} />}
              </div>
              <div className="min-w-0">
                <div className="text-sm text-foreground truncate">{leader.name}</div>
                <div className="font-mono text-[10px] text-muted-foreground truncate">{leader.location}</div>
              </div>
            </div>
            <span className="font-mono text-xs text-muted-foreground hidden sm:block whitespace-nowrap">{leader.field}</span>
            <span className="font-mono text-xs text-muted-foreground hidden sm:block">{leader.state}</span>
            <span
              className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 border text-center"
              style={leader.readiness === 'Ready'
                ? { color: '#2ec266', borderColor: '#0e3020', background: '#041008' }
                : { color: '#5a5a5e', borderColor: '#1e1e20', background: 'transparent' }
              }
            >
              {leader.readiness}
            </span>
            <div className="text-right">
              <Link href={`/leaders/${leader.id}`} className="font-mono text-sm hover:text-foreground transition-colors" style={{ color: credColor }}>
                {cred.total}<span className="text-muted-foreground text-xs">/100</span>
              </Link>
            </div>
          </div>
        )
      })}

      <NominationModal open={nomOpen} onOpenChange={setNomOpen} />
    </div>
  )
}

// ─── Leaders page ─────────────────────────────────────────────────────────────

export default function LeadersPage() {
  const [chamberTab,   setChamberTab]   = useState<'house' | 'senate'>('house')
  const [selectedMPId, setSelectedMPId] = useState<string | null>(null)
  const [sortBy,       setSortBy]       = useState<SortKey>('approval')
  const [partyFilter,  setPartyFilter]  = useState<PartyFilter>('all')
  const [page,         setPage]         = useState(1)
  const chamberRef = useRef<HTMLDivElement>(null)

  const { ratings, rate, approveCount } = useApproval()

  // Build sorted + filtered MP list
  const allMPs = useMemo(() => {
    let list = [...MPs]
    if (partyFilter !== 'all') list = list.filter(m => m.party === partyFilter)

    list.sort((a, b) => {
      if (sortBy === 'approval')  return communityApprovalPct(b.id) - communityApprovalPct(a.id)
      if (sortBy === 'voting')    return (mpExtendedIndex[b.id]?.stickeeScore ?? 0) - (mpExtendedIndex[a.id]?.stickeeScore ?? 0)
      if (sortBy === 'party')     return a.party.localeCompare(b.party)
      return a.name.localeCompare(b.name)
    })
    return list
  }, [sortBy, partyFilter])

  const displayedMPs = allMPs.slice(0, page * PAGE_SIZE)
  const hasMore      = displayedMPs.length < allMPs.length

  function handleSelectMP(mpId: string) {
    setSelectedMPId(prev => {
      const next = prev === mpId ? null : mpId
      if (next) {
        setTimeout(() => chamberRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
      }
      return next
    })
  }

  const uniqueParties = useMemo(() => {
    const parties = [...new Set(MPs.map(m => m.party))].sort()
    return ['all', ...parties] as PartyFilter[]
  }, [])

  const totalMPs     = MPs.length
  const totalLeaders = LEADERS.filter(l => l.nomination.moderationStatus === 'approved').length

  return (
    <div className="mx-auto max-w-5xl px-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-6 py-10 border-b border-border">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Australia · Parliament &amp; Leaders
          </p>
          <div className="flex items-baseline gap-3">
            <span className="font-mono font-normal leading-none text-foreground" style={{ fontSize: 'clamp(40px, 8vw, 56px)', letterSpacing: '-0.02em' }}>
              {totalMPs}
            </span>
            <span className="font-mono text-xl text-muted-foreground/40">MPs tracked</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-2" style={{ letterSpacing: '0.03em' }}>
            Approve or disapprove · See who sits where · Analyse decisions
          </p>
        </div>
        <div className="hidden sm:flex items-end gap-6 pb-1">
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1" style={{ color: '#2ec266' }}>{approveCount}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Your approvals</p>
          </div>
          <div className="w-px h-8 bg-border mb-1" />
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1 text-foreground">{totalLeaders}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Rising leaders</p>
          </div>
        </div>
      </div>

      {/* ── Chamber ──────────────────────────────────────────────────────── */}
      <div ref={chamberRef} className="mt-8 mb-10">
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Chamber View
            {selectedMPId && (
              <span style={{ color: '#f5a623' }}>
                {' · '}{MPs.find(m => m.id === selectedMPId)?.name ?? ''}
              </span>
            )}
          </span>
          <div className="flex items-center gap-0">
            {(['house', 'senate'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setChamberTab(tab)}
                className="font-mono text-[10px] tracking-widest uppercase px-4 py-1.5 border-b-2 transition-colors"
                style={{
                  color:       chamberTab === tab ? '#e8e8e6' : '#5a5a5e',
                  borderColor: chamberTab === tab ? '#e8e8e6' : 'transparent',
                }}
              >
                {tab === 'house' ? 'House of Reps' : 'Senate'}
              </button>
            ))}
          </div>
        </div>

        {chamberTab === 'house' ? (
          <HouseChamber selectedBillId={null} highlightedMPId={selectedMPId} />
        ) : (
          <SenateView selectedBillId={null} />
        )}
      </div>

      {/* ── Featured Civic Analysis ───────────────────────────────────────── */}
      <div className="mb-12">
        <div className="flex items-center justify-between py-5 border-b border-border">
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Civic Analysis · Key Politicians
          </span>
          <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
            Score · Grade · Approve
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-4">
          {POLITICIAN_SCORECARDS.map(sc => (
            <FeaturedMPCard key={sc.mpId} sc={sc} ratings={ratings} onRate={rate} />
          ))}
        </div>
      </div>

      {/* ── Parliament Marketplace ────────────────────────────────────────── */}
      <div className="mb-12">
        {/* Section header */}
        <div className="flex items-center justify-between py-5 border-b border-border">
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Parliament · All {totalMPs} Members
          </span>
          <p className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>
            Click to highlight in chamber ↑
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-b border-border">
          {/* Sort */}
          <div className="flex items-center gap-0">
            <span className="font-mono text-[9px] tracking-widest uppercase mr-3" style={{ color: '#3a3a3e' }}>Sort:</span>
            {([
              { key: 'approval', label: 'Approval' },
              { key: 'voting',   label: 'Consistency' },
              { key: 'party',    label: 'Party' },
              { key: 'name',     label: 'Name' },
            ] as { key: SortKey; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 border-b-2 transition-colors"
                style={{ color: sortBy === key ? '#e8e8e6' : '#5a5a5e', borderColor: sortBy === key ? '#e8e8e6' : 'transparent' }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Party filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {uniqueParties.map(p => (
              <button
                key={p}
                onClick={() => { setPartyFilter(p); setPage(1) }}
                className="font-mono text-[9px] tracking-widest uppercase px-2 py-0.5 transition-colors"
                style={{
                  color:       partyFilter === p ? '#e8e8e6' : '#3a3a3e',
                  borderBottom: partyFilter === p ? '1px solid #e8e8e6' : '1px solid transparent',
                }}
              >
                {p === 'all' ? 'All' : PARTY_SHORT[p] ?? p}
              </button>
            ))}
          </div>
        </div>

        {/* Column headers */}
        <div className="grid gap-4 py-2.5 border-b" style={{ gridTemplateColumns: '1.5rem 1fr auto auto auto', borderColor: '#0e0e10' }}>
          <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#2a2a2e' }}>#</span>
          <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#2a2a2e' }}>MP</span>
          <span className="font-mono text-[9px] tracking-widest uppercase hidden sm:block" style={{ color: '#2a2a2e' }}>Consistency</span>
          <span className="font-mono text-[9px] tracking-widest uppercase hidden md:block" style={{ color: '#2a2a2e' }}>Community</span>
          <span className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#2a2a2e' }}>Your Vote</span>
        </div>

        {/* MP rows */}
        {displayedMPs.map((mp, i) => (
          <MPRow
            key={mp.id}
            mp={mp}
            rank={i + 1}
            isSelected={selectedMPId === mp.id}
            ratings={ratings}
            onRate={rate}
            onClick={() => handleSelectMP(mp.id)}
          />
        ))}

        {/* Load more */}
        {hasMore && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-full py-4 flex items-center justify-center gap-2 font-mono text-[10px] tracking-widest uppercase transition-colors mt-2"
            style={{ color: '#3a3a3e' }}
          >
            <ChevronDown size={12} />
            Show more ({allMPs.length - displayedMPs.length} remaining)
          </button>
        )}

        <p className="font-mono text-[10px] mt-4" style={{ color: '#2a2a2e' }}>
          {displayedMPs.length} of {allMPs.length} members · Consistency = voting with majority · Approval = community rating
        </p>
      </div>

      {/* ── Rising Leaders ────────────────────────────────────────────────── */}
      <RisingLeadersSection />
    </div>
  )
}
