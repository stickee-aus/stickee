'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, TrendingUp, MessageSquare, ArrowRight, LogIn, CheckCircle2, Share2, Trophy, Award } from 'lucide-react'
import { StreakBadge } from '@/components/StreakBadge'
import { StreakMilestone } from '@/components/StreakMilestone'
import { BadgeGrid, BadgeStrip, BadgeToastWatcher } from '@/components/BadgeDisplay'
import { CIVIC_PILLARS } from '@/lib/mock-civic-data'
import { PillarGradeChip } from '@/components/PillarGradeChip'
import { useAuthStatus } from '@/hooks/useAuthStatus'
import { useStreak, FREEZE_COST_PTS } from '@/hooks/useStreak'
import { useWallet } from '@/hooks/useWallet'
import { useBadges } from '@/hooks/useBadges'
import { useToast } from '@/components/ui/toast'

type TabId = 'activity' | 'predictions' | 'issues' | 'badges'

// ─── Loading view ─────────────────────────────────────────────────────────────

function LoadingView() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-primary" />
    </div>
  )
}

// ─── Logged-out view ──────────────────────────────────────────────────────────

function LoggedOutView() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <User className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Sign in to see your profile.</h1>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your profile shows activity tied to your real account — sign in to view it.
        </p>
      </div>
      <ul className="space-y-2 text-sm text-left max-w-xs w-full">
        {[
          'Build a streak by taking daily actions',
          'Earn badges for consistent civic engagement',
          'Track your daily bonus points',
          'Contact your MP with one tap',
        ].map(item => (
          <li key={item} className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/auth/sign-in?next=/profile"
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <LogIn className="h-4 w-4" /> Sign in with email
      </Link>
    </div>
  )
}

// ─── Activity tab ─────────────────────────────────────────────────────────────

function ActivityTab() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/80 p-6 text-center space-y-2">
      <MessageSquare className="h-5 w-5 mx-auto text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Your personal activity history isn&apos;t tracked here yet.
      </p>
      <Link href="/feed" className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
        See the community Feed <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

// ─── Predictions tab ──────────────────────────────────────────────────────────

function PredictionsTab() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/80 p-6 text-center space-y-2">
      <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Your predictions aren&apos;t tracked on this page yet.
      </p>
      <Link href="/predictions" className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
        Go to Forecasts <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

// ─── Issues tab ───────────────────────────────────────────────────────────────

function IssuesTab() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">National issues, at a glance.</p>
      <div className="grid grid-cols-5 gap-2">
        {CIVIC_PILLARS.map(pillar => (
          <Link key={pillar.id} href="/issues">
            <PillarGradeChip pillar={pillar} />
          </Link>
        ))}
      </div>
      <div className="rounded-xl border border-border/50 bg-card/80 p-4 text-center">
        <p className="text-xs text-muted-foreground mb-2">Personal issue tracking isn&apos;t available yet.</p>
        <Link href="/issues" className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
          Explore Issues <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ─── Badges tab ───────────────────────────────────────────────────────────────

function BadgesTab() {
  const { earnedDefs } = useBadges()
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Badges are earned by taking consistent civic actions on this device.
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
      const BONUSES: Record<number, number> = { 7: 250, 30: 1000, 100: 5000 }
      const bonus = BONUSES[newCount] ?? 0
      if (bonus > 0) addPoints(bonus)
    }
  }

  return (
    <div className="border border-border p-4 space-y-3" style={{ background: '#0e0e10' }}>
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
          <Trophy className="h-5 w-5" style={{ color: streak.count > 0 ? '#f5a623' : '#2a2a2e' }} />
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

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px]" style={{ color: '#3a3a3e' }}>
            {streak.freezesAvailable} freeze{streak.freezesAvailable !== 1 ? 's' : ''} available
          </span>
        </div>
        {hydrated && (
          <button
            onClick={handleBuyFreeze}
            className="font-mono text-[9px] tracking-widest uppercase px-2 py-1 border transition-colors hover:bg-card/50"
            style={{ borderColor: '#1e1e20', color: '#3a3a3e' }}
            title={`Buy a streak freeze for ${FREEZE_COST_PTS.toLocaleString()} pts — protects your streak if you miss a day. Points are local to this device, not your account.`}
          >
            Buy freeze ({FREEZE_COST_PTS.toLocaleString()} pts)
          </button>
        )}
      </div>
      <p className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>
        Balance: {hydrated ? balance.toLocaleString() : '—'} pts (stored on this device, not your account)
      </p>
    </div>
  )
}

// ─── Referral section ─────────────────────────────────────────────────────────

function ReferralSection() {
  const { toast } = useToast()

  function copyLink() {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/sign-in?ref=stickee-user`
    navigator.clipboard.writeText(url)
    toast('Referral link copied!', 'success')
  }

  return (
    <div className="border border-border p-4 space-y-3" style={{ background: '#0e0e10' }}>
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4" style={{ color: '#2ec266' }} />
        <p className="font-mono text-xs text-foreground">Invite friends to Stickee</p>
      </div>
      <button
        onClick={copyLink}
        className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 transition-colors"
        style={{ background: '#e8e8e6', color: '#0a0a0b' }}
      >
        <Share2 className="h-3 w-3" /> Copy invite link
      </button>
    </div>
  )
}

// ─── Logged-in view ───────────────────────────────────────────────────────────

function LoggedInView({ email }: { email: string | null }) {
  const [tab, setTab] = useState<TabId>('activity')
  const { streak } = useStreak()
  const { addPoints } = useWallet()
  const { awardBadge, hasBadge } = useBadges()

  const displayName = email ? email.split('@')[0] : 'Your account'
  const initial = displayName.charAt(0).toUpperCase() || '?'

  // Award streak-based badges as real local milestones are reached
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
  }, [streak.isActiveToday, streak.count, hasBadge, awardBadge, addPoints])

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'activity',    label: 'Activity',    icon: MessageSquare },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp },
    { id: 'issues',      label: 'Issues',      icon: CheckCircle2 },
    { id: 'badges',      label: 'Badges',      icon: Award },
  ]

  return (
    <div className="space-y-6">
      <BadgeToastWatcher />

      {/* ── Profile card ── */}
      <div className="rounded-2xl border border-border/50 bg-card/80 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-xl font-bold text-primary">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">{displayName}</h1>
            {email && <p className="text-sm text-muted-foreground truncate">{email}</p>}
            <div className="mt-2 flex flex-col gap-1.5">
              <StreakBadge count={streak.count} isActiveToday={streak.isActiveToday} />
              <BadgeStrip max={6} />
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground border-t border-border/50 pt-3">
          Civic score isn&apos;t available yet — this is still being built and verified.
        </p>
      </div>

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
      {tab === 'issues'      && <IssuesTab />}
      {tab === 'badges'      && <BadgesTab />}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const auth = useAuthStatus()

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {!auth.hydrated ? (
        <LoadingView />
      ) : auth.authenticated ? (
        <LoggedInView email={auth.email} />
      ) : (
        <LoggedOutView />
      )}
    </div>
  )
}
