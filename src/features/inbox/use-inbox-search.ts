import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import type { InboxSearch } from "./search-params";

/**
 * One place that writes the URL. Defaults are stripped by the route's
 * middleware, so `/` stays canonical when nothing is filtered.
 */
export function useSetInboxSearch() {
  const navigate = useNavigate({ from: "/" });
  const update = useCallback(
    (patch: Partial<InboxSearch>, opts?: { replace?: boolean }) =>
      void navigate({
        to: "/",
        search: (prev) => ({ ...prev, ...patch }),
        replace: opts?.replace ?? false,
        resetScroll: false,
      }),
    [navigate],
  );
  const clear = useCallback(() => void navigate({ to: "/", search: {}, resetScroll: false }), [navigate]);
  return { update, clear };
}
