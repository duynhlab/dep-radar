export const SITE_NAME = "dep-radar";

export const SITE_DESCRIPTION =
  "Inbox for the homelab Renovate pull requests: AI-read release notes, impact buckets and verification checklists";

/**
 * Public origin, used for canonical URLs, Open Graph and the sitemap.
 * Not recorded anywhere else in the repo (wrangler.jsonc has no routes block),
 * so it lives here as the single place to change it.
 */
export const SITE_URL = (
  import.meta.env?.VITE_SITE_URL ?? "https://deps.duynh.me"
).replace(/\/$/, "");

export function pageTitle(segment?: string): string {
  return segment ? `${segment} · ${SITE_NAME}` : SITE_NAME;
}

export function absoluteUrl(pathname: string): string {
  return new URL(pathname, `${SITE_URL}/`).href;
}
