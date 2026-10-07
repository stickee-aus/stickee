'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Share2, Users, TrendingUp, ArrowRight, MapPin } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import type { BillVoteRow } from '@/lib/mock-parliament-data'
import type { PressureSummary } from '@/app/api/bills/pressure-summary/route'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionChoice = 'campaign' | 'share'

interface CampaignModalProps {
  bill: BillVoteRow
  initialStance: 'support' | 'oppose'
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (stance: 'support' | 'oppose', action: ActionChoice) => void
  electorate?: string | null
  /** Real aggregate from /api/bills/pressure-summary — never a mock/hardcoded count. */
  pressureSummary: PressureSummary | null
}

// ─── Template generators ──────────────────────────────────────────────────────

function buildSocialPost(bill: BillVoteRow, stance: 'support' | 'oppose', count: number): string {
  const verb = stance === 'support' ? 'Supporting' : 'Opposing'
  const hashtag = bill.tags[0]?.replace(/\s+/g, '') ?? 'AustralianPolitics'
  return `${verb} the ${bill.name} — join ${count.toLocaleString()}+ Australians who have registered a position on Stickee. #${hashtag} #AusPol`
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function CampaignModal({
  bill,
  initialStance,
  open,
  onOpenChange,
  onConfirm,
  electorate,
  pressureSummary,
}: CampaignModalProps) {
  const [step, setStep] = useState<'choose' | 'action' | 'impact'>('choose')
  const [stance, setStance] = useState<'support' | 'oppose'>(initialStance)
  const [reasoning, setReasoning] = useState('')
  const [chosenAction, setChosenAction] = useState<ActionChoice | null>(null)
  const [copiedSocial, setCopiedSocial] = useState(false)
  const [totalCount, setTotalCount] = useState(pressureSummary?.total ?? 0)
  const { toast } = useToast()

  const todayCount = pressureSummary?.today ?? 0
  const localCount = electorate
    ? pressureSummary?.byElectorate.find(e => e.electorate === electorate)?.count ?? 0
    : 0

  // Sync stance/count when props change (e.g. user re-opens with fresh data)
  useEffect(() => {
    if (open) {
      setStance(initialStance)
      setTotalCount(pressureSummary?.total ?? 0)
    }
  }, [open, initialStance, pressureSummary])

  const socialPost = buildSocialPost(bill, stance, totalCount)

  function handleContinue() {
    setStep('action')
  }

  async function handleAction(action: ActionChoice) {
    setChosenAction(action)

    // Optimistically bump count
    setTotalCount(prev => prev + 1)

    // Post to API (fire and forget — UI doesn't block on this)
    try {
      const sessionId = sessionStorage.getItem('stickee:session') ?? (() => {
        const id = crypto.randomUUID()
        sessionStorage.setItem('stickee:session', id)
        return id
      })()
      fetch(`/api/bills/${bill.id}/pressure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stance,
          actionType: action,
          electorate: electorate ?? undefined,
          sessionId,
        }),
      }).catch(() => { /* best-effort */ })
    } catch {
      // ignore — the position is still recorded locally for this session
    }

    if (action === 'share') {
      const text = socialPost
      if (navigator.share) {
        try { await navigator.share({ text }) } catch { /* cancelled */ }
      } else {
        navigator.clipboard.writeText(text)
        toast('Post copied — ready to share', 'success')
      }
    }

    setStep('impact')
    onConfirm(stance, action)
  }

  function handleCopySocial() {
    navigator.clipboard.writeText(socialPost)
    setCopiedSocial(true)
    toast('Post copied — ready to share', 'success')
    setTimeout(() => setCopiedSocial(false), 2000)
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setStep('choose')
      setReasoning('')
      setChosenAction(null)
    }
    onOpenChange(next)
  }

  const stanceColor = stance === 'support' ? 'text-emerald-400' : 'text-red-400'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">

        {/* ── Step 1: Choose stance ── */}
        {step === 'choose' && (
          <>
            <DialogHeader>
              <DialogTitle>Take a position</DialogTitle>
              <DialogDescription>
                Register your position on this bill. This adds to a real, public tally — it does not
                notify or influence any MP directly.
              </DialogDescription>
            </DialogHeader>

            {/* Bill context */}
            <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Bill</p>
              <p className="text-sm font-semibold text-foreground leading-snug">{bill.name}</p>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {bill.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Participant count — real, from /api/bills/pressure-summary */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users size={14} className="text-primary shrink-0" />
              <span>
                <strong className="text-foreground">{totalCount.toLocaleString()}</strong> Australians have registered a position
                {todayCount > 0 && (
                  <span className="text-emerald-400 ml-1 font-medium">+{todayCount} today</span>
                )}
              </span>
            </div>

            {/* Local count — real, from the same endpoint's electorate breakdown */}
            {electorate && localCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg bg-primary/5 border border-primary/15 px-3 py-2">
                <MapPin size={12} className="text-primary shrink-0" />
                <span>
                  <strong className="text-foreground">{localCount}</strong> people in <strong className="text-foreground">{electorate}</strong> have already registered a position
                </span>
              </div>
            )}

            {/* Stance toggle */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Your position</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setStance('support')}
                  className={`rounded-lg border py-3 px-4 text-sm font-semibold transition-all ${
                    stance === 'support'
                      ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'border-border/60 text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-400'
                  }`}
                >
                  <CheckCircle2 size={16} className="mx-auto mb-1" />
                  Support
                </button>
                <button
                  onClick={() => setStance('oppose')}
                  className={`rounded-lg border py-3 px-4 text-sm font-semibold transition-all ${
                    stance === 'oppose'
                      ? 'border-red-500/60 bg-red-500/10 text-red-400 ring-1 ring-red-500/30'
                      : 'border-border/60 text-muted-foreground hover:border-red-500/30 hover:text-red-400'
                  }`}
                >
                  <CheckCircle2 size={16} className="mx-auto mb-1 opacity-0" />
                  Oppose
                </button>
              </div>
            </div>

            {/* Optional reasoning */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                Why? <span className="font-normal text-muted-foreground/60">(optional, {140 - reasoning.length} chars)</span>
              </label>
              <textarea
                value={reasoning}
                onChange={e => setReasoning(e.target.value.slice(0, 140))}
                placeholder="Tell us why this matters to you…"
                rows={3}
                className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <Button onClick={handleContinue} className="w-full">
              Continue — choose your action
              <ArrowRight size={14} className="ml-1" />
            </Button>
          </>
        )}

        {/* ── Step 2: Choose action ── */}
        {step === 'action' && (
          <>
            <DialogHeader>
              <DialogTitle>How do you want to act?</DialogTitle>
              <DialogDescription>
                You&apos;re{' '}
                <strong className={stanceColor}>
                  {stance === 'support' ? 'supporting' : 'opposing'}
                </strong>{' '}
                this bill. To contact your MP directly, use the separate &quot;Contact MP&quot; action
                elsewhere on this page — that opens a real, addressed email draft.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {/* Join Campaign — real, persists to bill_pressures */}
              <button
                onClick={() => handleAction('campaign')}
                className="w-full flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4 text-left hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group"
              >
                <Users size={18} className="text-emerald-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Register my position
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Add your voice to <strong className="text-foreground">{totalCount.toLocaleString()}</strong> Australians who have registered a position on this bill
                  </p>
                </div>
              </button>

              {/* Share */}
              <button
                onClick={() => handleAction('share')}
                className="w-full flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <Share2 size={18} className="text-primary mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Share your stance
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Post to social media to raise awareness of this bill
                  </p>
                </div>
              </button>
            </div>

            {/* Social preview */}
            {chosenAction === 'share' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Share2 size={11} />
                    Share post ready
                  </p>
                  <button
                    onClick={handleCopySocial}
                    className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
                  >
                    {copiedSocial ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground bg-muted/30 rounded-lg border border-border/40 p-3">
                  {socialPost}
                </p>
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={() => setStep('choose')}>
              Back
            </Button>
          </>
        )}

        {/* ── Step 3: Impact confirmation ── */}
        {step === 'impact' && (
          <>
            <DialogHeader>
              <DialogTitle>Your position has been recorded</DialogTitle>
              <DialogDescription>
                This adds to a real, public tally of positions on this bill. Stickee cannot confirm
                that any MP has seen or acted on it.
              </DialogDescription>
            </DialogHeader>

            {/* Impact stat */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" />
                <p className="text-sm font-semibold text-foreground">
                  You and{' '}
                  <span className="text-emerald-400">{(totalCount - 1).toLocaleString()}</span>{' '}
                  others are {stance === 'support' ? 'supporting' : 'opposing'} this bill
                </p>
              </div>

              {electorate && localCount > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin size={11} className="text-primary shrink-0" />
                  <strong className="text-foreground">{localCount + 1}</strong> people from {electorate} have now registered a position on this bill
                </p>
              )}
            </div>

            <Button className="w-full" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
