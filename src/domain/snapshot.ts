import { ReviewSchema, type IndexRow, type PrIndex, type PrRecord, type Review } from "./types.ts";

export const REVIEW_MARKER = "<!-- dep-radar:v1 ";
export const REVIEW_BOT_LOGIN = "github-actions[bot]";

export type ParsedReview =
  | { status: "ok"; review: Review }
  | { status: "invalid"; error: string }
  | { status: "none" };

/**
 * The hidden first line of the review comment is the record of truth. Parse
 * failures are reported, not swallowed: a comment that starts with the marker
 * but does not validate means the homelab validator and this schema disagree,
 * and the site should say so rather than show "not reviewed yet".
 */
export function parseReviewComment(body: string): ParsedReview {
  if (!body.startsWith(REVIEW_MARKER)) return { status: "none" };
  const end = body.indexOf("-->");
  if (end < 0) return { status: "invalid", error: "unterminated marker" };
  let json: unknown;
  try {
    json = JSON.parse(body.slice(REVIEW_MARKER.length, end));
  } catch (err) {
    return { status: "invalid", error: `marker is not JSON: ${err instanceof Error ? err.message : String(err)}` };
  }
  const result = ReviewSchema.safeParse(json);
  if (!result.success) {
    const first = result.error.issues[0];
    return {
      status: "invalid",
      error: first ? `${first.path.join(".") || "$"}: ${first.message}` : "schema mismatch",
    };
  }
  return { status: "ok", review: result.data };
}

export function toIndexRow(pr: PrRecord): IndexRow {
  const review = pr.reviewState === "missing" ? null : pr.review;
  return {
    number: pr.number,
    title: pr.title,
    url: pr.url,
    state: pr.state,
    bucket: pr.bucket,
    dependency: pr.dependency,
    areas: pr.areas,
    mergeable: pr.mergeable,
    ci: pr.ci,
    labels: pr.labels,
    createdAt: pr.createdAt,
    updatedAt: pr.updatedAt,
    reviewState: pr.reviewState,
    impact: review?.impact ?? null,
    verdict: review?.verdict ?? null,
    holdReason: review?.hold_reason ?? null,
    summary: review?.summary ?? null,
    reviewedAt: review?.reviewed_at ?? null,
  };
}

/** Open first, then by number descending; stable across runs. */
export function buildIndex(records: readonly PrRecord[], repo: string, generatedAt: string): PrIndex {
  const prs = [...records]
    .sort((a, b) => Number(b.state === "open") - Number(a.state === "open") || b.number - a.number)
    .map(toIndexRow);
  return { schemaVersion: 1, generatedAt, repo, prs };
}

/** Deterministic serialization: recursively sorted keys, 2-space indent, trailing newline. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value), null, 2) + "\n";
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortKeysDeep(v)]),
    );
  }
  return value;
}

const VOLATILE = new Set(["syncedAt", "generatedAt"]);

/** Equality that ignores the timestamps a no-op sync would otherwise bump. */
export function contentEquals(a: unknown, b: unknown): boolean {
  return stableStringify(strip(a)) === stableStringify(strip(b));
}

function strip(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(strip);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([k]) => !VOLATILE.has(k))
        .map(([k, v]) => [k, strip(v)]),
    );
  }
  return value;
}
