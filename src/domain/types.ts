import { z } from "zod";

/**
 * Everything the site knows comes through these schemas. `ReviewSchema`
 * mirrors `.github/dependency-review/schema.json` in duynhlab/homelab, key for
 * key, so a review parsed from a PR comment is the same object the homelab
 * workflow validated before posting it. The PR record wraps it with the pull
 * request's own state and the derived inbox bucket.
 */

export const UPDATE_TYPES = ["digest", "patch", "minor", "major", "pin"] as const;
export const IMPACTS = ["none", "minor", "breaking"] as const;
export const VERDICTS = ["safe-static", "safe-for-repo-use", "hold"] as const;
export const HOLD_REASONS = [
  "behavior-migration-verification",
  "hidden-dependency-version-alignment",
  "secret-output-validation",
  "image-level-bootstrap-proof",
  "existing-state-migration-proof",
  "telemetry-behavior-verification",
  "persistent-state-migration-rollback",
  "query-behavior-operations-docs",
  "confirmed-repo-breaking-change",
  "adoptable-feature",
  "frozen-by-owner",
  "other",
] as const;

export const HOLD_REASON_LABELS: Record<(typeof HOLD_REASONS)[number], string> = {
  "behavior-migration-verification": "behavior / migration verification",
  "hidden-dependency-version-alignment": "hidden dependency / version alignment",
  "secret-output-validation": "secret-output validation",
  "image-level-bootstrap-proof": "image-level bootstrap proof",
  "existing-state-migration-proof": "existing-state migration proof",
  "telemetry-behavior-verification": "telemetry behavior verification",
  "persistent-state-migration-rollback": "persistent-state migration / rollback",
  "query-behavior-operations-docs": "query behavior and operations docs",
  "confirmed-repo-breaking-change": "confirmed repo breaking change",
  "adoptable-feature": "adoptable feature, owner decision",
  "frozen-by-owner": "frozen by owner",
  other: "other",
};

/**
 * Declaration order is display order in the inbox, highest priority first.
 * Every open PR lands in exactly one bucket; see domain/buckets.ts.
 */
export const BUCKETS = [
  "owner-hold",
  "breaking",
  "verify",
  "ready",
  "blocked",
  "waiting",
  "merged",
  "closed",
] as const;

export const BUCKET_META: Record<
  (typeof BUCKETS)[number],
  { ordinal: number; title: string; blurb: string; open: boolean }
> = {
  "owner-hold": {
    ordinal: 0,
    title: "Held by owner",
    blurb: "Carries the hold label. A decision is recorded on the audit issue; nothing to do here until it changes.",
    open: true,
  },
  breaking: {
    ordinal: 1,
    title: "Breaking, needs a decision",
    blurb: "The review found a relevant breaking change or a confirmed hold. Read the detail, then plan the migration or hold the PR.",
    open: true,
  },
  verify: {
    ordinal: 2,
    title: "Safe, verify before merge",
    blurb: "Nothing breaks by reading, but a runtime, static or docs check is listed. Run the checklist, then merge.",
    open: true,
  },
  ready: {
    ordinal: 3,
    title: "Ready to merge",
    blurb: "No relevant change, CI green, no conflicts. Merge it.",
    open: true,
  },
  blocked: {
    ordinal: 4,
    title: "Blocked by CI or conflicts",
    blurb: "Failing checks or merge conflicts, whatever the review said. Rebase or fix CI first.",
    open: true,
  },
  waiting: {
    ordinal: 5,
    title: "Waiting for a review",
    blurb: "No review yet, or the PR moved since the last one. The workflow runs on every push; dispatch a backfill if it is stuck.",
    open: true,
  },
  merged: {
    ordinal: 6,
    title: "Merged",
    blurb: "Kept for 30 days as history.",
    open: false,
  },
  closed: {
    ordinal: 7,
    title: "Closed without merging",
    blurb: "Kept for 30 days as history.",
    open: false,
  },
};

/** Which part of the homelab a PR touches, derived from its file paths. */
export const AREAS = [
  "observability",
  "monitoring",
  "databases",
  "gateway",
  "secrets",
  "security",
  "gitops",
  "platform",
  "apps",
  "local-stack",
  "terraform",
  "ci",
  "scripts",
  "docs",
] as const;

export const AREA_LABELS: Record<(typeof AREAS)[number], string> = {
  observability: "Observability",
  monitoring: "Monitoring",
  databases: "Databases",
  gateway: "Gateway",
  secrets: "Secrets",
  security: "Security",
  gitops: "GitOps",
  platform: "Platform",
  apps: "Apps",
  "local-stack": "Local stack",
  terraform: "Terraform",
  ci: "CI",
  scripts: "Scripts",
  docs: "Docs",
};

const url = z.string().regex(/^https?:\/\/\S+$/, "must be an absolute http(s) URL");

