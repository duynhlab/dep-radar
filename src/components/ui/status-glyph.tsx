import { cn } from "@/lib/cn";
import type { PrRecord } from "@/domain/types";

/**
 * CI and mergeability as one glyph each. The word is the accessible name and
 * the title; the colour is secondary, so the hollow/filled shapes carry the
 * state on their own.
 */
export function CiGlyph({ ci }: { ci: PrRecord["ci"] }) {
  const [glyph, label, tone] =
    ci === "SUCCESS"
      ? ["✓", "CI passing", "text-ok"]
      : ci === "FAILURE" || ci === "ERROR"
        ? ["✗", "CI failing", "text-fail"]
        : ci === "PENDING" || ci === "EXPECTED"
          ? ["…", "CI pending", "text-fg-subtle"]
          : ["–", "No CI status", "text-fg-subtle"];
  return <Glyph glyph={glyph} label={`CI ${label.slice(3)}`} tone={tone} prefix="CI" />;
}

export function MergeableGlyph({ mergeable }: { mergeable: PrRecord["mergeable"] }) {
  const [glyph, label, tone] =
    mergeable === "MERGEABLE"
      ? ["✓", "no conflicts", "text-ok"]
      : mergeable === "CONFLICTING"
        ? ["✗", "merge conflicts", "text-fail"]
        : ["?", "mergeability unknown", "text-fg-subtle"];
  return <Glyph glyph={glyph} label={label} tone={tone} prefix="merge" />;
}

function Glyph({ glyph, label, tone, prefix }: { glyph: string; label: string; tone: string; prefix: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-meta text-fg-subtle" title={label}>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{prefix}</span>
      <span aria-hidden="true" className={cn("font-mono", tone)}>
        {glyph}
      </span>
    </span>
  );
}
