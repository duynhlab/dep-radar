import { createFileRoute } from "@tanstack/react-router";
import { BucketSection } from "@/components/inbox/bucket-section";
import { Skeleton } from "@/components/ui/skeleton";
import { getIndex } from "@/data/index";
import { buildMeta, canonicalLink } from "@/lib/seo";
import { absoluteUrl, pageTitle } from "@/lib/site";

export const Route = createFileRoute("/history")({
  loader: () => {
    const index = getIndex();
    return {
      merged: index.prs.filter((pr) => pr.bucket === "merged"),
      closed: index.prs.filter((pr) => pr.bucket === "closed"),
      repo: index.repo,
    };
  },
  head: () => {
    const canonical = absoluteUrl("/history");
    return {
      meta: buildMeta({
        title: pageTitle("History"),
        description: "Merged and closed Renovate pull requests from the last 30 days.",
        canonical,
      }),
      links: [canonicalLink(canonical)],
    };
  },
  pendingComponent: () => (
    <div role="status" aria-label="Loading history" className="flex flex-col gap-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-40 w-full" />
    </div>
  ),
  component: HistoryPage,
});

function HistoryPage() {
  const { merged, closed, repo } = Route.useLoaderData();
  const empty = merged.length === 0 && closed.length === 0;
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground">
          Merged and closed Renovate pull requests on {repo} from the last 30 days.
        </p>
      </div>
      {empty ? (
        <p className="rounded-xl border bg-card py-8 text-center text-sm text-muted-foreground">
          Nothing merged or closed in the last 30 days.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          <BucketSection bucket="merged" rows={merged} />
          <BucketSection bucket="closed" rows={closed} />
        </div>
      )}
    </div>
  );
}
