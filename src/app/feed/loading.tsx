import { Skeleton } from '@/components/ui/skeleton'

export default function PoliticalPulseLoading() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
      {/* Header skeleton */}
      <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-3">
          <Skeleton className="h-2 w-40" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-3 w-72" />
        </div>
        <div className="text-right space-y-1.5">
          <Skeleton className="ml-auto h-9 w-10" />
          <Skeleton className="ml-auto h-2 w-24" />
        </div>
      </div>

      {/* Filter tabs skeleton */}
      <div className="mt-8 flex items-center gap-6 border-b border-border pb-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>

      {/* Row skeleton */}
      <div className="mt-6 space-y-3">
        <Skeleton className="h-3 w-20" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center justify-between gap-4 border-b border-border py-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-3 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
