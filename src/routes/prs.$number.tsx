import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";
import { NotFound } from "@/components/layout/not-found";
import { ReleaseNotes } from "@/components/releases/release-notes";
import {
  AffectedFiles,
  BreakingList,
  Checklist,
  Evidence,
  FeaturesList,
  Provenance,
  RelatedPrs,
  ReviewStateBanner,
  VerdictBlock,
} from "@/components/review/review-sections";
import { AreaBadge, ImpactBadge, NeutralBadge, UpdateTypeBadge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { CiGlyph, MergeableGlyph } from "@/components/ui/status-glyph";
import { TimeAgo } from "@/components/ui/time-ago";
import { getIndex, getRow } from "@/data/index";
import { loadPrRecord } from "@/data/pr-record";
import { BUCKET_META } from "@/domain/types";
import { buildMeta, canonicalLink } from "@/lib/seo";
import { absoluteUrl, pageTitle } from "@/lib/site";

export const Route = createFileRoute("/prs/$number")({
  loader: async ({ params: { number } }) => {
    const n = Number.parseInt(number, 10);
    const row = Number.isInteger(n) ? getRow(n) : undefined;
    if (!row) throw notFound();
    const result = await loadPrRecord(n);
    return {
      row,
      repo: getIndex().repo,
      record: result.status === "ok" ? result.record : null,
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: pageTitle("Pull request not found") }] };
    const { row } = loaderData;
    const dep = row.dependency;
    const title = dep ? `${dep.name} ${dep.from} → ${dep.to}` : row.title;
    const canonical = absoluteUrl(`/prs/${row.number}`);
    return {
      meta: buildMeta({
        title: pageTitle(`#${row.number} ${title}`),
        description: row.summary ?? row.title,
        canonical,
      }),
      links: [canonicalLink(canonical)],
    };
  },
  pendingComponent: () => (
    <div role="status" aria-label="Loading pull request" className="space-y-8">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-80" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  ),
  notFoundComponent: () => <NotFound kind="pr" />,
  component: PrPage,
});

function PrPage() {
  const { row, repo, record } = Route.useLoaderData();
  const dep = row.dependency;
  const review = record?.reviewState === "fresh" ? record.review : null;
  const staleReview = record?.reviewState === "stale" ? record.review : null;
  const shown = review ?? staleReview;

  return (
    <PageContainer width="reading" className="space-y-8">
      <Breadcrumb current={`#${row.number}`} />

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-detail-title font-semibold tracking-tight text-fg">{dep?.name ?? row.title}</h1>
          {dep ? (
            <span className="font-mono text-version text-fg">
              {dep.from} → {dep.to}
            </span>
          ) : null}
          {dep ? <UpdateTypeBadge type={dep.updateType} /> : null}
          {row.impact ? <ImpactBadge impact={row.impact} /> : null}
          {row.areas.map((area) => (
            <AreaBadge key={area} area={area} asLink />
          ))}
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-fg-muted">
          <a href={row.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
            PR #{row.number} ↗
          </a>
          {record ? <span className="font-mono">{record.branch}</span> : null}
          <CiGlyph ci={row.ci} />
          <MergeableGlyph mergeable={row.mergeable} />
          <span>
            {row.state === "open" ? "updated" : row.state} <TimeAgo iso={row.updatedAt} />
          </span>
          <NeutralBadge>{BUCKET_META[row.bucket].title}</NeutralBadge>
        </p>
      </header>

      {record ? <ReviewStateBanner pr={record} /> : null}

      {shown ? (
        <>
          <VerdictBlock review={shown} />
          <BreakingList review={shown} />
          <FeaturesList review={shown} />
          <AffectedFiles review={shown} repo={repo} headSha={shown.head_sha} />
          <Checklist review={shown} />
          <RelatedPrs review={shown} />
          <Evidence review={shown} pr={record!} />
        </>
      ) : null}

      {record ? (
        record.releaseNotesMarkdown ? (
          <details className="group rounded-card border border-border bg-surface" open={!shown}>
            <summary className="cursor-pointer list-none p-3 text-body font-medium text-fg [&::-webkit-details-marker]:hidden">
              <span aria-hidden="true" className="mr-1.5 inline-block transition-transform group-open:rotate-90">
                ▸
              </span>
              Release notes as fetched by Renovate
              {record.notesTruncated ? (
                <span className="ml-2 text-meta font-normal text-fg-subtle">(truncated by Renovate)</span>
              ) : null}
            </summary>
            <div className="px-3 pb-3">
              <ReleaseNotes
                markdown={record.releaseNotesMarkdown}
                repository={sourceRepository(dep?.sourceUrl) ?? repo}
              />
            </div>
          </details>
        ) : (
          <p className="text-meta text-fg-subtle">Renovate attached no release notes to this PR (digest-only bump).</p>
        )
      ) : (
        <p role="status" className="text-body text-fg-muted">
          The PR record could not be loaded. The inbox row above is from the index; try again later.
        </p>
      )}

      {shown ? <Provenance review={shown} commentUrl={record?.reviewCommentUrl ?? null} /> : null}

      <p className="text-meta text-fg-subtle">AI review is commentary, not a substitute for reading the release notes.</p>
    </PageContainer>
  );
}

/** `https://github.com/grafana/grafana` → `grafana/grafana`, for note autolinks. */
function sourceRepository(url: string | null | undefined): string | null {
  const m = url ? /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)/.exec(url) : null;
  return m?.[1] ?? null;
}
