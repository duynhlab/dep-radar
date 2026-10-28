import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { stableStringify } from "../../src/domain/snapshot.ts";
import { IndexSchema, type PrIndex } from "../../src/domain/types.ts";

const INDEX_PATH = path.join(process.cwd(), "data", "index.json");
const OUT_PATH = path.join(process.cwd(), "src", "generated", "index.ts");

/**
 * Emit data/index.json as a typed TS module the worker and the client both
 * import. Validated here with IndexSchema, so a malformed index fails the
 * build, and structurally checked by tsc against PrIndex. Gitignored: the
 * index is bot-rewritten twice a day.
 */
export async function generateIndexModule(): Promise<{ prIndex: PrIndex; changed: boolean }> {
  const result = IndexSchema.safeParse(JSON.parse(readFileSync(INDEX_PATH, "utf8")));
  if (!result.success) {
    throw new Error(`data/index.json failed validation:\n${z.prettifyError(result.error)}`);
  }
  const prIndex = result.data;
  const source = [
    "// GENERATED FILE — do not edit.",
    "// Source: data/index.json, validated with IndexSchema at generation time.",
    "// Regenerate: pnpm gen",
    'import type { PrIndex } from "../domain/types.ts";',
    "",
    `export const prIndex: PrIndex = ${stableStringify(prIndex).trimEnd()};`,
    "",
  ].join("\n");
  mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  let previous: string | null = null;
  try {
    previous = readFileSync(OUT_PATH, "utf8");
  } catch {
    previous = null;
  }
  const changed = previous !== source;
  if (changed) writeFileSync(OUT_PATH, source);
  return { prIndex, changed };
}

/**
 * data/prs/*.json → public/pr-data/. Per-PR records carry the release notes,
 * so they are static assets fetched by the detail route, never bundled.
 * Write-if-different keeps the Vite watcher quiet; stale files are removed.
 */
export async function copyPrAssets(): Promise<{ written: number; removed: number; total: number }> {
  const srcDir = path.join(process.cwd(), "data", "prs");
  const outDir = path.join(process.cwd(), "public", "pr-data");
  mkdirSync(outDir, { recursive: true });
  const sources = existsSync(srcDir) ? readdirSync(srcDir).filter((f) => f.endsWith(".json")) : [];
  const wanted = new Set(sources);
  let written = 0;
  for (const file of sources) {
    const next = readFileSync(path.join(srcDir, file), "utf8");
    const target = path.join(outDir, file);
    let current: string | null = null;
    try {
      current = readFileSync(target, "utf8");
    } catch {
      current = null;
    }
    if (current !== next) {
      writeFileSync(target, next);
      written++;
    }
  }
  let removed = 0;
  for (const file of readdirSync(outDir)) {
    if (file.endsWith(".json") && !wanted.has(file)) {
      rmSync(path.join(outDir, file));
      removed++;
    }
  }
  return { written, removed, total: sources.length };
}
