import { cn } from "@/lib/utils";

/**
 * The one segmented-control treatment, copied from the backoffice's
 * StatusChips: URL-state driven, "all" resets, no pill per label.
 */
export function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
  format = (v) => v,
}: {
  label: string;
  options: readonly T[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
  format?: (v: T) => string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {[undefined, ...options].map((option) => (
        <button
          key={option ?? "all"}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={cn(
            "shrink-0 rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors",
            value === option ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option === undefined ? "All" : format(option)}
        </button>
      ))}
    </div>
  );
}
