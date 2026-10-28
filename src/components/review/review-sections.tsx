import { Link } from "@tanstack/react-router";
import { IMPACT_GLYPH, ImpactBadge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { HOLD_REASON_LABELS, type PrRecord, type Review } from "@/domain/types";
import { formatDate } from "@/lib/dates";

/**
 * The review, section by section, in the order a maintainer needs it: the
 * verdict first, what breaks, what it touches here, what to check, who it
 * travels with, where the evidence is. Findings are list items with a glyph,
 * never cards with a coloured rail.
 */

export function VerdictBlock({ review }: { review: Review }) {
  const verdict =
    review.verdict === "hold"
      ? `Hold — ${HOLD_REASON_LABELS[review.hold_reason ?? "other"]}`
      : review.verdict === "safe-static"
        ? "Safe (static)"
        : "Safe for repository use (static)";
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="flex flex-wrap items-center gap-2 text-card-title font-semibold text-fg">
        {verdict}
        <ImpactBadge impact={review.impact} />
      </p>
      <p className="mt-2 max-w-prose text-body text-fg-muted">{review.summary}</p>
      {review.dependency.notes_truncated ? (
        <p className="mt-2 text-meta text-fg-subtle">
          Renovate truncated the release notes in the PR body; the review covers what was visible.
        </p>
      ) : null}
    </div>
  );
}

export function ReviewStateBanner({ pr }: { pr: PrRecord }) {
  if (pr.reviewError) {
    return (
      <p role="status" className="rounded-card border border-border bg-surface px-4 py-3 text-body text-fg-muted">
        The review comment on this PR did not parse: <span className="font-mono text-meta">{pr.reviewError}</span>.
        The homelab validator and this site disagree on the schema.
      </p>
    );
  }
  if (pr.reviewState === "stale" && pr.review) {
    return (
      <p role="status" className="rounded-card border border-border bg-surface px-4 py-3 text-body text-fg-muted">
        Reviewed at <span className="font-mono">{pr.review.head_sha.slice(0, 7)}</span>; the PR has since moved to{" "}
        <span className="font-mono">{pr.headSha.slice(0, 7)}</span>. The workflow re-runs on every push.
      </p>
    );
  }
  if (pr.reviewState === "missing") {
    return (
      <p role="status" className="rounded-card border border-border bg-surface px-4 py-3 text-body text-fg-muted">
        Not reviewed yet. The release notes below are what Renovate fetched.
      </p>
    );
  }
  return null;
}

