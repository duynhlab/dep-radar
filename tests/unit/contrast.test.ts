import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { THEME_COLORS } from "@/features/theme/theme-script";

/**
 * WCAG contrast computed from the oklch tokens in app.css. axe cannot resolve
 * oklch() — it reports 1.00 for every pair — so this is the only automated
 * check that a palette edit cannot push 12px metadata under the AA floor.
 */

const css = readFileSync(path.join(process.cwd(), "src", "styles", "app.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

type Oklch = [number, number, number, number];

function parseTheme(selector: RegExp): Record<string, Oklch> {
  const block = css.match(selector)?.[1];
  if (!block) throw new Error(`theme block not found: ${selector}`);
  const tokens: Record<string, Oklch> = {};
  for (const m of block.matchAll(/--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+)%)?\)/g)) {
    tokens[m[1]!] = [Number(m[2]), Number(m[3]), Number(m[4]), m[5] ? Number(m[5]) / 100 : 1];
  }
  return tokens;
}

const LIGHT = parseTheme(/\n:root\s*\{([\s\S]*?)\n\}/);
const DARK = parseTheme(/\n\.dark\s*\{([\s\S]*?)\n\}/);

function oklchToLinearSrgb([L, C, h]: Oklch): [number, number, number] {
  const hr = (h * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb: [number, number, number] = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return rgb.map((v) => Math.min(1, Math.max(0, v))) as [number, number, number];
}

/** Composite `fg` at `alpha` over `bg` in linear light, then take luminance. */
function luminance(fg: Oklch, over?: Oklch, alpha = 1): number {
  const f = oklchToLinearSrgb(fg);
  const b: [number, number, number] = over ? oklchToLinearSrgb(over) : [0, 0, 0];
  const r = f[0] * alpha + b[0] * (1 - alpha);
  const g = f[1] * alpha + b[1] * (1 - alpha);
  const bl = f[2] * alpha + b[2] * (1 - alpha);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

function ratio(theme: Record<string, Oklch>, fg: string, bg: string, tint?: { of: string; alpha: number }): number {
  const f = theme[fg];
  const b = theme[bg];
  if (!f || !b) throw new Error(`missing token: ${!f ? fg : bg}`);
  const bgLum = tint ? luminance(theme[tint.of]!, b, tint.alpha) : luminance(b);
  const [hi, lo] = [luminance(f), bgLum].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

function toHex(oklch: Oklch): string {
  const gamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
  return "#" + oklchToLinearSrgb(oklch).map((v) => Math.round(gamma(v) * 255).toString(16).padStart(2, "0")).join("");
}

describe.each([
  ["light", LIGHT],
  ["dark", DARK],
] as const)("%s theme contrast", (name, theme) => {
  it("keeps body foreground at AAA on page and card", () => {
    expect(ratio(theme, "foreground", "background")).toBeGreaterThanOrEqual(7);
    expect(ratio(theme, "foreground", "card")).toBeGreaterThanOrEqual(7);
  });

  // 4.5:1 is the AA floor for normal-size text (WCAG 1.4.3); every one of
  // these appears at 14px or below somewhere on the inbox.
  it.each([
    ["muted-foreground", "background"],
    ["muted-foreground", "card"],
    ["primary-foreground", "primary"],
    ["secondary-foreground", "secondary"],
    ["sidebar-accent-foreground", "sidebar-accent"],
  ] as const)("%s on %s meets 4.5:1", (fg, bg) => {
    expect(ratio(theme, fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the attention badge readable on its tint", () => {
    const alpha = name === "dark" ? 0.2 : 0.1;
    expect(ratio(theme, "destructive-on-tint", "card", { of: "destructive", alpha })).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the warning text readable on the card", () => {
    expect(ratio(theme, "warning-on-tint", "card")).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps status icons distinguishable from the card (3:1, non-text)", () => {
    expect(ratio(theme, "success", "card")).toBeGreaterThanOrEqual(3);
    expect(ratio(theme, "destructive", "card")).toBeGreaterThanOrEqual(3);
  });
});

describe("theme-color meta mapping", () => {
  it("matches the background tokens it mirrors", () => {
    expect(toHex(LIGHT.background!)).toBe(THEME_COLORS.light);
    expect(toHex(DARK.background!)).toBe(THEME_COLORS.dark);
  });
});
