import { Skeleton } from '@/components/ui/skeleton'

// Mirrors IssuesPageClient's PageHeader + UnderlineTabs + RecordRow-list
// structure — this route previously had no loading.tsx at all.
export default function IssuesLoading() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
      {/* PageHeader skeleton */}
      <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-3">
          <Skeleton className="h-2 w-28" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="text-right space-y-1.5">
          <Skeleton className="ml-auto h-9 w-12" />
          <Skeleton className="ml-auto h-2 w-24" />
        </div>
      </div>

      {/* UnderlineTabs skeleton */}
      <div className="mt-8 flex items-center gap-6 border-b border-border pb-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>

      {/* RecordRow list skeleton */}
      <div className="mt-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex items-center justify-between gap-4 border-b border-border py-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full max-w-sm" />
            </div>
            <Skeleton className="h-5 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
