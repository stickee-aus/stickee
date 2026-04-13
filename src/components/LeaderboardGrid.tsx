"use client"

import { useState, useMemo } from 'react'
import { leaderboard, type LeaderboardUser } from '@/lib/mock-market-data'
import { FollowButton } from '@/components/FollowButton'
import { ChevronUp, ChevronDown, Trophy, Flame, Target, Zap } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'rank' | 'accuracy' | 'points' | 'streak' | 'predictions'
type SortDir = 'asc' | 'desc'

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ initials, rank }: { initials: string; rank: number }) {
  const colors = [
    'from-yellow-400 to-orange-400',
    'from-slate-300 to-slate-400',
    'from-amber-600 to-amber-700',
    'from-blue-500 to-indigo-500',
    'from-purple-500 to-pink-500',
  ]
  const gradient = colors[Math.min(rank - 1, colors.length - 1)]
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-xs font-bold text-white shadow-sm`}>
      {initials}
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base" title="1st Place">🥇</span>
  if (rank === 2) return <span className="text-base" title="2nd Place">🥈</span>
  if (rank === 3) return <span className="text-base" title="3rd Place">🥉</span>
  return <span className="text-sm font-semibold text-muted-foreground tabular-nums">#{rank}</span>
}

function AccuracyBar({ value }: { value: number }) {
  const color = value >= 85 ? 'bg-emerald-500' : value >= 70 ? 'bg-blue-500' : value >= 55 ? 'bg-amber-400' : 'bg-muted-foreground'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-20 h-1 rounded-full bg-white/8 shrink-0">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-sm font-semibold tabular-nums">{value}%</span>
    </div>
  )
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak >= 20) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-semibold text-orange-400 ring-1 ring-orange-500/25">
      <Flame className="h-3 w-3" /> {streak}d
    </span>
  )
  if (streak >= 7) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-blue-500/25">
      <Zap className="h-3 w-3" /> {streak}d
    </span>
  )
  return <span className="text-sm text-muted-foreground tabular-nums">{streak}d</span>
}

function SortTh({
  col, label, icon: Icon, sortKey, sortDir, onSort, className = '',
}: {
  col: SortKey; label: string; icon?: React.ComponentType<{ className?: string }>
  sortKey: SortKey; sortDir: SortDir; onSort: (c: SortKey) => void; className?: string
}) {
  const active = col === sortKey
  return (
    <th
      className={`cursor-pointer select-none px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide transition-colors whitespace-nowrap ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'} ${className}`}
      onClick={() => onSort(col)}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSort(col)}
      tabIndex={0}
      role="columnheader"
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      scope="col"
    >
      <span className="inline-flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
        {active
          ? sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
          : <ChevronUp className="h-3.5 w-3.5 opacity-20" />}
      </span>
    </th>
  )
}

// ─── Stats cards ──────────────────────────────────────────────────────────────

function StatsCards() {
  const top = leaderboard[0]
  const avgAccuracy = Math.round(leaderboard.reduce((s, u) => s + u.accuracy, 0) / leaderboard.length)
  const totalPredictions = leaderboard.reduce((s, u) => s + u.predictions, 0)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { icon: Trophy, label: 'Top Predictor', value: top.name, sub: `${top.accuracy}% accuracy` },
        { icon: Target, label: 'Avg Accuracy', value: `${avgAccuracy}%`, sub: 'across all users' },
        { icon: Flame, label: 'Best Streak', value: `${top.streak} days`, sub: top.name },
        { icon: Zap, label: 'Total Picks', value: totalPredictions.toLocaleString(), sub: 'this month' },
      ].map(({ icon: Icon, label, value, sub }) => (
        <div key={label} className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 transition-all hover:border-primary/30">
          <div className="flex items-center gap-2 mb-1.5">
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
          </div>
          <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LeaderboardGrid() {
  const [sortKey, setSortKey] = useState<SortKey>('rank')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  function handleSort(col: SortKey) {
    if (col === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(col)
      setSortDir(col === 'rank' ? 'asc' : 'desc')
    }
  }

  const rows: LeaderboardUser[] = useMemo(() => {
    return [...leaderboard].sort((a, b) => {
      const av = a[sortKey] as number
      const bv = b[sortKey] as number
      const cmp = av - bv
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [sortKey, sortDir])

  return (
    <div className="space-y-8">
      <StatsCards />

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-white/3">
                <SortTh col="rank" label="Rank" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-16" />
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">User</th>
                <SortTh col="accuracy" label="Accuracy" icon={Target} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-36" />
                <SortTh col="points" label="Points" icon={Trophy} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                <SortTh col="streak" label="Streak" icon={Flame} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden sm:table-cell" />
                <SortTh col="predictions" label="Picks" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Badges</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map((user, i) => (
                <tr
                  key={user.id}
                  className={`group transition-colors ${
                    user.rank <= 3
                      ? 'bg-primary/5 hover:bg-primary/8'
                      : 'hover:bg-white/3'
                  }`}
                >
                  <td className="px-5 py-4 text-center">
                    <RankBadge rank={user.rank} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={user.initials} rank={user.rank} />
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.predictions} predictions</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <AccuracyBar value={user.accuracy} />
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="font-semibold tabular-nums text-foreground">
                      {user.points.toLocaleString()}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">pts</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <StreakBadge streak={user.streak} />
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-foreground tabular-nums">{user.predictions}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <div className="flex gap-0.5">
                      {user.badges.length > 0
                        ? user.badges.map((b, bi) => (
                            <span key={bi} className="text-base leading-none" title={b}>{b}</span>
                          ))
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <FollowButton userId={user.id} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
