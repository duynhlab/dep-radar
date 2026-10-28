import { CircleCheck, CircleDashed, CircleX, GitMerge, GitPullRequestClosed, type LucideIcon } from "lucide-react";
import type { PrRecord } from "@/domain/types";
import { cn } from "@/lib/utils";

/**
 * CI and mergeability as one Lucide icon each, with the state as a visually
 * hidden word so the meaning never rides on colour alone.
 */

function StatusIcon({ icon: Icon, label, className }: { icon: LucideIcon; label: string; className?: string }) {
  return (
    <span className="inline-flex items-center" title={label}>
      <Icon className={cn("size-3.5 shrink-0", className)} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function CiIcon({ ci }: { ci: PrRecord["ci"] }) {
  if (ci === "SUCCESS") return <StatusIcon icon={CircleCheck} label="CI passing" className="text-success" />;
  if (ci === "FAILURE" || ci === "ERROR") return <StatusIcon icon={CircleX} label="CI failing" className="text-destructive" />;
  if (ci === "PENDING" || ci === "EXPECTED") return <StatusIcon icon={CircleDashed} label="CI pending" className="text-muted-foreground" />;
  return <StatusIcon icon={CircleDashed} label="No CI status" className="text-muted-foreground/60" />;
}

export function MergeableIcon({ mergeable }: { mergeable: PrRecord["mergeable"] }) {
  if (mergeable === "MERGEABLE") return <StatusIcon icon={GitMerge} label="No conflicts" className="text-success" />;
  if (mergeable === "CONFLICTING") return <StatusIcon icon={GitPullRequestClosed} label="Merge conflicts" className="text-destructive" />;
  return <StatusIcon icon={GitMerge} label="Mergeability unknown" className="text-muted-foreground/60" />;
}

export function ciLabel(ci: PrRecord["ci"]): string {
  if (ci === "SUCCESS") return "passing";
  if (ci === "FAILURE" || ci === "ERROR") return "failing";
  if (ci === "PENDING" || ci === "EXPECTED") return "pending";
  return "no status";
}

export function mergeableLabel(mergeable: PrRecord["mergeable"]): string {
  if (mergeable === "MERGEABLE") return "no conflicts";
  if (mergeable === "CONFLICTING") return "conflicts";
  return "unknown";
}
