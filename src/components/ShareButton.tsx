'use client'

import { useState } from 'react'
import { Share2, ExternalLink, Link as LinkIcon, Check } from 'lucide-react'
import { useToast } from '@/components/ui/toast'

interface ShareButtonProps {
  title: string
  text?: string
  url?: string
  /** Points rewarded for sharing (shown in toast) */
  bonusPoints?: number
  /** Style variant */
  variant?: 'icon' | 'full'
  count?: number
  className?: string
}

function getReferralUrl(url?: string): string {
  if (typeof window === 'undefined') return url ?? ''
  const base = url ?? window.location.href
  // Add a referral param — in production this would be the user's ID
  const u = new URL(base, window.location.origin)
  u.searchParams.set('ref', 'stickee-share')
  return u.toString()
}

export function ShareButton({
  title,
  text,
  url,
  bonusPoints = 50,
  variant = 'icon',
  count,
  className = '',
}: ShareButtonProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [open, setOpen]     = useState(false)

  const shareUrl = getReferralUrl(url)

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: text ?? title, url: shareUrl })
        toast(`Shared! +${bonusPoints} pts awarded`, 'success')
      } catch { /* user cancelled */ }
      setOpen(false)
      return
    }
    setOpen(o => !o)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast(`Link copied — share to earn +${bonusPoints} pts`, 'success')
    setTimeout(() => setCopied(false), 2000)
    setOpen(false)
  }

  function shareTwitter() {
    const tweet = `${title} — tracking Australian politics with @stickeeapp\n\n${shareUrl}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank', 'noopener')
    toast(`Shared! +${bonusPoints} pts awarded`, 'success')
    setOpen(false)
  }

  if (variant === 'full') {
    return (
      <div className="relative">
        <button
          onClick={handleNativeShare}
          className={`flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase transition-colors ${className}`}
          style={{ color: '#3a3a3e' }}
        >
          <Share2 className="h-3 w-3" />
          {count !== undefined ? `${count}` : 'Share'}
          {bonusPoints > 0 && (
            <span className="font-mono text-[8px] px-1 py-0.5" style={{ color: '#2ec266', border: '1px solid #2ec26630', background: '#041008' }}>
              +{bonusPoints}pts
            </span>
          )}
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              className="absolute bottom-full left-0 mb-2 z-50 border border-border py-1 min-w-36"
              style={{ background: '#0a0a0b' }}
            >
              <button
                onClick={shareTwitter}
                className="flex w-full items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-wider uppercase hover:bg-card/50 transition-colors"
                style={{ color: '#3a3a3e' }}
              >
                <ExternalLink className="h-3 w-3" /> Twitter / X
              </button>
              <button
                onClick={copyLink}
                className="flex w-full items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-wider uppercase hover:bg-card/50 transition-colors"
                style={{ color: '#3a3a3e' }}
              >
                {copied
                  ? <><Check className="h-3 w-3" style={{ color: '#2ec266' }} /> Copied!</>
                  : <><LinkIcon className="h-3 w-3" /> Copy link</>
                }
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // Icon variant (compact)
  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className={`flex items-center gap-1 font-mono text-[10px] transition-colors ${className}`}
        style={{ color: '#3a3a3e' }}
        title={`Share (+${bonusPoints}pts)`}
      >
        <Share2 className="h-3 w-3" />
        {count !== undefined && count}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute bottom-full left-0 mb-2 z-50 border border-border py-1 min-w-36"
            style={{ background: '#0a0a0b' }}
          >
            <button
              onClick={shareTwitter}
              className="flex w-full items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-wider uppercase hover:bg-card/50 transition-colors"
              style={{ color: '#3a3a3e' }}
            >
              <ExternalLink className="h-3 w-3" /> Twitter / X
            </button>
            <button
              onClick={copyLink}
              className="flex w-full items-center gap-2 px-3 py-2 font-mono text-[10px] tracking-wider uppercase hover:bg-card/50 transition-colors"
              style={{ color: '#3a3a3e' }}
            >
              {copied
                ? <><Check className="h-3 w-3" style={{ color: '#2ec266' }} /> Copied!</>
                : <><LinkIcon className="h-3 w-3" /> Copy link</>
              }
            </button>
          </div>
        </>
      )}
    </div>
  )
}
