/**
 * Simulator types — MiroFish-inspired multi-agent prediction sandbox.
 *
 * A user picks a Scenario (a real-world seed event) and defines 2–3
 * Alternatives (actions to compare). The engine spins up an Australian
 * synthetic population (AgentCohorts) and predicts a SimulationResult
 * for each Alternative, so the user can pick the best one for the country.
 */

import type { PillarId } from './civic'

// ─── Scenario domains ─────────────────────────────────────────────────────────

export type ScenarioDomain = 'markets' | 'issues' | 'leaders' | 'geopolitics'

export interface Scenario {
  id: string
  domain: ScenarioDomain
  /** Short label shown on the card e.g. "RBA holds cash rate" */
  title: string
  /** One-line plain-English summary */
  summary: string
  /** Long-form context shown in the detail pane */
  context: string
  /** Lucide icon name for the card */
  icon: string
  /** Suggested alternatives — user can edit / add */
  defaultAlternatives: Alternative[]
  /** Source label: "ABS, Mar 2025" etc */
  source: string
  /** ISO date the seed event was recorded */
  seededAt: string
}

// ─── Alternatives (the actions being compared) ───────────────────────────────

export interface Alternative {
  id: string
  /** "Cut rates 25bp" / "Hold" / "Hike 25bp" */
  label: string
  /** Plain-English description */
  description: string
  /** Stance bias used by the engine: -1 (dovish/relief) → +1 (hawkish/restrict) */
  bias: number
  /** Resource cost label: "$2.4B" or "Budget neutral" */
  costLabel: string
}

// ─── Synthetic population ────────────────────────────────────────────────────

export type State = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT'
export type IncomeBand = 'low' | 'middle' | 'high'
export type Lean = 'progressive' | 'centrist' | 'conservative'

export interface AgentCohort {
  id: string
  /** "Renters under 35, Inner-Sydney" */
  label: string
  /** Headcount (proxied population this cohort represents) */
  size: number
  state: State
  income: IncomeBand
  lean: Lean
  /** Pillars this cohort weights highest (drives sentiment math) */
  priorities: PillarId[]
}

// ─── Per-alternative simulation result ───────────────────────────────────────

export interface PillarImpact {
  pillarId: PillarId
  /** Delta to the pillar's civic score, e.g. +4.2 */
  scoreDelta: number
  /** One-line plain-English explanation */
  rationale: string
}

export interface MarketImpact {
  /** ASX 200 % move, e.g. +1.4 */
  asx200Pct: number
  /** AUD/USD bp move, e.g. -25 */
  audUsdBp: number
  /** Sectors that win/lose */
  winners: string[]
  losers: string[]
}

export interface LeaderImpact {
  /** Maps mpId → approval delta (percentage points) */
  approvalDeltaByMp: Record<string, number>
}

export interface SentimentBreakdown {
  /** % of synthetic population reacting positively */
  approvePct: number
  /** % reacting negatively */
  disapprovePct: number
  /** Top cohort objections, surfaced as quotes */
  topObjections: string[]
  /** Top cohort endorsements */
  topEndorsements: string[]
}

export interface AlternativeOutcome {
  alternativeId: string
  /** Aggregate score the engine assigns 0–100 (higher = better for the country) */
  countryScore: number
  /** Confidence band 0–100 (engine's epistemic certainty) */
  confidence: number
  /** Rationale shown in the recommendation card */
  headline: string
  pillarImpacts: PillarImpact[]
  marketImpact: MarketImpact
  leaderImpact: LeaderImpact
  /** Geopolitical risk index delta, -10 (calmer) → +10 (more tense) */
  geopoliticalRiskDelta: number
  sentiment: SentimentBreakdown
}

// ─── Full simulation result ──────────────────────────────────────────────────

export interface SimulationResult {
  scenarioId: string
  /** All alternatives that were simulated */
  outcomes: AlternativeOutcome[]
  /** id of the alternative the engine recommends */
  recommendedAlternativeId: string
  /** Rationale for the recommendation */
  recommendationRationale: string
  /** Number of synthetic agents the simulation ran across */
  populationSize: number
  /** ISO timestamp the run completed */
  ranAt: string
  /** Deterministic seed used (so the run is reproducible) */
  seed: number
}
