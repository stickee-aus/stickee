'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { useElectorateStorage } from '@/hooks/useElectorateStorage'

/** Compact chip that shows the user's current seat (or prompts to set one). */
export function SeatChip() {
  const { electorate, loaded } = useElectorateStorage()

  if (!loaded) return null

  if (!electorate) {
    return (
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <MapPin className="h-3 w-3" />
        Set your seat
      </Link>
    )
  }

  return (
    <Link
      href="/leaders"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-foreground hover:bg-muted"
      title={`Your seat: ${electorate.electorate}`}
    >
      <MapPin className="h-3 w-3 text-muted-foreground" />
      <span className="max-w-[120px] truncate">{electorate.electorate}</span>
    </Link>
  )
}
