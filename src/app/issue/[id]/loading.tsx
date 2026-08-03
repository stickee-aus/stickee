import { Skeleton } from '@/components/ui/skeleton'

export default function IssueLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-24 mb-6" />

      {/* Issue header */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* MP vote summary */}
          <Skeleton className="h-32 rounded-xl" />
          {/* Vote grid */}
          <div className="rounded-xl border border-border/40 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/30 last:border-0">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {/* Prediction widget */}
          <Skeleton className="h-48 rounded-xl" />
          {/* Email button */}
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
