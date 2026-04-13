import type { CivicPillar } from '@/types/civic'

export function nationalCivicScore(pillars: CivicPillar[]): number {
  if (pillars.length === 0) return 0
  return Math.round(pillars.reduce((s, p) => s + p.civicScore, 0) / pillars.length)
}

export function scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 55) return 'C'
  if (score >= 35) return 'D'
  return 'F'
}

/** Tailwind classes for grade chip backgrounds/borders — Kalshi dark palette */
export function gradeColorClass(grade: string): string {
  switch (grade) {
    case 'A': return 'text-emerald-400 bg-emerald-950/60 ring-emerald-900/80'
    case 'B': return 'text-emerald-400 bg-emerald-950/40 ring-emerald-900/60'
    case 'C': return 'text-amber-400 bg-amber-950/60 ring-amber-900/80'
    case 'D': return 'text-red-400 bg-red-950/60 ring-red-900/80'
    case 'F': return 'text-red-400 bg-red-950/80 ring-red-900/80'
    default:  return 'text-muted-foreground'
  }
}

export function gradeTextColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-emerald-400'
    case 'B': return 'text-emerald-400'
    case 'C': return 'text-amber-400'
    case 'D': return 'text-red-400'
    case 'F': return 'text-red-400'
    default:  return 'text-muted-foreground'
  }
}
