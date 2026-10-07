import { Skeleton } from '@/components/ui/skeleton'

// Mirrors page.tsx's single-column, narrow (max-w-2xl) profile layout —
// avatar header, party tag, MetadataLine, role card, voting sections. The
// previous skeleton showed a 4-tile stats row and a 6-row voting table that
// don't exist on the real page.
export default function MPLoading() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 md:px-8">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-28 mb-6" />

      {/* Profile header */}
      <div className="mb-4 flex items-start gap-5">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      <Skeleton className="h-3 w-full max-w-sm mb-8" />

      {/* Role card */}
      <div className="mb-6 space-y-2 border border-border p-5">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
      </div>

      {/* Simulate button */}
      <Skeleton className="h-9 w-64 mb-6" />

      {/* Voting analysis + history */}
      <div className="space-y-3">
        <Skeleton className="h-16 w-full border border-border" />
        <Skeleton className="h-16 w-full border border-border" />
      </div>
    </div>
  )
}
