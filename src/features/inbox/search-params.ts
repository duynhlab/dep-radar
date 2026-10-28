import { AREAS, IMPACTS, UPDATE_TYPES, type Area, type Impact, type UpdateType } from "@/domain/types";

export const SORT_KEYS = ["priority", "age", "dependency"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export interface InboxSearch {
  q: string;
  area: Area | "all";
  type: UpdateType | "all";
  impact: Impact | "all";
  sort: SortKey;
}

export type InboxSearchInput = Partial<Record<keyof InboxSearch, unknown>>;

export const INBOX_SEARCH_DEFAULTS: InboxSearch = {
  q: "",
  area: "all",
  type: "all",
  impact: "all",
  sort: "priority",
};

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T | "all"): T | "all" {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Tolerant: an unknown value falls back to its default instead of erroring. */
export function parseInboxSearch(input: Record<string, unknown>): InboxSearch {
  return {
    q: typeof input.q === "string" ? input.q.slice(0, 80) : "",
    area: oneOf(input.area, AREAS, "all"),
    type: oneOf(input.type, UPDATE_TYPES, "all"),
    impact: oneOf(input.impact, IMPACTS, "all"),
    sort: oneOf(input.sort, SORT_KEYS, "priority") as SortKey,
  };
}

export function isFiltered(search: InboxSearch): boolean {
  return search.q !== "" || search.area !== "all" || search.type !== "all" || search.impact !== "all";
}

export function activeFilterCount(search: InboxSearch): number {
  return [search.area, search.type, search.impact].filter((v) => v !== "all").length;
}

/** Filtered permutations are noindex; the canonical home is always `/`. */
export function canonicalInboxPath(): string {
  return "/";
}
