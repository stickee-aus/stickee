export default function LeadersLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      {/* Header skeleton */}
      <div className="flex items-end justify-between gap-6 py-10 border-b border-border">
        <div className="space-y-3">
          <div className="h-2 w-28 bg-border animate-pulse" />
          <div className="h-12 w-16 bg-border animate-pulse" />
          <div className="h-2 w-52 bg-border animate-pulse" />
        </div>
        <div className="hidden sm:flex items-end gap-6 pb-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-end gap-6">
              <div className="space-y-1.5">
                <div className="h-5 w-10 bg-border animate-pulse" />
                <div className="h-2 w-16 bg-border animate-pulse" />
              </div>
              {i < 3 && <div className="w-px h-7 bg-border mb-0.5" />}
            </div>
          ))}
        </div>
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between py-4 border-b border-border mt-8">
        <div className="h-2 w-40 bg-border animate-pulse" />
        <div className="h-2 w-24 bg-border animate-pulse" />
      </div>

      {/* MP rows skeleton */}
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="border-b border-border py-4 flex items-center gap-4">
          <div className="h-3 w-4 bg-border animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          <div className="h-8 w-8 bg-border animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-36 bg-border animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
            <div className="h-2 w-24 bg-border animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          </div>
          <div className="hidden sm:flex gap-1">
            {[1,2,3,4,5].map(j => (
              <div key={j} className="h-2 w-2 rounded-full bg-border animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
          <div className="h-4 w-10 bg-border animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          <div className="h-4 w-6 bg-border animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
        </div>
      ))}
    </div>
  )
}
