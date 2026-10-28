import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AREA_LABELS, type Area, type Impact, type UpdateType } from "@/domain/types";
import { cn } from "@/lib/cn";

// Static class strings per value so Tailwind's scanner sees them. A computed
// `bg-area-${area}-bg` would be invisible to it and silently render unstyled.
const AREA_STYLES: Record<Area, string> = {
  observability: "bg-area-observability-bg text-area-observability-fg",
  monitoring: "bg-area-monitoring-bg text-area-monitoring-fg",
  databases: "bg-area-databases-bg text-area-databases-fg",
  gateway: "bg-area-gateway-bg text-area-gateway-fg",
  secrets: "bg-area-secrets-bg text-area-secrets-fg",
  security: "bg-area-security-bg text-area-security-fg",
  gitops: "bg-area-gitops-bg text-area-gitops-fg",
  platform: "bg-area-platform-bg text-area-platform-fg",
  apps: "bg-area-apps-bg text-area-apps-fg",
  "local-stack": "bg-area-local-stack-bg text-area-local-stack-fg",
  terraform: "bg-area-terraform-bg text-area-terraform-fg",
  ci: "bg-area-ci-bg text-area-ci-fg",
  scripts: "bg-area-scripts-bg text-area-scripts-fg",
  docs: "bg-area-docs-bg text-area-docs-fg",
};

const IMPACT_STYLES: Record<Impact, string> = {
  none: "bg-impact-none-bg text-impact-none-fg",
  minor: "bg-impact-minor-bg text-impact-minor-fg",
  breaking: "bg-impact-breaking-bg text-impact-breaking-fg",
};

/** Hollow, half, cross: the state survives a colour-blind reading. */
export const IMPACT_GLYPH: Record<Impact, string> = {
  none: "○",
  minor: "△",
  breaking: "✕",
};

const base = "inline-flex h-5 items-center gap-1 rounded-badge px-1.5 text-micro font-medium";

export function AreaBadge({ area, asLink = false }: { area: Area; asLink?: boolean }) {
  const className = cn(base, AREA_STYLES[area]);
  const label = AREA_LABELS[area];
  if (!asLink) return <span className={className}>{label}</span>;
  return (
    <Link to="/" search={{ area }} className={cn(className, "hover:brightness-110")}>
      {label}
    </Link>
  );
}

export function ImpactBadge({ impact, className }: { impact: Impact; className?: string }) {
  return (
    <span className={cn(base, IMPACT_STYLES[impact], className)}>
      <span aria-hidden="true">{IMPACT_GLYPH[impact]}</span>
      {impact}
    </span>
  );
}

/** The update type is a fact about the bump, not a judgement: neutral. */
export function UpdateTypeBadge({ type }: { type: UpdateType }) {
  return <NeutralBadge>{type}</NeutralBadge>;
}

export function NeutralBadge({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span title={title} className={cn(base, "bg-surface-hover text-fg-muted", className)}>
      {children}
    </span>
  );
}
