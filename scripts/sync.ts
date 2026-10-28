import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Octokit } from "octokit";
import { z } from "zod";
import { areasOfFiles } from "../src/domain/areas.ts";
import { deriveBucket } from "../src/domain/buckets.ts";
import { extractReleaseNotes, isTruncated, parseDependency } from "../src/domain/renovate-body.ts";
import {
  REVIEW_BOT_LOGIN,
  buildIndex,
  contentEquals,
  parseReviewComment,
  stableStringify,
} from "../src/domain/snapshot.ts";
import { IndexSchema, PrRecordSchema, type PrRecord } from "../src/domain/types.ts";
import { loadSource, splitRepo } from "../src/server/source.ts";

/**
 * Snapshot every Renovate PR of the source repository (open, plus merged and
 * closed within the retention window) into data/prs/<number>.json and the slim
 * data/index.json. Reads only; the AI review arrives through the PR comment
 * the homelab workflow posted.
 *
 * Same rules as release-radar's sync: deterministic output, never rewrite an
 * unchanged file, advance generatedAt only when something changed, and let one
 * failing PR not block the rest.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const PRS_DIR = path.join(DATA_DIR, "prs");
const INDEX_PATH = path.join(DATA_DIR, "index.json");
const BATCH = 20;

const PrNode = z.object({
  number: z.number(),
  title: z.string(),
  url: z.string(),
  body: z.string(),
  state: z.enum(["OPEN", "MERGED", "CLOSED"]),
  isDraft: z.boolean(),
  headRefOid: z.string(),
  headRefName: z.string(),
  mergeable: z.enum(["MERGEABLE", "CONFLICTING", "UNKNOWN"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  mergedAt: z.string().nullable(),
  closedAt: z.string().nullable(),
  author: z.object({ login: z.string() }).nullable(),
  labels: z.object({ nodes: z.array(z.object({ name: z.string() })) }),
  files: z.object({ nodes: z.array(z.object({ path: z.string() })) }),
  commits: z.object({
    nodes: z.array(
      z.object({
        commit: z.object({
          statusCheckRollup: z.object({ state: z.string() }).nullable(),
        }),
      }),
    ),
  }),
  comments: z.object({
    nodes: z.array(
      z.object({
        url: z.string(),
        body: z.string(),
        author: z.object({ login: z.string() }).nullable(),
      }),
    ),
  }),
});
type PrNode = z.infer<typeof PrNode>;

const PR_FIELDS = `
  number title url body state isDraft headRefOid headRefName mergeable
  createdAt updatedAt mergedAt closedAt
  author { login }
  labels(first: 30) { nodes { name } }
  files(first: 100) { nodes { path } }
  commits(last: 1) { nodes { commit { statusCheckRollup { state } } } }
  comments(last: 50) { nodes { url body author { login } } }
`;

function readJsonIfExists<T>(filePath: string, parse: (raw: unknown) => T): T | null {
  if (!existsSync(filePath)) return null;
  try {
    return parse(JSON.parse(readFileSync(filePath, "utf8")));
  } catch (err) {
    const reason = err instanceof z.ZodError ? z.prettifyError(err) : err instanceof Error ? err.message : String(err);
    console.warn(`warn      ${path.basename(filePath)} is invalid, rebuilding:\n${reason}`);
    return null;
  }
}

/** Candidate PR numbers: every Renovate PR updated inside the retention window. */
async function listCandidates(
  octokit: Octokit,
  owner: string,
  name: string,
  botLogin: string,
  branchPrefix: string,
  since: Date,
): Promise<number[]> {
  const numbers: number[] = [];
  for await (const { data: page } of octokit.paginate.iterator(octokit.rest.pulls.list, {
    owner,
    repo: name,
    state: "all",
    sort: "updated",
    direction: "desc",
    per_page: 100,
  })) {
    let stop = false;
    for (const pr of page) {
      if (new Date(pr.updated_at) < since) {
        stop = true;
        break;
      }
      const login = pr.user?.login ?? "";
      if (login === botLogin || pr.head.ref.startsWith(branchPrefix)) numbers.push(pr.number);
    }
    if (stop) break;
  }
  return numbers;
}

async function fetchNodes(octokit: Octokit, owner: string, name: string, numbers: number[]): Promise<PrNode[]> {
  const nodes: PrNode[] = [];
  for (let i = 0; i < numbers.length; i += BATCH) {
    const slice = numbers.slice(i, i + BATCH);
    const aliases = slice.map((n) => `pr${n}: pullRequest(number: ${n}) { ${PR_FIELDS} }`).join("\n");
    const data = await octokit.graphql<{ repository: Record<string, unknown> }>(
      `query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { ${aliases} } }`,
      { owner, name },
    );
    for (const n of slice) {
      const raw = data.repository[`pr${n}`];
      const parsed = PrNode.safeParse(raw);
      if (parsed.success) nodes.push(parsed.data);
      else console.error(`error     #${n}: ${z.prettifyError(parsed.error)}`);
    }
  }
  return nodes;
}

