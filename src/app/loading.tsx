import { Skeleton } from '@/components/ui/skeleton'

export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-14">
      {/* Hero */}
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-72 mx-auto" />
        <Skeleton className="h-5 w-80 mx-auto" />
        <div className="flex justify-center gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      {/* Pillar scoreboard */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Civic scorecard */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Bills table */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="rounded-xl border border-border/40 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-0">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12 hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
