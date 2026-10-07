'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { simulatorUrlFor, type EntityRef } from '@/lib/simulator-bridge'

interface Props {
  entity: EntityRef
  /** "lg" gets a card-style CTA. "sm" is a chip. "inline" is just text. */
  size?: 'lg' | 'sm' | 'inline'
  className?: string
  /** Override label, e.g. "Simulate this leader's stance" */
  label?: string
}

/**
 * The single shared "Simulate this" affordance, used on every entity surface
 * in Stickee. Clicking links into the Simulator preloaded with the entity
 * encoded in the URL — see lib/simulator-bridge.ts for the round-trip format.
 */
export function SimulateThisButton({ entity, size = 'sm', label, className }: Props) {
  const href = simulatorUrlFor(entity)
  const text = label ?? defaultLabel(entity.type)

  if (size === 'lg') {
    return (
      <Link
        href={href}
        className={`block rounded-xl border p-4 transition-all hover:border-emerald-900/80 group ${className ?? ''}`}
        style={{
          background: 'linear-gradient(180deg, #0a1410 0%, #0a0a0b 100%)',
          borderColor: '#0e3020',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: '#2ec26618', color: '#2ec266' }}
          >
            <Sparkles size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] tracking-widest uppercase mb-0.5" style={{ color: '#2ec266' }}>
              Decision Simulator
            </p>
            <p className="text-sm font-medium text-foreground leading-snug">{text}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Compare alternative responses across markets, civic pillars, leader approval and geopolitical risk.
            </p>
          </div>
        </div>
      </Link>
    )
  }

  if (size === 'inline') {
    return (
      <Link
        href={href}
        className={`inline-flex items-center gap-1 font-mono text-[10px] tracking-widest uppercase transition-colors ${className ?? ''}`}
        style={{ color: '#2ec266' }}
      >
        <Sparkles size={10} />
        {text}
      </Link>
    )
  }

  // sm — the default chip
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 border transition-colors hover:text-foreground hover:border-foreground/40 ${className ?? ''}`}
      style={{
        color: '#2ec266',
        borderColor: '#0e3020',
        background: '#041008',
      }}
    >
      <Sparkles size={10} />
      {text}
    </Link>
  )
}

function defaultLabel(type: EntityRef['type']): string {
  switch (type) {
    case 'leader':   return "Explore scenarios for this leader"
    case 'bill':     return 'Explore scenarios for this bill'
    case 'decision': return 'Explore scenarios for this decision'
    case 'campaign': return 'Explore scenarios for this campaign'
    case 'market':   return 'Explore scenarios for this market'
    case 'issue':
    default:         return 'Explore scenarios'
  }
}
