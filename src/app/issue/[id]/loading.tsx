import { Skeleton } from '@/components/ui/skeleton'

// Mirrors page.tsx's single-column, narrow (max-w-2xl) investigative layout —
// kept in sync with that page's PageShell width and section order so the
// skeleton doesn't promise a two-column dashboard the real content no
// longer renders.
export default function IssueLoading() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-10 md:px-8">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-24 mb-6" />

      {/* Overview header */}
      <div className="mb-8 space-y-3 border-b border-border pb-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Sequential sections */}
      <div className="space-y-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  )
}
