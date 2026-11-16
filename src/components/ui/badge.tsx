import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("pill", {
  variants: {
    tone: {
      neutral: "",
      faint: "text-faint",
      dark: "border-ink bg-ink text-white",
      accent: "border-accent bg-accent text-ink",
      ok: "border-ok/30 bg-ok/5 text-ok",
      warn: "border-warn/40 bg-warn/5 text-warn",
      danger: "border-danger/30 bg-danger/5 text-danger",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
