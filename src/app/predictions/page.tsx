'use client'

import { useState, useMemo, useEffect } from 'react'
import { allMarkets, leaderboard, type PredictionMarket, type MarketCategory } from '@/lib/mock-market-data'
import { useWallet } from '@/hooks/useWallet'
import { useCountdown } from '@/hooks/useCountdown'
import { StakeModal } from '@/components/StakeModal'
import { PortfolioPanel } from '@/components/PortfolioPanel'
import { ProposeMarketModal, loadProposals, type MarketProposal } from '@/components/ProposeMarketModal'
import { useToast } from '@/components/ui/toast'

// ─── Types ────────────────────────────────────────────────────────────────────

type CategoryFilter = 'all' | MarketCategory | 'custom'
type StatusFilter   = 'active' | 'resolved' | 'all'

interface StakeTarget {
  market: PredictionMarket
  direction: 'yes' | 'no'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function probColor(p: number): string {
  if (p >= 60) return '#2ec266'
  if (p >= 45) return '#f5a623'
  return '#f04747'
}

function changeColor(c: number): string {
  if (c > 0) return '#2ec266'
  if (c < 0) return '#f04747'
  return '#5a5a5e'
}

const CATEGORY_LABELS: Record<MarketCategory, string> = {
  bill:      'BILL',
  civic:     'CIVIC',
  election:  'ELEC',
  'mp-vote': 'MP',
}

const CATEGORY_COLORS: Record<MarketCategory, string> = {
  bill:      '#5a5a5e',
  civic:     '#f5a623',
  election:  '#3b82f6',
  'mp-vote': '#a855f7',
}

// ─── Mini sparkline ───────────────────────────────────────────────────────────

function MiniSparkline({ prob, change }: { prob: number; change: number }) {
  const pts: number[] = []
  for (let i = 0; i < 14; i++) {
    const t = i / 13
    const noise = Math.sin(i * 2.1) * 1.8 + Math.cos(i * 1.3) * 1.2
    pts.push(Math.max(5, Math.min(95, prob - change * (1 - t) + noise)))
  }
  const min = Math.min(...pts), max = Math.max(...pts)
  const range = max - min || 1
  const W = 56, H = 18, pad = 1
  const svgPts = pts.map((v, i) => {
    const x = pad + (i / 13) * (W - pad * 2)
    const y = pad + (1 - (v - min) / range) * (H - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="opacity-70">
      <polyline
        points={svgPts.join(' ')}
        fill="none"
        stroke={probColor(prob)}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Market countdown badge ───────────────────────────────────────────────────

function MarketCountdownBadge({ resolvesBy }: { resolvesBy: string }) {
  // Try to parse the date string; many entries use "Jun 2026" (month/year) format
  // For those we can't show a precise countdown — only show for parseable exact dates
  const parsed = new Date(resolvesBy)
  const isExact = !isNaN(parsed.getTime())
  const countdown = useCountdown(isExact ? parsed : null)

  if (!isExact || !countdown.isClosingSoon) return null

  const urgentStyle = countdown.isUrgent
    ? { color: '#f04747', borderColor: '#f0474730', background: '#1e0a0a' }
    : { color: '#f5a623', borderColor: '#f5a62330', background: '#1e1200' }

  return (
    <span
      className="shrink-0 inline-flex items-center gap-1 font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm mt-0.5"
      style={urgentStyle}
    >
      {countdown.isUrgent && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      ⏰ {countdown.label}
    </span>
  )
}

// ─── Market row ───────────────────────────────────────────────────────────────

// Detect if a market resolves "soon" (≤ 3 days from now — check resolvesBy string)
function isClosingSoon(resolvesBy: string): boolean {
  // resolvesBy is a human string like "Jun 2026" or "1 May 2026"
  // Simple heuristic: check for day-level strings with near dates
  try {
    const d = new Date(resolvesBy)
    if (isNaN(d.getTime())) return false
    const daysLeft = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return daysLeft >= 0 && daysLeft <= 3
  } catch { return false }
}

function MarketRow({
  market,
  hasPosition,
  onStake,
}: {
  market: PredictionMarket
  hasPosition: boolean
  onStake: (market: PredictionMarket, direction: 'yes' | 'no') => void
}) {
  const resolved  = market.status !== 'active'
  const resolvedY = market.status === 'resolved-yes'
  const color     = probColor(market.probability)
  const cColor    = changeColor(market.priceChange)
  const sign      = market.priceChange > 0 ? '+' : ''
  const catColor  = CATEGORY_COLORS[market.category] ?? '#5a5a5e'
  const catLabel  = CATEGORY_LABELS[market.category] ?? market.category
  const closingSoon = !resolved && isClosingSoon(market.resolvesBy)

  return (
    <tr className="border-b border-border group hover:bg-card/30 transition-colors">
      {/* Category badge */}
      <td className="py-3.5 pr-3 w-16 hidden sm:table-cell">
        <span
          className="font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5"
          style={{ color: catColor, border: `1px solid ${catColor}30` }}
        >
          {catLabel}
        </span>
      </td>

      {/* Question */}
      <td className="py-3.5 pr-6">
        <div className="flex items-start gap-1.5">
          <div>
            <div className="text-sm text-foreground leading-snug">{market.question}</div>
            <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
              Resolves {market.resolvesBy}
              {resolved && (
                <span
                  className="ml-2 tracking-wider"
                  style={{ color: resolvedY ? '#2ec266' : '#f04747' }}
                >
                  · {resolvedY ? 'RESOLVED YES' : 'RESOLVED NO'}
                </span>
              )}
            </div>
          </div>
          {hasPosition && !resolved && (
            <span
              className="shrink-0 font-mono text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded-sm mt-0.5"
              style={{ color: '#f5a623', border: '1px solid #f5a62330', background: '#f5a62308' }}
            >
              Staked
            </span>
          )}
          <MarketCountdownBadge resolvesBy={market.resolvesBy} />
        </div>
      </td>

      {/* Sparkline */}
      <td className="py-3.5 pr-4 hidden lg:table-cell">
        <MiniSparkline prob={market.probability} change={market.priceChange} />
      </td>

      {/* YES probability */}
      <td className="py-3.5 pr-4 text-right whitespace-nowrap">
        <div className="font-mono text-base font-normal" style={{ color }}>{market.probability}%</div>
        <div className="h-px mt-1 w-12 ml-auto" style={{ background: '#1e1e20', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${market.probability}%`, background: color }} />
        </div>
      </td>

      {/* 24h change */}
      <td className="py-3.5 pr-6 text-right whitespace-nowrap hidden sm:table-cell">
        <span className="font-mono text-xs" style={{ color: cColor }}>
          {sign}{market.priceChange.toFixed(1)}pp
        </span>
      </td>

      {/* Volume */}
      <td className="py-3.5 pr-6 text-right whitespace-nowrap hidden md:table-cell">
        <span className="font-mono text-xs text-muted-foreground">
          {market.participants.toLocaleString()}
        </span>
      </td>

      {/* YES / NO stake buttons */}
      <td className="py-3.5 text-right whitespace-nowrap">
        {resolved ? (
          <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">Closed</span>
        ) : (
          <div className="flex items-center gap-1.5 justify-end">
            <button
              onClick={() => onStake(market, 'yes')}
              className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all"
              style={{ background: '#1e1e20', color: '#2ec266', border: '1px solid #2ec26630' }}
            >
              Yes
            </button>
            <button
              onClick={() => onStake(market, 'no')}
              className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 transition-all"
              style={{ background: '#1e1e20', color: '#f04747', border: '1px solid #f0474730' }}
            >
              No
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

// ─── Leaderboard row ──────────────────────────────────────────────────────────

function LeaderRow({ user }: { user: typeof leaderboard[number] }) {
  const isTop3 = user.rank <= 3
  return (
    <tr className="border-b border-border">
      <td className="py-3 pr-4 w-8">
        <span className="font-mono text-sm" style={{ color: isTop3 ? '#f5a623' : '#3a3a3e' }}>
          {user.rank}
        </span>
      </td>
      <td className="py-3 pr-6">
        <div className="flex items-center gap-2.5">
          <div
            className="h-7 w-7 flex items-center justify-center font-mono text-[10px] font-medium shrink-0"
            style={{ background: '#1e1e20', color: '#5a5a5e' }}
          >
            {user.initials}
          </div>
          <div className="text-sm text-foreground">{user.name}</div>
        </div>
      </td>
      <td className="py-3 pr-6">
        <div className="flex items-center gap-3">
          <div className="w-20 h-px bg-border relative hidden sm:block">
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${user.accuracy}%`, background: '#2ec266' }} />
          </div>
          <span className="font-mono text-sm" style={{ color: '#2ec266' }}>{user.accuracy}%</span>
        </div>
      </td>
      <td className="py-3 pr-6 hidden sm:table-cell">
        <span className="font-mono text-xs text-muted-foreground">{user.predictions}</span>
      </td>
      <td className="py-3 text-right">
        <span className="font-mono text-xs text-muted-foreground">{user.streak}d</span>
      </td>
    </tr>
  )
}

// ─── Predictions page ─────────────────────────────────────────────────────────

export default function PredictionsPage() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>('active')
  const [stakeTarget, setStakeTarget]       = useState<StakeTarget | null>(null)
  const [showPortfolio, setShowPortfolio]   = useState(false)
  const [proposeOpen, setProposeOpen]       = useState(false)
  const [proposals, setProposals]           = useState<MarketProposal[]>([])

  // Load persisted proposals on mount
  useEffect(() => { setProposals(loadProposals()) }, [])

  const { toast } = useToast()
  const wallet    = useWallet()

  function handleStake(market: PredictionMarket, direction: 'yes' | 'no') {
    setStakeTarget({ market, direction })
  }

  function handleConfirmStake(amount: number) {
    if (!stakeTarget) return
    const { market, direction } = stakeTarget
    const price = direction === 'yes' ? market.probability : 100 - market.probability
    const ok = wallet.placeStake({
      marketId:       market.id,
      marketQuestion: market.question,
      category:       market.category,
      direction,
      amount,
      price,
    })
    if (ok) {
      toast(`Staked ${amount.toLocaleString()} pts on ${direction.toUpperCase()} · ${market.question.slice(0, 40)}…`, 'success')
      setShowPortfolio(true)
    }
  }

  const stakedMarketIds = useMemo(
    () => new Set(wallet.openPositions.map(p => p.marketId)),
    [wallet.openPositions],
  )

  const filtered = useMemo<(PredictionMarket | MarketProposal)[]>(() => {
    if (categoryFilter === 'custom') return proposals

    return allMarkets.filter(m => {
      const catOk =
        categoryFilter === 'all' || m.category === categoryFilter
      const statusOk =
        statusFilter === 'all' ||
        (statusFilter === 'active'   && m.status === 'active') ||
        (statusFilter === 'resolved' && m.status !== 'active')
      return catOk && statusOk
    })
  }, [categoryFilter, statusFilter, proposals])

  const activeCount = allMarkets.filter(m => m.status === 'active').length

  const CATEGORY_FILTERS: { key: CategoryFilter; label: string }[] = [
    { key: 'all',      label: 'All Markets' },
    { key: 'bill',     label: 'Bills' },
    { key: 'election', label: 'Elections' },
    { key: 'mp-vote',  label: 'MP Votes' },
    { key: 'civic',    label: 'Civic' },
    { key: 'custom',   label: `Proposed${proposals.length > 0 ? ` (${proposals.length})` : ''}` },
  ]

  const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'active',   label: 'Active' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'all',      label: 'All' },
  ]

  return (
    <div className="mx-auto max-w-5xl px-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-6 py-10 border-b border-border">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
            Australia · Prediction Markets
          </p>
          <div className="flex items-baseline gap-3">
            <span
              className="font-mono font-normal leading-none text-foreground"
              style={{ fontSize: 'clamp(40px, 8vw, 56px)', letterSpacing: '-0.02em' }}
            >
              {activeCount}
            </span>
            <span className="font-mono text-xl text-muted-foreground/40">markets</span>
          </div>
          <p className="font-mono text-xs text-muted-foreground mt-2" style={{ letterSpacing: '0.03em' }}>
            Community-forecasted · Stake points · Win big
          </p>
        </div>

        {/* Wallet summary + portfolio toggle */}
        <div className="hidden sm:flex items-end gap-6 pb-1">
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1 text-foreground">
              {wallet.hydrated ? wallet.balance.toLocaleString() : '—'}
            </p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>pts balance</p>
          </div>
          <div className="w-px h-8 bg-border mb-1" />
          <div className="text-right">
            <p className="font-mono text-xl font-normal mb-1 text-foreground">{wallet.openPositions.length}</p>
            <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: '#3a3a3e' }}>Open</p>
          </div>
          <div className="w-px h-8 bg-border mb-1" />
          <button
            onClick={() => setProposeOpen(true)}
            className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded transition-all mb-1"
            style={{ background: '#e8e8e6', color: '#0a0a0b' }}
          >
            + Propose
          </button>
          <button
            onClick={() => setShowPortfolio(v => !v)}
            className="font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded transition-all mb-1"
            style={{
              background: showPortfolio ? '#1e1e20' : 'transparent',
              color:      showPortfolio ? '#e8e8e6' : '#5a5a5e',
              border: '1px solid #1e1e20',
            }}
          >
            {showPortfolio ? 'Hide wallet' : 'Show wallet'}
          </button>
        </div>
      </div>

      {/* ── Portfolio panel ───────────────────────────────────────────────── */}
      {showPortfolio && wallet.hydrated && (
        <div className="mt-6">
          <PortfolioPanel
            balance={wallet.balance}
            openPositions={wallet.openPositions}
            closedPositions={wallet.closedPositions}
            totalStaked={wallet.totalStaked}
            totalPotential={wallet.totalPotential}
            onReset={wallet.resetWallet}
          />
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between py-4 border-b border-border gap-4 flex-wrap mt-6">
        {/* Category */}
        <div className="flex items-center gap-0 flex-wrap">
          {CATEGORY_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className="font-mono text-[10px] tracking-widest uppercase px-4 py-2 transition-colors border-b-2"
              style={{
                color:       categoryFilter === key ? '#e8e8e6' : '#5a5a5e',
                borderColor: categoryFilter === key ? '#e8e8e6' : 'transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="flex items-center gap-3">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className="font-mono text-[10px] tracking-widest uppercase transition-colors"
              style={{ color: statusFilter === key ? '#e8e8e6' : '#5a5a5e' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Market table ─────────────────────────────────────────────────── */}
      <div className="mb-12">
        {/* Column headers */}
        <div className="flex items-center gap-0 py-3 border-b border-border">
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground hidden sm:block w-16 pr-3 shrink-0">Type</span>
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground flex-1 pr-6">Market</span>
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground hidden lg:block pr-4 w-16 shrink-0">14d</span>
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground pr-4 w-24 text-right shrink-0">Yes</span>
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground pr-6 w-20 text-right shrink-0 hidden sm:block">24h</span>
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground pr-6 w-20 text-right shrink-0 hidden md:block">Vol</span>
          <span className="font-mono text-[9px] tracking-widest uppercase text-muted-foreground w-28 text-right shrink-0">Stake</span>
        </div>

        <table className="w-full border-collapse">
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center font-mono text-xs text-muted-foreground">
                  {categoryFilter === 'custom'
                    ? 'No proposals yet — click "+ Propose" to submit one'
                    : 'No markets match this filter'}
                </td>
              </tr>
            ) : categoryFilter === 'custom' ? (
              // Render proposals
              (filtered as MarketProposal[]).map(p => (
                <tr key={p.id} className="border-b border-border">
                  <td className="py-3.5 pr-3 w-16 hidden sm:table-cell">
                    <span className="font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5" style={{ color: '#f5a623', border: '1px solid #f5a62330' }}>
                      {p.category === 'custom' ? 'CUSTOM' : p.category.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 pr-6">
                    <div className="text-sm text-foreground/70 leading-snug">{p.question}</div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                      Resolves {p.resolvesBy}
                      {p.description && <span className="ml-2 text-muted-foreground/50">· {p.description.slice(0, 60)}{p.description.length > 60 ? '…' : ''}</span>}
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 hidden lg:table-cell" />
                  <td className="py-3.5 pr-4 text-right whitespace-nowrap">
                    <span className="font-mono text-xs" style={{ color: '#5a5a5e' }}>—</span>
                  </td>
                  <td className="py-3.5 pr-6 text-right whitespace-nowrap hidden sm:table-cell" />
                  <td className="py-3.5 pr-6 text-right whitespace-nowrap hidden md:table-cell" />
                  <td className="py-3.5 text-right whitespace-nowrap">
                    <span
                      className="font-mono text-[9px] tracking-widest uppercase px-2 py-1"
                      style={{ color: '#f5a623', border: '1px solid #f5a62330', background: '#f5a62308' }}
                    >
                      Pending Review
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              (filtered as PredictionMarket[]).map(m => (
                <MarketRow
                  key={m.id}
                  market={m}
                  hasPosition={stakedMarketIds.has(m.id)}
                  onStake={handleStake}
                />
              ))
            )}
          </tbody>
        </table>

        <p className="font-mono text-[10px] text-muted-foreground mt-4">
          {filtered.length} market{filtered.length !== 1 ? 's' : ''} · Points are virtual and for entertainment only
        </p>
      </div>

      {/* ── Leaderboard ──────────────────────────────────────────────────── */}
      <div className="pb-12">
        <div className="flex items-center justify-between py-5 border-b border-border">
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Leaderboard · Top Predictors
          </span>
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Accuracy · Markets · Streak
          </span>
        </div>

        <table className="w-full border-collapse">
          <tbody>
            {leaderboard.map(user => (
              <LeaderRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Stake modal ───────────────────────────────────────────────────── */}
      {stakeTarget && (
        <StakeModal
          market={stakeTarget.market}
          direction={stakeTarget.direction}
          balance={wallet.balance}
          onConfirm={handleConfirmStake}
          onClose={() => setStakeTarget(null)}
        />
      )}

      {/* ── Propose market modal ─────────────────────────────────────────── */}
      <ProposeMarketModal
        open={proposeOpen}
        onOpenChange={setProposeOpen}
        onSubmitted={proposal => {
          setProposals(prev => [proposal, ...prev])
          setCategoryFilter('custom')
          toast('Market proposed! Pending community review.', 'success')
        }}
      />
    </div>
  )
}
