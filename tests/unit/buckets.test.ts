import { describe, expect, it } from "vitest";
import { deriveBucket } from "@/domain/buckets";

const base = {
  state: "open" as const,
  labels: [] as string[],
  mergeable: "MERGEABLE" as const,
  ci: "SUCCESS" as const,
  reviewState: "fresh" as const,
  review: { impact: "none" as const, verdict: "safe-static" as const },
};

describe("deriveBucket", () => {
  it("history buckets win over everything", () => {
    expect(deriveBucket({ ...base, state: "merged", labels: ["hold"] })).toBe("merged");
    expect(deriveBucket({ ...base, state: "closed", review: { impact: "breaking", verdict: "hold" } })).toBe("closed");
  });

  it("the owner's hold label beats any AI verdict", () => {
    expect(deriveBucket({ ...base, labels: ["hold"], review: { impact: "breaking", verdict: "hold" } })).toBe("owner-hold");
  });

  it("no fresh review → waiting, unless CI or conflicts block it", () => {
    expect(deriveBucket({ ...base, reviewState: "missing", review: null })).toBe("waiting");
    expect(deriveBucket({ ...base, reviewState: "stale", review: { impact: "none", verdict: "safe-static" } })).toBe("waiting");
    expect(deriveBucket({ ...base, reviewState: "missing", review: null, ci: "FAILURE" })).toBe("blocked");
    expect(deriveBucket({ ...base, reviewState: "missing", review: null, mergeable: "CONFLICTING" })).toBe("blocked");
  });

  it("breaking needs a decision even when CI is red", () => {
    expect(deriveBucket({ ...base, ci: "FAILURE", review: { impact: "breaking", verdict: "hold" } })).toBe("breaking");
  });

  it("hold verdicts and minor impact go to verify", () => {
    expect(deriveBucket({ ...base, review: { impact: "minor", verdict: "safe-static" } })).toBe("verify");
    expect(deriveBucket({ ...base, review: { impact: "none", verdict: "hold" } })).toBe("verify");
  });

  it("none + green + mergeable is ready; none + red is blocked", () => {
    expect(deriveBucket(base)).toBe("ready");
    expect(deriveBucket({ ...base, ci: "PENDING" })).toBe("ready");
    expect(deriveBucket({ ...base, ci: "ERROR" })).toBe("blocked");
    expect(deriveBucket({ ...base, mergeable: "CONFLICTING" })).toBe("blocked");
  });
});
