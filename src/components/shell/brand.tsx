import { cn } from "@/lib/utils";

/** PAVE mark: a rising path of three steps, for the three bands. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("grid size-7 place-items-center rounded-[6px] bg-ink text-accent", className)}>
      <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true">
        <path d="M2 13h4V9h4V5h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[15px] font-medium tracking-[-0.02em]", className)}>
      <BrandMark />
      PAVE
    </span>
  );
}
