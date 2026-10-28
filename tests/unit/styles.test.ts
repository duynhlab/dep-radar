import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Pins the design contract: the backoffice token set (admin-service
 * product-design skill), one theme block per mode with identical keys, no
 * hardcoded colours, and Base UI's `render` prop rather than Radix `asChild`.
 */

const CSS = readFileSync(path.join(process.cwd(), "src", "styles", "app.css"), "utf8");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.tsx?$/.test(p) ? [p] : [];
  });
}

const SOURCES = sourceFiles(path.join(process.cwd(), "src")).filter(
  (p) => !p.includes("generated") && !p.endsWith("routeTree.gen.ts"),
);

function withoutComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function tokensIn(selector: RegExp): Set<string> {
  const block = withoutComments(CSS).match(selector)?.[1];
  if (!block) throw new Error(`theme block not found: ${selector}`);
  return new Set([...block.matchAll(/^\s*(--[\w-]+):/gm)].map((m) => m[1]!));
}

describe("theme tokens", () => {
  it("defines every light token in dark too, and vice versa", () => {
    const light = tokensIn(/\n:root\s*\{([\s\S]*?)\n\}/);
    const dark = tokensIn(/\n\.dark\s*\{([\s\S]*?)\n\}/);
    // --radius is a shape token, set once.
    light.delete("--radius");
    expect([...light].filter((v) => !dark.has(v))).toEqual([]);
    expect([...dark].filter((v) => !light.has(v))).toEqual([]);
  });

  it("maps every theme token into @theme as a Tailwind colour", () => {
    const theme = withoutComments(CSS).match(/@theme inline\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
    for (const token of [
      "background",
      "foreground",
      "card",
      "muted",
      "muted-foreground",
      "primary",
      "destructive",
      "destructive-on-tint",
      "warning-on-tint",
      "success",
      "border",
      "ring",
      "sidebar-accent",
    ]) {
      expect(theme, token).toContain(`--color-${token}: var(--${token})`);
    }
  });

  it("points the fonts at the self-hosted Geist faces", () => {
    expect(CSS).toMatch(/--font-sans:\s*"Geist Variable"/);
    expect(CSS).toMatch(/--font-mono:\s*"Geist Mono Variable"/);
  });

  it("carries no release-radar tokens or type tiers any more", () => {
    expect(CSS).not.toMatch(/--rr-/);
    expect(CSS).not.toMatch(/--text-(micro|meta|control|body|version)/);
  });
});

describe("source conventions", () => {
  const offenders = (pattern: RegExp) =>
    SOURCES.flatMap((file) => {
      const hits = readFileSync(file, "utf8").match(pattern);
      return hits ? [`${path.relative(process.cwd(), file)}: ${hits.join(", ")}`] : [];
    });

  it("never hardcodes black or white outside the generated primitives", () => {
    // components/ui/* is shadcn output kept pristine; its overlay uses bg-black/10.
    const app = offenders(/\b(bg|text|border)-(white|black)\b|#(fff|000)(?![0-9a-f])/gi).filter(
      (hit) => !hit.startsWith("src/components/ui/"),
    );
    expect(app).toEqual([]);
  });

  it("uses Base UI's render prop, never Radix asChild", () => {
    expect(offenders(/\basChild\b/g)).toEqual([]);
  });

  it("uses no release-radar tier classes or tokens", () => {
    expect(offenders(/\btext-(micro|meta|control|body|version|card-title|page-title|detail-title)\b/g)).toEqual([]);
    expect(offenders(/\b(bg|text|border)-(fg|surface|accent-soft)(-[\w-]+)?\b/g)).toEqual([]);
  });

  it("uses no font-weight above 600", () => {
    expect(offenders(/\bfont-(bold|extrabold|black)\b/g)).toEqual([]);
  });
});
