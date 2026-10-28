import type { Bucket, PrRecord, Review } from "./types.ts";

export const OWNER_HOLD_LABEL = "hold";

type BucketInput = Pick<PrRecord, "state" | "labels" | "mergeable" | "ci" | "reviewState"> & {
  review: Pick<Review, "impact" | "verdict"> | null;
};

/**
 * One bucket per PR, decided here and stored in the data so the site stays a
 * pure function of `data/`.
 *
 * The owner's `hold` label beats every AI verdict: it is an explicit human
 * decision recorded on the audit issue, and an inbox that kept nagging about a
 * PR the owner already parked would train the reader to ignore it.
 */
export function deriveBucket(pr: BucketInput): Bucket {
  if (pr.state === "merged") return "merged";
  if (pr.state === "closed") return "closed";
  if (pr.labels.includes(OWNER_HOLD_LABEL)) return "owner-hold";

  const blocked = pr.ci === "FAILURE" || pr.ci === "ERROR" || pr.mergeable === "CONFLICTING";
  const review = pr.reviewState === "fresh" ? pr.review : null;
  if (!review) return blocked ? "blocked" : "waiting";

  if (review.impact === "breaking") return "breaking";
  if (review.verdict === "hold" || review.impact === "minor") return "verify";
  return blocked ? "blocked" : "ready";
}
