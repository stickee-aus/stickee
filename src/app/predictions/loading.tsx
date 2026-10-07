import { Skeleton } from '@/components/ui/skeleton'

// Mirrors PredictionsPageClient's PageHeader + participation line + category/
// status UnderlineTabs + flat RecordRow forecast-list structure. The previous
// skeleton still showed a dashboard-tile market table (thumbnail column, a
// hidden-on-mobile probability bar) that MarketCard no longer renders.
export default function PredictionsLoading() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
      {/* PageHeader skeleton */}
      <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-3">
          <Skeleton className="h-2 w-32" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="text-right space-y-1.5">
          <Skeleton className="ml-auto h-9 w-10" />
          <Skeleton className="ml-auto h-2 w-24" />
        </div>
      </div>

      {/* Participation line skeleton */}
      <div className="flex items-center justify-between gap-3 border-b border-border py-4">
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Category + status filter tabs skeleton */}
      <div className="mt-8 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-3 w-14" />
          ))}
        </div>
        <div className="flex items-center gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-3 w-14" />
          ))}
        </div>
      </div>

      {/* "Current forecasts" section skeleton */}
      <div className="mt-6">
        <Skeleton className="h-5 w-40 border-b border-border pb-4" />
        <div className="mt-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center justify-between gap-4 border-b border-border py-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="shrink-0 space-y-2 text-right">
                <Skeleton className="ml-auto h-4 w-10" />
                <Skeleton className="ml-auto h-5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
