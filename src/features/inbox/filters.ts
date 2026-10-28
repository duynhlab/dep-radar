import { BUCKETS, type Bucket, type IndexRow } from "@/domain/types";
import type { InboxSearch } from "./search-params";

const IMPACT_RANK = { breaking: 0, minor: 1, none: 2 } as const;

export function matchesSearch(pr: IndexRow, search: InboxSearch): boolean {
  if (search.area !== "all" && !pr.areas.includes(search.area)) return false;
  if (search.type !== "all" && pr.dependency?.updateType !== search.type) return false;
  if (search.impact !== "all" && pr.impact !== search.impact) return false;
  if (search.q) {
    const q = search.q.trim().toLowerCase().replace(/^#/, "");
    if (!q) return true;
    const hay = `${pr.number} ${pr.dependency?.name ?? ""} ${pr.title}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function sortRows(rows: readonly IndexRow[], sort: InboxSearch["sort"]): IndexRow[] {
  const copy = [...rows];
  switch (sort) {
    case "age":
      return copy.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt) || a.number - b.number);
    case "dependency":
      return copy.sort(
        (a, b) => (a.dependency?.name ?? "").localeCompare(b.dependency?.name ?? "") || b.number - a.number,
      );
    case "priority":
    default:
      // Within a bucket: breaking first, then the longest-waiting.
      return copy.sort(
        (a, b) =>
          IMPACT_RANK[a.impact ?? "none"] - IMPACT_RANK[b.impact ?? "none"] ||
          a.updatedAt.localeCompare(b.updatedAt) ||
          a.number - b.number,
      );
  }
}

/** Open rows grouped by bucket in BUCKETS order, after filter and sort. */
export function groupOpen(rows: readonly IndexRow[], search: InboxSearch): Map<Bucket, IndexRow[]> {
  const groups = new Map<Bucket, IndexRow[]>(BUCKETS.map((b) => [b, []]));
  for (const pr of rows) {
    if (pr.state !== "open") continue;
    if (!matchesSearch(pr, search)) continue;
    groups.get(pr.bucket)!.push(pr);
  }
  for (const [bucket, list] of groups) groups.set(bucket, sortRows(list, search.sort));
  return groups;
}

export interface InboxCounts {
  open: number;
  decide: number;
  ready: number;
  waiting: number;
}

export function countOpen(rows: readonly IndexRow[]): InboxCounts {
  const open = rows.filter((pr) => pr.state === "open");
  return {
    open: open.length,
    decide: open.filter((pr) => pr.bucket === "breaking").length,
    ready: open.filter((pr) => pr.bucket === "ready").length,
    waiting: open.filter((pr) => pr.bucket === "waiting").length,
  };
}
