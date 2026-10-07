'use client'

import { useState, useEffect } from 'react'
import { BarChart2, Flame, TrendingUp, Target, ChevronRight, Star, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import Link from 'next/link'
import { useStreak } from '@/hooks/useStreak'
import { useWallet } from '@/hooks/useWallet'
import { useBadges } from '@/hooks/useBadges'
import { CIVIC_PILLARS } from '@/lib/mock-civic-data'
import { scoreToGrade, gradeTextColor } from '@/lib/civic-utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeeklyStats {
  /** Days the user was active this week (0–7) */
  activeDays: number
  /** Points earned this week */
  pointsEarned: number
  /** Predictions made this week */
  predictionsThisWeek: number
  /** Accuracy delta vs last week (percentage points, can be negative) */
  accuracyDelta: number
  /** Current civic score */
  civicScore: number
  /** Score delta vs last week */
  scoreDelta: number
  /** Top pillar by engagement */
  topPillar: string
  /** Percentile rank among all users (mocked) */
  percentileRank: number
  /** Badges earned this week */
  badgesEarnedCount: number
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const LAST_VIEWED_KEY = 'stickee:weekly-report-last-viewed'

function getLastViewedWeek(): string | null {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(LAST_VIEWED_KEY) } catch { return null }
}

function markViewed(weekKey: string) {
  try { localStorage.setItem(LAST_VIEWED_KEY, weekKey) } catch { /* ignore */ }
}

