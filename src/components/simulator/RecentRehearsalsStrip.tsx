'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useRecentRuns } from '@/lib/simulator-bridge'
import { DOMAIN_LABEL, DOMAIN_ACCENT } from '@/lib/mock-simulator-data'

interface Props {
  /** Limit how many runs appear; default 3. */
  limit?: number
  /** "compact" trims the heading and chrome — used on entity pages. */
  variant?: 'default' | 'compact'
  className?: string
}

/**
 * A tiny strip of the user's recent simulator runs, sourced from
 * localStorage via `useRecentRuns`. Renders nothing until the user has
 * actually run something, so it never adds visual noise to a fresh session.
 */
export function RecentRehearsalsStrip({ limit = 3, variant = 'default', className }: Props) {
  const runs = useRecentRuns()
  if (runs.length === 0) return null
  const visible = runs.slice(0, limit)

  return (
    <section className={`space-y-2 ${className ?? ''}`}>
      {variant === 'default' && (
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Recent rehearsals · saved on this device
          </span>
          <Link
            href="/simulator"
            className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            New simulation <ArrowRight size={10} />
          </Link>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3">
        {visible.map(run => {
          const accent = DOMAIN_ACCENT[run.domain]
          const score = run.countryScore
          const scoreColor = score >= 60 ? '#2ec266' : score >= 40 ? '#f5a623' : '#f04747'
          return (
            <Link
              key={run.key}
              href={run.url}
              className="rounded-xl border p-3 space-y-2 transition-colors hover:border-white/20"
              style={{ background: '#0a0a0b', borderColor: '#1e1e20' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-mono text-[9px] tracking-widest uppercase flex items-center gap-1"
                  style={{ color: accent }}
                >
                  <Sparkles size={9} />
                  {DOMAIN_LABEL[run.domain]}
                </span>
                <span className="font-mono text-[10px] tabular-nums" style={{ color: scoreColor }}>
                  {score}<span className="text-muted-foreground/50 text-[8px] ml-0.5">/100</span>
                </span>
              </div>
              <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">{run.scenarioTitle}</p>
              <p className="font-mono text-[10px]" style={{ color: '#5a5a5e' }}>
                Best: <span className="text-foreground/80">{run.recommendedLabel}</span>
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
