"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { issueMarkets, type IssueMarket, type MarketOutcome } from '@/lib/mock-market-data'
import { mapIssueMarketRecord, type IssueMarketRecord } from '@/lib/issues-data'
import { TrendingUp, TrendingDown, Zap, ArrowRight } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color = '#22c55e' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 80
  const h = 28
  const pad = 2

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })

  const areaPoints = [
    `${pad},${h - pad}`,
    ...points,
    `${w - pad},${h - pad}`,
  ].join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polygon points={areaPoints} fill={color} fillOpacity="0.12" />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Last point dot */}
      <circle
        cx={pad + ((data.length - 1) / (data.length - 1)) * (w - pad * 2)}
        cy={h - pad - ((data[data.length - 1] - min) / range) * (h - pad * 2)}
        r="2.5"
        fill={color}
      />
    </svg>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriceBar({ price, outcome }: { price: number; outcome: 'Yes' | 'No' }) {
  const color = outcome === 'Yes' ? 'bg-green-500' : 'bg-red-500'
  const textColor = outcome === 'Yes' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-20 h-2 rounded-full bg-muted shrink-0">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${price}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums ${textColor}`}>{price}¢</span>
    </div>
  )
}

function ChangeChip({ value }: { value: number }) {
  if (value > 0) return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
      <TrendingUp className="h-3 w-3" />+{value.toFixed(1)}
    </span>
  )
  if (value < 0) return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-300">
      <TrendingDown className="h-3 w-3" />{value.toFixed(1)}
    </span>
  )
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      0.0
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface LiveOutcome extends MarketOutcome {
  price: number
  volume: number
  history: number[]
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const configured = !!(SUPABASE_URL && SUPABASE_KEY && SUPABASE_URL.startsWith('http'))

export function PredictionMarketGrid({
  issueId,
  initialMarket,
}: {
  issueId: string
  initialMarket?: IssueMarket | null
}) {
  const fallbackMarket = initialMarket ?? issueMarkets[issueId] ?? null
  const [market, setMarket] = useState<IssueMarket | null>(fallbackMarket)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    setMarket(fallbackMarket)
  }, [fallbackMarket, issueId])

  useEffect(() => {
    if (!configured) return

    let cancelled = false
    let channelCleanup: (() => void) | undefined

    async function subscribe() {
      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()

      const channel = supabase
        .channel(`issue-market:${issueId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'issue_markets',
            filter: `issue_id=eq.${issueId}`,
          },
          payload => {
            const record = payload.new as IssueMarketRecord | undefined
            if (!record?.issue_id) return
            setMarket(mapIssueMarketRecord(record))
            setLastUpdate(new Date().toLocaleTimeString())
          }
        )
        .subscribe(status => {
          if (!cancelled) {
            setIsLive(status === 'SUBSCRIBED')
          }
        })

      channelCleanup = () => {
        supabase.removeChannel(channel)
      }
    }

    subscribe()

    return () => {
      cancelled = true
      channelCleanup?.()
    }
  }, [issueId])

  if (!market) return null

  const liveOutcomes = market.outcomes as LiveOutcome[]
  const yesOutcome = liveOutcomes[0]
  const noOutcome = liveOutcomes[1]
  const totalVolume = yesOutcome.volume + noOutcome.volume

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground">Forecast</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {market.totalParticipants.toLocaleString()} participants · {totalVolume.toLocaleString()} predictions placed
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isLive && (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
              <Zap className="h-3 w-3" /> Live
            </span>
          )}
          {lastUpdate && <span>{lastUpdate}</span>}
        </div>
      </div>

      {/* Market table */}
      <div className="border border-border overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outcome</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">24h Change</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Volume</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">14-Day Chart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[yesOutcome, noOutcome].map(outcome => {
              const sparkColor = outcome.outcome === 'Yes' ? '#22c55e' : '#ef4444'
              const isYes = outcome.outcome === 'Yes'
              return (
                <tr key={outcome.outcome} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${isYes ? 'bg-green-500' : 'bg-red-500'}`}>
                        {isYes ? '✓' : '✗'}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{outcome.outcome}</p>
                        <p className="text-xs text-muted-foreground">{outcome.price.toFixed(1)}% probability</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Tooltip>
                      <TooltipTrigger>
                        <PriceBar price={Math.round(outcome.price)} outcome={outcome.outcome} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>1¢ = 1% probability. Buy Yes at {Math.round(outcome.price)}¢ to bet on passage.</p>
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <ChangeChip value={outcome.change} />
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-sm text-foreground tabular-nums">{outcome.volume.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <Sparkline data={outcome.history} color={sparkColor} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Probability gauge */}
      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Market Probability</span>
          <span className="text-xs text-muted-foreground tabular-nums">{yesOutcome.price.toFixed(1)}% Yes</span>
        </div>
        <div className="h-3 w-full rounded-full overflow-hidden flex">
          <div
            className="bg-green-500 h-full transition-all duration-700"
            style={{ width: `${yesOutcome.price}%` }}
          />
          <div className="bg-red-500 h-full flex-1" />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs font-semibold text-green-600 dark:text-green-400">{yesOutcome.price.toFixed(1)}% Yes</span>
          <span className="text-xs font-semibold text-red-500 dark:text-red-400">{noOutcome.price.toFixed(1)}% No</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        This table shows current sentiment only.{' '}
        <Link href="/predictions" className="inline-flex items-center gap-1 font-medium text-foreground hover:underline">
          Place a real stake on Forecasts <ArrowRight className="h-3 w-3" />
        </Link>
      </p>
    </div>
  )
}
