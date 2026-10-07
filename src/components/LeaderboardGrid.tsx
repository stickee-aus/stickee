"use client"

import { Trophy } from 'lucide-react'

// ─── Main component ───────────────────────────────────────────────────────────
//
// Real predictor rankings require enough resolved, wallet-backed predictions to
// compute genuine accuracy — that data doesn't exist yet. Rather than show the
// same fabricated array the rest of the app used to duplicate, this is an
// honest "not yet available" state until a real ranking can be computed.

export function LeaderboardGrid() {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-10 text-center space-y-3">
      <Trophy className="h-6 w-6 mx-auto text-muted-foreground/60" />
      <p className="text-sm font-medium text-foreground">Predictor rankings aren&apos;t available yet</p>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
        This leaderboard will show real accuracy, points and streaks once enough resolved predictions
        exist to compute genuine rankings. No demo or placeholder users are shown here.
      </p>
    </div>
  )
}
