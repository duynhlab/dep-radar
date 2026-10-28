import { describe, expect, it } from "vitest";
import { areaOfPath, areasOfFiles } from "@/domain/areas";

describe("areaOfPath", () => {
  it.each([
    ["kubernetes/infra/configs/observability/grafana/grafana.yaml", "monitoring"],
    ["kubernetes/infra/configs/observability/metrics/vmagent.yaml", "monitoring"],
    ["kubernetes/infra/configs/observability/tracing/victoria-traces.yaml", "observability"],
    ["kubernetes/infra/configs/databases/cnpg/cluster.yaml", "databases"],
    ["kubernetes/infra/configs/secrets/openbao.yaml", "secrets"],
    ["kubernetes/infra/configs/kyverno/policies/x.yaml", "security"],
    ["kubernetes/infra/configs/envoy-gateway/gateway.yaml", "gateway"],
    ["kubernetes/infra/configs/temporal/server.yaml", "platform"],
    ["kubernetes/infra/controllers/vector.yaml", "platform"],
    ["kubernetes/clusters/local/apps.yaml", "gitops"],
    ["kubernetes/apps/services/order.yaml", "apps"],
    ["local-stack/compose.yaml", "local-stack"],
    ["terraform/.terraform.lock.hcl", "terraform"],
    [".github/workflows/ci.yml", "ci"],
    [".renovaterc.json5", "ci"],
    ["scripts/kind-up.sh", "scripts"],
    ["docs/platform/cicd.md", "docs"],
    ["README.md", null],
  ])("%s → %s", (path, area) => {
    expect(areaOfPath(path)).toBe(area);
  });
});

describe("areasOfFiles", () => {
  it("dedupes and keeps declaration order", () => {
    expect(
      areasOfFiles(["local-stack/compose.yaml", "kubernetes/infra/configs/observability/grafana/a.yaml", "local-stack/x"]),
    ).toEqual(["monitoring", "local-stack"]);
  });
  it("is empty for unknown paths", () => {
    expect(areasOfFiles(["CHANGELOG.md"])).toEqual([]);
  });
});
