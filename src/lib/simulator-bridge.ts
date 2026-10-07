/**
 * simulator-bridge.ts
 *
 * Connective tissue between the Simulator and the rest of the app.
 *
 * - `entityToScenario` converts any first-class Stickee entity (issue, bill,
 *   decision, leader, campaign, market) into a `Scenario` the Simulator can
 *   load. The encoding is symmetric with `parseEntityRef`, so a URL like
 *   `/simulator?entity=leader:mp-bandt` round-trips into a working scenario.
 *
 * - `entityToAlternatives` produces entity-aware default alternatives so the
 *   "Simulate this" CTA always opens with sensible options (Bills get
 *   Pass / Amend / Fail; Leaders get Their stance / Opposition / Compromise;
 *   etc.).
 *
 * - `useRecentRuns` is a tiny localStorage-backed hook for surfacing recent
 *   simulations on the home page and entity surfaces.
 */

'use client'

import { useEffect, useState } from 'react'
import type { Scenario, Alternative, ScenarioDomain, SimulationResult } from '@/types/simulator'

// ─── Entity references ───────────────────────────────────────────────────────

export type EntityType =
  | 'issue'
  | 'bill'
  | 'decision'
  | 'leader'
  | 'campaign'
  | 'market'

export interface EntityRef {
  type: EntityType
  id: string
  /** Display title — passed in the URL so the Simulator never needs to refetch */
  title: string
  /** Plain summary */
  summary?: string
  /** Optional pillar tag (one of PillarId from /types/civic) */
  pillarId?: string
}

const DOMAIN_BY_TYPE: Record<EntityType, ScenarioDomain> = {
  issue: 'issues',
  bill: 'issues',
  decision: 'issues',
  leader: 'leaders',
  campaign: 'issues',
  market: 'markets',
}

const ICON_BY_TYPE: Record<EntityType, string> = {
  issue: 'Home',
  bill: 'BarChart3',
  decision: 'BarChart3',
  leader: 'Users',
  campaign: 'Zap',
  market: 'BarChart3',
}

// ─── URL encoding ────────────────────────────────────────────────────────────

export function encodeEntityRef(ref: EntityRef): string {
  const params = new URLSearchParams({
    entity: `${ref.type}:${ref.id}`,
    title: ref.title,
  })
  if (ref.summary) params.set('summary', ref.summary.slice(0, 280))
  if (ref.pillarId) params.set('pillar', ref.pillarId)
  return params.toString()
}

export function parseEntityRef(searchParams: URLSearchParams): EntityRef | null {
  const entity = searchParams.get('entity')
  if (!entity) return null
  const [type, id] = entity.split(':')
  if (!type || !id) return null
  if (!isEntityType(type)) return null
  return {
    type,
    id,
    title: searchParams.get('title') ?? `${type} ${id}`,
    summary: searchParams.get('summary') ?? undefined,
    pillarId: searchParams.get('pillar') ?? undefined,
  }
}

function isEntityType(t: string): t is EntityType {
  return ['issue', 'bill', 'decision', 'leader', 'campaign', 'market'].includes(t)
}

// ─── Build the simulator URL from any entity ─────────────────────────────────

export function simulatorUrlFor(ref: EntityRef): string {
  return `/simulator?${encodeEntityRef(ref)}`
}

// ─── Entity → Scenario ───────────────────────────────────────────────────────

export function entityToScenario(ref: EntityRef): Scenario {
  return {
    id: `entity:${ref.type}:${ref.id}`,
    domain: DOMAIN_BY_TYPE[ref.type],
    title: ref.title,
    summary: ref.summary ?? `Rehearse the decision around "${ref.title}".`,
    context:
      ref.summary ??
      `This is a ${ref.type} pulled into the Simulator. Edit the alternatives below to compare possible responses, or hit Run.`,
    icon: ICON_BY_TYPE[ref.type],
    source: `${ref.type[0]!.toUpperCase()}${ref.type.slice(1)} · Stickee`,
    seededAt: new Date().toISOString().slice(0, 10),
    defaultAlternatives: entityToAlternatives(ref),
  }
}

// ─── Entity → Alternatives ───────────────────────────────────────────────────

