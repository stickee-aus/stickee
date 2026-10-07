import Link from 'next/link'
import { Info } from 'lucide-react'

// Community-nominated leader profiles used to render here from seeded,
// fictional nominee data (fake names, fake endorsement quotes, a fabricated
// "credibility score") with no real people or real moderation pipeline
// behind them — presented indistinguishably from real Australians. Removed
// per PEOPLE_TRUTHFULNESS_BATCH_REPORT.md. The underlying components
// (LeaderProfileDetail, NominationModal, mock-leaders-data.ts) are kept,
// not deleted, in case this becomes a real, clearly-separate future product
// (see the report's recommendation) — but nothing here is public-facing
// until it is backed by real, verified people.

export default function LeaderProfilePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center space-y-4">
      <Info className="h-6 w-6 mx-auto text-muted-foreground/60" />
      <h1 className="text-lg font-semibold text-foreground">Not available yet</h1>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Community-nominated leader profiles aren&apos;t available on Stickee yet. When this feature
        launches, every profile will be a real, verified person who has consented to public listing.
      </p>
      <Link
        href="/leaders"
        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        ← Back to People
      </Link>
    </div>
  )
}

export function generateStaticParams() {
  return []
}
