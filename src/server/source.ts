import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { z } from "zod";

// fs reader for config/source.yaml. SCRIPTS AND TESTS ONLY: nothing under
// src/routes/**, src/components/** or src/data/** may import this module,
// because the prerender pass runs in workerd where node:fs does not exist.

export const SourceSchema = z.strictObject({
  repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/, "repo must be owner/name"),
  botLogin: z.string().min(1),
  branchPrefix: z.string().min(1),
  closedRetentionDays: z.number().int().min(1).max(365),
});

export type Source = z.infer<typeof SourceSchema>;

export function loadSource(file = path.join(process.cwd(), "config", "source.yaml")): Source {
  return SourceSchema.parse(parse(readFileSync(file, "utf8")));
}

export function splitRepo(repo: string): { owner: string; name: string } {
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error(`repo must be owner/name, got "${repo}"`);
  return { owner, name };
}
