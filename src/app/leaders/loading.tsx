import { Skeleton } from '@/components/ui/skeleton'

export default function LeadersLoading() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
      {/* Header skeleton */}
      <div className="pb-8 border-b border-border space-y-3">
        <Skeleton className="h-2 w-28" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-64" />
      </div>

      {/* Find your representative skeleton */}
      <div className="mt-8 space-y-3">
        <Skeleton className="h-3 w-44" />
        <Skeleton className="h-24 w-full border border-border" />
      </div>

      {/* Directory skeleton */}
      <div className="mt-10 space-y-3">
        <Skeleton className="h-3 w-40" />
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="border-b border-border py-3 flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
