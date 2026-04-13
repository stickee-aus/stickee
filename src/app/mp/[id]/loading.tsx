import { Skeleton } from '@/components/ui/skeleton'

export default function MPLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-24 mb-6" />

      {/* MP profile header */}
      <div className="flex items-start gap-5 mb-8">
        <Skeleton className="h-20 w-20 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Voting record */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="rounded-xl border border-border/40 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-border/30 last:border-0">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
