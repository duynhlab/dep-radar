import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function NotFound({ kind = "page" }: { kind?: "page" | "pr" }) {
  const body =
    kind === "pr"
      ? "No Renovate pull request with that number is in the inbox. Merged and closed PRs leave after 30 days."
      : "The page you are looking for is not here.";
  return (
    <div className="flex flex-col items-center gap-2 py-24 text-center">
      <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-prose text-sm text-muted-foreground">{body}</p>
      <Button variant="outline" size="sm" className="mt-4" render={<Link to="/" />}>
        Back to the inbox
      </Button>
    </div>
  );
}
