'use client'

import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { DecisionCard } from '@/components/DecisionCard'
import { DECISIONS, DECISION_MAKER_INDEX } from '@/lib/mock-government-data'
import type { GovernmentLevel, ImpactLevel } from '@/types/government'
import { EmptyState } from '@/components/ui/empty-state'

// ─── Filter types ─────────────────────────────────────────────────────────────

type LevelFilter = 'all' | GovernmentLevel
type ImpactFilter = 'all' | ImpactLevel
type TagFilter = 'all' | 'trending' | 'controversial'

export default function DecisionsPage() {
  const [search, setSearch]           = useState('')
  const [level, setLevel]             = useState<LevelFilter>('all')
  const [impact, setImpact]           = useState<ImpactFilter>('all')
  const [tag, setTag]                 = useState<TagFilter>('all')

  const filtered = useMemo(() => {
    let results = [...DECISIONS]

    if (search.trim()) {
      const q = search.toLowerCase()
      results = results.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.tags.some(t => t.includes(q))
      )
    }
    if (level !== 'all') results = results.filter(d => d.level === level)
    if (impact !== 'all') results = results.filter(d => d.impactLevel === impact)
    if (tag === 'trending') results = results.filter(d => d.isTrending)
    if (tag === 'controversial') results = results.filter(d => d.isControversial)

    // Sort: trending first, then by date desc
    return results.sort((a, b) => {
      if (a.isTrending && !b.isTrending) return -1
      if (!a.isTrending && b.isTrending) return 1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }, [search, level, impact, tag])

  function FilterChip<T extends string>({
    options,
    value,
    onChange,
  }: {
    options: { label: string; value: T }[]
    value: T
    onChange: (v: T) => void
  }) {
    return (
      <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/80 p-1" role="group">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              value === opt.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Decisions</h1>
        <p className="text-sm text-muted-foreground">
          Every government decision — federal, state, and local. Track what happened, who made it, and what it means for you.
        </p>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search decisions, policies, bills…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search decisions"
            className="w-full rounded-xl border border-border/60 bg-card/80 pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
          <FilterChip
            value={level}
            onChange={setLevel}
            options={[
              { label: 'All Levels', value: 'all' },
              { label: 'Federal',    value: 'federal' },
              { label: 'State',      value: 'state' },
              { label: 'Local',      value: 'local' },
            ]}
          />
          <FilterChip
            value={impact}
            onChange={setImpact}
            options={[
              { label: 'Any Impact', value: 'all' },
              { label: 'High',       value: 'High' },
              { label: 'Medium',     value: 'Medium' },
              { label: 'Low',        value: 'Low' },
            ]}
          />
          <FilterChip
            value={tag}
            onChange={setTag}
            options={[
              { label: 'All',           value: 'all' },
              { label: 'Trending',      value: 'trending' },
              { label: 'Controversial', value: 'controversial' },
            ]}
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground -mt-4">
        {filtered.length} of {DECISIONS.length} decisions
      </p>

      {/* Decision feed */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No decisions match your filters"
            description="Try adjusting your search or filters"
          />
        ) : (
          filtered.map(decision => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              decisionMaker={DECISION_MAKER_INDEX[decision.decisionMakerId]}
            />
          ))
        )}
      </div>
    </div>
  )
}
