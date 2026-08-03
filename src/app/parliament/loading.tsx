import { Skeleton } from '@/components/ui/skeleton'

export default function ParliamentLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-10 space-y-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="flex gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-24" />
          ))}
        </div>
      </div>

      {/* Chamber toggle + view */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>

      {/* Bills table */}
      <div className="rounded-xl border border-border/40 overflow-hidden mb-8">
        <div className="px-4 py-3 border-b border-border/30">
          <Skeleton className="h-5 w-32" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border/30 last:border-0">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Two panel — civic + impact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
      </div>
    </div>
  )
}
