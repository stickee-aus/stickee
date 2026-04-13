'use client'

import type { CivicPillar } from '@/types/civic'
import { scoreToGrade } from '@/lib/civic-utils'

interface TickerBarProps {
  pillars: CivicPillar[]
}

function trendLabel(pillar: CivicPillar): string {
  if (pillar.trendDirection === 'improving') return '↑ IMPROVING'
  if (pillar.trendDirection === 'worsening') return '↓ DECLINING'
  return '→ STABLE'
}

function gradeClass(grade: string): string {
  if (grade === 'A' || grade === 'B') return 'k-grade-b'
  if (grade === 'C') return 'k-grade-c'
  return 'k-grade-d'
}

function TickerItem({ pillar }: { pillar: CivicPillar }) {
  const grade = scoreToGrade(pillar.civicScore)
  const isImproving = pillar.trendDirection === 'improving'
  const isWorsening = pillar.trendDirection === 'worsening'

  return (
    <div className="flex items-center gap-3 px-8 border-r border-[#1e1e20] shrink-0">
      <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground whitespace-nowrap">
        {pillar.label}
      </span>
      <span className={`font-mono text-[10px] font-medium px-1.5 py-0.5 ${gradeClass(grade)}`}>
        {grade}
      </span>
      <span
        className="font-mono text-[10px] tracking-wider whitespace-nowrap"
        style={{ color: isImproving ? '#2ec266' : isWorsening ? '#f04747' : '#5a5a5e' }}
      >
        {trendLabel(pillar)}
      </span>
    </div>
  )
}

export function TickerBar({ pillars }: TickerBarProps) {
  // Duplicate items to create seamless loop
  const items = [...pillars, ...pillars]

  return (
    <div className="border-b border-border bg-card overflow-hidden">
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-scroll 42s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="ticker-track py-2.5">
        {items.map((pillar, i) => (
          <TickerItem key={`${pillar.id}-${i}`} pillar={pillar} />
        ))}
      </div>
    </div>
  )
}
