import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Card with status badges on top, a title, two facts, and a tag row. */
export function StatusCard({
  title,
  subtitle,
  description,
  href,
  statuses = [],
  facts = [],
  tags = [],
  cta,
  muted,
  action,
}: {
  title: string;
  subtitle?: string;
  description?: string;
  href?: string;
  statuses?: { label: string; tone?: BadgeTone }[];
  facts?: { label: string; value: string }[];
  tags?: string[];
  cta?: string;
  muted?: boolean;
  action?: ReactNode;
}) {
  return (
    <article
      className={cn(
        "group relative flex min-w-0 flex-col rounded-[12px] border border-line bg-canvas p-4 sm:p-5",
        href && "card-interactive",
        muted && "opacity-70",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {statuses.map((s) => (
            <Badge key={s.label} tone={s.tone}>
              {s.label}
            </Badge>
          ))}
        </div>
        {action ? <div className="relative z-10">{action}</div> : null}
      </div>

      <h3 className="text-[17px] leading-[1.25] font-medium tracking-[-0.02em]">
        {href ? (
          <Link to={href} className="before:absolute before:inset-0">
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      {subtitle ? <p className="mt-1 min-w-0 text-[13px] text-muted [overflow-wrap:anywhere]">{subtitle}</p> : null}
      {description ? (
        <p className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-muted">{description}</p>
      ) : null}

      {facts.length ? (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
          {facts.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="text-[11px] tracking-[0.06em] text-faint uppercase">{f.label}</dt>
              <dd className="mt-0.5 text-[14px] font-medium tracking-[-0.01em] [overflow-wrap:anywhere]">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {tags.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <span key={t} className="pill h-auto min-h-6 max-w-full py-1 whitespace-normal [overflow-wrap:anywhere]">
              {t}
            </span>
          ))}
        </div>
      ) : null}

      {cta ? (
        <span className="mt-4 inline-flex items-center gap-1 text-[13.5px] font-medium text-ink">
          {cta}
          <ArrowUpRight
            className="size-3.5 transition-transform duration-[230ms] group-hover:translate-x-[5px]"
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </span>
      ) : null}
    </article>
  );
}
