'use client'

import { useState, useMemo } from 'react'
import { Flame, Award, Zap, ChevronUp, ChevronDown, Star, Target, Info } from 'lucide-react'
import { MPs, PARTY_COLORS } from '@/lib/mock-data'
import { billVoteRows, getMPVoteForBill } from '@/lib/mock-parliament-data'
import type { MP } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StakeEntry {
  billId: string
  mpId: string
  position: 'will-vote-for' | 'will-vote-against'
  points: number
}

// ─── Deterministic mock data ──────────────────────────────────────────────────

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

function mockApproval(mpId: string): number {
  return 30 + (hashCode(mpId) % 61)
}

function mockPressure(mpId: string): number {
  return -55 + ((hashCode(mpId) * 7) % 111)
}

function mockTrust(mpId: string): number {
  return 40 + ((hashCode(mpId) * 13) % 51)
}

// ─── Featured MPs (mix of high & low pressure) ───────────────────────────────

const FEATURED_MP_IDS = [
  'mp-labor-2',        // Anthony Albanese — PM
  'mp-labor-15',       // Jim Chalmers — Treasurer
  'mp-labor-7',        // Chris Bowen — Energy
  'mp-labor-69',       // Tanya Plibersek
  'mp-coalition-1',    // Mary Aldred (shadow)
  'mp-coalition-3',    // Angie Bell
  'mp-coalition-8',    // shadow minister
  'mp-greens-1',       // Elizabeth Watson-Brown
  'mp-ind-9',          // Zali Steggall
  'mp-ind-8',          // Allegra Spender
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function PressureMeter({ value }: { value: number }) {
  const pct = ((value + 100) / 200) * 100
  const color = value > 20 ? '#22c55e' : value < -20 ? '#ef4444' : '#f59e0b'
  const label = value > 20 ? 'High support' : value < -20 ? 'Facing pressure' : 'Neutral'
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-muted-foreground">Public Pressure</span>
        <span className="text-[10px] font-semibold" style={{ color }}>
          {value > 0 ? '+' : ''}{value}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-muted/50">
        <div className="absolute left-1/2 top-0 w-px h-full bg-border/60" />
        <div
          className="absolute top-0 h-full rounded-full transition-all duration-500"
          style={{
            left: value < 0 ? `${pct}%` : '50%',
            width: `${Math.abs(value) / 2}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <p className="text-[9px]" style={{ color }}>{label}</p>
    </div>
  )
}

function TrustBadge({ score }: { score: number }) {
  const tier = score >= 75 ? { label: 'Trusted',    color: '#22c55e', bg: '#22c55e18' }
             : score >= 55 ? { label: 'Moderate',   color: '#f59e0b', bg: '#f59e0b18' }
             :                { label: 'Scrutinised', color: '#ef4444', bg: '#ef444418' }
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded"
      style={{ backgroundColor: tier.bg, color: tier.color }}
    >
      <Award size={8} />
      {tier.label}
    </span>
  )
}

interface MPPressureCardProps {
  mp: MP
  userPressure: 1 | -1 | 0
  onPress: (dir: 1 | -1) => void
}

function MPPressureCard({ mp, userPressure, onPress }: MPPressureCardProps) {
  const partyColor = PARTY_COLORS[mp.party] ?? '#999'
  const approval = mockApproval(mp.id)
  const pressure = mockPressure(mp.id) + (userPressure === 1 ? 8 : userPressure === -1 ? -8 : 0)
  const trust = mockTrust(mp.id)
  const isHot = Math.abs(pressure) > 35

  return (
    <div className={`rounded-xl border p-3.5 transition-all duration-200 ${
      isHot ? 'border-amber-400/30 bg-amber-400/3' : 'border-border/50 bg-card/60'
    }`}>
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.pravatar.cc/60?u=${mp.id}`}
            alt={mp.name}
            width={36}
            height={36}
            className="rounded-full border-2 object-cover"
            style={{ borderColor: partyColor }}
          />
          {isHot && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center">
              <Flame size={8} className="text-black" />
            </div>
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground leading-tight truncate">{mp.name}</p>
          <p className="text-[10px] text-muted-foreground">{mp.electorate}</p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span
              className="text-[9px] font-medium px-1 py-0.5 rounded"
              style={{ backgroundColor: `${partyColor}20`, color: partyColor }}
            >
              {mp.party.replace("Katter's Australian Party", 'KAP').replace('Centre Alliance', 'CA')}
            </span>
            <TrustBadge score={trust} />
          </div>
        </div>

        {/* Approval pill */}
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-foreground">{approval}%</div>
          <div className="text-[9px] text-muted-foreground">approval</div>
        </div>
      </div>

      {/* Pressure meter */}
      <PressureMeter value={pressure} />

      {/* User action buttons */}
      <div className="flex gap-1.5 mt-2.5">
        <button
          onClick={() => onPress(1)}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            userPressure === 1
              ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/30'
              : 'bg-muted/40 text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-400'
          }`}
        >
          <ChevronUp size={12} />
          Support
        </button>
        <button
          onClick={() => onPress(-1)}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
            userPressure === -1
              ? 'bg-red-500/20 text-red-400 ring-1 ring-red-400/30'
              : 'bg-muted/40 text-muted-foreground hover:bg-red-500/10 hover:text-red-400'
          }`}
        >
          <ChevronDown size={12} />
          Oppose
        </button>
      </div>
    </div>
  )
}

