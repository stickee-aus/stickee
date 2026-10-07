'use client'

import { useMemo, useState } from 'react'
import { LockKeyhole } from 'lucide-react'

type Cadence = 'once' | 'monthly'

interface DonateAmountFormProps {
  donationUrl: string
}

const AMOUNTS = [5, 10, 25, 50, 100]

export function DonateAmountForm({ donationUrl }: DonateAmountFormProps) {
  const [cadence, setCadence] = useState<Cadence>('once')
  const [selectedAmount, setSelectedAmount] = useState(10)
  const [customAmount, setCustomAmount] = useState('')
  const [customMode, setCustomMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const amount = useMemo(() => {
    if (!customMode) return selectedAmount
    const parsed = Number(customAmount)
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0
  }, [customAmount, customMode, selectedAmount])

  const cadenceLabel = cadence === 'monthly' ? 'monthly' : 'one-time'
  const canDonate = amount > 0
  const fallbackHref = `mailto:hello@stickee.au?subject=I%20want%20to%20support%20Stickee&body=I%27d%20like%20to%20donate%20AUD%20${amount || 10}%20${cadenceLabel}.`
  const href = donationUrl || fallbackHref

  function chooseAmount(value: number) {
    setSelectedAmount(value)
    setCustomAmount('')
    setCustomMode(false)
  }

  async function startCheckout() {
    if (!canDonate || loading) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/donations/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, cadence }),
      })
      const data = await response.json()

      if (response.ok && data.url) {
        window.location.href = data.url
        return
      }

      if (donationUrl || response.status === 503) {
        window.location.href = href
        return
      }

      setError(data.error || 'Unable to start donation checkout.')
    } catch {
      if (donationUrl) {
        window.location.href = href
        return
      }
      setError('Unable to start donation checkout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 border border-border">
        {(['once', 'monthly'] as Cadence[]).map(option => {
          const active = cadence === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => setCadence(option)}
              className="h-12 font-mono text-xs font-medium uppercase tracking-widest transition-colors"
              style={{
                background: active ? '#1e1e20' : 'transparent',
                color: active ? '#e8e8e6' : '#5a5a5e',
                boxShadow: active ? 'inset 0 0 0 1px #e8e8e6' : 'none',
              }}
            >
              {option === 'once' ? 'One-time' : 'Monthly'}
            </button>
          )
        })}
      </div>

      <p className="mt-6 mb-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        Amount
      </p>

      <div className="grid grid-cols-3 border border-border bg-card">
        {AMOUNTS.map(value => {
          const active = !customMode && selectedAmount === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => chooseAmount(value)}
              className="h-16 border-r border-b border-border font-mono text-base transition-colors last:border-r-0 hover:bg-secondary/60"
              style={{
                background: active ? '#1e1e20' : 'transparent',
                color: active ? '#e8e8e6' : '#5a5a5e',
                boxShadow: active ? 'inset 0 0 0 1px #e8e8e6' : 'none',
              }}
            >
              ${value}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setCustomMode(true)}
          className="h-16 border-b border-border font-mono text-base transition-colors hover:bg-secondary/60"
          style={{
            background: customMode ? '#1e1e20' : 'transparent',
            color: customMode ? '#e8e8e6' : '#5a5a5e',
            boxShadow: customMode ? 'inset 0 0 0 1px #e8e8e6' : 'none',
          }}
        >
          Custom
        </button>
      </div>

      {customMode && (
        <label className="mt-2 flex h-14 items-center border border-border bg-card px-4">
          <span className="font-mono text-lg text-muted-foreground">$</span>
          <input
            type="number"
            min="1"
            inputMode="decimal"
            value={customAmount}
            onChange={event => setCustomAmount(event.target.value)}
            className="ml-2 w-full bg-transparent font-mono text-base text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Enter amount"
          />
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">AUD</span>
        </label>
      )}

      <div className="border-x border-b border-border bg-background px-5 py-5">
        <div className="flex items-end justify-between gap-4">
          <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
            Your contribution
          </p>
          <div className="text-right">
            <p className="font-mono text-4xl font-normal text-foreground">
              ${amount || 0}
            </p>
            <p className="font-mono text-xs text-muted-foreground mt-1">{cadenceLabel}</p>
          </div>
        </div>
      </div>

      {cadence === 'monthly' && (
        <p className="mt-3 border border-border px-3 py-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
          Monthly support gives Stickee predictable runway without ads, agendas, or paywalls.
        </p>
      )}

      {error && (
        <p className="mt-3 border px-3 py-2 font-mono text-[10px] leading-relaxed" style={{ borderColor: '#3a1414', color: '#f04747' }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={startCheckout}
        disabled={!canDonate || loading}
        aria-disabled={!canDonate}
        className="mt-4 flex h-14 w-full items-center justify-center px-4 text-center font-mono text-sm font-medium uppercase tracking-widest transition-opacity disabled:pointer-events-none disabled:opacity-40"
        style={{ background: '#e8e8e6', color: '#0a0a0b' }}
      >
        {loading ? 'Starting checkout...' : `Donate $${amount || 0}`}
      </button>

      <p className="mt-5 flex items-start gap-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
        <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Secure payment powered by Stripe. Stickee does not store your payment information.
      </p>
    </div>
  )
}
