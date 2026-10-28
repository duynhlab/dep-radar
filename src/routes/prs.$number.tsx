import { createFileRoute, notFound, useRouter } from "@tanstack/react-router";
import { ExternalLink, MessageSquare } from "lucide-react";
import { DetailHeader, Field, FieldGrid, Section } from "@/components/app/detail";
import { AreaBadge, BucketBadge, ImpactBadge, ReviewStateBadge, UpdateTypeBadge, verdictLabel } from "@/components/app/status-badge";
import { CiIcon, MergeableIcon, ciLabel, mergeableLabel } from "@/components/app/status-icon";
import { NotFound } from "@/components/layout/not-found";
import { ReleaseNotes } from "@/components/releases/release-notes";
import {
  AffectedSection,
  BreakingSection,
  ChecklistSection,
  EvidenceSection,
  FeaturesSection,
  Provenance,
  RelatedSection,
  ReviewStateBanner,
  SummarySection,
} from "@/components/review/review-sections";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeAgo } from "@/components/ui/time-ago";
import { getIndex, getRow } from "@/data/index";
import { loadPrRecord } from "@/data/pr-record";
import { buildMeta, canonicalLink } from "@/lib/seo";
import { absoluteUrl, pageTitle } from "@/lib/site";

export const Route = createFileRoute("/prs/$number")({
  loader: async ({ params: { number } }) => {
    const n = Number.parseInt(number, 10);
    const row = Number.isInteger(n) ? getRow(n) : undefined;
    if (!row) throw notFound();
    const result = await loadPrRecord(n);
    return { row, repo: getIndex().repo, record: result.status === "ok" ? result.record : null };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: pageTitle("Pull request not found") }] };
    const { row } = loaderData;
    const dep = row.dependency;
    const title = dep ? `${dep.name} ${dep.from} → ${dep.to}` : row.title;
    const canonical = absoluteUrl(`/prs/${row.number}`);
    return {
      meta: buildMeta({ title: pageTitle(`#${row.number} ${title}`), description: row.summary ?? row.title, canonical }),
      links: [canonicalLink(canonical)],
    };
  },
  pendingComponent: () => (
    <div role="status" aria-label="Loading pull request" aria-busy className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-7 w-72" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  ),
  notFoundComponent: () => <NotFound kind="pr" />,
  component: PrPage,
});

function PrPage() {
  const { row, repo, record } = Route.useLoaderData();
  const router = useRouter();
  const dep = row.dependency;
  const shown = record && record.reviewState !== "missing" ? record.review : null;
  const backTo = row.state === "open" ? "/" : "/history";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <DetailHeader
        backTo={backTo}
        backLabel={row.state === "open" ? "Inbox" : "History"}
        title={dep?.name ?? row.title}
        titleAside={
          dep ? (
            <span className="font-mono text-sm text-muted-foreground tabular-nums" data-numeric="">
              {dep.from} → {dep.to}
            </span>
          ) : undefined
        }
        badge={row.impact && row.reviewState === "fresh" ? <ImpactBadge impact={row.impact} /> : <ReviewStateBadge state={row.reviewState} />}
        actions={
          <>
            {record?.reviewCommentUrl ? (
              <Button variant="ghost" size="sm" render={<a href={record.reviewCommentUrl} target="_blank" rel="noreferrer" />}>
                <MessageSquare aria-hidden />
                Comment
              </Button>
            ) : null}
            <Button variant="outline" size="sm" render={<a href={row.url} target="_blank" rel="noreferrer" />}>
              <ExternalLink aria-hidden />
              Open PR #{row.number}
            </Button>
          </>
        }
      />

      <FieldGrid>
        <Field label="Update">{dep ? <UpdateTypeBadge type={dep.updateType} /> : null}</Field>
        <Field label="Verdict">{shown ? verdictLabel(shown) : null}</Field>
        <Field label="Bucket">
          <BucketBadge bucket={row.bucket} />
        </Field>
        <Field label="Areas">
          {row.areas.length ? (
            <span className="flex flex-wrap gap-1">
              {row.areas.map((a) => (
                <AreaBadge key={a} area={a} />
              ))}
            </span>
          ) : null}
        </Field>
        <Field label="CI">
          <span className="inline-flex items-center gap-1.5">
            <CiIcon ci={row.ci} />
            {ciLabel(row.ci)}
          </span>
        </Field>
        <Field label="Mergeable">
          <span className="inline-flex items-center gap-1.5">
            <MergeableIcon mergeable={row.mergeable} />
            {mergeableLabel(row.mergeable)}
          </span>
        </Field>
        <Field label={row.state === "open" ? "Updated" : row.state === "merged" ? "Merged" : "Closed"}>
          <TimeAgo iso={row.updatedAt} />
        </Field>
        <Field label="Branch">
          {record ? <span className="font-mono text-xs">{record.branch}</span> : null}
        </Field>
      </FieldGrid>

      {record ? <ReviewStateBanner pr={record} /> : null}

      {shown && record ? (
        <>
          <SummarySection review={shown} />
          <BreakingSection review={shown} />
          <FeaturesSection review={shown} />
          <AffectedSection review={shown} repo={repo} headSha={shown.head_sha} />
          <ChecklistSection review={shown} />
          <RelatedSection review={shown} />
          <EvidenceSection review={shown} pr={record} />
        </>
      ) : null}

      {record ? (
        record.releaseNotesMarkdown ? (
          <Section
            id="notes"
            title="Release notes"
            explainer={
              record.notesTruncated
                ? "As fetched by Renovate; truncated by Renovate in the PR body."
                : "As fetched by Renovate into the pull request body."
            }
          >
            <details className="group rounded-xl border bg-card" open={!shown}>
              <summary className="cursor-pointer list-none p-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
                <span aria-hidden className="mr-1.5 inline-block transition-transform group-open:rotate-90">
                  ▸
                </span>
                {shown ? "Show the release notes" : "Release notes"}
              </summary>
              <div className="border-t px-4 py-4">
                <ReleaseNotes markdown={record.releaseNotesMarkdown} repository={sourceRepository(dep?.sourceUrl) ?? repo} />
              </div>
            </details>
          </Section>
        ) : (
          <p className="text-xs text-muted-foreground">Renovate attached no release notes to this PR (digest-only bump).</p>
        )
      ) : (
        <div className="flex flex-col items-start gap-2 rounded-xl border bg-card p-4">
          <p className="text-sm text-destructive">The PR record could not be loaded.</p>
          <Button variant="outline" size="sm" onClick={() => void router.invalidate()}>
            Retry
          </Button>
        </div>
      )}

      {shown ? <Provenance review={shown} commentUrl={record?.reviewCommentUrl ?? null} /> : null}
      <p className="text-xs text-muted-foreground">AI review is commentary, not a substitute for reading the release notes.</p>
    </div>
  );
}

/** `https://github.com/grafana/grafana` → `grafana/grafana`, for note autolinks. */
function sourceRepository(url: string | null | undefined): string | null {
  const m = url ? /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)/.exec(url) : null;
  return m?.[1] ?? null;
}
