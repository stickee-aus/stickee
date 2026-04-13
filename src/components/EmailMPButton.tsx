'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, MessageSquare } from 'lucide-react'
import { EmailMPModal } from '@/components/EmailMPModal'
import { Issue } from '@/types'

interface EmailMPButtonProps {
  issue: Issue
  variant?: 'primary' | 'inline' | 'banner'
}

export function EmailMPButton({ issue, variant = 'primary' }: EmailMPButtonProps) {
  const [open, setOpen] = useState(false)

  if (variant === 'inline') {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium text-foreground/70 hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
        >
          <Mail className="h-3.5 w-3.5" /> Email your MP about this
        </button>
        <EmailMPModal issue={issue} open={open} onOpenChange={setOpen} />
      </>
    )
  }

  if (variant === 'banner') {
    return (
      <>
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Make your voice heard</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send a personalised message to your MP about {issue.title}.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Mail className="h-3.5 w-3.5" /> Email MP
          </button>
        </div>
        <EmailMPModal issue={issue} open={open} onOpenChange={setOpen} />
      </>
    )
  }

  // primary (default)
  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg" className="w-full sm:w-auto">
        <Mail className="mr-2 h-4 w-4" /> Email my MP
      </Button>
      <EmailMPModal issue={issue} open={open} onOpenChange={setOpen} />
    </>
  )
}