export function entityToAlternatives(ref: EntityRef): Alternative[] {
  switch (ref.type) {
    case 'bill':
      return [
        alt('bill-pass',  'Pass as drafted', `Pass "${trim(ref.title)}" in its current form.`,                +0.6, 'Per RIS estimate'),
        alt('bill-amend', 'Amend then pass', `Pass with cross-bench amendments to soften the most contested provisions.`, 0,  'Per RIS estimate'),
        alt('bill-fail',  'Block / send back', `Defeat the bill or send it back for redrafting.`,             -0.6, 'No new spend'),
      ]
    case 'decision':
      return [
        alt('dec-stay',     'Status quo',     `Don’t intervene further on "${trim(ref.title)}".`,                       -0.4, 'No new spend'),
        alt('dec-go',       'Go ahead',       `Implement as proposed.`,                                                       +0.2, 'As proposed'),
        alt('dec-bigger',   'Go further',     `Expand the scope or lift funding meaningfully above the current proposal.`,    +0.8, 'Higher cost'),
      ]
    case 'leader':
      return [
        alt('leader-stance',   'Their stated stance', `Adopt the public position ${trim(ref.title)} has championed.`,   0,    'Per their platform'),
        alt('leader-opposite', 'Opposition’s stance', `Adopt the position the main opposition has put on the record.`,  +0.6, 'Opposing platform'),
        alt('leader-compromise','Compromise package',  `A negotiated middle ground that pulls from both platforms.`,         +0.2, 'Compromise cost'),
      ]
    case 'campaign':
      return [
        alt('camp-meet',   'Meet the campaign’s ask', `Implement the full campaign demand around "${trim(ref.title)}".`, +0.7, 'Per campaign brief'),
        alt('camp-half',   'Half-measures',                 `Adopt a partial response that addresses the most urgent symptom.`, 0,   'Half cost'),
        alt('camp-none',   'No action',                     `Acknowledge but take no policy step.`,                            -0.6, 'No new spend'),
      ]
    case 'market':
      return [
        alt('mkt-yes',   'Resolve YES',  `The underlying event happens as the market’s "yes" side predicts.`,    +0.3, 'Market neutral'),
        alt('mkt-no',    'Resolve NO',   `The "no" side wins.`,                                                       -0.3, 'Market neutral'),
        alt('mkt-hedge', 'Hedge action', `Government takes an action that materially de-risks both sides.`,            0,   'Variable'),
      ]
    case 'issue':
    default:
      return [
        alt('issue-status',   'Status quo',         `Don’t change current policy on "${trim(ref.title)}".`,                  -0.4, 'No new spend'),
        alt('issue-targeted', 'Targeted response',  `Modest, well-targeted policy response.`,                                      0,    'Moderate'),
        alt('issue-bold',     'Bold reform',        `Step-change reform package on this issue.`,                                  +0.8, 'High cost'),
      ]
  }
}

function alt(id: string, label: string, description: string, bias: number, costLabel: string): Alternative {
  return { id, label, description, bias, costLabel }
}

function trim(s: string, n = 60): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

// ─── Recent runs (localStorage) ──────────────────────────────────────────────

const STORAGE_KEY = 'stickee:simulator:recent-runs'
const MAX_RUNS = 8

export interface PersistedRun {
  /** Stable key — `${scenarioId}:${seed}` */
  key: string
  scenarioId: string
  scenarioTitle: string
  domain: ScenarioDomain
  /** Display label for the recommended alternative */
  recommendedLabel: string
  countryScore: number
  confidence: number
  ranAt: string
  /** Re-open URL: /simulator?entity=... if it was an entity, otherwise /simulator */
  url: string
}

function readStorage(): PersistedRun[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PersistedRun[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStorage(runs: PersistedRun[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runs.slice(0, MAX_RUNS)))
    window.dispatchEvent(new CustomEvent('stickee:recent-runs-changed'))
  } catch {
    // Quota errors etc — silent.
  }
}

export function saveRun(run: PersistedRun): void {
  const existing = readStorage().filter(r => r.key !== run.key)
  writeStorage([run, ...existing])
}

export function clearRuns(): void {
  writeStorage([])
}

export function persistedRunFromResult(
  result: SimulationResult,
  scenario: Scenario,
  alternatives: Alternative[],
  url: string,
): PersistedRun {
  const winner = result.outcomes.find(o => o.alternativeId === result.recommendedAlternativeId)
  const winningAlt = alternatives.find(a => a.id === result.recommendedAlternativeId)
  return {
    key: `${result.scenarioId}:${result.seed}`,
    scenarioId: result.scenarioId,
    scenarioTitle: scenario.title,
    domain: scenario.domain,
    recommendedLabel: winningAlt?.label ?? '—',
    countryScore: winner?.countryScore ?? 0,
    confidence: winner?.confidence ?? 0,
    ranAt: result.ranAt,
    url,
  }
}

export function useRecentRuns(): PersistedRun[] {
  const [runs, setRuns] = useState<PersistedRun[]>([])

  useEffect(() => {
    setRuns(readStorage())
    function refresh() {
      setRuns(readStorage())
    }
    window.addEventListener('storage', refresh)
    window.addEventListener('stickee:recent-runs-changed', refresh as EventListener)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('stickee:recent-runs-changed', refresh as EventListener)
    }
  }, [])

  return runs
}
