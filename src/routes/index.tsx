import { createFileRoute, stripSearchParams, type SearchSchemaInput } from "@tanstack/react-router";
import { PageContainer } from "@/components/layout/page-container";
import { PageTitle } from "@/components/ui/page-title";
import { InboxSkeleton } from "@/components/ui/skeleton";
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
import { formatDate } from "@/lib/dates";
import { buildMeta, canonicalLink } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/")({
  validateSearch: (input: InboxSearchInput & SearchSchemaInput): InboxSearch =>
    parseInboxSearch(input as Record<string, unknown>),
  search: { middlewares: [stripSearchParams(INBOX_SEARCH_DEFAULTS)] },
  loader: () => {
    const index = getIndex();
    return { rows: index.prs, generatedAt: index.generatedAt, repo: index.repo };
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
  const { rows, generatedAt, repo } = Route.useLoaderData();
  const search = Route.useSearch();
  return (
    <PageContainer width="grid" className="space-y-6">
      <PageTitle
        title="Renovate inbox"
        meta={
          <>
            Every open Renovate pull request on {repo}, grouped by what it needs from you. Synced{" "}
            <time dateTime={generatedAt}>{formatDate(generatedAt)}</time>.
          </>
        }
      />
      <Inbox rows={rows} search={search} />
    </PageContainer>
  );
}
