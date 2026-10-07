'use client'

import { getElectionPartyColor } from '@/lib/aec-election'
import type { ElectionSenateState } from '@/lib/aec-election-types'
import type { SenateStateInfo } from '@/lib/au-senate-states'

interface SenateStateDetailPanelProps {
  state: SenateStateInfo
  /** Real AEC live-count data for this state, only ever passed when a count is genuinely active. */
  liveElectionState: ElectionSenateState | null
}

// Selecting a state must never show anything that could be read as that
// state's senator list or party composition — no real source in this
// codebase maps individual senators to a state (see
// GOVERNMENT_V1_MAP_REPORT.md). Only the constitutional senator count and an
// honest "not yet available" notice are shown here. Overall Senate
// composition is a separate, explicitly national section elsewhere on the
// page — never rendered inside this panel.
export function SenateStateDetailPanel({ state, liveElectionState }: SenateStateDetailPanelProps) {
  return (
    <div
      role="region"
      aria-live="polite"
      aria-label={`${state.name} detail`}
      className="border border-border p-5 mt-4"
    >
      <p className="text-micro-label mb-1">{state.isTerritory ? 'Territory' : 'State'}</p>
      <h3 className="font-heading text-xl font-semibold text-foreground mb-1">{state.name}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {state.name} is represented by <strong className="text-foreground">{state.senatorCount} senators</strong>.
      </p>

      <div className="border border-border bg-muted/20 p-3 text-xs text-muted-foreground leading-relaxed">
        Stickee does not yet have a verified senator-to-state dataset, so individual {state.name} senator
        records are not available here yet.
      </div>

      {/* Live AEC election count — only when a count is genuinely active for this state.
          This is an election count, never presented as a parliamentary vote. */}
      {liveElectionState && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-micro-label mb-2">Live Senate election count — {state.name}</p>
          {liveElectionState.topGroups.length === 0 ? (
            <p className="text-xs text-muted-foreground">No live count data available yet for this state.</p>
          ) : (
            <ul className="space-y-1.5">
              {liveElectionState.topGroups.map(group => (
                <li key={group.party} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 border"
                    style={{ backgroundColor: getElectionPartyColor(group.party), borderColor: getElectionPartyColor(group.party) }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-foreground">{group.partyShort || group.party}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {group.pct !== null ? `${group.pct}%` : group.votes.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground/70 mt-2">
            {liveElectionState.reportingProgressPct !== null
              ? `${liveElectionState.reportingProgressPct}% counted · `
              : ''}
            Source: AEC
          </p>
        </div>
      )}
    </div>
  )
}
