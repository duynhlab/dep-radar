import { useMemo } from "react";
import { Chips } from "@/components/app/chips";
import { BucketSection, bucketAnchor } from "@/components/inbox/bucket-section";
import { Button } from "@/components/ui/button";
import { AREAS, AREA_LABELS, BUCKETS, BUCKET_META, IMPACTS, UPDATE_TYPES, type IndexRow } from "@/domain/types";
import { cn } from "@/lib/utils";
import { countOpen, groupOpen } from "./filters";
import { SORT_KEYS, isFiltered, type InboxSearch, type SortKey } from "./search-params";
import { SearchField } from "./search-field";
import { useSetInboxSearch } from "./use-inbox-search";

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-[13px] text-foreground outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/** A native select styled like Input: works with scripts blocked, OS picker on mobile. */
function Select({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        {children}
      </select>
    </span>
  );
}

/**
 * Exceptions first, then the work: four clickable counts promote what needs
 * a decision, the toolbar sits directly above the rows it filters, and every
 * bucket is a section of equal weight below.
 */
export function Inbox({ rows, search }: { rows: readonly IndexRow[]; search: InboxSearch }) {
  const { update, clear } = useSetInboxSearch();
  const counts = useMemo(() => countOpen(rows), [rows]);
  const groups = useMemo(() => groupOpen(rows, search), [rows, search]);
  const visible = [...groups.values()].reduce((n, list) => n + list.length, 0);
  const usedAreas = useMemo(() => {
    const used = new Set(rows.filter((pr) => pr.state === "open").flatMap((pr) => pr.areas));
    return AREAS.filter((a) => used.has(a));
  }, [rows]);
  const filtered = isFiltered(search);

  const kpis = [
    { bucket: "breaking", label: "Needs a decision", value: counts.decide, alarm: true },
    { bucket: "verify", label: "Verify before merge", value: groups.get("verify")?.length ?? 0, alarm: false },
    { bucket: "ready", label: "Ready to merge", value: counts.ready, alarm: false },
    { bucket: "waiting", label: "Waiting for a review", value: counts.waiting, alarm: false },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <a
            key={kpi.bucket}
            href={`#${bucketAnchor(kpi.bucket)}`}
            className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-2"
          >
            <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
            <p
              className={cn("mt-1 text-2xl font-semibold tabular-nums", kpi.alarm && kpi.value > 0 && "text-destructive")}
              data-numeric=""
            >
              {kpi.value}
            </p>
          </a>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchField value={search.q} onChange={(q) => update({ q }, { replace: true })} />
          <Select id="type" label="Filter by update type" value={search.type} onChange={(v) => update({ type: v as InboxSearch["type"] })}>
            <option value="all">All update types</option>
            {UPDATE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Select id="impact" label="Filter by impact" value={search.impact} onChange={(v) => update({ impact: v as InboxSearch["impact"] })}>
            <option value="all">All impacts</option>
            {IMPACTS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
          <Select id="sort" label="Sort order" value={search.sort} onChange={(v) => update({ sort: v as SortKey })}>
            {SORT_KEYS.map((key) => (
              <option key={key} value={key}>
                {key === "priority" ? "Priority" : key === "age" ? "Longest waiting" : "Dependency"}
              </option>
            ))}
          </Select>
        </div>

        <Chips
          label="Filter by area"
          options={usedAreas}
          value={search.area === "all" ? undefined : search.area}
          onChange={(area) => update({ area: area ?? "all" })}
          format={(a) => AREA_LABELS[a]}
        />

        <div className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-1">
          <p role="status" className="text-xs text-muted-foreground tabular-nums">
            {filtered ? `${visible} of ${counts.open} open pull requests` : `${counts.open} open pull requests`}
          </p>
          {filtered ? (
            <Button variant="ghost" size="xs" onClick={clear}>
              Clear filters
            </Button>
          ) : (
            <nav aria-label="Jump to bucket" className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {BUCKETS.filter((b) => BUCKET_META[b].open && (groups.get(b)?.length ?? 0) > 0).map((b) => (
                <a key={b} href={`#${bucketAnchor(b)}`} className="hover:text-foreground">
                  {BUCKET_META[b].title}{" "}
                  <span className="tabular-nums" data-numeric="">
                    {groups.get(b)?.length}
                  </span>
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>

      {visible === 0 ? (
        <div role="status" className="rounded-xl border bg-card py-8 text-center">
          <p className="text-sm font-medium">
            {counts.open === 0 ? "No open Renovate pull requests" : "No pull requests match"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {counts.open === 0 ? "The inbox is empty. The next sync runs twice a day." : "Try a different search or clear the filters."}
          </p>
          {filtered ? (
            <Button variant="outline" size="sm" className="mt-4" onClick={clear}>
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {BUCKETS.filter((b) => BUCKET_META[b].open).map((bucket) => (
            <BucketSection key={bucket} bucket={bucket} rows={groups.get(bucket) ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}
