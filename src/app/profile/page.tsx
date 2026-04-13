'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, TrendingUp, CheckCircle2, MessageSquare, ArrowRight, LogIn, Flame, Snowflake, Share2, Mail, Trophy, Award } from 'lucide-react'
import { StreakBadge } from '@/components/StreakBadge'
import { StreakMilestone } from '@/components/StreakMilestone'
import { PillarGradeChip } from '@/components/PillarGradeChip'
import { FeedPost } from '@/components/FeedPost'
import { BadgeGrid, BadgeStrip, BadgeToastWatcher } from '@/components/BadgeDisplay'
import { WeeklyReportCard } from '@/components/WeeklyReportCard'
import { CIVIC_PILLARS } from '@/lib/mock-civic-data'
import { DECISIONS, DECISION_MAKER_INDEX } from '@/lib/mock-government-data'
import { FEED_POSTS, type FeedReaction } from '@/lib/mock-feed-data'
import { scoreToGrade, gradeTextColor } from '@/lib/civic-utils'
import { useStreak, FREEZE_COST_PTS } from '@/hooks/useStreak'
import { useWallet } from '@/hooks/useWallet'
import { useBadges } from '@/hooks/useBadges'
import { useToast } from '@/components/ui/toast'

// ─── Mocked user state ────────────────────────────────────────────────────────

const DEMO_USER = {
  name: 'Demo User',
  handle: '@demouser',
  civicScore: 62,
  isLoggedIn: true,
}

// Score breakdown (mock — in production derived from real actions)
const SCORE_BREAKDOWN = [
  { label: 'Prediction accuracy',  pct: 72, weight: 0.40, color: '#3b82f6',  trend: '+4% this week' },
  { label: 'Actions taken',        pct: 55, weight: 0.35, color: '#2ec266',  trend: '2 emails sent' },
  { label: 'Community engagement', pct: 48, weight: 0.25, color: '#f5a623',  trend: '↑ 12 reactions' },
]

type TabId = 'activity' | 'predictions' | 'positions' | 'score' | 'badges'

const ACTIVITY_POSTS = FEED_POSTS.filter(p => p.type === 'user_post').slice(0, 3)
const PREDICTION_DECISIONS = DECISIONS.filter(d => d.predictionQuestion).slice(0, 4)
const USER_PICKS: Record<string, 'yes' | 'no'> = {
  [PREDICTION_DECISIONS[0]?.id]: 'yes',
  [PREDICTION_DECISIONS[1]?.id]: 'no',
  [PREDICTION_DECISIONS[2]?.id]: 'yes',
}

// ─── Logged-out view ──────────────────────────────────────────────────────────