export const ReviewSchema = z.strictObject({
  schema_version: z.literal(1),
  pr: z.number().int().min(1),
  head_sha: z.string().regex(/^[0-9a-f]{40}$/),
  reviewed_at: z.iso.datetime(),
  prompt_version: z.number().int().min(1),
  model: z.string().min(1),
  dependency: z.strictObject({
    name: z.string().min(1),
    manager: z.string().min(1),
    update_type: z.enum(UPDATE_TYPES),
    from: z.string().min(1),
    to: z.string().min(1),
    notes_truncated: z.boolean().optional(),
    first_party: z.boolean().optional(),
  }),
  verdict: z.enum(VERDICTS),
  hold_reason: z.enum(HOLD_REASONS).optional(),
  impact: z.enum(IMPACTS),
  summary: z.string().min(1).max(600),
  breaking: z.array(
    z.strictObject({
      title: z.string().min(1),
      relevant: z.boolean(),
      why: z.string().min(1),
      version: z.string().optional(),
      evidence_url: url.optional(),
    }),
  ),
  features: z
    .array(
      z.strictObject({
        title: z.string().min(1),
        useful_for_repo: z.boolean().optional(),
        why: z.string().optional(),
        evidence_url: url.optional(),
      }),
    )
    .optional(),
  affected_files: z.array(
    z.strictObject({
      path: z.string().min(1),
      role: z.enum(["pin", "manifest", "values", "compose", "terraform", "script", "docs", "policy"]),
      note: z.string().optional(),
    }),
  ),
  verification: z.array(
    z.strictObject({
      step: z.string().min(1),
      kind: z.enum(["static", "runtime", "docs"]),
    }),
  ),
  related_prs: z.array(
    z.strictObject({
      number: z.number().int().min(1),
      relationship: z.enum(["same-family", "must-land-together", "chart-of", "image-of", "order-after"]),
      note: z.string().optional(),
    }),
  ),
  evidence: z.array(z.strictObject({ label: z.string().min(1), url })),
  notes: z.array(z.string()).optional(),
});

/** What Renovate's own PR body says about the bump, used when no review exists. */
export const DependencySchema = z.object({
  name: z.string().min(1),
  updateType: z.enum(UPDATE_TYPES),
  from: z.string().min(1),
  to: z.string().min(1),
  sourceUrl: url.nullable(),
});

export const PrRecordSchema = z.object({
  schemaVersion: z.literal(1),
  syncedAt: z.iso.datetime(),
  number: z.number().int().min(1),
  title: z.string().min(1),
  url,
  branch: z.string().min(1),
  author: z.string().min(1),
  state: z.enum(["open", "merged", "closed"]),
  isDraft: z.boolean(),
  headSha: z.string().regex(/^[0-9a-f]{40}$/),
  mergeable: z.enum(["MERGEABLE", "CONFLICTING", "UNKNOWN"]),
  ci: z.enum(["SUCCESS", "FAILURE", "PENDING", "ERROR", "EXPECTED"]).nullable(),
  labels: z.array(z.string()),
  files: z.array(z.string()),
  areas: z.array(z.enum(AREAS)),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  mergedAt: z.iso.datetime().nullable(),
  closedAt: z.iso.datetime().nullable(),
  dependency: DependencySchema.nullable(),
  releaseNotesMarkdown: z.string().nullable(),
  notesTruncated: z.boolean(),
  review: ReviewSchema.nullable(),
  reviewState: z.enum(["fresh", "stale", "missing"]),
  reviewError: z.string().nullable(),
  reviewCommentUrl: url.nullable(),
  bucket: z.enum(BUCKETS),
});

/** Slim row for the inbox; the full record is a per-PR static asset. */
export const IndexRowSchema = z.object({
  number: z.number().int().min(1),
  title: z.string().min(1),
  url,
  state: z.enum(["open", "merged", "closed"]),
  bucket: z.enum(BUCKETS),
  dependency: DependencySchema.nullable(),
  areas: z.array(z.enum(AREAS)),
  mergeable: z.enum(["MERGEABLE", "CONFLICTING", "UNKNOWN"]),
  ci: z.enum(["SUCCESS", "FAILURE", "PENDING", "ERROR", "EXPECTED"]).nullable(),
  labels: z.array(z.string()),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  reviewState: z.enum(["fresh", "stale", "missing"]),
  impact: z.enum(IMPACTS).nullable(),
  verdict: z.enum(VERDICTS).nullable(),
  holdReason: z.enum(HOLD_REASONS).nullable(),
  summary: z.string().nullable(),
  reviewedAt: z.iso.datetime().nullable(),
});

export const IndexSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.iso.datetime(),
  repo: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  prs: z.array(IndexRowSchema),
});

export type UpdateType = (typeof UPDATE_TYPES)[number];
export type Impact = (typeof IMPACTS)[number];
export type Verdict = (typeof VERDICTS)[number];
export type HoldReason = (typeof HOLD_REASONS)[number];
export type Bucket = (typeof BUCKETS)[number];
export type Area = (typeof AREAS)[number];
export type Review = z.infer<typeof ReviewSchema>;
export type Dependency = z.infer<typeof DependencySchema>;
export type PrRecord = z.infer<typeof PrRecordSchema>;
export type IndexRow = z.infer<typeof IndexRowSchema>;
export type PrIndex = z.infer<typeof IndexSchema>;
