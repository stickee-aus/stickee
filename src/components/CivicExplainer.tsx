'use client'

import { useState } from 'react'
import { Info, ChevronDown } from 'lucide-react'

type ExplainerProps = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

/** Small plain-language explainer that can be dropped into any page. */
export function CivicExplainer({ title, children, defaultOpen = false }: ExplainerProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-md border border-border bg-muted/30 text-sm">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left font-medium text-foreground"
        aria-expanded={open}
      >
        <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1">{title}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
          open ? 'rotate-180' : ''
        }`} />
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  )
}