function LoggedOutView() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <User className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Your civic identity.</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Track your impact, earn a civic score, and build your reputation as a voice for change.
        </p>
      </div>
      <ul className="space-y-2 text-sm text-left max-w-xs w-full">
        {[
          'See your personalised civic score (A–F)',
          'Track your prediction accuracy over time',
          'Build a streak by taking daily actions',
          'Get boosted in the Feed when your impact grows',
          'Contact your MP with one tap',
        ].map(item => (
          <li key={item} className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/auth/sign-in"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <LogIn className="h-4 w-4" /> Sign in with email
      </Link>
    </div>
  )
}

// ─── Score breakdown tab ──────────────────────────────────────────────────────

function ScoreTab({ civicScore }: { civicScore: number }) {
  const grade = scoreToGrade(civicScore)
  const nextGradeScore = grade === 'D' ? 40 : grade === 'C' ? 60 : grade === 'B' ? 80 : 95
  const daysToNext = Math.ceil((nextGradeScore - civicScore) / 0.4) // rough estimate

  return (
    <div className="space-y-5">
      <p className="font-mono text-xs text-muted-foreground">
        Your civic score is built from three components. Improve each to level up your grade.
      </p>

      {/* Component breakdown */}
      <div className="space-y-4">
        {SCORE_BREAKDOWN.map(s => {
          const contribution = Math.round(s.pct * s.weight)
          return (
            <div key={s.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  <span className="font-mono text-xs text-foreground">{s.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px]" style={{ color: '#3a3a3e' }}>
                    {Math.round(s.weight * 100)}% weight
                  </span>
                  <span className="font-mono text-xs font-medium" style={{ color: s.color }}>
                    +{contribution}pts
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full" style={{ background: '#1e1e20' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${s.pct}%`, background: s.color }}
                />
              </div>
              <p className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>{s.trend}</p>
            </div>
          )
        })}
      </div>

      {/* Path to next grade */}
      <div className="border border-border p-4 space-y-2" style={{ background: '#0e0e10' }}>
        <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
          Path to grade {grade === 'D' ? 'C' : grade === 'C' ? 'B' : grade === 'B' ? 'A' : 'A+'}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="font-mono text-sm" style={{ color: '#3b82f6' }}>
              {Math.max(0, 75 - Math.round(SCORE_BREAKDOWN[0].pct))}%
            </p>
            <p className="font-mono text-[9px] text-muted-foreground">accuracy needed</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-sm" style={{ color: '#2ec266' }}>3</p>
            <p className="font-mono text-[9px] text-muted-foreground">more actions</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-sm" style={{ color: '#f5a623' }}>~{daysToNext}d</p>
            <p className="font-mono text-[9px] text-muted-foreground">at current pace</p>
          </div>
        </div>
      </div>

      {/* Quick actions to boost score */}
      <div className="space-y-2">
        <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
          Boost your score now
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/predictions"
            className="flex items-center gap-2 border border-border p-3 hover:bg-card/50 transition-colors"
          >
            <TrendingUp className="h-4 w-4 shrink-0" style={{ color: '#3b82f6' }} />
            <div>
              <p className="font-mono text-xs text-foreground">Make prediction</p>
              <p className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>+accuracy</p>
            </div>
          </Link>
          <Link
            href="/issues"
            className="flex items-center gap-2 border border-border p-3 hover:bg-card/50 transition-colors"
          >
            <Mail className="h-4 w-4 shrink-0" style={{ color: '#2ec266' }} />
            <div>
              <p className="font-mono text-xs text-foreground">Email MP</p>
              <p className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>+actions</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Activity tab ─────────────────────────────────────────────────────────────

function ActivityTab() {
  const [reactions, setReactions] = useState<Record<string, Partial<Record<FeedReaction, boolean>>>>({})
  function handleReact(postId: string, reaction: FeedReaction) {
    setReactions(prev => ({
      ...prev,
      [postId]: { ...(prev[postId] ?? {}), [reaction]: !(prev[postId]?.[reaction]) },
    }))
  }
  return (
    <div className="space-y-3">
      {ACTIVITY_POSTS.map(post => (
        <FeedPost key={post.id} post={post} onReact={handleReact} userReactions={reactions[post.id] ?? {}} />
      ))}
      <Link href="/feed" className="flex items-center justify-center gap-2 rounded-xl border border-border/50 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
        See full Feed <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

// ─── Predictions tab ──────────────────────────────────────────────────────────

function PredictionsTab() {
  return (
    <div className="space-y-2">
      <p className="font-mono text-xs text-muted-foreground pb-1">
        Your picks vs crowd probability. Accuracy builds your civic score.
      </p>
      {PREDICTION_DECISIONS.map(decision => {
        const pick = USER_PICKS[decision.id]
        const crowdPct = Math.round(40 + Math.random() * 40)
        return (
          <div key={decision.id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/80 p-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{decision.title}</p>
              <p className="text-xs text-muted-foreground truncate">{decision.predictionQuestion}</p>
            </div>
            <div className="shrink-0 text-right space-y-0.5">
              <div className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${pick === 'yes' ? 'bg-emerald-500/15 text-emerald-400' : pick === 'no' ? 'bg-red-500/15 text-red-400' : 'bg-muted text-muted-foreground'}`}>
                {pick ? pick.toUpperCase() : '—'}
              </div>
              <p className="text-[10px] text-muted-foreground">{crowdPct}% crowd yes</p>
            </div>
          </div>
        )
      })}
      <Link href="/predictions" className="flex items-center justify-center gap-2 rounded-xl border border-border/50 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
        See all markets <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

// ─── Positions tab ────────────────────────────────────────────────────────────

function PositionsTab() {
  return (
    <div className="space-y-4">
      <p className="font-mono text-xs text-muted-foreground">Issues you&apos;ve engaged with.</p>
      <div className="grid grid-cols-5 gap-2">
        {CIVIC_PILLARS.map(pillar => (
          <Link key={pillar.id} href={`/issues`}>
            <PillarGradeChip pillar={pillar} />
          </Link>
        ))}
      </div>
      <div className="rounded-xl border border-border/50 bg-card/80 p-4 text-center">
        <p className="text-xs text-muted-foreground mb-2">Take more actions to see your personal impact breakdown here.</p>
        <Link href="/issues" className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
          Explore Issues <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ─── Streak section ────────────────────────────────────────────────────────────

function StreakSection() {
  const { streak, recordAction, buyFreeze, clearMilestone } = useStreak()
  const { balance, deductPoints, addPoints, hydrated } = useWallet()
  const { toast } = useToast()

  function handleBuyFreeze() {
    const ok = buyFreeze(() => deductPoints(FREEZE_COST_PTS))
    if (ok) {
      toast(`Streak freeze purchased! You now have ${streak.freezesAvailable + 1} freeze${streak.freezesAvailable + 1 !== 1 ? 's' : ''}.`, 'success')
    } else {
      toast(`Not enough points. You need ${FREEZE_COST_PTS.toLocaleString()} pts.`, 'info')
    }
  }

  function handleRecordAction() {
    const { newCount, isMilestone } = recordAction()
    if (newCount > 0 && isMilestone) {
      // Award milestone bonus points
      const BONUSES: Record<number, number> = { 7: 250, 30: 1000, 100: 5000 }
      const bonus = BONUSES[newCount] ?? 0
      if (bonus > 0) addPoints(bonus)
    }
  }

  return (
    <div className="border border-border p-4 space-y-3" style={{ background: '#0e0e10' }}>
      {/* Milestone celebration */}
      {streak.milestoneReached && (
        <StreakMilestone count={streak.milestoneReached} onDismiss={clearMilestone} />
      )}

      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
          Daily Streak
        </p>
        <p className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>
          Best: {streak.longestStreak}d
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 flex items-center justify-center shrink-0"
          style={{ background: '#1e1800', border: '1px solid #f5a62330' }}
        >
          <Flame className="h-5 w-5" style={{ color: streak.count > 0 ? '#f5a623' : '#2a2a2e' }} />
        </div>
        <div className="flex-1">
          <p className="font-mono text-xl font-normal" style={{ color: streak.count > 0 ? '#f5a623' : '#3a3a3e' }}>
            {streak.count}
            <span className="font-mono text-xs ml-1" style={{ color: '#3a3a3e' }}>days</span>
          </p>
          <p className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>
            {streak.isActiveToday ? '✓ Active today' : '⚠ No action yet today'}
          </p>
        </div>
        {!streak.isActiveToday && (
          <button
            onClick={handleRecordAction}
            className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all"
            style={{ background: '#f5a623', color: '#0a0a0b' }}
          >
            Check in
          </button>
        )}
      </div>

      {/* Milestone progress */}
      <div className="space-y-1">
        <p className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>Milestones</p>
        <div className="flex items-center gap-3">
          {[7, 30, 100].map(m => (
            <div key={m} className="flex items-center gap-1">
              <div
                className="h-2 w-2 rounded-full"
                style={{ background: streak.count >= m ? '#f5a623' : '#2a2a2e' }}
              />
              <span className="font-mono text-[9px]" style={{ color: streak.count >= m ? '#f5a623' : '#3a3a3e' }}>
                {m}d
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Freeze mechanic */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <Snowflake className="h-3.5 w-3.5" style={{ color: streak.freezesAvailable > 0 ? '#3b82f6' : '#2a2a2e' }} />
          <span className="font-mono text-[10px]" style={{ color: '#3a3a3e' }}>
            {streak.freezesAvailable} freeze{streak.freezesAvailable !== 1 ? 's' : ''} available
          </span>
        </div>
        {hydrated && (
          <button
            onClick={handleBuyFreeze}
            className="font-mono text-[9px] tracking-widest uppercase px-2 py-1 border transition-colors hover:bg-card/50"
            style={{ borderColor: '#1e1e20', color: '#3a3a3e' }}
            title={`Buy a streak freeze for ${FREEZE_COST_PTS.toLocaleString()} pts — protects your streak if you miss a day`}
          >
            Buy freeze ({FREEZE_COST_PTS.toLocaleString()} pts)
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Referral section ─────────────────────────────────────────────────────────

function ReferralSection() {
  const { toast } = useToast()

  function copyLink() {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/sign-in?ref=stickee-user`
    navigator.clipboard.writeText(url)
    toast('Referral link copied! Share it — you both get 250 pts on sign-up.', 'success')
  }

  return (
    <div className="border border-border p-4 space-y-3" style={{ background: '#0e0e10' }}>
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4" style={{ color: '#2ec266' }} />
        <p className="font-mono text-xs text-foreground">Refer friends, earn points</p>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground leading-relaxed">
        Share your referral link. You earn <span style={{ color: '#2ec266' }}>250 pts</span> for every friend who signs up and makes their first prediction.
      </p>
      <button
        onClick={copyLink}
        className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 transition-colors"
        style={{ background: '#e8e8e6', color: '#0a0a0b' }}
      >
        <Share2 className="h-3 w-3" /> Copy referral link (+250 pts each)
      </button>
    </div>
  )
}

// ─── Logged-in view ───────────────────────────────────────────────────────────

function BadgesTab() {
  const { earnedDefs } = useBadges()
  return (
    <div className="space-y-4">
      <p className="font-mono text-xs text-muted-foreground">
        Badges are earned by taking consistent civic actions. Each one comes with bonus points.
      </p>
      {earnedDefs.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card/80 p-6 text-center space-y-2">
          <p className="text-2xl">🔒</p>
          <p className="text-sm text-muted-foreground">No badges yet — check in daily to start earning.</p>
        </div>
      ) : (
        <BadgeGrid showLocked />
      )}
    </div>
  )
}

function LoggedInView() {
  const [tab, setTab] = useState<TabId>('activity')

  const grade = scoreToGrade(DEMO_USER.civicScore)
  const gradeColor = gradeTextColor(grade)

  const { streak } = useStreak()
  const { addPoints } = useWallet()
  const { awardBadge, hasBadge } = useBadges()

  // Award first-action badge whenever streak becomes active today
  useEffect(() => {
    if (streak.isActiveToday && !hasBadge('first-action')) {
      const bonus = awardBadge('first-action')
      if (bonus > 0) addPoints(bonus)
    }
    if (streak.count >= 7 && !hasBadge('streak-7')) {
      const bonus = awardBadge('streak-7')
      if (bonus > 0) addPoints(bonus)
    }
    if (streak.count >= 30 && !hasBadge('streak-30')) {
      const bonus = awardBadge('streak-30')
      if (bonus > 0) addPoints(bonus)
    }
    if (streak.count >= 100 && !hasBadge('streak-100')) {
      const bonus = awardBadge('streak-100')
      if (bonus > 0) addPoints(bonus)
    }
    if (DEMO_USER.civicScore >= 75 && !hasBadge('score-b')) {
      const bonus = awardBadge('score-b')
      if (bonus > 0) addPoints(bonus)
    }
  }, [streak.isActiveToday, streak.count, hasBadge, awardBadge, addPoints])

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'activity',    label: 'Activity',    icon: MessageSquare },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'positions',   label: 'Positions',   icon: CheckCircle2 },
    { id: 'score',       label: 'Score',       icon: Trophy },
    { id: 'badges',      label: 'Badges',      icon: Award },
  ]

  return (
    <div className="space-y-6">
      {/* Badge toast watcher — fires toasts when badges are earned */}
      <BadgeToastWatcher />

      {/* ── Profile card ── */}
      <div className="rounded-2xl border border-border/50 bg-card/80 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-xl font-bold text-primary">
            {DEMO_USER.name.split(' ').map(w => w[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground">{DEMO_USER.name}</h1>
            <p className="text-sm text-muted-foreground">{DEMO_USER.handle}</p>
            <div className="mt-2 flex flex-col gap-1.5">
              <StreakBadge count={streak.count} isActiveToday={streak.isActiveToday} />
              <BadgeStrip max={6} />
            </div>
          </div>
          <div className="text-center">
            <p className={`text-4xl font-black ${gradeColor}`}>{grade}</p>
            <p className="text-xs text-muted-foreground">{DEMO_USER.civicScore}/100</p>
          </div>
        </div>

        {/* Score progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Civic Score</span>
            <span className="font-medium text-foreground">{DEMO_USER.civicScore}/100</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all"
              style={{ width: `${DEMO_USER.civicScore}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Predictions · Actions · Engagement — keep going to reach grade{' '}
            <span className="font-semibold">B (75+)</span>.{' '}
            <button onClick={() => setTab('score')} className="underline hover:opacity-70 transition-opacity">
              See breakdown →
            </button>
          </p>
        </div>
      </div>

      {/* ── Weekly Report Card ── */}
      <WeeklyReportCard
        civicScore={DEMO_USER.civicScore}
        onView={() => {
          if (!hasBadge('weekly-reporter')) {
            const bonus = awardBadge('weekly-reporter')
            if (bonus > 0) addPoints(bonus)
          }
        }}
      />

      {/* ── Streak section ── */}
      <StreakSection />

      {/* ── Referral section ── */}
      <ReferralSection />

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-border/50 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              'relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
              tab === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {tab === t.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === 'activity'    && <ActivityTab />}
      {tab === 'predictions' && <PredictionsTab />}
      {tab === 'positions'   && <PositionsTab />}
      {tab === 'score'       && <ScoreTab civicScore={DEMO_USER.civicScore} />}
      {tab === 'badges'      && <BadgesTab />}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      {DEMO_USER.isLoggedIn ? <LoggedInView /> : <LoggedOutView />}
    </div>
  )
}
