import { UPDATE_TYPES, type Dependency, type UpdateType } from "./types.ts";

/**
 * What can be read from Renovate's own PR body without any AI: the update
 * table at the top and the release-notes section it fetched. Used as the
 * fallback identity of a PR that has no review yet, and as the source of the
 * notes the detail page renders.
 */

const LINK = /\[([^\]]+)\]\([^)]*\)/g;
const CODE = /`([^`]*)`/g;

function plain(cell: string): string {
  return cell.replace(LINK, "$1").replace(CODE, "$1").trim();
}

function stripSource(cell: string): string {
  // "[grafana](https://…) ([source](https://…))" → "grafana"
  return plain(cell.replace(/\(\s*\[source\][^)]*\)\s*\)/i, "")).replace(/\s*\(\s*\)$/, "").trim();
}

function firstLinkUrl(cell: string): string | null {
  const m = /\[[^\]]+\]\((https?:\/\/[^)\s]+)\)/.exec(cell);
  if (!m?.[1]) return null;
  // Renovate routes links through redirect.github.com; keep the real host.
  return m[1].replace("https://redirect.github.com/", "https://github.com/");
}

function asUpdateType(cell: string): UpdateType | null {
  const value = plain(cell).toLowerCase();
  return (UPDATE_TYPES as readonly string[]).includes(value) ? (value as UpdateType) : null;
}

/**
 * Parses the first row of the update table. Renovate emits either
 * `| Package | Update | Change |` or `| Package | Type | Update | Change |`,
 * and the Change cell reads `` `13.2.3` → `13.3.0` `` (or a digest).
 */
export function parseDependency(body: string): Dependency | null {
  const lines = body.split(/\r?\n/);
  const header = lines.findIndex((l) => /^\|\s*Package\s*\|/i.test(l));
  if (header < 0) return null;
  const columns = lines[header]!.split("|").map((c) => c.trim().toLowerCase());
  const row = lines[header + 2];
  if (!row || !row.startsWith("|")) return null;
  const cells = row.split("|").map((c) => c.trim());
  // split("|") on "| a | b |" yields ["", "a", "b", ""], so columns and cells line up.
  const col = (name: string) => {
    const i = columns.indexOf(name);
    return i >= 0 ? (cells[i] ?? "") : "";
  };
  const name = stripSource(col("package"));
  const updateType = asUpdateType(col("update"));
  const change = plain(col("change"));
  const arrow = change.split(/\s*(?:→|->)\s*/);
  const from = arrow[0]?.trim() ?? "";
  const to = arrow[1]?.trim() ?? "";
  if (!name || !updateType || !from || !to) return null;
  return { name, updateType, from, to, sourceUrl: firstLinkUrl(col("package")) };
}

/**
 * The `### Release Notes` section as Renovate wrote it, `<details>` wrappers
 * and all. The renderer runs with raw HTML off, so those tags show up as
 * literal text; they are stripped here instead so the notes read cleanly.
 * Returns null when the body has no notes (digest bumps).
 */
export function extractReleaseNotes(body: string): string | null {
  const start = body.search(/^### Release Notes\s*$/m);
  if (start < 0) return null;
  const afterHeading = body.indexOf("\n", start) + 1;
  const rest = body.slice(afterHeading);
  const end = rest.search(/^---\s*$/m);
  const section = (end >= 0 ? rest.slice(0, end) : rest)
    .replace(/<details>\s*/g, "")
    .replace(/<\/details>\s*/g, "")
    .replace(/<summary>([^<]*)<\/summary>/g, "### $1")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return section.length > 0 ? section : null;
}

/** Renovate caps the body and says so in a note/warning block. */
export function isTruncated(body: string): boolean {
  return /truncat/i.test(body) && /\[!(NOTE|WARNING)\]/.test(body);
}

/** `renovate/grafana-monorepo` → `grafana-monorepo`, a stable per-dependency slug. */
export function dependencySlug(branch: string, name: string): string {
  const base = branch.startsWith("renovate/") ? branch.slice("renovate/".length) : name;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
