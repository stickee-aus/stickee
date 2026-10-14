'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Play } from 'lucide-react'
import { ScenarioSelector } from '@/components/simulator/ScenarioSelector'
import { AlternativesEditor } from '@/components/simulator/AlternativesEditor'
import { AgentSwarmAnimation } from '@/components/simulator/AgentSwarmAnimation'
import { OutcomeMatrix } from '@/components/simulator/OutcomeMatrix'
import { RecommendationCard } from '@/components/simulator/RecommendationCard'
import { RecentRehearsalsStrip } from '@/components/simulator/RecentRehearsalsStrip'
import { SCENARIOS, SCENARIO_INDEX } from '@/lib/mock-simulator-data'
import { runSimulation } from '@/lib/simulator-engine'
import {
  parseEntityRef,
  entityToScenario,
  saveRun,
  persistedRunFromResult,
  simulatorUrlFor,
} from '@/lib/simulator-bridge'
import { useElectorateStorage } from '@/hooks/useElectorateStorage'
import type { Alternative, Scenario, ScenarioDomain, SimulationResult } from '@/types/simulator'

export function SimulatorClient() {
  const searchParams = useSearchParams()
  const { electorate, loaded } = useElectorateStorage()

  // ── Hydrate state from ?entity=... or fall back to first preset ──────────
  const initial = useMemo(() => {
    const ref = parseEntityRef(new URLSearchParams(searchParams.toString()))
    if (ref) {
      const scenario = entityToScenario(ref)
      return { scenario, isEntity: true as const, ref }
    }
    const scenario = SCENARIOS[0]!
    return { scenario, isEntity: false as const, ref: null }
  }, [searchParams])

  const [scenario, setScenario] = useState<Scenario>(initial.scenario)
  const [domain, setDomain] = useState<ScenarioDomain | 'all'>('all')
  const [alternatives, setAlternatives] = useState<Alternative[]>(initial.scenario.defaultAlternatives)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [, startTransition] = useTransition()

  // ── If the URL param changes (in-app navigation), re-hydrate ─────────────
  useEffect(() => {
    const ref = parseEntityRef(new URLSearchParams(searchParams.toString()))
    if (ref) {
      const next = entityToScenario(ref)
      setScenario(next)
      setAlternatives(next.defaultAlternatives)
      setResult(null)
      setStatus('idle')
    }
  }, [searchParams])

  // ── Choose a preset scenario ───────────────────────────────────────────
  function handleSelectScenario(id: string) {
    const next = SCENARIO_INDEX[id]!
    setScenario(next)
    setAlternatives(next.defaultAlternatives)
    setResult(null)
    setStatus('idle')
  }

  function handleRun() {
    setStatus('running')
    setResult(null)
    window.setTimeout(() => {
      const r = runSimulation(scenario, alternatives, { seed: Date.now() })
      startTransition(() => {
        setResult(r)
        setStatus('done')
        // Persist to localStorage so the Recent Rehearsals strip picks it up.
        const url = initial.isEntity && initial.ref
          ? simulatorUrlFor(initial.ref)
          : '/simulator'
        saveRun(persistedRunFromResult(r, scenario, alternatives, url))
      })
    }, 1400)
  }

  const canRun = alternatives.length >= 2 && status !== 'running'

  const summary = useMemo(() => {
    if (!result) return null
    return result.outcomes.find(o => o.alternativeId === result.recommendedAlternativeId)
  }, [result])

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      {/* ── Page header ────────────────────────────────────────────── */}
      <div>
        <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
          Australia · Decision Simulator{initial.isEntity && initial.ref && (
            <> · {initial.ref.type}</>
          )}
        </p>
        <h1
          className="font-mono font-normal leading-none text-foreground"
          style={{ fontSize: 'clamp(36px, 7vw, 56px)', letterSpacing: '-0.02em' }}
        >
          {initial.isEntity ? scenario.title : 'Rehearse the future.'}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground leading-relaxed">
          {initial.isEntity
            ? 'You loaded this from elsewhere on Stickee. Tweak the alternatives below or hit Run to compare predicted outcomes across markets, civic pillars, leader approval and geopolitical risk.'
            : 'Inspired by MiroFish’s swarm-intelligence engine. Pick a real-world Australian event, define 2–4 alternative responses, and run a stylised multi-agent simulation across markets, civic pillars, leader approval and geopolitical risk — then pick the option best for the country.'}
        </p>
        {loaded && electorate && (
          <p className="mt-2 text-xs text-muted-foreground">
            Seat context: <span className="font-medium text-foreground">{electorate.electorate}</span>. Future versions can weight outcomes by your electorate’s demographics and your MP’s record.
          </p>
        )}
      </div>

      <RecentRehearsalsStrip />

      {/* ── Step 1: Scenario (only when not preloaded by entity) ────────── */}
      {!initial.isEntity && (
        <ScenarioSelector
          scenarios={SCENARIOS}
          selectedId={scenario.id}
          onSelect={handleSelectScenario}
          domainFilter={domain}
          onDomainChange={setDomain}
        />
      )}

      {/* ── Step 2: Alternatives ─────────────────────────────────────────── */}
      <AlternativesEditor
        alternatives={alternatives}
        onChange={setAlternatives}
        scenarioContext={scenario.context}
      />

      {/* ── Step 3: Run ──────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Step {initial.isEntity ? '2' : '3'} · Run the simulation
          </span>
          <button
            onClick={handleRun}
            disabled={!canRun}
            className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 bg-foreground text-background hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={11} />
            {status === 'running' ? 'Running…' : status === 'done' ? 'Re-run simulation' : 'Run simulation'}
          </button>
        </div>
        <AgentSwarmAnimation status={status} />
      </div>

      {/* ── Recommendation ────────────────────────────────────────── */}
      {result && (
        <>
          <RecommendationCard
            result={result}
            alternatives={alternatives}
            onRerun={handleRun}
          />
          <div>
            <div className="flex items-center justify-between py-3 border-b border-border mb-4">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
                Side-by-side outcomes
              </span>
              {summary && (
                <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#5a5a5e' }}>
                  Best: {alternatives.find(a => a.id === summary.alternativeId)?.label}
                </span>
              )}
            </div>
            <OutcomeMatrix
              alternatives={alternatives}
              outcomes={result.outcomes}
              recommendedId={result.recommendedAlternativeId}
            />
          </div>
        </>
      )}

      {!result && status === 'idle' && (
        <div
          className="rounded-xl border border-dashed p-6 text-center"
          style={{ borderColor: '#1e1e20' }}
        >
          <p className="text-sm text-muted-foreground">
            Hit <strong className="text-foreground">Run simulation</strong> to compare your alternatives across the
            five civic pillars, the ASX/AUD, leader approval, geopolitical risk and synthetic public sentiment.
          </p>
        </div>
      )}
    </div>
  )
}
