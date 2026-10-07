// ─── Core Enums ───────────────────────────────────────────────────────────────

export type PillarId =
  | 'cost-of-living'
  | 'housing'
  | 'crime-safety'
  | 'jobs-economy'
  | 'future'

export type CivicStatus = 'green' | 'yellow' | 'red'

export type TrendDirection = 'improving' | 'stable' | 'worsening'

// ─── Time Series ──────────────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  /** ISO date string, e.g. "2024-04" */
  date: string
  value: number
}

// ─── Metric (leaf node) ───────────────────────────────────────────────────────

export interface CivicMetric {
  id: string
  label: string
  /** Current value (raw number) */
  value: number
  /** Previous period value */
  previousValue: number
  /** Display unit: '%', '$', '/100k', 'index', etc. */
  unit: string
  /** Whether an increase is a positive outcome (wages ↑ = good, rent ↑ = bad) */
  positiveWhenUp: boolean
  /** Calculated: (value - previousValue) / previousValue * 100 */
  trendPercent: number
  trendDirection: TrendDirection
  status: CivicStatus
  /** One-line plain-English insight */
  insight: string
  /** Data source label */
  source: string
  /** 12 months of monthly values, oldest first */
  timeSeries: TimeSeriesPoint[]
}

// ─── Pillar (aggregates metrics) ──────────────────────────────────────────────

export interface CivicPillar {
  id: PillarId
  label: string
  /** Lucide icon name */
  icon: string
  /** Aggregate status (worst-of or weighted) */
  status: CivicStatus
  trendDirection: TrendDirection
  /** Net trend as aggregate %, e.g. +4.2 or -1.8 */
  trendPercent: number
  /** Composite score 0–100 (100 = perfect) */
  civicScore: number
  /** One-line headline, e.g. "Rent ↑ 8% 🔴" */
  headline: string
  /** Subtext for context */
  summary: string
  /** All sub-metrics for drill-down */
  metrics: CivicMetric[]
}

// ─── Politician Scorecard ──────────────────────────────────────────────────────

export interface PillarRating {
  pillarId: PillarId
  status: CivicStatus
  /** 0–100 */
  score: number
  /** Plain-English rationale */
  rationale: string
  /** Related bill/policy descriptions */
  keyActions: string[]
}

export interface PoliticianScorecard {
  mpId: string
  /** Overall civic score 0–100 */
  civicScore: number
  pillarRatings: PillarRating[]
  /** e.g. "Since Jan 2022" */
  tenure: string
  lastUpdated: string
}

// ─── Scoring Config (for Level 3 custom weighting) ────────────────────────────

export interface ScoringWeights {
  pillars: Record<PillarId, number>  // must sum to 1.0
  /** Per-pillar metric weights (metric id → weight, must sum to 1.0) */
  metrics: Record<string, Record<string, number>>
}

// ─── Insight (sidebar widgets) ────────────────────────────────────────────────

export type InsightType = 'biggest-improvement' | 'biggest-decline' | 'fastest-changing' | 'trending'

export interface CivicInsight {
  type: InsightType
  label: string
  metricId: string
  pillarId: PillarId
  trendPercent: number
  status: CivicStatus
}
