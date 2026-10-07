'use client'

import { useState } from 'react'

export function LiveResultsExplainer() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-3 border-t border-border/60 pt-3">
      <button
        onClick={() => setOpen(value => !value)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          How live results work
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/50">{open ? '↑' : '↓'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-1.5 font-mono text-[10px] leading-snug text-muted-foreground/80">
          <p>Votes are counted locally.</p>
          <p>Results are sent to the AEC.</p>
          <p>AEC updates figures as counts progress.</p>
          <p>Early leaders can change before a seat is called.</p>
        </div>
      )}
    </div>
  )
}
