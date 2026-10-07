'use client'

import { Activity, Users } from 'lucide-react'
import { SimulateThisButton } from '@/components/simulator/SimulateThisButton'
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  BullBearCase,
  MarketThumbnail,
  MarketNewsTimeline,
  ProbabilityHistoryChart,
  SimulatorComparison,
  changeColor,
  probColor,
} from '@/components/MarketCard'
import type { PredictionMarket } from '@/lib/mock-market-data'
import { getMarketEligibility, nonTradeableLabel } from '@/lib/market-eligibility'

export function FeaturedMarketCard({
  market,
  hasPosition,
  onStake,
}: {
  market: PredictionMarket
  hasPosition: boolean
  onStake: (market: PredictionMarket, direction: 'yes' | 'no') => void
}) {
  const color = probColor(market.probability)
  const cColor = changeColor(market.priceChange)
  const sign = market.priceChange > 0 ? '+' : ''
  const noProbability = 100 - market.probability
  const catColor = CATEGORY_COLORS[market.category] ?? '#5a5a5e'
  const catLabel = CATEGORY_LABELS[market.category] ?? market.category
  const { canStake, isDemo, isVoided, isResolvedYes } = getMarketEligibility(market)
  const statusLabel = nonTradeableLabel(market.status)
  const statusColor = isDemo ? '#f5a623' : isVoided ? '#5a5a5e' : isResolvedYes ? '#2ec266' : '#f04747'

  return (
    <section className="grid overflow-hidden rounded-lg border border-border bg-card shadow-[0_24px_90px_rgba(0,0,0,0.32)] lg:grid-cols-[1.16fr_0.84fr]">
      <div className="relative min-h-[300px] lg:min-h-[430px]">
        <MarketThumbnail market={market} className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/5" />
        <div className="relative flex min-h-[300px] flex-col justify-between p-5 sm:p-7 lg:min-h-[430px]">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase backdrop-blur"
              style={{ color: catColor, background: '#0a0a0bcc', border: `1px solid ${catColor}45` }}
            >
              Featured {catLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-black/55 px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase text-foreground/80 backdrop-blur">
              {market.topic}
            </span>
            {hasPosition && (
              <span className="rounded-full border border-[#f5a62330] bg-black/55 px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase text-[#f5a623] backdrop-blur">
                Staked
              </span>
            )}
            {!canStake && (
              <span
                className="rounded-full border bg-black/55 px-3 py-1.5 font-mono text-[10px] tracking-widest uppercase backdrop-blur"
                style={{ color: statusColor, borderColor: `${statusColor}45` }}
                title="Not backed by a verified, currently-open market — staking is disabled until it is."
              >
                {statusLabel}
              </span>
            )}
          </div>

          <div className="max-w-2xl">
            <p className="mb-2 font-mono text-[10px] tracking-widest uppercase text-foreground/60">
              Australian civic market · resolves {market.resolvesBy}
            </p>
            <h2 className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              {market.question}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/70">
              Community forecasts use virtual points only. Treat this as a public-interest signal, not financial advice or gambling.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between p-5 sm:p-7">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">Current market</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-6xl leading-none sm:text-7xl" style={{ color }}>
                {market.probability}%
              </p>
              <p className="mt-2 font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
                chance of YES
              </p>
            </div>
            <div className="pb-2 text-right">
              <p className="font-mono text-2xl" style={{ color: '#f04747' }}>{noProbability}%</p>
              <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">NO</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-full bg-secondary">
            <div className="h-3 bg-[#2ec266]" style={{ width: `${market.probability}%` }} />
          </div>

          <div className="mt-5">
            <ProbabilityHistoryChart history={market.history} color={color} height={86} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <Activity size={15} />
                <span className="font-mono text-[10px] tracking-widest uppercase">24h move</span>
              </div>
              <p className="font-mono text-xl" style={{ color: cColor }}>
                {sign}{market.priceChange.toFixed(1)}pp
              </p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                <Users size={15} />
                <span className="font-mono text-[10px] tracking-widest uppercase">Volume</span>
              </div>
              <p className="font-mono text-xl text-foreground">{market.participants.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <MarketNewsTimeline market={market} />
            <BullBearCase market={market} />
            <SimulatorComparison market={market} />
          </div>
        </div>

        <div className="mt-7 space-y-3">
          <SimulateThisButton
            size="lg"
            className="rounded-lg"
            label="Explore scenarios for this market"
            entity={{
              type: 'market',
              id: market.id,
              title: market.question,
              summary: `Resolves ${market.resolvesBy}. Current market: ${market.probability}% YES.`,
            }}
          />
          {canStake ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onStake(market, 'yes')}
                className="rounded-md border border-[#2ec26640] bg-[#2ec26612] px-4 py-3 font-mono text-[11px] tracking-widest text-[#2ec266] uppercase transition-colors hover:bg-[#2ec26622]"
              >
                Yes
              </button>
              <button
                onClick={() => onStake(market, 'no')}
                className="rounded-md border border-[#f0474740] bg-[#f0474712] px-4 py-3 font-mono text-[11px] tracking-widest text-[#f04747] uppercase transition-colors hover:bg-[#f0474722]"
              >
                No
              </button>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-secondary/50 py-3 text-center font-mono text-[11px] tracking-widest uppercase text-muted-foreground">
              {statusLabel}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
