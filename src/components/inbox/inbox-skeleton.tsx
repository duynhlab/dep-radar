import { Skeleton } from "@/components/ui/skeleton";

/** Matches the inbox geometry: four KPI cards, a toolbar, two-line rows. */
export function InboxSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading inbox" aria-busy className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-7 w-12" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="flex flex-col divide-y rounded-xl border bg-card">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex gap-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
