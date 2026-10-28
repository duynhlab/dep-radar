import { TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AREA_LABELS,
  BUCKET_META,
  HOLD_REASON_LABELS,
  type Area,
  type Bucket,
  type Impact,
  type IndexRow,
  type Review,
  type UpdateType,
} from "@/domain/types";
import { cn } from "@/lib/utils";

/**
 * Every status rendered through the one Badge, mapped the way the backoffice
 * maps order status: attention → destructive tint, warning → amber text on an
 * outline, finished-good → quiet secondary, everything else → outline.
 * Colour is reserved for meaning; areas and update types stay neutral.
 */

export function ImpactBadge({ impact, className }: { impact: Impact; className?: string }) {
  if (impact === "breaking") {
    return (
      <Badge variant="destructive" className={className}>
        <TriangleAlert aria-hidden />
        breaking
      </Badge>
    );
  }
  if (impact === "minor") {
    return (
      <Badge variant="outline" className={cn("text-warning-on-tint", className)}>
        minor
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className={className}>
      no impact
    </Badge>
  );
}

/** What the row shows when there is no fresh review to summarise. */
export function ReviewStateBadge({ state }: { state: IndexRow["reviewState"] }) {
  return (
    <Badge variant="outline" className="text-muted-foreground">
      {state === "stale" ? "review outdated" : "unreviewed"}
    </Badge>
  );
}

export function UpdateTypeBadge({ type }: { type: UpdateType }) {
  return <Badge variant="outline">{type}</Badge>;
}

export function AreaBadge({ area }: { area: Area }) {
  return <Badge variant="outline">{AREA_LABELS[area]}</Badge>;
}

export function BucketBadge({ bucket }: { bucket: Bucket }) {
  const variant = bucket === "breaking" ? "destructive" : bucket === "ready" || bucket === "merged" ? "secondary" : "outline";
  return <Badge variant={variant}>{BUCKET_META[bucket].title}</Badge>;
}

export function verdictLabel(review: Pick<Review, "verdict" | "hold_reason">): string {
  if (review.verdict === "hold") return `Hold — ${HOLD_REASON_LABELS[review.hold_reason ?? "other"]}`;
  if (review.verdict === "safe-static") return "Safe (static)";
  return "Safe for repository use (static)";
}
