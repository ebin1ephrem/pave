import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[12px] border border-dashed border-line-strong bg-canvas px-6 py-12 text-center">
      {Icon ? (
        <span className="mx-auto grid size-10 place-items-center rounded-[8px] bg-subtle text-muted">
          <Icon className="size-[18px]" strokeWidth={1.7} aria-hidden="true" />
        </span>
      ) : null}
      <h3 className="mt-4 text-[17px] leading-[1.25] font-medium tracking-[-0.02em]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[46ch] text-[14px] leading-relaxed text-muted">{body}</p>
      {action ? <div className="mt-5 flex justify-center gap-2">{action}</div> : null}
    </div>
  );
}
