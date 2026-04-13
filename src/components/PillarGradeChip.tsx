import {
  ShoppingCart,
  Home,
  Shield,
  Briefcase,
  Leaf,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import type { CivicPillar } from '@/types/civic'
import { scoreToGrade } from '@/lib/civic-utils'

const PILLAR_ICONS: Record<string, React.ElementType> = {
  'cost-of-living': ShoppingCart,
  'housing':        Home,
  'crime-safety':   Shield,
  'jobs-economy':   Briefcase,
  'future':         Leaf,
}

function gradeStyle(g: string) {
  if (g === 'A' || g === 'B') return { color: '#2ec266', borderColor: '#0e3020', background: '#041008' }
  if (g === 'C')              return { color: '#f5a623', borderColor: '#3a2e10', background: '#1e1800' }
  return                             { color: '#f04747', borderColor: '#3a1414', background: '#1e0a0a' }
}

interface PillarGradeChipProps {
  pillar: CivicPillar
  onClick?: () => void
  compact?: boolean
}

export function PillarGradeChip({ pillar, onClick, compact = false }: PillarGradeChipProps) {
  const grade = scoreToGrade(pillar.civicScore)
  const gs    = gradeStyle(grade)
  const Icon  = PILLAR_ICONS[pillar.id] ?? Briefcase

  const TrendIcon =
    pillar.trendDirection === 'improving' ? TrendingUp
    : pillar.trendDirection === 'worsening' ? TrendingDown
    : Minus

  const trendColor =
    pillar.trendDirection === 'improving' ? '#2ec266'
    : pillar.trendDirection === 'worsening' ? '#f04747'
    : '#5a5a5e'

  const Tag = onClick ? 'button' : 'div'

  if (compact) {
    return (
      <Tag
        onClick={onClick}
        className="flex items-center gap-1.5 border px-2.5 py-1.5 transition-colors hover:opacity-80"
        style={{ borderColor: gs.borderColor, background: gs.background }}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: gs.color }} />
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: gs.color }}>{pillar.label}</span>
        <span className="font-mono text-xs font-medium" style={{ color: gs.color }}>{grade}</span>
      </Tag>
    )
  }

  return (
    <Tag
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 border p-4 transition-colors hover:opacity-80"
      style={{ borderColor: gs.borderColor, background: gs.background }}
    >
      <Icon className="h-5 w-5 shrink-0" style={{ color: gs.color }} />
      <span className="font-mono text-2xl font-normal" style={{ color: gs.color }}>{grade}</span>
      <span className="font-mono text-[9px] uppercase tracking-widest text-center" style={{ color: gs.color, opacity: 0.7 }}>
        {pillar.label}
      </span>
      <TrendIcon className="h-3 w-3" style={{ color: trendColor }} />
    </Tag>
  )
}
