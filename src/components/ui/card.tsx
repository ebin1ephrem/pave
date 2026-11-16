import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[12px] border border-line bg-canvas", className)} {...props} />;
}

export function DarkPanel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("on-dark rounded-[22px] bg-ink text-on-dark", className)} {...props} />;
}
