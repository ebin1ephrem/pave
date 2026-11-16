import { cn } from "@/lib/utils";

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  disabled?: boolean;
}

/** A row of toggle chips. Single-select by default; pass `multiple` for multi-select. */
export function FilterChips<T extends string>({
  label,
  options,
  selected,
  onChange,
  multiple = false,
}: {
  label: string;
  options: ChipOption<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
  multiple?: boolean;
}) {
  const toggle = (value: T) => {
    const on = selected.includes(value);
    if (multiple) onChange(on ? selected.filter((v) => v !== value) : [...selected, value]);
    else onChange(on ? [] : [value]);
  };

  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            disabled={o.disabled}
            onClick={() => toggle(o.value)}
            className={cn(
              "pill h-8 cursor-pointer px-3 text-[12.5px] transition-colors duration-[180ms] disabled:cursor-not-allowed disabled:opacity-50",
              on ? "border-ink bg-ink text-white" : "hover:border-ink hover:text-ink",
            )}
          >
            {o.label}
            {o.count !== undefined ? (
              <span className={cn("tabular-nums", on ? "text-on-dark-muted" : "text-faint")}>{o.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