function toRecord(node: PrNode, syncedAt: string): PrRecord {
  const files = node.files.nodes.map((f) => f.path);
  const reviewComment = node.comments.nodes.find(
    (c) => c.author?.login === REVIEW_BOT_LOGIN && c.body.startsWith("<!-- dep-radar:v1 "),
  );
  const parsed = reviewComment ? parseReviewComment(reviewComment.body) : { status: "none" as const };
  const review = parsed.status === "ok" ? parsed.review : null;
  const reviewState = review ? (review.head_sha === node.headRefOid ? "fresh" : "stale") : "missing";
  const rollup = node.commits.nodes[0]?.commit.statusCheckRollup?.state ?? null;
  const ci = rollup && ["SUCCESS", "FAILURE", "PENDING", "ERROR", "EXPECTED"].includes(rollup)
    ? (rollup as PrRecord["ci"])
    : null;
  const state: PrRecord["state"] = node.state === "MERGED" ? "merged" : node.state === "CLOSED" ? "closed" : "open";
  const fromReview = review
    ? {
        name: review.dependency.name,
        updateType: review.dependency.update_type,
        from: review.dependency.from,
        to: review.dependency.to,
        sourceUrl: parseDependency(node.body)?.sourceUrl ?? null,
      }
    : null;
  const base = {
    schemaVersion: 1 as const,
    syncedAt,
    number: node.number,
    title: node.title,
    url: node.url,
    branch: node.headRefName,
    author: node.author?.login ?? "unknown",
    state,
    isDraft: node.isDraft,
    headSha: node.headRefOid,
    mergeable: node.mergeable,
    ci,
    labels: node.labels.nodes.map((l) => l.name).sort(),
    files,
    areas: areasOfFiles(files),
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    mergedAt: node.mergedAt,
    closedAt: node.closedAt,
    dependency: fromReview ?? parseDependency(node.body),
    releaseNotesMarkdown: extractReleaseNotes(node.body),
    notesTruncated: isTruncated(node.body),
    review,
    reviewState: reviewState as PrRecord["reviewState"],
    reviewError: parsed.status === "invalid" ? parsed.error : null,
    reviewCommentUrl: reviewComment?.url ?? null,
  };
  return PrRecordSchema.parse({ ...base, bucket: deriveBucket(base) });
}

async function main(): Promise<void> {
  const source = loadSource();
  const { owner, name } = splitRepo(source.repo);
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  mkdirSync(PRS_DIR, { recursive: true });

  const now = new Date();
  const since = new Date(now.getTime() - source.closedRetentionDays * 86_400_000);
  const numbers = await listCandidates(octokit, owner, name, source.botLogin, source.branchPrefix, since);
  console.log(`candidates ${numbers.length} Renovate PRs updated since ${since.toISOString().slice(0, 10)}`);

  const nodes = await fetchNodes(octokit, owner, name, numbers);
  const records: PrRecord[] = [];
  const keep = new Set<string>();
  let updates = 0;

  for (const node of nodes) {
    const filePath = path.join(PRS_DIR, `${node.number}.json`);
    keep.add(path.basename(filePath));
    const existing = readJsonIfExists(filePath, (raw) => PrRecordSchema.parse(raw));
    let next: PrRecord;
    try {
      next = toRecord(node, existing?.syncedAt ?? now.toISOString());
    } catch (err) {
      console.error(`error     #${node.number}: ${err instanceof Error ? err.message : String(err)}`);
      if (existing) records.push(existing);
      continue;
    }
    if (existing && contentEquals(next, existing)) {
      records.push(existing);
      console.log(`unchanged #${node.number} ${next.bucket}`);
    } else {
      next.syncedAt = now.toISOString();
      writeFileSync(filePath, stableStringify(next));
      records.push(next);
      updates++;
      console.log(`updated   #${node.number} ${next.bucket} (${next.reviewState} review)`);
    }
  }

  // Outside the window → gone. The index is rebuilt from what remains.
  let removed = 0;
  for (const file of readdirSync(PRS_DIR)) {
    if (file.endsWith(".json") && !keep.has(file)) {
      rmSync(path.join(PRS_DIR, file));
      removed++;
      console.log(`removed   ${file}`);
    }
  }

  const existingIndex = readJsonIfExists(INDEX_PATH, (raw) => IndexSchema.parse(raw));
  const nextIndex = buildIndex(records, source.repo, existingIndex?.generatedAt ?? now.toISOString());
  if (existingIndex && contentEquals(nextIndex, existingIndex)) {
    console.log("unchanged index.json");
  } else {
    nextIndex.generatedAt = now.toISOString();
    writeFileSync(INDEX_PATH, stableStringify(nextIndex));
    console.log("updated   index.json");
  }
  console.log(`Done: ${records.length} PRs, ${updates} updated, ${removed} removed`);
}

await main();
