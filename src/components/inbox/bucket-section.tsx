import { Badge } from "@/components/ui/badge";
import { BUCKET_META, type Bucket, type IndexRow } from "@/domain/types";
import { PrRow } from "./pr-row";

export function bucketAnchor(bucket: Bucket): string {
  return `bucket-${bucket}`;
}

/**
 * A bucket is a section at the same hierarchy level as every other bucket:
 * heading with its count, a one-line blurb that says what to do, then the
 * rows on one card surface. Hidden when empty, so the page is as long as the
 * work.
 */
export function BucketSection({ bucket, rows }: { bucket: Bucket; rows: readonly IndexRow[] }) {
  if (rows.length === 0) return null;
  const meta = BUCKET_META[bucket];
  const id = bucketAnchor(bucket);
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <div className="flex flex-col gap-0.5">
        <h2 id={id} className="flex items-center gap-2 text-sm font-medium">
          {meta.title}
          <Badge variant="secondary" className="tabular-nums">
            {rows.length}
          </Badge>
        </h2>
        <p className="text-xs text-muted-foreground">{meta.blurb}</p>
      </div>
      <ol className="flex flex-col divide-y rounded-xl border bg-card">
        {rows.map((pr) => (
          <PrRow key={pr.number} pr={pr} />
        ))}
      </ol>
    </section>
  );
}