// ─── Leaderboard row ──────────────────────────────────────────────────────────

function LeaderboardRow({
  rank,
  mp,
  score,
}: {
  rank: number
  mp: MP
  score: number
}) {
  const partyColor = PARTY_COLORS[mp.party] ?? '#999'
  const isTop3 = rank <= 3
  const rankColors = ['#f59e0b', '#94a3b8', '#cd7c3d']
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={isTop3 ? { backgroundColor: `${rankColors[rank-1]}25`, color: rankColors[rank-1] } : { color: '#6b7280' }}
      >
        {rank}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.pravatar.cc/40?u=${mp.id}`}
        alt={mp.name}
        width={24}
        height={24}
        className="rounded-full border shrink-0"
        style={{ borderColor: `${partyColor}60` }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{mp.name}</p>
        <p className="text-[10px] text-muted-foreground">{mp.electorate}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-bold" style={{ color: score > 50 ? '#22c55e' : score > 0 ? '#f59e0b' : '#ef4444' }}>
          {score > 0 ? '+' : ''}{score}
        </p>
        <p className="text-[9px] text-muted-foreground">pressure</p>
      </div>
    </div>
  )
}

// ─── Reputation stakes ────────────────────────────────────────────────────────

interface StakeSectionProps {
  stakes: StakeEntry[]
  onAddStake: (s: StakeEntry) => void
  onRemoveStake: (index: number) => void
  userPoints: number
}

function StakeSection({ stakes, onAddStake, onRemoveStake, userPoints }: StakeSectionProps) {
  const [stakeAmount, setStakeAmount] = useState(10)
  const [selectedMPId, setSelectedMPId] = useState(FEATURED_MP_IDS[0])
  const [selectedBillId, setSelectedBillId] = useState(billVoteRows[0].id)
  const [position, setPosition] = useState<'will-vote-for' | 'will-vote-against'>('will-vote-for')

  const totalStaked = stakes.reduce((sum, s) => sum + s.points, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-foreground">Stake Reputation Points</p>
        <div className="flex items-center gap-1.5">
          <Star size={11} className="text-amber-400" />
          <span className="text-xs font-bold text-amber-400">{userPoints - totalStaked} pts available</span>
        </div>
      </div>

      <div className="rounded-lg bg-muted/30 border border-border/40 p-3 space-y-3">
        {/* MP selector */}
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">MP</label>
          <select
            value={selectedMPId}
            onChange={e => setSelectedMPId(e.target.value)}
            className="w-full bg-card border border-border/60 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            {FEATURED_MP_IDS.map(id => {
              const mp = MPs.find(m => m.id === id)
              return mp ? <option key={id} value={id}>{mp.name} ({mp.party.replace("Katter's Australian Party", 'KAP')})</option> : null
            })}
          </select>
        </div>

        {/* Bill selector */}
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Bill</label>
          <select
            value={selectedBillId}
            onChange={e => setSelectedBillId(e.target.value)}
            className="w-full bg-card border border-border/60 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            {billVoteRows.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Position */}
        <div>
          <label className="text-[10px] text-muted-foreground mb-1 block">Position</label>
          <div className="flex gap-2">
            {(['will-vote-for', 'will-vote-against'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPosition(p)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  position === p
                    ? p === 'will-vote-for'
                      ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/30'
                      : 'bg-red-500/20 text-red-400 ring-1 ring-red-400/30'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                }`}
              >
                {p === 'will-vote-for' ? 'Will Vote For' : 'Will Vote Against'}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-muted-foreground">Stake amount</label>
            <span className="text-[10px] font-bold text-foreground">{stakeAmount} pts</span>
          </div>
          <input
            type="range"
            min={5}
            max={Math.min(100, userPoints - totalStaked)}
            step={5}
            value={stakeAmount}
            onChange={e => setStakeAmount(Number(e.target.value))}
            className="w-full accent-primary h-1.5"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground/60 mt-0.5">
            <span>5</span>
            <span>max {Math.min(100, userPoints - totalStaked)}</span>
          </div>
        </div>

        {/* Place stake button */}
        <button
          onClick={() => {
            if (stakeAmount > 0 && userPoints - totalStaked >= stakeAmount) {
              onAddStake({ billId: selectedBillId, mpId: selectedMPId, position, points: stakeAmount })
            }
          }}
          disabled={stakeAmount > userPoints - totalStaked}
          className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          <Target size={12} />
          Place Stake
        </button>
      </div>

      {/* Active stakes */}
      {stakes.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Your Stakes</p>
          {stakes.map((s, i) => {
            const mp = MPs.find(m => m.id === s.mpId)
            const bill = billVoteRows.find(b => b.id === s.billId)
            const actualVote = getMPVoteForBill(s.mpId, s.billId)
            const won = (s.position === 'will-vote-for' && actualVote === 'for') ||
                        (s.position === 'will-vote-against' && actualVote === 'against')
            const ongoing = bill?.status === 'ongoing'
            return (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">
                    {mp?.name} · {s.position === 'will-vote-for' ? 'For' : 'Against'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{bill?.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-[11px] font-bold ${ongoing ? 'text-amber-400' : won ? 'text-emerald-400' : 'text-red-400'}`}>
                    {ongoing ? `${s.points} staked` : won ? `+${s.points * 2}` : `-${s.points}`}
                  </p>
                  {!ongoing && (
                    <p className="text-[9px] text-muted-foreground">{won ? 'won' : 'lost'}</p>
                  )}
                </div>
                {ongoing && (
                  <button
                    onClick={() => onRemoveStake(i)}
                    className="text-muted-foreground/60 hover:text-muted-foreground text-[10px] shrink-0"
                  >
                    ×
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main ShapeParliamentPanel ────────────────────────────────────────────────

export function ShapeParliamentPanel() {
  const [tab, setTab] = useState<'pressure' | 'leaderboard' | 'stake'>('pressure')
  const [userPressures, setUserPressures] = useState<Record<string, 1 | -1 | 0>>({})
  const [stakes, setStakes] = useState<StakeEntry[]>([])
  const [userPoints] = useState(250)

  const featuredMPs = useMemo(
    () => FEATURED_MP_IDS.map(id => MPs.find(m => m.id === id)).filter(Boolean) as MP[],
    []
  )

  // Leaderboard: sort by |pressure| descending
  const leaderboard = useMemo(() => {
    return [...featuredMPs]
      .map(mp => ({ mp, score: mockPressure(mp.id) + ((userPressures[mp.id] ?? 0) * 8) }))
      .sort((a, b) => b.score - a.score)
  }, [featuredMPs, userPressures])

  function handlePress(mpId: string, dir: 1 | -1) {
    setUserPressures(prev => ({ ...prev, [mpId]: prev[mpId] === dir ? 0 : dir }))
  }

  const totalPressureApplied = Object.values(userPressures).filter(v => v !== 0).length

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Zap size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Shape Parliament</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Apply public pressure · Stake reputation · Influence outcomes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Star size={11} />
                {userPoints} pts
              </p>
              <p className="text-[9px] text-muted-foreground">reputation</p>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-border/30">
          <div>
            <p className="text-xs font-bold text-foreground">{totalPressureApplied}</p>
            <p className="text-[10px] text-muted-foreground">MPs pressured</p>
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">{stakes.length}</p>
            <p className="text-[10px] text-muted-foreground">active stakes</p>
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">{stakes.reduce((s,e) => s+e.points, 0)}</p>
            <p className="text-[10px] text-muted-foreground">pts staked</p>
          </div>
        </div>
      </div>

      {/* Info callout */}
      <div className="mx-5 mt-4 flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/15 p-3">
        <Info size={13} className="text-primary/70 shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Your votes feed into each MP’s <strong className="text-foreground">Public Pressure Score</strong> and{' '}
          <strong className="text-foreground">Trust Score</strong>, shifting the probability of bills passing.
          Stake reputation points on how MPs will vote — get it right to earn more.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex mx-5 mt-4 gap-1 rounded-lg border border-border/50 p-1 bg-muted/20">
        {(['pressure', 'leaderboard', 'stake'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
              tab === t
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'pressure' ? 'Apply Pressure' : t === 'leaderboard' ? 'Leaderboard' : 'Stake Points'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {tab === 'pressure' && (
          <div>
            <p className="text-xs text-muted-foreground mb-4">
              Support or oppose an MP’s stance to influence their public pressure score. High pressure MPs glow in the chamber map.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featuredMPs.map(mp => (
                <MPPressureCard
                  key={mp.id}
                  mp={mp}
                  userPressure={userPressures[mp.id] ?? 0}
                  onPress={(dir) => handlePress(mp.id, dir)}
                />
              ))}
            </div>
          </div>
        )}

        {tab === 'leaderboard' && (
          <div>
            <p className="text-xs text-muted-foreground mb-4">
              MPs ranked by aggregate public pressure. High positive = public support; deeply negative = facing scrutiny.
            </p>
            <div className="rounded-xl border border-border/50 bg-card/60 px-3 py-1 divide-y divide-border/30">
              {leaderboard.map(({ mp, score }, i) => (
                <LeaderboardRow key={mp.id} rank={i + 1} mp={mp} score={score} />
              ))}
            </div>
          </div>
        )}

        {tab === 'stake' && (
          <StakeSection
            stakes={stakes}
            onAddStake={s => setStakes(prev => [...prev, s])}
            onRemoveStake={i => setStakes(prev => prev.filter((_, j) => j !== i))}
            userPoints={userPoints}
          />
        )}
      </div>
    </div>
  )
}
