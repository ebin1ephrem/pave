import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const SIZE = { xl: "display-xl", lg: "display-lg", md: "display-md" } as const;

/** Uppercase eyebrow label above a display headline, with an optional lede. */
export function SectionHeader({
  eyebrow,
  title,
  lede,
  size = "md",
  as: Heading = "h2",
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  size?: keyof typeof SIZE;
  as?: "h1" | "h2" | "h3";
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <Heading className={cn(SIZE[size], "mt-2.5")}>{title}</Heading>
        {lede ? <p className="lede mt-4 max-w-[60ch]">{lede}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