function getCurrentWeekKey(): string {
  const d = new Date()
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${week}`
}

// ─── Delta indicator ──────────────────────────────────────────────────────────

function DeltaChip({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (value === 0) return (
    <span className="inline-flex items-center gap-0.5 font-mono text-[9px]" style={{ color: '#5a5a5e' }}>
      <Minus size={8} /> same
    </span>
  )
  const positive = value > 0
  return (
    <span
      className="inline-flex items-center gap-0.5 font-mono text-[9px]"
      style={{ color: positive ? '#2ec266' : '#f04747' }}
    >
      {positive ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
      {positive ? '+' : ''}{value}{suffix}
    </span>
  )
}

// ─── Active-days pip row ──────────────────────────────────────────────────────

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

function ActiveDayPips({ activeDays }: { activeDays: number }) {
  return (
    <div className="flex items-center gap-1">
      {DAY_LABELS.map((label, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <div
            className="h-4 w-4 rounded-sm flex items-center justify-center"
            style={{
              background: i < activeDays ? '#f5a623' : '#1e1e20',
              border: `1px solid ${i < activeDays ? '#f5a62360' : '#2a2a2e'}`,
            }}
          >
            {i < activeDays && (
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: '#0a0a0b' }} />
            )}
          </div>
          <span className="font-mono text-[7px]" style={{ color: '#3a3a3e' }}>{label}</span>
        </div>
      ))}
      <span className="font-mono text-[10px] ml-1" style={{ color: '#f5a623' }}>
        {activeDays}/7
      </span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface WeeklyReportCardProps {
  civicScore?: number
  onView?: () => void
  /** If true, always show (don't auto-dismiss after viewing) */
  alwaysShow?: boolean
}

export function WeeklyReportCard({ civicScore = 62, onView }: WeeklyReportCardProps) {
  const { streak } = useStreak()
  const { totalEarned, positions, hydrated } = useWallet()
  const { earnedDefs } = useBadges()

  const [expanded, setExpanded] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [weekKey] = useState(getCurrentWeekKey)

  useEffect(() => {
    if (!hydrated) return
    const last = getLastViewedWeek()
    setIsNew(last !== weekKey)
  }, [hydrated, weekKey])

  function handleExpand() {
    setExpanded(e => !e)
    if (!expanded) {
      markViewed(weekKey)
      setIsNew(false)
      onView?.()
    }
  }

  if (!hydrated) return null

  // Derive stats (mix of real and mocked data for demo)
  const activeDays = Math.min(7, streak.count > 0 ? Math.min(streak.count, 7) : 2)
  const thisWeekPts = Math.max(0, Math.round(totalEarned * 0.15)) + activeDays * 100
  const openPredictions = positions.filter(p => p.status === 'open').length
  const topPillar = CIVIC_PILLARS[Math.floor(Math.random() * CIVIC_PILLARS.length)]?.label ?? 'Housing'
  const percentile = Math.max(5, 100 - (streak.count * 3 + openPredictions * 5 + earnedDefs.length * 2))
  const grade = scoreToGrade(civicScore)
  const gradeColor = gradeTextColor(grade)

  const stats: WeeklyStats = {
    activeDays,
    pointsEarned: thisWeekPts,
    predictionsThisWeek: openPredictions,
    accuracyDelta: +4,
    civicScore,
    scoreDelta: +2,
    topPillar,
    percentileRank: percentile,
    badgesEarnedCount: earnedDefs.filter(b => {
      const e = earnedDefs.find(x => x.id === b.id)
      return e // all recently earned counted for demo
    }).length,
  }

  return (
    <div
      className="border border-border overflow-hidden"
      style={{ background: '#0e0e10' }}
    >
      {/* ── Header row ── */}
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-3 p-4 hover:bg-card/30 transition-colors text-left"
      >
        <div
          className="h-8 w-8 flex items-center justify-center shrink-0"
          style={{ background: '#0e1a0e', border: '1px solid #2ec26630' }}
        >
          <BarChart2 className="h-4 w-4" style={{ color: '#2ec266' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs text-foreground">Weekly Civic Report</p>
            {isNew && (
              <span
                className="font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm"
                style={{ background: '#2ec26620', color: '#2ec266', border: '1px solid #2ec26640' }}
              >
                New
              </span>
            )}
          </div>
          <p className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>
            {activeDays}/7 active days · {thisWeekPts.toLocaleString()} pts earned
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`font-mono text-sm font-bold ${gradeColor}`}>{grade}</span>
          <ChevronRight
            className="h-4 w-4 transition-transform duration-200"
            style={{
              color: '#3a3a3e',
              transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          />
        </div>
      </button>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-5">

          {/* Active days */}
          <div className="space-y-2">
            <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
              Days Active This Week
            </p>
            <ActiveDayPips activeDays={stats.activeDays} />
          </div>

          {/* Key stats grid */}
          <div className="grid grid-cols-2 gap-3">

            <div className="space-y-0.5 border border-border p-3" style={{ background: '#0a0a0b' }}>
              <div className="flex items-center gap-1.5">
                <Flame className="h-3 w-3" style={{ color: '#f5a623' }} />
                <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#3a3a3e' }}>
                  Streak
                </p>
              </div>
              <p className="font-mono text-lg" style={{ color: '#f5a623' }}>{streak.count}d</p>
              <DeltaChip value={stats.activeDays > 4 ? +1 : 0} suffix="d" />
            </div>

            <div className="space-y-0.5 border border-border p-3" style={{ background: '#0a0a0b' }}>
              <div className="flex items-center gap-1.5">
                <Star className="h-3 w-3" style={{ color: '#f5a623' }} />
                <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#3a3a3e' }}>
                  Points
                </p>
              </div>
              <p className="font-mono text-lg text-foreground">{stats.pointsEarned.toLocaleString()}</p>
              <DeltaChip value={+stats.pointsEarned} suffix="pts" />
            </div>

            <div className="space-y-0.5 border border-border p-3" style={{ background: '#0a0a0b' }}>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" style={{ color: '#3b82f6' }} />
                <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#3a3a3e' }}>
                  Predictions
                </p>
              </div>
              <p className="font-mono text-lg" style={{ color: '#3b82f6' }}>{stats.predictionsThisWeek}</p>
              <DeltaChip value={stats.accuracyDelta} suffix="% accuracy" />
            </div>

            <div className="space-y-0.5 border border-border p-3" style={{ background: '#0a0a0b' }}>
              <div className="flex items-center gap-1.5">
                <Target className="h-3 w-3" style={{ color: '#2ec266' }} />
                <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#3a3a3e' }}>
                  Civic Score
                </p>
              </div>
              <p className={`font-mono text-lg ${gradeColor}`}>{stats.civicScore}</p>
              <DeltaChip value={stats.scoreDelta} />
            </div>
          </div>

          {/* Percentile callout */}
          <div
            className="flex items-center justify-between p-3 border"
            style={{ background: '#0a1a10', borderColor: '#2ec26630' }}
          >
            <div>
              <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#2ec266' }}>
                Your rank this week
              </p>
              <p className="font-mono text-xs text-foreground mt-0.5">
                Top <span style={{ color: '#2ec266' }}>{stats.percentileRank}%</span> of users in{' '}
                <span style={{ color: '#2ec266' }}>NSW</span>
              </p>
            </div>
            <div className="font-mono text-xs" style={{ color: '#3a3a3e' }}>
              🏆
            </div>
          </div>

          {/* Top focus area */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
                Top Focus Area
              </p>
              <p className="font-mono text-xs text-foreground mt-0.5">{stats.topPillar}</p>
            </div>
            <Link
              href="/issues"
              className="font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 border border-border hover:bg-card/50 transition-colors"
              style={{ color: '#3a3a3e' }}
            >
              Explore →
            </Link>
          </div>

          {/* Next week nudge */}
          <div
            className="p-3 border font-mono text-[10px] leading-relaxed"
            style={{ background: '#0a0a0b', borderColor: '#2a2a2e', color: '#5a5a5e' }}
          >
            <span style={{ color: '#f5a623' }}>This week:</span> Check in daily to maintain your streak and push your score toward{' '}
            <span style={{ color: '#2ec266' }}>grade {grade === 'D' ? 'C' : grade === 'C' ? 'B' : grade === 'B' ? 'A' : 'A'}</span>.
            {stats.predictionsThisWeek < 3 && ' Make 3 more predictions to boost your accuracy score.'}
          </div>
        </div>
      )}
    </div>
  )
}
