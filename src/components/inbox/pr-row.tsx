import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { AreaBadge, ImpactBadge, ReviewStateBadge, UpdateTypeBadge } from "@/components/app/status-badge";
import { CiIcon, MergeableIcon } from "@/components/app/status-icon";
import { Button } from "@/components/ui/button";
import { TimeAgo } from "@/components/ui/time-ago";
import type { IndexRow } from "@/domain/types";

const MAX_AREAS = 2;

/**
 * One pull request as a two-line record in a divided list, the way the
 * backoffice renders orders: the dependency is the one interactive cell,
 * identifiers are mono, numbers are tabular, and nothing but the link changes
 * on hover.
 */
export function PrRow({ pr }: { pr: IndexRow }) {
  const dep = pr.dependency;
  const extraAreas = pr.areas.length - MAX_AREAS;
  const subline =
    pr.summary ??
    (pr.reviewState === "stale"
      ? "The review is for an earlier commit; the workflow re-runs on every push."
      : pr.reviewState === "missing"
        ? pr.title
        : null);

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 px-4 py-2.5 text-sm lg:grid-cols-[4.5rem_minmax(0,1fr)_auto]">
      <span className="pt-0.5 font-mono text-xs text-muted-foreground tabular-nums" data-numeric="">
        #{pr.number}
      </span>

      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            to="/prs/$number"
            params={{ number: String(pr.number) }}
            className="truncate font-medium underline-offset-2 hover:underline"
          >
            {dep?.name ?? pr.title}
          </Link>
          {dep ? (
            <span className="font-mono text-xs text-muted-foreground tabular-nums" data-numeric="">
              {dep.from} → {dep.to}
            </span>
          ) : null}
          {dep ? <UpdateTypeBadge type={dep.updateType} /> : null}
          {pr.impact && pr.reviewState === "fresh" ? (
            <ImpactBadge impact={pr.impact} />
          ) : pr.state === "open" ? (
            <ReviewStateBadge state={pr.reviewState} />
          ) : null}
        </div>
        {subline ? <p className="truncate text-xs text-muted-foreground">{subline}</p> : null}
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground lg:col-span-1 lg:justify-end">
        {pr.areas.length ? (
          <span className="flex items-center gap-1">
            {pr.areas.slice(0, MAX_AREAS).map((area) => (
              <AreaBadge key={area} area={area} />
            ))}
            {extraAreas > 0 ? <span className="tabular-nums">+{extraAreas}</span> : null}
          </span>
        ) : null}
        <span className="flex items-center gap-1.5">
          <CiIcon ci={pr.ci} />
          <MergeableIcon mergeable={pr.mergeable} />
        </span>
        <TimeAgo iso={pr.updatedAt} className="tabular-nums" />
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Pull request ${pr.number} on GitHub`}
          render={<a href={pr.url} target="_blank" rel="noreferrer" />}
        >
          <ExternalLink aria-hidden />
        </Button>
      </div>
    </li>
  );
}
