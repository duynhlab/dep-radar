import type { PrIndex } from "../domain/types.ts";

export interface PrerenderPage {
  path: string;
  prerender: { enabled: true };
  sitemap: {
    priority: number;
    changefreq: "hourly" | "daily" | "weekly";
    lastmod: string;
  };
}

/**
 * The authoritative prerender list: the inbox plus one page per PR in the
 * index. Derived from the same validated index the routes read, so
 * "prerendered set == 404-free set" holds by construction.
 */
export function buildPrerenderPages(index: PrIndex): PrerenderPage[] {
  const lastmod = index.generatedAt;
  return [
    {
      path: "/",
      prerender: { enabled: true },
      sitemap: { priority: 1, changefreq: "hourly", lastmod },
    },
    ...index.prs.map((pr) => ({
      path: `/prs/${pr.number}`,
      prerender: { enabled: true } as const,
      sitemap: {
        priority: pr.state === "open" ? 0.8 : 0.3,
        changefreq: "daily" as const,
        lastmod: pr.updatedAt,
      },
    })),
  ];
}
