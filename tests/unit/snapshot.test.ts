import { describe, expect, it } from "vitest";
import { REVIEW_MARKER, buildIndex, contentEquals, parseReviewComment, stableStringify } from "@/domain/snapshot";
import type { PrRecord, Review } from "@/domain/types";

const review: Review = {
  schema_version: 1,
  pr: 1426,
  head_sha: "0123456789abcdef0123456789abcdef01234567",
  reviewed_at: "2026-10-28T09:12:00Z",
  prompt_version: 1,
  model: "gpt-5",
  dependency: { name: "grafana/grafana", manager: "docker", update_type: "minor", from: "13.2.3", to: "13.3.0" },
  verdict: "hold",
  hold_reason: "image-level-bootstrap-proof",
  impact: "breaking",
  summary: "bash is gone from the alpine image.",
  breaking: [{ title: "remove bash", relevant: true, why: "compose init uses /bin/bash" }],
  affected_files: [{ path: "local-stack/compose.yaml", role: "compose" }],
  verification: [{ step: "compose up grafana", kind: "runtime" }],
  related_prs: [],
  evidence: [{ label: "notes", url: "https://github.com/grafana/grafana/releases" }],
};

const comment = (json: string) => `${REVIEW_MARKER}${json} -->\n### Dependency review\n`;

describe("parseReviewComment", () => {
  it("parses the hidden JSON on the first line", () => {
    const parsed = parseReviewComment(comment(JSON.stringify(review)));
    expect(parsed.status).toBe("ok");
    if (parsed.status === "ok") expect(parsed.review.impact).toBe("breaking");
  });

  it("is none for ordinary comments", () => {
    expect(parseReviewComment("thanks!").status).toBe("none");
  });

  it("reports a schema mismatch instead of hiding it", () => {
    const parsed = parseReviewComment(comment(JSON.stringify({ ...review, impact: "huge" })));
    expect(parsed.status).toBe("invalid");
    if (parsed.status === "invalid") expect(parsed.error).toContain("impact");
  });

  it("reports malformed JSON", () => {
    expect(parseReviewComment(`${REVIEW_MARKER}{not json -->`).status).toBe("invalid");
    expect(parseReviewComment(`${REVIEW_MARKER}{}`).status).toBe("invalid");
  });
});

function record(overrides: Partial<PrRecord>): PrRecord {
  return {
    schemaVersion: 1,
    syncedAt: "2026-10-28T10:00:00Z",
    number: 1,
    title: "chore(deps): update x",
    url: "https://github.com/duynhlab/homelab/pull/1",
    branch: "renovate/x",
    author: "renovate[bot]",
    state: "open",
    isDraft: false,
    headSha: review.head_sha,
    mergeable: "MERGEABLE",
    ci: "SUCCESS",
    labels: [],
    files: [],
    areas: [],
    createdAt: "2026-10-27T00:00:00Z",
    updatedAt: "2026-10-28T00:00:00Z",
    mergedAt: null,
    closedAt: null,
    dependency: null,
    releaseNotesMarkdown: null,
    notesTruncated: false,
    review: null,
    reviewState: "missing",
    reviewError: null,
    reviewCommentUrl: null,
    bucket: "waiting",
    ...overrides,
  };
}

describe("buildIndex", () => {
  it("puts open PRs first, newest number first, and projects the review", () => {
    const index = buildIndex(
      [
        record({ number: 3, state: "merged", bucket: "merged" }),
        record({ number: 1 }),
        record({ number: 2, review, reviewState: "fresh", bucket: "breaking" }),
      ],
      "duynhlab/homelab",
      "2026-10-28T10:00:00Z",
    );
    expect(index.prs.map((p) => p.number)).toEqual([2, 1, 3]);
    expect(index.prs[0]).toMatchObject({ impact: "breaking", verdict: "hold", holdReason: "image-level-bootstrap-proof" });
    expect(index.prs[1]).toMatchObject({ impact: null, summary: null });
  });
});

describe("stableStringify / contentEquals", () => {
  it("sorts keys recursively and ends with a newline", () => {
    expect(stableStringify({ b: 1, a: { d: 2, c: 3 } })).toBe('{\n  "a": {\n    "c": 3,\n    "d": 2\n  },\n  "b": 1\n}\n');
  });

  it("ignores the volatile timestamps", () => {
    expect(contentEquals({ a: 1, syncedAt: "x" }, { a: 1, syncedAt: "y" })).toBe(true);
    expect(contentEquals({ a: 1, generatedAt: "x" }, { a: 2, generatedAt: "x" })).toBe(false);
  });
});
