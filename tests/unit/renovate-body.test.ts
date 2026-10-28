import { describe, expect, it } from "vitest";
import { dependencySlug, extractReleaseNotes, isTruncated, parseDependency } from "@/domain/renovate-body";

const THREE_COLUMNS = `This PR contains the following updates:

| Package | Update | Change |
|---|---|---|
| [grafana/grafana](https://redirect.github.com/grafana/grafana) | minor | \`13.2.3\` → \`13.3.0\` |

---

### Release Notes

<details>
<summary>grafana/grafana</summary>

### [\`v13.3.0\`](https://redirect.github.com/grafana/grafana/blob/HEAD/CHANGELOG.md#1330)

##### Security

- Fix CVE-2026-1

</details>

---

### Configuration

📅 **Schedule**: at any time
`;

const FOUR_COLUMNS = `This PR contains the following updates:

| Package | Type | Update | Change |
|---|---|---|---|
| [kyverno](https://kyverno.io/) ([source](https://redirect.github.com/kyverno/kyverno)) | HelmChart | patch | \`3.9.1\` → \`3.9.2\` |

---

### Configuration
`;

const DIGEST = `| Package | Update | Change |
|---|---|---|
| postgres | digest | \`6f09d3b\` → \`979bccf\` |
`;

describe("parseDependency", () => {
  it("reads the three-column table and the first link", () => {
    expect(parseDependency(THREE_COLUMNS)).toEqual({
      name: "grafana/grafana",
      updateType: "minor",
      from: "13.2.3",
      to: "13.3.0",
      sourceUrl: "https://github.com/grafana/grafana",
    });
  });

  it("reads the four-column table and drops the (source) suffix", () => {
    expect(parseDependency(FOUR_COLUMNS)).toEqual({
      name: "kyverno",
      updateType: "patch",
      from: "3.9.1",
      to: "3.9.2",
      sourceUrl: "https://kyverno.io/",
    });
  });

  it("handles a digest bump with no link", () => {
    expect(parseDependency(DIGEST)).toEqual({
      name: "postgres",
      updateType: "digest",
      from: "6f09d3b",
      to: "979bccf",
      sourceUrl: null,
    });
  });

  it("returns null without a table", () => {
    expect(parseDependency("no table here")).toBeNull();
  });
});

describe("extractReleaseNotes", () => {
  it("takes the section, strips details wrappers, keeps the version heading", () => {
    const notes = extractReleaseNotes(THREE_COLUMNS);
    expect(notes).toContain("### grafana/grafana");
    expect(notes).toContain("v13.3.0");
    expect(notes).toContain("Fix CVE-2026-1");
    expect(notes).not.toContain("<details>");
    expect(notes).not.toContain("### Configuration");
  });

  it("is null when Renovate attached none", () => {
    expect(extractReleaseNotes(FOUR_COLUMNS)).toBeNull();
  });
});

describe("isTruncated", () => {
  it("needs both the callout and the word", () => {
    expect(isTruncated("> [!NOTE]\n> This PR body has been truncated.")).toBe(true);
    expect(isTruncated("the notes were truncated upstream")).toBe(false);
    expect(isTruncated(THREE_COLUMNS)).toBe(false);
  });
});

describe("dependencySlug", () => {
  it("prefers the branch and slugifies the fallback", () => {
    expect(dependencySlug("renovate/grafana-monorepo", "grafana/grafana")).toBe("grafana-monorepo");
    expect(dependencySlug("feature/x", "ghcr.io/pgdogdev/pgdog")).toBe("ghcr-io-pgdogdev-pgdog");
  });
});
