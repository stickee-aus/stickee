import { Skeleton } from '@/components/ui/skeleton'

export default function GovernmentLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8 space-y-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>

      {/* Decision cards */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/40 p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-3 pt-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
