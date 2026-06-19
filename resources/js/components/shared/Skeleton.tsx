interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} aria-hidden="true" />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-8 w-full rounded-xl" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" aria-hidden="true">
      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex gap-6">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-6 py-4 flex gap-6 items-center">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={`h-4 flex-1 ${c === 0 ? 'w-8 flex-none rounded-full' : ''}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonStatCards({ count = 3 }: { count?: number }) {
  return (
    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${count}, minmax(0,1fr))` }} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProfileCard() {
  return (
    <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-6 animate-pulse" aria-hidden="true">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-slate-300 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-slate-300 rounded w-3/4" />
          <div className="h-3 bg-slate-300 rounded w-1/2" />
          <div className="flex gap-2 mt-1">
            <div className="h-5 w-20 bg-slate-300 rounded-full" />
            <div className="h-5 w-24 bg-slate-300 rounded-full" />
          </div>
        </div>
      </div>
      <div className="h-3 bg-slate-300 rounded w-full mt-3" />
      <div className="h-2 bg-slate-300 rounded-full w-full mt-2" />
    </div>
  );
}
