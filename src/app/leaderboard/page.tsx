import { LeaderboardGrid } from '@/components/LeaderboardGrid'

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-6">

      {/* ── Header ── */}
      <div className="py-10 border-b border-border">
        <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
          Forecasts · Leaderboard
        </p>
        <h1 className="font-mono font-normal leading-tight text-foreground text-2xl">
          Predictor rankings
        </h1>
        <p className="font-mono text-xs text-muted-foreground mt-2">
          Real rankings, computed from resolved predictions — not shown until that data exists.
        </p>
      </div>

      {/* ── Grid ── */}
      <div className="py-8">
        <LeaderboardGrid />
      </div>
    </div>
  )
}
