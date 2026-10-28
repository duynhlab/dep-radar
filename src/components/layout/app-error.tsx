import { type ErrorComponentProps, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function AppError({ error }: ErrorComponentProps) {
  const router = useRouter();
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "An unexpected error occurred.";
  return (
    <div role="alert" className="flex flex-col items-center gap-2 py-24 text-center">
      <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="max-w-prose text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={() => void router.invalidate()}>
        Try again
      </Button>
    </div>
  );
}
