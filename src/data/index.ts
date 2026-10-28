import { prIndex } from "../generated/index.ts";
import { BUCKETS, type Bucket, type IndexRow, type PrIndex } from "../domain/types.ts";

// Isomorphic index access. No I/O, no Zod at runtime: the generated module was
// validated at generation time. Small enough to ship to both the worker and
// the client, which buys zero-network navigation and 404 decisions without a
// round trip. Release notes stay out of it (see src/data/pr-record.ts).

const byNumber = new Map<number, IndexRow>(prIndex.prs.map((pr) => [pr.number, pr]));

export function getIndex(): PrIndex {
  return prIndex;
}

export function getRow(number: number): IndexRow | undefined {
  return byNumber.get(number);
}

/** Open PRs grouped by bucket, in BUCKETS order; empty buckets included. */
export function getOpenByBucket(): Map<Bucket, IndexRow[]> {
  const groups = new Map<Bucket, IndexRow[]>(BUCKETS.map((b) => [b, []]));
  for (const pr of prIndex.prs) {
    if (pr.state === "open") groups.get(pr.bucket)!.push(pr);
  }
  return groups;
}

/** Rows that share a dependency slug, newest first. */
export function getRowsByDependency(name: string): IndexRow[] {
  return prIndex.prs.filter((pr) => pr.dependency?.name === name).sort((a, b) => b.number - a.number);
}
