import { cn } from "@/lib/cn";

/**
 * Hand-written rather than taken from shadcn, whose version is a bare
 * `animate-pulse` with no reduced-motion handling.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-control bg-surface-hover motion-reduce:animate-none", className)}
    />
  );
}

/** Matches a PR row's three lines so the list does not jump when data lands. */
export function RowSkeleton() {
  return (
    <div className="flex flex-col gap-2 border-b border-border px-3 py-3 last:border-b-0">
      <div className="flex gap-2">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function InboxSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading inbox" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-card border border-border bg-surface">
        {Array.from({ length: rows }, (_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
