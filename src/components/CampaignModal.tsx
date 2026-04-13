'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Copy, CheckCheck, Share2, Mail, Users, TrendingUp, Sparkles, ArrowRight, MapPin } from 'lucide-react'
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

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionChoice = 'email' | 'campaign' | 'share'

interface CampaignModalProps {
  bill: BillVoteRow
  initialStance: 'support' | 'oppose'
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (stance: 'support' | 'oppose', action: ActionChoice) => void
  electorate?: string | null
  mpName?: string | null
  localCount?: number    // how many in user's electorate have acted
}

// ─── Template generators ──────────────────────────────────────────────────────

function buildEmailSnippet(bill: BillVoteRow, stance: 'support' | 'oppose', mpName?: string | null): string {
  const direction = stance === 'support' ? 'vote in favour of' : 'vote against'
  const salutation = mpName ? `Dear ${mpName},` : 'Dear [Your MP\'s Name],'
  return `${salutation}

I am writing to you as one of your constituents regarding the ${bill.name}.

I ${stance === 'support' ? 'support' : 'oppose'} this bill because it directly affects ${bill.affectedGroups.slice(0, 2).join(' and ')} in our community.

I urge you to ${direction} this bill when it comes to a vote.

Yours sincerely,
[Your Name]
[Your Address]`
}

function buildSocialPost(bill: BillVoteRow, stance: 'support' | 'oppose', count: number): string {
  const verb = stance === 'support' ? 'Supporting' : 'Opposing'
  const hashtag = bill.tags[0]?.replace(/\s+/g, '') ?? 'AustralianPolitics'
  return `${verb} the ${bill.name} — join ${count.toLocaleString()}+ Australians pressuring MPs to act. Make your voice heard at stickee.com.au #${hashtag} #AusPol`
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function CampaignModal({
  bill,
  initialStance,
  open,
  onOpenChange,
  onConfirm,
  electorate,
  mpName,
  localCount = 0,
}: CampaignModalProps) {
  const [step, setStep] = useState<'choose' | 'action' | 'impact'>('choose')
  const [stance, setStance] = useState<'support' | 'oppose'>(initialStance)
  const [reasoning, setReasoning] = useState('')
  const [chosenAction, setChosenAction] = useState<ActionChoice | null>(null)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedSocial, setCopiedSocial] = useState(false)
  const [totalCount, setTotalCount] = useState(bill.campaignCount)
  const { toast } = useToast()

  // Sync stance when initialStance prop changes (e.g. user re-opens with different stance)
  useEffect(() => {
    if (open) setStance(initialStance)
  }, [open, initialStance])

  const emailSnippet = buildEmailSnippet(bill, stance, mpName)
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
      // ignore — localStorage confirms the action locally
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

  function handleCopyEmail() {
    navigator.clipboard.writeText(emailSnippet)
    setCopiedEmail(true)
    toast('Email template copied', 'success')
    setTimeout(() => setCopiedEmail(false), 2000)
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
                Join the pressure campaign on this bill.
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

            {/* Participant count */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users size={14} className="text-primary shrink-0" />
              <span>
                <strong className="text-foreground">{totalCount.toLocaleString()}</strong> Australians are pressuring MPs
                <span className="text-emerald-400 ml-1 font-medium">+{bill.campaignDailyGrowth} today</span>
              </span>
            </div>

            {/* Local count */}
            {electorate && localCount > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-lg bg-primary/5 border border-primary/15 px-3 py-2">
                <MapPin size={12} className="text-primary shrink-0" />
                <span>
                  <strong className="text-foreground">{localCount}</strong> people in <strong className="text-foreground">{electorate}</strong> have already acted
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
                this bill. Choose how to make your voice heard.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {/* Contact MP */}
              <button
                onClick={() => {
                  handleCopyEmail()
                  handleAction('email')
                }}
                className="w-full flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <Mail size={18} className="text-primary mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Contact {mpName ? `${mpName}` : 'my MP'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Pre-filled email copied to clipboard — send it directly to your MP
                    {electorate ? ` in ${electorate}` : ''}
                  </p>
                </div>
              </button>

              {/* Join Campaign */}
              <button
                onClick={() => handleAction('campaign')}
                className="w-full flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4 text-left hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group"
              >
                <Users size={18} className="text-emerald-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Join the campaign
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Add your voice to <strong className="text-foreground">{totalCount.toLocaleString()}</strong> Australians already pressuring MPs on this bill
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
                    Post to social media to recruit others to this campaign
                  </p>
                </div>
              </button>
            </div>

            {/* Email preview (shown inline after copy) */}
            {chosenAction === 'email' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Mail size={11} />
                    Email copied
                  </p>
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
                  >
                    {copiedEmail ? <CheckCheck size={11} /> : <Copy size={11} />}
                    {copiedEmail ? 'Copied!' : 'Copy again'}
                  </button>
                </div>
                <pre className="text-[10px] leading-relaxed text-muted-foreground bg-muted/30 rounded-lg border border-border/40 p-3 whitespace-pre-wrap font-sans overflow-auto max-h-28">
                  {emailSnippet}
                </pre>
                <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1.5">
                  <Copy size={9} />
                  Paste this into your email client and send to {mpName ?? 'your MP'}
                </p>
              </div>
            )}

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
                    {copiedSocial ? <CheckCheck size={11} /> : <Copy size={11} />}
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
              <DialogTitle className="flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                You&apos;re making a difference
              </DialogTitle>
              <DialogDescription>
                Your action has been recorded.
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
                  <strong className="text-foreground">{localCount + 1}</strong> people from {electorate} have now acted on this bill
                </p>
              )}

              {chosenAction === 'email' && mpName && (
                <p className="text-xs text-muted-foreground border-t border-emerald-500/15 pt-2">
                  {mpName} is watching their inbox. Your email counts.
                </p>
              )}
            </div>

            {/* Swing MP context */}
            {bill.swingMPIds.length > 0 && (
              <div className="rounded-lg border border-border/40 bg-muted/20 px-3 py-2.5">
                <p className="text-xs font-semibold text-foreground mb-0.5">
                  {bill.swingMPIds.length} MPs are undecided on this bill
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Keep the pressure on — scroll down to see exactly who could swing this vote.
                </p>
              </div>
            )}

            <Button className="w-full" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
