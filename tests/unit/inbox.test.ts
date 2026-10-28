import { describe, expect, it } from "vitest";
import type { IndexRow } from "@/domain/types";
import { countOpen, groupOpen, matchesSearch, sortRows } from "@/features/inbox/filters";
import { INBOX_SEARCH_DEFAULTS, activeFilterCount, isFiltered, parseInboxSearch } from "@/features/inbox/search-params";

function row(overrides: Partial<IndexRow>): IndexRow {
  return {
    number: 1,
    title: "chore(deps): update grafana/grafana docker tag to v13.3.0",
    url: "https://github.com/duynhlab/homelab/pull/1",
    state: "open",
    bucket: "ready",
    dependency: { name: "grafana/grafana", updateType: "minor", from: "13.2.3", to: "13.3.0", sourceUrl: null },
    areas: ["monitoring"],
    mergeable: "MERGEABLE",
    ci: "SUCCESS",
    labels: [],
    createdAt: "2026-10-27T00:00:00Z",
    updatedAt: "2026-10-28T00:00:00Z",
    reviewState: "fresh",
    impact: "none",
    verdict: "safe-static",
    holdReason: null,
    summary: null,
    reviewedAt: null,
    ...overrides,
  };
}

describe("parseInboxSearch", () => {
  it("falls back to defaults for unknown values", () => {
    expect(parseInboxSearch({ area: "nope", type: "huge", impact: 3, sort: "x", q: 42 })).toEqual(INBOX_SEARCH_DEFAULTS);
  });
  it("keeps valid values and caps the query", () => {
    const s = parseInboxSearch({ area: "databases", type: "major", impact: "breaking", sort: "age", q: "x".repeat(100) });
    expect(s).toMatchObject({ area: "databases", type: "major", impact: "breaking", sort: "age" });
    expect(s.q).toHaveLength(80);
    expect(isFiltered(s)).toBe(true);
    expect(activeFilterCount(s)).toBe(3);
  });
});

describe("matchesSearch", () => {
  const pr = row({ number: 1426 });
  it("matches number with or without the hash, and the dependency name", () => {
    expect(matchesSearch(pr, { ...INBOX_SEARCH_DEFAULTS, q: "#1426" })).toBe(true);
    expect(matchesSearch(pr, { ...INBOX_SEARCH_DEFAULTS, q: "142" })).toBe(true);
    expect(matchesSearch(pr, { ...INBOX_SEARCH_DEFAULTS, q: "GRAFANA" })).toBe(true);
    expect(matchesSearch(pr, { ...INBOX_SEARCH_DEFAULTS, q: "keycloak" })).toBe(false);
  });
  it("filters by area, type and impact", () => {
    expect(matchesSearch(pr, { ...INBOX_SEARCH_DEFAULTS, area: "databases" })).toBe(false);
    expect(matchesSearch(pr, { ...INBOX_SEARCH_DEFAULTS, type: "minor" })).toBe(true);
    expect(matchesSearch(pr, { ...INBOX_SEARCH_DEFAULTS, impact: "breaking" })).toBe(false);
  });
});

describe("sortRows and groupOpen", () => {
  const rows = [
    row({ number: 1, impact: "none", updatedAt: "2026-10-28T00:00:00Z" }),
    row({ number: 2, impact: "breaking", bucket: "breaking", updatedAt: "2026-10-27T00:00:00Z" }),
    row({ number: 3, impact: "minor", bucket: "verify", updatedAt: "2026-10-20T00:00:00Z" }),
    row({ number: 4, state: "merged", bucket: "merged" }),
  ];
  it("priority puts breaking first, then the longest waiting", () => {
    expect(sortRows(rows, "priority").map((r) => r.number)).toEqual([2, 3, 1, 4]);
  });
  it("age sorts oldest update first", () => {
    expect(sortRows(rows, "age").map((r) => r.number)).toEqual([3, 2, 1, 4]);
  });
  it("groupOpen drops history and keeps every bucket key", () => {
    const groups = groupOpen(rows, INBOX_SEARCH_DEFAULTS);
    expect(groups.get("merged")).toEqual([]);
    expect(groups.get("breaking")?.map((r) => r.number)).toEqual([2]);
    expect(groups.get("ready")?.map((r) => r.number)).toEqual([1]);
  });
  it("countOpen counts only open rows", () => {
    expect(countOpen(rows)).toEqual({ open: 3, decide: 1, ready: 1, waiting: 0 });
  });
});
