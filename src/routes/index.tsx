import { createFileRoute, retainSearchParams, stripSearchParams, type SearchSchemaInput } from "@tanstack/react-router";
import { InboxSkeleton } from "@/components/inbox/inbox-skeleton";
import { getIndex } from "@/data/index";
import { Inbox } from "@/features/inbox/inbox";
import {
  INBOX_SEARCH_DEFAULTS,
  canonicalInboxPath,
  isFiltered,
  parseInboxSearch,
  type InboxSearch,
  type InboxSearchInput,
} from "@/features/inbox/search-params";
import { buildMeta, canonicalLink } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/")({
  validateSearch: (input: InboxSearchInput & SearchSchemaInput): InboxSearch =>
    parseInboxSearch(input as Record<string, unknown>),
  // Filters survive a detour into a PR page; defaults never reach the URL.
  search: { middlewares: [retainSearchParams(["area", "type", "impact", "sort"]), stripSearchParams(INBOX_SEARCH_DEFAULTS)] },
  loader: () => {
    const index = getIndex();
    return { rows: index.prs, repo: index.repo };
  },
  head: ({ match }) => ({
    meta: buildMeta({
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      canonical: absoluteUrl(canonicalInboxPath()),
      noindex: isFiltered(match.search),
    }),
    links: [canonicalLink(absoluteUrl(canonicalInboxPath()))],
  }),
  pendingComponent: () => <InboxSkeleton />,
  component: InboxPage,
});

function InboxPage() {
  const { rows, repo } = Route.useLoaderData();
  const search = Route.useSearch();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Renovate inbox</h1>
        <p className="text-sm text-muted-foreground">
          Every open Renovate pull request on {repo}, grouped by what it needs from you.
        </p>
      </div>
      <Inbox rows={rows} search={search} />
      <p className="text-xs text-muted-foreground">
        AI reviews are commentary, not a substitute for reading the release notes.
      </p>
    </div>
  );
}