export function BreakingList({ review }: { review: Review }) {
  const relevant = review.breaking.filter((b) => b.relevant);
  const irrelevant = review.breaking.filter((b) => !b.relevant);
  if (review.breaking.length === 0) return null;
  return (
    <section aria-labelledby="breaking">
      <SectionLabel count={relevant.length} className="mb-2">
        <span id="breaking">Breaking changes</span>
      </SectionLabel>
      {relevant.length === 0 ? (
        <p className="text-body text-fg-muted">None of the upstream changes is relevant to this repository.</p>
      ) : (
        <ul className="space-y-2">
          {relevant.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden="true" className="w-4 shrink-0 font-mono text-impact-breaking-fg">
                {IMPACT_GLYPH.breaking}
              </span>
              <div className="min-w-0">
                <p className="text-body font-medium text-fg">
                  {b.title}
                  {b.version ? <span className="ml-1.5 font-mono text-meta text-fg-subtle">{b.version}</span> : null}
                </p>
                <p className="text-body text-fg-muted">
                  {b.why}
                  {b.evidence_url ? (
                    <>
                      {" "}
                      <a href={b.evidence_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                        source ↗
                      </a>
                    </>
                  ) : null}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {irrelevant.length > 0 ? (
        <details className="mt-3 group">
          <summary className="cursor-pointer list-none text-meta text-fg-muted hover:text-fg [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">
              ▸
            </span>{" "}
            {irrelevant.length} change{irrelevant.length === 1 ? "" : "s"} not relevant to this repository
          </summary>
          <ul className="mt-2 space-y-1.5 pl-5">
            {irrelevant.map((b, i) => (
              <li key={i} className="text-body text-fg-muted">
                <span className="text-fg">{b.title}</span> — {b.why}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

export function FeaturesList({ review }: { review: Review }) {
  const useful = (review.features ?? []).filter((f) => f.useful_for_homelab);
  if (useful.length === 0) return null;
  return (
    <section aria-labelledby="features">
      <SectionLabel count={useful.length} className="mb-2">
        <span id="features">Worth a look</span>
      </SectionLabel>
      <ul className="space-y-1.5">
        {useful.map((f, i) => (
          <li key={i} className="text-body text-fg-muted">
            <span className="text-fg">{f.title}</span>
            {f.why ? ` — ${f.why}` : ""}
            {f.evidence_url ? (
              <>
                {" "}
                <a href={f.evidence_url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  source ↗
                </a>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AffectedFiles({ review, repo, headSha }: { review: Review; repo: string; headSha: string }) {
  if (review.affected_files.length === 0) return null;
  return (
    <section aria-labelledby="affected">
      <SectionLabel count={review.affected_files.length} className="mb-2">
        <span id="affected">Affected in this repository</span>
      </SectionLabel>
      <ul className="space-y-1.5">
        {review.affected_files.map((f) => (
          <li key={f.path} className="flex flex-wrap items-baseline gap-x-2 text-body">
            <a
              href={`https://github.com/${repo}/blob/${headSha}/${f.path}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-meta text-accent hover:underline"
            >
              {f.path}
            </a>
            <span className="text-meta text-fg-subtle">{f.role}</span>
            {f.note ? <span className="text-fg-muted">— {f.note}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Checklist({ review }: { review: Review }) {
  if (review.verification.length === 0) return null;
  return (
    <section aria-labelledby="verify">
      <SectionLabel count={review.verification.length} className="mb-2">
        <span id="verify">Verify before merge</span>
      </SectionLabel>
      <ul className="space-y-1.5">
        {review.verification.map((v, i) => (
          <li key={i} className="flex gap-2 text-body">
            <span aria-hidden="true" className="w-4 shrink-0 font-mono text-fg-subtle">
              □
            </span>
            <span className="min-w-0">
              <span className="mr-1.5 font-mono text-meta text-fg-subtle">{v.kind}</span>
              <span className="text-fg">{v.step}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-meta text-fg-subtle">Read-only here; tick it on the pull request.</p>
    </section>
  );
}

export function RelatedPrs({ review }: { review: Review }) {
  if (review.related_prs.length === 0) return null;
  return (
    <section aria-labelledby="related">
      <SectionLabel count={review.related_prs.length} className="mb-2">
        <span id="related">Lands with</span>
      </SectionLabel>
      <ul className="space-y-1.5">
        {review.related_prs.map((r) => (
          <li key={r.number} className="text-body text-fg-muted">
            <Link
              to="/prs/$number"
              params={{ number: String(r.number) }}
              className="font-mono text-meta text-accent hover:underline"
            >
              #{r.number}
            </Link>{" "}
            <span className="text-meta text-fg-subtle">{r.relationship}</span>
            {r.note ? ` — ${r.note}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Evidence({ review, pr }: { review: Review; pr: PrRecord }) {
  const links = [...review.evidence];
  if (pr.dependency?.sourceUrl && pr.dependency.from !== pr.dependency.to) {
    links.push({
      label: `Compare ${pr.dependency.from}…${pr.dependency.to}`,
      url: `${pr.dependency.sourceUrl}/compare/${encodeURIComponent(pr.dependency.from)}...${encodeURIComponent(pr.dependency.to)}`,
    });
  }
  if (links.length === 0) return null;
  return (
    <section aria-labelledby="evidence">
      <SectionLabel className="mb-2">
        <span id="evidence">Upstream evidence</span>
      </SectionLabel>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {links.map((e) => (
          <li key={e.url}>
            <a href={e.url} target="_blank" rel="noreferrer" className="text-body text-accent hover:underline">
              {e.label} ↗
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Provenance({ review, commentUrl }: { review: Review; commentUrl: string | null }) {
  return (
    <p className="border-t border-border pt-4 text-meta text-fg-subtle">
      Reviewed <time dateTime={review.reviewed_at}>{formatDate(review.reviewed_at)}</time> ·{" "}
      <span className="font-mono">{review.model}</span> · prompt v{review.prompt_version} · head{" "}
      <span className="font-mono">{review.head_sha.slice(0, 7)}</span>
      {commentUrl ? (
        <>
          {" "}
          ·{" "}
          <a href={commentUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
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
