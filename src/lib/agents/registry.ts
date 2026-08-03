import 'server-only'
import { runWithTracking, type AgentHandler, type AgentTrigger } from './runner'
import { parliamentWatcher }      from './parliament-watcher'
import { billStageTracker }       from './bill-stage-tracker'
import { mpScorecard }            from './mp-scorecard'
import { electoratePulse }        from './electorate-pulse'
import { predictionResolver }     from './prediction-resolver'
import { moderationTriage }       from './moderation-triage'
import { dailyBonusDistributor }  from './daily-bonus'

export const AGENT_IDS = [
  'parliament-watcher',
  'bill-stage-tracker',
  'mp-scorecard',
  'electorate-pulse',
  'prediction-resolver',
  'moderation-triage',
  'daily-bonus',
] as const

export type AgentSlug = (typeof AGENT_IDS)[number]

const HANDLERS: Record<AgentSlug, AgentHandler> = {
  'parliament-watcher':  parliamentWatcher,
  'bill-stage-tracker':  billStageTracker,
  'mp-scorecard':        mpScorecard,
  'electorate-pulse':    electoratePulse,
  'prediction-resolver': predictionResolver,
  'moderation-triage':   moderationTriage,
  'daily-bonus':         dailyBonusDistributor,
}

export function isAgentSlug(value: string): value is AgentSlug {
  return (AGENT_IDS as readonly string[]).includes(value)
}

export async function runAgent(slug: AgentSlug, opts: { trigger?: AgentTrigger } = {}) {
  const handler = HANDLERS[slug]
  if (!handler) throw new Error(`Unknown agent: ${slug}`)
  return runWithTracking(slug, handler, opts)
}
