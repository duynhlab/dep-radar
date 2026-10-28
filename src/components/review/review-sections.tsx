import { Link } from "@tanstack/react-router";
import { Info, Square } from "lucide-react";
import { Section } from "@/components/app/detail";
import { ImpactBadge, verdictLabel } from "@/components/app/status-badge";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PrRecord, Review } from "@/domain/types";
import { formatDate } from "@/lib/dates";

/**
 * The review, section by section, in the order a maintainer needs it: the
 * verdict, what breaks, what it touches here, what to check, who it travels
 * with, where the evidence is. Lists are divided rows on one card surface;
 * status is one Badge, never a coloured rail.
 */

const link = "text-sm underline-offset-2 hover:underline";

export function ReviewStateBanner({ pr }: { pr: PrRecord }) {
  let text: React.ReactNode = null;
  let tone = "text-muted-foreground";
  if (pr.reviewError) {
    tone = "text-destructive";
    text = (
      <>
        The review comment on this PR did not parse: <span className="font-mono text-xs">{pr.reviewError}</span>. The
        homelab validator and this site disagree on the schema.
      </>
    );
  } else if (pr.reviewState === "stale" && pr.review) {
    text = (
      <>
        Reviewed at <span className="font-mono text-xs">{pr.review.head_sha.slice(0, 7)}</span>; the PR has since moved
        to <span className="font-mono text-xs">{pr.headSha.slice(0, 7)}</span>. The workflow re-runs on every push.
      </>
    );
  } else if (pr.reviewState === "missing") {
    text = "Not reviewed yet. The release notes below are what Renovate attached to the pull request.";
  }
  if (!text) return null;
  return (
    <p role="status" className={`flex items-start gap-2 rounded-xl border bg-card p-4 text-sm ${tone}`}>
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{text}</span>
    </p>
  );
}

export function SummarySection({ review }: { review: Review }) {
  return (
    <Section id="summary" title="Summary">
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
          {verdictLabel(review)}
          <ImpactBadge impact={review.impact} />
        </p>
        <p className="max-w-prose text-sm">{review.summary}</p>
        {review.dependency.notes_truncated ? (
          <p className="text-xs text-muted-foreground">
            Renovate truncated the release notes in the PR body; the review covers what was visible.
          </p>
        ) : null}
      </div>
    </Section>
  );
}

