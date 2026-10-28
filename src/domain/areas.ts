import { AREAS, type Area } from "./types.ts";

/**
 * Path prefix → area, first match wins, so the specific observability
 * sub-trees come before the catch-all. Mirrors the `area/*` labels in
 * duynhlab/homelab rather than inventing a taxonomy of its own.
 */
const RULES: ReadonlyArray<readonly [RegExp, Area]> = [
  [/^kubernetes\/infra\/configs\/observability\/(metrics|grafana|slo|alert)/, "monitoring"],
  [/^kubernetes\/infra\/configs\/observability\//, "observability"],
  [/^kubernetes\/infra\/configs\/databases\//, "databases"],
  [/^kubernetes\/infra\/configs\/(secrets|openbao|external-secrets|cert-manager)/, "secrets"],
  [/^kubernetes\/infra\/configs\/(kyverno|network-policies|policy)/, "security"],
  [/^kubernetes\/infra\/configs\/(envoy-gateway|gateway)/, "gateway"],
  [/^kubernetes\/infra\/configs\//, "platform"],
  [/^kubernetes\/infra\/controllers\//, "platform"],
  [/^kubernetes\/clusters\//, "gitops"],
  [/^kubernetes\/apps\//, "apps"],
  [/^local-stack\//, "local-stack"],
  [/^terraform\//, "terraform"],
  [/^\.github\//, "ci"],
  [/^\.renovaterc/, "ci"],
  [/^scripts\//, "scripts"],
  [/^docs\//, "docs"],
];

export function areaOfPath(path: string): Area | null {
  for (const [pattern, area] of RULES) {
    if (pattern.test(path)) return area;
  }
  return null;
}

/** Distinct areas in AREAS declaration order, so badges read the same everywhere. */
export function areasOfFiles(paths: readonly string[]): Area[] {
  const found = new Set<Area>();
  for (const path of paths) {
    const area = areaOfPath(path);
    if (area) found.add(area);
  }
  return AREAS.filter((area) => found.has(area));
}
