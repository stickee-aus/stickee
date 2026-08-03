'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Megaphone, Users, CheckCircle, Mail, TrendingUp, Lock } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useAuthStatus } from '@/hooks/useAuthStatus'
import { SimulateThisButton } from '@/components/simulator/SimulateThisButton'
import { RecentRehearsalsStrip } from '@/components/simulator/RecentRehearsalsStrip'

// ─── Campaign data ────────────────────────────────────────────────────────────

interface Campaign {
  id: string
  title: string
  description: string
  issueId: string
  pillar: string
  pillarColor: string
  goal: number
  current: number
  milestones: { threshold: number; reward: string }[]
  daysLeft: number
  trending: boolean
  userJoined?: boolean
}

const CAMPAIGNS: Campaign[] = [
  {
    id: 'housing-emails',
    title: 'Email your MP: Housing Crisis',
    description: "Australia's housing affordability crisis is the #1 civic issue of our generation. Every email to an MP adds real pressure. When 50k Australians email their MP simultaneously, parliament takes notice.",
    issueId: 'housing-affordability',
    pillar: 'Housing',
    pillarColor: '#f04747',
    goal: 50_000,
    current: 31_847,
    milestones: [
      { threshold: 10_000, reward: '🏛️ Shadow parliament scorecard released' },
      { threshold: 25_000, reward: '📢 National media coverage triggered' },
      { threshold: 50_000, reward: '🎯 Cross-party committee review requested' },
    ],
    daysLeft: 12,
    trending: true,
  },
  {
    id: 'climate-accountability',
    title: 'Hold the Safeguard Mechanism to account',
    description: "The Climate Safeguard Mechanism passed — but is it being enforced? Join Australians demanding monthly public emissions reports from every regulated facility.",
    issueId: 'climate-safeguard',
    pillar: 'Future',
    pillarColor: '#2ec266',
    goal: 20_000,
    current: 14_221,
    milestones: [
      { threshold: 5_000, reward: '📊 Public emissions dashboard launched' },
      { threshold: 10_000, reward: '🔍 Senate inquiry petition filed' },
      { threshold: 20_000, reward: '🌏 International climate coalition notified' },
    ],
    daysLeft: 21,
    trending: false,
  },
  {
    id: 'ndis-transparency',
    title: 'NDIS Reform: Demand a public impact report',
    description: "The NDIS reform is affecting hundreds of thousands of Australians with disability. We're calling for a mandatory public impact assessment before any cuts take effect.",
    issueId: 'ndis-reform',
    pillar: 'Cost of Living',
    pillarColor: '#f04747',
    goal: 30_000,
    current: 8_430,
    milestones: [
      { threshold: 10_000, reward: '📋 Independent review requested' },
      { threshold: 20_000, reward: '🤝 Disability advocacy coalition formed' },
      { threshold: 30_000, reward: '⚖️ Legal challenge funding unlocked' },
    ],
    daysLeft: 30,
    trending: false,
  },
  {
    id: 'cost-of-living-action',
    title: 'Cost of living: Demand quarterly price audits',
    description: "Grocery prices, rent, and energy are all up — but we have no independent audit of why. Join Australians demanding a quarterly public price transparency report from the ACCC.",
    issueId: 'tax-cuts',
    pillar: 'Cost of Living',
    pillarColor: '#f04747',
    goal: 40_000,
    current: 22_104,
    milestones: [
      { threshold: 15_000, reward: '📈 ACCC formal inquiry requested' },
      { threshold: 30_000, reward: '🧾 Supermarket price comparison tool funded' },
      { threshold: 40_000, reward: '🏷️ Quarterly CPI breakdown report mandated' },
    ],
    daysLeft: 8,
    trending: true,
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return String(n)
}

// ─── Campaign card ────────────────────────────────────────────────────────────

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { toast } = useToast()
  const [joined, setJoined] = useState(campaign.userJoined ?? false)
  const [current, setCurrent] = useState(campaign.current)

  const pct = Math.min(100, Math.round((current / campaign.goal) * 100))

  // Find next milestone
  const nextMilestone = campaign.milestones.find(m => m.threshold > current)
  const milestoneGap  = nextMilestone ? nextMilestone.threshold - current : 0

  function handleJoin() {
    if (joined) return
    setJoined(true)
    setCurrent(c => c + 1)
    toast(`You've joined the "${campaign.title}" campaign! +50 pts`, 'success')
  }

  return (
    <article
      className="border border-border p-5 space-y-4 hover:border-white/10 transition-colors"
      style={{ background: '#0a0a0b' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 border"
              style={{ color: campaign.pillarColor, borderColor: `${campaign.pillarColor}30`, background: `${campaign.pillarColor}08` }}
            >
              {campaign.pillar}
            </span>
            {campaign.trending && (
              <span className="font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5" style={{ color: '#f5a623', border: '1px solid #f5a62330', background: '#f5a62308' }}>
                ↑ Trending
              </span>
            )}
            <span className="font-mono text-[9px] text-muted-foreground">{campaign.daysLeft}d left</span>
          </div>
          <h3 className="text-sm font-medium text-foreground">{campaign.title}</h3>
        </div>

        {/* Participant count */}
        <div className="text-right shrink-0">
          <p className="font-mono text-base" style={{ color: campaign.pillarColor }}>{fmtNum(current)}</p>
          <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>
            of {fmtNum(campaign.goal)}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="font-mono text-xs text-muted-foreground leading-relaxed">
        {campaign.description}
      </p>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="h-1 w-full" style={{ background: '#1e1e20', position: 'relative' }}>
          <div
            className="absolute inset-y-0 left-0 transition-all duration-500"
            style={{ width: `${pct}%`, background: campaign.pillarColor }}
          />
          {/* Milestone markers */}
          {campaign.milestones.map(m => {
            const markerPct = Math.min(100, (m.threshold / campaign.goal) * 100)
            const reached = current >= m.threshold
            return (
              <div
                key={m.threshold}
                className="absolute top-1/2 -translate-y-1/2 h-3 w-px"
                style={{
                  left: `${markerPct}%`,
                  background: reached ? campaign.pillarColor : '#2a2a2e',
                }}
                title={`${fmtNum(m.threshold)}: ${m.reward}`}
              />
            )
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>{pct}% of goal</span>
          {nextMilestone && (
            <span className="font-mono text-[9px]" style={{ color: '#3a3a3e' }}>
              {fmtNum(milestoneGap)} more → {nextMilestone.reward.split(' ').slice(0, 3).join(' ')}…
            </span>
          )}
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-1.5">
        <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Unlocks at</p>
        {campaign.milestones.map(m => {
          const reached = current >= m.threshold
          return (
            <div key={m.threshold} className="flex items-center gap-2">
              <CheckCircle
                className="h-3 w-3 shrink-0"
                style={{ color: reached ? campaign.pillarColor : '#2a2a2e' }}
              />
              <span className="font-mono text-[10px]" style={{ color: reached ? '#e8e8e6' : '#3a3a3e' }}>
                {fmtNum(m.threshold)} — {m.reward}
              </span>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {joined ? (
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2" style={{ color: '#2ec266', border: '1px solid #2ec26630', background: '#041008' }}>
            <CheckCircle className="h-3 w-3" /> Joined
          </div>
        ) : (
          <button
            onClick={handleJoin}
            className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 transition-all"
            style={{ background: '#e8e8e6', color: '#0a0a0b' }}
          >
            <Users className="h-3 w-3" /> Join campaign
          </button>
        )}
        <Link
          href={`/issues`}
          className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 border border-border transition-colors hover:bg-card/50"
        >
          <Mail className="h-3 w-3" /> Email MP
        </Link>
        <SimulateThisButton
          entity={{
            type: 'campaign',
            id: campaign.id,
            title: campaign.title,
            summary: campaign.description,
            pillarId: campaign.pillar.toLowerCase(),
          }}
        />
        <button
          onClick={() => {
            const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/campaigns?c=${campaign.id}`
            if (navigator.share) {
              navigator.share({ title: campaign.title, text: campaign.description, url })
            } else {
              navigator.clipboard.writeText(url)
              toast('Campaign link copied — share to boost the count!', 'success')
            }
          }}
          className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 border border-border transition-colors hover:bg-card/50"
        >
          <TrendingUp className="h-3 w-3" /> Share +50pts
        </button>
      </div>
    </article>
  )
}

// ─── Campaigns page ───────────────────────────────────────────────────────────

export default function CampaignsPage() {
  const auth = useAuthStatus()
  const { toast } = useToast()
  const totalParticipants = CAMPAIGNS.reduce((s, c) => s + c.current, 0)
  const trending = CAMPAIGNS.filter(c => c.trending)
  const rest     = CAMPAIGNS.filter(c => !c.trending)

  return (
    <div className="mx-auto max-w-5xl px-6">

      {/* ── Header ── */}
      <div className="flex items-end justify-between gap-6 py-10 border-b border-border">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Australia · Collective Action
          </p>
          <div className="flex items-baseline gap-3">
            <span
              className="font-mono font-normal leading-none text-foreground"
              style={{ fontSize: 'clamp(40px, 8vw, 56px)', letterSpacing: '-0.02em' }}
            >
              {fmtNum(totalParticipants)}
            </span>
            <span className="font-mono text-xl text-muted-foreground/40">Australians</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-2">
            {CAMPAIGNS.length} active campaigns · Goals unlock real outcomes
          </p>
        </div>

        <div className="hidden sm:flex items-end gap-6 pb-1">
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1" style={{ color: '#f5a623' }}>{CAMPAIGNS.length}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Campaigns</p>
          </div>
          <div className="w-px h-8 bg-border mb-1" />
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1" style={{ color: '#2ec266' }}>{trending.length}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Trending</p>
          </div>
        </div>
      </div>

      {/* ── Recent rehearsals ── */}
      <div className="py-6 border-b border-border">
        <RecentRehearsalsStrip variant="compact" limit={3} />
      </div>

      {/* ── How it works ── */}
      <div className="grid grid-cols-3 gap-4 py-6 border-b border-border">
        {[
          { step: '01', label: 'Join a campaign', desc: 'Add your name to the count — earn 50pts' },
          { step: '02', label: 'Share with friends', desc: 'Each share earns 50pts + 25pts per signup' },
          { step: '03', label: 'Hit the goal', desc: 'Milestones unlock real civic outcomes' },
        ].map(s => (
          <div key={s.step} className="text-center">
            <p className="font-mono text-xs font-medium text-foreground mb-0.5">{s.step}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{s.label}</p>
            <p className="font-mono text-[9px] mt-1" style={{ color: '#3a3a3e' }}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Trending campaigns ── */}
      {trending.length > 0 && (
        <div className="mt-8 mb-6">
          <div className="flex items-center justify-between py-4 border-b border-border mb-4">
            <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Trending Now
            </span>
            <span className="font-mono text-[9px]" style={{ color: '#f5a623' }}>
              ↑ Moving fast
            </span>
          </div>
          <div className="space-y-4">
            {trending.map(c => <CampaignCard key={c.id} campaign={c} />)}
          </div>
        </div>
      )}

      {/* ── All campaigns ── */}
      <div className="mb-12">
        <div className="flex items-center justify-between py-4 border-b border-border mb-4">
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            All Campaigns
          </span>
        </div>
        <div className="space-y-4">
          {rest.map(c => <CampaignCard key={c.id} campaign={c} />)}
        </div>
      </div>

      {/* ── Propose a campaign ── */}
      <div className="mb-12 border border-border p-6 text-center space-y-3">
        <Megaphone className="h-5 w-5 mx-auto" style={{ color: '#3a3a3e' }} />
        <p className="font-mono text-xs text-foreground">Have a civic issue that needs a campaign?</p>
        <p className="font-mono text-[10px] text-muted-foreground">
          Propose a campaign and if it gets 100 upvotes from the community, we&apos;ll launch it officially.
        </p>
        {auth.authenticated ? (
          <button
            type="button"
            onClick={() => toast('Campaign proposals are ready for the review flow.', 'info')}
            className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 mt-2 transition-colors"
            style={{ background: '#e8e8e6', color: '#0a0a0b' }}
          >
            <Megaphone className="h-3 w-3" /> Propose campaign
          </button>
        ) : (
          <Link
            href="/auth/sign-in?next=/campaigns"
            className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase px-4 py-2 mt-2 transition-colors"
            style={{ background: '#e8e8e6', color: '#0a0a0b' }}
          >
            <Lock className="h-3 w-3" /> Sign in to propose
          </Link>
        )}
      </div>
    </div>
  )
}
