import { CountPill } from "@/components/ui/count-pill";
import { BUCKET_META, type Bucket, type IndexRow } from "@/domain/types";
import { PrRow } from "./pr-row";

export function bucketAnchor(bucket: Bucket): string {
  return `bucket-${bucket}`;
}

/**
 * A bucket is a section, not a card: an ordinal, a heading with its count, a
 * one-line blurb that says what to do, then the rows under a hairline. Hidden
 * entirely when empty, so the page is as long as the work.
 */
export function BucketSection({ bucket, rows }: { bucket: Bucket; rows: readonly IndexRow[] }) {
  if (rows.length === 0) return null;
  const meta = BUCKET_META[bucket];
  const id = bucketAnchor(bucket);
  return (
    <section aria-labelledby={id} className="space-y-2.5">
      <header>
        <h2 id={id} className="flex items-baseline gap-2 text-card-title font-semibold text-fg">
          <span className="font-mono text-meta text-fg-subtle" aria-hidden="true">
            {meta.ordinal} ·
          </span>
          {meta.title}
          <CountPill>{rows.length}</CountPill>
        </h2>
        <p className="mt-0.5 text-meta text-fg-muted">{meta.blurb}</p>
      </header>
      <ol className="rounded-card border border-border bg-surface">
        {rows.map((pr) => (
          <PrRow key={pr.number} pr={pr} />
        ))}
      </ol>
    </section>
  );
}