export function BreakingSection({ review }: { review: Review }) {
  const relevant = review.breaking.filter((b) => b.relevant);
  const irrelevant = review.breaking.filter((b) => !b.relevant);
  if (review.breaking.length === 0) return null;
  return (
    <Section id="breaking" title="Breaking changes" count={relevant.length}>
      <div className="rounded-xl border bg-card px-4">
        {relevant.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">None of the upstream changes is relevant to this repository.</p>
        ) : (
          <ol className="flex flex-col divide-y">
            {relevant.map((b, i) => (
              <li key={i} className="flex flex-col gap-1 py-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Badge variant="destructive">relevant</Badge>
                  <span className="text-sm font-medium">{b.title}</span>
                  {b.version ? <span className="font-mono text-xs text-muted-foreground">{b.version}</span> : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {b.why}
                  {b.evidence_url ? (
                    <>
                      {" "}
                      <a href={b.evidence_url} target="_blank" rel="noreferrer" className={link}>
                        source
                      </a>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ol>
        )}
        {irrelevant.length > 0 ? (
          <details className="group border-t py-3">
            <summary className="cursor-pointer list-none text-xs text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
              <span aria-hidden className="mr-1 inline-block transition-transform group-open:rotate-90">
                ▸
              </span>
              {irrelevant.length} change{irrelevant.length === 1 ? "" : "s"} not relevant to this repository
            </summary>
            <ul className="mt-2 flex flex-col gap-1.5 pl-4">
              {irrelevant.map((b, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  <span className="text-foreground">{b.title}</span> — {b.why}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </Section>
  );
}

export function FeaturesSection({ review }: { review: Review }) {
  const useful = (review.features ?? []).filter((f) => f.useful_for_repo);
  if (useful.length === 0) return null;
  return (
    <Section id="features" title="Worth a look" count={useful.length}>
      <ul className="flex flex-col divide-y rounded-xl border bg-card px-4">
        {useful.map((f, i) => (
          <li key={i} className="py-3 text-sm">
            <span className="font-medium">{f.title}</span>
            {f.why ? <span className="text-muted-foreground"> — {f.why}</span> : null}
            {f.evidence_url ? (
              <>
                {" "}
                <a href={f.evidence_url} target="_blank" rel="noreferrer" className={link}>
                  source
                </a>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function AffectedSection({ review, repo, headSha }: { review: Review; repo: string; headSha: string }) {
  if (review.affected_files.length === 0) return null;
  return (
    <Section id="affected" title="Affected in this repository" count={review.affected_files.length}>
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Path</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {review.affected_files.map((f) => (
              <TableRow key={f.path}>
                <TableCell>
                  <a
                    href={`https://github.com/${repo}/blob/${headSha}/${f.path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs underline-offset-2 hover:underline"
                  >
                    {f.path}
                  </a>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{f.role}</Badge>
                </TableCell>
                <TableCell className="whitespace-normal text-muted-foreground">{f.note ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Section>
  );
}

export function ChecklistSection({ review }: { review: Review }) {
  if (review.verification.length === 0) return null;
  return (
    <Section id="verify" title="Verify before merge" count={review.verification.length} explainer="Read-only here; tick it on the pull request.">
      <ol className="flex flex-col divide-y rounded-xl border bg-card px-4">
        {review.verification.map((v, i) => (
          <li key={i} className="flex items-start gap-2 py-3 text-sm">
            <Square className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <Badge variant="outline">{v.kind}</Badge>
            <span>{v.step}</span>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function RelatedSection({ review }: { review: Review }) {
  if (review.related_prs.length === 0) return null;
  return (
    <Section id="related" title="Lands with" count={review.related_prs.length}>
      <ul className="flex flex-col divide-y rounded-xl border bg-card px-4">
        {review.related_prs.map((r) => (
          <li key={r.number} className="flex flex-wrap items-center gap-2 py-3 text-sm">
            <Link to="/prs/$number" params={{ number: String(r.number) }} className="font-mono text-xs underline-offset-2 hover:underline">
              #{r.number}
            </Link>
            <Badge variant="outline">{r.relationship}</Badge>
            {r.note ? <span className="text-muted-foreground">{r.note}</span> : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function EvidenceSection({ review, pr }: { review: Review; pr: PrRecord }) {
  const links = [...review.evidence];
  if (pr.dependency?.sourceUrl && pr.dependency.from !== pr.dependency.to) {
    links.push({
      label: `Compare ${pr.dependency.from}…${pr.dependency.to}`,
      url: `${pr.dependency.sourceUrl}/compare/${encodeURIComponent(pr.dependency.from)}...${encodeURIComponent(pr.dependency.to)}`,
    });
  }
  if (links.length === 0) return null;
  return (
    <Section id="evidence" title="Upstream evidence">
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {links.map((e) => (
          <li key={e.url}>
            <a href={e.url} target="_blank" rel="noreferrer" className={link}>
              {e.label} ↗
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function Provenance({ review, commentUrl }: { review: Review; commentUrl: string | null }) {
  return (
    <p className="text-xs text-muted-foreground">
      Reviewed <time dateTime={review.reviewed_at}>{formatDate(review.reviewed_at)}</time> ·{" "}
      <span className="font-mono">{review.model}</span> · prompt v{review.prompt_version} · head{" "}
      <span className="font-mono">{review.head_sha.slice(0, 7)}</span>
      {commentUrl ? (
        <>
          {" "}
          ·{" "}
          <a href={commentUrl} target="_blank" rel="noreferrer" className="underline-offset-2 hover:underline">
            view the comment ↗
          </a>
        </>
      ) : null}
      {review.notes?.length ? (
        <>
          <br />
          Notes: {review.notes.join(" · ")}
        </>
      ) : null}
    </p>
  );
}
