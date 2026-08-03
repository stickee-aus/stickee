export default function FeedLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      {/* Header skeleton */}
      <div className="flex items-end justify-between gap-6 py-10 border-b border-border">
        <div className="space-y-3">
          <div className="h-2 w-28 bg-border animate-pulse" />
          <div className="h-12 w-16 bg-border animate-pulse" />
          <div className="h-2 w-44 bg-border animate-pulse" />
        </div>
        <div className="hidden sm:flex items-end gap-6 pb-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-end gap-6">
              <div className="space-y-1.5">
                <div className="h-5 w-8 bg-border animate-pulse" />
                <div className="h-2 w-14 bg-border animate-pulse" />
              </div>
              {i < 3 && <div className="w-px h-7 bg-border mb-0.5" />}
            </div>
          ))}
        </div>
      </div>

      {/* Alert rows skeleton */}
      <div className="mt-8">
        <div className="flex items-center justify-between py-4 border-b border-border">
          <div className="h-2 w-32 bg-border animate-pulse" />
          <div className="h-2 w-16 bg-border animate-pulse" />
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-border">
            <div className="h-1.5 w-1.5 bg-border animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
            <div className="h-3 w-8 bg-border animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
            <div className="flex-1 h-2 bg-border animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
            <div className="h-2 w-6 bg-border animate-pulse hidden sm:block" style={{ animationDelay: `${i * 60}ms` }} />
            <div className="h-2 w-6 bg-border animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
          </div>
        ))}
      </div>

      {/* Community posts skeleton */}
      <div className="mt-8">
        <div className="flex items-center justify-between py-4 border-b border-border">
          <div className="h-2 w-36 bg-border animate-pulse" />
          <div className="flex gap-5">
            {[1,2,3].map(i => <div key={i} className="h-2 w-12 bg-border animate-pulse" />)}
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="border-b border-border py-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-8 w-8 bg-border animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              <div className="flex-1 space-y-2">
                <div className="h-2 w-48 bg-border animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                <div className="h-2 w-32 bg-border animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              </div>
            </div>
            <div className="space-y-1.5 mb-3">
              <div className="h-2 w-full bg-border animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              <div className="h-2 w-4/5 bg-border animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              <div className="h-2 w-3/5 bg-border animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
            </div>
            <div className="flex gap-4">
              {[1,2,3,4].map(j => <div key={j} className="h-2 w-10 bg-border animate-pulse" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
