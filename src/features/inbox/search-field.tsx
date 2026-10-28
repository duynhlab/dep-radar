import { Search } from "lucide-react";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { useHotkeyFocus } from "@/lib/use-hotkey-focus";

export function SearchField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useHotkeyFocus(ref, () => onChange(""));

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search dependency or #PR"
        aria-label="Search by dependency name or pull request number"
        className="pl-8 pr-10"
      />
      <kbd
        aria-hidden="true"
        className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-sm border px-1.5 font-mono text-[11px] leading-5 text-muted-foreground sm:inline-block"
      >
        /
      </kbd>
    </div>
  );
}
