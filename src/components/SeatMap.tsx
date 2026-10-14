'use client'

import { MapPin, ExternalLink } from 'lucide-react'
import { useElectorateStorage } from '@/hooks/useElectorateStorage'

/**
 * Lightweight map card for the user's seat.
 * Links to the official AEC electorate map and shows a simple visual cue.
 */
export function SeatMap() {
  const { electorate, loaded } = useElectorateStorage()

  if (!loaded || !electorate) return null

  const aecUrl = `https://www.aec.gov.au/profiles/${electorate.state.toLowerCase()}/${electorate.electorate.toLowerCase().replace(/\s+/g, '-')}.htm`

  return (
    <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative h-40 bg-muted/40">
        {/* Simple stylised map placeholder — real boundary tiles can be added later */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-1 text-xs text-muted-foreground">Federal electorate</p>
          </div>
        </div>
        <div className="absolute bottom-2 left-2 rounded bg-background/80 px-2 py-1 text-xs font-medium text-foreground backdrop-blur">
          {electorate.electorate}
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          {(electorate as { locality?: string }).locality || 'Your seat'}
        </span>
        <a
          href={aecUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-foreground hover:underline"
        >
          Official map <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  )
}
