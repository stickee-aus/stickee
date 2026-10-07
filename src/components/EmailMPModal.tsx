'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Mail, Copy, CheckCheck, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Issue } from '@/types'
import { MPs } from '@/lib/mock-data'
import { useToast } from '@/components/ui/toast'

// All known MP emails follow this pattern; in production this would come from a DB
const MP_EMAILS: Record<string, string> = {
  'mp-labor-1': 'a.albanese.mp@aph.gov.au',
  'mp-labor-2': 'j.chalmers.mp@aph.gov.au',
  'mp-labor-3': 'senator.wong@aph.gov.au',
  'mp-labor-4': 'm.dreyfus.mp@aph.gov.au',
  'mp-labor-5': 't.plibersek.mp@aph.gov.au',
  'mp-labor-6': 'c.bowen.mp@aph.gov.au',
  'mp-labor-7': 'j.clare.mp@aph.gov.au',
  'mp-labor-8': 'c.oneil.mp@aph.gov.au',
  'mp-labor-9': 'b.shorten.mp@aph.gov.au',
  'mp-labor-10': 'a.giles.mp@aph.gov.au',
  'mp-coalition-1': 'p.dutton.mp@aph.gov.au',
  'mp-coalition-2': 'a.taylor.mp@aph.gov.au',
  'mp-coalition-3': 's.ley.mp@aph.gov.au',
  'mp-coalition-4': 'd.littleproud.mp@aph.gov.au',
  'mp-coalition-5': 'm.mccormack.mp@aph.gov.au',
  'mp-coalition-6': 'k.andrews.mp@aph.gov.au',
  'mp-coalition-7': 'a.hastie.mp@aph.gov.au',
  'mp-coalition-8': 'j.leeser.mp@aph.gov.au',
  'mp-coalition-9': 'p.fletcher.mp@aph.gov.au',
  'mp-coalition-10': 'senator.hume@aph.gov.au',
  'mp-greens-1': 'a.bandt.mp@aph.gov.au',
  'mp-greens-2': 'e.watsonbrown.mp@aph.gov.au',
  'mp-greens-3': 's.bates.mp@aph.gov.au',
  'mp-greens-4': 'm.chandlermather.mp@aph.gov.au',
  'mp-ind-1': 'z.steggall.mp@aph.gov.au',
  'mp-ind-2': 'k.tink.mp@aph.gov.au',
  'mp-ca-1': 'r.sharkie.mp@aph.gov.au',
  'mp-kap-1': 'b.katter.mp@aph.gov.au',
}

function buildEmailTemplate(issue: Issue, mpName: string) {
  return `Dear ${mpName},

I am writing to you as one of your constituents regarding "${issue.title}".

${issue.summary}

I believe this issue deserves careful consideration and I would appreciate knowing your position on this matter and what actions you are taking on behalf of your electorate.

I look forward to your response.

Yours sincerely,
[Your Name]
[Your Address]`
}

interface EmailMPModalProps {
  issue: Issue
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmailMPModal({ issue, open, onOpenChange }: EmailMPModalProps) {
  const [copied, setCopied] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedMpId, setSelectedMpId] = useState<string | null>(null)
  const { toast } = useToast()

  const filteredMPs = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return MPs
    return MPs.filter(
      mp =>
        mp.name.toLowerCase().includes(q) ||
        mp.electorate.toLowerCase().includes(q)
    )
  }, [search])

  const selectedMP = selectedMpId ? MPs.find(m => m.id === selectedMpId) : null
  const mpEmail = selectedMpId ? MP_EMAILS[selectedMpId] : null
  const emailBody = buildEmailTemplate(issue, selectedMP?.name ?? '[Your MP]')

  async function handleCopy() {
    await navigator.clipboard.writeText(emailBody)
    setCopied(true)
    toast('Email text copied to clipboard', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  const mailtoLink = mpEmail
    ? `mailto:${mpEmail}?subject=${encodeURIComponent(`Re: ${issue.title}`)}&body=${encodeURIComponent(emailBody)}`
    : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Email Your MP</DialogTitle>
          <DialogDescription>
            Search for your electorate or MP name to find the right contact.
          </DialogDescription>
        </DialogHeader>

        {/* Electorate search */}
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search electorate or MP name…"
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedMpId(null) }}
            className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Results list */}
        {!selectedMP && (
          <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {filteredMPs.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">No MPs found.</p>
            ) : (
              filteredMPs.map(mp => (
                <button
                  key={mp.id}
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors"
                  onClick={() => { setSelectedMpId(mp.id); setSearch(mp.name) }}
                >
                  <span className="font-medium text-foreground">{mp.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{mp.electorate} · {mp.party}</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Pre-filled message */}
        {selectedMP && (
          <>
            <p className="text-sm text-muted-foreground -mt-1">
              Emailing <strong className="text-foreground">{selectedMP.name}</strong> ({selectedMP.electorate})
            </p>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pre-filled message
              </p>
              <textarea
                className="h-48 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                defaultValue={emailBody}
                readOnly
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCopy}>
                {copied ? (
                  <><CheckCheck className="mr-1.5 h-4 w-4 text-green-500" /> Copied!</>
                ) : (
                  <><Copy className="mr-1.5 h-4 w-4" /> Copy text</>
                )}
              </Button>
              {mailtoLink ? (
                <a
                  href={mailtoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants(), 'flex-1')}
                >
                  <Mail className="mr-1.5 h-4 w-4" /> Open in email
                </a>
              ) : (
                <Button className="flex-1" disabled>
                  <Mail className="mr-1.5 h-4 w-4" /> Open in email
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
