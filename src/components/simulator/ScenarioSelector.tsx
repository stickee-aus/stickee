'use client'

import { BarChart3, Pickaxe, Home, Zap, Users, Globe } from 'lucide-react'
import type { Scenario, ScenarioDomain } from '@/types/simulator'
import { DOMAIN_LABEL, DOMAIN_ACCENT } from '@/lib/mock-simulator-data'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  BarChart3,
  Pickaxe,
  Home,
  Zap,
  Users,
  Globe,
}

interface Props {
  scenarios: Scenario[]
  selectedId: string
  onSelect: (id: string) => void
  domainFilter: ScenarioDomain | 'all'
  onDomainChange: (d: ScenarioDomain | 'all') => void
}

export function ScenarioSelector({
  scenarios,
  selectedId,
  onSelect,
  domainFilter,
  onDomainChange,
}: Props) {
  const filtered = domainFilter === 'all' ? scenarios : scenarios.filter(s => s.domain === domainFilter)

  const domains: (ScenarioDomain | 'all')[] = ['all', 'markets', 'issues', 'leaders', 'geopolitics']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          Step 1 · Pick a seed scenario
        </span>
        <div className="flex items-center gap-0">
          {domains.map(d => (
            <button
              key={d}
              onClick={() => onDomainChange(d)}
              className="font-mono text-[10px] tracking-widest uppercase px-3 py-1 border-b-2 transition-colors"
              style={{
                color:       domainFilter === d ? '#e8e8e6' : '#5a5a5e',
                borderColor: domainFilter === d ? '#e8e8e6' : 'transparent',
              }}
            >
              {d === 'all' ? 'All' : DOMAIN_LABEL[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(s => {
          const Icon = ICON_MAP[s.icon] ?? BarChart3
          const accent = DOMAIN_ACCENT[s.domain]
          const selected = s.id === selectedId
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className="text-left rounded-xl border p-4 space-y-2 transition-all hover:border-white/20"
              style={{
                background: '#0a0a0b',
                borderColor: selected ? accent : '#1e1e20',
                boxShadow:   selected ? `0 0 0 1px ${accent}40` : undefined,
              }}
              aria-pressed={selected}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-7 w-7 rounded-md flex items-center justify-center"
                    style={{ background: `${accent}18`, color: accent }}
                  >
                    <Icon size={14} />
                  </div>
                  <span
                    className="font-mono text-[9px] tracking-widest uppercase"
                    style={{ color: accent }}
                  >
                    {DOMAIN_LABEL[s.domain]}
                  </span>
                </div>
                <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#3a3a3e' }}>
                  {new Date(s.seededAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <p className="text-sm font-medium text-foreground leading-snug">{s.title}</p>
              <p className="text-xs text-muted-foreground leading-snug line-clamp-3">{s.summary}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
