import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFound({ kind = "page" }: { kind?: "page" | "pr" }) {
  const body =
    kind === "pr"
      ? "No Renovate pull request with that number is in the inbox. Merged and closed PRs leave after 30 days."
      : "The page you are looking for is not here.";

  return (
    <div className="py-24 text-center">
      <h1 className="text-page-title font-semibold tracking-tight text-fg">
        Page not found
      </h1>
      <p className="mt-2 text-body text-fg-muted">{body}</p>
      <Button variant="solid" size="md" asChild className="mt-6">
        <Link to="/">Back to the inbox</Link>
      </Button>
    </div>
  );
}
