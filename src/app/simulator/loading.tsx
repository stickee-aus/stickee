import { Skeleton } from '@/components/ui/skeleton'

export default function SimulatorLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-4 w-full max-w-2xl" />
        <Skeleton className="h-4 w-3/4 max-w-xl" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-3 w-48" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-3 w-56" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>

      <Skeleton className="h-56 rounded-xl" />
    </div>
  )
}
