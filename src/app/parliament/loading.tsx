import { Skeleton } from '@/components/ui/skeleton'

// Mirrors page.tsx's PageHeader + Government-vs-Parliament block +
// ParliamentExperienceClient (priority bill, representative, chamber)
// structure — the previous skeleton still promised the retired dashboard
// layout (bills table, 3-column grid), which no longer exists.
export default function ParliamentLoading() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-10 md:px-8">
      {/* PageHeader skeleton */}
      <div className="flex flex-col gap-6 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl space-y-3">
          <Skeleton className="h-2 w-40" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-3 w-52" />
        </div>
        <div className="text-right space-y-1.5">
          <Skeleton className="ml-auto h-9 w-12" />
          <Skeleton className="ml-auto h-2 w-24" />
        </div>
      </div>

      {/* Government vs Parliament block skeleton */}
      <div className="mt-8 space-y-2 border border-border bg-muted/20 px-5 py-4">
        <Skeleton className="h-3 w-full max-w-lg" />
        <Skeleton className="h-3 w-full max-w-md" />
      </div>

      <div className="mt-8 space-y-10">
        {/* Current parliamentary activity */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-56 border-b border-border pb-4" />
          <div className="space-y-3 border border-border p-5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center justify-between gap-4 border-b border-border py-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>

        {/* Your representative */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-40 border-b border-border pb-4" />
          <Skeleton className="h-24 w-full border border-border" />
        </div>

        {/* Parliament (chamber) */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-28 border-b border-border pb-4" />
          <Skeleton className="h-16 w-full border border-border" />
        </div>
      </div>
    </div>
  )
}
