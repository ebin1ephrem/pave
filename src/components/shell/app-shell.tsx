import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ROLE_HOME, ROLE_LABEL, useSession } from "@/auth/session";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { NAV } from "./nav";
import { ProgramSwitcher } from "./program-switcher";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useSession();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  const home = ROLE_HOME[user.role];
  const isActive = (href: string) => (href === home ? pathname === home : pathname.startsWith(href));

  return (
    <div className="min-h-dvh bg-subtle lg:grid lg:grid-cols-[248px_1fr]">
      <header className="flex items-center justify-between border-b border-line bg-canvas px-5 py-3 lg:hidden">
        <Link to={home}>
          <Brand />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="app-sidebar"
          aria-label={open ? "Close menu" : "Open menu"}
          className="grid size-9 place-items-center rounded-[6px] border border-line"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </header>

      <aside
        id="app-sidebar"
        className={cn(
          "flex-col border-r border-line bg-canvas lg:sticky lg:top-0 lg:flex lg:h-dvh lg:overflow-y-auto",
          open ? "flex" : "hidden",
        )}
      >
        <div className="hidden px-5 py-5 lg:block">
          <Link to={home}>
            <Brand />
          </Link>
          <p className="mt-1 pl-9 text-[11px] tracking-[0.09em] text-faint uppercase">{ROLE_LABEL[user.role]}</p>
        </div>

        <nav aria-label="Main" className="grid gap-6 px-3 pt-3 pb-6 lg:pt-0">
          {NAV[user.role].map((section) => (
            <div key={section.title}>
              <p className="mb-1.5 px-2 text-[11px] font-semibold tracking-[0.09em] text-faint uppercase">
                {section.title}
              </p>
              <ul className="grid gap-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-[6px] px-2 py-2 text-[13.5px] transition-colors duration-200",
                          active ? "bg-subtle font-medium text-ink" : "text-muted hover:bg-subtle hover:text-ink",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-[5px]",
                            active ? "bg-accent text-ink" : "text-faint",
                          )}
                        >
                          <item.icon className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                        </span>
                        <span className="flex-1 truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-line px-5 py-4">
          <p className="truncate text-[13px] font-medium">{user.name}</p>
          <p className="truncate text-[12px] text-muted">{user.email}</p>
          <button
            type="button"
            onClick={signOut}
            className="mt-2.5 cursor-pointer text-[12.5px] text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex items-center justify-between gap-4 border-b border-line bg-canvas px-5 py-3 lg:px-9">
          <ProgramSwitcher />
          <span className="pill hidden sm:inline-flex">{ROLE_LABEL[user.role]}</span>
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-line bg-canvas">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-6 lg:px-9 lg:py-8">
        <div className="min-w-0">
          {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
          <h1 className="text-[26px] leading-[1.12] font-medium tracking-[-0.032em]">{title}</h1>
          {description ? <p className="mt-1.5 max-w-[70ch] text-[14px] text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-5 py-6 lg:px-9 lg:py-8", className)}>{children}</div>;
}
