'use client'

import Link from 'next/link'
import { MapPin, ArrowRight, BookOpen } from 'lucide-react'
import { useElectorateStorage } from '@/hooks/useElectorateStorage'

export function YourSeatCard() {
  const { electorate, loaded, clear } = useElectorateStorage()

  if (!loaded || !electorate) return null

  return (
    <div className="mx-auto mt-8 max-w-md rounded-lg border border-border bg-card p-5 text-left">
      <div className="flex items-start gap-3">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Your seat</p>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {electorate.electorate} <span className="text-muted-foreground">({electorate.state})</span>
          </h3>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">How your MP votes</p>
                <p className="text-muted-foreground">
                  See plain-language voting records, attendance, and key issues — the way They Vote For You does it.
                </p>
              </div>
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              Full voting record is being prepared from official parliamentary data (TheyVoteForYou). We only show verified votes — never fabricated scores.
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/leaders"
                className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
              >
                Find your representative <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={clear}
                className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                Change seat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
