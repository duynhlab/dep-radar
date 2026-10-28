import { useMemo } from "react";
import { BucketSection, bucketAnchor } from "@/components/inbox/bucket-section";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/features/catalog/search-field";
import {
  AREAS,
  AREA_LABELS,
  BUCKETS,
  BUCKET_META,
  IMPACTS,
  UPDATE_TYPES,
  type Area,
  type IndexRow,
} from "@/domain/types";
import { cn } from "@/lib/cn";
import { countOpen, groupOpen } from "./filters";
import { SORT_KEYS, isFiltered, type InboxSearch, type SortKey } from "./search-params";
import { useSetInboxSearch } from "./use-inbox-search";

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

  return (
    <div className="space-y-6">
      <p className="text-meta text-fg-muted" data-numeric="">
        <strong className="font-semibold text-fg">{counts.open}</strong> open ·{" "}
        <strong className="font-semibold text-fg">{counts.decide}</strong> need a decision ·{" "}
        <strong className="font-semibold text-fg">{counts.ready}</strong> ready to merge ·{" "}
        <strong className="font-semibold text-fg">{counts.waiting}</strong> waiting for a review
      </p>

      <div className="space-y-2.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchField value={search.q} onChange={(q) => update({ q }, { replace: true })} />
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              id="type"
              label="Filter by update type"
              value={search.type}
              onChange={(e) => update({ type: e.target.value as InboxSearch["type"] })}
            >
              <option value="all">All update types</option>
              {UPDATE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              id="impact"
              label="Filter by impact"
              value={search.impact}
              onChange={(e) => update({ impact: e.target.value as InboxSearch["impact"] })}
            >
              <option value="all">All impacts</option>
              {IMPACTS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              id="sort"
              label="Sort order"
              value={search.sort}
              onChange={(e) => update({ sort: e.target.value as SortKey })}
            >
              {SORT_KEYS.map((key) => (
                <option key={key} value={key}>
                  {key === "priority" ? "Priority" : key === "age" ? "Longest waiting" : "Dependency"}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <AreaChips areas={usedAreas} selected={search.area} onSelect={(area) => update({ area })} />

        <div className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-1">
          <p role="status" className="text-meta text-fg-muted">
            {filtered ? `${visible} of ${counts.open} open PRs` : ""}
          </p>
          {filtered ? (
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear filters
            </Button>
          ) : (
            <nav aria-label="Jump to bucket" className="flex flex-wrap gap-x-3 gap-y-1 text-micro text-fg-subtle">
              {BUCKETS.filter((b) => BUCKET_META[b].open && (groups.get(b)?.length ?? 0) > 0).map((b) => (
                <a key={b} href={`#${bucketAnchor(b)}`} className="hover:text-fg">
                  <span className="font-mono">{BUCKET_META[b].ordinal}</span> {b.replace("-", " ")}{" "}
                  <span className="font-mono" data-numeric="">
                    {groups.get(b)?.length}
                  </span>
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>

      {visible === 0 ? (
        <div role="status" className="py-16 text-center">
          <p className="text-body font-medium text-fg">
            {counts.open === 0 ? "No open Renovate pull requests" : "No pull requests match"}
          </p>
          <p className="mt-1 text-body text-fg-muted">
            {counts.open === 0
              ? "The inbox is empty. The next sync runs twice a day."
              : "Try a different search term or clear the filters."}
          </p>
          {filtered ? (
            <Button variant="solid" size="md" className="mt-6" onClick={clear}>
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-8">
          {BUCKETS.filter((b) => BUCKET_META[b].open).map((bucket) => (
            <BucketSection key={bucket} bucket={bucket} rows={groups.get(bucket) ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}

function AreaChips({
  areas,
  selected,
  onSelect,
}: {
  areas: readonly Area[];
  selected: Area | "all";
  onSelect: (next: Area | "all") => void;
}) {
  const options: Array<Area | "all"> = ["all", ...areas];
  return (
    <div
      role="group"
      aria-label="Filter by area"
      className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)] [scrollbar-width:none] cards:mx-0 cards:flex-wrap cards:px-0 cards:[mask-image:none]"
    >
      {options.map((option) => {
        const active = selected === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            aria-pressed={active}
            className={cn(
              "inline-flex h-7 shrink-0 items-center rounded-control px-2.5 text-control font-medium transition-colors",
              active ? "bg-accent text-accent-fg" : "bg-surface text-fg-muted hover:bg-surface-hover hover:text-fg",
            )}
          >
            {option === "all" ? "All areas" : AREA_LABELS[option]}
          </button>
        );
      })}
    </div>
  );
}
