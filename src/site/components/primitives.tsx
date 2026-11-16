import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Sets the document title and meta description for a public page. */
export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = title;
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    tag.content = description;
  }, [title, description]);
}

/**
 * Wraps content that depends on an unresolved [CONFIRM] or [TBD] item in src/site/config.ts.
 * Renders normally in production; outlined with the note as a tooltip in development.
 */
export function Pending({ note, children, block = false }: { note: string; children: ReactNode; block?: boolean }) {
  if (!import.meta.env.DEV) return <>{children}</>;
  const Tag = block ? "div" : "span";
  return (
    <Tag
      title={`To confirm: ${note}`}
      data-pending={note}
      className="rounded-[4px] outline-2 outline-offset-2 outline-warn/60 outline-dashed"
    >
      {children}
    </Tag>
  );
}

/** Vertical rhythm for public sections: 64px, 96px from 768px, 128px from 1280px. */
export function Section({
  id,
  className,
  tone = "default",
  children,
}: {
  id?: string;
  className?: string;
  tone?: "default" | "subtle";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-20 py-16 md:py-24 xl:py-32", tone === "subtle" && "bg-subtle", className)}
    >
      <div className="page-shell">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function SectionTitle({
  eyebrow,
  title,
  lede,
  className,
  as: H = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("max-w-[760px]", className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <H className={cn(H === "h1" ? "display-xl" : "display-md", eyebrow && "mt-2.5")}>{title}</H>
      {lede ? <div className="lede mt-5 max-w-[62ch]">{lede}</div> : null}
    </div>
  );
}

/** Page hero for inner pages. */
export function PageHero({
  eyebrow,
  title,
  lede,
  actions,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden border-b border-line">
      <div aria-hidden="true" className="dot-grid absolute inset-x-0 top-0 h-56 [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-60" />
      <div className="page-shell relative pt-14 pb-16 md:pt-20 md:pb-20">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className={cn("display-lg max-w-[18ch]", eyebrow && "mt-3")}>{title}</h1>
        {lede ? <p className="lede mt-5 max-w-[60ch]">{lede}</p> : null}
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        {children}
      </div>
    </header>
  );
}

export function CheckList({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <ul className={cn("grid gap-3", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
          <span aria-hidden="true" className="mt-[9px] h-[3px] w-3 shrink-0 rounded-full bg-ink" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
