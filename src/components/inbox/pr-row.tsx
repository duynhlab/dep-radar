import { Link } from "@tanstack/react-router";
import { AreaBadge, ImpactBadge, NeutralBadge, UpdateTypeBadge } from "@/components/ui/badge";
import { CiGlyph, MergeableGlyph } from "@/components/ui/status-glyph";
import { TimeAgo } from "@/components/ui/time-ago";
import type { IndexRow } from "@/domain/types";

/**
 * One pull request as a three-line record, not a card. The whole row
 * navigates through a stretched link on the PR number; the GitHub link sits
 * above it on z-10 so the two never nest.
 */
export function PrRow({ pr }: { pr: IndexRow }) {
  const dep = pr.dependency;
  const reviewHint =
    pr.reviewState === "stale"
      ? "Review is for an earlier commit"
      : pr.reviewState === "missing"
        ? "Not reviewed yet"
        : null;

  return (
    <li className="relative border-b border-border last:border-b-0 hover:bg-surface-hover">
      <div className="flex flex-col gap-1 px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to="/prs/$number"
            params={{ number: String(pr.number) }}
            className="font-mono text-meta text-fg-muted after:absolute after:inset-0 after:content-['']"
            aria-label={`Open review of pull request ${pr.number}`}
          >
            #{pr.number}
          </Link>
          <span className="min-w-0 truncate text-body font-medium text-fg">{dep?.name ?? pr.title}</span>
          {dep ? (
            <span className="font-mono text-version text-fg" title={`${dep.from} → ${dep.to}`}>
              {dep.from} → {dep.to}
            </span>
          ) : null}
          {dep ? <UpdateTypeBadge type={dep.updateType} /> : null}
          {pr.impact ? <ImpactBadge impact={pr.impact} /> : <NeutralBadge>{reviewHint ?? "unreviewed"}</NeutralBadge>}
        </div>

        <p className="line-clamp-1 text-body text-fg-muted">
          {pr.summary ?? reviewHint ?? pr.title}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {pr.areas.length ? (
            <span className="relative z-10 flex flex-wrap gap-1">
              {pr.areas.map((area) => (
                <AreaBadge key={area} area={area} asLink />
              ))}
            </span>
          ) : null}
          <CiGlyph ci={pr.ci} />
          <MergeableGlyph mergeable={pr.mergeable} />
          <TimeAgo iso={pr.updatedAt} className="text-meta text-fg-subtle" />
          <a
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            className="relative z-10 ml-auto text-meta text-accent hover:underline"
            aria-label={`Pull request ${pr.number} on GitHub`}
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </li>
  );
}
