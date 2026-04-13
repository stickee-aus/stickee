'use client'

/**
 * CivicScorecard — Politician scorecard section (Level 1 → Level 2).
 *
 * Level 1: Simple card per politician showing:
 *   - Name + party colour dot
 *   - Civic Score badge
 *   - 5 pillar traffic light dots in a row
 *
 * Level 2 (expand): Per-pillar rationale + key actions.
 *
 * Design principle: a new user can scan all politicians in 5 seconds.
 * A power user clicks any card to see exactly why.
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { POLITICIAN_SCORECARDS } from '@/lib/mock-civic-data'
import { MPs } from '@/lib/mock-data'
import type { PoliticianScorecard, PillarRating, CivicStatus, PillarId } from '@/types/civic'
import type { MP } from '@/types/index'

// ─── Party colours (matches existing PARTY_COLORS in mock-data) ───────────────

const PARTY_BADGE: Record<string, { bg: string; text: string }> = {
  Labor:      { bg: 'bg-red-500/15',    text: 'text-red-400' },
  Coalition:  { bg: 'bg-blue-500/15',   text: 'text-blue-400' },
  Greens:     { bg: 'bg-emerald-500/15',text: 'text-emerald-400' },
  Independent:{ bg: 'bg-zinc-500/15',   text: 'text-zinc-400' },
  'One Nation':{ bg: 'bg-amber-500/15', text: 'text-amber-400' },
  default:    { bg: 'bg-primary/10',    text: 'text-primary' },
}

function partyBadge(party: string) {
  return PARTY_BADGE[party] ?? PARTY_BADGE.default
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const DOT: Record<CivicStatus, string> = {
  green:  'bg-emerald-500',
  yellow: 'bg-amber-400',
  red:    'bg-red-500',
}

const PILLAR_LABELS: Record<PillarId, string> = {
  'cost-of-living': 'Cost of Living',
  'housing':        'Housing',
  'crime-safety':   'Crime & Safety',
  'jobs-economy':   'Jobs & Economy',
  'future':         'Future',
}

function scoreBadgeColor(score: number): string {
  if (score >= 65) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/8'
  if (score >= 45) return 'text-amber-400 border-amber-400/30 bg-amber-400/8'
  return 'text-red-400 border-red-500/30 bg-red-500/8'
}

// ─── Pillar rating row (Level 2 detail) ──────────────────────────────────────

function PillarRatingRow({ rating }: { rating: PillarRating }) {
  return (
    <div className="py-3 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${DOT[rating.status]}`} />
        <span className="text-sm font-semibold text-foreground">{PILLAR_LABELS[rating.pillarId]}</span>
        <span className={`ml-auto text-xs font-bold tabular-nums ${
          rating.score >= 65 ? 'text-emerald-400' : rating.score >= 45 ? 'text-amber-400' : 'text-red-400'
        }`}>{rating.score}/100</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed pl-5 mb-2">{rating.rationale}</p>
      <div className="pl-5 flex flex-wrap gap-1.5">
        {rating.keyActions.map(action => (
          <span
            key={action}
            className="inline-block rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground"
          >
            {action}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Individual politician card ───────────────────────────────────────────────

function ScorecardCard({ scorecard, mp }: { scorecard: PoliticianScorecard; mp: MP | undefined }) {
  const [expanded, setExpanded] = useState(false)
  const badge = mp ? partyBadge(mp.party) : PARTY_BADGE.default
  const displayName = mp?.name ?? scorecard.mpId

  return (
    <div
      className={[
        'rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm',
        'transition-all duration-200 hover:border-border',
      ].join(' ')}
    >
      {/* Level 1: Scorecard row */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        {/* Avatar initials */}
        <div className={`h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${badge.bg} ${badge.text}`}>
          {displayName.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </div>

        {/* Name + party + tenure */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{displayName}</span>
            {mp && (
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${badge.bg} ${badge.text}`}>
                {mp.party}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{scorecard.tenure}</p>
        </div>

        {/* 5 pillar dots */}
        <div className="flex-shrink-0 flex items-center gap-1.5 hidden sm:flex">
          {scorecard.pillarRatings.map(r => (
            <div
              key={r.pillarId}
              title={`${PILLAR_LABELS[r.pillarId]}: ${r.score}/100`}
              className={`h-3 w-3 rounded-full ${DOT[r.status]}`}
            />
          ))}
        </div>

        {/* Civic score */}
        <div className={`flex-shrink-0 rounded-xl border px-3 py-1.5 text-center ${scoreBadgeColor(scorecard.civicScore)}`}>
          <p className="text-base font-bold tabular-nums leading-none">{scorecard.civicScore}</p>
          <p className="text-xs opacity-70">/100</p>
        </div>

        {/* Expand */}
        <div className="flex-shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Level 2: Per-pillar breakdown */}
      {expanded && (
        <div className="border-t border-border/40 px-4 pb-4 pt-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pillar breakdown
            </p>
            {mp && (
              <a
                href={`/mp/${mp.id}`}
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Full profile <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          {scorecard.pillarRatings.map(rating => (
            <PillarRatingRow key={rating.pillarId} rating={rating} />
          ))}
          <p className="mt-3 text-xs text-muted-foreground">
            Last updated {scorecard.lastUpdated} · Scores based on voting record + public commitments
          </p>
        </div>
      )}
    </div>
  )
}

// ─── CivicScorecard ───────────────────────────────────────────────────────────

export function CivicScorecard() {
  const [filter, setFilter] = useState<'all' | 'government' | 'opposition' | 'crossbench'>('all')

  const GOVERNMENT_IDS = new Set(['mp-albanese', 'mp-chalmers', 'mp-butler'])
  const OPPOSITION_IDS = new Set(['mp-dutton'])
  const CROSSBENCH_IDS = new Set(['mp-bandt'])

  const filtered = POLITICIAN_SCORECARDS.filter(sc => {
    if (filter === 'government')  return GOVERNMENT_IDS.has(sc.mpId)
    if (filter === 'opposition')  return OPPOSITION_IDS.has(sc.mpId)
    if (filter === 'crossbench')  return CROSSBENCH_IDS.has(sc.mpId)
    return true
  })

  const mpIndex = Object.fromEntries(MPs.map(m => [m.id, m]))

  const FILTER_LABELS = [
    { key: 'all',        label: 'All' },
    { key: 'government', label: 'Government' },
    { key: 'opposition', label: 'Opposition' },
    { key: 'crossbench', label: 'Crossbench' },
  ] as const

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <div className="h-4 w-0.5 rounded-full bg-primary/60" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Politician Scorecards
            </h2>
          </div>
          <p className="pl-[22px] text-xs text-muted-foreground">
            Click any card to see pillar-by-pillar ratings and key votes
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1">
          {FILTER_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={[
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                filter === key
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pillar legend row */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {(Object.entries(PILLAR_LABELS) as [PillarId, string][]).map(([id, label]) => (
          <div key={id} className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
            <div className="h-1.5 w-1.5 rounded-full bg-border" />
            {label}
          </div>
        ))}
        <span className="ml-2 text-xs text-muted-foreground opacity-60">← dots order (L to R)</span>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {filtered.map(sc => (
          <ScorecardCard
            key={sc.mpId}
            scorecard={sc}
            mp={mpIndex[sc.mpId]}
          />
        ))}
      </div>

      {/* Transparency note */}
      <p className="text-xs text-muted-foreground pl-1">
        Scores reflect verifiable voting records and public policy commitments.
        <span className="ml-1 text-primary cursor-pointer hover:underline">
          View full methodology →
        </span>
      </p>
    </section>
  )
}
