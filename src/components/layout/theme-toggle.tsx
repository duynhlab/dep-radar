import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/features/theme/use-theme";
import { useHydrated } from "@/lib/use-hydrated";

/**
 * The resolved theme is only knowable client-side, so the server renders a
 * neutral icon with a stable accessible name and swaps after hydration —
 * otherwise the markup would mismatch.
 */
export function ThemeToggle() {
  const hydrated = useHydrated();
  const { preference, resolved, cycle } = useTheme();

  const Icon = !hydrated || preference === "system" ? Monitor : preference === "light" ? Sun : Moon;
  const label = hydrated
    ? `Theme: ${preference}${preference === "system" ? ` (${resolved})` : ""}. Change theme.`
    : "Theme";

  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={label} onClick={cycle} />}>
        <Icon className="size-4" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
