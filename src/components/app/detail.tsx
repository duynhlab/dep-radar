import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

/**
 * The backoffice's case-view convention, carried over verbatim: a back link to
 * the owning list, a heading with the record's status, trailing actions, and
 * label/value fields, so a PR page reads like an order page.
 */

export function DetailHeader({
  backTo,
  backLabel,
  title,
  titleAside,
  badge,
  actions,
}: {
  backTo: "/" | "/history";
  backLabel: string;
  title: string;
  /** Monospace companion to the title, e.g. the version change. */
  titleAside?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Link
        to={backTo}
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        {backLabel}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {titleAside}
        {badge}
        {actions ? <div className="ms-auto flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function FieldGrid({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-2 gap-x-8 gap-y-3 rounded-xl border bg-card p-4 sm:grid-cols-3 lg:grid-cols-4">
      {children}
    </dl>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children ?? "—"}</dd>
    </div>
  );
}

/** A titled block: heading, optional explainer, then the content surface. */
export function Section({
  id,
  title,
  count,
  explainer,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  explainer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2 id={id} className="flex items-center gap-2 text-sm font-medium">
        {title}
        {count !== undefined ? (
          <span className="font-normal text-muted-foreground tabular-nums" data-numeric="">
            {count}
          </span>
        ) : null}
      </h2>
      {explainer ? <p className="text-xs text-muted-foreground">{explainer}</p> : null}
      {children}
    </section>
  );
}
